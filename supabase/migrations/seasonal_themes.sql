-- ============================================================
-- Миграция: seasonal_themes, birthday_greetings, поля members
-- Выполнить в Supabase SQL Editor: https://supabase.com/dashboard/project/byykvsjamtcklwtnjkpf/sql
-- ============================================================

-- Таблица сезонных тем оформления
create table if not exists seasonal_themes (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  emoji         text not null default '✨',
  particle_type text not null default 'stars',  -- snow | hearts | petals | stars | leaves | confetti
  accent_color  text not null default '#7C5CFC',
  accent_light  text not null default '#F0EEFF',
  start_date    text not null,  -- MM-DD, например '12-15'
  end_date      text not null,  -- MM-DD, например '01-10'
  is_forced     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- RLS: только сервис-роль читает/пишет (мы используем createServiceClient)
alter table seasonal_themes enable row level security;

-- Таблица поздравлений с днём рождения (лог отправленных)
create table if not exists birthday_greetings (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references members(id) on delete cascade,
  year       int not null,
  sent_at    timestamptz not null default now(),
  unique (member_id, year)
);

alter table birthday_greetings enable row level security;

-- Поля в таблице members (добавляем если не существуют)
alter table members
  add column if not exists birth_date          date,
  add column if not exists admin_note          text,
  add column if not exists is_manual_subscription boolean not null default false,
  add column if not exists last_expiry_reminder_sent date;
