import { describe, expect, it } from 'vitest';
import {
  COOKIE,
  COOKIE_DAYS,
  applyConsent,
  bumpMeter,
  memoryCookieStore,
  parseConsentValue,
  readVista,
  writeCappedCookie,
  writeVista,
} from './cookies';

const DAY = 86400;

describe('cookies de la landing', () => {
  it('guarda la elección 395 días y borra lo opcional al dejar solo las necesarias', () => {
    const store = memoryCookieStore();
    store.write(COOKIE.aid, '11111111-1111-4111-8111-111111111111', 10);
    store.write(COOKIE.vista, '{}', 10);
    store.write(COOKIE.utm, '{"utm_source":"ads"}', 10);
    store.write(COOKIE.cart, '[]', 10);
    store.write('_ga', 'GA1.1.1.1', 10);
    store.write('_ga_TEST', '1', 10);
    store.write('_fbp', 'fb.1', 10);

    applyConsent(
      { analytics: false, personalization: false, advertising: false },
      store,
      null,
    );

    const choice = parseConsentValue(store.read(COOKIE.consent));
    expect(choice?.analytics).toBe(false);
    expect(choice?.personalization).toBe(false);
    expect(choice?.advertising).toBe(false);
    expect(store.age(COOKIE.consent)).toBe(COOKIE_DAYS.consent * DAY);
    expect(store.read(COOKIE.aid)).toBeNull();
    expect(store.read(COOKIE.vista)).toBeNull();
    expect(store.read(COOKIE.utm)).toBeNull();
    expect(store.read('_ga')).toBeNull();
    expect(store.read('_ga_TEST')).toBeNull();
    expect(store.read('_fbp')).toBeNull();
    expect(store.read(COOKIE.cart)).toBe('[]');
  });

  it('con analítica crea un visitante, conserva la campaña 90 días y no toca el carrito', () => {
    const store = memoryCookieStore();
    store.write(COOKIE.cart, '[{"id":"a"}]', 100);
    applyConsent(
      { analytics: true, personalization: true, advertising: false },
      store,
      { getItem: () => '{"utm_source":"ig"}' },
    );
    expect(store.read(COOKIE.aid)).toMatch(/^[0-9a-f-]{36}$/i);
    expect(store.age(COOKIE.aid)).toBe(COOKIE_DAYS.visitor * DAY);
    expect(store.read(COOKIE.utm)).toContain('ig');
    expect(store.age(COOKIE.utm)).toBe(COOKIE_DAYS.utm * DAY);
    expect(store.read(COOKIE.cart)).toBe('[{"id":"a"}]');
    writeVista({ tipo: 'curso', necesidad: 'icfes', programa: 'pre-icfes' }, store);
    expect(readVista(store)?.tipo).toBe('curso');
    expect(store.age(COOKIE.vista)).toBe(COOKIE_DAYS.vista * DAY);
    bumpMeter(store, 'scroll_75');
    expect(store.read(COOKIE.meter)).toContain('"n":1');
    expect(store.read(COOKIE.meter)).toContain('scroll_75');
  });

  it('no escribe una cookie más grande que el tope del carrito', () => {
    const store = memoryCookieStore();
    const huge = 'x'.repeat(4000);
    expect(writeCappedCookie(store, COOKIE.cart, huge, 100)).toBe(false);
    expect(store.read(COOKIE.cart)).toBeNull();
    expect(writeCappedCookie(store, COOKIE.cart, '[]', 100)).toBe(true);
    expect(store.read(COOKIE.cart)).toBe('[]');
  });
});
