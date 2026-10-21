import { RECORDINGS_PRECACHE_SW_URL } from '@features/recordings/lib/recordingsPrecache/constants';

let registerPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function clearRecordingsPrecacheRegistration(): void {
  registerPromise = null;
}

export function registerRecordingsPrecacheServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  if (registerPromise) return registerPromise;

  registerPromise = navigator.serviceWorker
    .register(RECORDINGS_PRECACHE_SW_URL, { scope: '/' })
    .then((registration) => {
      void registration.update();
      return registration;
    })
    .catch(() => null);

  return registerPromise;
}

export function postToRecordingsPrecacheSw(message: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const controller = navigator.serviceWorker?.controller;
  if (controller) {
    controller.postMessage(message);
    return;
  }
  void registerRecordingsPrecacheServiceWorker().then((reg) => {
    reg?.active?.postMessage(message);
  });
}
