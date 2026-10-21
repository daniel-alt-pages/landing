'use client';

import DriveVideoEmbed from '@features/recordings/components/DriveVideoEmbed';
import {
  formatRecordingDate,
  recordingDisplayTitle,
  recordingPlayerMetaPrimary,
  type RecordingsCatalogMode,
} from '@features/recordings/lib/recordingsCatalog';
import { areaAccent } from '@features/recordings/lib/recordingsTheme';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';

type RecordingsVideoPoolProps = {
  recording: SimRecording;
  variant?: 'light' | 'dark';
};

/** Un solo iframe: la grabación seleccionada. */
export default function RecordingsVideoPool({
  recording,
  variant = 'dark',
}: RecordingsVideoPoolProps) {
  const accent = areaAccent(recording.area);
  const title = recordingDisplayTitle(recording);

  return (
    <div className="relative aspect-video w-full">
      <DriveVideoEmbed
        key={recording.id}
        fileId={recording.driveFileId}
        title={title}
        variant={variant}
        accentHex={accent.hex}
        isActive
        loadPriority="high"
      />
    </div>
  );
}

export function RecordingPlayerMeta({
  recording,
  simulationId,
  isDark,
  catalogMode = 'simulation',
}: {
  recording: SimRecording;
  simulationId: string;
  isDark: boolean;
  catalogMode?: RecordingsCatalogMode;
}) {
  const primary = recordingPlayerMetaPrimary(recording, catalogMode);
  const dateLine = recording.recordedAt ? formatRecordingDate(recording.recordedAt) : '';

  return (
    <div className="min-w-0">
      <p className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {primary}
      </p>
      {(simulationId || dateLine) ? (
        <p className={`mt-0.5 truncate text-xs ${isDark ? 'text-white/45' : 'text-slate-500'}`}>
          {simulationId}
          {simulationId && dateLine ? ' · ' : ''}
          {dateLine}
        </p>
      ) : null}
    </div>
  );
}
