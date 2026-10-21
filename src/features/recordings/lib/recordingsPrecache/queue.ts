import { recordingDrivePrecacheUrls } from '@features/recordings/lib/recordingPlaybackSources';
import {
  RECORDINGS_PRECACHE_CONCURRENCY,
  RECORDINGS_PRECACHE_ITEM_TIMEOUT_MS,
  RECORDINGS_PRECACHE_STAGGER_MS,
  recordingsCacheBucketId,
  recordingsCatalogJsonPath,
} from '@features/recordings/lib/recordingsPrecache/constants';
import {
  postToRecordingsPrecacheSw,
  registerRecordingsPrecacheServiceWorker,
} from '@features/recordings/lib/recordingsPrecache/registerServiceWorker';
import { registerRecordingMediaUrl } from '@features/recordings/lib/recordingsPrecache/registerUrl';
import {
  isRecordingsPrecacheFresh,
  markRecordingsPrecacheComplete,
} from '@features/recordings/lib/recordingsPrecache/state';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';

type PrecacheJob = {
  simulationId: string;
  catalogVersion: string;
  recordings: SimRecording[];
  force?: boolean;
};

function shouldSkipHeavyPrecache(): boolean {
  if (typeof navigator === 'undefined') return true;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return true;
  if (window.matchMedia('(prefers-reduced-data: reduce)').matches) return true;
  return false;
}

async function requestPersistentStorage(): Promise<void> {
  if (typeof navigator === 'undefined') return;
  try {
    if (navigator.storage?.persist) {
      await navigator.storage.persist();
    }
  } catch {
    /* ignore */
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scheduleIdle(fn: () => void): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(fn, { timeout: 2500 });
  } else {
    setTimeout(fn, 32);
  }
}

function preloadDriveViaHiddenVideo(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (!url || typeof document === 'undefined') {
      resolve();
      return;
    }

    registerRecordingMediaUrl(url);

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');
    video.style.cssText =
      'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px';

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
      resolve();
    };

    const timer = setTimeout(finish, RECORDINGS_PRECACHE_ITEM_TIMEOUT_MS);
    video.addEventListener('loadeddata', finish, { once: true });
    video.addEventListener('canplay', finish, { once: true });
    video.addEventListener('error', finish, { once: true });

    document.body.appendChild(video);
    video.src = url;
    video.load();
  });
}

async function precacheCatalogUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { credentials: 'same-origin', cache: 'no-cache' });
    return res.ok;
  } catch {
    return false;
  }
}

/** Cola singleton — precarga masiva 30 días por simulacro/dispositivo. */
class RecordingsPrecacheQueue {
  private pending: string[] = [];
  private pumping = false;
  private activeJob: PrecacheJob | null = null;
  private seenUrls = new Set<string>();
  private retryCounts = new Map<string, number>();

  enqueue(job: PrecacheJob): void {
    void requestPersistentStorage();

    if (!job.force && isRecordingsPrecacheFresh(job.simulationId, job.catalogVersion)) {
      void this.ensureServiceWorkerCache(job);
      return;
    }

    this.activeJob = job;
    this.pushUrl(recordingsCatalogJsonPath(job.simulationId));

    if (!shouldSkipHeavyPrecache()) {
      for (const rec of job.recordings) {
        for (const url of recordingDrivePrecacheUrls(rec)) {
          this.pushUrl(url);
        }
      }
    }

    void this.ensureServiceWorkerCache(job);
    scheduleIdle(() => void this.pump());
  }

  private pushUrl(url: string): void {
    if (!url || this.seenUrls.has(url)) return;
    this.seenUrls.add(url);
    this.pending.push(url);
  }

  private collectDriveUrls(job: PrecacheJob): string[] {
    const urls: string[] = [];
    for (const rec of job.recordings) {
      urls.push(...recordingDrivePrecacheUrls(rec));
    }
    return [...new Set(urls)];
  }

  private async ensureServiceWorkerCache(job: PrecacheJob): Promise<void> {
    const registration = await registerRecordingsPrecacheServiceWorker();
    const cacheId = recordingsCacheBucketId(job.simulationId, job.catalogVersion);
    const driveUrls = this.collectDriveUrls(job);
    postToRecordingsPrecacheSw({
      type: 'SG_RECORDINGS_INIT',
      cacheId,
      catalogPath: recordingsCatalogJsonPath(job.simulationId),
      driveUrls,
    });
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SG_RECORDINGS_SKIP_WAITING' });
    }
  }

  private async processOne(url: string): Promise<void> {
    registerRecordingMediaUrl(url);

    if (url.includes('/data/recordings/')) {
      const ok = await precacheCatalogUrl(url);
      if (!ok) {
        const tries = (this.retryCounts.get(url) ?? 0) + 1;
        this.retryCounts.set(url, tries);
        if (tries < 3) this.pending.push(url);
      }
      return;
    }

    if (!shouldSkipHeavyPrecache()) {
      await preloadDriveViaHiddenVideo(url);
    }
  }

  private async pump(): Promise<void> {
    if (this.pumping) return;
    this.pumping = true;

    try {
      while (this.pending.length > 0) {
        const batch = this.pending.splice(0, RECORDINGS_PRECACHE_CONCURRENCY);
        await Promise.all(
          batch.map(async (url) => {
            await this.processOne(url);
            await delay(RECORDINGS_PRECACHE_STAGGER_MS);
          }),
        );
      }

      if (this.activeJob) {
        markRecordingsPrecacheComplete(
          this.activeJob.simulationId,
          this.activeJob.catalogVersion,
          this.activeJob.recordings.map((r) => r.id),
        );
      }
    } finally {
      this.pumping = false;
    }
  }
}

const globalQueue = new RecordingsPrecacheQueue();

export function startRecordingsPrecache(job: PrecacheJob): void {
  if (!job.recordings.length) return;
  globalQueue.enqueue(job);
}

export function startRecordingsPrecacheFromCatalog(
  simulationId: string,
  catalogVersion: string | undefined,
  recordings: SimRecording[],
  force = false,
): void {
  startRecordingsPrecache({
    simulationId,
    catalogVersion: catalogVersion ?? simulationId,
    recordings,
    force,
  });
}
