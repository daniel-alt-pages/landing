import { rememberUtm, type UtmBag } from './utm';

/** Días alineados con los plazos que Google publica para cada finalidad. */
export const COOKIE_DAYS = {
  consent: 395,
  cart: 180,
  visitor: 395,
  meter: 395,
  utm: 90,
  vista: 180,
} as const;

const DAY = 86400;
const CART_LIMIT = 3500;

export const COOKIE = {
  consent: 'sg_consent',
  cart: 'sg_cart',
  aid: 'sg_aid',
  meter: 'sg_meter',
  utm: 'sg_utm',
  vista: 'sg_vista',
} as const;

export const CONSENT_EVENT = 'sg-consent';
export const OPEN_CONSENT_EVENT = 'sg-consent-open';
const LEGACY_KEY = 'ag_consent';
const SESSION_UTM = 'ag_utm';

export type ConsentFlags = {
  analytics: boolean;
  personalization: boolean;
  advertising: boolean;
};

export type ConsentChoice = ConsentFlags & { at: number };

export type Vista = {
  tipo: string;
  necesidad: string;
  programa: string;
};

export type CookieStore = {
  read: (name: string) => string | null;
  write: (name: string, value: string, maxAgeSeconds: number) => void;
  drop: (name: string) => void;
  names: () => string[];
};

type MemoryGet = { getItem: (key: string) => string | null };

export function memoryCookieStore() {
  const jar = new Map<string, { value: string; maxAge: number }>();
  const store: CookieStore = {
    read: (name) => jar.get(name)?.value ?? null,
    write: (name, value, maxAgeSeconds) => jar.set(name, { value, maxAge: maxAgeSeconds }),
    drop: (name) => { jar.delete(name); },
    names: () => [...jar.keys()],
  };
  return Object.assign(store, {
    age: (name: string) => jar.get(name)?.maxAge ?? null,
  });
}

export function browserCookieStore(): CookieStore {
  return {
    read(name) {
      if (typeof document === 'undefined') return null;
      const prefix = `${name}=`;
      const row = document.cookie.split('; ').find((part) => part.startsWith(prefix));
      if (!row) return null;
      try {
        return decodeURIComponent(row.slice(prefix.length));
      } catch {
        return null;
      }
    },
    write(name, value, maxAgeSeconds) {
      if (typeof document === 'undefined') return;
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
    },
    drop(name) {
      if (typeof document === 'undefined') return;
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    },
    names() {
      if (typeof document === 'undefined' || !document.cookie) return [];
      return document.cookie.split('; ').map((part) => part.split('=')[0]).filter(Boolean);
    },
  };
}

export function parseConsentValue(raw: string | null): ConsentChoice | null {
  if (!raw) return null;
  if (raw === 'yes') {
    return { analytics: true, personalization: true, advertising: true, at: 0 };
  }
  if (raw === 'no') {
    return { analytics: false, personalization: false, advertising: false, at: 0 };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentChoice>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      analytics: parsed.analytics === true,
      personalization: parsed.personalization === true,
      advertising: parsed.advertising === true,
      at: Number(parsed.at) || 0,
    };
  } catch {
    return null;
  }
}

export function readConsent(store: CookieStore = browserCookieStore()): ConsentChoice | null {
  return parseConsentValue(store.read(COOKIE.consent));
}

export function readConsentSnapshot(): string {
  if (typeof document === 'undefined') return '';
  const cookie = browserCookieStore().read(COOKIE.consent);
  if (cookie) return cookie;
  try {
    return window.localStorage.getItem(LEGACY_KEY) || '';
  } catch {
    return '';
  }
}

function dropNamed(store: CookieStore, match: (name: string) => boolean) {
  for (const name of store.names()) {
    if (match(name)) store.drop(name);
  }
}

function isAnalyticsVendor(name: string) {
  return name === '_ga'
    || name.startsWith('_ga_')
    || name === '_gid'
    || name.startsWith('_gid_')
    || name === '_gat'
    || name.startsWith('_gat_');
}

function isAdsVendor(name: string) {
  return name.startsWith('_gcl_')
    || name.startsWith('_gac_')
    || name === '_gads'
    || name === '_fbp'
    || name === '_fbc';
}

export function applyConsent(
  flags: ConsentFlags,
  store: CookieStore,
  session: MemoryGet | null = null,
): ConsentChoice {
  const choice: ConsentChoice = { ...flags, at: Date.now() };
  store.write(COOKIE.consent, JSON.stringify(choice), COOKIE_DAYS.consent * DAY);
  if (flags.analytics) ensureVisitor(store);
  else {
    store.drop(COOKIE.aid);
    store.drop(COOKIE.meter);
    dropNamed(store, isAnalyticsVendor);
  }
  if (!flags.personalization) store.drop(COOKIE.vista);
  if (flags.analytics || flags.advertising) {
    const raw = session?.getItem(SESSION_UTM);
    if (raw && !store.read(COOKIE.utm)) store.write(COOKIE.utm, raw, COOKIE_DAYS.utm * DAY);
  } else {
    store.drop(COOKIE.utm);
  }
  if (!flags.advertising) dropNamed(store, isAdsVendor);
  return choice;
}

export function clearLegacyConsent() {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* el navegador puede bloquear el almacenamiento */
  }
}

export function openCookieSettings() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}

export function writeCappedCookie(
  store: CookieStore,
  name: string,
  value: string,
  maxAgeSeconds: number,
  limit = CART_LIMIT,
): boolean {
  if (encodeURIComponent(value).length > limit) return false;
  store.write(name, value, maxAgeSeconds);
  return true;
}

export function ensureVisitor(store: CookieStore): string {
  const current = store.read(COOKIE.aid);
  if (current && /^[0-9a-f-]{36}$/i.test(current)) return current;
  const id = globalThis.crypto?.randomUUID?.()
    || `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`;
  store.write(COOKIE.aid, id, COOKIE_DAYS.visitor * DAY);
  return id;
}

export function bumpMeter(store: CookieStore, name: string) {
  let count = 0;
  try {
    const raw = store.read(COOKIE.meter);
    if (raw) count = Number(JSON.parse(raw).n) || 0;
  } catch {
    count = 0;
  }
  store.write(
    COOKIE.meter,
    JSON.stringify({ n: count + 1, last: name.slice(0, 40) }),
    COOKIE_DAYS.meter * DAY,
  );
}

export function readVista(store: CookieStore = browserCookieStore()): Vista | null {
  const raw = store.read(COOKIE.vista);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Vista>;
    return {
      tipo: String(parsed.tipo || '').slice(0, 40),
      necesidad: String(parsed.necesidad || '').slice(0, 80),
      programa: String(parsed.programa || '').slice(0, 80),
    };
  } catch {
    return null;
  }
}

export function writeVista(vista: Vista, store: CookieStore = browserCookieStore()) {
  const slim: Vista = {
    tipo: vista.tipo.slice(0, 40),
    necesidad: vista.necesidad.slice(0, 80),
    programa: vista.programa.slice(0, 80),
  };
  store.write(COOKIE.vista, JSON.stringify(slim), COOKIE_DAYS.vista * DAY);
}

function cookieUtmMemory(store: CookieStore) {
  return {
    getItem: () => store.read(COOKIE.utm),
    setItem: (_key: string, value: string) => store.write(COOKIE.utm, value, COOKIE_DAYS.utm * DAY),
  };
}

/** La visita actual queda en la pestaña. La cookie de campaña solo si analítica o publicidad están aceptadas. */
export function captureCampaign(search: string, referrer: string): UtmBag & { referrer?: string } {
  if (typeof sessionStorage === 'undefined') {
    return rememberUtm({ getItem: () => null, setItem() {} }, search, referrer);
  }
  const sessionBag = rememberUtm(sessionStorage, search, referrer);
  const store = browserCookieStore();
  const consent = readConsent(store);
  if (!consent || (!consent.analytics && !consent.advertising)) return sessionBag;
  if (!store.read(COOKIE.utm)) {
    store.write(COOKIE.utm, JSON.stringify(sessionBag), COOKIE_DAYS.utm * DAY);
    return sessionBag;
  }
  return rememberUtm(cookieUtmMemory(store), search, referrer);
}
