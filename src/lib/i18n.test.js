import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { translations } from './i18n';

describe('translations locale parity', () => {
  it('ru and en expose exactly the same set of keys', () => {
    const ruKeys = Object.keys(translations.ru).sort();
    const enKeys = Object.keys(translations.en).sort();
    const missingInEn = ruKeys.filter(k => !enKeys.includes(k));
    const missingInRu = enKeys.filter(k => !ruKeys.includes(k));
    expect(missingInEn, `keys present in ru but missing in en: ${missingInEn.join(', ')}`).toEqual([]);
    expect(missingInRu, `keys present in en but missing in ru: ${missingInRu.join(', ')}`).toEqual([]);
  });
});

// Duplicate keys inside one object literal are invisible at runtime (the last
// one silently wins), so the only way to actually catch a copy-paste
// duplicate — like the one that used to leave stray Russian strings inside
// the `en` block — is to check the source text itself, not the imported
// object. See history of this file for the bug this guards against.
describe('translations source has no duplicate keys within a locale block', () => {
  const filePath = fileURLToPath(new URL('./i18n.js', import.meta.url));
  const src = readFileSync(filePath, 'utf8');

  const ruStart = src.indexOf('ru: {');
  const enStart = src.indexOf('en: {');
  const enEnd   = src.indexOf('\n};', enStart);
  const ruBlock = src.slice(ruStart, enStart);
  const enBlock = src.slice(enStart, enEnd);

  const findDuplicateKeys = (block) => {
    const re = /^\s{2,4}([a-zA-Z0-9_]+):/gm;
    const counts = {};
    let m;
    while ((m = re.exec(block))) counts[m[1]] = (counts[m[1]] || 0) + 1;
    return Object.entries(counts).filter(([, c]) => c > 1).map(([k]) => k);
  };

  it('ru block has no duplicate keys', () => {
    expect(findDuplicateKeys(ruBlock)).toEqual([]);
  });

  it('en block has no duplicate keys', () => {
    expect(findDuplicateKeys(enBlock)).toEqual([]);
  });
});
