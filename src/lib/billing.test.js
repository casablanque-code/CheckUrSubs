import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fmtDateFromISO,
  extractBillingDay,
  extractBillingMonth,
  isDueWithinDays,
} from './billing';

describe('fmtDateFromISO', () => {
  it('formats short EN dates', () => {
    expect(fmtDateFromISO('2026-03-14', 'en')).toBe('14 Mar');
  });

  it('formats short RU dates using MONTHS_SHORT_RU (not MONTHS_RU)', () => {
    expect(fmtDateFromISO('2026-03-14', 'ru')).toBe('14 мар');
  });

  it('formats long RU dates in genitive-looking lowercase full name', () => {
    expect(fmtDateFromISO('2026-03-14', 'ru', 'long')).toBe('14 март');
  });

  it('returns empty string for an invalid date', () => {
    expect(fmtDateFromISO('not-a-date', 'en')).toBe('');
  });
});

describe('extractBillingDay', () => {
  it('extracts the day number from a "8 Mar"-style string', () => {
    expect(extractBillingDay('8 Mar')).toBe(8);
  });

  it('accepts the boundary value 31', () => {
    expect(extractBillingDay('31 Jan')).toBe(31);
  });

  it('rejects out-of-range days like 32', () => {
    expect(extractBillingDay('32 Jan')).toBeNull();
  });

  it('rejects 0', () => {
    expect(extractBillingDay('0 Jan')).toBeNull();
  });

  it('returns null for falsy input', () => {
    expect(extractBillingDay(null)).toBeNull();
    expect(extractBillingDay('')).toBeNull();
    expect(extractBillingDay(undefined)).toBeNull();
  });

  it('returns null when there is no digit at all', () => {
    expect(extractBillingDay('Mar')).toBeNull();
  });
});

describe('extractBillingMonth', () => {
  it('maps "8 Mar" to month index 2 (0-based)', () => {
    expect(extractBillingMonth('8 Mar')).toBe(2);
  });

  it('returns null for a single-word string with no month part', () => {
    expect(extractBillingMonth('8')).toBeNull();
  });

  it('returns null for an unrecognized month token', () => {
    expect(extractBillingMonth('8 Foo')).toBeNull();
  });

  it('returns null for falsy input', () => {
    expect(extractBillingMonth(null)).toBeNull();
  });
});

describe('isDueWithinDays', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when there is no resolvable billing day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10)); // 10 Mar 2026
    expect(isDueWithinDays({ date: '' })).toBe(false);
  });

  it('is true when billing day is today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10)); // 10 Mar 2026
    expect(isDueWithinDays({ billingDay: 10 })).toBe(true);
  });

  it('is true exactly at the boundary (default 7 days out)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10)); // 10 Mar 2026
    expect(isDueWithinDays({ billingDay: 17 })).toBe(true);
  });

  it('is false one day past the boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10)); // 10 Mar 2026
    expect(isDueWithinDays({ billingDay: 18 })).toBe(false);
  });

  it('rolls over to next month when billingDay already passed this month', () => {
    // 30 Mar, billingDay=5 → due 5 Apr → 6 days out → true within default window
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 30));
    expect(isDueWithinDays({ billingDay: 5 })).toBe(true);
  });

  it('for yearly subs, only counts when current month matches billing month', () => {
    vi.useFakeTimers();
    // billing date "10 Mar" (month index 2), but "now" is April → should be false
    // even though billingDay=10 would otherwise look "due" relative to today.
    vi.setSystemTime(new Date(2026, 3, 8)); // 8 Apr 2026
    expect(isDueWithinDays({ date: '10 Mar', period: 'yearly' })).toBe(false);
  });

  it('for yearly subs, true when current month matches and day is within window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 8)); // 8 Mar 2026
    expect(isDueWithinDays({ date: '10 Mar', period: 'yearly' })).toBe(true);
  });

  it('respects a custom days window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10));
    expect(isDueWithinDays({ billingDay: 12 }, 1)).toBe(false);
    expect(isDueWithinDays({ billingDay: 12 }, 2)).toBe(true);
  });
});
