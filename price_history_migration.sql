-- price_history_migration.sql
-- Добавляет колонку price_history в subscriptions: массив прошлых цен,
-- на случай если сервис тихо поднял стоимость. Пишется в приложении
-- (see src/lib/priceHistory.js) при каждом изменении price/currency_code.
--
-- Формат: [{ "price": 500, "currency_code": "RUB", "changed_at": "2026-08-26T..." }, ...]
-- Новые записи — в начале массива, максимум 20 хранится на клиенте.
--
-- Run once in the Supabase SQL Editor.

alter table subscriptions
  add column if not exists price_history jsonb not null default '[]'::jsonb;
