// Показывается, когда Sentry.ErrorBoundary в main.jsx ловит ошибку рендера.
// Живёт вне LangContext (оборачивает Root целиком), поэтому текст статичный
// двуязычный, а не через i18n.
const ErrorFallback = ({ resetError }) => (
  <div className="min-h-screen bg-black flex items-center justify-center px-6">
    <div className="max-w-sm w-full text-center flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <div>
        <p className="text-zinc-50 font-semibold">Что-то пошло не так</p>
        <p className="text-zinc-500 text-sm mt-1">Something went wrong. We&apos;ve been notified.</p>
      </div>

      <button
        onClick={() => {
          resetError?.();
          window.location.reload();
        }}
        className="mt-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold active:scale-95 transition"
      >
        Перезагрузить · Reload
      </button>
    </div>
  </div>
);

export default ErrorFallback;
