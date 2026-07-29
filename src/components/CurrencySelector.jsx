import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { CURRENCIES, getCurrency } from '../lib/currency';

const CurrencySelector = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const curr = getCurrency(value);
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 bg-zinc-800/70 hover:bg-zinc-700/70 border border-zinc-700 text-zinc-300 text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-95">
        {curr.label} <ChevronDown className="w-3 h-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }} transition={{ duration: 0.12 }}
            className="absolute top-9 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[130px]">
            {CURRENCIES.map(c => (
              <button key={c.code} onClick={() => { onChange(c.code); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-800 transition">
                <span className={value === c.code ? 'text-white font-semibold' : 'text-zinc-400'}>{c.label}</span>
                {value === c.code && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurrencySelector;
