import { ChevronDown } from 'lucide-react';
import { useT } from '../lib/i18n';
import { MONTHS_SHORT, extractBillingDay, extractBillingMonth } from '../lib/billing';
import LogoIcon from './LogoIcon';

const CalendarSection = ({ subscriptions, fmt, fmtReal, monthly, month, year, onPrev, onNext, calTotal, calYearly, isPast, calMonth }) => {
  const t = useT();
  const today       = new Date();
  const isToday     = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset      = (new Date(year, month, 1).getDay() + 6) % 7;

  const visibleSubs = subscriptions.filter(sub => {
    if (sub.status === 'paused') return false;
    return true;
  });

  const subsByDay = {};
  visibleSubs.forEach(sub => {
    // Пробные — отображаем на дату окончания пробного периода
    if (sub.status === 'trial') {
      if (!sub.trial_end) return;
      const end = new Date(sub.trial_end);
      if (end.getFullYear() !== year || end.getMonth() !== month) return;
      const d = end.getDate();
      if (!subsByDay[d]) subsByDay[d] = [];
      subsByDay[d].push(sub);
      return;
    }

    const d = sub.billingDay ?? extractBillingDay(sub.date);
    if (!d || d < 1 || d > daysInMonth) return;

    // Годовые — только в тот месяц когда реально списывается
    if (sub.period === 'yearly') {
      const billingMonth = extractBillingMonth(sub.date);
      if (billingMonth === null || billingMonth !== month) return;
    }

    if (!subsByDay[d]) subsByDay[d] = [];
    subsByDay[d].push(sub);
  });

  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <button onClick={onPrev} className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <p className="text-sm font-semibold">{t.months_full[month]} {year}</p>
        <button onClick={onNext} className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95">
          <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {t.days_short.map(d => <div key={d} className="text-center text-[10px] text-zinc-600 font-semibold uppercase tracking-wide py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const daySubs = subsByDay[day] || [];
          const hasAny  = daySubs.length > 0;
          const hasActive = daySubs.some(s => !s.status || s.status === 'active');
          const total   = daySubs
            .filter(s => !s.status || s.status === 'active')
            .reduce((a, s) => a + (s.period === 'yearly' ? monthly(s) * 12 : monthly(s)), 0);
          return (
            <div key={day} className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center
              ${isToday(day) ? 'bg-white text-black' : hasAny ? 'bg-zinc-800 border border-zinc-700' : 'bg-zinc-900/40'}`}>
              <span className={`text-xs font-semibold leading-none ${isToday(day) ? 'text-black' : hasAny ? 'text-white' : 'text-zinc-600'}`}>{day}</span>
              {hasAny && hasActive && <span className={`text-[8px] font-bold mt-0.5 leading-none ${isToday(day) ? 'text-zinc-600' : 'text-amber-400'}`}>{fmt(total)}</span>}
              {hasAny && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {daySubs.slice(0, 3).map(s => (
                    <div key={s.id} className={`w-1 h-1 rounded-full ${
                      s.status === 'trial' ? 'bg-white' :
                      s.period === 'yearly' ? 'bg-red-400' : 'bg-purple-400'
                    }`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Суммы — сразу под сеткой */}
      <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">{isPast ? t.spent(t.months_genitive[calMonth ?? month]) : t.expected(t.months_genitive[calMonth ?? month])}</span>
          <span className="font-semibold">{fmt(calTotal ?? 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">{t.per_year}</span>
          <span className="font-semibold">{fmt(calYearly ?? 0)}</span>
        </div>
      </div>
      {Object.keys(subsByDay).length > 0 && (
        <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 divide-y divide-zinc-800/80 overflow-hidden mt-2">
          {Object.entries(subsByDay).sort(([a],[b]) => Number(a)-Number(b)).flatMap(([day, subs]) =>
            subs.map(sub => (
              <div key={sub.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <LogoIcon sub={sub} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{sub.name}</p>
                      {sub.status === 'trial' && <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-lg shrink-0">{t.modal_status_trial.toLowerCase()}</span>}
                    </div>
                    <p className="text-xs text-zinc-500">{day} {MONTHS_SHORT[month]}</p>
                  </div>
                </div>
                {sub.status === 'trial'
                  ? <p className="text-xs text-zinc-500 shrink-0">{t.not_billing}</p>
                  : <p className="text-sm font-semibold shrink-0">{fmtReal(sub)}</p>
                }
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarSection;
