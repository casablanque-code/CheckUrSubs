import { Globe, Phone, Server, Wifi, Tv, Package } from 'lucide-react';

// ─── Каталог известных сервисов (для автосаджеста) ─────────────────────────────
export const SERVICE_CATALOG = [
  { name: 'Spotify',              aliases: ['спотифай','спотифай','spotify'], domain: 'spotify.com',        category: 'entertainment', serviceType: 'music',
    cancelUrl: 'https://www.spotify.com/account/subscription/', cancelSteps: ['Settings → Subscription', 'Change or cancel plan', 'Cancel Premium'] },
  { name: 'Netflix',              aliases: ['нетфликс','нетфлекс'],           domain: 'netflix.com',        category: 'entertainment', serviceType: 'video',
    cancelUrl: 'https://www.netflix.com/cancelplan', cancelSteps: ['Account → Membership', 'Cancel Membership', 'Confirm cancellation'] },
  { name: 'YouTube Premium',      aliases: ['ютуб','ютуб премиум','youtube'], domain: 'youtube.com',        category: 'entertainment', serviceType: 'video',
    cancelUrl: 'https://www.youtube.com/paid_memberships', cancelSteps: ['Manage membership', 'Cancel membership', 'Confirm'] },
  { name: 'Apple Music',          aliases: ['эпл мьюзик','эпл музик'],        domain: 'apple.com',          category: 'entertainment', serviceType: 'music',
    cancelUrl: 'https://music.apple.com/account/subscriptions', cancelSteps: ['Settings → Apple ID → Subscriptions', 'Apple Music', 'Cancel subscription'] },
  { name: 'Apple TV+',            aliases: ['эпл тв'],                        domain: 'apple.com',          category: 'entertainment', serviceType: 'video',
    cancelUrl: 'https://tv.apple.com/settings', cancelSteps: ['Settings → Apple ID → Subscriptions', 'Apple TV+', 'Cancel subscription'] },
  { name: 'Twitch',               aliases: ['твич'],                          domain: 'twitch.tv',          category: 'entertainment' },
  { name: 'Disney+',              aliases: ['дисней'],                        domain: 'disneyplus.com',     category: 'entertainment', serviceType: 'video',
    cancelUrl: 'https://www.disneyplus.com/account', cancelSteps: ['Account → Subscription', 'Cancel subscription', 'Confirm cancellation'] },
  { name: 'HBO Max',              aliases: ['хбо'],                           domain: 'hbomax.com',         category: 'entertainment', serviceType: 'video',
    cancelUrl: 'https://www.max.com/settings/subscription', cancelSteps: ['Settings → Subscription', 'Cancel plan', 'Confirm'] },
  { name: 'Hulu',                 aliases: ['хулу'],                          domain: 'hulu.com',           category: 'entertainment', serviceType: 'video',
    cancelUrl: 'https://secure.hulu.com/account/cancel', cancelSteps: ['Account → Cancel', 'Continue to cancel', 'Confirm cancellation'] },
  { name: 'Paramount+',           aliases: ['парамаунт'],                     domain: 'paramountplus.com',  category: 'entertainment', serviceType: 'video',
    cancelUrl: 'https://www.paramountplus.com/account/subscriptions/', cancelSteps: ['Account → Subscription', 'Cancel plan', 'Confirm'] },
  { name: 'Amazon Prime',         aliases: ['амазон','амазон прайм'],         domain: 'amazon.com',         category: 'entertainment', serviceType: 'video',
    cancelUrl: 'https://www.amazon.com/mc/pipelines/cancellation', cancelSteps: ['Account → Prime membership', 'End membership', 'Confirm cancellation'] },
  { name: 'Claude Pro',           aliases: ['клод'],                          domain: 'anthropic.com',      category: 'work', serviceType: 'ai',
    cancelUrl: 'https://claude.ai/settings', cancelSteps: ['Settings → Billing', 'Cancel plan', 'Confirm cancellation'] },
  { name: 'ChatGPT Plus',         aliases: ['чатгпт','гпт','chatgpt'],        domain: 'openai.com',         category: 'work', serviceType: 'ai',
    cancelUrl: 'https://chat.openai.com/settings', cancelSteps: ['Settings → Subscription', 'Manage subscription', 'Cancel plan'] },
  { name: 'Notion',               aliases: ['ноушн','ноtion'],                domain: 'notion.so',          category: 'work',
    cancelUrl: 'https://www.notion.so/profile/billing', cancelSteps: ['Settings → Plans', 'Downgrade to Free', 'Confirm'] },
  { name: 'Figma',                aliases: ['фигма'],                         domain: 'figma.com',          category: 'work',
    cancelUrl: 'https://www.figma.com/settings/billing', cancelSteps: ['Settings → Plans', 'Downgrade to Starter', 'Confirm'] },
  { name: 'Linear',               aliases: ['линеар'],                        domain: 'linear.app',         category: 'work' },
  { name: 'Slack',                aliases: ['слак'],                          domain: 'slack.com',          category: 'work',
    cancelUrl: 'https://slack.com/intl/en-us/help/articles/218947117', cancelSteps: ['Settings → Billing', 'Downgrade to Free', 'Confirm'] },
  { name: 'Zoom',                 aliases: ['зум'],                           domain: 'zoom.us',            category: 'work',
    cancelUrl: 'https://zoom.us/billing', cancelSteps: ['Billing → Current Plans', 'Cancel plan', 'Confirm cancellation'] },
  { name: 'Loom',                 aliases: ['лум'],                           domain: 'loom.com',           category: 'work' },
  { name: 'Adobe Creative Cloud', aliases: ['адоб','адобе','adobe'],          domain: 'adobe.com',          category: 'work',
    cancelUrl: 'https://account.adobe.com/plans', cancelSteps: ['Plans → Manage plan', 'Cancel plan', 'Confirm — note early cancellation fee'] },
  { name: 'Grammarly',            aliases: ['грамарли'],                      domain: 'grammarly.com',      category: 'work',
    cancelUrl: 'https://account.grammarly.com/subscription', cancelSteps: ['Subscription → Cancel', 'Continue to cancel', 'Confirm'] },
  { name: 'Canva',                aliases: ['канва'],                         domain: 'canva.com',          category: 'work',
    cancelUrl: 'https://www.canva.com/settings/purchase-history', cancelSteps: ['Account → Billing', 'Cancel Pro', 'Confirm cancellation'] },
  { name: 'Miro',                 aliases: ['миро'],                          domain: 'miro.com',           category: 'work' },
  { name: 'GitHub Copilot',       aliases: ['гитхаб','github'],               domain: 'github.com',         category: 'work',
    cancelUrl: 'https://github.com/settings/copilot', cancelSteps: ['Settings → Copilot', 'Disable Copilot', 'Confirm cancellation'] },
  { name: 'Cursor',               aliases: ['курсор'],                        domain: 'cursor.com',         category: 'work', serviceType: 'ai',
    cancelUrl: 'https://cursor.com/settings', cancelSteps: ['Settings → Billing', 'Cancel subscription', 'Confirm'] },
  { name: 'Perplexity',           aliases: ['перплексити'],                   domain: 'perplexity.ai',      category: 'work', serviceType: 'ai',
    cancelUrl: 'https://www.perplexity.ai/settings/account', cancelSteps: ['Settings → Subscription', 'Cancel Pro', 'Confirm'] },
  { name: 'Vercel',               aliases: ['версель'],                       domain: 'vercel.com',         category: 'work',
    cancelUrl: 'https://vercel.com/dashboard/settings/billing', cancelSteps: ['Settings → Plans', 'Downgrade to Hobby', 'Confirm'] },
  { name: 'iCloud',               aliases: ['айклауд','icloud'],              domain: 'apple.com',          category: 'internet', serviceType: 'storage',
    cancelUrl: 'https://support.apple.com/en-us/108922', cancelSteps: ['Settings → Apple ID → iCloud', 'Manage storage', 'Change storage plan → Downgrade'] },
  { name: 'Google One',           aliases: ['гугл ван','гугл','google one'],  domain: 'google.com',         category: 'internet', serviceType: 'storage',
    cancelUrl: 'https://one.google.com/storage', cancelSteps: ['Manage storage plan', 'Downgrade plan', 'Confirm'] },
  { name: 'Dropbox',              aliases: ['дропбокс'],                      domain: 'dropbox.com',        category: 'internet', serviceType: 'storage',
    cancelUrl: 'https://www.dropbox.com/account/plan', cancelSteps: ['Settings → Plan', 'Cancel plan', 'Confirm cancellation'] },
  { name: '1Password',            aliases: ['1пасворд','ванпасворд'],         domain: '1password.com',      category: 'internet',
    cancelUrl: 'https://my.1password.com/profile/billing', cancelSteps: ['Billing → Cancel subscription', 'Confirm cancellation'] },
  { name: 'Тинькофф Про',        aliases: ['тинькофф','тинькофф про','tinkoff pro','тинько'], domain: 'tinkoff.ru', category: 'banking' },
  { name: 'СберПрайм',           aliases: ['сбер прайм','сберпрайм','сбер'], domain: 'sber.ru',            category: 'banking' },
  { name: 'Альфа-Банк',          aliases: ['альфа','альфабанк'],             domain: 'alfabank.ru',        category: 'banking' },
  { name: 'МТС',                 aliases: ['мтс','mts'],                     domain: 'mts.ru',             category: 'telecom' },
  { name: 'Билайн',              aliases: ['билайн','beeline'],              domain: 'beeline.ru',         category: 'telecom' },
  { name: 'МегаФон',             aliases: ['мегафон','megafon'],             domain: 'megafon.ru',         category: 'telecom' },
  { name: 'Т2',                  aliases: ['т2','теле2','tele2'],             domain: 'tele2.ru',           category: 'telecom' },
  { name: 'Xbox Game Pass',       aliases: ['иксбокс','xbox'],                domain: 'xbox.com',           category: 'games',
    cancelUrl: 'https://account.microsoft.com/services', cancelSteps: ['Services → Game Pass', 'Cancel subscription', 'Confirm'] },
  { name: 'PlayStation Plus',     aliases: ['плойка','пс','ps plus'],         domain: 'playstation.com',    category: 'games',
    cancelUrl: 'https://www.playstation.com/acct/mgmt', cancelSteps: ['Account → Subscriptions', 'PlayStation Plus', 'Cancel subscription'] },
  { name: 'Steam',                aliases: ['стим'],                          domain: 'steampowered.com',   category: 'games' },
  { name: 'Duolingo',             aliases: ['дуолинго'],                      domain: 'duolingo.com',       category: 'education',
    cancelUrl: 'https://www.duolingo.com/settings/super', cancelSteps: ['Settings → Super Duolingo', 'Cancel subscription', 'Confirm'] },
  { name: 'Coursera',             aliases: ['курсера'],                       domain: 'coursera.org',       category: 'education',
    cancelUrl: 'https://www.coursera.org/account-profile', cancelSteps: ['Settings → Subscriptions', 'Cancel subscription', 'Confirm cancellation'] },
  { name: 'Skillshare',           aliases: ['скилшер'],                       domain: 'skillshare.com',     category: 'education',
    cancelUrl: 'https://www.skillshare.com/account/membership', cancelSteps: ['Account → Membership', 'Cancel membership', 'Confirm'] },
  { name: 'Udemy',                aliases: ['юдеми'],                         domain: 'udemy.com',          category: 'education' },
  { name: 'Masterclass',          aliases: ['мастеркласс'],                   domain: 'masterclass.com',    category: 'education',
    cancelUrl: 'https://www.masterclass.com/account/subscription', cancelSteps: ['Account → Subscription', 'Cancel plan', 'Confirm cancellation'] },
  { name: 'NordVPN',              aliases: ['норд впн','nordvpn'],            domain: 'nordvpn.com',        category: 'vpn',
    cancelUrl: 'https://my.nordaccount.com/dashboard/nordvpn/subscriptions/', cancelSteps: ['Subscriptions → Cancel', 'Confirm cancellation'] },
  { name: 'ExpressVPN',           aliases: ['экспресс впн'],                  domain: 'expressvpn.com',     category: 'vpn',
    cancelUrl: 'https://www.expressvpn.com/subscriptions', cancelSteps: ['Subscriptions → Cancel subscription', 'Confirm'] },
  { name: 'Telegram Premium',     aliases: ['телеграм','тг','telegram'],      domain: 'telegram.org',       category: 'other',
    cancelUrl: 'https://t.me/PremiumBot', cancelSteps: ['Open @PremiumBot in Telegram', 'Manage subscription', 'Cancel'] },
  { name: 'Discord Nitro',        aliases: ['дискорд','discord'],             domain: 'discord.com',        category: 'entertainment',
    cancelUrl: 'https://discord.com/settings/subscriptions', cancelSteps: ['Settings → Subscriptions', 'Cancel Nitro', 'Confirm'] },
  { name: 'VK Музыка',            aliases: ['вк музыка','вк'],               domain: 'vk.com',             category: 'entertainment', serviceType: 'music' },
  { name: 'Яндекс Плюс',         aliases: ['яндекс плюс','яплюс','яндекс'], domain: 'ya.ru',              category: 'entertainment', serviceType: 'music',
    cancelUrl: 'https://plus.yandex.ru/portal/settings', cancelSteps: ['Настройки → Подписка', 'Отключить Плюс', 'Подтвердить'] },
  { name: 'Кинопоиск',            aliases: ['кинопоиск'],                     domain: 'kinopoisk.ru',       category: 'entertainment', serviceType: 'video',
    cancelUrl: 'https://plus.yandex.ru/portal/settings', cancelSteps: ['Настройки → Подписка', 'Отключить', 'Подтвердить'] },
  { name: 'START',                aliases: ['старт'],                         domain: 'start.ru',           category: 'entertainment', serviceType: 'video',
    cancelUrl: 'https://start.ru/profile/subscription', cancelSteps: ['Профиль → Подписка', 'Отменить подписку', 'Подтвердить'] },
  { name: 'Иви',                  aliases: ['ivi'],                           domain: 'ivi.ru',             category: 'entertainment', serviceType: 'video',
    cancelUrl: 'https://www.ivi.ru/profile/subscription', cancelSteps: ['Профиль → Подписка', 'Отменить', 'Подтвердить'] },
  // ── Утилитарные — с иконками Lucide вместо favicon ──
  { name: 'Интернет',   aliases: ['инет','internet','провайдер'],            lucideIcon: Globe,   category: 'internet'  },
  { name: 'Связь',      aliases: ['телефон','мобильная связь','оператор'],   lucideIcon: Phone,   category: 'telecom'   },
  { name: 'Сервер',     aliases: ['server','хостинг','хост','vps','вдс'],    lucideIcon: Server,  category: 'internet'  },
  { name: 'Wi-Fi',      aliases: ['вайфай','wifi','роутер'],                 lucideIcon: Wifi,    category: 'internet'  },
  { name: 'ТВ',         aliases: ['телевидение','тв','tv','cable'],          lucideIcon: Tv,      category: 'entertainment' },
  { name: 'Подписка',   aliases: ['subscription'],                           lucideIcon: Package, category: 'other'     },
];

// Ищет запись в каталоге по имени или алиасам
export const getCatalogEntry = (name) => {
  const q = (name || '').toLowerCase().trim();
  if (!q) return null;
  return SERVICE_CATALOG.find(s =>
    s.name.toLowerCase() === q ||
    (s.aliases || []).some(a => a.toLowerCase() === q)
  ) || null;
};

export const getLogoUrl = (sub) => {
  if (sub.logo) return sub.logo;
  const entry = getCatalogEntry(sub.name);
  if (entry?.lucideIcon) return null; // иконка Lucide — не favicon
  if (entry?.domain) return `https://www.google.com/s2/favicons?sz=64&domain=${entry.domain}`;
  // Фоллбэк — угадываем домен
  const first = (sub.name || '').toLowerCase().trim().split(/\s+/)[0].replace(/[^a-z0-9]/g, '');
  if (!first) return null;
  return `https://www.google.com/s2/favicons?sz=64&domain=${first}.com`;
};

export const getLucideIcon = (sub) => {
  const entry = getCatalogEntry(sub.name);
  return entry?.lucideIcon || null;
};
