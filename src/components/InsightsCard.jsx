import { Lightbulb, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { useT } from '../lib/i18n';
import { getDuplicateGroups, getYearlySavingsCandidates, getFamilyPlanCandidates, getSpendTrendInsight } from '../lib/insights';

const INSIGHT_KEY = { music: 'insight_music', video: 'insight_video', ai: 'insight_ai', storage: 'insight_storage' };

// Схлопывает список имён в строку через запятую (для карточки инсайтов)
const joinNames = (items) => items.map(i => i.name).join(', ');

const InsightsCard = ({ subscriptions, rates }) => {
  const t = useT();
  const trend  = getSpendTrendInsight(subscriptions, rates);
  const groups = getDuplicateGroups(subscriptions);
  const yearly = getYearlySavingsCandidates(subscriptions);
  const family = getFamilyPlanCandidates(subscriptions);
  if (!trend && groups.length === 0 && yearly.length === 0 && family.length === 0) return null;

  return (
    <div className="space-y-3">
      {trend && (
        <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-blue-500/15 border border-blue-500/30">
              {trend.direction === 'down'
                ? <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
                : <TrendingUp className="w-3.5 h-3.5 text-blue-400" />}
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-[0.16em]">{t.trend_insight_title}</p>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {trend.direction === 'down' ? t.trend_insight_down(Math.abs(trend.pct)) : t.trend_insight_up(trend.pct)}
          </p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-yellow-500/15 border border-yellow-500/30">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-[0.16em]">{t.insights_title}</p>
          </div>
          <div className="space-y-3">
            {groups.map(({ type, subs }) => (
              <p key={type} className="text-sm text-zinc-300 leading-relaxed">
                {t[INSIGHT_KEY[type]](subs.length, joinNames(subs))}
              </p>
            ))}
          </div>
        </div>
      )}

      {(yearly.length > 0 || family.length > 0) && (
        <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30">
              <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-[0.16em]">{t.savings_title}</p>
          </div>
          <div className="space-y-3">
            {yearly.length > 0 && <p className="text-sm text-zinc-300 leading-relaxed">{t.savings_yearly(joinNames(yearly))}</p>}
            {family.length > 0 && <p className="text-sm text-zinc-300 leading-relaxed">{t.savings_family(joinNames(family))}</p>}
          </div>
          <p className="text-[11px] text-zinc-600 leading-relaxed">{t.savings_caveat}</p>
        </div>
      )}
    </div>
  );
};

export default InsightsCard;
