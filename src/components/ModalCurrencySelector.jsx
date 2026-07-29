import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { CURRENCIES, getCurrency } from '../lib/currency';

const ModalCurrencySelector = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const curr = getCurrency(value);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="h-full bg-black border border-zinc-800 rounded-2xl px-3 py-3 text-sm flex items-center gap-1 focus:outline-none focus:border-zinc-500 transition text-zinc-300 font-semibold whitespace-nowrap">
        {curr.code} <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}
            className="absolute bottom-14 right-0 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[120px]">
            {CURRENCIES.map(c => (
              <button key={c.code} type="button" onClick={() => { onChange(c.code); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-800 transition">
                <span className={value === c.code ? 'text-white font-semibold' : 'text-zinc-400'}>{c.label}</span>
                {value === c.code && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModalCurrencySelector;
