import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import Root from './App.jsx'

Sentry.init({
  dsn: 'https://4eec769ae5e649fe68b7d7e7696d4e3e@o4511021878542336.ingest.de.sentry.io/4511021887914064',
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const rootElement = document.getElementById('root')

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

// ─── Service Worker ───────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {

        // Принудительно проверяем новую версию SW при каждом запуске.
        // Браузер по умолчанию делает это раз в 24ч — это слишком редко.
        registration.update();

        // Когда новый SW готов (ждёт активации) — активируем сразу,
        // без необходимости перезагружать страницу вручную.
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // Новый SW установлен и ждёт — говорим ему активироваться
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // Когда SW сменился (activated) — тихо перезагружаем страницу
        // чтобы юзер получил новую версию без ручных действий
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });

      })
      .catch((err) => {
        Sentry.captureException(err);
      });
  });
}
