import { useT, useLang } from '../lib/i18n';
import { getCat } from '../lib/categories';
import { extractBillingDay } from '../lib/billing';
import LogoIcon from './LogoIcon';
import CategoryBadge from './CategoryBadge';

const SoonCard = ({ sub, fmtOriginal }) => {
  const t    = useT();
  const lang = useLang();
  const cat  = sub.category ? getCat(sub.category) : null;

  // Считаем сколько дней до списания
  const daysLeft = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let target;
    if (sub.status === 'trial' && sub.trial_end) {
      target = new Date(sub.trial_end);
      target.setHours(0, 0, 0, 0);
    } else {
      const day = sub.billingDay ?? extractBillingDay(sub.date);
      if (!day) return null;
      target = new Date(today.getFullYear(), today.getMonth(), day);
      if (target < today) target.setMonth(target.getMonth() + 1);
    }
    return Math.round((target - today) / 86400000);
  })();

  const daysLabel = (() => {
    if (daysLeft === null) return null;
    if (daysLeft === 0) return lang === 'ru' ? 'сегодня' : 'today';
    if (daysLeft === 1) return lang === 'ru' ? 'завтра'  : 'tomorrow';
    return lang === 'ru' ? `через ${daysLeft} дн.` : `in ${daysLeft}d`;
  })();

  return (
    <div className="w-[168px] bg-[#1C1C1E] rounded-[28px] p-5 border border-zinc-800 active:scale-[0.97] transition shrink-0 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <LogoIcon sub={sub} size="md" />
        <span className={`text-[10px] font-bold px-2 py-1 rounded-xl border shrink-0 ml-2 ${
          daysLeft === 0 ? 'text-red-400 bg-red-500/15 border-red-500/30' :
          daysLeft === 1 ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' :
          'text-white bg-zinc-800 border-zinc-700'
        }`}>{daysLabel ?? sub.date}</span>
      </div>
      <p className="font-semibold text-sm leading-snug mb-2 flex-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sub.name}</p>
      <div className="flex items-center justify-between gap-1">
        <p className="text-zinc-400 text-xs truncate">{fmtOriginal(sub)}</p>
        {cat && <CategoryBadge cat={cat} tiny />}
      </div>
    </div>
  );
};

export default SoonCard;
