import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Music } from 'lucide-react';

// NB: текст в демо захардкожен на русском независимо от языка интерфейса
// (это статичная превьюшка на шаге онбординга, не привязана к t[...]) —
// перенёс как есть, см. находку в коммите.
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

export default SwipeDemo;
