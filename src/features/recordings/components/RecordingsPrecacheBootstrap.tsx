'use client';

import { useRecordingsPrecacheBootstrap } from '@features/recordings/hooks/useRecordingsPrecacheBootstrap';

/** Sin UI — registra SW y encola precarga de catálogo + videos. */
export default function RecordingsPrecacheBootstrap({
  simulationId,
}: {
  simulationId: string | null | undefined;
}) {
  useRecordingsPrecacheBootstrap(simulationId);
  return null;
}
