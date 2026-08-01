import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CalendarDays } from 'lucide-react';
import { useT, useLang } from '../lib/i18n';
import { fmtDateFromISO } from '../lib/billing';

const DatePicker = ({ value, onChange, label }) => {
  const t    = useT();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const today = new Date();
  const parsed = value ? new Date(value) : null;
  const [viewYear,  setViewYear]  = useState(parsed?.getFullYear()  ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth()     ?? today.getMonth());
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const offset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const selectDay = (d) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0);  setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const selectedDay   = parsed?.getDate();
  const selectedMonth = parsed?.getMonth();
  const selectedYear  = parsed?.getFullYear();

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 cursor-pointer active:bg-amber-500/20 transition">
        <CalendarDays className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-xs text-amber-400 font-medium">{label}</span>
        <span className="ml-auto text-sm">
          {parsed
            ? <span className="text-zinc-200">{fmtDateFromISO(value, lang, 'long')}</span>
            : <span className="text-zinc-600">{t.datepicker_choose}</span>}
        </span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 p-4">
            {/* Навигация по месяцу */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth}
                className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 active:scale-95 transition">
                <ChevronDown className="w-3.5 h-3.5 rotate-90" />
              </button>
              <span className="text-sm font-semibold">{t.months_full[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth}
                className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 active:scale-95 transition">
                <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
              </button>
            </div>
            {/* Дни недели */}
            <div className="grid grid-cols-7 mb-1">
              {t.days_short.map(d => <div key={d} className="text-center text-[10px] text-zinc-600 font-semibold uppercase py-1">{d}</div>)}
            </div>
            {/* Дни */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const isSelected = day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;
                const isToday    = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                return (
                  <button key={day} type="button" onClick={() => selectDay(day)}
                    className={`aspect-square rounded-xl text-xs font-medium transition active:scale-95
                      ${isSelected ? 'bg-amber-500 text-black font-bold'
                        : isToday   ? 'bg-zinc-700 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800'}`}>
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;
