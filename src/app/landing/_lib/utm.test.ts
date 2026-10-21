import { describe, expect, it } from 'vitest';
import { parseUtm, rememberUtm } from './utm';

function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe('utm', () => {
  it('lee solo las claves utm', () => {
    expect(parseUtm('?utm_source=ig&utm_campaign=rectores&q=1')).toEqual({
      utm_source: 'ig',
      utm_campaign: 'rectores',
    });
  });

  it('no pisa la primera visita', () => {
    const store = memory();
    rememberUtm(store, '?utm_source=ig', 'https://instagram.com');
    const second = rememberUtm(store, '?utm_source=fb', '');
    expect(second.utm_source).toBe('ig');
    expect(second.referrer).toBe('https://instagram.com');
  });
});
