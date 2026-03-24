-- ============================================================
-- Миграция: таблицы для курсов (intro_courses, intro_lessons, intro_lesson_materials)
-- Выполнить в Supabase SQL Editor: https://supabase.com/dashboard/project/byykvsjamtcklwtnjkpf/sql
-- ============================================================

-- Таблица курсов
create table if not exists intro_courses (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null, -- 'intro' | 'stop-diabet'
  title       text not null,
  description text,
  sort_order  int default 0
);

-- Уроки курса
create table if not exists intro_lessons (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid references intro_courses(id) on delete cascade,
  sort_order      int not null,
  title           text not null,
  lesson_type     text default 'video', -- 'video' | 'text'
  video_url       text,                 -- полная ссылка kinescope (https://kinescope.io/ID)
  bonus_video_url text,                 -- необязательное бонус-видео
  text_content    text,                 -- для текстовых уроков
  is_visible      boolean default true,
  created_at      timestamptz default now()
);

-- PDF-материалы к урокам
create table if not exists intro_lesson_materials (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid references intro_lessons(id) on delete cascade,
  title      text not null,
  url        text not null,
  sort_order int default 0
);

-- RLS
alter table intro_courses           enable row level security;
alter table intro_lessons           enable row level security;
alter table intro_lesson_materials  enable row level security;

-- Участницы могут читать курсы и видимые уроки
create policy "intro_courses_read" on intro_courses
  for select to authenticated using (true);

create policy "intro_lessons_read" on intro_lessons
  for select to authenticated using (is_visible = true);

create policy "intro_lesson_materials_read" on intro_lesson_materials
  for select to authenticated using (true);

-- ============================================================
-- Начальные данные: Вводный курс «Волшебный пендель»
-- ============================================================
insert into intro_courses (slug, title, description, sort_order)
values
  ('intro',       'Волшебный пендель', 'Основы метода Натальи — от правильной тарелки до первого рациона', 1),
  ('stop-diabet', 'Стоп Диабет',       'Лечебное питание для восстановления здоровья и снижения сахара', 2)
on conflict (slug) do nothing;

-- Уроки вводного курса
with c as (select id from intro_courses where slug = 'intro')
insert into intro_lessons (course_id, sort_order, title, lesson_type, video_url, bonus_video_url, text_content)
select c.id, s.sort_order, s.title, s.lesson_type, s.video_url, s.bonus_video_url, s.text_content
from c, (values
  (0, 'О практикуме', 'text', null, null,
   E'Здравствуйте! Я Наталья Томшина, нутрициолог и основатель Клуба «Вкус Жизни».\n\nНа этом курсе вы узнаете правило волшебной тарелки, самый важный гормон похудения, научитесь выбирать продукты и перестанете постоянно думать о еде.\n\nНичего сложного — просто смотрите уроки и выполняйте простые задания. Я верю, что у вас всё получится! 💚'),
  (1, 'Правильная тарелка для похудения',    'video', 'https://kinescope.io/maqDNYomrqnC2hbBwxR4kW', 'https://kinescope.io/w7m6j1upAnWuiHFhSDfdSy', null),
  (2, 'Продукты, помогающие снижать вес',    'video', 'https://kinescope.io/vAggowP18q2yqVqrnUmHiN', null, null),
  (3, 'Порции',                              'video', 'https://kinescope.io/2VpTvSt1vtj1dDMZvdqLe3', null, null),
  (4, 'Вода, как лекарство',                 'video', 'https://kinescope.io/cK1X2ZtWXeU1oannqx53Po', null, null),
  (5, 'Привычки до и после еды',             'video', 'https://kinescope.io/iHcVVctpX1JswGz1zRxmZk', null, null),
  (6, 'Перекусы — главный враг стройности',  'video', 'https://kinescope.io/5eKCzuJspnBA1NY6ZfY78D', null, null),
  (7, 'У вас точно всё получится',           'text',  null, null, null)
) as s(sort_order, title, lesson_type, video_url, bonus_video_url, text_content);

-- Уроки курса Стоп Диабет
with c as (select id from intro_courses where slug = 'stop-diabet')
insert into intro_lessons (course_id, sort_order, title, lesson_type, video_url)
select c.id, s.sort_order, s.title, 'video', s.video_url
from c, (values
  (1, 'Почему врачи не лечат диабет',                        'https://kinescope.io/dd4GGZqrnhmonz7eKxZ4QY'),
  (2, 'Потеряла 4 года здоровья — история моей мамы',        'https://kinescope.io/jMG7tWCwz9923ePBH6dXXJ'),
  (3, 'Почему диетические продукты не помогают похудеть',    'https://kinescope.io/rnL6XJD9ATRfEmFMvEfyCC'),
  (4, 'Лечебное питание для восстановления здоровья',        'https://kinescope.io/75oRf7iiPyQRaAT1QKFXNK')
) as s(sort_order, title, video_url);

-- Финальный урок Стоп Диабет
with c as (select id from intro_courses where slug = 'stop-diabet')
insert into intro_lessons (course_id, sort_order, title, lesson_type)
select c.id, 5, 'Ваш следующий шаг', 'text' from c;
