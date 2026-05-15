import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';
import { basicAuth } from 'hono/basic-auth';
import { createHash } from 'node:crypto';
import { db, insertEnquiry, listEnquiries, markWhatsappClicked, stats, updateEnquiryStatus } from './db.js';

const PORT = Number(process.env.MBA_API_PORT ?? 3005);
const HOST = process.env.MBA_API_HOST ?? '127.0.0.1';
const ADMIN_USER = process.env.MBA_ADMIN_USER ?? 'admin';
const ADMIN_PASS = process.env.MBA_ADMIN_PASS ?? '';
const IP_SALT = process.env.MBA_IP_SALT ?? 'change-me';
const ALLOWED_ORIGINS = (process.env.MBA_ORIGINS ?? 'https://themasterbeautyacademy.com,https://www.themasterbeautyacademy.com').split(',');
const WA_NUMBER = process.env.MBA_WA_NUMBER ?? '918904105156';

if (!ADMIN_PASS) {
  console.warn('[mba-api] WARNING: MBA_ADMIN_PASS not set — admin endpoint is disabled');
}

const app = new Hono();

app.use(logger());
app.use(secureHeaders());
app.use(
  '/api/*',
  cors({
    origin: (origin) => (origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]),
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    credentials: false,
    maxAge: 86400,
  }),
);

// In-memory rate limiter — 10 enquiries/hour per IP hash
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ipHash: string) {
  const now = Date.now();
  const rec = hits.get(ipHash);
  if (!rec || rec.resetAt < now) {
    hits.set(ipHash, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  if (rec.count > RATE_LIMIT) return true;
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
}, WINDOW_MS).unref();

function hashIp(req: Request) {
  const xff = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  return createHash('sha256').update(IP_SALT + xff).digest('hex').slice(0, 24);
}

app.get('/api/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));

app.post('/api/enquiry', async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Honeypot — bots fill this hidden field; humans don't
  if (typeof body._hp === 'string' && body._hp.length > 0) {
    return c.json({ ok: true, id: 0 }); // silently accept then ignore
  }

  const name = String(body.name ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const city = body.city ? String(body.city).trim().slice(0, 64) : null;
  const message = body.message ? String(body.message).trim().slice(0, 2000) : null;

  if (name.length < 2 || name.length > 80) return c.json({ ok: false, error: 'invalid_name' }, 400);
  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) return c.json({ ok: false, error: 'invalid_phone' }, 400);

  const ipHash = hashIp(c.req.raw);
  if (rateLimited(ipHash)) return c.json({ ok: false, error: 'rate_limited' }, 429);

  const id = insertEnquiry({
    name: name.slice(0, 80),
    phone: phone.slice(0, 20),
    city,
    message,
    source_page: typeof body.source_page === 'string' ? body.source_page.slice(0, 256) : null,
    referer: c.req.header('referer')?.slice(0, 256) ?? null,
    user_agent: c.req.header('user-agent')?.slice(0, 256) ?? null,
    ip_hash: ipHash,
    utm_source: typeof body.utm_source === 'string' ? body.utm_source.slice(0, 64) : null,
    utm_medium: typeof body.utm_medium === 'string' ? body.utm_medium.slice(0, 64) : null,
    utm_campaign: typeof body.utm_campaign === 'string' ? body.utm_campaign.slice(0, 64) : null,
    utm_term: typeof body.utm_term === 'string' ? body.utm_term.slice(0, 64) : null,
    utm_content: typeof body.utm_content === 'string' ? body.utm_content.slice(0, 64) : null,
  });

  const text = `New Enquiry #${id}\n\nName: ${name}\nPhone: ${phone}\nCity: ${city ?? '-'}\nMessage: ${message ?? '-'}`;
  const whatsappUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  return c.json({ ok: true, id, whatsappUrl });
});

app.post('/api/enquiry/:id/whatsapp', (c) => {
  const id = Number(c.req.param('id'));
  if (Number.isInteger(id) && id > 0) markWhatsappClicked(id);
  return c.json({ ok: true });
});

// ---- Admin (basic auth) ----
const admin = new Hono();
if (ADMIN_PASS) {
  admin.use('*', basicAuth({ username: ADMIN_USER, password: ADMIN_PASS }));
}

admin.get('/stats', (c) => c.json(stats()));

admin.get('/enquiries', (c) => {
  const status = c.req.query('status') || null;
  const limit = Math.min(500, Number(c.req.query('limit') ?? 100));
  const offset = Math.max(0, Number(c.req.query('offset') ?? 0));
  return c.json(listEnquiries({ status, limit, offset }));
});

admin.patch('/enquiries/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json().catch(() => ({}));
  const status = typeof body.status === 'string' ? body.status : null;
  const notes = typeof body.notes === 'string' ? body.notes : null;
  if (!status || !['new', 'contacted', 'enrolled', 'dropped'].includes(status))
    return c.json({ ok: false, error: 'invalid_status' }, 400);
  updateEnquiryStatus(id, status, notes);
  return c.json({ ok: true });
});

admin.get('/', (c) => {
  const s = stats();
  const { rows } = listEnquiries({ limit: 100 });
  const escape = (v: unknown) =>
    String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]!));
  const statusBadge = (st: string) => {
    const colors: Record<string, string> = {
      new: '#9e1f53', contacted: '#b9974a', enrolled: '#1c7a3a', dropped: '#888',
    };
    return `<span style="background:${colors[st] ?? '#888'};color:white;padding:2px 8px;border-radius:99px;font-size:11px;letter-spacing:.04em">${escape(st.toUpperCase())}</span>`;
  };
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>MBA · Enquiries</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}body{font:14px/1.5 system-ui,-apple-system,sans-serif;margin:0;background:#faf6f0;color:#14101a}
    header{background:#3d0d20;color:#fff;padding:18px 24px;display:flex;align-items:center;justify-content:space-between}
    header h1{margin:0;font:500 18px/1 'Fraunces',Georgia,serif}
    main{padding:24px;max-width:1400px;margin:0 auto}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px}
    .stat{background:white;border:1px solid #e3dfe6;border-radius:12px;padding:14px 16px}
    .stat .v{font:500 24px/1 'Fraunces',Georgia,serif;color:#3d0d20}
    .stat .l{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#7e7689;margin-top:4px}
    table{width:100%;background:white;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #e3dfe6}
    th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #f0ecf3;vertical-align:top}
    th{background:#f4f1f6;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#5a5466}
    tr:last-child td{border-bottom:0}
    .phone a{color:#7a1641;text-decoration:none;font-variant-numeric:tabular-nums}
    .msg{max-width:280px;color:#5a5466}
    .when{color:#7e7689;font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap}
    .src{color:#7e7689;font-size:11px;font-family:ui-monospace,monospace}
  </style></head><body>
    <header><h1>Master Makeup Studio &amp; Academy — Enquiries</h1><span style="font-size:12px;opacity:.7">${new Date().toLocaleString('en-IN')}</span></header>
    <main>
      <div class="stats">
        <div class="stat"><div class="v">${s.total}</div><div class="l">Total</div></div>
        <div class="stat"><div class="v">${s.new_count}</div><div class="l">New</div></div>
        <div class="stat"><div class="v">${s.contacted_count}</div><div class="l">Contacted</div></div>
        <div class="stat"><div class="v">${s.enrolled_count}</div><div class="l">Enrolled</div></div>
        <div class="stat"><div class="v">${s.dropped_count}</div><div class="l">Dropped</div></div>
        <div class="stat"><div class="v">${s.last_7d}</div><div class="l">Last 7 days</div></div>
        <div class="stat"><div class="v">${s.last_30d}</div><div class="l">Last 30 days</div></div>
      </div>
      <table><thead><tr><th>ID</th><th>When</th><th>Name</th><th>Phone</th><th>City</th><th>Message</th><th>Source</th><th>UTM</th><th>WA</th><th>Status</th></tr></thead>
      <tbody>
        ${(rows as any[]).map((r) => `
          <tr>
            <td>#${r.id}</td>
            <td class="when">${escape(new Date(r.created_at + 'Z').toLocaleString('en-IN'))}</td>
            <td><strong>${escape(r.name)}</strong></td>
            <td class="phone"><a href="tel:${escape(r.phone)}">${escape(r.phone)}</a><br><a href="https://wa.me/${escape(r.phone.replace(/[^0-9]/g, ''))}" target="_blank">WhatsApp</a></td>
            <td>${escape(r.city ?? '')}</td>
            <td class="msg">${escape(r.message ?? '')}</td>
            <td class="src">${escape(r.source_page ?? '')}</td>
            <td class="src">${escape([r.utm_source, r.utm_medium, r.utm_campaign].filter(Boolean).join(' · '))}</td>
            <td>${r.whatsapp_clicked ? '✓' : ''}</td>
            <td>${statusBadge(r.status)}</td>
          </tr>`).join('')}
      </tbody></table>
      ${rows.length === 0 ? '<p style="text-align:center;color:#7e7689;padding:48px">No enquiries yet.</p>' : ''}
    </main>
  </body></html>`;
  return c.html(html);
});

app.route('/api/admin', admin);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[mba-api] SIGTERM, closing DB');
  db.close();
  process.exit(0);
});

console.log(`[mba-api] listening on http://${HOST}:${PORT}`);
console.log(`[mba-api] DB: ${process.env.MBA_DB_PATH ?? './data/enquiries.sqlite'}`);
serve({ fetch: app.fetch, port: PORT, hostname: HOST });
