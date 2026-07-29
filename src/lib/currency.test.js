import { describe, it, expect } from 'vitest';
import { getCurrency, toUSD, monthlyUSD, DEFAULT_RATES, CURRENCIES } from './currency';

describe('getCurrency', () => {
  it('finds currency by code', () => {
    expect(getCurrency('EUR')).toEqual({ code: 'EUR', symbol: '€', label: 'EUR (€)' });
  });

  it('falls back to the first currency (USD) on unknown code', () => {
    expect(getCurrency('XYZ')).toEqual(CURRENCIES[0]);
  });

  it('falls back to USD when code is missing entirely', () => {
    expect(getCurrency(undefined)).toEqual(CURRENCIES[0]);
  });
});

describe('toUSD', () => {
  it('converts using the provided rates', () => {
    // 92 EUR at rate 0.92 EUR/USD → 100 USD
    expect(toUSD(92, 'EUR', { EUR: 0.92 })).toBeCloseTo(100);
  });

  it('falls back to DEFAULT_RATES when no rates map is given', () => {
    expect(toUSD(90, 'RUB', null)).toBeCloseTo(90 / DEFAULT_RATES.RUB);
  });

  it('falls back to rate 1 for an unknown currency code', () => {
    expect(toUSD(50, 'ZZZ', {})).toBe(50);
  });

  it('treats missing/undefined price as 0', () => {
    expect(toUSD(undefined, 'USD', {})).toBe(0);
  });
});

describe('monthlyUSD', () => {
  it('returns the price as-is for monthly subscriptions', () => {
    const sub = { price: 10, currency_code: 'USD', period: 'monthly' };
    expect(monthlyUSD(sub, {})).toBeCloseTo(10);
  });

  it('divides yearly subscriptions by 12', () => {
    const sub = { price: 120, currency_code: 'USD', period: 'yearly' };
    expect(monthlyUSD(sub, {})).toBeCloseTo(10);
  });

  it('falls back through price_usd / priceUSD when price is absent', () => {
    expect(monthlyUSD({ price_usd: 24, period: 'monthly' }, {})).toBeCloseTo(24);
    expect(monthlyUSD({ priceUSD: 36, period: 'monthly' }, {})).toBeCloseTo(36);
  });

  it('defaults currency_code to USD when missing', () => {
    const sub = { price: 10, period: 'monthly' };
    expect(monthlyUSD(sub, { USD: 1 })).toBeCloseTo(10);
  });
});
