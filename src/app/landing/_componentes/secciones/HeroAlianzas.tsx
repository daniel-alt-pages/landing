'use client';

import { useEffect, useState } from 'react';
import { ALIANZAS_URL } from '../../_contenido/sitio';

/**
 * Pantalla de alianzas publicada (alianzas-react, solo lectura, única fuente).
 * - El póster estático (captura de la página publicada) es el LCP: carga con prioridad.
 * - Desde 768 px, el iframe en vivo se monta después de `load` encima del póster.
 * - En móvil no se monta el iframe (evita scroll anidado y ~240 KB de JS): póster + enlace.
 */
export function HeroAlianzas() {
  const [live, setLive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!window.matchMedia('(min-width: 768px)').matches) return undefined;
    const mount = () => setLive(true);
    if (document.readyState === 'complete') {
      const t = window.setTimeout(mount, 600);
      return () => window.clearTimeout(t);
    }
    window.addEventListener('load', mount, { once: true });
    return () => window.removeEventListener('load', mount);
  }, []);
  return (
    <figure id="alianzas" className="ag-hero-alianzas" aria-labelledby="alianzas-titulo">
      <figcaption className="ag-hero-alianzas-head">
        <h2 id="alianzas-titulo">Alianzas en curso</h2>
        <a className="ag-text-link" href={ALIANZAS_URL} target="_blank" rel="noopener noreferrer">
          Abrir en otra pestaña
        </a>
      </figcaption>
      <div className="ag-hero-alianzas-frame">
        <a href={ALIANZAS_URL} target="_blank" rel="noopener noreferrer" className="ag-hero-alianzas-poster" tabIndex={live ? -1 : 0}>
          <img
            src="/landing/hero/alianzas-poster-640.webp"
            srcSet="/landing/hero/alianzas-poster-640.webp 640w, /landing/hero/alianzas-poster-1280.webp 1280w"
            sizes="(min-width: 1024px) 600px, 100vw"
            width={1280}
            height={1240}
            fetchPriority="high"
            alt="Pantalla de alianzas de SEAMOSGENIOS: PreICFES Gratuito Jóvenes Bogotá, Soacha y Casanare."
          />
        </a>
        {live ? (
          <iframe
            src={ALIANZAS_URL}
            title="Alianzas de SEAMOSGENIOS: Universidad Distrital, Bogotá, Casanare, Soacha y PreICFES Gratuito Jóvenes Bogotá"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-popups"
            className={loaded ? 'is-loaded' : undefined}
            onLoad={() => setLoaded(true)}
          />
        ) : null}
      </div>
    </figure>
  );
}
