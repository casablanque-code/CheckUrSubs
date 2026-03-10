import posthog from 'posthog-js';

posthog.init('phc_aR7Z4zGPBQi8cbNj6rdj4OfZgdPV9twNEFjZ4ghVTz', {
  api_host: 'https://eu.i.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: false, // управляем вручную
  autocapture: false,       // только явные события
});

export const analytics = {
  // Идентифицируем юзера после входа
  identify: (userId, email) => {
    posthog.identify(userId, { email });
  },

  // Онбординг
  onboardingCompleted: () => posthog.capture('onboarding_completed'),
  onboardingSkipped:   (step) => posthog.capture('onboarding_skipped', { step }),

  // Подписки
  subscriptionAdded: (name, category, period, currency) =>
    posthog.capture('subscription_added', { name, category, period, currency }),
  subscriptionEdited: (name, category) =>
    posthog.capture('subscription_edited', { name, category }),
  subscriptionDeleted: (name, category) =>
    posthog.capture('subscription_deleted', { name, category }),
  subscriptionDeleteUndone: () =>
    posthog.capture('subscription_delete_undone'),

  // Статусы
  subscriptionPaused:    (name) => posthog.capture('subscription_paused',    { name }),
  subscriptionResumed:   (name) => posthog.capture('subscription_resumed',   { name }),
  subscriptionTrialAdded:(name) => posthog.capture('subscription_trial_added',{ name }),

  // Навигация
  tabSwitched: (tab) => posthog.capture('tab_switched', { tab }),

  // Настройки
  currencyChanged: (currency) => posthog.capture('currency_changed', { currency }),

  // Push
  pushEnabled:    () => posthog.capture('push_notifications_enabled'),
  pushDismissed:  () => posthog.capture('push_notifications_dismissed'),

  // Поддержка
  supportOpened:  () => posthog.capture('support_menu_opened'),

  // Выход
  loggedOut: () => {
    posthog.capture('logged_out');
    posthog.reset();
  },
};
