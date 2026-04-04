#!/usr/bin/env python3
"""
Конвертация CSV: JSON-массивы ["a","b"] → PostgreSQL-массивы {"a","b"}
Запуск: python3 deploy/fix-csv-arrays.py /root/csv
"""

import csv
import json
import os
import re
import sys


def json_array_to_pg(value: str) -> str:
    """Конвертирует JSON-массив в формат PostgreSQL."""
    value = value.strip()
    if not value.startswith("["):
        return value
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return value

    if parsed == []:
        return "{}"

    # Экранируем каждый элемент: строки в кавычках, остальное как есть
    parts = []
    for item in parsed:
        if item is None:
            parts.append("NULL")
        elif isinstance(item, str):
            escaped = item.replace("\\", "\\\\").replace('"', '\\"')
            parts.append(f'"{escaped}"')
        else:
            parts.append(str(item))

    return "{" + ",".join(parts) + "}"


def fix_csv(filepath: str) -> int:
    """Исправляет один CSV файл. Возвращает количество исправленных колонок."""
    with open(filepath, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            return 0
        rows = list(reader)
        fieldnames = list(reader.fieldnames)

    if not rows:
        return 0

    # Определяем колонки с JSON-массивами по первой непустой строке
    array_cols = set()
    for row in rows:
        for col in fieldnames:
            val = (row.get(col) or "").strip()
            if val.startswith("["):
                array_cols.add(col)

    if not array_cols:
        return 0

    # Конвертируем
    fixed_rows = []
    for row in rows:
        new_row = dict(row)
        for col in array_cols:
            val = new_row.get(col) or ""
            new_row[col] = json_array_to_pg(val)
        fixed_rows.append(new_row)

    # Сохраняем _fixed.csv рядом с оригиналом
    base, ext = os.path.splitext(filepath)
    out_path = base + "_fixed" + ext
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(fixed_rows)

    return len(array_cols)


def main():
    csv_dir = sys.argv[1] if len(sys.argv) > 1 else "/root/csv"

    if not os.path.isdir(csv_dir):
        print(f"❌ Папка не найдена: {csv_dir}")
        sys.exit(1)

    files = sorted(
        f for f in os.listdir(csv_dir)
        if f.endswith(".csv") and not f.endswith("_fixed.csv")
    )

    if not files:
        print(f"⚠️  CSV файлы не найдены в {csv_dir}")
        sys.exit(0)

    ok = 0
    skipped = 0

    for filename in files:
        filepath = os.path.join(csv_dir, filename)
        fixed_cols = fix_csv(filepath)
        if fixed_cols > 0:
            print(f"✅ fixed:   {filename} ({fixed_cols} array columns fixed)")
            ok += 1
        else:
            print(f"–  skipped: {filename} (no array columns)")
            skipped += 1

    print()
    print("──────────────────────────────────")
    print(f"Итого: ✅ {ok} исправлено  |  – {skipped} пропущено")


if __name__ == "__main__":
    main()
