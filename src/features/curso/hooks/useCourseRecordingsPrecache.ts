'use client';

import { useEffect, useRef } from 'react';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';
import { startRecordingsPrecacheFromCatalog } from '@features/recordings/lib/recordingsPrecache/queue';
import { ensureRecordingsPrecacheGeneration } from '@features/recordings/lib/recordingsPrecache/reset';

/** Precarga SW + Drive usando el catálogo ya cargado del curso (sin fetch extra). */
export function useCourseRecordingsPrecache(
  courseId: string | null | undefined,
  recordings: SimRecording[],
  catalogVersion?: string,
): void {
  const startedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!courseId || !recordings.length) return;
    const signature = `${courseId}:${recordings.length}:${catalogVersion ?? ''}`;
    if (startedRef.current === signature) return;
    startedRef.current = signature;

    let cancelled = false;

    const startDelay = window.setTimeout(() => {
      void (async () => {
        const generationReset = await ensureRecordingsPrecacheGeneration();
        if (cancelled) return;
        startRecordingsPrecacheFromCatalog(
          courseId,
          catalogVersion ?? courseId,
          recordings,
          generationReset,
        );
      })();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(startDelay);
    };
  }, [courseId, recordings, catalogVersion]);
}
