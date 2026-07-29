import { describe, it, expect } from 'vitest';
import { CATEGORIES, getCat } from './categories';
import { getCatalogEntry, getLogoUrl, getLucideIcon, SERVICE_CATALOG } from './serviceCatalog';

describe('getCat', () => {
  it('finds a category by id', () => {
    expect(getCat('work')?.id).toBe('work');
  });

  it('returns null for an unknown id', () => {
    expect(getCat('does-not-exist')).toBeNull();
  });

  it('every category has a unique id', () => {
    const ids = CATEGORIES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getCatalogEntry', () => {
  it('matches by exact name, case-insensitively', () => {
    expect(getCatalogEntry('netflix')?.name).toBe('Netflix');
    expect(getCatalogEntry('NETFLIX')?.name).toBe('Netflix');
  });

  it('matches by alias', () => {
    expect(getCatalogEntry('нетфликс')?.name).toBe('Netflix');
  });

  it('trims surrounding whitespace before matching', () => {
    expect(getCatalogEntry('  Netflix  ')?.name).toBe('Netflix');
  });

  it('returns null for empty/whitespace-only input', () => {
    expect(getCatalogEntry('')).toBeNull();
    expect(getCatalogEntry('   ')).toBeNull();
    expect(getCatalogEntry(null)).toBeNull();
  });

  it('returns null when nothing matches', () => {
    expect(getCatalogEntry('ThisServiceDoesNotExist')).toBeNull();
  });

  it('every catalog entry has a non-empty name', () => {
    expect(SERVICE_CATALOG.every(s => s.name && s.name.trim().length > 0)).toBe(true);
  });
});

describe('getLogoUrl', () => {
  it('prefers an explicit sub.logo over the catalog', () => {
    expect(getLogoUrl({ name: 'Netflix', logo: 'https://example.com/custom.png' }))
      .toBe('https://example.com/custom.png');
  });

  it('returns null for catalog entries using a Lucide icon instead of a favicon', () => {
    expect(getLogoUrl({ name: 'Сервер' })).toBeNull();
  });

  it('builds a favicon URL from the catalog domain', () => {
    expect(getLogoUrl({ name: 'Netflix' })).toBe('https://www.google.com/s2/favicons?sz=64&domain=netflix.com');
  });

  it('falls back to guessing a .com domain from the first word for unknown services', () => {
    expect(getLogoUrl({ name: 'SomeRandomService' }))
      .toBe('https://www.google.com/s2/favicons?sz=64&domain=somerandomservice.com');
  });

  it('returns null when there is no name to guess a domain from', () => {
    expect(getLogoUrl({ name: '' })).toBeNull();
  });
});

describe('getLucideIcon', () => {
  it('returns the Lucide icon component for utility entries', () => {
    expect(getLucideIcon({ name: 'Wi-Fi' })).toBeTruthy();
  });

  it('returns null for services with a favicon-based logo', () => {
    expect(getLucideIcon({ name: 'Netflix' })).toBeNull();
  });
});
