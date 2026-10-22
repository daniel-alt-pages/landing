'use client';

import { useState } from 'react';

const COLORS = ['#1e3a8a', '#7c2d12', '#065f46', '#5b21b6', '#9d174d', '#334155'];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || '?';
}

/** Avatar de 40 px, redondo. Con `src` muestra la foto (lazy); sin ella, iniciales sobre color. */
export function Avatar({ name, src, alt }: { name: string; src?: string; alt?: string }) {
  const [broken, setBroken] = useState(false);
  const color = COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length];
  if (src && !broken) {
    return <img className="ag-avatar" src={src} alt={alt ?? `Foto de perfil de ${name}`} width={40} height={40} loading="lazy" onError={() => setBroken(true)} />;
  }
  return <span className="ag-avatar is-initials" role="img" aria-label={alt ?? `Iniciales de ${name}`} style={{ background: color }}>{initials(name)}</span>;
}
