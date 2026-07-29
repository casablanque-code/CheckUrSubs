import { describe, it, expect, beforeAll } from 'vitest';
import { urlBase64ToUint8Array } from './push';

// urlBase64ToUint8Array only touches window.atob when *called*, not at
// module-load time, so a plain static import + a window stub is enough —
// no need to pull in jsdom for one function.
beforeAll(() => {
  global.window = { atob: (s) => Buffer.from(s, 'base64').toString('binary') };
});

describe('urlBase64ToUint8Array', () => {
  it('decodes a standard base64url VAPID key into bytes', () => {
    // "hello" base64 = "aGVsbG8="
    const result = urlBase64ToUint8Array('aGVsbG8');
    expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
  });

  it('handles base64url characters (- and _) by converting to standard base64', () => {
    // bytes [0xfb, 0xff] -> base64url "-_8"
    const result = urlBase64ToUint8Array('-_8');
    expect(Array.from(result)).toEqual([0xfb, 0xff]);
  });
});
