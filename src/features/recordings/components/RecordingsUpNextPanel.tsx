'use client';

import type { ReactNode } from 'react';
import { PanelLeftClose } from 'lucide-react';
import RecordingsCatalogListItem from '@features/recordings/components/RecordingsCatalogListItem';
import { areaAccent } from '@features/recordings/lib/recordingsTheme';
import type { RecordingGroup, SimRecording } from '@features/recordings/lib/recordingsTypes';
import type { RecordingsCatalogMode } from '@features/recordings/lib/recordingsCatalog';
import type { CourseCalendarEventDto } from '@features/curso/lib/courseCalendarTypes';
import {
  resolveRecordingEventDate,
  resolveRecordingSessionTitle,
  type RecordingGeminiNote,
} from '@features/curso/lib/courseRecordingGeminiNotes';
type RecordingsUpNextPanelProps = {
  id?: string;
  groups: RecordingGroup[];
  flatRecordings?: SimRecording[];
  toolbar?: ReactNode;
  activeId: string | undefined;
  simulationId: string;
  variant: 'light' | 'dark';
  catalogMode: RecordingsCatalogMode;
  isCourseCatalog: boolean;
  isDark: boolean;
  sidebarCardClass: string;
  sidebarScrollClass: string;
  groupEyebrowClass: string;
  stickyTopClass: string;
  totalCount: number;
  onSelect: (id: string) => void;
  isRecordingFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  isWatched?: (id: string) => boolean;
  calendarEvents?: CourseCalendarEventDto[];
  geminiNotesIndex?: Map<string, RecordingGeminiNote>;
  onClose?: () => void;
  /** Título de lista curso (p. ej. «Clases oficiales» vs «Inducciones»). */
  listTitle?: string;
};

export default function RecordingsUpNextPanel({
  id = 'recordings-catalog-panel',
  groups,
  flatRecordings,
  toolbar,
  activeId,
  simulationId,
  variant,
  catalogMode,
  isCourseCatalog,
  isDark,
  sidebarCardClass,
  sidebarScrollClass,
  groupEyebrowClass,
  stickyTopClass,
  totalCount,
  onSelect,
  isRecordingFavorite,
  onToggleFavorite,
  isWatched,
  calendarEvents = [],
  geminiNotesIndex = new Map(),
  onClose,
  listTitle,
}: RecordingsUpNextPanelProps) {
  const useFlatList = isCourseCatalog && flatRecordings && flatRecordings.length > 0;
  const panelTitle =
    isCourseCatalog ? (listTitle?.trim() || 'Videos relacionados') : 'A continuación';

  const renderItem = (rec: SimRecording) => {
    const sessionTitle = isCourseCatalog
      ? resolveRecordingSessionTitle(rec, geminiNotesIndex, calendarEvents)
      : null;
    const eventDate = isCourseCatalog
      ? resolveRecordingEventDate(rec, calendarEvents)
      : null;

    return (
      <RecordingsCatalogListItem
        recording={rec}
        simulationId={simulationId}
        selected={rec.id === activeId}
        variant={variant}
        catalogMode={catalogMode}
        density="compact"
        onSelect={() => onSelect(rec.id)}
        isFavorite={isCourseCatalog ? isRecordingFavorite?.(rec.id) : undefined}
        onToggleFavorite={
          isCourseCatalog && onToggleFavorite ? () => onToggleFavorite(rec.id) : undefined
        }
        progressStatus={isCourseCatalog && isWatched?.(rec.id) ? 'watched' : null}
        sessionTitle={sessionTitle}
        eventDate={eventDate}
        showAreaBadge={useFlatList}
      />
    );
  };

  return (
    <aside
      id={id}
      className={`flex min-h-0 flex-col overflow-hidden ${stickyTopClass} ${sidebarCardClass}`}
    >
      <div className="shrink-0 space-y-3 border-b border-[var(--course-border)] p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className={`text-sm font-semibold text-[var(--course-text)]`}>{panelTitle}</h2>
            <p className="mt-0.5 text-[11px] text-[var(--course-text-muted)]">
              {totalCount} {totalCount === 1 ? 'video' : 'videos'}
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--course-border)] text-[var(--course-text-muted)] transition hover:bg-[var(--course-surface-muted)]"
              aria-label="Ocultar lista"
            >
              <PanelLeftClose className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
        {toolbar}
      </div>

      <div className={`sg-recordings-sidebar-scroll ${sidebarScrollClass}`}>
        {useFlatList ? (
          <ul className="space-y-0.5 p-2 sm:p-3">
            {flatRecordings.map((rec) => (
              <li key={rec.id}>{renderItem(rec)}</li>
            ))}
          </ul>
        ) : (
          <div className="space-y-4 p-2 sm:p-3">
            {groups.map((group) => {
              const accent = areaAccent(group.key);
              const Icon = accent.icon;
              return (
                <section key={group.key}>
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border"
                      style={{
                        backgroundColor: `${accent.hex}18`,
                        borderColor: `${accent.hex}35`,
                      }}
                    >
                      <Icon className="h-3 w-3" style={{ color: accent.hex }} aria-hidden />
                    </span>
                    <h3
                      className="truncate text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: isDark ? `${accent.hex}cc` : accent.hex }}
                    >
                      {group.label}
                    </h3>
                  </div>
                  <ul className="space-y-0.5">
                    {group.items.map((rec) => (
                      <li key={rec.id}>{renderItem(rec)}</li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
