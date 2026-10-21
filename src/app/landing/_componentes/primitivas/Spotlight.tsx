'use client';

import type { ReactNode } from 'react';

/** Tarjeta con un halo que sigue el cursor. En táctil no hace nada extra. */
export function Spotlight({ children, className = '', dark = false }: { children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <article
      className={`ag-card ag-spotlight${dark ? ' ag-card-dark' : ''} ${className}`}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--ag-x', `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty('--ag-y', `${event.clientY - rect.top}px`);
      }}
    >
      {children}
    </article>
  );
}
