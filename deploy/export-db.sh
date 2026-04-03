#!/bin/bash
# Экспорт базы данных из Supabase Cloud
# Запуск: SUPABASE_DB_PASSWORD=ваш_пароль bash deploy/export-db.sh

set -euo pipefail

if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  echo "❌ Переменная SUPABASE_DB_PASSWORD не задана"
  echo "   Запуск: SUPABASE_DB_PASSWORD=ваш_пароль bash deploy/export-db.sh"
  exit 1
fi

DB_HOST="aws-0-ap-northeast-2.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.byykvsjamtcklwtnjkpf"

DATE=$(date +%Y-%m-%d)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXPORT_FILE="${SCRIPT_DIR}/db-export-${DATE}.sql"
SCHEMA_FILE="${SCRIPT_DIR}/db-schema-${DATE}.sql"

PG_DUMP="PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --no-owner --no-acl --schema=public"

# ── Полный дамп (схема + данные) ──────────────────────────────────
echo "🔄 Экспорт данных → $(basename "$EXPORT_FILE") ..."
eval "$PG_DUMP" > "$EXPORT_FILE"
echo "✅ Данные: $(basename "$EXPORT_FILE") — $(du -sh "$EXPORT_FILE" | cut -f1)"

# ── Только схема (без данных) ─────────────────────────────────────
echo "🔄 Экспорт схемы → $(basename "$SCHEMA_FILE") ..."
eval "$PG_DUMP --schema-only" > "$SCHEMA_FILE"
echo "✅ Схема:  $(basename "$SCHEMA_FILE") — $(du -sh "$SCHEMA_FILE" | cut -f1)"
