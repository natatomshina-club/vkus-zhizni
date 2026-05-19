# docs/tracker.md — Трекер замеров

## Роут: /dashboard/tracker

## Что отслеживается
- Вес (кг) — основной показатель
- Талия (см)
- Бёдра (см)
- Грудь (см)
- Уровень энергии (1-3 / 4-6 / 7-10)
- Тяга к сладкому (да/нет)

## Три вкладки
1. **Сводка** — текущие показатели, прогресс к цели, график, достижения
2. **Внести** — форма добавления замеров
3. **История** — хронологический список записей

## Сводка
- Большая карточка веса с дельтой от старта
- 4 малых карточки: талия, бёдра, энергия, тяга к сладкому
- Прогресс-бар к цели (% пути)
- График веса с периодами 1М / 3М / Всё (Chart.js)
- Достижения (badges): первый кг, -5кг, -10кг, -5см талия и т.д.

## Форма замеров
- Поля: вес, талия, бёдра, грудь
- Энергия: кнопки 😩1-3 / 😐4-6 / 😊7-10
- Тяга к сладкому: toggle да/нет
- Кнопка «Сохранить замеры»
- После сохранения: зелёный блок «✅ Замеры сохранены!»

## Рекомендация по замерам
- Раз в неделю, в воскресенье утром
- Напоминание каждое воскресенье в 20:00 (email)

## Таблица measurements
```sql
id, member_id, date,
weight, waist, hips, chest,
energy_level (1-10), sweet_cravings (boolean),
created_at
```

## Достижения (achievements)
```typescript
const achievements = [
  { id: 'first_kg', label: 'Первый кг', icon: '🎯', condition: 'totalLoss >= 1' },
  { id: 'minus5kg', label: '-5 кг', icon: '⭐', condition: 'totalLoss >= 5' },
  { id: 'minus10kg', label: '-10 кг', icon: '🔥', condition: 'totalLoss >= 10' },
  { id: 'minus5waist', label: '-5 см талия', icon: '📏', condition: 'waistLoss >= 5' },
  { id: 'minus10waist', label: '-10 см талия', icon: '💎', condition: 'waistLoss >= 10' },
  { id: 'goal', label: 'Цель достигнута', icon: '👑', condition: 'weight <= goalWeight' },
]
```

## API
- POST /api/tracker/add — добавить замеры
- GET /api/tracker/history — история замеров
- GET /api/tracker/stats — статистика (дельты, прогресс)
