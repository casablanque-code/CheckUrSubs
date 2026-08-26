import { describe, it, expect } from 'vitest';
import { withPriceChange, getLastPriceChange } from './priceHistory';

describe('withPriceChange', () => {
  it('adds an entry when price increased', () => {
    const prev = { price: 500, currency_code: 'RUB', price_history: [] };
    const history = withPriceChange(prev, 700, 'RUB');
    expect(history).toHaveLength(1);
    expect(history[0].price).toBe(500);
    expect(history[0].currency_code).toBe('RUB');
    expect(history[0].changed_at).toBeTruthy();
  });

  it('adds an entry when only currency changed', () => {
    const prev = { price: 10, currency_code: 'USD', price_history: [] };
    const history = withPriceChange(prev, 10, 'EUR');
    expect(history).toHaveLength(1);
    expect(history[0].currency_code).toBe('USD');
  });

  it('does not add an entry when nothing changed', () => {
    const prev = { price: 500, currency_code: 'RUB', price_history: [{ price: 400, currency_code: 'RUB', changed_at: '2026-01-01' }] };
    const history = withPriceChange(prev, 500, 'RUB');
    expect(history).toHaveLength(1);
    expect(history[0].price).toBe(400);
  });

  it('does not add an entry for a brand new subscription (no prior price)', () => {
    const history = withPriceChange({ price: 0, currency_code: 'USD', price_history: [] }, 500, 'USD');
    expect(history).toHaveLength(0);
  });

  it('prepends newest first and caps at 20 entries', () => {
    const existing = Array.from({ length: 20 }, (_, i) => ({ price: i, currency_code: 'USD', changed_at: `2026-01-${i + 1}` }));
    const prev = { price: 999, currency_code: 'USD', price_history: existing };
    const history = withPriceChange(prev, 1000, 'USD');
    expect(history).toHaveLength(20);
    expect(history[0].price).toBe(999);
    expect(history[19].price).toBe(18); // oldest entry dropped
  });

  it('handles a missing price_history field gracefully', () => {
    const history = withPriceChange({ price: 500, currency_code: 'RUB' }, 600, 'RUB');
    expect(history).toHaveLength(1);
  });
});

describe('getLastPriceChange', () => {
  it('returns null when there is no history', () => {
    expect(getLastPriceChange({ price: 500, currency_code: 'RUB', price_history: [] })).toBeNull();
  });

  it('computes a positive percentage for a price increase', () => {
    const sub = { price: 600, currency_code: 'RUB', price_history: [{ price: 500, currency_code: 'RUB', changed_at: '2026-01-01' }] };
    const change = getLastPriceChange(sub);
    expect(change.pct).toBeCloseTo(20);
    expect(change.from).toBe(500);
    expect(change.to).toBe(600);
  });

  it('computes a negative percentage for a price decrease', () => {
    const sub = { price: 400, currency_code: 'RUB', price_history: [{ price: 500, currency_code: 'RUB', changed_at: '2026-01-01' }] };
    const change = getLastPriceChange(sub);
    expect(change.pct).toBeCloseTo(-20);
  });

  it('returns null when the last recorded currency differs from the current one', () => {
    const sub = { price: 10, currency_code: 'EUR', price_history: [{ price: 10, currency_code: 'USD', changed_at: '2026-01-01' }] };
    expect(getLastPriceChange(sub)).toBeNull();
  });
});
