import {
  Gamepad2, Briefcase, Globe, BookOpen, Shield, Heart, Wallet, Phone, Sparkles, Zap, Music,
} from 'lucide-react';

// ─── Категории ─────────────────────────────────────────────────────────────────
export const CATEGORIES = [
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

export const getCat = (id) => CATEGORIES.find(c => c.id === id) || null;
