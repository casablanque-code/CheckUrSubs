import { useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Pencil, Trash2, TrendingUp } from 'lucide-react';
import { useT, useLang } from '../lib/i18n';
import { getCat } from '../lib/categories';
import { fmtDateFromISO } from '../lib/billing';
import { getLastPriceChange } from '../lib/priceHistory';
import LogoIcon from './LogoIcon';
import CategoryBadge from './CategoryBadge';

// NB: проп `monthly` принимается, но нигде в теле компонента не
// используется — нет строки с пересчитанной месячной ценой для yearly
// подписок. Похоже на недописанную фичу (см. находку в коммите), не
// трогаю логику при переносе.
// NB: раньше сюда передавались ещё `fmt` и `monthly` — оба были
// объявлены в сигнатуре, но нигде не читались в теле компонента.
// Возможно, недописанная фича (конвертированная в USD/во всех
// валютах суммарная цена), возможно — просто мусор от старой
// версии. Убрал как явно мёртвые параметры; если это была
// пропавшая фича — решение по UI за продуктовой стороной.
const SubscriptionRow = ({ sub, fmtOriginal, onEdit, onDelete }) => {
  const t    = useT();
  const lang = useLang();
  const cat = sub.category ? getCat(sub.category) : null;
  const priceChange = getLastPriceChange(sub);
  const x = useMotionValue(0);
  const startRef = useRef(null);
  const isVertical = useRef(false);
  const axisLocked = useRef(false); // ось зафиксирована — больше не переключаем

  const onPointerDown = (e) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    isVertical.current = false;
    axisLocked.current = false;
  };

  const onPointerMove = (e) => {
    if (!startRef.current || axisLocked.current) return;
    const dx = Math.abs(e.clientX - startRef.current.x);
    const dy = Math.abs(e.clientY - startRef.current.y);
    // Ждём минимум 20px перед определением оси
    if (dx < 20 && dy < 20) return;
    // Угол > ~22° от горизонтали (dy/dx > 0.2) считаем скроллом
    if (dy > dx * 0.2) {
      isVertical.current = true;
      axisLocked.current = true;
      x.set(0);
    } else {
      axisLocked.current = true; // горизонталь — фиксируем, не даём перепрыгнуть
    }
  };

  return (
    <div className="relative overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}>
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-emerald-600/90 flex items-center pl-6 text-xs font-semibold gap-2">
          <Pencil className="w-3.5 h-3.5" /> {t.modal_edit}
        </div>
        <div className="flex-1 bg-red-600/90 flex items-center justify-end pr-6 text-xs font-semibold gap-2">
          {t.sub_delete} <Trash2 className="w-3.5 h-3.5" />
        </div>
      </div>
      <motion.div
        data-no-tab-swipe
        // Intentional: isVertical is an imperative flag for the drag
        // axis-lock (see onPointerMove above), deliberately kept in a ref
        // so touch/pointer moves don't trigger re-renders during the
        // gesture. Moving this to useState would re-render on every
        // pointermove and could reintroduce the axis-jump bug the ref was
        // added to prevent — not doing that as a drive-by lint fix inside
        // an otherwise pure-move refactor.
        // eslint-disable-next-line react-hooks/refs
        drag={isVertical.current ? false : 'x'}
        dragConstraints={{ left: -90, right: 90 }}
        dragElastic={0.08}
        dragSnapToOrigin
        style={{ x }}
        onDragEnd={(_, info) => {
          if (!isVertical.current) {
            if (info.offset.x <= -70) onDelete();
            else if (info.offset.x >= 70) onEdit();
          }
          startRef.current = null;
          isVertical.current = false;
          axisLocked.current = false;
        }}
        className={`relative flex items-center px-4 py-3 gap-3 bg-[#1C1C1E]`}>
        <LogoIcon sub={sub} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{sub.name}</p>
            {cat && <CategoryBadge cat={cat} tiny />}
            {sub.status === 'paused' && <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded-lg shrink-0">{t.badge_paused}</span>}
            {sub.status === 'trial'  && <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-lg shrink-0">{t.badge_trial}</span>}
            {priceChange && priceChange.pct > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded-lg shrink-0">
                <TrendingUp className="w-2.5 h-2.5" /> {t.price_up(Math.round(priceChange.pct))}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 truncate">
            {fmtOriginal(sub)} / {sub.period === 'yearly' ? t.sub_per_year : t.sub_per_month}
            {sub.date && sub.date !== '—' && ` · ${sub.date}`}
            {sub.status === 'trial' && sub.trial_end && ` · ${fmtDateFromISO(sub.trial_end, lang)}`}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionRow;
