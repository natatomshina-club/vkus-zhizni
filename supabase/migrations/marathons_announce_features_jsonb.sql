-- Конвертация announce_features из text[] (JSON-строки) в jsonb (массив объектов)
-- array_to_json(text[]) НЕ подходит — он оставляет строки строками внутри массива.
-- jsonb_agg(elem::jsonb) парсит каждую строку как JSON и собирает в jsonb-массив.

ALTER TABLE marathons
  ALTER COLUMN announce_features TYPE jsonb
  USING (
    CASE
      WHEN announce_features IS NULL THEN NULL
      ELSE (SELECT jsonb_agg(elem::jsonb) FROM unnest(announce_features) AS elem)
    END
  );
