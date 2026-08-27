# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [1.2.0] — 2026-08

### Added
- **Price history** — editing a subscription's price now records the previous
  value. A badge shows on the row when a subscription's price recently went
  up, and the editor shows the last recorded change. Requires the new
  `price_history` column — see `price_history_migration.sql`.
- **In-app insights** in the Analytics tab, flagging duplicate subscriptions
  in the same category (e.g. two music services) — the same detection the
  monthly push notification already used, now visible without needing push
  enabled.
- **Savings tips**: flags active subscriptions known to also offer yearly
  billing or a family/group plan, with a reminder to check current pricing
  with the service directly.
- An error boundary around the app root — a render crash now shows a
  recoverable screen (and reports to Sentry) instead of a blank page.

### Changed
- **Subscription rows are now tap-to-edit** instead of swipe-to-edit/delete;
  deleting moved to a trash icon inside the editor. Swiping between tabs is
  now more responsive, since the tab-swipe gesture no longer needs a high
  threshold to avoid conflicting with the old card-swipe gesture.
- Vendor libraries (React, Framer Motion, Sentry, PostHog, Supabase) now
  build into separate, independently cacheable chunks, and rarely-used
  modals (subscription editor, onboarding, delete-account confirmation) are
  lazy-loaded — smaller initial download for returning users.

## [1.1.0] — 2026-08

### Added
- Test suite (Vitest) covering currency conversion, billing-date math, the
  service catalog, and translation integrity — 54 tests.
- Continuous integration on GitHub Actions: lint, test, and build run
  automatically on every push and pull request. Previously the first time
  a broken build would surface was on deploy.
- CSV/JSON import now reports how many entries were skipped as duplicates,
  in addition to how many were imported.

### Fixed
- The delete-account confirmation word was not localized: due to a typo in
  the translation key, Russian-language users were always shown the
  English word "DELETE" instead of "УДАЛИТЬ".
- Two strings (the delete-confirmation hint and the offline banner) were
  missing a Russian translation entirely and silently fell back to English.
- The "how to cancel" hint in the subscription editor was hardcoded per
  language instead of going through the translation system, making it the
  one inconsistent spot in an otherwise fully localized app.
- The month picker in the subscription editor showed a Russian placeholder
  regardless of the selected interface language.
- The import success message counted every row in the imported file,
  including ones skipped as duplicates — so a file with duplicates would
  claim more subscriptions were imported than actually were.

### Changed
- Internal: `src/App.jsx` (originally a single ~2,700-line file) has been
  split into focused modules under `src/lib/`, `src/hooks/`, and
  `src/components/`. No user-facing behavior changes; this is groundwork
  for the test suite above and for easier future changes.

## [1.0.0] — Initial public release

The first public version of CheckUrSubs, as featured on Product Hunt.

### Added
- **Dashboard** with total spend per month, per year, and a full
  subscription list.
- **Calendar view** showing exactly which day each subscription bills and
  how much.
- **Upcoming** section listing charges due in the next 7 days.
- **Analytics** with spending broken down by category and by service.
- **Multi-currency support** (RUB, USD, EUR, GBP and more) with live
  exchange rates.
- **Russian and English localization**, auto-detected from the browser on
  first visit.
- **11 built-in categories** (Entertainment, Work, Internet, Games,
  Education, VPN, Health, Banking, Telecom, AI, Other).
- **Autocomplete** recognizing 60+ popular services, auto-filling logo and
  category.
- **Monthly and yearly billing**, with correct cost totals for each.
- **Swipe gestures** on subscription rows — swipe to edit or delete.
- **Undo delete**, with a 5-second window to restore a removed subscription.
- **Subscription statuses**: active (counted in totals), paused (excluded
  from totals and calendar), and trial (shown in calendar until it ends,
  then automatically becomes active).
- **Email/password and Google OAuth** authentication.
- **Installable as a PWA** on iOS and Android, with offline caching and no
  browser chrome.
- **Push notifications**, reminding users 3 days before a billing date or
  trial end.
- **6-slide onboarding walkthrough**, including PWA install instructions.
