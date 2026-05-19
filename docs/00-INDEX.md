# 🧠 Мозг проекта «Клуб Вкус Жизни»

База знаний по всему проекту. Открывается в Obsidian.

## Быстрые ссылки

- [[01-quickstart|🚀 Быстрый старт]] — основные команды, доступы
- [[08-roadmap/todo|📋 Открытые задачи]]
- [[07-sessions/INDEX|📜 Хронология сессий]]

## Структура

| Раздел | Что внутри |
|---|---|
| [[02-public-site/INDEX\|🌍 Публичный сайт]] | `nata-tomshina.ru` — лендинги, блог, виджеты |
| [[03-club/INDEX\|🏠 Клуб]] | `club.nata-tomshina.ru` — закрытая часть для участниц |
| [[04-admin/INDEX\|🔐 Админка]] | `club.nata-tomshina.ru/admin` — управление |
| [[05-infrastructure/INDEX\|⚙️ Инфраструктура]] | сервер, БД, email, платежи, DNS |
| [[06-operations/INDEX\|🛠 Операции]] | типовые команды, SQL, процедуры |
| [[07-sessions/INDEX\|📜 Сессии]] | хронология работы с Claude |
| [[08-roadmap/INDEX\|🗺 Roadmap]] | планы, идеи, технический долг |

## Технологический стек

- **Frontend:** Next.js 14+ (App Router), React, Tailwind CSS
- **Backend:** Next.js API routes + Supabase (self-hosted)
- **БД:** PostgreSQL через Supabase
- **Хостинг:** свой сервер `155.212.130.228`, Docker Compose
- **Email:** Beget SMTP (рассылки) + Resend (OTP — наследие, мигрируем)
- **Платежи:** CloudPayments (рекуррент + разовые), Prodamus (legacy)
- **DNS:** Cloudflare
- **Домены:** `nata-tomshina.ru` (публичный) + `club.nata-tomshina.ru` (клуб)

## Правила работы с Vault

См. [[_templates/CLAUDE-RULES|Правила для Claude Code]]
