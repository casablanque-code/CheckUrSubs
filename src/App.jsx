import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, List, BarChart2, Plus, Pencil, Trash2, CreditCard,
  CalendarDays, ChevronDown, Check, ArrowUpDown, Search, X,
  RefreshCw, Gamepad2, Briefcase, Cloud, Music, BookOpen, Zap,
  Shield, Heart, Sparkles, SwatchBook, ChevronRight, LogOut,
  Wifi, Globe, Phone, Server, Tv, MonitorSmartphone, Package, Wallet, MessageCircle, Download, Upload, Bell
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { CURRENCIES, getCurrency, DEFAULT_RATES, fetchRates, loadRates, toUSD, monthlyUSD } from './lib/currency';
import { MONTHS_SHORT, MONTHS_SHORT_RU, TABS, fmtDateFromISO, extractBillingDay, extractBillingMonth, isDueWithinDays } from './lib/billing';
import { CATEGORIES, getCat } from './lib/categories';
import { SERVICE_CATALOG, getCatalogEntry } from './lib/serviceCatalog';
import { urlBase64ToUint8Array } from './lib/push';
import { useTabSwipe } from './hooks/useTabSwipe';
import LogoLoader from './components/LogoLoader';
import SectionTitle from './components/SectionTitle';
import CategoryBadge from './components/CategoryBadge';
import LogoIcon from './components/LogoIcon';
import SoonSection from './components/SoonSection';
import CurrencySelector from './components/CurrencySelector';
import ModalCurrencySelector from './components/ModalCurrencySelector';
import MonthPicker from './components/MonthPicker';
import NavItem from './components/NavItem';
import SwipeDemo from './components/SwipeDemo';
import SubscriptionRow from './components/SubscriptionRow';
import DatePicker from './components/DatePicker';
import DeleteAccountModal from './components/DeleteAccountModal';
import AvatarMenu from './components/AvatarMenu';
import SupportMenu from './components/SupportMenu';
import ImportExportMenu from './components/ImportExportMenu';
import CalendarSection from './components/CalendarSection';
import { analytics } from './lib/analytics';
import { LangContext, useLang, useT } from './lib/i18n';
import Auth from './Auth';


// ─── Константы ────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════════
// ─── Animated Logo Loader ────────────────────────────────────────────────────
const App = ({ session, toggleLang, lang }) => {
  const userId = session.user.id;
  const t = useT();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [isOnline,      setIsOnline]      = useState(() => navigator.onLine);

  const [currency,     setCurrency]     = useState(() => {
    const saved = localStorage.getItem('currency');
    if (saved) return saved;
    return lang === 'ru' ? 'RUB' : 'USD';
  });
  const [rates,        setRates]        = useState(() => loadRates() || DEFAULT_RATES);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [activeTab,    setActiveTab]    = useState('home');
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [editingSub,   setEditingSub]   = useState(null);

  // При смене языка — менять валюту на дефолт, если юзер не выбирал вручную
  useEffect(() => {
    if (!localStorage.getItem('currencyManual')) {
      setCurrency(lang === 'ru' ? 'RUB' : 'USD');
    }
  }, [lang]);
  const [toast,        setToast]        = useState(null);
  const [confirmSub,   setConfirmSub]   = useState(null);
  const [sortBy,       setSortBy]       = useState('name');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [swipeHinted,  setSwipeHinted]  = useState(() => localStorage.getItem('swipeHinted') === '1');
  const [calMonth,     setCalMonth]     = useState(() => new Date().getMonth());
  const [calYear,      setCalYear]      = useState(() => new Date().getFullYear());
  const [trendRange,   setTrendRange]   = useState(6); // 3 | 6 | 12

  const [pushBanner,   setPushBanner]   = useState(false);

  const VAPID_PUBLIC_KEY = 'BI--t_Ek8gyvTt8tn9LTcceNQgrw7u_e1NQFkrFpSqGZ7s2VBJK2hQ2wPfLJ7lckNBiCRqWno1-jg2Qy4qNXvmo';

  // Проверяем нужно ли показать баннер запроса push
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission === 'granted') return; // уже разрешено
    if (Notification.permission === 'denied') return;  // уже отклонено
    if (localStorage.getItem('pushBannerDismissed')) return;
    // Показываем через 3 секунды после входа — не сразу
    const t = setTimeout(() => setPushBanner(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const subscribePush = async () => {
    try {
      // Явно запрашиваем разрешение — часть браузеров не спасает без этого
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushBanner(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      // Сохраняем подписку в Supabase
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        subscription: JSON.stringify(sub.toJSON()), // toJSON() гарантирует { endpoint, keys: { p256dh, auth } }
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      setPushBanner(false);
      analytics.pushEnabled();
    } catch (e) {
      console.error('Push subscribe error:', e);
      setPushBanner(false);
    }
  };

  const dismissPushBanner = () => {
    localStorage.setItem('pushBannerDismissed', '1');
    setPushBanner(false);
    analytics.pushDismissed();
  };

  const curr = getCurrency(currency);
  const rate = rates[currency] ?? DEFAULT_RATES[currency] ?? 1;
  const fmt  = (usd) => {
    const v = usd * rate;
    const formatted = v % 1 === 0
      ? Math.round(v).toLocaleString('ru-RU')
      : v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${curr.symbol}${formatted}`;
  };

  // Удобная обёртка с текущими курсами
  const monthly = (sub) => monthlyUSD(sub, rates);

  // Реальная сумма списания: для годовых — полная, для месячных — месячная
  const realUSD = (sub) => {
    const p = toUSD(sub.price ?? sub.price_usd ?? sub.priceUSD ?? 0, sub.currency_code || 'USD', rates);
    return p; // всегда полная сумма подписки
  };
  const fmtReal = (sub) => fmt(sub.period === 'yearly' ? realUSD(sub) : monthly(sub));

  // Оригинальная цена подписки — всегда в той валюте, в которой добавлена
  const fmtOriginal = (sub) => {
    const p    = Number(sub.price ?? sub.price_usd ?? sub.priceUSD ?? 0);
    const code = sub.currency_code || 'USD';
    const c    = getCurrency(code);
    const v    = sub.period === 'yearly' ? p : p;
    return `${c.symbol}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`;
  };

  const tabRefs = { home: useRef(null), calendar: useRef(null), analytics: useRef(null) };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    analytics.tabSwitched(tab);
  };

  // Сбрасываем скролл вкладки при каждом переключении на неё
  useEffect(() => {
    tabRefs[activeTab]?.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const swipeRef = useTabSwipe(activeTab, switchTab, !isModalOpen);

  // ── Загрузка подписок из Supabase ──────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    analytics.identify(userId, session.user.email);
    const MIN_DURATION = 1500; // даём анимации лоадера доиграть до конца
    const t0 = Date.now();
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setSubscriptions(data.map(s => ({ ...s, billingDay: extractBillingDay(s.date) })));
        }
        const elapsed = Date.now() - t0;
        const remaining = Math.max(0, MIN_DURATION - elapsed);
        setTimeout(() => setLoading(false), remaining);
      });
  }, [userId]);

  // ── Онлайн/офлайн детектор ──────────────────────────────────────────────────
  useEffect(() => {
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online',  up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  // ── Курсы валют ────────────────────────────────────────────────────────────
  useEffect(() => {
    const cached = loadRates();
    if (!cached) { setRatesLoading(true); fetchRates().then(r => { if (r) setRates(r); setRatesLoading(false); }); }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('currencyManual')) {
      localStorage.setItem('currency', currency);
    }
  }, [currency]);

  useEffect(() => {
    if (!swipeHinted && subscriptions.length > 0) {
      const t = setTimeout(() => { setSwipeHinted(true); localStorage.setItem('swipeHinted', '1'); }, 3000);
      return () => clearTimeout(t);
    }
  }, [subscriptions.length, swipeHinted]);

  // Авто-активация пробных у которых trial_end прошёл
  const activatingRef = useRef(new Set());
  useEffect(() => {
    if (subscriptions.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const toActivate = subscriptions.filter(s =>
      s.status === 'trial' && s.trial_end && s.trial_end <= today && !activatingRef.current.has(s.id)
    );
    if (toActivate.length === 0) return;
    toActivate.forEach(async (s) => {
      activatingRef.current.add(s.id);
      const endDate = new Date(s.trial_end);
      const newDate = `${endDate.getDate()} ${MONTHS_SHORT[endDate.getMonth()]}`;
      const { data } = await supabase.from('subscriptions')
        .update({ status: 'active', trial_end: null, date: newDate })
        .eq('id', s.id).select().single();
      if (data) setSubscriptions(prev => prev.map(p =>
        p.id === s.id ? { ...p, status: 'active', trial_end: null, date: newDate, billingDay: endDate.getDate() } : p
      ));
    });
  }, [subscriptions]);

  // Только активные считаются в суммах (пробные и паузные = 0)
  const activeSubs  = subscriptions.filter(s => !s.status || s.status === 'active');
  const totalMonthlyUSD = activeSubs.reduce((a, s) => a + monthly(s), 0);
  const totalYearlyUSD  = totalMonthlyUSD * 12;

  const openAdd  = () => { if (!isOnline) return; setEditingSub(null); setIsModalOpen(true); };
  const openEdit = (s) => { if (!isOnline) return; setEditingSub(s);   setIsModalOpen(true); };

  // ── CRUD через Supabase ────────────────────────────────────────────────────
  const handleSave = async (payload) => {
    const row = {
      name:          payload.name,
      price:         payload.price,
      currency_code: payload.currencyCode,
      date:          payload.date,
      period:        payload.period,
      category:      payload.category,
      logo:          payload.logo || '',
      status:        payload.status || 'active',
      trial_end:     payload.trial_end || null,
      user_id:       userId,
    };

    if (editingSub) {
      const { data, error } = await supabase
        .from('subscriptions').update(row).eq('id', editingSub.id).select().single();
      if (!error && data) {
        setSubscriptions(prev => prev.map(s =>
          s.id === editingSub.id ? { ...data, billingDay: extractBillingDay(data.date) } : s
        ));
        analytics.subscriptionEdited(payload.name, payload.category);
      }
    } else {
      const { data, error } = await supabase
        .from('subscriptions').insert({ ...row, created_at: new Date().toISOString() }).select().single();
      if (!error && data) {
        setSubscriptions(prev => [...prev, { ...data, billingDay: extractBillingDay(data.date) }]);
        analytics.subscriptionAdded(payload.name, payload.category, payload.period, payload.currencyCode);
      }
    }
    setIsModalOpen(false); setEditingSub(null);
  };

  const triggerDelete = async (sub) => {
    if (!isOnline) return;
  
    // если висел предыдущий toast — просто закрываем его
    if (toast?.timeoutId) {
      clearTimeout(toast.timeoutId);
      setToast(null);
    }
  
    // убираем из UI сразу
    setSubscriptions(prev => prev.filter(s => s.id !== sub.id));
  
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', sub.id);
  
    if (error) {
      console.error('Delete error:', error);
  
      // откат UI, если удаление в БД не прошло
      setSubscriptions(prev => {
        const exists = prev.some(s => s.id === sub.id);
        if (exists) return prev;
        return [...prev, { ...sub, billingDay: extractBillingDay(sub.date) }];
      });
      return;
    }
  
    analytics.subscriptionDeleted(sub.name, sub.category);
  
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 5000);
  
    setToast({ sub, timeoutId });
  };
  
  const undoDelete = async () => {
    if (!toast) return;
  
    clearTimeout(toast.timeoutId);
    const sub = toast.sub;
  
    const row = {
      id: sub.id,
      user_id: sub.user_id,
      name: sub.name,
      price: sub.price,
      currency_code: sub.currency_code,
      date: sub.date,
      period: sub.period,
      category: sub.category,
      logo: sub.logo || '',
      status: sub.status || 'active',
      trial_end: sub.trial_end || null,
      created_at: sub.created_at,
    };
  
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(row)
      .select()
      .single();
  
    if (error) {
      console.error('Undo insert error:', error);
      setToast(null);
      return;
    }
  
    setSubscriptions(prev => {
      const exists = prev.some(s => s.id === data.id);
      if (exists) return prev;
      return [...prev, { ...data, billingDay: extractBillingDay(data.date) }];
    });
  
    analytics.subscriptionDeleteUndone();
    setToast(null);
  };

  const soonSubs = activeSubs
    .filter(s => isDueWithinDays(s, 7))
    .sort((a, b) => (a.billingDay || 99) - (b.billingDay || 99));

  const sortedSubs = [...subscriptions]
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price') return monthly(b) - monthly(a);
      if (sortBy === 'date')  return (a.billingDay || 99) - (b.billingDay || 99);
      return a.name.localeCompare(b.name);
    });

  const sortLabel   = sortBy === 'name' ? t.sort_az : sortBy === 'price' ? t.sort_price : t.sort_date;
  const cycleSortBy = () => setSortBy(p => p === 'name' ? 'price' : p === 'price' ? 'date' : 'name');

  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    subs:  activeSubs.filter(s => s.category === cat.id),
    total: activeSubs.filter(s => s.category === cat.id).reduce((a, s) => a + monthly(s), 0),
  })).filter(c => c.subs.length > 0);

  const handleLogout = () => { analytics.loggedOut(); supabase.auth.signOut(); };

  const handleDeleteAccount = async () => {
    try {
      // Удаляем все данные пользователя из всех таблиц
      await supabase.from('subscriptions').delete().eq('user_id', userId);
      await supabase.from('push_subscriptions').delete().eq('user_id', userId);
      await supabase.from('push_logs').delete().eq('user_id', userId);
      // Удаляем аккаунт через edge function (нужен service role для auth.admin.deleteUser)
      // Если нет такой функции — просто разлогиниваем после очистки данных
      await supabase.functions.invoke('delete-user', { body: { user_id: userId } }).catch(() => {});
      analytics.loggedOut();
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Delete account error:', e);
      // Даже если что-то не удалилось — разлогиниваем
      await supabase.auth.signOut();
    }
  };

  const handleImport = async (rows) => {
    const existing = new Set(subscriptions.map(s => s.name + '|' + s.price + '|' + s.period));
    const fresh = rows.filter(r => !existing.has(r.name + '|' + r.price + '|' + r.period));
    if (!fresh.length) return;
    const toInsert = fresh.map(r => ({
      user_id:       session.user.id,
      name:          r.name          || '',
      price:         parseFloat(r.price) || 0,
      currency_code: r.currency_code  || 'USD',
      period:        r.period         || 'monthly',
      category:      r.category       || 'other',
      logo:          r.logo           || '',
      status:        r.status         || 'active',
      date:          r.date           || '',
      trial_end:     r.trial_end      || null,
    }));
    const { data } = await supabase.from('subscriptions').insert(toInsert).select();
    if (data) setSubscriptions(prev => [...prev, ...data]);
  };

  if (loading) return <LogoLoader />;

  return (
    <div className="min-h-screen bg-black text-white font-sans flex justify-center select-none">
      <div className="w-full max-w-[450px] min-h-screen border-x border-zinc-900 bg-black flex flex-col relative overflow-hidden">

        {/* ── Офлайн баннер ── */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
              <p className="text-[11px] text-zinc-500 tracking-wide">{t.offline_banner}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Контент со свайпом между вкладками */}
        <div ref={el => { swipeRef.current = el; }} className="flex-1 relative overflow-hidden">

          {/* ════ HOME ════ */}
          <div ref={tabRefs.home} className={`absolute inset-0 overflow-y-auto no-scrollbar pb-32 safe-top ${activeTab === 'home' ? 'block' : 'hidden'}`}>
            <div className="p-4 space-y-5">
              <header className="relative flex items-center justify-between px-1 pt-2">
                <SupportMenu />
                <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold tracking-tight whitespace-nowrap">CheckUrSubs</h1>
                <div className="flex items-center gap-2">
                  {/* Переключатель языка — тогл */}
                  <button onClick={toggleLang}
                    className="relative flex items-center h-7 w-[64px] rounded-full border border-zinc-700 bg-zinc-900 p-0.5 transition-all active:scale-95">
                    {/* Ползунок */}
                    <motion.div
                      animate={{ x: lang === 'en' ? 32 : 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute w-[28px] h-[22px] rounded-full bg-white shadow-sm"
                    />
                    {/* Лейблы */}
                    <span className={`relative z-10 flex-1 text-center text-[10px] font-bold tracking-wide transition-colors ${lang === 'ru' ? 'text-black' : 'text-zinc-500'}`}>RU</span>
                    <span className={`relative z-10 flex-1 text-center text-[10px] font-bold tracking-wide transition-colors ${lang === 'en' ? 'text-black' : 'text-zinc-500'}`}>EN</span>
                  </button>
                  <AvatarMenu session={session} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />
                </div>
              </header>

              {/* Push-баннер */}
              <AnimatePresence>
                {pushBanner && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{t.push_title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{t.push_subtitle}</p>
                    </div>
                    <button onClick={subscribePush}
                      className="text-xs font-semibold text-violet-400 bg-violet-500/15 border border-violet-500/30 px-3 py-1.5 rounded-xl shrink-0 active:scale-95 transition">
                      {t.push_enable}
                    </button>
                    <button onClick={dismissPushBanner} className="text-zinc-600 hover:text-zinc-400 transition shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <section className="bg-gradient-to-b from-zinc-800/40 to-zinc-900/20 border border-zinc-800 rounded-[40px] p-6 text-center shadow-2xl">
                <p className="text-zinc-500 uppercase text-[10px] tracking-[0.22em] font-semibold mb-2">{t.per_month}</p>
                <h2 className="text-6xl font-bold tracking-tighter mb-3">{fmt(totalMonthlyUSD)}</h2>
                <div className="flex items-center justify-center gap-2">
                  <CurrencySelector value={currency} onChange={(c) => { setCurrency(c); localStorage.setItem('currencyManual', '1'); analytics.currencyChanged(c); }} />
                  <button onClick={() => { setRatesLoading(true); fetchRates().then(r => { if (r) setRates(r); setRatesLoading(false); }); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800/70 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition active:scale-95">
                    <RefreshCw className={`w-3 h-3 ${ratesLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="flex items-center justify-center flex-wrap gap-2 mt-3">
                  {(() => {
                    const active  = subscriptions.filter(s => !s.status || s.status === 'active').length;
                    const paused  = subscriptions.filter(s => s.status === 'paused').length;
                    const trial   = subscriptions.filter(s => s.status === 'trial').length;
                    return <>
                      <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.16em]">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        {t.active_count(active)}
                      </div>
                      {paused > 0 && (
                        <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.16em]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          {t.paused_count(paused)}
                        </div>
                      )}
                      {trial > 0 && (
                        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.16em]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          {t.trial_count(trial)}
                        </div>
                      )}
                    </>;
                  })()}
                </div>
                <div className="grid grid-cols-2 mt-5 text-left border-t border-zinc-800/60 pt-4">
                  <div>
                    <p className="text-xl font-semibold">{fmt(totalYearlyUSD)}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-semibold mt-1">{t.per_year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold">{fmt(totalMonthlyUSD / 30)}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-semibold mt-1">{t.per_day}</p>
                  </div>
                </div>
              </section>

              {/* Кнопка добавить */}
              <div className="flex justify-center -mt-1">
                <button onClick={openAdd}
                  className="w-2/3 flex items-center justify-center gap-2 bg-white text-black font-semibold text-sm rounded-2xl py-3.5 active:scale-[0.97] transition shadow-lg">
                  <Plus className="w-4 h-4" />
                  {t.add_sub}
                </button>
              </div>

              <SoonSection soonSubs={soonSubs} fmt={fmt} fmtOriginal={fmtOriginal} monthly={monthly} />

              {subscriptions.length === 0 ? (
                /* ── Empty state ── */
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="flex flex-col items-center text-center px-6 py-10 space-y-5">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-[32px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <CreditCard className="w-10 h-10 text-zinc-700" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-zinc-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold tracking-tight">{t.empty_title}</p>
                    <p className="text-sm text-zinc-500 leading-relaxed max-w-[260px]">
                      {t.empty_subtitle}
                    </p>
                  </div>
                  <button onClick={openAdd}
                    className="flex items-center gap-2 bg-white text-black font-semibold text-sm rounded-2xl px-6 py-3 active:scale-95 transition shadow-lg">
                    <Plus className="w-4 h-4" />
                    {t.add_first_sub}
                  </button>
                </motion.div>
              ) : (
                <section className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <SectionTitle icon={List} label={t.all_subs} />
                    <button onClick={cycleSortBy} className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition font-semibold uppercase tracking-wide">
                      <ArrowUpDown className="w-3 h-3" />{sortLabel}
                    </button>
                  </div>
                  <div className="relative px-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t.search_placeholder}
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-zinc-600 transition text-zinc-200 placeholder:text-zinc-600" />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 divide-y divide-zinc-800/80 overflow-hidden">
                    {!swipeHinted && sortedSubs.length > 0 && (
                      <div className="px-4 py-2 text-[10px] text-zinc-600 text-center tracking-wide">
                        {t.swipe_hint}
                      </div>
                    )}
                    {sortedSubs.map(sub => (
                      <SubscriptionRow key={sub.id} sub={sub} fmtOriginal={fmtOriginal}
                        onEdit={() => openEdit(sub)} onDelete={() => setConfirmSub(sub)} />
                    ))}
                    {sortedSubs.length === 0 && searchQuery && (
                      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                        <Search className="w-6 h-6 text-zinc-700" />
                        <p className="text-sm text-zinc-500">{t.nothing_found(searchQuery)}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* ════ CALENDAR ════ */}
          <div ref={tabRefs.calendar} className={`absolute inset-0 overflow-y-auto no-scrollbar pb-32 safe-top ${activeTab === 'calendar' ? 'block' : 'hidden'}`}>
            <div className="p-4 pt-6 space-y-5">
              <header className="flex flex-col items-center gap-2 pt-2 mb-2">
                <h2 className="text-lg font-semibold tracking-tight">{t.calendar_title}</h2>
                <div className="w-9 h-9 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  <CalendarDays className="w-4 h-4 text-sky-300" />
                </div>
              </header>
              {(() => {
                const now    = new Date();
                const isPast = calYear < now.getFullYear() || (calYear === now.getFullYear() && calMonth < now.getMonth());
                const calSubs = subscriptions.filter(sub => sub.status !== 'paused');
                const activCalSubs = calSubs.filter(s => !s.status || s.status === 'active');
                const calTotal = activCalSubs.reduce((a, s) => {
                  if (s.period === 'yearly') {
                    const billingMonth = extractBillingMonth(s.date);
                    return billingMonth === calMonth ? a + monthly(s) * 12 : a;
                  }
                  return a + monthly(s);
                }, 0);
                const calYearly = activCalSubs.reduce((a, s) => a + monthly(s) * 12, 0);
                return (
                  <CalendarSection subscriptions={subscriptions} fmt={fmt} fmtReal={fmtReal} monthly={monthly} month={calMonth} year={calYear}
                    onPrev={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }}
                    onNext={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }}
                    calTotal={calTotal} calYearly={calYearly} isPast={isPast} calMonth={calMonth}
                  />
                );
              })()}
            </div>
          </div>

          {/* ════ ANALYTICS ════ */}
          <div ref={tabRefs.analytics} className={`absolute inset-0 overflow-y-auto no-scrollbar pb-32 safe-top ${activeTab === 'analytics' ? 'block' : 'hidden'}`}>
            <div className="p-4 pt-6 space-y-4">
              <header className="relative flex items-center justify-between px-1 pt-2 mb-2">
                <div className="w-10 h-10" />{/* spacer */}
                <div className="flex flex-col items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">{t.analytics_title}</h2>
                  <div className="w-9 h-9 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
                    <BarChart2 className="w-4 h-4 text-purple-300" />
                  </div>
                </div>
                <ImportExportMenu subscriptions={subscriptions} onImport={handleImport} />
              </header>
              <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 uppercase tracking-[0.16em]">{t.per_month}</span>
                  <span className="text-base font-semibold">{fmt(totalMonthlyUSD)}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 rounded-full" />
                </div>
              </div>

              {/* ── Тренд расходов по месяцам ── */}
              {(() => {
                const now = new Date();
                const monthLabels = lang === 'ru' ? MONTHS_SHORT_RU : MONTHS_SHORT;

                // Строим диапазон месяцев (trendRange штук, включая текущий)
                const months = Array.from({ length: trendRange }, (_, i) => {
                  const d = new Date(now.getFullYear(), now.getMonth() - (trendRange - 1 - i), 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                });

                // Для каждого месяца считаем реальные списания по датам биллинга
                const monthlyTotals = months.map(({ month, year }) => {
                  return subscriptions.reduce((sum, s) => {
                    if (s.status === 'paused') return sum;
                    if (s.status === 'trial') return sum; // пробные не списываются

                    const billingDay   = extractBillingDay(s.date);
                    const billingMonth = extractBillingMonth(s.date); // null для месячных

                    if (!billingDay) return sum;

                    if (s.period === 'monthly') {
                      // Месячная — списывается каждый месяц
                      return sum + toUSD(s.price ?? 0, s.currency_code || 'USD', rates);
                    }

                    if (s.period === 'yearly') {
                      // Годовая — только в тот месяц когда реально списывается
                      if (billingMonth !== null && billingMonth === month) {
                        return sum + toUSD(s.price ?? 0, s.currency_code || 'USD', rates);
                      }
                      return sum;
                    }

                    return sum;
                  }, 0);
                });

                const maxVal     = Math.max(...monthlyTotals, 0.01);
                const totalRange = monthlyTotals.reduce((a, v) => a + v, 0);

                return (
                  <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-5">
                    {/* Заголовок + переключатель */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs text-zinc-500 uppercase tracking-[0.16em]">{t.trend_title}</p>
                      <div className="flex items-center gap-1 bg-zinc-800 rounded-xl p-0.5">
                        {[3, 6, 12].map(r => (
                          <button key={r} onClick={() => setTrendRange(r)}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition ${
                              trendRange === r ? 'bg-zinc-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                            }`}>
                            {r}{lang === 'ru' ? 'м' : 'm'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Бары */}
                    <div className="flex items-end gap-1 h-16">
                      {monthlyTotals.map((val, i) => {
                        const isCurrentMonth = i === trendRange - 1;
                        const heightPct = maxVal > 0 ? Math.max(5, (val / maxVal) * 100) : 5;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex items-end" style={{ height: '48px' }}>
                              <motion.div
                                key={`${trendRange}-${i}`}
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPct}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.03 }}
                                className={`w-full rounded-md ${isCurrentMonth ? 'bg-purple-500' : val > 0 ? 'bg-zinc-600' : 'bg-zinc-800'}`}
                                style={{ minHeight: '3px' }}
                              />
                            </div>
                            {/* Показываем метку только если баров не слишком много */}
                            {(trendRange <= 6 || i % 2 === 0) && (
                              <span className={`text-[8px] font-medium leading-none ${isCurrentMonth ? 'text-purple-400' : 'text-zinc-600'}`}>
                                {monthLabels[months[i].month]}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Итог за период */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800">
                      <span className="text-[10px] text-zinc-500">
                        {lang === 'ru' ? `За ${trendRange} мес.` : `Last ${trendRange}mo`}
                      </span>
                      <span className="text-sm font-semibold">{fmt(totalRange)}</span>
                    </div>
                  </div>
                );
              })()}
              {byCategory.length > 0 && (
                <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-5 space-y-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-[0.16em]">{t.by_categories}</p>
                  {byCategory.map(cat => {
                    const share = totalMonthlyUSD ? (cat.total / totalMonthlyUSD) * 100 : 0;
                    const Icon  = cat.icon;
                    return (
                      <div key={cat.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${cat.bg} border ${cat.border}`}>
                              <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{t[cat.labelKey]}</p>
                              <p className="text-[10px] text-zinc-500">{cat.subs.length}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold">{fmt(cat.total)}</p>
                            <p className="text-[10px] text-zinc-500">{share.toFixed(0)}%</p>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, share)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }} className={`h-full rounded-full ${cat.bar}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* По подпискам */}
              <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-5 space-y-4">
                <p className="text-xs text-zinc-500 uppercase tracking-[0.16em]">{t.by_subscriptions}</p>
                {activeSubs.length === 0 && <p className="text-sm text-zinc-500">{t.add_first_sub}</p>}
                {[...activeSubs].sort((a, b) => monthly(b) - monthly(a)).map(sub => {
                  const share = totalMonthlyUSD ? (monthly(sub) / totalMonthlyUSD) * 100 : 0;
                  return (
                    <div key={sub.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <LogoIcon sub={sub} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{sub.name}</p>
                            <p className="text-xs text-zinc-500">{fmt(monthly(sub))} / {t.sub_per_month}</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold shrink-0">{share.toFixed(0)}<span className="text-xs text-zinc-500 ml-0.5">%</span></p>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, share)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }} className="h-full bg-purple-500 rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Пробный период — внизу */}
              {(() => {
                const trialSubs = subscriptions.filter(s => s.status === 'trial');
                if (trialSubs.length === 0) return null;
                return (
                  <div className="bg-[#1C1C1E] rounded-3xl border border-amber-500/20 p-5 space-y-3">
                    <p className="text-xs text-amber-400/70 uppercase tracking-[0.16em]">{t.trial_period}</p>
                    {trialSubs.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <LogoIcon sub={sub} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{sub.name}</p>
                            {sub.trial_end && <p className="text-[10px] text-zinc-500">{fmtDateFromISO(sub.trial_end, lang, 'long')}</p>}
                          </div>
                        </div>
                        <p className="text-sm text-zinc-500 shrink-0">—</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {/* На паузе — внизу */}
              {(() => {
                const pausedSubs = subscriptions.filter(s => s.status === 'paused');
                if (pausedSubs.length === 0) return null;
                return (
                  <div className="bg-[#1C1C1E] rounded-3xl border border-red-500/20 p-5 space-y-3">
                    <p className="text-xs text-red-400/70 uppercase tracking-[0.16em]">{t.on_pause}</p>
                    {pausedSubs.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <LogoIcon sub={sub} size="sm" />
                          <p className="text-sm font-medium truncate">{sub.name}</p>
                        </div>
                        <p className="text-sm text-zinc-500 shrink-0">—</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ── Навбар ── */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none safe-bottom z-30">
          <nav className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-full py-3 px-4 max-w-[360px] w-full grid grid-cols-3 shadow-2xl pointer-events-auto">
            <NavItem icon={Home}         label={t.nav_home}      active={activeTab === 'home'}      onClick={() => switchTab('home')} />
            <NavItem icon={CalendarDays} label={t.nav_calendar}  active={activeTab === 'calendar'}  onClick={() => switchTab('calendar')} />
            <NavItem icon={BarChart2}    label={t.nav_analytics} active={activeTab === 'analytics'} onClick={() => switchTab('analytics')} />
          </nav>
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <SubModal key={editingSub?.id || 'new'} initial={editingSub} currency={currency}
              onSave={handleSave} onClose={() => { setIsModalOpen(false); setEditingSub(null); }} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-24 left-0 right-0 flex justify-center px-4 pointer-events-none z-40">
              <div className="pointer-events-auto max-w-[420px] w-full bg-zinc-900 border border-red-500/30 rounded-2xl px-4 py-3 flex flex-col gap-2 shadow-xl shadow-red-500/10">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-medium text-zinc-50">{t.sub_deleted}</p>
                    <p className="text-xs text-zinc-400 truncate">{toast.sub?.name}</p>
                  </div>
                  <button onClick={undoDelete} className="text-xs font-semibold text-red-400 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/40 active:scale-95 transition shrink-0">
                    {t.undo}
                  </button>
                </div>
                <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-red-500 animate-toast-progress" />
                </div>
              </div>
            </motion.div>
          )}
                </AnimatePresence>

<AnimatePresence>
  {confirmSub && (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      onClick={() => setConfirmSub(null)}>
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[420px] bg-zinc-900 border border-zinc-700 rounded-t-3xl px-4 pt-5 pb-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">{t.sub_delete || 'Delete'} «{confirmSub.name}»?</p>
            <p className="text-xs text-zinc-500 mt-0.5">{t.delete_confirm_hint || 'Вы уверены?'}</p>
          </div>
        </div>
        <button
          onClick={() => { triggerDelete(confirmSub); setConfirmSub(null); }}
          className="w-full bg-red-600/90 hover:bg-red-600 text-white text-sm font-semibold py-3 rounded-2xl active:scale-[0.98] transition mb-3">
          {t.sub_delete || 'Delete'}
        </button>
        <button
          onClick={() => setConfirmSub(null)}
          className="w-full text-zinc-400 text-sm py-2 active:scale-[0.98] transition">
          {t.modal_cancel || 'Cancel'}
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
</div>
</div>
);
};

// ─── Анимация строки для онбординга ───────────────────────────────────────────
// ─── Онбординг ─────────────────────────────────────────────────────────────────
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

                {/* Анимация свайпа (только на слайде swipe) */}
                {s.type === 'swipe' && (
                  <div className="w-full mb-4">
                    <SwipeDemo />
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

// ─── Модалка ───────────────────────────────────────────────────────────────────
const SubModal = ({ initial, currency, onSave, onClose }) => {
  const t    = useT();
  const lang = useLang();
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

  // Автосаджест
  useEffect(() => {
    if (justApplied.current) { justApplied.current = false; return; }
    const q = name.trim().toLowerCase();
    if (q.length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    const matches = SERVICE_CATALOG.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.aliases || []).some(a => a.toLowerCase().includes(q))
    ).slice(0, 5);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0 && !initial);
  }, [name]);

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
            const labelPre  = lang === 'ru' ? 'Как '          : 'How to ';
            const labelLink = lang === 'ru' ? 'отменить подписку' : 'cancel subscription';
            return (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                  <X className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="text-xs text-zinc-400">
                    {labelPre}
                    <a href={entry.cancelUrl} target="_blank" rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 transition underline underline-offset-2">
                      {labelLink}
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

// ─── Root: онбординг → авторизация → приложение ────────────────────────────────
// Определён последним — все const-компоненты уже объявлены выше
export default function Root() {
  const [session,   setSession]   = useState(undefined);
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('onboarded') === '1');
  const [lang,      setLang]      = useState(() => {
    const saved = localStorage.getItem('lang');
    if (saved) return saved;
    // Автодетект при первом визите: ru/uk/be → RU, всё остальное → EN
    const nav = (navigator.language || navigator.languages?.[0] || 'en').toLowerCase();
    return (nav.startsWith('ru') || nav.startsWith('uk') || nav.startsWith('be')) ? 'ru' : 'en';
  });

  const toggleLang = () => {
    const next = lang === 'ru' ? 'en' : 'ru';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_IN' && (window.location.search || window.location.hash)) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return <LogoLoader />;

  if (!onboarded) return (
    <LangContext.Provider value={lang}>
      <Onboarding toggleLang={toggleLang} lang={lang} onDone={(skippedAt) => {
        if (skippedAt !== undefined) analytics.onboardingSkipped(skippedAt);
        else analytics.onboardingCompleted();
        setOnboarded(true);
        localStorage.setItem('onboarded', '1');
      }} />
    </LangContext.Provider>
  );
  if (!session) return (
    <LangContext.Provider value={lang}>
      <Auth />
    </LangContext.Provider>
  );
  return (
    <LangContext.Provider value={lang}>
      <App session={session} toggleLang={toggleLang} lang={lang} />
    </LangContext.Provider>
  );
}
