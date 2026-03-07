import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
  Home, List, BarChart2, Plus, Pencil, Trash2, CreditCard,
  CalendarDays, ChevronDown, Check, ArrowUpDown, Search, X,
  RefreshCw, Gamepad2, Briefcase, Cloud, Music, BookOpen, Zap,
  Shield, Heart, Sparkles, SwatchBook, ChevronRight, LogOut,
  Wifi, Globe, Phone, Server, Tv, MonitorSmartphone, Package, Wallet
} from 'lucide-react';
import { supabase } from './lib/supabase';
import Auth from './Auth';

// ─── Категории ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'entertainment', label: 'Развлечения', icon: Music,     color: 'text-pink-400',   bg: 'bg-pink-500/15',   border: 'border-pink-500/30',   bar: 'bg-pink-500'   },
  { id: 'work',          label: 'Работа',      icon: Briefcase, color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   bar: 'bg-blue-500'   },
  { id: 'internet',      label: 'Интернет',    icon: Globe,     color: 'text-sky-400',    bg: 'bg-sky-500/15',    border: 'border-sky-500/30',    bar: 'bg-sky-500'    },
  { id: 'games',         label: 'Игры',        icon: Gamepad2,  color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30',  bar: 'bg-green-500'  },
  { id: 'education',     label: 'Обучение',    icon: BookOpen,  color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  bar: 'bg-amber-500'  },
  { id: 'vpn',           label: 'VPN',         icon: Shield,    color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30', bar: 'bg-violet-500' },
  { id: 'health',        label: 'Здоровье',    icon: Heart,     color: 'text-rose-400',   bg: 'bg-rose-500/15',   border: 'border-rose-500/30',   bar: 'bg-rose-500'   },
  { id: 'banking',       label: 'Банкинг',     icon: Wallet,    color: 'text-emerald-400',bg: 'bg-emerald-500/15',border: 'border-emerald-500/30',bar: 'bg-emerald-500'},
  { id: 'telecom',       label: 'Связь',       icon: Phone,     color: 'text-cyan-400',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/30',   bar: 'bg-cyan-500'   },
  { id: 'other',         label: 'Другое',      icon: Zap,       color: 'text-zinc-400',   bg: 'bg-zinc-500/15',   border: 'border-zinc-500/30',   bar: 'bg-zinc-500'   },
];
const getCat = (id) => CATEGORIES.find(c => c.id === id) || null;

// ─── Валюты ────────────────────────────────────────────────────────────────────
const CURRENCIES    = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'RUB', symbol: '₽', label: 'RUB (₽)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];
const getCurrency   = (code) => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
const DEFAULT_RATES = { USD: 1, EUR: 0.92, RUB: 90, GBP: 0.79 };

const fetchRates = async () => {
  try {
    const res  = await fetch('https://api.frankfurter.app/latest?base=USD&symbols=EUR,RUB,GBP');
    const data = await res.json();
    const rates = { USD: 1, ...data.rates };
    localStorage.setItem('fxRates',   JSON.stringify(rates));
    localStorage.setItem('fxRatesAt', Date.now().toString());
    return rates;
  } catch { return null; }
};

const loadRates = () => {
  try {
    const raw = localStorage.getItem('fxRates');
    const at  = Number(localStorage.getItem('fxRatesAt') || 0);
    if (raw && Date.now() - at < 4 * 60 * 60 * 1000) return JSON.parse(raw);
  } catch {}
  return null;
};

// ─── Константы ────────────────────────────────────────────────────────────────
const MONTHS_SHORT    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_RU       = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_GENITIVE = ['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре'];
const DAYS_RU         = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const TABS            = ['home', 'calendar', 'analytics'];

// ─── Каталог известных сервисов (для автосаджеста) ─────────────────────────────
const SERVICE_CATALOG = [
  { name: 'Spotify',              aliases: ['спотифай','спотифай','spotify'], domain: 'spotify.com',        category: 'entertainment' },
  { name: 'Netflix',              aliases: ['нетфликс','нетфлекс'],           domain: 'netflix.com',        category: 'entertainment' },
  { name: 'YouTube Premium',      aliases: ['ютуб','ютуб премиум','youtube'], domain: 'youtube.com',        category: 'entertainment' },
  { name: 'Apple Music',          aliases: ['эпл мьюзик','эпл музик'],        domain: 'apple.com',          category: 'entertainment' },
  { name: 'Apple TV+',            aliases: ['эпл тв'],                        domain: 'apple.com',          category: 'entertainment' },
  { name: 'Twitch',               aliases: ['твич'],                          domain: 'twitch.tv',          category: 'entertainment' },
  { name: 'Disney+',              aliases: ['дисней'],                        domain: 'disneyplus.com',     category: 'entertainment' },
  { name: 'HBO Max',              aliases: ['хбо'],                           domain: 'hbomax.com',         category: 'entertainment' },
  { name: 'Hulu',                 aliases: ['хулу'],                          domain: 'hulu.com',           category: 'entertainment' },
  { name: 'Paramount+',           aliases: ['парамаунт'],                     domain: 'paramountplus.com',  category: 'entertainment' },
  { name: 'Amazon Prime',         aliases: ['амазон','амазон прайм'],         domain: 'amazon.com',         category: 'entertainment' },
  { name: 'Claude Pro',           aliases: ['клод'],                          domain: 'anthropic.com',      category: 'work'          },
  { name: 'ChatGPT Plus',         aliases: ['чатгпт','гпт','chatgpt'],        domain: 'openai.com',         category: 'work'          },
  { name: 'Notion',               aliases: ['ноушн','ноtion'],                domain: 'notion.so',          category: 'work'          },
  { name: 'Figma',                aliases: ['фигма'],                         domain: 'figma.com',          category: 'work'          },
  { name: 'Linear',               aliases: ['линеар'],                        domain: 'linear.app',         category: 'work'          },
  { name: 'Slack',                aliases: ['слак'],                          domain: 'slack.com',          category: 'work'          },
  { name: 'Zoom',                 aliases: ['зум'],                           domain: 'zoom.us',            category: 'work'          },
  { name: 'Loom',                 aliases: ['лум'],                           domain: 'loom.com',           category: 'work'          },
  { name: 'Adobe Creative Cloud', aliases: ['адоб','адобе','adobe'],          domain: 'adobe.com',          category: 'work'          },
  { name: 'Grammarly',            aliases: ['грамарли'],                      domain: 'grammarly.com',      category: 'work'          },
  { name: 'Canva',                aliases: ['канва'],                         domain: 'canva.com',          category: 'work'          },
  { name: 'Miro',                 aliases: ['миро'],                          domain: 'miro.com',           category: 'work'          },
  { name: 'GitHub Copilot',       aliases: ['гитхаб','github'],               domain: 'github.com',         category: 'work'          },
  { name: 'Cursor',               aliases: ['курсор'],                        domain: 'cursor.com',         category: 'work'          },
  { name: 'Perplexity',           aliases: ['перплексити'],                   domain: 'perplexity.ai',      category: 'work'          },
  { name: 'Vercel',               aliases: ['версель'],                       domain: 'vercel.com',         category: 'work'          },
  { name: 'iCloud',               aliases: ['айклауд','icloud'],              domain: 'apple.com',          category: 'internet'      },
  { name: 'Google One',           aliases: ['гугл ван','гугл','google one'],  domain: 'google.com',         category: 'internet'      },
  { name: 'Dropbox',              aliases: ['дропбокс'],                      domain: 'dropbox.com',        category: 'internet'      },
  { name: '1Password',            aliases: ['1пасворд','ванпасворд'],         domain: '1password.com',      category: 'internet'      },
  { name: 'Тинькофф Про',        aliases: ['тинькофф','тинькофф про','tinkoff pro','тинько'], domain: 'tinkoff.ru', category: 'banking' },
  { name: 'СберПрайм',           aliases: ['сбер прайм','сберпрайм','сбер'], domain: 'sber.ru',            category: 'banking'       },
  { name: 'Альфа-Банк',          aliases: ['альфа','альфабанк'],             domain: 'alfabank.ru',        category: 'banking'       },
  { name: 'МТС',                 aliases: ['мтс','mts'],                     domain: 'mts.ru',             category: 'telecom'       },
  { name: 'Билайн',              aliases: ['билайн','beeline'],              domain: 'beeline.ru',         category: 'telecom'       },
  { name: 'МегаФон',             aliases: ['мегафон','megafon'],             domain: 'megafon.ru',         category: 'telecom'       },
  { name: 'Т2',                  aliases: ['т2','теле2','tele2'],             domain: 'tele2.ru',           category: 'telecom'       },
  { name: 'Xbox Game Pass',       aliases: ['иксбокс','xbox'],                domain: 'xbox.com',           category: 'games'         },
  { name: 'PlayStation Plus',     aliases: ['плойка','пс','ps plus'],         domain: 'playstation.com',    category: 'games'         },
  { name: 'Steam',                aliases: ['стим'],                          domain: 'steampowered.com',   category: 'games'         },
  { name: 'Duolingo',             aliases: ['дуолинго'],                      domain: 'duolingo.com',       category: 'education'     },
  { name: 'Coursera',             aliases: ['курсера'],                       domain: 'coursera.org',       category: 'education'     },
  { name: 'Skillshare',           aliases: ['скилшер'],                       domain: 'skillshare.com',     category: 'education'     },
  { name: 'Udemy',                aliases: ['юдеми'],                         domain: 'udemy.com',          category: 'education'     },
  { name: 'Masterclass',          aliases: ['мастеркласс'],                   domain: 'masterclass.com',    category: 'education'     },
  { name: 'NordVPN',              aliases: ['норд впн','nordvpn'],            domain: 'nordvpn.com',        category: 'vpn'           },
  { name: 'ExpressVPN',           aliases: ['экспресс впн'],                  domain: 'expressvpn.com',     category: 'vpn'           },
  { name: 'Telegram Premium',     aliases: ['телеграм','тг','telegram'],      domain: 'telegram.org',       category: 'other'         },
  { name: 'Discord Nitro',        aliases: ['дискорд','discord'],             domain: 'discord.com',        category: 'entertainment' },
  { name: 'VK Музыка',            aliases: ['вк музыка','вк'],               domain: 'vk.com',             category: 'entertainment' },
  { name: 'Яндекс Плюс',         aliases: ['яндекс плюс','яплюс','яндекс'], domain: 'ya.ru',              category: 'entertainment' },
  { name: 'Кинопоиск',            aliases: ['кинопоиск'],                     domain: 'kinopoisk.ru',       category: 'entertainment' },
  { name: 'START',                aliases: ['старт'],                         domain: 'start.ru',           category: 'entertainment' },
  { name: 'Иви',                  aliases: ['ivi'],                           domain: 'ivi.ru',             category: 'entertainment' },
  // ── Утилитарные — с иконками Lucide вместо favicon ──
  { name: 'Интернет',   aliases: ['инет','internet','провайдер'],            lucideIcon: Globe,   category: 'internet'  },
  { name: 'Связь',      aliases: ['телефон','мобильная связь','оператор'],   lucideIcon: Phone,   category: 'telecom'   },
  { name: 'Сервер',     aliases: ['server','хостинг','хост','vps','вдс'],    lucideIcon: Server,  category: 'internet'  },
  { name: 'Wi-Fi',      aliases: ['вайфай','wifi','роутер'],                 lucideIcon: Wifi,    category: 'internet'  },
  { name: 'ТВ',         aliases: ['телевидение','тв','tv','cable'],          lucideIcon: Tv,      category: 'entertainment' },
  { name: 'Подписка',   aliases: ['subscription'],                           lucideIcon: Package, category: 'other'     },
];

// Ищет запись в каталоге по имени или алиасам
const getCatalogEntry = (name) => {
  const q = (name || '').toLowerCase().trim();
  if (!q) return null;
  return SERVICE_CATALOG.find(s =>
    s.name.toLowerCase() === q ||
    (s.aliases || []).some(a => a.toLowerCase() === q)
  ) || null;
};

const getLogoUrl = (sub) => {
  if (sub.logo) return sub.logo;
  const entry = getCatalogEntry(sub.name);
  if (entry?.lucideIcon) return null; // иконка Lucide — не favicon
  if (entry?.domain) return `https://www.google.com/s2/favicons?sz=64&domain=${entry.domain}`;
  // Фоллбэк — угадываем домен
  const first = (sub.name || '').toLowerCase().trim().split(/\s+/)[0].replace(/[^a-z0-9]/g, '');
  if (!first) return null;
  return `https://www.google.com/s2/favicons?sz=64&domain=${first}.com`;
};

const getLucideIcon = (sub) => {
  const entry = getCatalogEntry(sub.name);
  return entry?.lucideIcon || null;
};

// ─── Утилиты ───────────────────────────────────────────────────────────────────
const extractBillingDay = (raw) => {
  if (!raw) return null;
  const m = String(raw).match(/\d+/);
  if (!m) return null;
  const d = parseInt(m[0], 10);
  return (Number.isFinite(d) && d >= 1 && d <= 31) ? d : null;
};

// "8 Mar" → 2 (0-based, как Date.getMonth())
const extractBillingMonth = (raw) => {
  if (!raw) return null;
  const parts = String(raw).trim().split(/\s+/);
  if (parts.length < 2) return null;
  const idx = MONTHS_SHORT.indexOf(parts[1]);
  return idx >= 0 ? idx : null;
};

const isDueWithinDays = (sub, days = 7) => {
  const now        = new Date();
  const billingDay = sub.billingDay ?? extractBillingDay(sub.date);
  if (!billingDay) return false;

  // Годовые — только если сейчас тот же месяц списания
  if (sub.period === 'yearly') {
    const billingMonth = extractBillingMonth(sub.date);
    if (billingMonth === null || billingMonth !== now.getMonth()) return false;
  }

  return ((billingDay - now.getDate() + 31) % 31) <= days;
};

// price в оригинальной валюте → USD для суммирования
const toUSD = (price, currencyCode, rates) => {
  const rate = rates?.[currencyCode] ?? DEFAULT_RATES[currencyCode] ?? 1;
  return Number(price || 0) / rate;
};

const monthlyUSD = (sub, rates) => {
  const p = toUSD(sub.price ?? sub.price_usd ?? sub.priceUSD ?? 0, sub.currency_code || 'USD', rates);
  return sub.period === 'yearly' ? p / 12 : p;
};

// ─── Хук drag-scroll (горизонталь) ────────────────────────────────────────────
// ─── Хук drag-scroll (горизонталь, без конфликта с вертикалью) ────────────────
const useDragScroll = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Mouse
    let down = false, startX = 0, sl = 0;
    const onDown = (e) => { if (e.pointerType !== 'mouse') return; down = true; startX = e.clientX; sl = el.scrollLeft; el.setPointerCapture?.(e.pointerId); el.style.cursor = 'grabbing'; };
    const onMove = (e) => { if (!down) return; el.scrollLeft = sl - (e.clientX - startX); };
    const onUp   = (e) => { if (!down) return; down = false; el.releasePointerCapture?.(e.pointerId); el.style.cursor = ''; };
    // Touch — определяем ось по первым пикселям, не блокируем вертикаль
    let tx = 0, ty = 0, tsl = 0, axis = null;
    const onTouchStart = (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; tsl = el.scrollLeft; axis = null; };
    const onTouchMove  = (e) => {
      const dx = e.touches[0].clientX - tx;
      const dy = e.touches[0].clientY - ty;
      if (!axis) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (axis === 'x') { e.preventDefault(); e.stopPropagation(); el.scrollLeft = tsl - dx; }
    };
    el.addEventListener('pointerdown',  onDown);
    el.addEventListener('pointermove',  onMove);
    el.addEventListener('pointerup',    onUp);
    el.addEventListener('pointerleave', onUp);
    el.addEventListener('touchstart',   onTouchStart, { passive: true });
    el.addEventListener('touchmove',    onTouchMove,  { passive: false });
    return () => {
      el.removeEventListener('pointerdown',  onDown);
      el.removeEventListener('pointermove',  onMove);
      el.removeEventListener('pointerup',    onUp);
      el.removeEventListener('pointerleave', onUp);
      el.removeEventListener('touchstart',   onTouchStart);
      el.removeEventListener('touchmove',    onTouchMove);
    };
  }, []);
  return ref;
};

// ─── Хук свайп между вкладками ────────────────────────────────────────────────
const useTabSwipe = (activeTab, setActiveTab, enabled = true) => {
  const ref    = useRef(null);
  const state  = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      // Игнорируем если начали на горизонтальном скроллере или на строке подписки
      const target = e.target.closest('[data-no-tab-swipe]');
      if (target) return;
      state.current = { x: t.clientX, y: t.clientY, active: true };
    };

    const onEnd = (e) => {
      if (!state.current.active) return;
      state.current.active = false;
      const t  = e.changedTouches?.[0];
      if (!t) return;
      const dx = t.clientX - state.current.x;
      const dy = t.clientY - state.current.y;
      // Высокий порог (120px) + строго горизонтально (угол < 30°)
      if (Math.abs(dx) < 120) return;
      if (Math.abs(dy) > Math.abs(dx) * 0.58) return;
      const idx = TABS.indexOf(activeTab);
      if (dx < 0 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1]);
      if (dx > 0 && idx > 0)               setActiveTab(TABS[idx - 1]);
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend',   onEnd,   { passive: true });
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchend', onEnd); };
  }, [activeTab, setActiveTab, enabled]);

  return ref;
};

// ═══════════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════════
const App = ({ session }) => {
  const userId = session.user.id;

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);

  const [currency,     setCurrency]     = useState(() => localStorage.getItem('currency') || 'USD');
  const [rates,        setRates]        = useState(() => loadRates() || DEFAULT_RATES);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [activeTab,    setActiveTab]    = useState('home');
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [editingSub,   setEditingSub]   = useState(null);
  const [toast,        setToast]        = useState(null);
  const [sortBy,       setSortBy]       = useState('name');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [swipeHinted,  setSwipeHinted]  = useState(() => localStorage.getItem('swipeHinted') === '1');
  const [calMonth,     setCalMonth]     = useState(() => new Date().getMonth());
  const [calYear,      setCalYear]      = useState(() => new Date().getFullYear());

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
  };

  // Сбрасываем скролл вкладки при каждом переключении на неё
  useEffect(() => {
    tabRefs[activeTab]?.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const swipeRef = useTabSwipe(activeTab, switchTab, !isModalOpen);

  // ── Загрузка подписок из Supabase ──────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setSubscriptions(data.map(s => ({ ...s, billingDay: extractBillingDay(s.date) })));
        }
        setLoading(false);
      });
  }, [userId]);

  // ── Курсы валют ────────────────────────────────────────────────────────────
  useEffect(() => {
    const cached = loadRates();
    if (!cached) { setRatesLoading(true); fetchRates().then(r => { if (r) setRates(r); setRatesLoading(false); }); }
  }, []);

  useEffect(() => { localStorage.setItem('currency', currency); }, [currency]);

  useEffect(() => {
    if (!swipeHinted && subscriptions.length > 0) {
      const t = setTimeout(() => { setSwipeHinted(true); localStorage.setItem('swipeHinted', '1'); }, 3000);
      return () => clearTimeout(t);
    }
  }, [subscriptions.length, swipeHinted]);

  const totalMonthlyUSD = subscriptions.reduce((a, s) => a + monthly(s), 0);
  const totalYearlyUSD  = totalMonthlyUSD * 12;

  const openAdd  = () => { setEditingSub(null); setIsModalOpen(true); };
  const openEdit = (s) => { setEditingSub(s);   setIsModalOpen(true); };

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
      user_id:       userId,
    };

    if (editingSub) {
      const { data, error } = await supabase
        .from('subscriptions').update(row).eq('id', editingSub.id).select().single();
      if (!error && data) {
        setSubscriptions(prev => prev.map(s =>
          s.id === editingSub.id ? { ...data, billingDay: extractBillingDay(data.date) } : s
        ));
      }
    } else {
      const { data, error } = await supabase
        .from('subscriptions').insert({ ...row, created_at: new Date().toISOString() }).select().single();
      if (!error && data) {
        setSubscriptions(prev => [...prev, { ...data, billingDay: extractBillingDay(data.date) }]);
      }
    }
    setIsModalOpen(false); setEditingSub(null);
  };

  const triggerDelete = async (sub) => {
    setSubscriptions(prev => prev.filter(s => s.id !== sub.id));
    await supabase.from('subscriptions').delete().eq('id', sub.id);
    if (toast?.timeoutId) clearTimeout(toast.timeoutId);
    const timeoutId = window.setTimeout(async () => {
      setToast(null);
    }, 5000);
    setToast({ sub, timeoutId });
  };

  const undoDelete = async () => {
    if (!toast) return;
    clearTimeout(toast.timeoutId);
    const sub = toast.sub;
    const { id, billingDay, ...row } = sub; // убираем id и billingDay — Supabase сам назначит новый id
    const { data, error } = await supabase.from('subscriptions').insert({ ...row, user_id: userId }).select().single();
    if (!error && data) {
      setSubscriptions(prev => [{ ...data, billingDay: extractBillingDay(data.date) }, ...prev]);
    }
    setToast(null);
  };

  const soonSubs = subscriptions
    .filter(s => isDueWithinDays(s, 7))
    .sort((a, b) => (a.billingDay || 99) - (b.billingDay || 99));

  const sortedSubs = [...subscriptions]
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price') return monthly(b) - monthly(a);
      if (sortBy === 'date')  return (a.billingDay || 99) - (b.billingDay || 99);
      return a.name.localeCompare(b.name);
    });

  const sortLabel   = sortBy === 'name' ? 'А–Я' : sortBy === 'price' ? 'Цена' : 'Дата';
  const cycleSortBy = () => setSortBy(p => p === 'name' ? 'price' : p === 'price' ? 'date' : 'name');

  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    subs:  subscriptions.filter(s => s.category === cat.id),
    total: subscriptions.filter(s => s.category === cat.id).reduce((a, s) => a + monthly(s), 0),
  })).filter(c => c.subs.length > 0);

  const handleLogout = () => supabase.auth.signOut();

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans flex justify-center select-none">
      <div className="w-full max-w-[450px] min-h-screen border-x border-zinc-900 bg-black flex flex-col relative overflow-hidden">

        {/* Контент со свайпом между вкладками */}
        <div ref={el => { swipeRef.current = el; }} className="flex-1 relative overflow-hidden">

          {/* ════ HOME ════ */}
          <div ref={tabRefs.home} className={`absolute inset-0 overflow-y-auto no-scrollbar pb-32 safe-top ${activeTab === 'home' ? 'block' : 'hidden'}`}>
            <div className="p-4 space-y-8">
              <header className="relative flex items-center justify-between px-1 pt-2">
                <div className="w-10 h-10" /> {/* spacer */}
                <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold tracking-tight whitespace-nowrap">Подписки</h1>
                {/* Аватар с дропдауном */}
                <AvatarMenu session={session} onLogout={handleLogout} />
              </header>

              <section className="bg-gradient-to-b from-zinc-800/40 to-zinc-900/20 border border-zinc-800 rounded-[40px] p-7 text-center shadow-2xl">
                <p className="text-zinc-500 uppercase text-[10px] tracking-[0.22em] font-semibold mb-2">В месяц</p>
                <h2 className="text-6xl font-bold tracking-tighter mb-3">{fmt(totalMonthlyUSD)}</h2>
                <div className="flex items-center justify-center gap-2">
                  <CurrencySelector value={currency} onChange={setCurrency} />
                  <button onClick={() => { setRatesLoading(true); fetchRates().then(r => { if (r) setRates(r); setRatesLoading(false); }); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800/70 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition active:scale-95">
                    <RefreshCw className={`w-3 h-3 ${ratesLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.16em] mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {subscriptions.length} активных
                </div>
                <div className="grid grid-cols-2 mt-6 text-left border-t border-zinc-800/60 pt-5">
                  <div>
                    <p className="text-xl font-semibold">{fmt(totalYearlyUSD)}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-semibold mt-1">За год</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold">{fmt(totalMonthlyUSD / 30)}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-semibold mt-1">В день</p>
                  </div>
                </div>
              </section>

              {/* Кнопка добавить */}
              <div className="flex justify-center">
                <button onClick={openAdd}
                  className="w-2/3 flex items-center justify-center gap-2 bg-white text-black font-semibold text-sm rounded-2xl py-3.5 active:scale-[0.97] transition shadow-lg">
                  <Plus className="w-4 h-4" />
                  Добавить подписку
                </button>
              </div>

              <SoonSection soonSubs={soonSubs} fmt={fmt} fmtOriginal={fmtOriginal} monthly={monthly} />

              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <SectionTitle icon={List} label="Все подписки" />
                  <button onClick={cycleSortBy} className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition font-semibold uppercase tracking-wide">
                    <ArrowUpDown className="w-3 h-3" />{sortLabel}
                  </button>
                </div>
                <div className="relative px-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск..."
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
                      ← свайп для удаления · свайп для редактирования →
                    </div>
                  )}
                  {sortedSubs.map(sub => (
                    <SubscriptionRow key={sub.id} sub={sub} fmt={fmt} fmtOriginal={fmtOriginal} monthly={monthly}
                      onEdit={() => openEdit(sub)} onDelete={() => triggerDelete(sub)} />
                  ))}
                  {sortedSubs.length === 0 && (
                    <div className="px-4 py-5 text-sm text-zinc-500">
                      {searchQuery ? 'Ничего не найдено' : 'Нажмите «Добавить подписку», чтобы начать.'}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* ════ CALENDAR ════ */}
          <div ref={tabRefs.calendar} className={`absolute inset-0 overflow-y-auto no-scrollbar pb-32 safe-top ${activeTab === 'calendar' ? 'block' : 'hidden'}`}>
            <div className="p-4 pt-6 space-y-5">
              <header className="flex flex-col items-center gap-2 pt-2 mb-2">
                <h2 className="text-lg font-semibold tracking-tight">Календарь</h2>
                <div className="w-9 h-9 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  <CalendarDays className="w-4 h-4 text-sky-300" />
                </div>
              </header>
              <CalendarSection subscriptions={subscriptions} fmt={fmt} fmtReal={fmtReal} monthly={monthly} month={calMonth} year={calYear}
                onPrev={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }}
                onNext={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }}
              />
              {(() => {
                const now    = new Date();
                const isPast = calYear < now.getFullYear() || (calYear === now.getFullYear() && calMonth < now.getMonth());
                const calSubs = subscriptions.filter(sub => {
                  if (!sub.created_at && !sub.createdAt) return true;
                  const c = new Date(sub.created_at ?? sub.createdAt);
                  return c.getFullYear() < calYear || (c.getFullYear() === calYear && c.getMonth() <= calMonth);
                });
                const calTotal = calSubs.reduce((a, s) => {
                  if (s.period === 'yearly') {
                    const billingMonth = extractBillingMonth(s.date);
                    return billingMonth === calMonth ? a + monthly(s) * 12 : a;
                  }
                  return a + monthly(s);
                }, 0);
                // «В год» = месячные × 12 + годовые × 1 (они уже годовые)
                const calYearly = calSubs.reduce((a, s) =>
                  a + monthly(s) * 12, 0);
                return (
                  <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">{isPast ? `Потрачено в ${MONTHS_GENITIVE[calMonth]}` : `Ожидается в ${MONTHS_GENITIVE[calMonth]}`}</span>
                      <span className="font-semibold">{fmt(calTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">В год</span>
                      <span className="font-semibold">{fmt(calYearly)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ════ ANALYTICS ════ */}
          <div ref={tabRefs.analytics} className={`absolute inset-0 overflow-y-auto no-scrollbar pb-32 safe-top ${activeTab === 'analytics' ? 'block' : 'hidden'}`}>
            <div className="p-4 pt-6 space-y-4">
              <header className="flex flex-col items-center gap-2 pt-2 mb-2">
                <h2 className="text-lg font-semibold tracking-tight">Аналитика</h2>
                <div className="w-9 h-9 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  <BarChart2 className="w-4 h-4 text-purple-300" />
                </div>
              </header>
              <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 uppercase tracking-[0.16em]">Всего / мес</span>
                  <span className="text-base font-semibold">{fmt(totalMonthlyUSD)}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 rounded-full" />
                </div>
              </div>
              {byCategory.length > 0 && (
                <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-5 space-y-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-[0.16em]">По категориям</p>
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
                              <p className="text-sm font-medium">{cat.label}</p>
                              <p className="text-[10px] text-zinc-500">{cat.subs.length} подп.</p>
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
              <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-5 space-y-4">
                <p className="text-xs text-zinc-500 uppercase tracking-[0.16em]">По подпискам</p>
                {subscriptions.length === 0 && <p className="text-sm text-zinc-500">Добавьте хотя бы одну подписку.</p>}
                {[...subscriptions].sort((a, b) => monthly(b) - monthly(a)).map(sub => {
                  const share = totalMonthlyUSD ? (monthly(sub) / totalMonthlyUSD) * 100 : 0;
                  return (
                    <div key={sub.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <LogoIcon sub={sub} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{sub.name}</p>
                            <p className="text-xs text-zinc-500">{fmt(monthly(sub))} / мес</p>
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
            </div>
          </div>
        </div>

        {/* ── Навбар ── */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none safe-bottom z-30">
          <nav className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-full py-3 px-4 max-w-[360px] w-full grid grid-cols-3 shadow-2xl pointer-events-auto">
            <NavItem icon={Home}         label="Главная"   active={activeTab === 'home'}      onClick={() => switchTab('home')} />
            <NavItem icon={CalendarDays} label="Календарь" active={activeTab === 'calendar'}  onClick={() => switchTab('calendar')} />
            <NavItem icon={BarChart2}    label="Аналитика" active={activeTab === 'analytics'} onClick={() => switchTab('analytics')} />
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
                    <p className="font-medium text-zinc-50">Подписка удалена</p>
                    <p className="text-xs text-zinc-400 truncate">{toast.sub?.name}</p>
                  </div>
                  <button onClick={undoDelete} className="text-xs font-semibold text-red-400 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/40 active:scale-95 transition shrink-0">
                    Отменить
                  </button>
                </div>
                <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-red-500 animate-toast-progress" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Анимация строки для онбординга ───────────────────────────────────────────
const SwipeDemo = () => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const delays = [1200, 900, 1200, 900];
    const t = setTimeout(() => setPhase(p => (p + 1) % 4), delays[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  const x          = phase === 1 ? -72 : phase === 3 ? 72 : 0;
  const showDelete = phase === 1;
  const showEdit   = phase === 3;

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-zinc-800 relative">
      <div className="absolute inset-0 flex">
        <div className={`flex-1 flex items-center pl-5 gap-2 text-xs font-semibold transition-opacity duration-200 ${showEdit ? 'opacity-100 bg-emerald-600/80' : 'opacity-0'}`}>
          <Pencil className="w-3.5 h-3.5" /> Редактировать
        </div>
        <div className={`flex-1 flex items-center justify-end pr-5 gap-2 text-xs font-semibold transition-opacity duration-200 ${showDelete ? 'opacity-100 bg-red-600/80' : 'opacity-0'}`}>
          Удалить <Trash2 className="w-3.5 h-3.5" />
        </div>
      </div>
      <motion.div
        animate={{ x }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative flex items-center px-4 py-3.5 gap-3 bg-[#1C1C1E]"
      >
        <div className="w-8 h-8 bg-zinc-800 rounded-2xl border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
          <img src="https://www.google.com/s2/favicons?sz=32&domain=spotify.com" className="w-5 h-5 object-contain" alt="" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Spotify</p>
          <p className="text-xs text-zinc-500">$12 / мес · 5 Mar</p>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-pink-500/15 border border-pink-500/30">
          <Music className="w-2.5 h-2.5 text-pink-400" />
        </div>
      </motion.div>
    </div>
  );
};

// ─── Онбординг ─────────────────────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  {
    icon: Sparkles,
    iconColor: 'text-white',
    iconBg: 'bg-zinc-800',
    title: 'Привет!',
    subtitle: 'CheckUrSubs поможет отслеживать все подписки в одном месте — сколько тратишь, когда списывается и на что уходят деньги.',
  },
  {
    icon: Plus,
    iconColor: 'text-black',
    iconBg: 'bg-white',
    title: 'Добавляй подписки',
    subtitle: 'Нажми кнопку + в правом верхнем углу. Введи название — приложение само подскажет сервис и подставит категорию. Укажи сумму и дату списания.',
  },
  {
    type: 'swipe',
    icon: List,
    iconColor: 'text-zinc-300',
    iconBg: 'bg-zinc-800',
    title: 'Управляй подписками',
    subtitle: 'Свайп влево — удалить. Свайп вправо — редактировать.',
  },
  {
    icon: CalendarDays,
    iconColor: 'text-sky-300',
    iconBg: 'bg-sky-500/15',
    title: 'Следи за датами',
    subtitle: 'Вкладка «Календарь» покажет, в какие дни месяца и сколько списывается. Вкладка «Скоро» на главной — ближайшие 7 дней.',
  },
  {
    icon: BarChart2,
    iconColor: 'text-purple-300',
    iconBg: 'bg-purple-500/15',
    title: 'Анализируй расходы',
    subtitle: 'Вкладка «Аналитика» разбивает траты по категориям и сервисам. Выбери удобную валюту — курс обновляется автоматически.',
  },
];

const Onboarding = ({ onDone }) => {
  const [step,  setStep]  = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);

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

        {/* Контент — растягивается, но контролирует выравнивание */}
        <div className="flex-1 flex flex-col px-8 pt-16">

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
            {isLast ? 'Начать' : 'Далее'}
          </button>
          {!isLast && (
            <button onClick={onDone} className="w-full text-zinc-500 text-sm py-2">Пропустить</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Аватар с меню выхода ───────────────────────────────────────────────────────
const AvatarMenu = ({ session, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Закрываем по клику вне
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [open]);

  const user = session?.user;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const email = user?.email || '';
  const initials = email ? email[0].toUpperCase() : '?';

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-700 active:scale-95 transition shrink-0">
        {avatarUrl
          ? <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
          : <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300">{initials}</div>
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.92, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 min-w-[180px] overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-xs text-zinc-400 truncate">{email}</p>
            </div>
            <button onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition active:bg-zinc-700">
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Календарь ─────────────────────────────────────────────────────────────────
const CalendarSection = ({ subscriptions, fmt, fmtReal, monthly, month, year, onPrev, onNext }) => {
  const today       = new Date();
  const isToday     = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset      = (new Date(year, month, 1).getDay() + 6) % 7;

  const visibleSubs = subscriptions.filter(sub => {
    if (!sub.created_at && !sub.createdAt) return true;
    const c = new Date(sub.created_at ?? sub.createdAt);
    return c.getFullYear() < year || (c.getFullYear() === year && c.getMonth() <= month);
  });

  const subsByDay = {};
  visibleSubs.forEach(sub => {
    const d = sub.billingDay ?? extractBillingDay(sub.date);
    if (!d || d < 1 || d > daysInMonth) return;

    // Годовые — только в тот месяц когда реально списывается
    if (sub.period === 'yearly') {
      const billingMonth = extractBillingMonth(sub.date);
      if (billingMonth === null || billingMonth !== month) return;
    }

    if (!subsByDay[d]) subsByDay[d] = [];
    subsByDay[d].push(sub);
  });

  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <button onClick={onPrev} className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95">
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <p className="text-sm font-semibold">{MONTHS_RU[month]} {year}</p>
        <button onClick={onNext} className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95">
          <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {DAYS_RU.map(d => <div key={d} className="text-center text-[10px] text-zinc-600 font-semibold uppercase tracking-wide py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const daySubs = subsByDay[day] || [];
          const hasAny  = daySubs.length > 0;
          const total   = daySubs.reduce((a, s) =>
            a + (s.period === 'yearly' ? monthly(s) * 12 : monthly(s)), 0);
          return (
            <div key={day} className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center
              ${isToday(day) ? 'bg-white text-black' : hasAny ? 'bg-zinc-800 border border-zinc-700' : 'bg-zinc-900/40'}`}>
              <span className={`text-xs font-semibold leading-none ${isToday(day) ? 'text-black' : hasAny ? 'text-white' : 'text-zinc-600'}`}>{day}</span>
              {hasAny && <span className={`text-[8px] font-bold mt-0.5 leading-none ${isToday(day) ? 'text-zinc-600' : 'text-amber-400'}`}>{fmt(total)}</span>}
              {hasAny && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {daySubs.slice(0, 3).map(s => <div key={s.id} className={`w-1 h-1 rounded-full ${s.period === 'yearly' ? 'bg-red-400' : 'bg-purple-400'}`} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {Object.keys(subsByDay).length > 0 && (
        <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 divide-y divide-zinc-800/80 overflow-hidden mt-2">
          {Object.entries(subsByDay).sort(([a],[b]) => Number(a)-Number(b)).flatMap(([day, subs]) =>
            subs.map(sub => (
              <div key={sub.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <LogoIcon sub={sub} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{sub.name}</p>
                    <p className="text-xs text-zinc-500">{day} {MONTHS_SHORT[month]}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold shrink-0">{fmtReal(sub)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Soon ──────────────────────────────────────────────────────────────────────
const SoonSection = ({ soonSubs, fmtOriginal }) => {
  const ref = useDragScroll();
  return (
    <section className="space-y-3">
      <SectionTitle icon={CalendarDays} label="Скоро" />
      {soonSubs.length === 0
        ? <p className="text-sm text-zinc-600 px-1">Нет списаний в ближайшие 7 дней</p>
        : <div ref={ref} data-no-tab-swipe className="flex gap-3 overflow-x-auto no-scrollbar px-1 pb-1">
            {soonSubs.map(sub => <SoonCard key={sub.id} sub={sub} fmtOriginal={fmtOriginal} />)}
          </div>
      }
    </section>
  );
};

// ─── Компоненты ────────────────────────────────────────────────────────────────
const SectionTitle = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 px-1">
    <Icon className="w-4 h-4 text-zinc-400" strokeWidth={2} />
    <h3 className="font-semibold text-base tracking-tight">{label}</h3>
  </div>
);

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

const CategoryBadge = ({ cat, tiny = false }) => {
  const Icon = cat.icon;
  if (tiny) return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${cat.bg} border ${cat.border}`}>
      <Icon className={`w-2.5 h-2.5 ${cat.color}`} />
    </div>
  );
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${cat.bg} border ${cat.border}`}>
      <Icon className={`w-3 h-3 ${cat.color}`} />
      <span className={`text-xs font-medium ${cat.color}`}>{cat.label}</span>
    </div>
  );
};

const SoonCard = ({ sub, fmtOriginal }) => {
  const cat = sub.category ? getCat(sub.category) : null;
  return (
    <div className="w-[168px] bg-[#1C1C1E] rounded-[28px] p-5 border border-zinc-800 active:scale-[0.97] transition shrink-0 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <LogoIcon sub={sub} size="md" />
        <span className="text-[10px] font-bold text-white bg-zinc-800 px-2 py-1 rounded-xl border border-zinc-700 shrink-0 ml-2">{sub.date}</span>
      </div>
      <p className="font-semibold text-sm leading-snug mb-2 flex-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sub.name}</p>
      <div className="flex items-center justify-between gap-1">
        <p className="text-zinc-400 text-xs truncate">{fmtOriginal(sub)}</p>
        {cat && <CategoryBadge cat={cat} tiny />}
      </div>
    </div>
  );
};

const SubscriptionRow = ({ sub, fmt, fmtOriginal, monthly, onEdit, onDelete }) => {
  const cat = sub.category ? getCat(sub.category) : null;
  const x = useMotionValue(0);
  const startRef = useRef(null);
  const isVertical = useRef(false);

  const onPointerDown = (e) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    isVertical.current = false;
  };

  const onPointerMove = (e) => {
    if (!startRef.current) return;
    const dx = Math.abs(e.clientX - startRef.current.x);
    const dy = Math.abs(e.clientY - startRef.current.y);
    if (dx < 4 && dy < 4) return;
    if (!isVertical.current && dy > dx) {
      isVertical.current = true;
      x.set(0); // сбрасываем позицию если определили вертикаль
    }
  };

  return (
    <div className="relative overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}>
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-emerald-600/90 flex items-center pl-6 text-xs font-semibold gap-2">
          <Pencil className="w-3.5 h-3.5" /> Редактировать
        </div>
        <div className="flex-1 bg-red-600/90 flex items-center justify-end pr-6 text-xs font-semibold gap-2">
          Удалить <Trash2 className="w-3.5 h-3.5" />
        </div>
      </div>
      <motion.div
        data-no-tab-swipe
        drag="x"
        dragConstraints={{ left: -80, right: 80 }}
        dragElastic={0.15}
        dragSnapToOrigin
        style={{ x }}
        onDragEnd={(_, info) => {
          if (!isVertical.current) {
            if (info.offset.x <= -60) onDelete();
            else if (info.offset.x >= 60) onEdit();
          }
          startRef.current = null;
          isVertical.current = false;
        }}
        className="relative flex items-center px-4 py-3 gap-3 bg-[#1C1C1E]">
        <LogoIcon sub={sub} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{sub.name}</p>
            {cat && <CategoryBadge cat={cat} tiny />}
          </div>
          <p className="text-xs text-zinc-500 truncate">
            {fmtOriginal(sub)} / {sub.period === 'yearly' ? 'год' : 'мес'}
            {sub.date && sub.date !== '—' && ` · ${sub.date}`}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Валюта ────────────────────────────────────────────────────────────────────
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

// ─── Модалка ───────────────────────────────────────────────────────────────────
const SubModal = ({ initial, currency, onSave, onClose }) => {
  // Валюта модалки: при редактировании — оригинальная валюта подписки, при добавлении — текущая глобальная
  const [modalCurrency, setModalCurrency] = useState(initial?.currency_code || currency);
  const curr = getCurrency(modalCurrency);

  const [name,     setName]     = useState(initial?.name     || '');
  const [price,    setPrice]    = useState(initial ? String(initial.price ?? initial.price_usd ?? '') : '');
  const [period,   setPeriod]   = useState(initial?.period   || 'monthly');
  const [category, setCategory] = useState(initial?.category || '');
  const [day,      setDay]      = useState(() => { const d = extractBillingDay(initial?.date); return d ? String(d) : ''; });
  const [month,    setMonth]    = useState(() => { if (!initial?.date) return ''; return String(initial.date).trim().split(' ')[1] || ''; });
  const [suggestions,     setSuggestions]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const justApplied = useRef(false);

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
  };

  const canSave = name.trim() && price !== '';

  const handleSubmit = () => {
    if (!canSave) return;
    const dateStr = day && month ? `${day} ${month}` : day || '—';
    // Сохраняем цену в оригинальной валюте — никакой конвертации
    onSave({ name: name.trim(), price: Number(price), currencyCode: modalCurrency, period, category, date: dateStr, logo: initial?.logo || '' });
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
      <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed bottom-4 left-4 right-4 bg-zinc-900 rounded-[36px] p-7 z-50 border border-zinc-800 max-w-[450px] mx-auto shadow-2xl">

        <h2 className="text-xl font-semibold mb-5 text-center">{initial ? 'Редактировать' : 'Новая подписка'}</h2>

        <div className="space-y-3">
          {/* Название + саджест */}
          <div className="relative">
            <input placeholder="Название (например, Netflix)"
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
              <input type="number" inputMode="decimal" placeholder="Цена"
                className="w-full bg-black border border-zinc-800 rounded-2xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition"
                value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <ModalCurrencySelector value={modalCurrency} onChange={setModalCurrency} />
          </div>

          {/* Периодичность */}
          <div className="flex gap-2">
            {['monthly', 'yearly'].map(p => (
              <button key={p} type="button" onClick={() => setPeriod(p)}
                className={`flex-1 py-3 rounded-2xl text-sm font-medium border transition ${period === p ? 'bg-white text-black border-white' : 'bg-black border-zinc-800 text-zinc-400'}`}>
                {p === 'monthly' ? 'В месяц' : 'В год'}
              </button>
            ))}
          </div>

          {/* Дата */}
          <div className="flex gap-2">
            <input type="number" inputMode="numeric" placeholder="День" min="1" max="31"
              className="flex-1 bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition"
              value={day} onChange={e => { const v = e.target.value; if (v === '' || (Number(v) >= 1 && Number(v) <= 31)) setDay(v); }} />
            <div className="flex-1"><MonthPicker value={month} onChange={setMonth} /></div>
          </div>

          {/* Категория */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const Icon   = cat.icon;
              const active = category === cat.id;
              return (
                <button key={cat.id} type="button" onClick={() => setCategory(active ? '' : cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium border transition ${active ? `${cat.bg} ${cat.border} ${cat.color}` : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                  <Icon className="w-3 h-3" />{cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <button disabled={!canSave} onClick={handleSubmit}
          className="mt-5 w-full bg-white text-black font-semibold py-3.5 rounded-2xl active:scale-95 transition disabled:opacity-40 text-sm">
          {initial ? 'Сохранить' : 'Добавить'}
        </button>
        <button type="button" onClick={onClose} className="mt-3 mb-2 w-full text-zinc-400 text-sm py-2">Отмена</button>
      </motion.div>
    </>
  );
};

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

const MonthPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-left flex justify-between items-center focus:outline-none focus:border-zinc-500 transition">
        <span className={value ? 'text-white' : 'text-zinc-600'}>{value || 'Месяц'}</span>
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

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button type="button" onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 text-xs font-medium tracking-[0.1em] uppercase ${active ? 'text-white' : 'text-zinc-500'}`}>
    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition ${active ? 'bg-white text-black border-white' : 'border-zinc-800 bg-zinc-900/60'}`}>
      <Icon className="w-4 h-4" />
    </div>
    <span className="text-[9px]">{label}</span>
  </button>
);

// ─── Root: онбординг → авторизация → приложение ────────────────────────────────
// Определён последним — все const-компоненты уже объявлены выше
export default function Root() {
  const [session,   setSession]   = useState(undefined);
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('onboarded') === '1');

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

  if (session === undefined) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!onboarded) return <Onboarding onDone={() => { setOnboarded(true); localStorage.setItem('onboarded', '1'); }} />;
  if (!session)   return <Auth />;
  return <App session={session} />;
}
