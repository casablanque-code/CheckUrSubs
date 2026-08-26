import { Lightbulb } from 'lucide-react';
import { useT } from '../lib/i18n';
import { getDuplicateGroups } from '../lib/insights';

const INSIGHT_KEY = { music: 'insight_music', video: 'insight_video', ai: 'insight_ai', storage: 'insight_storage' };

const InsightsCard = ({ subscriptions }) => {
  const t = useT();
  const groups = getDuplicateGroups(subscriptions);
  if (groups.length === 0) return null;

  return (
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
            {t[INSIGHT_KEY[type]](subs.length, subs.map(s => s.name).join(', '))}
          </p>
        ))}
      </div>
    </div>
  );
};

export default InsightsCard;
