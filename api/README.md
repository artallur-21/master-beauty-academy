# MBA Enquiry API

Lightweight Node + Hono + SQLite service that captures enquiry-form submissions for [themasterbeautyacademy.com](https://themasterbeautyacademy.com).

- **Port:** 3005 (loopback only)
- **DB:** `/var/lib/mba-api/enquiries.sqlite` (WAL, single file, backed up daily)
- **Public surface:** Nginx proxies `/api/*` from the site to this service
- **Admin:** `/api/admin/` (HTTP basic auth)

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`  | `/api/health` | Liveness check |
| `POST` | `/api/enquiry` | Insert an enquiry — returns `{ok, id, whatsappUrl}` |
| `POST` | `/api/enquiry/:id/whatsapp` | Mark that the user clicked the WhatsApp button |
| `GET`  | `/api/admin/` | HTML dashboard (basic auth) |
| `GET`  | `/api/admin/stats` | JSON counts |
| `GET`  | `/api/admin/enquiries?status=&limit=&offset=` | JSON list |
| `PATCH`| `/api/admin/enquiries/:id` | Update status / notes |

## Validation & safety

- Honeypot field `_hp` — bots fill it, humans don't
- Phone regex `^[0-9+\-\s()]{7,20}$`
- Name 2–80 chars
- Rate-limited 10 enquiries/hour per **hashed** IP (salt in env var)
- Salted SHA-256 IP hash — no raw IPs stored
- CORS locked to the production domains
- All input strings truncated to safe lengths before insert
- Admin endpoints behind HTTP basic auth (set `MBA_ADMIN_PASS` to enable)
- Systemd unit hardened: `NoNewPrivileges`, `ProtectSystem=strict`, `PrivateTmp`, restricted write paths

## Local dev

```bash
cd api
npm install
cp .env.example .env
# edit .env
npm run dev
```

## Build & deploy on the VPS

```bash
cd /var/www/masterbeautyacademy.com/api
npm ci --omit=dev
npm run build
sudo cp mba-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mba-api
```

Add to crontab:

```cron
30 3 * * * /var/www/masterbeautyacademy.com/api/backup.sh >> /var/log/mba-backup.log 2>&1
```

## Schema

```sql
CREATE TABLE enquiries (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  name              TEXT    NOT NULL,
  phone             TEXT    NOT NULL,
  city              TEXT,
  message           TEXT,
  source_page       TEXT,
  referer           TEXT,
  user_agent        TEXT,
  ip_hash           TEXT,
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,
  utm_term          TEXT,
  utm_content       TEXT,
  whatsapp_clicked  INTEGER DEFAULT 0,
  status            TEXT    NOT NULL DEFAULT 'new',  -- new | contacted | enrolled | dropped
  notes             TEXT
);
```

## Common queries

```bash
# Quick stats
sqlite3 /var/lib/mba-api/enquiries.sqlite \
  "SELECT status, COUNT(*) FROM enquiries GROUP BY status;"

# Last 10 enquiries
sqlite3 -header -column /var/lib/mba-api/enquiries.sqlite \
  "SELECT id, created_at, name, phone, city FROM enquiries ORDER BY id DESC LIMIT 10;"

# Export to CSV
sqlite3 -header -csv /var/lib/mba-api/enquiries.sqlite \
  "SELECT * FROM enquiries;" > enquiries.csv
```

## Migrating later

If volume outgrows SQLite, the cleanest path is `mysql_import` or a one-shot Python script:

```sql
-- Same schema works on MySQL with minimal tweaks:
--   AUTOINCREMENT       -> AUTO_INCREMENT
--   TEXT NOT NULL DEFAULT (datetime('now')) -> DATETIME DEFAULT CURRENT_TIMESTAMP
```
