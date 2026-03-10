# CheckUrSubs 📱

> Минималистичный трекер подписок. Знай сколько тратишь — каждый месяц.

![PWA](https://img.shields.io/badge/PWA-ready-blueviolet)
![React](https://img.shields.io/badge/React-19-61dafb)
![Vite](https://img.shields.io/badge/Vite-7-646cff)
![Supabase](https://img.shields.io/badge/Supabase-green)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

**[→ Открыть приложение](https://checkursubs.vercel.app)**

---

## О проекте

CheckUrSubs помогает держать под контролем все подписки — стриминги, облака, сервисы, операторы связи. Видишь общую сумму, ближайшие списания и разбивку по категориям.

Работает как PWA — устанавливается на домашний экран iPhone и Android без App Store.

---

## Возможности

### Основное
- 📊 **Дашборд** — общая сумма в месяц, год и день; список всех подписок
- 📅 **Календарь** — когда и сколько спишется, с разбивкой по дням и суммой месяца
- ⏰ **Скоро** — ближайшие списания в течение 7 дней
- 📈 **Аналитика** — расходы по категориям и сервисам с прогресс-барами
- 🌍 **Мультивалютность** — RUB, USD, EUR, GBP, AED и другие с актуальным курсом

### Подписки
- 🔖 **11 категорий** — Развлечения, Работа, Интернет, Игры, Обучение, VPN, Здоровье, Банкинг, Связь, ИИ, Другое
- 🔍 **Автодополнение** — распознаёт 60+ популярных сервисов, подставляет логотип и категорию
- 📆 **Месячные и годовые** подписки с корректным расчётом стоимости
- ↔️ **Свайп-жесты** — влево для удаления, вправо для редактирования
- ↩️ **Отмена удаления** — 5 секунд чтобы передумать

### Статусы подписок
- ✅ **Активна** — считается в суммах и отображается в календаре
- ⏸️ **На паузе** — не считается, скрыта из календаря
- 🔬 **Пробный период** — отображается в календаре до даты окончания, не считается в суммах; автоматически становится активной после окончания с датой списания = дата окончания пробного

### UX
- 🎨 **Тёмный дизайн** — нативный вид, без лишнего
- 🔐 **Авторизация** — email или Google OAuth
- 📲 **PWA** — офлайн-кэш, иконка на экране, без браузерного UI
- 🔔 **Push-уведомления** — напоминание за 3 дня до списания и окончания пробного периода
- 🧭 **Онбординг** — 6 слайдов с инструкцией, включая установку PWA
- 📭 **Empty state** — красивый экран когда подписок нет

---

## Стек

| Слой | Технология |
|------|-----------|
| UI | React 19, Tailwind CSS 4, Framer Motion |
| Сборка | Vite 7 |
| Backend | Supabase (Postgres + Auth + RLS + Edge Functions) |
| Push | Web Push API + VAPID + Supabase Edge Functions + pg_cron |
| Мониторинг | Sentry (ошибки + replays) |
| Аналитика | PostHog (события, воронки, retention) |
| Деплой | Vercel |
| Иконки | Lucide React |

---

## Запуск локально

```bash
# Клонировать
git clone https://github.com/casablanque-code/CheckUrSubs.git
cd CheckUrSubs

# Установить зависимости
npm install

# Создать .env файл
cp .env.example .env
# Вписать VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY

# Запустить
npm run dev
```

---

## Переменные окружения

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Получить их можно в [Supabase Dashboard](https://supabase.com) → Settings → API.

---

## База данных

Основная миграция — `supabase_migration.sql`.
Push-подписки — `push_migration.sql`.
Запустить в Supabase SQL Editor.

Схема таблицы `subscriptions`:

```sql
id            uuid primary key
user_id       uuid references auth.users
name          text
price         numeric
currency_code text
date          text        -- день списания, формат "8 Mar"
period        text        -- 'monthly' | 'yearly'
category      text
logo          text
status        text        -- 'active' | 'paused' | 'trial'
trial_end     date        -- дата окончания пробного периода
created_at    timestamptz
```

Схема таблицы `push_subscriptions`:

```sql
id            uuid primary key
user_id       uuid references auth.users
subscription  text        -- JSON Web Push subscription object
updated_at    timestamptz
```

Row Level Security включён — каждый пользователь видит только свои данные.

---

## Push-уведомления

Реализованы через Web Push API + VAPID.

**Деплой Edge Function:**
```bash
supabase functions deploy send-push-notifications --project-ref YOUR_REF
```

**Секреты в Supabase:**
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

**Расписание** — pg_cron запускает функцию каждый день в 10:00 UTC (`push_cron.sql`).

Функция отправляет уведомление за 3 дня до:
- Даты списания активной подписки
- Окончания пробного периода

---

## Деплой

```bash
# Preview
vercel

# Production
vercel --prod
```

Env vars добавить в Vercel Dashboard → Settings → Environment Variables.

---

## Установка как PWA

**iPhone:** открыть в Safari → кнопка «Поделиться» → «На экран домой»

**Android:** открыть в Chrome → меню → «Установить приложение»

> Уведомления на iOS работают только при установке как PWA (iOS 16.4+)

---

## Мониторинг

- **Sentry** — отлавливает JS-ошибки, необработанные Promise rejections, падения Service Worker. Включает Session Replay при ошибках.
- **PostHog** — отслеживает ключевые события: добавление/удаление подписок, переключение вкладок, смену валюты, прохождение онбординга, включение push.

---

## Лицензия

MIT
