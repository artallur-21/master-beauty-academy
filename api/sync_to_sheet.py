#!/usr/bin/env python3
"""
Sync enquiries from SQLite to the Google Sheet (v2 schema).

- Full overwrite of the Leads tab data range (idempotent).
- Updates "Last synced" stamp on the Setup tab.

Env:
  MBA_DB_PATH        SQLite DB
  MBA_GOOGLE_CREDS   OAuth creds JSON (token + refresh_token + client)
  MBA_SHEET_ID       target spreadsheet id
  MBA_SHEET_TAB      data tab name (default: Leads)
"""
import json, os, sqlite3, sys
from datetime import datetime, timezone, timedelta
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

DB_PATH    = os.environ.get("MBA_DB_PATH", "/var/lib/mba-api/enquiries.sqlite")
CREDS_PATH = os.environ.get("MBA_GOOGLE_CREDS", "/etc/mba-sync/oauth-creds.json")
SHEET_ID   = os.environ.get("MBA_SHEET_ID", "")
TAB        = os.environ.get("MBA_SHEET_TAB", "Leads")
SCOPES     = ["https://www.googleapis.com/auth/spreadsheets"]

# Must match LEAD_HEADERS in create_sheet_v2.py — 18 columns
NUM_COLS = 18

def load_creds() -> Credentials:
    with open(CREDS_PATH) as f:
        d = json.load(f)
    c = Credentials(
        token=d.get("token"), refresh_token=d.get("refresh_token"),
        token_uri=d.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=d["client_id"], client_secret=d["client_secret"], scopes=SCOPES,
    )
    if not c.valid: c.refresh(Request())
    return c

def fetch_rows(db_path: str):
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    cur = con.execute("""
        SELECT id, created_at, name, phone, city, message, source_page, referer,
               utm_source, utm_medium, utm_campaign, utm_term, utm_content,
               whatsapp_clicked, status, notes
        FROM enquiries ORDER BY id ASC
    """)
    rows = []
    for r in cur:
        utc = r["created_at"] or ""
        # Convert sqlite naive UTC → IST (+05:30) for display
        ist_str = ""
        if utc:
            try:
                dt = datetime.fromisoformat(utc.replace(" ", "T")).replace(tzinfo=timezone.utc)
                ist_str = (dt + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d %H:%M IST")
            except Exception:
                ist_str = utc

        phone = r["phone"] or ""
        phone_digits = "".join(ch for ch in phone if ch.isdigit())
        tel_link = f'=HYPERLINK("tel:{phone}","{phone}")' if phone else ""
        wa_link = f'=HYPERLINK("https://wa.me/{phone_digits}","Open chat")' if phone_digits else ""

        rows.append([
            r["id"],                                # A · ID
            utc,                                    # B · Created (UTC) — used for date math
            ist_str,                                # C · Created (IST) — human friendly
            r["name"] or "",                        # D
            tel_link,                               # E
            wa_link,                                # F
            r["city"] or "",                        # G
            r["message"] or "",                     # H
            r["source_page"] or "",                 # I
            r["referer"] or "",                     # J
            r["utm_source"] or "",                  # K
            r["utm_medium"] or "",                  # L
            r["utm_campaign"] or "",                # M
            r["utm_term"] or "",                    # N
            r["utm_content"] or "",                 # O
            "✓" if r["whatsapp_clicked"] else "",  # P
            r["status"] or "",                      # Q
            r["notes"] or "",                       # R
        ])
    con.close()
    return rows


def main() -> int:
    if not SHEET_ID:
        print("error: MBA_SHEET_ID not set", file=sys.stderr); return 2

    creds = load_creds()
    svc = build("sheets", "v4", credentials=creds, cache_discovery=False)

    rows = fetch_rows(DB_PATH)
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    last_col = chr(ord("A") + NUM_COLS - 1)  # = 'R'
    data_range = f"{TAB}!A2:{last_col}{max(2, len(rows) + 1)}"

    try:
        # Clear old data first to avoid stale rows after deletions
        svc.spreadsheets().values().clear(
            spreadsheetId=SHEET_ID,
            range=f"{TAB}!A2:{last_col}100000",
        ).execute()

        body = {
            "valueInputOption": "USER_ENTERED",
            "data": [
                {"range": "Setup!B2", "values": [[now_utc]]},
            ],
        }
        if rows:
            body["data"].append({"range": data_range, "values": rows})
        svc.spreadsheets().values().batchUpdate(spreadsheetId=SHEET_ID, body=body).execute()
    except HttpError as e:
        print(f"error: {e}", file=sys.stderr); return 1

    print(f"[mba-sync] wrote {len(rows)} rows · {now_utc}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
