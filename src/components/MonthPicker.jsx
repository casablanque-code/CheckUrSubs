import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { MONTHS_SHORT } from '../lib/billing';
import { useT } from '../lib/i18n';

const MonthPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-left flex justify-between items-center focus:outline-none focus:border-zinc-500 transition">
        <span className={value ? 'text-white' : 'text-zinc-600'}>{value || t.month_placeholder}</span>
        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}
            className="absolute bottom-14 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50 grid grid-cols-3">
            {MONTHS_SHORT.map(m => (
              <button key={m} type="button" onClick={() => { onChange(m); setOpen(false); }}
                className={`py-2.5 text-sm transition hover:bg-zinc-800 ${value === m ? 'font-semibold text-white' : 'text-zinc-400'}`}>
                {m}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthPicker;
