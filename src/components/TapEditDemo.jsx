import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Music, ChevronRight } from 'lucide-react';

// Демо на онбординге: карточка → тап → выезжает нижний лист с иконкой урны
// → закрывается, цикл повторяется. Заменяет старую SwipeDemo (drag влево/
// вправо), т.к. подписки теперь редактируются/удаляются через кнопки, а не
// свайпом по карточке.
const TapEditDemo = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const delays = [1400, 1600];
    const t = setTimeout(() => setOpen(o => !o), delays[open ? 1 : 0]);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-zinc-800 relative">
      <motion.div
        animate={{ scale: open ? 0.97 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative flex items-center px-4 py-3.5 gap-3 bg-[#1C1C1E]"
      >
        <div className="w-8 h-8 bg-zinc-800 rounded-2xl border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
          <img src="https://www.google.com/s2/favicons?sz=32&domain=spotify.com" className="w-5 h-5 object-contain" alt="" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Spotify</p>
          <p className="text-xs text-zinc-500">$12 / mo · 5 Mar</p>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-pink-500/15 border border-pink-500/30 mr-1">
          <Music className="w-2.5 h-2.5 text-pink-400" />
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="absolute inset-x-0 bottom-0 h-2/3 bg-zinc-900 border-t border-zinc-800 rounded-t-2xl p-4"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 bg-red-500/10 border border-red-500/30">
              <Trash2 className="w-4 h-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TapEditDemo;
