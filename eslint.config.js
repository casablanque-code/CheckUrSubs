import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Уже используем автоматический JSX-рантайм (Vite/React 19) — import
      // React не нужен в каждом файле, react/prop-types тоже не включаем
      // намеренно: проект не типизирован, это отдельное больше решение.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    // Service Worker выполняется в своём глобальном контексте (self,
    // clients, caches...), а не в обычном window — отдельные globals.
    files: ['public/sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
  {
    // Конфиг Vite выполняется в Node (Vite сам транспилирует его перед
    // запуском), а не в браузере — __dirname и т.п. реально существуют
    // в рантайме, просто eslint по умолчанию видит только browser-globals.
    files: ['vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Тесты выполняются в Node (Vitest), не в браузере — нужны node-globals
    // вроде global/Buffer в дополнение к browser-глобалам.
    files: ['**/*.test.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
])
