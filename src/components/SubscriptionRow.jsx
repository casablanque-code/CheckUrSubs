import { ChevronRight, TrendingUp } from 'lucide-react';
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
const SubscriptionRow = ({ sub, fmtOriginal, onEdit }) => {
  const t    = useT();
  const lang = useLang();
  const cat = sub.category ? getCat(sub.category) : null;
  const priceChange = getLastPriceChange(sub);

  return (
    <button type="button" onClick={onEdit}
      className="w-full flex items-center px-4 py-3 gap-3 bg-[#1C1C1E] active:bg-zinc-800/60 transition text-left">
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
      <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
    </button>
  );
};

export default SubscriptionRow;
