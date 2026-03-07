import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from './lib/supabase';

// Иконка Google SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Auth() {
  const [mode,     setMode]     = useState('login'); // 'login' | 'register' | 'reset'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [message,  setMessage]  = useState('');

  const clearState = () => { setError(''); setMessage(''); };

  const handleGoogleLogin = async () => {
    setLoading(true); clearState();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!email || (!password && mode !== 'reset')) return;
    setLoading(true); clearState();

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(translateError(error.message));

    } else if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(translateError(error.message));
      else       setMessage('Проверь почту — отправили письмо для подтверждения.');

    } else if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}?reset=1`,
      });
      if (error) setError(translateError(error.message));
      else       setMessage('Ссылка для сброса пароля отправлена на почту.');
    }
    setLoading(false);
  };

  const translateError = (msg) => {
    if (msg.includes('Invalid login'))          return 'Неверный email или пароль.';
    if (msg.includes('Email not confirmed'))    return 'Подтверди email — письмо уже у тебя в почте.';
    if (msg.includes('User already registered'))return 'Этот email уже зарегистрирован.';
    if (msg.includes('Password should be'))     return 'Пароль должен быть не менее 6 символов.';
    if (msg.includes('rate limit'))             return 'Слишком много попыток. Подожди немного.';
    return msg;
  };

  const titles = { login: 'Добро пожаловать', register: 'Создать аккаунт', reset: 'Сброс пароля' };
  const btnLabels = { login: 'Войти', register: 'Зарегистрироваться', reset: 'Отправить ссылку' };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex justify-center select-none">
      <div className="w-full max-w-[450px] min-h-screen border-x border-zinc-900 bg-black flex flex-col overflow-hidden">

        {/* Лого */}
        <div className="flex-1 flex flex-col justify-center px-8 py-12">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-[22px] flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">CheckUrSubs</h1>
            <p className="text-zinc-500 text-sm mt-1">Контроль подписок под рукой</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }} className="space-y-3">

              <h2 className="text-lg font-semibold text-center mb-5">{titles[mode]}</h2>

              {/* Google — только для login/register */}
              {mode !== 'reset' && (
                <button onClick={handleGoogleLogin} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl py-3.5 text-sm font-medium hover:bg-zinc-800 transition active:scale-95 disabled:opacity-50">
                  <GoogleIcon />
                  {mode === 'login' ? 'Войти через Google' : 'Зарегистрироваться через Google'}
                </button>
              )}

              {mode !== 'reset' && (
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-zinc-600 text-xs">или</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-zinc-500 transition placeholder:text-zinc-600" />
              </div>

              {/* Пароль */}
              {mode !== 'reset' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                  <input type={showPw ? 'text' : 'password'} placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-zinc-500 transition placeholder:text-zinc-600" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Ошибка / успех */}
              {error   && <p className="text-red-400 text-xs px-1">{error}</p>}
              {message && <p className="text-green-400 text-xs px-1">{message}</p>}

              {/* Кнопка */}
              <button onClick={handleSubmit} disabled={loading || !email || (mode !== 'reset' && !password)}
                className="w-full bg-white text-black font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-40 text-sm mt-1">
                {loading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <>
                  {btnLabels[mode]} <ArrowRight className="w-4 h-4" />
                </>}
              </button>

              {/* Переключение режимов */}
              <div className="flex flex-col items-center gap-2 pt-2">
                {mode === 'login' && <>
                  <button onClick={() => { setMode('register'); clearState(); }} className="text-zinc-500 text-xs hover:text-zinc-300 transition">
                    Нет аккаунта? <span className="text-zinc-300 font-medium">Зарегистрироваться</span>
                  </button>
                  <button onClick={() => { setMode('reset'); clearState(); }} className="text-zinc-600 text-xs hover:text-zinc-400 transition">
                    Забыл пароль
                  </button>
                </>}
                {mode === 'register' && (
                  <button onClick={() => { setMode('login'); clearState(); }} className="text-zinc-500 text-xs hover:text-zinc-300 transition">
                    Уже есть аккаунт? <span className="text-zinc-300 font-medium">Войти</span>
                  </button>
                )}
                {mode === 'reset' && (
                  <button onClick={() => { setMode('login'); clearState(); }} className="text-zinc-500 text-xs hover:text-zinc-300 transition">
                    ← Назад ко входу
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
