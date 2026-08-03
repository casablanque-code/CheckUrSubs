import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload } from 'lucide-react';
import { useT } from '../lib/i18n';

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
      const result = await onImport(rows);
      const imported   = result?.imported   ?? rows.length;
      const duplicates = result?.duplicates ?? 0;
      setImportMsg(duplicates > 0
        ? `${t.io_import_ok(imported)} · ${t.io_import_dup(duplicates)}`
        : t.io_import_ok(imported));
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

export default ImportExportMenu;
