import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useT } from '../lib/i18n';

const DeleteAccountModal = ({ onConfirm, onCancel }) => {
  const t = useT();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const confirmWord = t.delete_confirm_word || 'DELETE';
  const isReady = inputValue.trim().toUpperCase() === confirmWord.toUpperCase();

  const handleConfirm = async () => {
    if (!isReady) return;
    setLoading(true);
    await onConfirm();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[calc(100vw-32px)] max-w-[380px] bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-center mb-2">
          {t.delete_account_title || 'Delete account'}
        </h2>
        <p className="text-sm text-zinc-400 text-center leading-relaxed mb-5">
          {t.delete_account_desc || 'All your subscriptions and data will be permanently erased. This action cannot be undone.'}
        </p>
        <p className="text-xs text-zinc-500 text-center mb-2">
          {t.delete_type_to_confirm
            ? t.delete_type_to_confirm.replace('{word}', confirmWord)
            : `Type ${confirmWord} to confirm`}
        </p>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={confirmWord}
          autoCapitalize="none"
          className="w-full bg-black border border-zinc-800 focus:border-red-500/60 rounded-2xl px-4 py-3 text-sm text-center font-semibold tracking-widest text-white placeholder-zinc-700 outline-none transition mb-4"
        />
        <button
          onClick={handleConfirm}
          disabled={!isReady || loading}
          className={`w-full py-3 rounded-2xl text-sm font-semibold transition active:scale-95 mb-2 ${isReady && !loading ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
        >
          {loading ? (t.delete_account_loading || 'Deleting...') : (t.delete_account_confirm || 'Delete everything')}
        </button>
        <button onClick={onCancel} disabled={loading}
          className="w-full py-2.5 rounded-2xl text-sm text-zinc-400 hover:text-zinc-200 transition">
          {t.modal_cancel || 'Cancel'}
        </button>
      </motion.div>
    </>
  );
};

export default DeleteAccountModal;
