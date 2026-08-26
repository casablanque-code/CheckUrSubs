import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { urlBase64ToUint8Array } from '../lib/push';
import { analytics } from '../lib/analytics';

const VAPID_PUBLIC_KEY = 'BI--t_Ek8gyvTt8tn9LTcceNQgrw7u_e1NQFkrFpSqGZ7s2VBJK2hQ2wPfLJ7lckNBiCRqWno1-jg2Qy4qNXvmo';

// Баннер запроса push-разрешения: показывается через 3с после входа, если
// разрешение ещё не решено и юзер раньше не закрывал баннер. Логика 1:1.
export const usePushNotifications = (userId) => {
  const [pushBanner, setPushBanner] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission === 'granted') return; // уже разрешено
    if (Notification.permission === 'denied') return;  // уже отклонено
    if (localStorage.getItem('pushBannerDismissed')) return;
    // Показываем через 3 секунды после входа — не сразу
    const t = setTimeout(() => setPushBanner(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const subscribePush = async () => {
    try {
      // Явно запрашиваем разрешение — часть браузеров не спасает без этого
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushBanner(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      // Сохраняем подписку в Supabase
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        subscription: JSON.stringify(sub.toJSON()), // toJSON() гарантирует { endpoint, keys: { p256dh, auth } }
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      setPushBanner(false);
      analytics.pushEnabled();
    } catch (e) {
      console.error('Push subscribe error:', e);
      setPushBanner(false);
    }
  };

  const dismissPushBanner = () => {
    localStorage.setItem('pushBannerDismissed', '1');
    setPushBanner(false);
    analytics.pushDismissed();
  };

  return { pushBanner, subscribePush, dismissPushBanner };
};
