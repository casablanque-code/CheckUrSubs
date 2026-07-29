import { CalendarDays } from 'lucide-react';
import { useT } from '../lib/i18n';
import { useDragScroll } from '../hooks/useDragScroll';
import SectionTitle from './SectionTitle';
import SoonCard from './SoonCard';

const SoonSection = ({ soonSubs, fmtOriginal }) => {
  const t = useT();
  const ref = useDragScroll();
  return (
    <section className="space-y-3">
      <SectionTitle icon={CalendarDays} label={t.soon} />
      {soonSubs.length === 0
        ? <p className="text-sm text-zinc-600 px-1">{t.soon_empty}</p>
        : <div ref={ref} data-no-tab-swipe className="flex gap-3 overflow-x-auto no-scrollbar px-1 pb-1">
            {soonSubs.map(sub => <SoonCard key={sub.id} sub={sub} fmtOriginal={fmtOriginal} />)}
          </div>
      }
    </section>
  );
};

export default SoonSection;
