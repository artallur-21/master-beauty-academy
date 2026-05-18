#!/usr/bin/env python3
"""
Create the v2 lead-tracker spreadsheet — multi-tab, formula-driven.

Tabs:
  1. Leads        — raw data sync target (one row per enquiry)
  2. Dashboard    — KPI box + status / city / source breakdowns + last-30-days
  3. Daily        — auto timeseries by day for the past 90 days
  4. By Source    — UTM source / medium / campaign aggregates
  5. Setup        — sync state, links, owner notes

Owned by ceo@atil.ltd via OAuth user creds (sheet is in their Drive).
"""
import json, os, sys
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

CREDS_PATH = os.environ.get("MBA_GOOGLE_CREDS", "/etc/mba-sync/oauth-creds.json")
SHARE_WITH = [e.strip() for e in os.environ.get("MBA_SHARE_WITH", "ceo@atil.ltd").split(",") if e.strip()]
NAME = os.environ.get("MBA_SHEET_NAME", "Master Beauty Academy — Lead Tracker v2")
SCOPES = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]

# Leads tab schema (kept in sync with sync_to_sheet.py)
LEAD_HEADERS = [
    "ID", "Created (UTC)", "Created (IST)", "Name", "Phone", "WhatsApp",
    "City", "Message", "Source Page", "Referer",
    "UTM Source", "UTM Medium", "UTM Campaign", "UTM Term", "UTM Content",
    "WA Clicked", "Status", "Notes",
]

BRAND = {"red": 0.478, "green": 0.086, "blue": 0.255}        # #7a1641 brand-700
GOLD  = {"red": 0.831, "green": 0.706, "blue": 0.416}        # #d4b46a gold-400
CREAM = {"red": 0.980, "green": 0.965, "blue": 0.941}        # #faf6f0
INK   = {"red": 0.078, "green": 0.063, "blue": 0.102}        # #14101a
WHITE = {"red": 1, "green": 1, "blue": 1}

def fmt_header_cell(text):
    return {
        "userEnteredValue": {"stringValue": text},
        "userEnteredFormat": {
            "backgroundColor": BRAND,
            "textFormat": {"foregroundColor": WHITE, "bold": True, "fontSize": 10},
            "horizontalAlignment": "LEFT", "verticalAlignment": "MIDDLE",
            "padding": {"top": 6, "bottom": 6, "left": 8, "right": 8},
        },
    }

def fmt_kpi_title(text):
    return {
        "userEnteredValue": {"stringValue": text},
        "userEnteredFormat": {
            "textFormat": {"foregroundColor": {"red": 0.49, "green": 0.46, "blue": 0.54}, "bold": True, "fontSize": 9},
            "horizontalAlignment": "LEFT",
        },
    }

def fmt_kpi_value(formula):
    return {
        "userEnteredValue": {"formulaValue": formula},
        "userEnteredFormat": {
            "textFormat": {"foregroundColor": BRAND, "bold": True, "fontSize": 22, "fontFamily": "Fraunces"},
            "horizontalAlignment": "LEFT",
        },
    }

def fmt_section_title(text):
    return {
        "userEnteredValue": {"stringValue": text},
        "userEnteredFormat": {
            "textFormat": {"foregroundColor": INK, "bold": True, "fontSize": 13, "fontFamily": "Fraunces"},
            "horizontalAlignment": "LEFT",
        },
    }

def fmt_label(text):
    return {"userEnteredValue": {"stringValue": text}, "userEnteredFormat": {"textFormat": {"foregroundColor": {"red": 0.49, "green": 0.46, "blue": 0.54}, "fontSize": 10}}}

def fmt_subtle(text):
    return {"userEnteredValue": {"stringValue": text}, "userEnteredFormat": {"textFormat": {"foregroundColor": {"red": 0.43, "green": 0.4, "blue": 0.46}, "fontSize": 10, "italic": True}}}


def load_creds() -> Credentials:
    with open(CREDS_PATH) as f:
        d = json.load(f)
    c = Credentials(
        token=d.get("token"), refresh_token=d.get("refresh_token"),
        token_uri=d.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=d["client_id"], client_secret=d["client_secret"], scopes=SCOPES,
    )
    if not c.valid:
        c.refresh(Request())
    return c


def build_dashboard_rows():
    """Construct the Dashboard tab as a list of rows of cell dicts."""
    blank = {"userEnteredValue": {"stringValue": ""}}
    rows = []
    # Row 1 — title banner
    rows.append([
        {"userEnteredValue": {"stringValue": "MASTER BEAUTY ACADEMY · LEAD DASHBOARD"},
         "userEnteredFormat": {"backgroundColor": INK,
                                "textFormat": {"foregroundColor": GOLD, "bold": True, "fontSize": 14, "fontFamily": "Fraunces"},
                                "horizontalAlignment": "LEFT",
                                "padding": {"top": 10, "bottom": 10, "left": 12, "right": 12}}},
        *[{"userEnteredValue": {"stringValue": ""}, "userEnteredFormat": {"backgroundColor": INK}} for _ in range(7)],
    ])
    # Row 2 — last synced
    rows.append([{"userEnteredValue": {"stringValue": "Last synced (UTC):"}, "userEnteredFormat": {"textFormat": {"foregroundColor": {"red": 0.49, "green": 0.46, "blue": 0.54}, "fontSize": 10}}},
                 {"userEnteredValue": {"formulaValue": "=Setup!B2"}, "userEnteredFormat": {"textFormat": {"foregroundColor": INK, "bold": True}}}])
    rows.append([blank])  # spacer

    # KPI BLOCK — Row 4 titles, Row 5 values
    kpi_titles = ["TOTAL LEADS", "NEW", "CONTACTED", "ENROLLED", "DROPPED", "LAST 7 DAYS", "LAST 30 DAYS", "WHATSAPP CLICKS"]
    kpi_formulas = [
        "=COUNTA(Leads!A2:A)",
        '=COUNTIF(Leads!Q2:Q,"new")',
        '=COUNTIF(Leads!Q2:Q,"contacted")',
        '=COUNTIF(Leads!Q2:Q,"enrolled")',
        '=COUNTIF(Leads!Q2:Q,"dropped")',
        '=COUNTIFS(Leads!B2:B,">"&TEXT(NOW()-7,"yyyy-mm-dd HH:mm:ss"))',
        '=COUNTIFS(Leads!B2:B,">"&TEXT(NOW()-30,"yyyy-mm-dd HH:mm:ss"))',
        '=COUNTIF(Leads!P2:P,"✓")',
    ]
    rows.append([fmt_kpi_title(t) for t in kpi_titles])
    rows.append([fmt_kpi_value(f) for f in kpi_formulas])
    rows.append([blank])
    rows.append([blank])

    # SECTION — By Status
    rows.append([fmt_section_title("By status")])
    rows.append([fmt_label("Status"), fmt_label("Count"), fmt_label("Share")])
    for st in ["new", "contacted", "enrolled", "dropped"]:
        rows.append([
            {"userEnteredValue": {"stringValue": st}},
            {"userEnteredValue": {"formulaValue": f'=COUNTIF(Leads!Q2:Q,"{st}")'}},
            {"userEnteredValue": {"formulaValue": f'=IFERROR(COUNTIF(Leads!Q2:Q,"{st}")/COUNTA(Leads!Q2:Q),0)'}, "userEnteredFormat": {"numberFormat": {"type": "PERCENT", "pattern": "0%"}}},
        ])
    rows.append([blank])

    # SECTION — By City
    rows.append([fmt_section_title("By city")])
    rows.append([fmt_label("City"), fmt_label("Count")])
    rows.append([{"userEnteredValue": {"stringValue": "Belagavi"}}, {"userEnteredValue": {"formulaValue": '=COUNTIF(Leads!G2:G,"Belagavi")'}}])
    rows.append([{"userEnteredValue": {"stringValue": "Hubballi"}}, {"userEnteredValue": {"formulaValue": '=COUNTIF(Leads!G2:G,"Hubballi")'}}])
    rows.append([{"userEnteredValue": {"stringValue": "Other"}},    {"userEnteredValue": {"formulaValue": '=COUNTIF(Leads!G2:G,"Other")'}}])
    rows.append([blank])

    # SECTION — Top sources (live QUERY)
    rows.append([fmt_section_title("Top UTM sources (top 10)")])
    rows.append([
        {"userEnteredValue": {"formulaValue": '=IFERROR(QUERY(Leads!K2:K, "select K, count(K) where K is not null group by K order by count(K) desc limit 10 label K \'Source\', count(K) \'Count\'", -1), "")'}}
    ])
    return rows


def main() -> int:
    creds = load_creds()
    sheets = build("sheets", "v4", credentials=creds, cache_discovery=False)
    drive  = build("drive", "v3", credentials=creds, cache_discovery=False)

    # 1) Header rows for Leads tab
    leads_header_row = {"values": [fmt_header_cell(h) for h in LEAD_HEADERS]}

    # 2) Build the four worksheet skeletons
    spreadsheet_body = {
        "properties": {"title": NAME, "locale": "en", "timeZone": "Asia/Kolkata"},
        "sheets": [
            # Sheet 0 — Dashboard (front page)
            {
                "properties": {"title": "Dashboard", "index": 0,
                                "gridProperties": {"rowCount": 60, "columnCount": 10, "frozenRowCount": 2}},
            },
            # Sheet 1 — Leads (sync target)
            {
                "properties": {"title": "Leads", "index": 1,
                                "gridProperties": {"rowCount": 5000, "columnCount": len(LEAD_HEADERS), "frozenRowCount": 1}},
                "data": [{"startRow": 0, "startColumn": 0, "rowData": [leads_header_row]}],
            },
            # Sheet 2 — Daily
            {
                "properties": {"title": "Daily", "index": 2,
                                "gridProperties": {"rowCount": 200, "columnCount": 4, "frozenRowCount": 1}},
            },
            # Sheet 3 — By Source
            {
                "properties": {"title": "By Source", "index": 3,
                                "gridProperties": {"rowCount": 200, "columnCount": 6, "frozenRowCount": 1}},
            },
            # Sheet 4 — Setup
            {
                "properties": {"title": "Setup", "index": 4,
                                "gridProperties": {"rowCount": 50, "columnCount": 4}},
            },
        ],
    }

    created = sheets.spreadsheets().create(body=spreadsheet_body, fields="spreadsheetId,spreadsheetUrl,sheets.properties").execute()
    sid = created["spreadsheetId"]
    url = created["spreadsheetUrl"]
    sheet_ids = {s["properties"]["title"]: s["properties"]["sheetId"] for s in created["sheets"]}

    # 3) Populate Dashboard, Daily, By Source, Setup via batchUpdate
    dashboard_rows = build_dashboard_rows()
    daily_rows = [
        [fmt_header_cell("Date"), fmt_header_cell("New leads"), fmt_header_cell("WhatsApp clicks"), fmt_header_cell("Cumulative")],
        [{"userEnteredValue": {"formulaValue":
            '=IFERROR(QUERY(Leads!B2:P, "select TODATE(B), count(B), sum(case when P=\'✓\' then 1 else 0 end) where B is not null group by TODATE(B) order by TODATE(B) desc limit 90 label TODATE(B) \'Date\', count(B) \'New leads\', sum(case when P=\'✓\' then 1 else 0 end) \'WhatsApp clicks\'", -1), "")'
        }}],
    ]
    by_source_rows = [
        [fmt_header_cell("Channel"), fmt_header_cell("Source"), fmt_header_cell("Medium"), fmt_header_cell("Campaign"), fmt_header_cell("Leads")],
        [{"userEnteredValue": {"formulaValue":
            '=IFERROR(QUERY({Leads!K2:M, Leads!Q2:Q}, "select Col1, Col2, Col3, count(Col4) where Col1 is not null group by Col1, Col2, Col3 order by count(Col4) desc label Col1 \'Source\', Col2 \'Medium\', Col3 \'Campaign\', count(Col4) \'Leads\'", -1), "Awaiting data")'
        }}],
    ]
    setup_rows = [
        [fmt_section_title("Setup")],
        [{"userEnteredValue": {"stringValue": "Last synced (UTC)"}}, {"userEnteredValue": {"stringValue": "—"}}],
        [{"userEnteredValue": {"stringValue": "Source-of-truth"}},   {"userEnteredValue": {"stringValue": "VPS · /var/lib/mba-api/enquiries.sqlite"}}],
        [{"userEnteredValue": {"stringValue": "API endpoint"}},       {"userEnteredValue": {"stringValue": "https://themasterbeautyacademy.com/api/enquiry"}}],
        [{"userEnteredValue": {"stringValue": "Admin dashboard"}},    {"userEnteredValue": {"stringValue": "https://themasterbeautyacademy.com/api/admin/"}}],
        [{"userEnteredValue": {"stringValue": "Sync cadence"}},       {"userEnteredValue": {"stringValue": "Every 5 minutes (systemd timer mba-sync.timer)"}}],
        [{"userEnteredValue": {"stringValue": "Backup"}},             {"userEnteredValue": {"stringValue": "Daily 03:30 UTC → /var/backups/mba-api/ (30-day retain)"}}],
        [fmt_subtle("Edits to this sheet are not synced back to SQLite — treat SQLite as the source of truth.")],
    ]

    def build_update_cells_request(sheet_id, rows, start_row=0, start_col=0):
        return {"updateCells": {
            "rows": [{"values": row} for row in rows],
            "fields": "userEnteredValue,userEnteredFormat",
            "start": {"sheetId": sheet_id, "rowIndex": start_row, "columnIndex": start_col},
        }}

    requests = [
        build_update_cells_request(sheet_ids["Dashboard"], dashboard_rows),
        build_update_cells_request(sheet_ids["Daily"],     daily_rows),
        build_update_cells_request(sheet_ids["By Source"], by_source_rows),
        build_update_cells_request(sheet_ids["Setup"],     setup_rows),
        # Column widths
        {"updateDimensionProperties": {"range": {"sheetId": sheet_ids["Dashboard"], "dimension": "COLUMNS", "startIndex": 0, "endIndex": 8}, "properties": {"pixelSize": 145}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet_ids["Leads"], "dimension": "COLUMNS", "startIndex": 3, "endIndex": 4}, "properties": {"pixelSize": 180}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet_ids["Leads"], "dimension": "COLUMNS", "startIndex": 7, "endIndex": 8}, "properties": {"pixelSize": 260}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet_ids["Leads"], "dimension": "COLUMNS", "startIndex": 8, "endIndex": 10}, "properties": {"pixelSize": 200}, "fields": "pixelSize"}},
        # Conditional formatting on Status column (Leads!Q)
        {"addConditionalFormatRule": {"rule": {
            "ranges": [{"sheetId": sheet_ids["Leads"], "startColumnIndex": 16, "endColumnIndex": 17, "startRowIndex": 1}],
            "booleanRule": {"condition": {"type": "TEXT_EQ", "values": [{"userEnteredValue": "new"}]},
                             "format": {"backgroundColor": {"red": 0.98, "green": 0.92, "blue": 0.94}, "textFormat": {"foregroundColor": BRAND, "bold": True}}},
        }, "index": 0}},
        {"addConditionalFormatRule": {"rule": {
            "ranges": [{"sheetId": sheet_ids["Leads"], "startColumnIndex": 16, "endColumnIndex": 17, "startRowIndex": 1}],
            "booleanRule": {"condition": {"type": "TEXT_EQ", "values": [{"userEnteredValue": "contacted"}]},
                             "format": {"backgroundColor": {"red": 1, "green": 0.95, "blue": 0.82}, "textFormat": {"foregroundColor": {"red": 0.5, "green": 0.4, "blue": 0.0}, "bold": True}}},
        }, "index": 1}},
        {"addConditionalFormatRule": {"rule": {
            "ranges": [{"sheetId": sheet_ids["Leads"], "startColumnIndex": 16, "endColumnIndex": 17, "startRowIndex": 1}],
            "booleanRule": {"condition": {"type": "TEXT_EQ", "values": [{"userEnteredValue": "enrolled"}]},
                             "format": {"backgroundColor": {"red": 0.88, "green": 0.96, "blue": 0.88}, "textFormat": {"foregroundColor": {"red": 0.05, "green": 0.4, "blue": 0.15}, "bold": True}}},
        }, "index": 2}},
        {"addConditionalFormatRule": {"rule": {
            "ranges": [{"sheetId": sheet_ids["Leads"], "startColumnIndex": 16, "endColumnIndex": 17, "startRowIndex": 1}],
            "booleanRule": {"condition": {"type": "TEXT_EQ", "values": [{"userEnteredValue": "dropped"}]},
                             "format": {"backgroundColor": {"red": 0.94, "green": 0.94, "blue": 0.94}, "textFormat": {"foregroundColor": {"red": 0.45, "green": 0.45, "blue": 0.45}}}},
        }, "index": 3}},
        # Data validation — status dropdown
        {"setDataValidation": {
            "range": {"sheetId": sheet_ids["Leads"], "startColumnIndex": 16, "endColumnIndex": 17, "startRowIndex": 1},
            "rule": {"condition": {"type": "ONE_OF_LIST", "values": [
                {"userEnteredValue": "new"}, {"userEnteredValue": "contacted"},
                {"userEnteredValue": "enrolled"}, {"userEnteredValue": "dropped"},
            ]}, "showCustomUi": True, "strict": False},
        }},
        # Hide Setup tab (still accessible via tab list)
        {"updateSheetProperties": {"properties": {"sheetId": sheet_ids["Setup"], "hidden": False}, "fields": "hidden"}},
    ]

    sheets.spreadsheets().batchUpdate(spreadsheetId=sid, body={"requests": requests}).execute()

    # 4) Share (sheet is already owned by ceo@atil.ltd via the OAuth user creds)
    for email in SHARE_WITH:
        if email.lower() == "ceo@atil.ltd":
            continue
        try:
            drive.permissions().create(fileId=sid,
                body={"type": "user", "role": "writer", "emailAddress": email},
                sendNotificationEmail=True, fields="id").execute()
            print(f"  shared with {email} (writer)")
        except Exception as e:
            print(f"  WARN share {email}: {e}", file=sys.stderr)

    print()
    print("=" * 72)
    print(f"Sheet ID : {sid}")
    print(f"URL      : {url}")
    print(f"Tabs     : Dashboard · Leads · Daily · By Source · Setup")
    print("=" * 72)

    # Persist for systemd
    try:
        os.makedirs("/etc/mba-sync", exist_ok=True)
        with open("/etc/mba-sync/sheet.id", "w") as f:
            f.write(sid + "\n")
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
