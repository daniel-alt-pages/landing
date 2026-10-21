'use client';

import RecordingsCatalogListItem from '@features/recordings/components/RecordingsCatalogListItem';
import type { CourseCalendarEventDto } from '@features/curso/lib/courseCalendarTypes';
import {
  resolveRecordingEventDate,
  resolveRecordingSessionTitle,
  type RecordingGeminiNote,
} from '@features/curso/lib/courseRecordingGeminiNotes';
import type { RecordingsCatalogMode } from '@features/recordings/lib/recordingsCatalog';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';

type RecordingsMobileFeedProps = {
  recordings: SimRecording[];
  activeId: string | undefined;
  simulationId: string;
  variant: 'light' | 'dark';
  catalogMode: RecordingsCatalogMode;
  isCourseCatalog: boolean;
  isDark: boolean;
  onSelect: (id: string) => void;
  isRecordingFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  isWatched?: (id: string) => boolean;
  calendarEvents?: CourseCalendarEventDto[];
  geminiNotesIndex?: Map<string, RecordingGeminiNote>;
  listTitle?: string;
};

export default function RecordingsMobileFeed({
  recordings,
  activeId,
  simulationId,
  variant,
  catalogMode,
  isCourseCatalog,
  isDark,
  onSelect,
  isRecordingFavorite,
  onToggleFavorite,
  isWatched,
  calendarEvents = [],
  geminiNotesIndex = new Map(),
  listTitle,
}: RecordingsMobileFeedProps) {
  const feedItems = recordings.filter((r) => r.id !== activeId);

  if (!feedItems.length) return null;

  return (
    <section className="xl:hidden" aria-label="Videos relacionados">
      <h2 className="mb-3 text-base font-semibold text-[var(--course-text)]">
        {listTitle?.trim() || 'Videos relacionados'}
      </h2>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {feedItems.map((rec) => {
          const sessionTitle = isCourseCatalog
            ? resolveRecordingSessionTitle(rec, geminiNotesIndex, calendarEvents)
            : null;
          const eventDate = isCourseCatalog
            ? resolveRecordingEventDate(rec, calendarEvents)
            : null;

          return (
            <li key={rec.id}>
              <RecordingsCatalogListItem
                recording={rec}
                simulationId={simulationId}
                selected={rec.id === activeId}
                variant={variant}
                catalogMode={catalogMode}
                density="grid"
                onSelect={() => onSelect(rec.id)}
                isFavorite={isCourseCatalog ? isRecordingFavorite?.(rec.id) : undefined}
                onToggleFavorite={
                  isCourseCatalog && onToggleFavorite
                    ? () => onToggleFavorite(rec.id)
                    : undefined
                }
                progressStatus={isCourseCatalog && isWatched?.(rec.id) ? 'watched' : null}
                sessionTitle={sessionTitle}
                eventDate={eventDate}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
