'use client';

import { useEffect, useRef, useState } from 'react';
import { ALIANZAS_URL } from '../../_contenido/sitio';

/**
 * Pantalla de alianzas publicada (alianzas-react, solo lectura, única fuente).
 * - Póster estático (captura de la página publicada) primero; ya no está en el hero, carga diferida.
 * - Desde 768 px, el iframe en vivo se monta después de `load` encima del póster.
 * - En móvil no se monta el iframe (evita scroll anidado y ~240 KB de JS): póster + enlace.
 */
export function HeroAlianzas() {
  const [live, setLive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [alto, setAlto] = useState<number | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Mismo origen (daniel-alt-pages.github.io): el iframe toma la altura de su contenido, sin scroll interno.
  // Si no se puede leer el documento (otro origen, p. ej. en local), queda la altura fija del CSS.
  useEffect(() => {
    if (!loaded) return undefined;
    let doc: Document | null = null;
    try {
      doc = frameRef.current?.contentDocument ?? null;
    } catch {
      doc = null;
    }
    if (!doc?.body) return undefined;
    const root = doc.getElementById('root') ?? doc.body;
    const medir = () => {
      const h = Math.ceil(root.scrollHeight);
      if (h > 0) setAlto((prev) => (prev === h ? prev : h));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(root);
    const t = window.setInterval(medir, 1000);
    return () => {
      ro.disconnect();
      window.clearInterval(t);
    };
  }, [loaded]);
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
    <figure className="ag-hero-alianzas" aria-label="Alianzas de SEAMOSGENIOS">
      <figcaption className="ag-hero-alianzas-head">
        <a className="ag-text-link" href={ALIANZAS_URL} target="_blank" rel="noopener noreferrer">
          Abrir en otra pestaña
        </a>
      </figcaption>
      <div className="ag-hero-alianzas-frame" style={live && alto ? { height: alto } : undefined}>
        <a href={ALIANZAS_URL} target="_blank" rel="noopener noreferrer" className="ag-hero-alianzas-poster" tabIndex={live ? -1 : 0}>
          <img
            src="/landing/hero/alianzas-poster-640.webp"
            srcSet="/landing/hero/alianzas-poster-640.webp 640w, /landing/hero/alianzas-poster-1280.webp 1280w"
            sizes="(min-width: 1024px) 600px, 100vw"
            width={1280}
            height={1240}
            loading="lazy"
            decoding="async"
            alt="Pantalla de alianzas de SEAMOSGENIOS: PreICFES Gratuito Jóvenes Bogotá, Soacha y Casanare."
          />
        </a>
        {live ? (
          <iframe
            ref={frameRef}
            scrolling="no"
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
