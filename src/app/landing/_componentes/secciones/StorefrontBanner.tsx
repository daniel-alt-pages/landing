'use client';

import { useEffect, useState } from 'react';
import { tiendaLandingUrl } from '../../_contenido/contacto';
import type { TiendaConfig } from '../../_lib/tienda';

/** Aviso de urgencia que se prende desde Comercio. */
export function StorefrontBanner() {
  const [config, setConfig] = useState<TiendaConfig | null>(null);
  useEffect(() => {
    const url = tiendaLandingUrl();
    if (!url) return undefined;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => setConfig(body?.config || null))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  if (!config?.urgencyBanner || !config.urgencyText) return null;
  return (
    <div className="ag-tone-red ag-urgency" role="note">
      {config.urgencyText}
    </div>
  );
}
