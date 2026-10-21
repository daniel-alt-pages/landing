'use client';

import { useState } from 'react';

/**
 * WCAG 2.2.2: un solo botón visible que pausa/reanuda todas las cintas (Marquee) del
 * contenedor indicado. Con prefers-reduced-motion las cintas ya no se mueven (CSS) y el botón se oculta.
 */
export function MarqueePause({ target, label }: { target: string; label: string }) {
  const [paused, setPaused] = useState(false);
  return (
    <button
      type="button"
      className="ag-marquee-pause"
      aria-controls={target}
      aria-pressed={paused}
      aria-label={paused ? `Reanudar el movimiento de ${label}` : `Pausar el movimiento de ${label}`}
      onClick={() => {
        const next = !paused;
        setPaused(next);
        document.getElementById(target)?.setAttribute('data-marquee-paused', next ? 'true' : 'false');
      }}
    >
      {paused ? 'Reanudar movimiento' : 'Pausar movimiento'}
    </button>
  );
}
