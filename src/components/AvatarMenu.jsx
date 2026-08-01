import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Trash2 } from 'lucide-react';
import { useT } from '../lib/i18n';
import DeleteAccountModal from './DeleteAccountModal';

const AvatarMenu = ({ session, onLogout, onDeleteAccount }) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const ref = useRef(null);

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
    <>
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
              className="absolute right-0 top-12 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 min-w-[200px] overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-xs text-zinc-400 truncate">{email}</p>
              </div>
              <button onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition active:bg-zinc-700">
                <LogOut className="w-4 h-4" />
                {t.logout}
              </button>
              <div className="h-px bg-zinc-800/60 mx-3" />
              <button onClick={() => { setOpen(false); setShowDeleteModal(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition active:bg-zinc-700">
                <Trash2 className="w-4 h-4" />
                {t.delete_account || 'Delete account'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <DeleteAccountModal
            onConfirm={async () => { await onDeleteAccount(); setShowDeleteModal(false); }}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AvatarMenu;
