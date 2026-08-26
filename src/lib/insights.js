import { getCatalogEntry } from './serviceCatalog';

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
