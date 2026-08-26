import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// Плагин: при каждом билде вставляет timestamp в sw.js как версию кэша
const injectSwVersion = () => ({
  name: 'inject-sw-version',
  closeBundle() {
    const swPath = resolve(__dirname, 'dist/sw.js')
    try {
      const version = Date.now().toString()
      let sw = readFileSync(swPath, 'utf-8')
      sw = sw.replace("self.__CACHE_VERSION__ || 'dev'", `'${version}'`)
      writeFileSync(swPath, sw)
      console.log(`SW cache version: ${version}`)
    } catch (e) {
      console.warn('Could not inject SW version:', e.message)
    }
  }
})

export default defineConfig({
  plugins: [react(), injectSwVersion()],
  build: {
    rollupOptions: {
      output: {
        // Вендоры почти не меняются между релизами, а app-код — каждый деплой.
        // Разносим их по чанкам, чтобы браузер кэшировал vendor-чанки отдельно
        // и не перекачивал их при каждом обновлении (SW проверяет версию на
        // каждом запуске — см. README, "Service Worker & Updates").
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-sentry': ['@sentry/react'],
          'vendor-posthog': ['posthog-js'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  test: {
    // Пока покрываем только чистые функции из src/lib — jsdom не нужен.
    // Когда дойдём до тестов компонентов, поменять на 'jsdom'.
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
