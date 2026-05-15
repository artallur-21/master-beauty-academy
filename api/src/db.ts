import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.MBA_DB_PATH ?? './data/enquiries.sqlite';

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS enquiries (
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
    status            TEXT    NOT NULL DEFAULT 'new',
    notes             TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at);
  CREATE INDEX IF NOT EXISTS idx_enquiries_status  ON enquiries(status);
  CREATE INDEX IF NOT EXISTS idx_enquiries_phone   ON enquiries(phone);
`);

export interface EnquiryInsert {
  name: string;
  phone: string;
  city?: string | null;
  message?: string | null;
  source_page?: string | null;
  referer?: string | null;
  user_agent?: string | null;
  ip_hash?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
}

const insertStmt = db.prepare(`
  INSERT INTO enquiries (
    name, phone, city, message, source_page, referer, user_agent, ip_hash,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content
  ) VALUES (
    @name, @phone, @city, @message, @source_page, @referer, @user_agent, @ip_hash,
    @utm_source, @utm_medium, @utm_campaign, @utm_term, @utm_content
  )
`);

export function insertEnquiry(e: EnquiryInsert): number {
  const result = insertStmt.run({
    name: e.name,
    phone: e.phone,
    city: e.city ?? null,
    message: e.message ?? null,
    source_page: e.source_page ?? null,
    referer: e.referer ?? null,
    user_agent: e.user_agent ?? null,
    ip_hash: e.ip_hash ?? null,
    utm_source: e.utm_source ?? null,
    utm_medium: e.utm_medium ?? null,
    utm_campaign: e.utm_campaign ?? null,
    utm_term: e.utm_term ?? null,
    utm_content: e.utm_content ?? null,
  });
  return Number(result.lastInsertRowid);
}

const markWhatsappStmt = db.prepare(`UPDATE enquiries SET whatsapp_clicked = 1 WHERE id = ?`);
export const markWhatsappClicked = (id: number) => markWhatsappStmt.run(id);

const listStmt = db.prepare(`
  SELECT id, created_at, name, phone, city, message, source_page,
         utm_source, utm_medium, utm_campaign, whatsapp_clicked, status, notes
  FROM enquiries
  WHERE (@status IS NULL OR status = @status)
  ORDER BY created_at DESC
  LIMIT @limit OFFSET @offset
`);

const countStmt = db.prepare(`
  SELECT COUNT(*) AS n FROM enquiries WHERE (@status IS NULL OR status = @status)
`);

export function listEnquiries(opts: { status?: string | null; limit?: number; offset?: number }) {
  const params = {
    status: opts.status ?? null,
    limit: opts.limit ?? 100,
    offset: opts.offset ?? 0,
  };
  const total = (countStmt.get(params) as { n: number }).n;
  const rows = listStmt.all(params);
  return { total, rows };
}

const updateStatusStmt = db.prepare(`
  UPDATE enquiries SET status = ?, notes = COALESCE(?, notes) WHERE id = ?
`);
export const updateEnquiryStatus = (id: number, status: string, notes?: string | null) =>
  updateStatusStmt.run(status, notes ?? null, id);

const statsStmt = db.prepare(`
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) AS new_count,
    SUM(CASE WHEN status='contacted' THEN 1 ELSE 0 END) AS contacted_count,
    SUM(CASE WHEN status='enrolled' THEN 1 ELSE 0 END) AS enrolled_count,
    SUM(CASE WHEN status='dropped' THEN 1 ELSE 0 END) AS dropped_count,
    SUM(CASE WHEN created_at >= datetime('now','-7 day') THEN 1 ELSE 0 END) AS last_7d,
    SUM(CASE WHEN created_at >= datetime('now','-30 day') THEN 1 ELSE 0 END) AS last_30d
  FROM enquiries
`);
export const stats = () => statsStmt.get() as {
  total: number;
  new_count: number;
  contacted_count: number;
  enrolled_count: number;
  dropped_count: number;
  last_7d: number;
  last_30d: number;
};
