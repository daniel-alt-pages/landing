'use client';

import { useEffect, useState } from 'react';

/** Tick cada segundo para contadores en vivo (segundos visibles). */
export function useSecondTick(active = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  return now;
}
