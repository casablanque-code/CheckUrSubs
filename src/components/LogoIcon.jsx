import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { getLogoUrl, getLucideIcon } from '../lib/serviceCatalog';

const LogoIcon = ({ sub, size = 'md' }) => {
  const [err, setErr] = useState(false);
  const wrap = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const img  = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  // getLucideIcon looks up a stable component reference from the static
  // SERVICE_CATALOG array (src/lib/serviceCatalog.js) — it never creates
  // a new component type, same shape as the common `{ icon: Icon }` prop
  // pattern used elsewhere (NavItem, SectionTitle), just sourced from a
  // lookup instead of props. useMemo does NOT satisfy this rule (tried
  // it — the rule flags the JSX usage below regardless of how LucideIcon
  // was derived), and there's no restructure that keeps dynamic-icon-by-
  // name behavior without hitting the same "not from props" case.
  const LucideIcon = getLucideIcon(sub);
  const url  = !err && !LucideIcon ? getLogoUrl(sub) : null;
  return (
    <div className={`${wrap} bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 overflow-hidden shrink-0`}>
      {LucideIcon
        // eslint-disable-next-line react-hooks/static-components
        ? <LucideIcon className={`${img} text-zinc-300`} />
        : url
          ? <img src={url} className={`${img} object-contain`} alt="" onError={() => setErr(true)} />
          : <CreditCard className="w-4 h-4 text-zinc-300" />}
    </div>
  );
};

export default LogoIcon;
