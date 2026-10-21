'use client';

import { useEffect, useState } from 'react';

/** true después de `delayMs` mientras `active` sigue en true. */
export function useSlowLoadHint(active: boolean, delayMs = 12_000): boolean {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) {
      setSlow(false);
      return;
    }
    const t = window.setTimeout(() => setSlow(true), delayMs);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [active, delayMs]);

  return slow;
}
