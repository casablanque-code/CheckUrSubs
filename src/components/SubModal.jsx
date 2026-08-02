import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import { useT } from '../lib/i18n';
import { getCurrency } from '../lib/currency';
import { extractBillingDay } from '../lib/billing';
import { CATEGORIES, getCat } from '../lib/categories';
import { SERVICE_CATALOG, getCatalogEntry } from '../lib/serviceCatalog';
import ModalCurrencySelector from './ModalCurrencySelector';
import MonthPicker from './MonthPicker';
import DatePicker from './DatePicker';

const SubModal = ({ initial, currency, onSave, onClose }) => {
  const t    = useT();
  // Валюта модалки: при редактировании — оригинальная валюта подписки, при добавлении — текущая глобальная
  const [modalCurrency, setModalCurrency] = useState(initial?.currency_code || currency);
  const curr = getCurrency(modalCurrency);

  const [name,     setName]     = useState(initial?.name     || '');
  const [price,    setPrice]    = useState(initial ? String(initial.price ?? initial.price_usd ?? '') : '');
  const [period,    setPeriod]   = useState(initial?.period   || 'monthly');
  const [category,  setCategory] = useState(initial?.category || '');
  const [status,    setStatus]   = useState(initial?.status   || 'active');
  const [trialEnd,  setTrialEnd] = useState(initial?.trial_end || '');
  const [day,      setDay]      = useState(() => { const d = extractBillingDay(initial?.date); return d ? String(d) : ''; });
  const [month,    setMonth]    = useState(() => { if (!initial?.date) return ''; return String(initial.date).trim().split(' ')[1] || ''; });
  const [suggestions,     setSuggestions]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dayError, setDayError] = useState(false);
  const justApplied = useRef(false);
  const priceRef = useRef(null);

  // Автосаджест — suggestions вычисляются из `name`, обычно это был бы
  // чистый useMemo вместо эффекта. Но есть justApplied: applySuggestion()
  // ниже программно меняет name и требует, чтобы эффект пропустил
  // пересчёт на следующем же рендере — иначе выбор саджеста сразу же
  // заново открыл бы дропдаун для своего нового имени. Этот skip-one-run
  // паттерн (реакция на изменение, вызванное внешним актором, плюс
  // одноразовый флаг) — ровно то, что делает это эффектом, а не чистым
  // вычислением при рендере. Не переписываю в рамках pure-move рефактора:
  // неверный переписанный вариант рискует вернуть мигание дропдауна
  // после каждого выбора саджеста.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (justApplied.current) { justApplied.current = false; return; }
    const q = name.trim().toLowerCase();
    if (q.length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    const matches = SERVICE_CATALOG.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.aliases || []).some(a => a.toLowerCase().includes(q))
    ).slice(0, 5);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0 && !initial);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [name, initial]);

  const applySuggestion = (service) => {
    justApplied.current = true;
    setName(service.name);
    setCategory(service.category);
    setShowSuggestions(false);
    setSuggestions([]);
    setTimeout(() => priceRef.current?.focus(), 50);
  };

  const canSave = name.trim() && price !== '' && (period !== 'yearly' || (day && month));

  const handleSubmit = () => {
    if (!canSave) return;
    const dayNum = Number(day);
    if (day && (dayNum < 1 || dayNum > 31)) {
      setDayError(true);
      setTimeout(() => setDayError(false), 600);
      return;
    }
    const dateStr = day && month ? `${day} ${month}` : day || '—';
    onSave({ name: name.trim(), price: Number(price), currencyCode: modalCurrency, period, category, date: dateStr, logo: initial?.logo || '', status, trial_end: status === 'trial' && trialEnd ? trialEnd : null });
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
      <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed bottom-4 left-4 right-4 bg-zinc-900 rounded-[36px] p-7 z-50 border border-zinc-800 max-w-[450px] mx-auto shadow-2xl">

        <h2 className="text-xl font-semibold mb-5 text-center">{initial ? t.modal_edit : t.modal_new}</h2>

        <div className="space-y-3">
          {/* Название + саджест */}
          <div className="relative">
            <input placeholder={t.modal_name_placeholder}
              className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition"
              value={name} onChange={e => setName(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />
            <AnimatePresence>
              {showSuggestions && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full mt-1 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden z-50 shadow-2xl">
                  {suggestions.map(s => {
                    const cat = getCat(s.category);
                    const Icon = cat?.icon || Zap;
                    const SvcIcon = s.lucideIcon || null;
                    return (
                      <button key={s.name} type="button"
                        onMouseDown={e => { e.preventDefault(); applySuggestion(s); }}
                        onTouchEnd={e => { e.preventDefault(); applySuggestion(s); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition text-left">
                        {SvcIcon
                          ? <SvcIcon className="w-5 h-5 text-zinc-400" />
                          : <img src={`https://www.google.com/s2/favicons?sz=32&domain=${s.domain}`}
                              className="w-5 h-5 rounded object-contain" alt=""
                              onError={e => { e.target.style.display='none'; }} />
                        }
                        <span className="text-sm flex-1">{s.name}</span>
                        {cat && (
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${cat.bg} border ${cat.border}`}>
                            <Icon className={`w-2.5 h-2.5 ${cat.color}`} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Цена + валюта */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">{curr.symbol}</span>
              <input ref={priceRef} type="number" inputMode="decimal" placeholder={t.modal_price_placeholder}
                className="w-full bg-black border border-zinc-800 rounded-2xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition"
                value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <ModalCurrencySelector value={modalCurrency} onChange={setModalCurrency} />
          </div>

          {/* Периодичность */}
          <div className="flex gap-2">
            {['monthly', 'yearly'].map(p => (
              <button key={p} type="button" onClick={() => { setPeriod(p); if (p === 'monthly') setMonth(''); }}
                className={`flex-1 py-3 rounded-2xl text-sm font-medium border transition ${period === p ? 'bg-white text-black border-white' : 'bg-black border-zinc-800 text-zinc-400'}`}>
                {p === 'monthly' ? t.modal_monthly : t.modal_yearly}
              </button>
            ))}
          </div>

          {/* Статус */}
          <div className="flex gap-2">
            {[
              { id: 'active', label: t.modal_status_active, color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/40'  },
              { id: 'paused', label: t.modal_status_paused, color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40'    },
              { id: 'trial',  label: t.modal_status_trial,  color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/40'  },
            ].map(s => (
              <button key={s.id} type="button" onClick={() => setStatus(s.id)}
                className={`flex-1 py-2.5 rounded-2xl text-xs font-semibold border transition ${status === s.id ? `${s.bg} ${s.border} ${s.color}` : 'bg-black border-zinc-800 text-zinc-500'}`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Дата окончания пробного */}
          {status === 'trial' && (
            <DatePicker
              value={trialEnd}
              onChange={setTrialEnd}
              label={t.modal_trial_end}
            />
          )}

          {/* Дата списания — скрыта для пробных (дата = trial_end) */}
          {status !== 'trial' && (
          <div className="space-y-1.5">
            {initial && (
              <p className="text-[11px] text-zinc-500 px-1">
                {period === 'yearly' ? t.modal_billing_date : t.modal_billing_day}
              </p>
            )}
            <div className="flex gap-2">
            <input type="number" inputMode="numeric"
            placeholder={period === 'yearly' ? t.modal_day_placeholder : t.modal_day_billing_placeholder}
              min="1" max="31"
              className={`${period === 'yearly' ? 'flex-1' : 'w-full'} bg-black border rounded-2xl px-4 py-3 text-sm focus:outline-none transition
              ${dayError ? 'border-red-500 shake' : 'border-zinc-800 focus:border-zinc-500'}`}
              value={day} onChange={e => { const v = e.target.value; if (v === '' || (Number(v) >= 1 && Number(v) <= 31)) setDay(v); }} />
              {period === 'yearly' && (
                <div className="flex-1"><MonthPicker value={month} onChange={setMonth} /></div>
              )}
            </div>
          </div>
          )}

          {/* Категория */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const Icon   = cat.icon;
              const active = category === cat.id;
              return (
                <button key={cat.id} type="button" onClick={() => setCategory(active ? '' : cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium border transition ${active ? `${cat.bg} ${cat.border} ${cat.color}` : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                  <Icon className="w-3 h-3" />{t[cat.labelKey]}
                </button>
              );
            })}
          </div>

          {/* Cancel Assistant — только при редактировании если есть cancelUrl */}
          {initial && (() => {
            const entry = getCatalogEntry(initial.name);
            if (!entry?.cancelUrl) return null;
            return (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                  <X className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="text-xs text-zinc-400">
                    {t.cancel_assistant_pre}
                    <a href={entry.cancelUrl} target="_blank" rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 transition underline underline-offset-2">
                      {t.cancel_assistant_link}
                    </a>
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {entry.cancelSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-[10px] font-bold text-zinc-600 mt-0.5 shrink-0 w-3">{i + 1}.</span>
                      <span className="text-xs text-zinc-400 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        <button disabled={!canSave} onClick={handleSubmit}
          className="mt-5 w-full bg-white text-black font-semibold py-3.5 rounded-2xl active:scale-95 transition disabled:opacity-40 text-sm">
          {initial ? t.modal_save : t.modal_add}
        </button>
        <button type="button" onClick={onClose} className="mt-3 mb-2 w-full text-zinc-400 text-sm py-2">{t.modal_cancel}</button>
      </motion.div>
    </>
  );
};

export default SubModal;
