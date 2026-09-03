import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'vpnBannerLastShown';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Разовая "спасибо-плашка" про VPN — не пуш, чисто локальная логика.
// Показываем раз в неделю на каждом устройстве/браузере отдельно (localStorage,
// не привязано к Supabase-аккаунту — незачем городить бэкенд ради этого).
export const useVpnBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (!last || Date.now() - Number(last) > WEEK_MS) {
        setVisible(true);
      }
    } catch {
      // localStorage недоступен (приватный режим и т.п.) — просто не показываем
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // не критично, покажем ещё раз в следующий визит
    }
  }, []);

  return { visible, dismiss };
};
