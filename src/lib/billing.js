// ─── Константы дат ──────────────────────────────────────────────────────────
export const MONTHS_SHORT    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONTHS_RU       = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

// Короткие названия месяцев по-русски (для дат вида "14 мар")
export const MONTHS_SHORT_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

export const TABS    = ['home', 'calendar', 'analytics'];

// Единая утилита форматирования даты из ISO-строки (trial_end и т.п.)
// Возвращает "14 Mar" для EN и "14 мар" для RU — без смешивания
export const fmtDateFromISO = (isoStr, lang, style = 'short') => {
  const d = new Date(isoStr);
  if (isNaN(d)) return '';
  const day = d.getDate();
  const m   = d.getMonth();
  if (style === 'short') {
    return lang === 'ru' ? `${day} ${MONTHS_SHORT_RU[m]}` : `${day} ${MONTHS_SHORT[m]}`;
  }
  // long — для аналитики и датапикера
  return lang === 'ru'
    ? `${day} ${MONTHS_RU[m].toLowerCase()}`
    : `${day} ${MONTHS_SHORT[m]}`;
};

// ─── Утилиты биллинга ──────────────────────────────────────────────────────────
export const extractBillingDay = (raw) => {
  if (!raw) return null;
  const m = String(raw).match(/\d+/);
  if (!m) return null;
  const d = parseInt(m[0], 10);
  return (Number.isFinite(d) && d >= 1 && d <= 31) ? d : null;
};

// "8 Mar" → 2 (0-based, как Date.getMonth())
export const extractBillingMonth = (raw) => {
  if (!raw) return null;
  const parts = String(raw).trim().split(/\s+/);
  if (parts.length < 2) return null;
  const idx = MONTHS_SHORT.indexOf(parts[1]);
  return idx >= 0 ? idx : null;
};

export const isDueWithinDays = (sub, days = 7) => {
  const now        = new Date();
  const billingDay = sub.billingDay ?? extractBillingDay(sub.date);
  if (!billingDay) return false;

  // Годовые — только если сейчас тот же месяц списания
  if (sub.period === 'yearly') {
    const billingMonth = extractBillingMonth(sub.date);
    if (billingMonth === null || billingMonth !== now.getMonth()) return false;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), billingDay);
  const target = thisMonth >= today ? thisMonth : new Date(today.getFullYear(), today.getMonth() + 1, billingDay);
  const diff = Math.round((target - today) / 86400000);
  return diff >= 0 && diff <= days;
};
