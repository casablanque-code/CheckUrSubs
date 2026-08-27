import { useEffect, useRef } from 'react';
import { TABS } from '../lib/billing';

// ─── Хук свайп между вкладками ────────────────────────────────────────────────
// Раньше строки подписок сами были горизонтально перетаскиваемыми (drag-to-
// edit/delete), поэтому порог здесь держали высоким (120px) и угол — строгим.
// Теперь редактирование/удаление — через кнопки, так что порог можно снизить.
// [data-no-tab-swipe] остаётся — его дополнительно использует SoonSection
// (горизонтальный drag-scroll карусель, useDragScroll), и это отдельный,
// не связанный с карточками жест, который по-прежнему должен исключаться.
export const useTabSwipe = (activeTab, setActiveTab, enabled = true) => {
  const ref    = useRef(null);
  const state  = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      if (e.target.closest('[data-no-tab-swipe]')) return;
      state.current = { x: t.clientX, y: t.clientY, active: true };
    };

    const onEnd = (e) => {
      if (!state.current.active) return;
      state.current.active = false;
      const t  = e.changedTouches?.[0];
      if (!t) return;
      const dx = t.clientX - state.current.x;
      const dy = t.clientY - state.current.y;
      // Порог снижен со 120px до 70px — жест больше не конкурирует со
      // свайпом карточки. Угол оставлен строгим (как раньше, ~30°), чтобы
      // не начать ловить случайные срабатывания при вертикальном скролле
      // списка — их тут стало компенсировать некому.
      if (Math.abs(dx) < 70) return;
      if (Math.abs(dy) > Math.abs(dx) * 0.58) return;
      const idx = TABS.indexOf(activeTab);
      if (dx < 0 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1]);
      if (dx > 0 && idx > 0)               setActiveTab(TABS[idx - 1]);
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend',   onEnd,   { passive: true });
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchend', onEnd); };
  }, [activeTab, setActiveTab, enabled]);

  return ref;
};
