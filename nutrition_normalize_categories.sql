-- Нормализация категорий nutrition
-- Апрель 2026

-- 1. Молочные продукты → 'молочное'
UPDATE nutrition SET category = 'молочное'
WHERE category IN ('молочные', 'молочное сыры', 'молочное творог',
                   'молочное сметана', 'молочное сливки', 'молочное масло');

-- 2. Рыба → 'рыба'
UPDATE nutrition SET category = 'рыба'
WHERE category IN ('рыба морская', 'рыба речная', 'рыба лососёвые');

-- 3. Мясо → 'мясо'
UPDATE nutrition SET category = 'мясо'
WHERE category IN ('мясо свинина', 'мясо говядина', 'мясо баранина', 'мясо прочее');

-- 4. Субпродукты → 'субпродукты'
UPDATE nutrition SET category = 'субпродукты'
WHERE category = 'субпродукты птицы';

-- 5. Ягоды — убираем 'ягоды фрукты' → 'ягоды'
UPDATE nutrition SET category = 'ягоды'
WHERE category = 'ягоды фрукты';

-- 6. Масла → 'масло'
UPDATE nutrition SET category = 'масло'
WHERE category IN ('масла растительные', 'жиры');

-- 7. Морепродукты остаются 'морепродукты' — ок
-- 8. Проверка результата
SELECT category, COUNT(*) as cnt
FROM nutrition
GROUP BY category
ORDER BY cnt DESC;
