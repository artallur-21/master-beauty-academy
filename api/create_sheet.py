#!/usr/bin/env python3
"""
One-time setup: create the lead-tracker Google Sheet and share it.

Run once, capture the printed Sheet ID + URL, save to /etc/mba-sync/.env.

Env vars:
  MBA_SA_KEY     service-account.json path
  MBA_SHARE_WITH email(s) to share with (comma-separated)
  MBA_SHEET_NAME spreadsheet title
"""
import json
import os
import sys
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

SA_KEY = os.environ.get("MBA_SA_KEY", "/etc/mba-sync/service-account.json")
SHARE_WITH = [e.strip() for e in os.environ.get("MBA_SHARE_WITH", "ceo@atil.ltd").split(",") if e.strip()]
NAME = os.environ.get("MBA_SHEET_NAME", "Master Beauty Academy — Lead Tracker")

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

HEADERS = [
    "ID", "Created (UTC)", "Name", "Phone", "WhatsApp", "City", "Message",
    "Source Page", "UTM Source", "UTM Medium", "UTM Campaign",
    "WA Clicked", "Status", "Notes",
]

def main() -> int:
    creds = Credentials.from_service_account_file(SA_KEY, scopes=SCOPES)
    sheets = build("sheets", "v4", credentials=creds, cache_discovery=False)
    drive = build("drive", "v3", credentials=creds, cache_discovery=False)

    # 1. Create the spreadsheet with a "Leads" tab + initial header
    spreadsheet = sheets.spreadsheets().create(body={
        "properties": {"title": NAME, "locale": "en", "timeZone": "Asia/Kolkata"},
        "sheets": [{
            "properties": {
                "title": "Leads",
                "gridProperties": {"rowCount": 2000, "columnCount": 17, "frozenRowCount": 1},
            },
            "data": [{
                "startRow": 0, "startColumn": 0,
                "rowData": [{
                    "values": [
                        {
                            "userEnteredValue": {"stringValue": h},
                            "userEnteredFormat": {
                                "backgroundColor": {"red": 0.49, "green": 0.12, "blue": 0.32},
                                "textFormat": {"foregroundColor": {"red": 1, "green": 1, "blue": 1}, "bold": True},
                                "horizontalAlignment": "LEFT",
                                "verticalAlignment": "MIDDLE",
                                "padding": {"top": 6, "bottom": 6, "left": 8, "right": 8},
                            },
                        } for h in HEADERS
                    ],
                }],
            }],
        }],
    }, fields="spreadsheetId,spreadsheetUrl").execute()

    sid = spreadsheet["spreadsheetId"]
    url = spreadsheet["spreadsheetUrl"]

    # 2. Share with humans (writer access)
    for email in SHARE_WITH:
        try:
            drive.permissions().create(
                fileId=sid,
                body={"type": "user", "role": "writer", "emailAddress": email},
                sendNotificationEmail=True,
                fields="id",
            ).execute()
            print(f"  shared with {email} (writer)")
        except Exception as e:
            print(f"  WARN: could not share with {email}: {e}", file=sys.stderr)

    print()
    print("=" * 70)
    print(f"Sheet ID : {sid}")
    print(f"URL      : {url}")
    print(f"Shared   : {', '.join(SHARE_WITH)}")
    print("=" * 70)

    # Emit env-format for piping
    with open("/etc/mba-sync/sheet.id", "w") as f:
        f.write(sid + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
