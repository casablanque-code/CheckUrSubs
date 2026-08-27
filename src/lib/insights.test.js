import { describe, it, expect } from 'vitest';
import { getDuplicateGroups, getYearlySavingsCandidates, getFamilyPlanCandidates } from './insights';

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
