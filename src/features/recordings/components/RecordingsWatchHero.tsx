'use client';

import { Share2, Star } from 'lucide-react';
import RecordingsPlayerStage from '@features/recordings/components/RecordingsPlayerStage';
import { recordingPlayerClasses } from '@features/recordings/lib/recordingPlayerClasses';
import {
  recordingCourseCardHeadline,
  recordingCourseCardSubtitle,
  type RecordingsCatalogMode,
} from '@features/recordings/lib/recordingsCatalog';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';

type RecordingsWatchHeroProps = {
  active: SimRecording;
  catalogRecordings: SimRecording[];
  simulationId: string;
  variant: 'light' | 'dark';
  catalogMode: RecordingsCatalogMode;
  isCourseCatalog: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  supportUrl?: string | null;
  sessionTitle?: string | null;
  eventDate?: string | null;
  playbackSessionKey?: string;
  autoPictureInPicture?: boolean;
  sectionInactive?: boolean;
};

export default function RecordingsWatchHero({
  active,
  catalogRecordings,
  simulationId,
  variant,
  catalogMode,
  isCourseCatalog,
  isFavorite = false,
  onToggleFavorite,
  supportUrl,
  sessionTitle = null,
  eventDate = null,
  playbackSessionKey,
  autoPictureInPicture = false,
  sectionInactive = false,
}: RecordingsWatchHeroProps) {
  const title = isCourseCatalog
    ? recordingCourseCardHeadline(active, sessionTitle)
    : active.title;
  const subtitle = isCourseCatalog
    ? recordingCourseCardSubtitle(active, sessionTitle, eventDate)
    : '';

  return (
    <div className="min-w-0">
      <div className="overflow-hidden rounded-xl">
        <RecordingsPlayerStage
          recordings={catalogRecordings}
          activeId={active.id}
          simulationId={simulationId}
          variant={variant}
          catalogMode={catalogMode}
          playbackSessionKey={playbackSessionKey}
          autoPlayOnSelect={isCourseCatalog}
          autoPictureInPicture={autoPictureInPicture}
          sectionInactive={sectionInactive}
        />
      </div>

      <div className="mt-3 space-y-3 px-0.5 sm:mt-4">
        <h1 className="text-lg font-semibold uppercase leading-snug tracking-tight text-[var(--course-text)] sm:text-xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="text-sm text-[var(--course-text-muted)]">{subtitle}</p>
        ) : null}

        {isCourseCatalog && (onToggleFavorite || supportUrl) ? (
          <div
            className={`${recordingPlayerClasses.heroActions} flex flex-wrap items-center gap-1 border-y border-[var(--course-border)] py-1 sm:gap-2 sm:py-2`}
          >
            {onToggleFavorite ? (
              <button
                type="button"
                onClick={onToggleFavorite}
                className={`inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition sm:min-h-9 sm:px-3 ${
                  isFavorite
                    ? 'bg-[var(--course-accent-soft)] text-[var(--course-accent)]'
                    : 'text-[var(--course-text)] hover:bg-[var(--course-surface-muted)]'
                }`}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? 'Quitar de guardados' : 'Guardar clase'}
              >
                <Star
                  className={`h-[18px] w-[18px] sm:h-5 sm:w-5 ${isFavorite ? 'fill-current text-amber-500' : ''}`}
                  aria-hidden
                />
                <span className="hidden sm:inline">{isFavorite ? 'Guardado' : 'Guardar'}</span>
              </button>
            ) : null}
            {supportUrl ? (
              <a
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--course-text)] transition hover:bg-[var(--course-surface-muted)] sm:min-h-9 sm:px-3"
              >
                <Share2 className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden />
                <span className="hidden sm:inline">Soporte</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
