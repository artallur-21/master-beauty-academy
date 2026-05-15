#!/usr/bin/env bash
# Daily SQLite backup for the MBA enquiry DB.
# Run via cron: 30 3 * * * /var/www/masterbeautyacademy.com/api/backup.sh
set -euo pipefail

DB=${MBA_DB_PATH:-/var/lib/mba-api/enquiries.sqlite}
DEST=${MBA_BACKUP_DIR:-/var/backups/mba-api}
RETAIN_DAYS=${MBA_BACKUP_RETAIN:-30}

mkdir -p "$DEST"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT="$DEST/enquiries-$STAMP.sqlite"

# Online backup via sqlite3 (works even while the API has the DB open)
sqlite3 "$DB" ".backup '$OUT'"
gzip -f "$OUT"

# Prune
find "$DEST" -name 'enquiries-*.sqlite.gz' -mtime "+$RETAIN_DAYS" -delete

echo "[mba-backup] wrote ${OUT}.gz"
