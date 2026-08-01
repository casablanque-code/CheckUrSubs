// ─── Валюты ────────────────────────────────────────────────────────────────────
export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'RUB', symbol: '₽', label: 'RUB (₽)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

export const getCurrency = (code) => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];

export const DEFAULT_RATES = { USD: 1, EUR: 0.92, RUB: 90, GBP: 0.79 };

export const fetchRates = async () => {
  try {
    const res  = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data.result !== 'success') return null;
    const { USD, EUR, RUB, GBP } = data.rates;
    const rates = { USD: 1, EUR, RUB, GBP };
    localStorage.setItem('fxRates',   JSON.stringify(rates));
    localStorage.setItem('fxRatesAt', Date.now().toString());
    return rates;
  } catch { return null; }
};

export const loadRates = () => {
  try {
    const raw = localStorage.getItem('fxRates');
    const at  = Number(localStorage.getItem('fxRatesAt') || 0);
    if (raw && Date.now() - at < 4 * 60 * 60 * 1000) return JSON.parse(raw);
  } catch {
    // Битый JSON в localStorage / недоступен localStorage (приватный режим
    // и т.п.) — тихо считаем, что кэша нет, вызывающий код уйдёт на
    // DEFAULT_RATES или явный fetchRates().
  }
  return null;
};

// price в оригинальной валюте → USD для суммирования
export const toUSD = (price, currencyCode, rates) => {
  const rate = rates?.[currencyCode] ?? DEFAULT_RATES[currencyCode] ?? 1;
  return Number(price || 0) / rate;
};

export const monthlyUSD = (sub, rates) => {
  const p = toUSD(sub.price ?? sub.price_usd ?? sub.priceUSD ?? 0, sub.currency_code || 'USD', rates);
  return sub.period === 'yearly' ? p / 12 : p;
};
