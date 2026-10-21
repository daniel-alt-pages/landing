'use client';

import { useEffect, useState } from 'react';

async function clearBrowserCaches(): Promise<void> {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }

  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    /* ignore */
  }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {
    /* ignore */
  }
}

export default function ResetCachePage() {
  const [status, setStatus] = useState('Limpiando caché local...');

  useEffect(() => {
    void (async () => {
      await clearBrowserCaches();
      setStatus('Caché limpio. Redirigiendo a login...');
      window.setTimeout(() => {
        window.location.replace(`/login?fresh=${Date.now()}`);
      }, 400);
    })();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <h1 className="text-lg font-bold">Reset de staging</h1>
        <p className="mt-2 text-sm text-slate-200">{status}</p>
        <button
          type="button"
          onClick={() => window.location.replace(`/login?fresh=${Date.now()}`)}
          className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950"
        >
          Ir a login
        </button>
      </section>
    </main>
  );
}
