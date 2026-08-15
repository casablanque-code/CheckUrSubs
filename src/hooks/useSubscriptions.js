import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { extractBillingDay, MONTHS_SHORT } from '../lib/billing';
import { analytics } from '../lib/analytics';

// Подписки: загрузка из Supabase, CRUD, undo-delete, автоактивация
// пробных периодов. Раньше всё это жило прямо в App. Поведение
// сохранено 1:1 — включая порядок эффектов и все edge-cases отката UI.
export const useSubscriptions = (userId, sessionEmail) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [toast,         setToast]         = useState(null);

  // ── Загрузка подписок из Supabase ──────────────────────────────────────────
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    analytics.identify(userId, sessionEmail);
    const MIN_DURATION = 1500; // даём анимации лоадера доиграть до конца
    const t0 = Date.now();
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setSubscriptions(data.map(s => ({ ...s, billingDay: extractBillingDay(s.date) })));
        }
        const elapsed = Date.now() - t0;
        const remaining = Math.max(0, MIN_DURATION - elapsed);
        setTimeout(() => setLoading(false), remaining);
      });
  }, [userId, sessionEmail]);

  // Авто-активация пробных у которых trial_end прошёл
  const activatingRef = useRef(new Set());
  useEffect(() => {
    if (subscriptions.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const toActivate = subscriptions.filter(s =>
      s.status === 'trial' && s.trial_end && s.trial_end <= today && !activatingRef.current.has(s.id)
    );
    if (toActivate.length === 0) return;
    toActivate.forEach(async (s) => {
      activatingRef.current.add(s.id);
      const endDate = new Date(s.trial_end);
      const newDate = `${endDate.getDate()} ${MONTHS_SHORT[endDate.getMonth()]}`;
      const { data } = await supabase.from('subscriptions')
        .update({ status: 'active', trial_end: null, date: newDate })
        .eq('id', s.id).select().single();
      if (data) setSubscriptions(prev => prev.map(p =>
        p.id === s.id ? { ...p, status: 'active', trial_end: null, date: newDate, billingDay: endDate.getDate() } : p
      ));
    });
  }, [subscriptions]);

  // ── CRUD через Supabase ────────────────────────────────────────────────────
  const handleSave = async (payload, editingSub) => {
    const row = {
      name:          payload.name,
      price:         payload.price,
      currency_code: payload.currencyCode,
      date:          payload.date,
      period:        payload.period,
      category:      payload.category,
      logo:          payload.logo || '',
      status:        payload.status || 'active',
      trial_end:     payload.trial_end || null,
      user_id:       userId,
    };

    if (editingSub) {
      const { data, error } = await supabase
        .from('subscriptions').update(row).eq('id', editingSub.id).select().single();
      if (!error && data) {
        setSubscriptions(prev => prev.map(s =>
          s.id === editingSub.id ? { ...data, billingDay: extractBillingDay(data.date) } : s
        ));
        analytics.subscriptionEdited(payload.name, payload.category);
      }
    } else {
      const { data, error } = await supabase
        .from('subscriptions').insert({ ...row, created_at: new Date().toISOString() }).select().single();
      if (!error && data) {
        setSubscriptions(prev => [...prev, { ...data, billingDay: extractBillingDay(data.date) }]);
        analytics.subscriptionAdded(payload.name, payload.category, payload.period, payload.currencyCode);
      }
    }
  };

  const triggerDelete = async (sub) => {
    // если висел предыдущий toast — просто закрываем его
    if (toast?.timeoutId) {
      clearTimeout(toast.timeoutId);
      setToast(null);
    }

    // убираем из UI сразу
    setSubscriptions(prev => prev.filter(s => s.id !== sub.id));

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', sub.id);

    if (error) {
      console.error('Delete error:', error);

      // откат UI, если удаление в БД не прошло
      setSubscriptions(prev => {
        const exists = prev.some(s => s.id === sub.id);
        if (exists) return prev;
        return [...prev, { ...sub, billingDay: extractBillingDay(sub.date) }];
      });
      return;
    }

    analytics.subscriptionDeleted(sub.name, sub.category);

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 5000);

    setToast({ sub, timeoutId });
  };

  const undoDelete = async () => {
    if (!toast) return;

    clearTimeout(toast.timeoutId);
    const sub = toast.sub;

    const row = {
      id: sub.id,
      user_id: sub.user_id,
      name: sub.name,
      price: sub.price,
      currency_code: sub.currency_code,
      date: sub.date,
      period: sub.period,
      category: sub.category,
      logo: sub.logo || '',
      status: sub.status || 'active',
      trial_end: sub.trial_end || null,
      created_at: sub.created_at,
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('Undo insert error:', error);
      setToast(null);
      return;
    }

    setSubscriptions(prev => {
      const exists = prev.some(s => s.id === data.id);
      if (exists) return prev;
      return [...prev, { ...data, billingDay: extractBillingDay(data.date) }];
    });

    analytics.subscriptionDeleteUndone();
    setToast(null);
  };

  const handleImport = async (rows) => {
    const existing = new Set(subscriptions.map(s => s.name + '|' + s.price + '|' + s.period));
    const fresh = rows.filter(r => !existing.has(r.name + '|' + r.price + '|' + r.period));
    const duplicates = rows.length - fresh.length;
    if (!fresh.length) return { imported: 0, duplicates };
    const toInsert = fresh.map(r => ({
      user_id:       userId,
      name:          r.name          || '',
      price:         parseFloat(r.price) || 0,
      currency_code: r.currency_code  || 'USD',
      period:        r.period         || 'monthly',
      category:      r.category       || 'other',
      logo:          r.logo           || '',
      status:        r.status         || 'active',
      date:          r.date           || '',
      trial_end:     r.trial_end      || null,
    }));
    const { data } = await supabase.from('subscriptions').insert(toInsert).select();
    if (data) setSubscriptions(prev => [...prev, ...data]);
    return { imported: data?.length ?? 0, duplicates };
  };

  const handleDeleteAccount = async () => {
    try {
      // Удаляем все данные пользователя из всех таблиц
      await supabase.from('subscriptions').delete().eq('user_id', userId);
      await supabase.from('push_subscriptions').delete().eq('user_id', userId);
      await supabase.from('push_logs').delete().eq('user_id', userId);
      // Удаляем аккаунт через edge function (нужен service role для auth.admin.deleteUser)
      // Если нет такой функции — просто разлогиниваем после очистки данных
      await supabase.functions.invoke('delete-user', { body: { user_id: userId } }).catch(() => {});
      analytics.loggedOut();
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Delete account error:', e);
      // Даже если что-то не удалилось — разлогиниваем
      await supabase.auth.signOut();
    }
  };

  return {
    subscriptions, setSubscriptions, loading, toast,
    handleSave, triggerDelete, undoDelete, handleImport, handleDeleteAccount,
  };
};
