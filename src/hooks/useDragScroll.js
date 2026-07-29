import { useEffect, useRef } from 'react';

// ─── Хук drag-scroll (горизонталь, без конфликта с вертикалью) ────────────────
export const useDragScroll = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Mouse
    let down = false, startX = 0, sl = 0;
    const onDown = (e) => { if (e.pointerType !== 'mouse') return; down = true; startX = e.clientX; sl = el.scrollLeft; el.setPointerCapture?.(e.pointerId); el.style.cursor = 'grabbing'; };
    const onMove = (e) => { if (!down) return; el.scrollLeft = sl - (e.clientX - startX); };
    const onUp   = (e) => { if (!down) return; down = false; el.releasePointerCapture?.(e.pointerId); el.style.cursor = ''; };
    // Touch — определяем ось по первым пикселям, не блокируем вертикаль
    let tx = 0, ty = 0, tsl = 0, axis = null;
    const onTouchStart = (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; tsl = el.scrollLeft; axis = null; };
    const onTouchMove  = (e) => {
      const dx = e.touches[0].clientX - tx;
      const dy = e.touches[0].clientY - ty;
      if (!axis) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (axis === 'x') { e.preventDefault(); e.stopPropagation(); el.scrollLeft = tsl - dx; }
    };
    el.addEventListener('pointerdown',  onDown);
    el.addEventListener('pointermove',  onMove);
    el.addEventListener('pointerup',    onUp);
    el.addEventListener('pointerleave', onUp);
    el.addEventListener('touchstart',   onTouchStart, { passive: true });
    el.addEventListener('touchmove',    onTouchMove,  { passive: false });
    return () => {
      el.removeEventListener('pointerdown',  onDown);
      el.removeEventListener('pointermove',  onMove);
      el.removeEventListener('pointerup',    onUp);
      el.removeEventListener('pointerleave', onUp);
      el.removeEventListener('touchstart',   onTouchStart);
      el.removeEventListener('touchmove',    onTouchMove);
    };
  }, []);
  return ref;
};
