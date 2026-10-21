export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmBag = Partial<Record<UtmKey, string>>;

export function parseUtm(search: string): UtmBag {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const bag: UtmBag = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) bag[key] = value.slice(0, 120);
  }
  return bag;
}

type MemoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

const STORAGE_KEY = 'ag_utm';

/** La primera visita gana: no pisa una UTM ya guardada. */
export function rememberUtm(storage: MemoryStorage, search: string, referrer: string): UtmBag & { referrer?: string } {
  let current: UtmBag & { referrer?: string } = {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) current = JSON.parse(raw) as UtmBag & { referrer?: string };
  } catch {
    current = {};
  }
  const incoming = parseUtm(search);
  const hasIncoming = Object.keys(incoming).length > 0;
  const next = hasIncoming && !current.utm_source ? { ...incoming } : { ...current };
  if (!next.referrer && referrer) next.referrer = referrer.slice(0, 300);
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
