// supabase/functions/send-push-notifications/index.ts
// Запускается каждый день в 10:00 через pg_cron или Supabase scheduler
// Отправляет push за 3 дня до списания подписки

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Web Push через VAPID
const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT     = 'mailto:support@checkursubs.app';

// ─── VAPID JWT helper ─────────────────────────────────────────────────────────
async function makeVapidToken(audience: string): Promise<string> {
  const header  = { alg: 'ES256', typ: 'JWT' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT,
  };
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const sigInput = `${encode(header)}.${encode(payload)}`;

  const keyBytes = Uint8Array.from(
    atob(VAPID_PRIVATE_KEY.replace(/-/g, '+').replace(/_/g, '/') + '=='), c => c.charCodeAt(0)
  );
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    // Оборачиваем raw private key в PKCS8 структуру для ES256 (secp256r1)
    wrapInPkcs8(keyBytes),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(sigInput)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${sigInput}.${sigB64}`;
}

function wrapInPkcs8(rawKey: Uint8Array): ArrayBuffer {
  // EC private key PKCS8 wrapper for P-256
  const prefix = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20,
  ]);
  const result = new Uint8Array(prefix.length + rawKey.length + 2);
  result.set(prefix);
  result.set(rawKey, prefix.length);
  return result.buffer;
}

async function sendPush(subscription: any, payload: object): Promise<boolean> {
  const sub = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
  const endpoint = sub.endpoint;
  const audience = new URL(endpoint).origin;
  const token = await makeVapidToken(audience);

  const body = new TextEncoder().encode(JSON.stringify(payload));

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${token},k=${VAPID_PUBLIC_KEY}`,
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body,
  });
  return res.ok || res.status === 201;
}

// ─── Основная логика ──────────────────────────────────────────────────────────
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today     = new Date();
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);
  const targetDay   = inThreeDays.getDate();
  const targetMonth = inThreeDays.getMonth(); // 0-indexed

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Получаем все push-подписки
  const { data: pushSubs } = await supabase
    .from('push_subscriptions')
    .select('user_id, subscription');

  if (!pushSubs?.length) return new Response('No subscribers', { status: 200 });

  let sent = 0;

  for (const ps of pushSubs) {
    // Получаем подписки юзера
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', ps.user_id);

    if (!subs?.length) continue;

    const toNotify: string[] = [];

    for (const s of subs) {
      // Пропускаем паузные
      if (s.status === 'paused') continue;

      if (s.status === 'trial' && s.trial_end) {
        // Пробные — уведомляем за 3 дня до trial_end
        const end = new Date(s.trial_end);
        if (end.getDate() === targetDay && end.getMonth() === targetMonth) {
          toNotify.push(`⏰ Пробный период «${s.name}» заканчивается через 3 дня`);
        }
        continue;
      }

      // Активные — уведомляем за 3 дня до списания
      if (!s.date) continue;
      const parts = String(s.date).trim().split(' ');
      const billingDay   = parseInt(parts[0]);
      const billingMonth = parts[1] ? MONTHS_SHORT.indexOf(parts[1]) : -1;

      if (s.period === 'monthly') {
        if (billingDay === targetDay) {
          toNotify.push(`💳 «${s.name}» спишется через 3 дня`);
        }
      } else if (s.period === 'yearly') {
        if (billingDay === targetDay && billingMonth === targetMonth) {
          toNotify.push(`💳 «${s.name}» спишется через 3 дня`);
        }
      }
    }

    if (!toNotify.length) continue;

    // Отправляем одно уведомление со всеми подписками
    const body = toNotify.length === 1
      ? toNotify[0]
      : `${toNotify[0]} и ещё ${toNotify.length - 1}`;

    const ok = await sendPush(ps.subscription, {
      title: 'CheckUrSubs',
      body,
      tag:   `payment-${ps.user_id}-${targetDay}`,
      url:   '/',
    });

    if (ok) sent++;
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
