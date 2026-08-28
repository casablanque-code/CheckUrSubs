import { getCatalogEntry } from './serviceCatalog';
import { extractBillingDay, extractBillingMonth } from './billing';
import { toUSD } from './currency';

// ─── Инсайты по подпискам ────────────────────────────────────────────────────
// Та же логика детекта дублей, что в supabase/functions/send-push-notifications
// (инсайт раз в месяц, 1-го числа), но здесь считается на клиенте из уже
// загруженных подписок — так юзер видит его в приложении всегда, а не только
// если разрешил push и не пропустил день отправки.
//
// ВАЖНО: пороги (music>=2, video>=3, ai>=2, storage>=2) должны совпадать с
// supabase/functions/send-push-notifications/index.ts — при правке одного
// стоит проверить и второе.
const THRESHOLDS = { music: 2, video: 3, ai: 2, storage: 2 };

// group -> [{id, name}] активных подписок этого типа
export const getDuplicateGroups = (subscriptions) => {
  const active = (subscriptions || []).filter(s => s.status === 'active' || !s.status);
  const byType = new Map();

  for (const sub of active) {
    const entry = getCatalogEntry(sub.name);
    const type = entry?.serviceType;
    if (!type) continue;
    const list = byType.get(type) ?? [];
    list.push({ id: sub.id, name: sub.name });
    byType.set(type, list);
  }

  const result = [];
  for (const [type, subs] of byType) {
    const threshold = THRESHOLDS[type];
    if (threshold && subs.length >= threshold) result.push({ type, subs });
  }
  // Стабильный порядок для UI
  const order = ['music', 'video', 'ai', 'storage'];
  return result.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
};

// ─── Возможности сэкономить (годовая оплата / семейные тарифы) ─────────────
// Данные из SERVICE_CATALOG (yearlyAvailable / familyAvailable) — это факт
// о том, что у сервиса ЕСТЬ такой тариф в принципе, а не текущая цена или
// размер скидки: те меняются и различаются по региону, поэтому мы их не
// заявляем. UI должен показывать это как общую подсказку "проверить у
// сервиса", а не как гарантированную экономию.

// Активные подписки на месячной оплате, у которых есть годовой тариф
export const getYearlySavingsCandidates = (subscriptions) =>
  (subscriptions || [])
    .filter(s => (s.status === 'active' || !s.status) && s.period !== 'yearly')
    .map(s => ({ id: s.id, name: s.name, entry: getCatalogEntry(s.name) }))
    .filter(s => s.entry?.yearlyAvailable)
    .map(({ id, name }) => ({ id, name }));

// Активные подписки, у которых есть семейный/групповой тариф
export const getFamilyPlanCandidates = (subscriptions) =>
  (subscriptions || [])
    .filter(s => s.status === 'active' || !s.status)
    .map(s => ({ id: s.id, name: s.name, entry: getCatalogEntry(s.name) }))
    .filter(s => s.entry?.familyAvailable)
    .map(({ id, name }) => ({ id, name }));

// ─── Тренд трат месяц-к-месяцу ──────────────────────────────────────────────
// Та же логика начисления, что в графике тренда на Analytics (App.jsx):
// месячные подписки считаются каждый месяц, годовые — только в месяц
// реального списания. Дублируется намеренно (см. аналогичную заметку выше
// про THRESHOLDS) — держать в одном месте потребовало бы вынести это в общий
// хук/модуль вместе с графиком, что за рамки этой фичи.
const monthSpendUSD = (subscriptions, month, rates) =>
  (subscriptions || []).reduce((sum, s) => {
    if (s.status === 'paused') return sum;
    if (s.status === 'trial')  return sum; // пробные не списываются
    if (!extractBillingDay(s.date)) return sum;

    const price = toUSD(s.price ?? 0, s.currency_code || 'USD', rates);
    if (s.period === 'monthly') return sum + price;
    if (s.period === 'yearly') {
      const billingMonth = extractBillingMonth(s.date);
      return billingMonth === month ? sum + price : sum;
    }
    return sum;
  }, 0);

// Сравнение трат текущего месяца с предыдущим. null, если сравнивать не с
// чем (предыдущий месяц — 0) или разница незаметна (округляется в 0%).
export const getSpendTrendInsight = (subscriptions, rates, now = new Date()) => {
  const m = now.getMonth();
  const prevM = m === 0 ? 11 : m - 1;

  const current  = monthSpendUSD(subscriptions, m, rates);
  const previous = monthSpendUSD(subscriptions, prevM, rates);
  if (previous <= 0) return null;

  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;

  return { pct, direction: pct > 0 ? 'up' : 'down' };
};
