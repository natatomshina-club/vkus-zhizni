#!/bin/bash
# Бэкап PostgreSQL → /opt/backups/
# Переменные окружения: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# Cron: 0 3 * * * /opt/vkus-zhizni/deploy/backup.sh >> /var/log/vkus-zhizni-backup.log 2>&1

set -euo pipefail

BACKUP_DIR="/opt/backups"
FILENAME="backup_$(date +%Y-%m-%d_%H-%M).sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

mkdir -p "$BACKUP_DIR"

if PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "${DB_PORT:-5432}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-password \
    | gzip > "$FILEPATH"; then
  echo "✅ Backup done: $FILENAME"
else
  rm -f "$FILEPATH"
  echo "❌ Backup failed: $(date '+%Y-%m-%d %H:%M')"
  exit 1
fi

# Удалить бэкапы старше 7 дней
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
