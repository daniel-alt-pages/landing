'use client';

import { useEffect, useRef } from 'react';
import { fetchSimRecordingsCatalog } from '@features/recordings/lib/recordingsCatalog';
import { isPaidRecordingsContext } from '@features/recordings/lib/recordingsAccess';
import { startRecordingsPrecacheFromCatalog } from '@features/recordings/lib/recordingsPrecache/queue';
import { ensureRecordingsPrecacheGeneration } from '@features/recordings/lib/recordingsPrecache/reset';

/**
 * Primera carga del mes (30 días): purga caché viejo si cambió generación, precarga masiva Drive.
 */
export function useRecordingsPrecacheBootstrap(simulationId: string | null | undefined): void {
  const startedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!simulationId) return;
    if (!isPaidRecordingsContext()) return;
    if (startedRef.current === simulationId) return;
    startedRef.current = simulationId;

    let cancelled = false;

    const startDelay = window.setTimeout(() => {
      void (async () => {
        const generationReset = await ensureRecordingsPrecacheGeneration();
        if (cancelled) return;

        const catalog = await fetchSimRecordingsCatalog(simulationId);
        if (cancelled || !catalog?.recordings?.length) return;

        startRecordingsPrecacheFromCatalog(
          catalog.simulationId,
          catalog.updatedAt,
          catalog.recordings,
          generationReset,
        );
      })();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearTimeout(startDelay);
    };
  }, [simulationId]);
}
