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

CheckUrSubs помогает держать под контролем все подписки — стриминги, облака, сервисы, операторы связи. Видишь общую сумму, ближайшие списания и историю по месяцам.

Работает как PWA — устанавливается на домашний экран iPhone и Android без App Store.

---

## Возможности

- 📊 **Дашборд** — общая сумма в месяц и в год, список всех подписок
- 📅 **Календарь** — когда и сколько спишется, с разбивкой по дням
- ⏰ **Скоро** — ближайшие списания в течение 7 дней
- 📈 **Аналитика** — расходы по категориям с прогресс-барами
- 🌍 **Мультивалютность** — RUB, USD, EUR, GBP и другие с актуальным курсом
- 🔖 **Категории** — Развлечения, Работа, Интернет, Игры, Обучение, VPN, Здоровье, Банкинг, Связь, Другое
- 🔍 **Автодополнение** — распознаёт популярные сервисы и подставляет логотип
- 🔐 **Авторизация** — email или Google OAuth
- 📲 **PWA** — офлайн, иконка на экране, без браузерного UI

---

## Стек

| Слой | Технология |
|------|-----------|
| UI | React 19, Tailwind CSS 4, Framer Motion |
| Сборка | Vite 7 |
| Backend | Supabase (Postgres + Auth + RLS) |
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

Миграция находится в `supabase_migration.sql`. Запустить в Supabase SQL Editor.

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
created_at    timestamptz
```

Row Level Security включён — каждый пользователь видит только свои данные.

---

## Деплой

```bash
# Preview
vercel

# Production
vercel --prod
```

Env vars нужно добавить в Vercel Dashboard → Settings → Environment Variables.

---

## Установка как PWA

**iPhone:** открыть в Safari → кнопка «Поделиться» → «На экран домой»

**Android:** открыть в Chrome → меню → «Добавить на главный экран»

---

## Лицензия

MIT
