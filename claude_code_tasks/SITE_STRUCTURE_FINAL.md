# 🌐 Структура сайта nata-tomshina.ru — Финальная версия
**Дата завершения:** 17 апреля 2026  
**Проект:** Клуб «Вкус Жизни» — Наталья Томшина, нутрициолог

---

## 🎯 ОСНОВНЫЕ ПРИНЦИПЫ АРХИТЕКТУРЫ

### SEO-стратегия
- **SILO-архитектура** для передачи веса от НЧ к ВЧ запросам
- **Topical authority** — 25-30 статей в кластере для доминирования по теме
- **YMYL compliance** (Your Money or Your Life) с E-E-A-T сигналами
- **Кластеризация по морфологии** — отдельные страницы под разные словоформы

### Принципы брендинга
- **Разрешённая терминология:** "метаболическое питание", "метод Натальи", "умное питание", "система Вкус Жизни"
- **Ограниченное использование "кето/LCHF/low carb":** только в разделах "Методы и диеты", "Рецепты", "Рационы" для перехвата трафика

---

## 🗺 АРХИТЕКТУРА ДОМЕНОВ

```
nata-tomshina.ru          ← ПУБЛИЧНЫЙ САЙТ (SEO, контент, лендинги)
club.nata-tomshina.ru     ← ЗАКРЫТЫЙ КЛУБ (участницы, функционал)
```

**Роутинг:** настроен через `src/proxy.ts` по hostname

---

## 📋 СТРУКТУРА МЕНЮ

### Главное меню (header)
```
🏠 Логотип | О методе | Результаты | Марафон | Блог | Рецепты | Рационы | Заработай | О клубе
```

**Ссылки:**
- **О методе** → `/about` (E-E-A-T страница автора)
- **Результаты** → `/results` (отзывы и истории)
- **Марафон** → `/marathon` (лендинг марафона)
- **Блог** → `/blog` (7 SILO-разделов)
- **Рецепты** → `/recipes` (категории рецептов)
- **Рационы** → `/menyu` (готовые меню)
- **Заработай** → `/partner` (партнёрская программа)
- **О клубе** → `/club` (продающий лендинг)

### Футер
```
СТРУКТУРА          РАЗДЕЛЫ              ЛЕНДИНГИ             ЮРИДИЧЕСКОЕ
Блог               Похудение            Марафон              Политика
Рецепты            Гормоны              О клубе              Оферта
Рационы            Женское здоровье     Заработай            Дисклеймер  
Результаты         Методы и диеты       Бесплатный материал  Контакты
О методе           БАДы и анализы
                   Меню и рационы
                   Истории участниц
```

---

## 🏗 КАРТА САЙТА

### Основные разделы
```
/                             ← главная страница
/about                        ← страница автора (E-E-A-T)
/results                      ← отзывы и результаты
/club                         ← продающий лендинг клуба
/marathon                     ← лендинг марафона
/partner                      ← партнёрская программа
/free                         ← бесплатный мини-курс

/legal/privacy                ← политика конфиденциальности
/legal/oferta                 ← публичная оферта
/legal/disclaimer             ← медицинский дисклеймер
```

### Контентные разделы
```
/blog/                        ← блог (7 SILO)
/recipes/                     ← рецепты (8 категорий)
/menyu/                       ← меню и рационы (6 категорий)
```

---

## 📚 СТРУКТУРА БЛОГА (7 SILO)

### SILO 1: Похудение `/blog/pohudenie/`
**Трафик:** ~80 тыс запросов/мес | **Приоритет:** 1 🔥

**Подкатегории:**
- После 35 лет → `/blog/pohudenie/posle-35/`
- После 40 лет → `/blog/pohudenie/posle-40/`
- После 45 лет → `/blog/pohudenie/posle-45/`
- После 50 лет → `/blog/pohudenie/posle-50/`
- После 55-60 → `/blog/pohudenie/posle-55/`
- При менопаузе → `/blog/pohudenie/pri-menopauze/`
- При климаксе → `/blog/pohudenie/pri-klimakse/`
- При гипотиреозе → `/blog/pohudenie/pri-gipotireoze/`
- При ИР → `/blog/pohudenie/pri-insulinorezistentnosti/`
- При диабете → `/blog/pohudenie/pri-diabete/`
- При СПКЯ → `/blog/pohudenie/pri-spkya/`
- Без голодания → `/blog/pohudenie/bez-golodaniya/`
- Живот и бока → `/blog/pohudenie/zhivot-boka/`

### SILO 2: Гормоны `/blog/gormony/`
**Трафик:** ~40 тыс запросов/мес | **Приоритет:** 1 🔥

**Подкатегории:**
- Инсулин и ИР → `/blog/gormony/insulin/`
- Менопауза → `/blog/gormony/menopauza/`
- Климакс → `/blog/gormony/klimaks/`
- Щитовидная железа → `/blog/gormony/schitovidnaya/`
- Кортизол → `/blog/gormony/kortizol/`
- Эстроген → `/blog/gormony/estrogen/`
- Прогестерон → `/blog/gormony/progesteron/`
- Пролактин → `/blog/gormony/prolaktin/`
- Лептин и грелин → `/blog/gormony/leptin-grelin/`

### SILO 3: Методы и диеты `/blog/diety/`
**Трафик:** ~30 тыс запросов/мес | **Приоритет:** 2
**Особенность:** ✅ Разрешены "кето/LCHF/low carb" для перехвата трафика

**Подкатегории:**
- Почему не худею → `/blog/diety/pochemu-ne-khudeyu/`
- Метаболическое питание → `/blog/diety/metabolicheskoe-pitanie/`
- Кето-диета → `/blog/diety/keto/`
- LCHF / Low carb → `/blog/diety/lchf-lowcarb/`
- Интервальное голодание → `/blog/diety/intervalnoe-golodanie/`
- Средиземноморская → `/blog/diety/sredizemnomorskaya/`
- DASH-диета → `/blog/diety/dash/`
- ПП / правильное питание → `/blog/diety/pravilnoe-pitanie/`
- Подсчёт калорий → `/blog/diety/kalorii/`
- Дефицит калорий → `/blog/diety/deficit-kalorii/`
- Моно-диеты → `/blog/diety/mono-diety/`
- Детокс и голодание → `/blog/diety/detoks-golodanie/`
- Сравнение диет → `/blog/diety/sravnenie-diet/`

### SILO 4: Женское здоровье `/blog/zdorovye/`
**Трафик:** ~50 тыс запросов/мес | **Приоритет:** 2

**Подкатегории:**
- Гипотиреоз → `/blog/zdorovye/gipotireoz/`
- Диабет 2 типа → `/blog/zdorovye/diabet/`
- Инсулинорезистентность → `/blog/zdorovye/insulinorezistentnost/`
- ЖКТ и СИБР/СИГР → `/blog/zdorovye/zkt-sibr/`
- Желчный пузырь → `/blog/zdorovye/zhelchnyy-puzyr/`
- Печень → `/blog/zdorovye/pechen/`
- Суставы → `/blog/zdorovye/sustavy/`
- Сосуды и атеросклероз → `/blog/zdorovye/sosudy-ateroskleroz/`
- Паразиты → `/blog/zdorovye/parazity/`
- Герпес и ВПЧ → `/blog/zdorovye/gerpes/`
- СПКЯ → `/blog/zdorovye/spkya/`
- Эндометриоз → `/blog/zdorovye/endometrioz/`
- Мастопатия → `/blog/zdorovye/mastopatiya/`

### SILO 5: БАДы, витамины, анализы `/blog/bady/`
**Трафик:** ~25 тыс запросов/мес | **Приоритет:** 3

**Подкатегории:**
- Витамины → `/blog/bady/vitaminy/`
- Минералы → `/blog/bady/mineraly/`
- Омега-3 → `/blog/bady/omega-3/`
- Витамин D → `/blog/bady/vitamin-d/`
- БАДы для гормонов → `/blog/bady/dlya-gormonov/`
- БАДы для ЖКТ → `/blog/bady/dlya-zkt/`
- БАДы при менопаузе → `/blog/bady/pri-menopauze/`
- Анализы → `/blog/bady/analizy/`
- Как выбрать БАДы → `/blog/bady/kak-vybrat/`

### SILO 6: Меню и рационы `/blog/menyu/` + `/blog/ratsion/`
**Трафик:** ~60 тыс запросов/мес | **Приоритет:** 1 🔥
**Особенность:** ✅ Разрешены "кето/LCHF/low carb"

#### Часть А: Меню `/blog/menyu/`
**Меню ДЛЯ (цель/аудитория):**
- Для похудения → `/blog/menyu/dlya-pohudeniya/`
- Для похудения после 50 → `/blog/menyu/dlya-pohudeniya-posle-50/`
- Для похудения после 40 → `/blog/menyu/dlya-pohudeniya-posle-40/`
- Для диабетиков → `/blog/menyu/dlya-diabetikov/`
- Для кето диеты → `/blog/menyu/dlya-keto-diety/`
- На 1500 калорий → `/blog/menyu/na-1500-kalorii/`

**Меню ПРИ (заболевание/состояние):**
- При ИР → `/blog/menyu/pri-insulinorezistentnosti/`
- При ИР на неделю → `/blog/menyu/pri-insulinorezistentnosti-na-nedelyu/`
- При гипотиреозе → `/blog/menyu/pri-gipotireoze/`
- При диабете → `/blog/menyu/pri-diabete/`
- При сахарном диабете → `/blog/menyu/pri-sakharnom-diabete/`
- При менопаузе → `/blog/menyu/pri-menopauze/`
- При климаксе → `/blog/menyu/pri-klimakse/`

**Меню ОТ (нутрициолог/симптом):**
- От нутрициолога → `/blog/menyu/ot-nutriciologa/`
- От нутрициолога бесплатно → `/blog/menyu/ot-nutriciologa-besplatno/`
- От нутрициолога на каждый день → `/blog/menyu/ot-nutriciologa-na-kazhdyy-den/`
- От отёков → `/blog/menyu/ot-otekov/`
- От запоров → `/blog/menyu/ot-zaporov/`
- От вздутия живота → `/blog/menyu/ot-vzdutiya-zhivota/`

#### Часть Б: Рационы `/blog/ratsion/`
**Рацион ДЛЯ:**
- Для похудения → `/blog/ratsion/dlya-pohudeniya/`
- Для похудения женщине → `/blog/ratsion/dlya-pohudeniya-zhenshchine/`
- Для похудения на месяц → `/blog/ratsion/dlya-pohudeniya-na-mesyats/`
- Для диабетиков → `/blog/ratsion/dlya-diabetikov/`
- Правильного питания → `/blog/ratsion/pravilnogo-pitaniya/`

**Рацион НА (период/параметры):**
- На неделю → `/blog/ratsion/na-nedelyu/`
- На неделю для похудения → `/blog/ratsion/na-nedelyu-dlya-pohudeniya/`
- На 1500 калорий → `/blog/ratsion/na-1500-kalorii/`
- На 1200 калорий → `/blog/ratsion/na-1200-kalorii/`
- На день → `/blog/ratsion/na-den/`

### SILO 7: Отзывы и истории `/results/` + `/blog/istorii/`
**Трафик:** ~15 тыс запросов/мес | **Приоритет:** 3

**Структура:**
- Главный хаб → `/results/`
- Похудение после 40 → `/blog/istorii/pohudenie-posle-40/`
- Похудение при менопаузе → `/blog/istorii/pohudenie-pri-menopauze/`
- Инсулинорезистентность → `/blog/istorii/pri-ir/`
- Персональные кейсы → `/blog/istorii/[imya-uchastnitsy]/`

---

## 🍽 СТРУКТУРА РЕЦЕПТОВ

### Главная страница `/recipes/`
**Дизайн:** карточки категорий (по образцу блога) + популярные рецепты внизу
**Особенность:** ✅ Разрешены "кето/LCHF/low carb"

### Категории по цели/состоянию
- При инсулинорезистентности → `/recipes/pri-insulinorezistentnosti/`
- При климаксе и менопаузе → `/recipes/pri-klimakse/`
- При диабете 2 типа → `/recipes/pri-diabete/`
- При гипотиреозе → `/recipes/pri-gipotireoze/`
- Для похудения → `/recipes/dlya-pohudeniya/`
- Без сахара → `/recipes/bez-sahara/`
- Высокобелковые → `/recipes/vysokobelkovye/`
- Завтраки → `/recipes/zavtraki/`

---

## 🍜 СТРУКТУРА РАЦИОНОВ

### Главная страница `/menyu/`
**Дизайн:** карточки категорий (аналогично рецептам)
**Особенность:** ✅ Разрешены "кето/LCHF/low carb"

### Категории рационов
- Для похудения → `/menyu/dlya-pohudeniya/`
- При ИР → `/menyu/pri-insulinorezistentnosti/`
- При климаксе → `/menyu/pri-klimakse/`
- При диабете 2 типа → `/menyu/pri-diabete/`
- При гипотиреозе → `/menyu/pri-gipotireoze/`
- От нутрициолога → `/menyu/ot-nutriciologa/`

---

## 🔧 SEO НАСТРОЙКИ

### robots.txt
```
User-agent: *
Allow: /blog
Allow: /recipes
Allow: /menyu
Allow: /about
Allow: /results
Allow: /club
Allow: /marathon
Allow: /partner
Allow: /free
Disallow: /admin
Disallow: /api
Disallow: /dashboard
Disallow: /join
Disallow: /legal

Sitemap: https://nata-tomshina.ru/sitemap.xml
```

### Приоритеты sitemap.xml
```
priority 1.0   → /
priority 0.95  → /club, /marathon
priority 0.9   → /blog, /recipes, /menyu, /about, /results
priority 0.85  → хабы SILO + категории рецептов/меню
priority 0.8   → подкатегории блога
priority 0.75  → статьи блога
priority 0.7   → карточки рецептов
priority 0.6   → /partner, /free
```

### E-E-A-T требования
- **Byline на каждой статье:** "Наталья Томшина, нутрициолог" → `/about`
- **Медицинский дисклеймер** на всех страницах здоровья
- **Schema.org разметка:** Person, Organization, Article, Recipe
- **Источники:** ссылки на PubMed в каждой статье
- **Страница автора** `/about` с сертификатами и образованием

---

## 📈 ПЛАН НАПОЛНЕНИЯ (4 этапа)

### ЭТАП 1 (месяцы 1-3): Базовые SILO — 120 статей
**Приоритет:** SILO 1 (Похудение), SILO 2 (Гормоны), SILO 6 (Меню/рационы)
- 40 статей в SILO "Похудение"
- 18 статей в SILO "Гормоны"
- 30 статей в SILO "Меню и рационы"
- 40 рецептов с SEO-категориями

### ЭТАП 2 (месяцы 3-6): Расширение — 220 статей
- Дозаполнение SILO 1, 2, 6 до 15+ статей/подкатегория
- SILO 4 (Здоровье): 30 статей
- SILO 3 (Методы): 25 статей
- SILO 5 (БАДы): 20 статей
- 80 рецептов + 10 историй

### ЭТАП 3 (месяцы 6-9): Закрытие пробелов — 350+ статей
- Все долистайные подкатегории
- Перекрёстная перелинковка между SILO
- Обновление pillar-страниц

### ЭТАП 4 (9+ месяцев): Доминирование — 400+ статей
- Внешний линкбилдинг
- Обновления для freshness
- E-E-A-T усиление

**Прогноз:** 5К → 100К+ показов/мес за год

---

## 🎯 КЛЮЧЕВЫЕ ПРИНЦИПЫ КОНТЕНТА

### Обязательная структура статьи
1. **H1** — точная формулировка запроса
2. **Intro** 100-150 слов (ответ в первом абзаце)
3. **4-6 H2** с подзаголовками H3
4. **Списки и таблицы** (минимум 1 таблица)
5. **FAQ блок** (3-5 вопросов)
6. **Byline автора** с ссылкой на `/about`
7. **Медицинский дисклеймер**
8. **Источники** (3-5 на PubMed)
9. **Внутренние ссылки** (6-8 штук)

### Внутренняя перелинковка
- **Вверх:** ссылка на родительскую подкатегорию
- **Боковые:** 2-3 статьи той же подкатегории  
- **Кросс:** 1 статья из смежного SILO
- **Рецепты:** 1 ссылка на подходящую категорию
- **Автор:** ссылка на `/about` в byline
- **CTA:** 3 ссылки на `/club` (середина, конец, sidebar)

---

## 📊 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### Через 3 месяца
- **120 статей** опубликовано
- **5-8 тыс показов/мес** в Яндексе
- **Топ-30** по НЧ запросам

### Через 6 месяцев  
- **220 статей** опубликовано
- **20-30 тыс показов/мес**
- **Топ-10** по СЧ запросам в подкатегориях

### Через 9 месяцев
- **350+ статей** опубликовано  
- **50-70 тыс показов/мес**
- **Топ-5** по ВЧ запросам в хабах SILO

### Через 12 месяцев
- **400+ статей**
- **100+ тыс показов/мес**
- **Доминирование** в нише "питание для женского здоровья"
- **50%+ трафика** в клуб идёт с органики

---

## ✅ СТАТУС РЕАЛИЗАЦИИ

**Инфраструктура:** ✅ Готова
- [x] Лендинги перенесены в public-site
- [x] SEO-роутинг настроен через proxy.ts
- [x] Страница автора `/about` создана
- [x] 404 страница для публичного сайта
- [x] Медицинский дисклеймер `/legal/disclaimer`

**Разделы:** ✅ Готовы
- [x] Блог `/blog` с 7 SILO
- [x] Рецепты `/recipes` с 8 категориями  
- [x] Рационы `/menyu` с 6 категориями
- [x] Результаты `/results` хаб

**Меню и навигация:** ✅ Готова
- [x] Главное меню с 8 разделами
- [x] Футер с 4 колонками
- [x] Хлебные крошки на всех страницах

**SEO-файлы:** ✅ Готовы
- [x] robots.txt с правильными Allow/Disallow
- [x] Генерация sitemap.xml
- [x] Schema.org разметка

**Готовность к наполнению:** ✅ 100%

Структура полностью готова для создания контента по плану ЭТАПА 1.

---

*Документ создан: 17 апреля 2026  
Архитектор: SEO-специалист на базе методологии "SEO Монстр 2020" + актуальных практик 2026*