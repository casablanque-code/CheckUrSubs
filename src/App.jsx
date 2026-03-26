import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
  Home, List, BarChart2, Plus, Pencil, Trash2, CreditCard,
  CalendarDays, ChevronDown, Check, ArrowUpDown, Search, X,
  RefreshCw, Gamepad2, Briefcase, Cloud, Music, BookOpen, Zap,
  Shield, Heart, Sparkles, SwatchBook, ChevronRight, LogOut,
  Wifi, Globe, Phone, Server, Tv, MonitorSmartphone, Package, Wallet, MessageCircle, Download, Upload, Bell
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';
import { translations, LangContext, useLang, useT } from './lib/i18n';
import Auth from './Auth';


// ─── Категории ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'entertainment', labelKey: 'cat_entertainment', icon: Music,     color: 'text-pink-400',   bg: 'bg-pink-500/15',   border: 'border-pink-500/30',   bar: 'bg-pink-500'   },
  { id: 'work',          labelKey: 'cat_work',          icon: Briefcase, color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   bar: 'bg-blue-500'   },
  { id: 'internet',      labelKey: 'cat_internet',      icon: Globe,     color: 'text-sky-400',    bg: 'bg-sky-500/15',    border: 'border-sky-500/30',    bar: 'bg-sky-500'    },
  { id: 'games',         labelKey: 'cat_games',         icon: Gamepad2,  color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30',  bar: 'bg-green-500'  },
  { id: 'education',     labelKey: 'cat_education',     icon: BookOpen,  color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  bar: 'bg-amber-500'  },
  { id: 'vpn',           labelKey: 'cat_vpn',           icon: Shield,    color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30', bar: 'bg-violet-500' },
  { id: 'health',        labelKey: 'cat_health',        icon: Heart,     color: 'text-rose-400',   bg: 'bg-rose-500/15',   border: 'border-rose-500/30',   bar: 'bg-rose-500'   },
  { id: 'banking',       labelKey: 'cat_banking',       icon: Wallet,    color: 'text-emerald-400',bg: 'bg-emerald-500/15',border: 'border-emerald-500/30',bar: 'bg-emerald-500'},
  { id: 'telecom',       labelKey: 'cat_telecom',       icon: Phone,     color: 'text-cyan-400',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/30',   bar: 'bg-cyan-500'   },
  { id: 'ai',            labelKey: 'cat_ai',            icon: Sparkles,  color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30', bar: 'bg-purple-500' },
  { id: 'other',         labelKey: 'cat_other',         icon: Zap,       color: 'text-zinc-400',   bg: 'bg-zinc-500/15',   border: 'border-zinc-500/30',   bar: 'bg-zinc-500'   },
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
    const res  = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data.result !== 'success') return null;
    const { USD, EUR, RUB, GBP } = data.rates;
    const rates = { USD: 1, EUR, RUB, GBP };
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

// Короткие названия месяцев по-русски (для дат вида "14 мар")
const MONTHS_SHORT_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

// Единая утилита форматирования даты из ISO-строки (trial_end и т.п.)
// Возвращает "14 Mar" для EN и "14 мар" для RU — без смешивания
const fmtDateFromISO = (isoStr, lang, style = 'short') => {
  const d = new Date(isoStr);
  if (isNaN(d)) return '';
  const day = d.getDate();
  const m   = d.getMonth();
  if (style === 'short') {
    return lang === 'ru' ? `${day} ${MONTHS_SHORT_RU[m]}` : `${day} ${MONTHS_SHORT[m]}`;
  }
  // long — для аналитики и датапикера
  return lang === 'ru'
    ? `${day} ${MONTHS_RU[m].toLowerCase()}`
    : `${day} ${MONTHS_SHORT[m]}`;
};
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

// VAPID helper
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
};

// ═══════════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════════
// ─── Animated Logo Loader ────────────────────────────────────────────────────
const LogoLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes c3{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes c2{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes c1{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ck{from{stroke-dashoffset:36;opacity:0}to{stroke-dashoffset:0;opacity:1}}
        .lc3{animation:c3 .3s ease-out .05s both}
        .lc2{animation:c2 .3s ease-out .25s both}
        .lc1{animation:c1 .3s ease-out .45s both}
        .lck{animation:ck .5s ease-out .9s both;stroke-dasharray:36;stroke-dashoffset:36}
      `}</style>
      <g className="lc3"><rect x="14" y="38" width="52" height="28" rx="7" fill="#1a1a1a" stroke="#252525" strokeWidth="1.5"/></g>
      <g className="lc2"><rect x="14" y="30" width="52" height="28" rx="7" fill="#141414" stroke="#333" strokeWidth="1.5"/></g>
      <g className="lc1">
        <rect x="14" y="22" width="52" height="28" rx="7" fill="#0e0e0e" stroke="#484848" strokeWidth="1.5"/>
        <rect x="22" y="32" width="18" height="3" rx="1.5" fill="#2a2a2a"/>
        <rect x="22" y="38" width="12" height="3" rx="1.5" fill="#222"/>
      </g>
      <path className="lck" d="M44 26 L52 37 L66 20" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  </div>
);

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
                  <AvatarMenu session={session} onLogout={handleLogout} />
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
                      <SubscriptionRow key={sub.id} sub={sub} fmt={fmt} fmtOriginal={fmtOriginal} monthly={monthly}
                        onEdit={() => openEdit(sub)} onDelete={() => triggerDelete(sub)} />
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

// ─── Аватар с меню выхода ───────────────────────────────────────────────────────
// ─── Support Menu ──────────────────────────────────────────────────────────────
const SUPPORT_LINKS = [
  {
    id: 'boosty',
    label: 'Boosty',
    hint: 'Card',
    url: 'https://boosty.to/casablanque/donate',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/30',
    color: 'text-orange-400',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
    ),
  },

  {
    id: 'CloudTips',
    label: 'CloudTips',
    hint: 'Card/SBP',
    url: 'https://pay.cloudtips.ru/p/18fa81b4',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    color: 'text-blue-400',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
    ),
  },

  {
    id: 'usdt',
    label: 'USDT',
    hint: 'Avalanche C-Chain (AVAXC)',
    url: null,
    address: '0x3bE6114bc999482843bde238F4e17997B5355F76',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    color: 'text-emerald-400',
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.75 13.5v1.5h-1.5v-1.5C9.5 15.83 8.5 14.92 8.5 13.75h1.5c0 .55.67 1 1.5 1s1.5-.45 1.5-1c0-.59-.54-.88-1.76-1.22C9.87 12.1 8.5 11.5 8.5 10.25 8.5 9.08 9.5 8.17 11.25 8V6.5h1.5V8c1.75.17 2.75 1.08 2.75 2.25h-1.5c0-.55-.67-1-1.5-1s-1.5.45-1.5 1c0 .55.49.84 1.74 1.18 1.38.38 2.76.96 2.76 2.32 0 1.17-1 2.08-2.75 2.25z"/>
      </svg>
    ),
  },
];

const SupportMenu = () => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wordText, setWordText] = useState('');
  const [wordStatus, setWordStatus] = useState(null); // 'sending' | 'sent' | 'error'
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [open]);

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sendWord = async () => {
    if (!wordText.trim()) return;
    setWordStatus('sending');
    const { error } = await supabase.from('messages').insert({ text: wordText.trim() });
    if (error) { setWordStatus('error'); return; }
    setWordStatus('sent');
    setWordText('');
    setTimeout(() => setWordStatus(null), 3000);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="w-10 h-10 rounded-full border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center active:scale-95 transition shrink-0">
        <Heart className="w-4 h-4 text-zinc-300" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.92, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute left-0 top-12 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 w-[220px] overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-xs font-semibold text-zinc-200">{t.support_title}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{t.support_subtitle}</p>
            </div>
            {SUPPORT_LINKS.map(link => (
              <div key={link.id} className={`mx-3 my-2 rounded-xl border ${link.border} ${link.bg} p-3`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={link.color}><link.icon /></span>
                  <span className="text-sm font-semibold text-zinc-100">{link.label}</span>
                  <span className="text-[10px] text-zinc-500 ml-auto">{link.hint}</span>
                </div>
                {link.url ? (
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className={`block w-full text-center text-xs font-semibold py-1.5 rounded-lg ${link.color} bg-black/20 active:scale-95 transition`}>
                    {t.support_open}
                  </a>
                ) : (
                  <button onClick={() => copyAddress(link.address)}
                    className={`w-full text-xs font-semibold py-1.5 rounded-lg ${link.color} bg-black/20 active:scale-95 transition`}>
                    {copied ? t.support_copied : t.support_copy}
                  </button>
                )}
              </div>
            ))}
            {/* Добрым словом */}
            <div className="mx-3 mb-3 rounded-xl border border-pink-500/30 bg-pink-500/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-semibold text-zinc-100">{t.support_word}</span>
              </div>
              {wordStatus === 'sent'
                ? <p className="text-xs text-pink-400 text-center py-1">{t.support_word_thanks}</p>
                : <>
                    <textarea
                      value={wordText}
                      onChange={e => setWordText(e.target.value)}
                      placeholder={t.support_word_placeholder}
                      rows={3}
                      className="w-full bg-black/20 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 px-2.5 py-2 resize-none outline-none border border-transparent focus:border-pink-500/40 transition"
                    />
                    <button onClick={sendWord} disabled={!wordText.trim() || wordStatus === 'sending'}
                      className="w-full mt-2 text-xs font-semibold py-1.5 rounded-lg text-pink-400 bg-black/20 active:scale-95 transition disabled:opacity-40">
                      {wordStatus === 'sending' ? t.support_word_sending : t.support_word_send}
                    </button>
                    {wordStatus === 'error' && <p className="text-[10px] text-red-400 text-center mt-1">{t.support_word_error}</p>}
                  </>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ─── Import / Export Menu ─────────────────────────────────────────────────────
const ImportExportMenu = ({ subscriptions, onImport }) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // null | 'ok' | 'err'
  const [importMsg, setImportMsg]       = useState('');
  const ref      = useRef(null);
  const fileRef  = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [open]);

  // ── Экспорт ──────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['name','price','currency_code','period','category','status','date','trial_end'];
    const rows = subscriptions.map(s =>
      headers.map(h => {
        const v = s[h] ?? '';
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    download('checkursubs-export.csv', 'text/csv', csv);
  };

  const exportJSON = () => {
    const data = subscriptions.map(({ id, user_id, created_at, ...rest }) => rest);
    download('checkursubs-export.json', 'application/json', JSON.stringify(data, null, 2));
  };

  const download = (filename, mime, content) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Импорт ───────────────────────────────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const text = await file.text();
    try {
      let rows = [];
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [];
      } else {
        // CSV
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        rows = lines.slice(1).map(line => {
          const vals = line.split(',');
          return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? '').trim().replace(/^"|"$/g, '')]));
        });
      }
      if (!rows.length || !rows[0].name) throw new Error('bad format');
      await onImport(rows);
      setImportMsg(t.io_import_ok(rows.length));
      setImportStatus('ok');
    } catch {
      setImportMsg(t.io_import_err);
      setImportStatus('err');
    }
    setTimeout(() => setImportStatus(null), 3500);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="w-10 h-10 rounded-full border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center active:scale-95 transition shrink-0">
        <Download className="w-4 h-4 text-zinc-300" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.92, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 w-[220px] overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-xs font-semibold text-zinc-200">{t.io_title}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{t.io_subtitle}</p>
            </div>

            {/* Экспорт */}
            <div className="mx-3 my-2 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-zinc-100">{t.io_export}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={exportCSV}
                  className="flex-1 text-xs font-semibold py-1.5 rounded-lg text-blue-400 bg-black/20 active:scale-95 transition">
                  CSV
                </button>
                <button onClick={exportJSON}
                  className="flex-1 text-xs font-semibold py-1.5 rounded-lg text-blue-400 bg-black/20 active:scale-95 transition">
                  JSON
                </button>
              </div>
            </div>

            {/* Импорт */}
            <div className="mx-3 mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-zinc-100">{t.io_import}</span>
                <span className="text-[10px] text-zinc-500 ml-auto">{t.io_import_hint}</span>
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="w-full text-xs font-semibold py-1.5 rounded-lg text-emerald-400 bg-black/20 active:scale-95 transition">
                {t.io_import_btn}
              </button>
              <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={handleFile} />
              {importStatus && (
                <p className={`text-[11px] text-center mt-2 ${importStatus === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {importMsg}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AvatarMenu = ({ session, onLogout }) => {
  const t = useT();
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
              {t.logout}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Календарь ─────────────────────────────────────────────────────────────────
const CalendarSection = ({ subscriptions, fmt, fmtReal, monthly, month, year, onPrev, onNext, calTotal, calYearly, isPast, calMonth }) => {
  const t = useT();
  const today       = new Date();
  const isToday     = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset      = (new Date(year, month, 1).getDay() + 6) % 7;

  const visibleSubs = subscriptions.filter(sub => {
    if (sub.status === 'paused') return false;
    return true;
  });

  const subsByDay = {};
  visibleSubs.forEach(sub => {
    // Пробные — отображаем на дату окончания пробного периода
    if (sub.status === 'trial') {
      if (!sub.trial_end) return;
      const end = new Date(sub.trial_end);
      if (end.getFullYear() !== year || end.getMonth() !== month) return;
      const d = end.getDate();
      if (!subsByDay[d]) subsByDay[d] = [];
      subsByDay[d].push(sub);
      return;
    }

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
        <p className="text-sm font-semibold">{t.months_full[month]} {year}</p>
        <button onClick={onNext} className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95">
          <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {t.days_short.map(d => <div key={d} className="text-center text-[10px] text-zinc-600 font-semibold uppercase tracking-wide py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const daySubs = subsByDay[day] || [];
          const hasAny  = daySubs.length > 0;
          const hasActive = daySubs.some(s => !s.status || s.status === 'active');
          const total   = daySubs
            .filter(s => !s.status || s.status === 'active')
            .reduce((a, s) => a + (s.period === 'yearly' ? monthly(s) * 12 : monthly(s)), 0);
          return (
            <div key={day} className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center
              ${isToday(day) ? 'bg-white text-black' : hasAny ? 'bg-zinc-800 border border-zinc-700' : 'bg-zinc-900/40'}`}>
              <span className={`text-xs font-semibold leading-none ${isToday(day) ? 'text-black' : hasAny ? 'text-white' : 'text-zinc-600'}`}>{day}</span>
              {hasAny && hasActive && <span className={`text-[8px] font-bold mt-0.5 leading-none ${isToday(day) ? 'text-zinc-600' : 'text-amber-400'}`}>{fmt(total)}</span>}
              {hasAny && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {daySubs.slice(0, 3).map(s => (
                    <div key={s.id} className={`w-1 h-1 rounded-full ${
                      s.status === 'trial' ? 'bg-white' :
                      s.period === 'yearly' ? 'bg-red-400' : 'bg-purple-400'
                    }`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Суммы — сразу под сеткой */}
      <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">{isPast ? t.spent(t.months_genitive[calMonth ?? month]) : t.expected(t.months_genitive[calMonth ?? month])}</span>
          <span className="font-semibold">{fmt(calTotal ?? 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">{t.per_year}</span>
          <span className="font-semibold">{fmt(calYearly ?? 0)}</span>
        </div>
      </div>
      {Object.keys(subsByDay).length > 0 && (
        <div className="bg-[#1C1C1E] rounded-3xl border border-zinc-800/60 divide-y divide-zinc-800/80 overflow-hidden mt-2">
          {Object.entries(subsByDay).sort(([a],[b]) => Number(a)-Number(b)).flatMap(([day, subs]) =>
            subs.map(sub => (
              <div key={sub.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <LogoIcon sub={sub} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{sub.name}</p>
                      {sub.status === 'trial' && <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-lg shrink-0">{t.modal_status_trial.toLowerCase()}</span>}
                    </div>
                    <p className="text-xs text-zinc-500">{day} {MONTHS_SHORT[month]}</p>
                  </div>
                </div>
                {sub.status === 'trial'
                  ? <p className="text-xs text-zinc-500 shrink-0">{t.not_billing}</p>
                  : <p className="text-sm font-semibold shrink-0">{fmtReal(sub)}</p>
                }
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
  const t = useT();
  const ref = useDragScroll();
  return (
    <section className="space-y-3">
      <SectionTitle icon={CalendarDays} label={t.soon} />
      {soonSubs.length === 0
        ? <p className="text-sm text-zinc-600 px-1">{t.soon_empty}</p>
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
  const t    = useT();
  const lang = useLang();
  const cat  = sub.category ? getCat(sub.category) : null;

  // Считаем сколько дней до списания
  const daysLeft = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let target;
    if (sub.status === 'trial' && sub.trial_end) {
      target = new Date(sub.trial_end);
      target.setHours(0, 0, 0, 0);
    } else {
      const day = sub.billingDay ?? extractBillingDay(sub.date);
      if (!day) return null;
      target = new Date(today.getFullYear(), today.getMonth(), day);
      if (target < today) target.setMonth(target.getMonth() + 1);
    }
    return Math.round((target - today) / 86400000);
  })();

  const daysLabel = (() => {
    if (daysLeft === null) return null;
    if (daysLeft === 0) return lang === 'ru' ? 'сегодня' : 'today';
    if (daysLeft === 1) return lang === 'ru' ? 'завтра'  : 'tomorrow';
    return lang === 'ru' ? `через ${daysLeft} дн.` : `in ${daysLeft}d`;
  })();

  return (
    <div className="w-[168px] bg-[#1C1C1E] rounded-[28px] p-5 border border-zinc-800 active:scale-[0.97] transition shrink-0 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <LogoIcon sub={sub} size="md" />
        <span className={`text-[10px] font-bold px-2 py-1 rounded-xl border shrink-0 ml-2 ${
          daysLeft === 0 ? 'text-red-400 bg-red-500/15 border-red-500/30' :
          daysLeft === 1 ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' :
          'text-white bg-zinc-800 border-zinc-700'
        }`}>{daysLabel ?? sub.date}</span>
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
  const t    = useT();
  const lang = useLang();
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
          <Pencil className="w-3.5 h-3.5" /> {t.modal_edit}
        </div>
        <div className="flex-1 bg-red-600/90 flex items-center justify-end pr-6 text-xs font-semibold gap-2">
          {t.sub_delete} <Trash2 className="w-3.5 h-3.5" />
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
        className={`relative flex items-center px-4 py-3 gap-3 bg-[#1C1C1E]`}>
        <LogoIcon sub={sub} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{sub.name}</p>
            {cat && <CategoryBadge cat={cat} tiny />}
            {sub.status === 'paused' && <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded-lg shrink-0">{t.badge_paused}</span>}
            {sub.status === 'trial'  && <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-lg shrink-0">{t.badge_trial}</span>}
          </div>
          <p className="text-xs text-zinc-500 truncate">
            {fmtOriginal(sub)} / {sub.period === 'yearly' ? t.sub_per_year : t.sub_per_month}
            {sub.date && sub.date !== '—' && ` · ${sub.date}`}
            {sub.status === 'trial' && sub.trial_end && ` · ${fmtDateFromISO(sub.trial_end, lang)}`}
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
// ─── DatePicker ────────────────────────────────────────────────────────────────
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

const SubModal = ({ initial, currency, onSave, onClose }) => {
  const t = useT();
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
              <input type="number" inputMode="decimal" placeholder={t.modal_price_placeholder}
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
                className={`${period === 'yearly' ? 'flex-1' : 'w-full'} bg-black border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition`}
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
