#!/usr/bin/env bash
# Daily Postgres backup. Designed to run from cron on the VM.
#
# Cron line (run `crontab -e`):
#   0 3 * * * /home/azureuser/Car-Rental-deploy/scripts/backup.sh >> /home/azureuser/Car-Rental-deploy/backups/backup.log 2>&1
#
# Env vars (with defaults):
#   BACKUP_DIR    where dumps land            (default: <repo>/backups)
#   RETENTION_DAYS  delete dumps older than this (default: 7)

set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$DEPLOY_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

# Pull POSTGRES_USER + POSTGRES_DB out of .env so this script doesn't need to be
# kept in sync manually.
if [[ -f "$DEPLOY_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$DEPLOY_DIR/.env"
  set +a
fi
: "${POSTGRES_USER:?POSTGRES_USER not set (check .env)}"
: "${POSTGRES_DB:?POSTGRES_DB not set (check .env)}"

TS=$(date -u +%FT%H%M%SZ)
OUT="$BACKUP_DIR/${POSTGRES_DB}-${TS}.sql.gz"

cd "$DEPLOY_DIR"
echo "[$(date -u +%FT%TZ)] dumping → $OUT"
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$OUT"

echo "[$(date -u +%FT%TZ)] pruning dumps older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -name "${POSTGRES_DB}-*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete

echo "[$(date -u +%FT%TZ)] done. current dumps:"
ls -lh "$BACKUP_DIR"/${POSTGRES_DB}-*.sql.gz 2>/dev/null || echo "  (none yet)"
