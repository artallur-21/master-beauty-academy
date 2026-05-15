#!/usr/bin/env python3
"""
Sync enquiries from the SQLite DB to a Google Sheet.

- Idempotent: full-overwrite of the data range each run (atomic, simple, easy to reason about)
- Header row pinned at row 1
- Hyperlinks for phone (tel:) and WhatsApp (wa.me) columns
- Adds a small "Synced at" cell so the team knows it's live

Env vars:
  MBA_DB_PATH                 path to SQLite DB
  MBA_SA_KEY                  path to service-account.json
  MBA_SHEET_ID                target spreadsheet id
  MBA_SHEET_TAB               worksheet name (default: Leads)
"""

import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

DB_PATH = os.environ.get("MBA_DB_PATH", "/var/lib/mba-api/enquiries.sqlite")
CREDS_PATH = os.environ.get("MBA_GOOGLE_CREDS", "/etc/mba-sync/oauth-creds.json")
SHEET_ID = os.environ.get("MBA_SHEET_ID", "")
TAB = os.environ.get("MBA_SHEET_TAB", "Leads")

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


def load_creds() -> Credentials:
    with open(CREDS_PATH) as f:
        d = json.load(f)
    creds = Credentials(
        token=d.get("token"),
        refresh_token=d.get("refresh_token"),
        token_uri=d.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=d["client_id"],
        client_secret=d["client_secret"],
        scopes=SCOPES,
    )
    if not creds.valid:
        creds.refresh(Request())
    return creds

HEADERS = [
    "ID", "Created (UTC)", "Name", "Phone", "WhatsApp", "City", "Message",
    "Source Page", "UTM Source", "UTM Medium", "UTM Campaign",
    "WA Clicked", "Status", "Notes",
]

def fetch_rows(db_path: str):
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    cur = con.execute("""
        SELECT id, created_at, name, phone, city, message, source_page,
               utm_source, utm_medium, utm_campaign, whatsapp_clicked, status, notes
        FROM enquiries
        ORDER BY id ASC
    """)
    out = []
    for r in cur:
        phone_digits = "".join(ch for ch in (r["phone"] or "") if ch.isdigit())
        wa_link = f'=HYPERLINK("https://wa.me/{phone_digits}","Open")' if phone_digits else ""
        tel_link = f'=HYPERLINK("tel:{r["phone"]}","{r["phone"]}")' if r["phone"] else ""
        out.append([
            r["id"],
            r["created_at"],
            r["name"] or "",
            tel_link,
            wa_link,
            r["city"] or "",
            r["message"] or "",
            r["source_page"] or "",
            r["utm_source"] or "",
            r["utm_medium"] or "",
            r["utm_campaign"] or "",
            "✓" if r["whatsapp_clicked"] else "",
            r["status"] or "",
            r["notes"] or "",
        ])
    con.close()
    return out


def main() -> int:
    if not SHEET_ID:
        print("error: MBA_SHEET_ID not set", file=sys.stderr)
        return 2

    creds = load_creds()
    svc = build("sheets", "v4", credentials=creds, cache_discovery=False)

    rows = fetch_rows(DB_PATH)
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    body = {
        "valueInputOption": "USER_ENTERED",
        "data": [
            {"range": f"{TAB}!A1:N1", "values": [HEADERS]},
            {"range": f"{TAB}!P1:Q1", "values": [["Last synced", now_utc]]},
        ],
    }
    if rows:
        body["data"].append({
            "range": f"{TAB}!A2:N{len(rows)+1}",
            "values": rows,
        })

    # Clear everything below the header first to avoid stale rows after deletions
    try:
        svc.spreadsheets().values().clear(
            spreadsheetId=SHEET_ID,
            range=f"{TAB}!A2:N100000",
        ).execute()
        svc.spreadsheets().values().batchUpdate(
            spreadsheetId=SHEET_ID, body=body,
        ).execute()
    except HttpError as e:
        print(f"error: Sheets API call failed: {e}", file=sys.stderr)
        return 1

    print(f"[mba-sync] wrote {len(rows)} rows · {now_utc}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
