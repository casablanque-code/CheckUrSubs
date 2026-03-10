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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => {
        Sentry.captureException(err);
      })
  })
}
