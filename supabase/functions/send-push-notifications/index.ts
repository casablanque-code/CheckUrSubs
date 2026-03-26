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

// Горизонты уведомлений: за сколько дней и какой текст
const HORIZONS = [
  { days: 3, label: (name: string) => `через 3 дня` },
  { days: 2, label: (name: string) => `послезавтра`  },
  { days: 1, label: (name: string) => `завтра`       },
] as const;

// Возвращает день и месяц целевой даты (today + offsetDays)
function targetDate(today: Date, offsetDays: number) {
  const d = new Date(today);
  d.setDate(today.getDate() + offsetDays);
  return { day: d.getDate(), month: d.getMonth() };
}

// ─── Основная логика ──────────────────────────────────────────────────────────
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date();

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

    // Собираем уведомления по всем горизонтам
    // Структура: Map<horizonDays, string[]> — чтобы не слать три пуша подряд,
    // а объединить подписки одного горизонта в одно сообщение
    const byHorizon = new Map<number, string[]>();

    for (const s of subs) {
      if (s.status === 'paused') continue;

      if (s.status === 'trial' && s.trial_end) {
        const end = new Date(s.trial_end);
        const endDay   = end.getDate();
        const endMonth = end.getMonth();

        for (const h of horizons) {
          if (endDay === h.day && endMonth === h.month) {
            const list = byHorizon.get(h.days) ?? [];
            list.push(`⏰ Пробный период «${s.name}» заканчивается ${h.label(s.name)}`);
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
          list.push(`💳 «${s.name}» спишется ${h.label(s.name)}`);
          byHorizon.set(h.days, list);
        }
      }
    }

    if (!byHorizon.size) continue;

    // Отправляем отдельный пуш для каждого горизонта
    // (3 дня, 2 дня, 1 день — разные tag, не перекрывают друг друга)
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
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
