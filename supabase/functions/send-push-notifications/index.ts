// supabase/functions/send-push-notifications/index.ts
// Запускается каждый день в 10:00 через pg_cron или Supabase scheduler
// Отправляет push за 3 дня до списания подписки

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push';

// Web Push через VAPID
const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT     = 'mailto:support@checkursubs.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// ─── sendPush: шифрует payload и отправляет по Web Push (RFC 8291) ─────────────
async function sendPush(subscription: any, payload: object): Promise<boolean> {
  const sub = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    return true;
  } catch (e: any) {
    // 410 Gone / 404 — подписка устарела, можно удалять из БД
    if (e?.statusCode === 410 || e?.statusCode === 404) {
      console.warn('Stale subscription:', sub.endpoint);
    } else {
      console.error('Push error:', e?.statusCode, e?.body);
    }
    return false;
  }
}

// ─── Вспомогательные типы ─────────────────────────────────────────────────────
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Типы сервисов для детекции дублей (должны совпадать с SERVICE_CATALOG во фронте)
const SERVICE_TYPES: Record<string, string> = {
  'Spotify': 'music', 'Apple Music': 'music', 'VK Музыка': 'music', 'Яндекс Плюс': 'music',
  'YouTube Premium': 'music',
  'Netflix': 'video', 'Disney+': 'video', 'HBO Max': 'video', 'Hulu': 'video',
  'Amazon Prime': 'video', 'Paramount+': 'video', 'Apple TV+': 'video',
  'Кинопоиск': 'video', 'START': 'video', 'Иви': 'video',
  'Claude Pro': 'ai', 'ChatGPT Plus': 'ai', 'Cursor': 'ai', 'Perplexity': 'ai',
  'iCloud': 'storage', 'Google One': 'storage', 'Dropbox': 'storage',
};

function getServiceType(name: string): string | null {
  return SERVICE_TYPES[name] ?? null;
}

// Горизонты уведомлений: за сколько дней и какой текст
const HORIZONS = [
  { days: 3, label: () => `через 3 дня` },
  { days: 2, label: () => `послезавтра`  },
  { days: 1, label: () => `завтра`       },
] as const;

// Возвращает день и месяц целевой даты (today + offsetDays)
function targetDate(today: Date, offsetDays: number) {
  const d = new Date(today);
  d.setDate(today.getDate() + offsetDays);
  return { day: d.getDate(), month: d.getMonth() };
}

// Считает реальную сумму списания за конкретный месяц для одной подписки
function billingAmountForMonth(s: any, year: number, month: number): number {
  if (s.status === 'paused' || s.status === 'trial') return 0;
  if (!s.date) return 0;
  const parts = String(s.date).trim().split(' ');
  const billingDay = parseInt(parts[0]);
  if (isNaN(billingDay)) return 0;
  if (s.period === 'monthly') return Number(s.price ?? 0);
  if (s.period === 'yearly') {
    const billingMonth = parts[1] ? MONTHS_SHORT.indexOf(parts[1]) : -1;
    if (billingMonth === month) return Number(s.price ?? 0);
  }
  return 0;
}

// ─── Основная логика ──────────────────────────────────────────────────────────
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date();
  const todayDay   = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear  = today.getFullYear();

  // Предвычисляем все три горизонта сразу
  const horizons = HORIZONS.map(h => ({ ...h, ...targetDate(today, h.days) }));

  // Получаем все push-подписки
  const { data: pushSubs } = await supabase
    .from('push_subscriptions')
    .select('user_id, subscription');

  if (!pushSubs?.length) return new Response('No subscribers', { status: 200 });

  let sent = 0;

  for (const ps of pushSubs) {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', ps.user_id);

    if (!subs?.length) continue;

    // ── 1. Напоминания о списаниях (3/2/1 день) ────────────────────────────
    const byHorizon = new Map<number, string[]>();

    for (const s of subs) {
      if (s.status === 'paused') continue;

      if (s.status === 'trial' && s.trial_end) {
        const end      = new Date(s.trial_end);
        const endDay   = end.getDate();
        const endMonth = end.getMonth();
        for (const h of horizons) {
          if (endDay === h.day && endMonth === h.month) {
            const list = byHorizon.get(h.days) ?? [];
            list.push(`⏰ Пробный период «${s.name}» заканчивается ${h.label()}`);
            byHorizon.set(h.days, list);
          }
        }
        continue;
      }

      if (!s.date) continue;
      const parts        = String(s.date).trim().split(' ');
      const billingDay   = parseInt(parts[0]);
      const billingMonth = parts[1] ? MONTHS_SHORT.indexOf(parts[1]) : -1;

      for (const h of horizons) {
        const matches =
          s.period === 'monthly'
            ? billingDay === h.day
            : s.period === 'yearly'
              ? billingDay === h.day && billingMonth === h.month
              : false;
        if (matches) {
          const list = byHorizon.get(h.days) ?? [];
          list.push(`💳 «${s.name}» спишется ${h.label()}`);
          byHorizon.set(h.days, list);
        }
      }
    }

    for (const [days, messages] of byHorizon) {
      const body = messages.length === 1
        ? messages[0]
        : `${messages[0]} и ещё ${messages.length - 1}`;
      const { day } = horizons.find(h => h.days === days)!;
      const ok = await sendPush(ps.subscription, {
        title: 'CheckUrSubs',
        body,
        tag:   `payment-${ps.user_id}-d${days}-${day}`,
        url:   '/',
      });
      if (ok) sent++;
    }

    // ── 2. Инсайт: итог месяца (28-е число каждого месяца) ─────────────────
    if (todayDay === 28) {
      const total = subs.reduce((sum, s) => sum + billingAmountForMonth(s, todayYear, todayMonth), 0);
      const activeSubs = subs.filter(s => s.status === 'active' || !s.status);
      if (total > 0 && activeSubs.length > 0) {
        // Берём валюту первой активной подписки как ориентир (или USD)
        const currency = activeSubs[0]?.currency_code || 'USD';
        const symbol   = currency === 'RUB' ? '₽' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
        const ok = await sendPush(ps.subscription, {
          title: 'CheckUrSubs',
          body:  `📊 В этом месяце уходит ${symbol}${Math.round(total)} на подписки`,
          tag:   `monthly-summary-${ps.user_id}-${todayYear}-${todayMonth}`,
          url:   '/analytics',
        });
        if (ok) sent++;
      }
    }

    // ── 3. Инсайт: дубли (только 1-го числа месяца, не чаще) ───────────────
    if (todayDay === 1) {
      const activeSubs = subs.filter(s => s.status === 'active' || !s.status);

      // Группируем по serviceType
      const byType = new Map<string, string[]>();
      for (const s of activeSubs) {
        const type = getServiceType(s.name);
        if (!type) continue;
        const list = byType.get(type) ?? [];
        list.push(s.name);
        byType.set(type, list);
      }

      for (const [type, names] of byType) {
        if (names.length < 2) continue;

        let body = '';
        if (type === 'music' && names.length >= 2) {
          body = `🎵 У тебя ${names.length} музыкальных сервиса (${names.join(', ')}). Обычно хватает одного.`;
        } else if (type === 'video' && names.length >= 3) {
          body = `🎬 У тебя ${names.length} видеосервиса одновременно. Попробуй использовать их по очереди — сэкономишь.`;
        } else if (type === 'ai' && names.length >= 2) {
          body = `🤖 У тебя ${names.length} AI-подписки (${names.join(', ')}). Возможно, хватит одной.`;
        } else if (type === 'storage' && names.length >= 2) {
          body = `☁️ У тебя ${names.length} облачных хранилища. Возможно, можно объединить.`;
        }

        if (!body) continue;

        const ok = await sendPush(ps.subscription, {
          title: 'CheckUrSubs',
          body,
          tag:   `insight-${type}-${ps.user_id}-${todayYear}-${todayMonth}`,
          url:   '/',
        });
        if (ok) sent++;
      }
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
