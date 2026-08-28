import { describe, it, expect } from 'vitest';
import { getDuplicateGroups, getYearlySavingsCandidates, getFamilyPlanCandidates, getSpendTrendInsight } from './insights';

const sub = (name, overrides = {}) => ({ id: name, name, status: 'active', ...overrides });

describe('getDuplicateGroups', () => {
  it('flags 2+ music services', () => {
    const groups = getDuplicateGroups([sub('Spotify'), sub('Apple Music')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe('music');
    expect(groups[0].subs.map(s => s.name)).toEqual(['Spotify', 'Apple Music']);
  });

  it('does not flag a single music service', () => {
    expect(getDuplicateGroups([sub('Spotify')])).toHaveLength(0);
  });

  it('requires 3+ video services (higher threshold)', () => {
    expect(getDuplicateGroups([sub('Netflix'), sub('Disney+')])).toHaveLength(0);
    const groups = getDuplicateGroups([sub('Netflix'), sub('Disney+'), sub('Hulu')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe('video');
  });

  it('ignores paused and trial subscriptions', () => {
    const groups = getDuplicateGroups([sub('Spotify'), sub('Apple Music', { status: 'paused' })]);
    expect(groups).toHaveLength(0);
  });

  it('ignores services with no known serviceType (e.g. work tools)', () => {
    expect(getDuplicateGroups([sub('Notion'), sub('Figma'), sub('Linear')])).toHaveLength(0);
  });

  it('ignores unrecognized subscription names', () => {
    expect(getDuplicateGroups([sub('Local Gym'), sub('Random Service')])).toHaveLength(0);
  });

  it('can return multiple groups at once, in stable order', () => {
    const groups = getDuplicateGroups([
      sub('iCloud'), sub('Google One'),
      sub('Claude Pro'), sub('ChatGPT Plus'),
    ]);
    expect(groups.map(g => g.type)).toEqual(['ai', 'storage']);
  });

  it('returns an empty array for no subscriptions', () => {
    expect(getDuplicateGroups([])).toEqual([]);
    expect(getDuplicateGroups(undefined)).toEqual([]);
  });
});

describe('getYearlySavingsCandidates', () => {
  it('flags a monthly subscription whose catalog entry has a yearly plan', () => {
    const result = getYearlySavingsCandidates([sub('Grammarly', { period: 'monthly' })]);
    expect(result).toEqual([{ id: 'Grammarly', name: 'Grammarly' }]);
  });

  it('does not flag a subscription already on yearly billing', () => {
    expect(getYearlySavingsCandidates([sub('Grammarly', { period: 'yearly' })])).toEqual([]);
  });

  it('does not flag a service with no known yearly plan', () => {
    expect(getYearlySavingsCandidates([sub('Netflix', { period: 'monthly' })])).toEqual([]);
  });

  it('ignores paused subscriptions', () => {
    expect(getYearlySavingsCandidates([sub('Grammarly', { period: 'monthly', status: 'paused' })])).toEqual([]);
  });

  it('ignores unrecognized subscription names', () => {
    expect(getYearlySavingsCandidates([sub('Local Gym', { period: 'monthly' })])).toEqual([]);
  });
});

describe('getFamilyPlanCandidates', () => {
  it('flags a subscription whose catalog entry has a family plan', () => {
    const result = getFamilyPlanCandidates([sub('Spotify')]);
    expect(result).toEqual([{ id: 'Spotify', name: 'Spotify' }]);
  });

  it('does not flag a service with no known family plan', () => {
    expect(getFamilyPlanCandidates([sub('Netflix')])).toEqual([]);
  });

  it('ignores paused subscriptions', () => {
    expect(getFamilyPlanCandidates([sub('Spotify', { status: 'paused' })])).toEqual([]);
  });

  it('applies regardless of billing period', () => {
    expect(getFamilyPlanCandidates([sub('Spotify', { period: 'yearly' })])).toEqual([{ id: 'Spotify', name: 'Spotify' }]);
  });
});

describe('getSpendTrendInsight', () => {
  const rates = { USD: 1 };
  const now = new Date(2026, 2, 15); // 15 марта 2026

  it('detects an increase vs the previous month', () => {
    const subs = [
      sub('A', { period: 'monthly', price: 20, currency_code: 'USD', date: '5 Mar' }),
      sub('B', { period: 'monthly', price: 10, currency_code: 'USD', date: '5 Mar' }),
    ];
    // Оба месячные — списываются одинаково каждый месяц, значит без
    // изменений сами по себе. Добавим годовую, попадающую только на март.
    subs.push(sub('C', { period: 'yearly', price: 30, currency_code: 'USD', date: '10 Mar' }));
    const result = getSpendTrendInsight(subs, rates, now);
    expect(result.direction).toBe('up');
    expect(result.pct).toBeCloseTo(100); // (60-30)/30 * 100
  });

  it('detects a decrease vs the previous month', () => {
    const subs = [sub('A', { period: 'yearly', price: 50, currency_code: 'USD', date: '10 Feb' })];
    const result = getSpendTrendInsight(subs, rates, now);
    expect(result.direction).toBe('down');
    expect(result.pct).toBe(-100); // март: 0, февраль: 50
  });

  it('returns null when the previous month had no spend to compare against', () => {
    const subs = [sub('A', { period: 'yearly', price: 50, currency_code: 'USD', date: '10 Mar' })];
    expect(getSpendTrendInsight(subs, rates, now)).toBeNull();
  });

  it('returns null when nothing changed', () => {
    const subs = [sub('A', { period: 'monthly', price: 10, currency_code: 'USD', date: '5 Mar' })];
    expect(getSpendTrendInsight(subs, rates, now)).toBeNull();
  });

  it('excludes trial and paused subscriptions, same as the trend chart', () => {
    const subs = [
      sub('Trial', { period: 'monthly', price: 999, status: 'trial', date: '5 Mar' }),
      sub('Paused', { period: 'monthly', price: 999, status: 'paused', date: '5 Mar' }),
      sub('Yearly', { period: 'yearly', price: 20, currency_code: 'USD', date: '10 Feb' }),
    ];
    // Только Yearly считается (в феврале), Trial/Paused игнорируются в обоих месяцах
    expect(getSpendTrendInsight(subs, rates, now).pct).toBe(-100);
  });

  it('excludes subscriptions with no valid billing day, same as the trend chart', () => {
    const subs = [sub('NoDate', { period: 'monthly', price: 999, date: '' })];
    expect(getSpendTrendInsight(subs, rates, now)).toBeNull();
  });
});
