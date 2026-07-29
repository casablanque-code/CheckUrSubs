import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { getLogoUrl, getLucideIcon } from '../lib/serviceCatalog';

const LogoIcon = ({ sub, size = 'md' }) => {
  const [err, setErr] = useState(false);
  const wrap = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const img  = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const LucideIcon = getLucideIcon(sub);
  const url  = !err && !LucideIcon ? getLogoUrl(sub) : null;
  return (
    <div className={`${wrap} bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 overflow-hidden shrink-0`}>
      {LucideIcon
        ? <LucideIcon className={`${img} text-zinc-300`} />
        : url
          ? <img src={url} className={`${img} object-contain`} alt="" onError={() => setErr(true)} />
          : <CreditCard className="w-4 h-4 text-zinc-300" />}
    </div>
  );
};

export default LogoIcon;
