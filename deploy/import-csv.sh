#!/bin/bash
# Импорт CSV файлов из Supabase в PostgreSQL через Docker
# Запуск: CSV_DIR=/root/csv bash deploy/import-csv.sh

set -euo pipefail

CSV_DIR="${CSV_DIR:-/root/csv}"
CONTAINER="supabase-db"

if [ ! -d "$CSV_DIR" ]; then
  echo "❌ Папка не найдена: $CSV_DIR"
  exit 1
fi

OK=0
FAIL=0

import_csv() {
  local pattern="$1"
  local table="$2"

  local file
  file=$(find "$CSV_DIR" -maxdepth 1 -name "${pattern}" | head -1)

  if [ -z "$file" ]; then
    echo "⚠️  пропущено:  $table (файл не найден: $pattern)"
    return
  fi

  local rows
  rows=$(docker exec -i "$CONTAINER" psql -U postgres -d postgres \
    -c "\copy public.${table} FROM STDIN WITH CSV HEADER" \
    < "$file" 2>&1)

  if echo "$rows" | grep -q "^COPY"; then
    local count
    count=$(echo "$rows" | grep -oP '(?<=COPY )\d+')
    echo "✅ imported:  $table ($count rows)"
    OK=$((OK + 1))
  else
    echo "❌ failed:    $table — $rows"
    FAIL=$((FAIL + 1))
  fi
}

# ── Маппинг файл → таблица ────────────────────────────────────────
import_csv "Supabase Snippet Affiliate Commissions Retrie*" "affiliate_commissions"
import_csv "Supabase Snippet Fetch All Diary Water*"        "diary_water"
import_csv "Supabase Snippet Fetch All Measurements*"       "measurements"
import_csv "Supabase Snippet Fetch All Recipes*"            "recipes"
import_csv "Supabase Snippet Fetch All Webinar Lessons*"    "webinar_lessons"
import_csv "Supabase Snippet Fetch Announcements*"          "announcements"
import_csv "Supabase Snippet Fetch Diary Entries*"          "diary_entries"
import_csv "Supabase Snippet Fetch Intro Lessons*"          "intro_lessons"
import_csv "Supabase Snippet Fetch Marathon Days*"          "marathon_days"
import_csv "Supabase Snippet Fetch Meditation Courses*"     "meditation_courses"
import_csv "Supabase Snippet Fetch Result Cases*"           "result_cases"
import_csv "Supabase Snippet Fetch SEO Settings*"           "seo_settings"
import_csv "Supabase Snippet Fetch Saved Recipes*"          "saved_recipes"
import_csv "Supabase Snippet Fetch Seasonal Themes*"        "seasonal_themes"
import_csv "Supabase Snippet Fetch Webinar Materials*"      "webinar_materials"
import_csv "Supabase Snippet List All Affiliates*"          "affiliates"
import_csv "Supabase Snippet List All Webinars*"            "webinars"
import_csv "Supabase Snippet List Body Materials*"          "body_materials"
import_csv "Supabase Snippet List Body Sections*"           "body_sections"
import_csv "Supabase Snippet List Channel Posts*"           "channel_posts"
import_csv "Supabase Snippet List Email Campaigns*"         "email_campaigns"
import_csv "Supabase Snippet List Intro Courses*"           "intro_courses"
import_csv "Supabase Snippet List Meditations*"             "meditations"
import_csv "Supabase Snippet List Members*"                 "members"
import_csv "Supabase Snippet List Webinar Access*"          "webinar_access"
import_csv "Supabase Snippet Private Messages*"             "private_messages"
import_csv "Supabase Snippet Retrieve All Blog Posts*"      "blog_posts"
import_csv "Supabase Snippet Retrieve All Lessons*"         "lessons"
import_csv "Supabase Snippet Retrieve All Marathon*"        "marathons"
import_csv "Supabase Snippet Retrieve All Subscribers*"     "subscribers"
import_csv "Supabase Snippet Retrieve Cooking Tips*"        "cooking_tips"
import_csv "Supabase Snippet Retrieve FAQ Items*"           "faq_items"
import_csv "Supabase Snippet Retrieve Nutrition*"           "nutrition"
import_csv "Supabase Snippet Retrieve Page Content*"        "page_content"
import_csv "Supabase Snippet Retrieve Payment Logs*"        "payment_logs"
import_csv "Supabase Snippet Retrieve Recipe Ingredients*"  "recipe_ingredients"
import_csv "Supabase Snippet Retrieve Weekly Plans*"        "weekly_plans"
import_csv "Supabase Snippet View All Diary Notes*"         "diary_notes"
import_csv "Supabase Snippet Wins Records*"                 "wins"

# ── Итог ──────────────────────────────────────────────────────────
echo ""
echo "──────────────────────────────────"
echo "Итого: ✅ $OK успешно  |  ❌ $FAIL ошибок"
