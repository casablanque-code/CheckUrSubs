import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useT } from '../lib/i18n';

const VpnBannerModal = ({ onClose }) => {
  const t = useT();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[calc(100vw-32px)] max-w-[380px] bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <p className="text-sm text-zinc-300 text-center leading-relaxed mb-5">
          {t.vpn_banner_text}
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-sm font-semibold transition active:scale-95 bg-emerald-700 hover:bg-emerald-600 text-white"
        >
          {t.vpn_banner_ok}
        </button>
      </motion.div>
    </>
  );
};

export default VpnBannerModal;
