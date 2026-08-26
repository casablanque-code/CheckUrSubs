// ─── История изменения цены подписки ────────────────────────────────────────
// Сервисы тихо поднимают цену — юзер обычно узнаёт об этом только по
// списанию в банке. Пишем каждое изменение price/currency_code в
// price_history (jsonb-массив на строке subscriptions), новые записи
// в начало, старые обрезаем.

const MAX_ENTRIES = 20;

// Возвращает новый price_history с добавленной записью о СТАРОЙ цене,
// если цена или валюта реально изменились. Иначе возвращает history
// без изменений (та же ссылка, если ничего не менялось — иначе новый
// массив, но без добавленной записи).
export const withPriceChange = (prevSub, nextPrice, nextCurrencyCode) => {
  const history = Array.isArray(prevSub?.price_history) ? prevSub.price_history : [];
  const prevPrice    = Number(prevSub?.price ?? 0);
  const prevCurrency = prevSub?.currency_code || 'USD';
  const changed = prevPrice !== Number(nextPrice) || prevCurrency !== nextCurrencyCode;
  if (!prevSub || !changed || prevPrice <= 0) return history;

  const entry = {
    price: prevPrice,
    currency_code: prevCurrency,
    changed_at: new Date().toISOString(),
  };
  return [entry, ...history].slice(0, MAX_ENTRIES);
};

// Последнее изменение цены подписки: откуда, куда, на сколько % — или
// null, если история пуста или валюта менялась (сравнивать % между
// разными валютами бессмысленно без конвертации).
export const getLastPriceChange = (sub) => {
  const history = sub?.price_history;
  if (!Array.isArray(history) || history.length === 0) return null;

  const last = history[0];
  const currentPrice = Number(sub.price ?? 0);
  if (!last || last.currency_code !== sub.currency_code || currentPrice <= 0 || last.price <= 0) return null;

  const pct = ((currentPrice - last.price) / last.price) * 100;
  if (pct === 0) return null;

  return {
    from: last.price,
    to: currentPrice,
    currencyCode: last.currency_code,
    changedAt: last.changed_at,
    pct,
  };
};
