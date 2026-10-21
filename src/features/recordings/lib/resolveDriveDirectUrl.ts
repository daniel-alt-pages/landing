import { RECORDINGS_PRECACHE_TTL_MS } from '@features/recordings/lib/recordingsPrecache/constants';

const DRIVE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const FILE_ID_RE = /^[\w-]{10,}$/;

const RESOLVE_STORAGE_PREFIX = 'sg:drive-direct-url:v3:';

type ResolveCacheEntry = {
  url: string | null;
  at: number;
};

const memoryCache = new Map<string, ResolveCacheEntry>();
const inflight = new Map<string, Promise<string | null>>();

function readStorageCache(fileId: string): ResolveCacheEntry | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${RESOLVE_STORAGE_PREFIX}${fileId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResolveCacheEntry;
    if (!parsed || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > RECORDINGS_PRECACHE_TTL_MS) {
      sessionStorage.removeItem(`${RESOLVE_STORAGE_PREFIX}${fileId}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStorageCache(fileId: string, entry: ResolveCacheEntry): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(`${RESOLVE_STORAGE_PREFIX}${fileId}`, JSON.stringify(entry));
  } catch {
    /* quota */
  }
}

export function isValidDriveFileId(fileId: string): boolean {
  return FILE_ID_RE.test(fileId);
}

function looksLikeMediaUrl(url: string): boolean {
  return (
    url.includes('googleusercontent.com') ||
    url.includes('drive.usercontent.google.com') ||
    url.includes('drive.google.com/uc')
  );
}

async function resolveFromInitialUrl(url: string, fileId: string): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: 'manual',
      headers: { 'User-Agent': DRIVE_UA },
    });
  } catch {
    return null;
  }

  if (res.status === 302 || res.status === 303 || res.status === 307 || res.status === 308) {
    const loc = res.headers.get('location');
    if (loc && looksLikeMediaUrl(loc)) return loc;
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (res.ok && (contentType.includes('video/') || contentType.includes('application/octet-stream'))) {
    return url;
  }

  if (!res.ok || !contentType.includes('text/html')) return null;

  const html = await res.text();
  const confirmToken = html.match(/confirm=([0-9A-Za-z_-]+)/)?.[1];
  if (!confirmToken) return null;

  const confirmUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}&confirm=${confirmToken}`;
  let confirmRes: Response;
  try {
    confirmRes = await fetch(confirmUrl, {
      redirect: 'manual',
      headers: { 'User-Agent': DRIVE_UA },
    });
  } catch {
    return null;
  }

  if (confirmRes.status === 302 || confirmRes.status === 303 || confirmRes.status === 307) {
    const loc = confirmRes.headers.get('location');
    if (loc && looksLikeMediaUrl(loc)) return loc;
  }

  const confirmType = confirmRes.headers.get('content-type') ?? '';
  if (
    confirmRes.ok &&
    (confirmType.includes('video/') || confirmType.includes('application/octet-stream'))
  ) {
    return confirmUrl;
  }

  return null;
}

async function resolveDriveDirectUrlUncached(fileId: string): Promise<string | null> {
  const candidates = [
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
    `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`,
  ];

  for (const url of candidates) {
    const direct = await resolveFromInitialUrl(url, fileId);
    if (direct) return direct;
  }

  return null;
}

/** Resuelve URL directa de media (googleusercontent) para `<video>` — evita iframe /preview. */
export async function resolveDriveDirectUrl(fileId: string): Promise<string | null> {
  if (!isValidDriveFileId(fileId)) return null;

  const mem = memoryCache.get(fileId);
  if (mem && Date.now() - mem.at < RECORDINGS_PRECACHE_TTL_MS) {
    return mem.url;
  }

  const stored = readStorageCache(fileId);
  if (stored) {
    memoryCache.set(fileId, stored);
    return stored.url;
  }

  const pending = inflight.get(fileId);
  if (pending) return pending;

  const promise = resolveDriveDirectUrlUncached(fileId)
    .then((url) => {
      const entry: ResolveCacheEntry = { url, at: Date.now() };
      memoryCache.set(fileId, entry);
      writeStorageCache(fileId, entry);
      return url;
    })
    .finally(() => {
      inflight.delete(fileId);
    });

  inflight.set(fileId, promise);
  return promise;
}
