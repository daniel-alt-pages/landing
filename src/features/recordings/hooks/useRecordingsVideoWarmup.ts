'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';

const STAGGER_MS = 350;

function scheduleIdle(fn: () => void): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(fn, { timeout: 1200 });
  } else {
    setTimeout(fn, 16);
  }
}

/**
 * Precarga iframes de Drive en segundo plano: activo primero, resto en cola escalonada.
 * Hover en catálogo prioriza esa grabación.
 */
export function useRecordingsVideoWarmup(recordings: SimRecording[], activeId: string) {
  const [warmedIds, setWarmedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (activeId) initial.add(activeId);
    return initial;
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markWarmed = useCallback((id: string) => {
    if (!id) return;
    setWarmedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const prioritize = useCallback(
    (id: string) => {
      markWarmed(id);
    },
    [markWarmed],
  );

  useEffect(() => {
    markWarmed(activeId);
  }, [activeId, markWarmed]);

  useEffect(() => {
    if (!recordings.length) return;

    const pending = recordings.map((r) => r.id);
    let cancelled = false;
    let index = 0;

    const loadNext = () => {
      if (cancelled || index >= pending.length) return;
      markWarmed(pending[index]);
      index += 1;
      timerRef.current = setTimeout(() => scheduleIdle(loadNext), STAGGER_MS);
    };

    scheduleIdle(loadNext);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [recordings, markWarmed]);

  const isWarmed = useCallback((id: string) => warmedIds.has(id), [warmedIds]);
  const warmupProgress = recordings.length
    ? Math.round((warmedIds.size / recordings.length) * 100)
    : 0;
  const isFullyWarmed = recordings.length > 0 && warmedIds.size >= recordings.length;

  return { warmedIds, isWarmed, prioritize, warmupProgress, isFullyWarmed };
}
