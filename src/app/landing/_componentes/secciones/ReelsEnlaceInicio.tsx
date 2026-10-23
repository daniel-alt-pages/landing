'use client';

import { useEffect } from 'react';

/** /landing/#video=slug (enlace para compartir) → el visor vive en /landing/resultados/: reenviar conservando el hash. */
export function ReelsEnlaceInicio() {
  useEffect(() => {
    const go = () => {
      if (/^#video=[a-z0-9-]+$/.test(window.location.hash)) window.location.replace(`/landing/resultados/${window.location.hash}`);
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, []);
  return null;
}
