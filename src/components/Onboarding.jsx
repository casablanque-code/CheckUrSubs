import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, List, CalendarDays, BarChart2, Download } from 'lucide-react';
import { useT } from '../lib/i18n';
import TapEditDemo from './TapEditDemo';

const getOnboardingSteps = (t) => [
  { icon: Sparkles,    iconColor: 'text-white',      iconBg: 'bg-zinc-800',       ...t.onb_slides[0] },
  { icon: Plus,        iconColor: 'text-black',       iconBg: 'bg-white',          ...t.onb_slides[1] },
  { type: 'swipe',
    icon: List,        iconColor: 'text-zinc-300',    iconBg: 'bg-zinc-800',       ...t.onb_slides[2] },
  { icon: CalendarDays,iconColor: 'text-sky-300',     iconBg: 'bg-sky-500/15',     ...t.onb_slides[3] },
  { icon: BarChart2,   iconColor: 'text-purple-300',  iconBg: 'bg-purple-500/15',  ...t.onb_slides[4] },
  { type: 'pwa',
    icon: Download,    iconColor: 'text-green-300',   iconBg: 'bg-green-500/15',   ...t.onb_slides[5] },
];

const Onboarding = ({ onDone, toggleLang, lang }) => {
  const t = useT();
  const [step,  setStep]  = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);

  const ONBOARDING_STEPS = getOnboardingSteps(t);
  const total  = ONBOARDING_STEPS.length;
  const isLast = step === total - 1;
  const s      = ONBOARDING_STEPS[step];

  const goNext = () => isLast ? onDone() : setStep(p => p + 1);
  const goPrev = () => step > 0 && setStep(p => p - 1);

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY; };
  const onTouchEnd   = (e) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext(); else goPrev();
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex justify-center select-none"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="w-full max-w-[450px] min-h-screen border-x border-zinc-900 bg-black flex flex-col overflow-hidden">

        {/* Тогл языка — только на первом слайде */}
        {step === 0 && toggleLang && (
          <div className="flex justify-end px-6 pt-6">
            <button onClick={toggleLang}
              className="relative flex items-center h-7 w-[64px] rounded-full bg-zinc-800 border border-zinc-700 p-[3px] select-none">
              <motion.div className="absolute w-[28px] h-[22px] bg-white rounded-full shadow"
                animate={{ x: lang === 'en' ? 32 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              <span className={`relative z-10 flex-1 text-center text-[10px] font-bold tracking-wide transition-colors ${lang === 'ru' ? 'text-black' : 'text-zinc-500'}`}>RU</span>
              <span className={`relative z-10 flex-1 text-center text-[10px] font-bold tracking-wide transition-colors ${lang === 'en' ? 'text-black' : 'text-zinc-500'}`}>EN</span>
            </button>
          </div>
        )}

        {/* Контент — растягивается, но контролирует выравнивание */}
        <div className="flex-1 flex flex-col px-8 pt-8">

          {/* Слайд — фиксированная зона контента */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full flex flex-col items-center text-center"
              >
                {/* Иконка — одинаковая на всех слайдах */}
                <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center border border-zinc-700 mb-7 ${s.iconBg}`}>
                  <s.icon className={`w-9 h-9 ${s.iconColor}`} />
                </div>

                {/* Заголовок */}
                <h2 className="text-2xl font-bold tracking-tight mb-4">{s.title}</h2>

                {/* Анимация тап→редактирование (только на слайде swipe) */}
                {s.type === 'swipe' && (
                  <div className="w-full mb-4">
                    <TapEditDemo />
                  </div>
                )}

                {/* PWA-инструкция */}
                {s.type === 'pwa' && (() => {
                  const ua = navigator.userAgent;
                  const isIOS = /iPad|iPhone|iPod/.test(ua);
                  const isAndroid = /Android/.test(ua);
                  return (
                    <div className="w-full space-y-3 mb-4">
                      {(isIOS || (!isIOS && !isAndroid)) && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left space-y-3">
                          <p className="text-xs text-zinc-500 uppercase tracking-widest">iOS · Safari</p>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                              {/* Share icon iOS */}
                              <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                <polyline points="16 6 12 2 8 6"/>
                                <line x1="12" y1="2" x2="12" y2="15"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{t.pwa_ios_share}</p>
                              <p className="text-xs text-zinc-500">{t.pwa_ios_share_hint}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                              <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="2" width="14" height="20" rx="2"/>
                                <line x1="12" y1="6" x2="12" y2="6"/>
                                <line x1="9" y1="18" x2="15" y2="18"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{t.pwa_ios_add}</p>
                              <p className="text-xs text-zinc-500">{t.pwa_ios_add_hint}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {(isAndroid || (!isIOS && !isAndroid)) && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left space-y-3">
                          <p className="text-xs text-zinc-500 uppercase tracking-widest">Android · Chrome</p>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                              {/* Three dots menu */}
                              <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-300" fill="currentColor">
                                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{t.pwa_android_menu}</p>
                              <p className="text-xs text-zinc-500">{t.pwa_android_menu_hint}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
                              <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L12 16M12 16L8 12M12 16L16 12"/>
                                <path d="M3 20h18"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{t.pwa_android_install}</p>
                              <p className="text-xs text-zinc-500">{t.pwa_android_install_hint}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Описание */}
                <p className="text-zinc-400 text-sm leading-relaxed">{s.subtitle}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Точки — всегда на одном месте, прибиты к низу контентной зоны */}
          <div className="flex justify-center gap-2 py-8">
            {ONBOARDING_STEPS.map((_, i) => (
              <div key={i} onClick={() => setStep(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${i === step ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-zinc-700'}`} />
            ))}
          </div>
        </div>

        {/* Кнопки — всегда внизу */}
        <div className="px-8 pb-12 space-y-3">
          <button onClick={goNext}
            className="w-full bg-white text-black font-semibold py-3.5 rounded-2xl active:scale-95 transition text-sm">
            {isLast ? 'CheckUrSubs →' : t.onb_next}
          </button>
          {!isLast && (
            <button onClick={() => onDone(step)} className="w-full text-zinc-500 text-sm py-2">{t.onb_skip}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
