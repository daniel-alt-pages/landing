'use client';

import { useEffect, useState } from 'react';
import { tiendaLandingUrl } from '../../_contenido/contacto';
import type { TiendaConfig } from '../../_lib/tienda';
import { TIENDA_EJEMPLO_CONFIG, tiendaEjemploActiva } from '../../_contenido/tienda-ejemplo';

/** Aviso de urgencia que se prende desde Comercio. */
export function StorefrontBanner() {
  const [config, setConfig] = useState<TiendaConfig | null>(null);
  useEffect(() => {
    const url = tiendaLandingUrl();
    const fallback = () => { if (tiendaEjemploActiva()) setConfig(TIENDA_EJEMPLO_CONFIG); };
    if (!url) { fallback(); return undefined; }
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => (body?.config ? setConfig(body.config) : fallback()))
      .catch(() => { if (!controller.signal.aborted) fallback(); });
    return () => controller.abort();
  }, []);
  if (!config?.urgencyBanner || !config.urgencyText) return null;
  return (
    <div className="ag-tone-red ag-urgency" role="note">
      {config.urgencyText}
    </div>
  );
}
