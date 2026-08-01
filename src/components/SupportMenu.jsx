import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle } from 'lucide-react';
import { useT } from '../lib/i18n';
import { supabase } from '../lib/supabase';

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
  // логирование клика по донату
  const logDonateClick = async (platform, action) => {
    const { data } = await supabase.auth.getUser();
    await supabase.from('donate_clicks').insert({
      platform,
      action,
      user_id: data?.user?.id ?? null,
    });
  };
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
                  onClick={() => { setOpen(false); logDonateClick(link.id, 'open'); }}
                    className={`block w-full text-center text-xs font-semibold py-1.5 rounded-lg ${link.color} bg-black/20 active:scale-95 transition`}>
                    {t.support_open}
                  </a>
                ) : (
                  <button onClick={() => { copyAddress(link.address); logDonateClick(link.id, 'copy_address'); }}
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

export default SupportMenu;
