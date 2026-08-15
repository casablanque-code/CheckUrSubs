import { useState, useEffect } from 'react';
import { getCurrency, DEFAULT_RATES, fetchRates, loadRates, toUSD, monthlyUSD } from '../lib/currency';

// Валюта, курсы и все денежные форматтеры — раньше жили прямо в App.
// Поведение сохранено 1:1, включая порядок эффектов.
export const useCurrency = (lang) => {
  const [currency,     setCurrencyState] = useState(() => {
    const saved = localStorage.getItem('currency');
    if (saved) return saved;
    return lang === 'ru' ? 'RUB' : 'USD';
  });
  const [rates,        setRates]        = useState(() => loadRates() || DEFAULT_RATES);
  const [ratesLoading, setRatesLoading] = useState(false);

  // При смене языка — менять валюту на дефолт, если юзер не выбирал вручную.
  // currencyManual живёт в localStorage, а не в React state, так что это
  // не сводится к чистой derived-величине от lang — реально нужен эффект,
  // реагирующий на смену внешнего prop (lang приходит из Root).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!localStorage.getItem('currencyManual')) {
      setCurrencyState(lang === 'ru' ? 'RUB' : 'USD');
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [lang]);

  // Курсы валют — первичная загрузка при маунте. Стандартный паттерн
  // "флаг загрузки + fetch во внешнюю систему", не переписываю ради линта.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const cached = loadRates();
    if (!cached) { setRatesLoading(true); fetchRates().then(r => { if (r) setRates(r); setRatesLoading(false); }); }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (localStorage.getItem('currencyManual')) {
      localStorage.setItem('currency', currency);
    }
  }, [currency]);

  // Пользователь явно выбрал валюту (CurrencySelector) — запоминаем это
  // отдельно от смены currency по смене языка выше.
  const setCurrencyManual = (code) => {
    setCurrencyState(code);
    localStorage.setItem('currencyManual', '1');
  };

  const refreshRates = () => {
    setRatesLoading(true);
    fetchRates().then(r => { if (r) setRates(r); setRatesLoading(false); });
  };

  const curr = getCurrency(currency);
  const rate = rates[currency] ?? DEFAULT_RATES[currency] ?? 1;

  const fmt = (usd) => {
    const v = usd * rate;
    const formatted = v % 1 === 0
      ? Math.round(v).toLocaleString('ru-RU')
      : v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${curr.symbol}${formatted}`;
  };

  // Удобная обёртка с текущими курсами
  const monthly = (sub) => monthlyUSD(sub, rates);

  // Реальная сумма списания: для годовых — полная, для месячных — месячная
  const realUSD = (sub) => toUSD(sub.price ?? sub.price_usd ?? sub.priceUSD ?? 0, sub.currency_code || 'USD', rates);
  const fmtReal = (sub) => fmt(sub.period === 'yearly' ? realUSD(sub) : monthly(sub));

  // Оригинальная цена подписки — всегда в той валюте, в которой добавлена
  const fmtOriginal = (sub) => {
    const p    = Number(sub.price ?? sub.price_usd ?? sub.priceUSD ?? 0);
    const code = sub.currency_code || 'USD';
    const c    = getCurrency(code);
    return `${c.symbol}${p % 1 === 0 ? p.toFixed(0) : p.toFixed(2)}`;
  };

  return {
    currency, setCurrencyManual,
    rates, ratesLoading, refreshRates,
    fmt, monthly, realUSD, fmtReal, fmtOriginal,
  };
};
