import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './App.jsx'

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
      .catch(() => {
        // тихо игнорируем ошибку, PWA просто не будет оффлайн
      })
  })
}
