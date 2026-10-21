'use client';

import { useSyncExternalStore } from 'react';
import { ANUNCIO, ANUNCIO_CTA } from '../../_contenido/footer';
import { track } from '../../_lib/analytics';

const KEY = 'ag_bar_closed';
const EVENT = 'ag-bar';

function subscribe(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange);
  return () => window.removeEventListener(EVENT, onStoreChange);
}

export function AnnouncementBar() {
  const closed = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(KEY) === '1',
    () => false,
  );
  if (closed) return null;
  return (
    <div className="ag-tone-red" style={{ padding: '10px 16px', textAlign: 'center' }}>
      <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
        <span>{ANUNCIO}</span>
        <a
          href="/landing#solicitar-simulacro"
          style={{ color: '#fff', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 3 }}
          onClick={() => track('cta_click', { cta_id: 'bar_simulacro' })}
        >
          {ANUNCIO_CTA}
        </a>
        <button
          type="button"
          aria-label="Cerrar anuncio"
          onClick={() => {
            sessionStorage.setItem(KEY, '1');
            window.dispatchEvent(new Event(EVENT));
          }}
          style={{ background: 'transparent', color: '#fff', border: 0, fontWeight: 800, minWidth: 48, minHeight: 32, cursor: 'pointer' }}
        >
          Cerrar
        </button>
      </p>
    </div>
  );
}
