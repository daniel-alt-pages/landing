'use client';

import { useEffect, useState, type ReactNode } from 'react';

type CourseRecordingsKeepAliveProps = {
  active: boolean;
  children: ReactNode;
};

/**
 * Monta grabaciones tras la primera visita y las mantiene off-screen al cambiar pestaña
 * (evita display:none que pausa el video).
 */
export default function CourseRecordingsKeepAlive({
  active,
  children,
}: CourseRecordingsKeepAliveProps) {
  const [mounted, setMounted] = useState(active);

  useEffect(() => {
    if (active) setMounted(true);
  }, [active]);

  if (!mounted) return null;

  return (
    <div
      className={
        active
          ? 'min-w-0'
          : 'pointer-events-none fixed left-0 top-0 -z-10 h-px w-px overflow-hidden opacity-0'
      }
      aria-hidden={!active}
      inert={!active}
    >
      {children}
    </div>
  );
}
