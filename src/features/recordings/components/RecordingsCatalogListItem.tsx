'use client';

import RecordingCoverArt from '@features/recordings/components/RecordingCoverArt';
import {
  formatRecordingDate,
  recordingListHeadline,
  recordingListSubtitle,
  type RecordingsCatalogMode,
} from '@features/recordings/lib/recordingsCatalog';
import { catalogListItemClass, areaAccent } from '@features/recordings/lib/recordingsTheme';
import { sgSessionSelectedStyle } from '@shared/lib/sgAreaColors';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';
import { Check, Star } from 'lucide-react';

export type RecordingsListItemDensity = 'default' | 'compact' | 'grid';

type RecordingsCatalogListItemProps = {
  recording: SimRecording;
  simulationId: string;
  selected: boolean;
  variant: 'light' | 'dark';
  catalogMode?: RecordingsCatalogMode;
  density?: RecordingsListItemDensity;
  onSelect: () => void;
  onWarm?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  progressStatus?: 'watched' | 'in-progress' | null;
  sessionTitle?: string | null;
  eventDate?: string | null;
  showAreaBadge?: boolean;
};

export default function RecordingsCatalogListItem({
  recording,
  simulationId,
  selected,
  variant,
  catalogMode = 'simulation',
  density = 'default',
  onSelect,
  onWarm,
  isFavorite = false,
  onToggleFavorite,
  progressStatus = null,
  sessionTitle = null,
  eventDate = null,
  showAreaBadge = false,
}: RecordingsCatalogListItemProps) {
  const isDark = variant === 'dark';
  const isCourse = catalogMode === 'course';
  const textTitle = isCourse ? 'text-[var(--course-text)]' : isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isCourse ? 'text-[var(--course-text-muted)]' : isDark ? 'text-white/45' : 'text-slate-500';
  const textBody = isCourse ? 'text-[var(--course-text-muted)]' : isDark ? 'text-white/60' : 'text-slate-600';
  const textMeta = isCourse ? 'text-[var(--course-text-muted)]' : isDark ? 'text-white/35' : 'text-slate-400';
  const thumbBorder = isCourse ? 'border-[var(--course-border)]' : isDark ? 'border-white/10' : 'border-slate-200/90';
  const thumbBorderCompact = isCourse ? 'border-[var(--course-border)]' : isDark ? 'border-white/10' : 'border-slate-200/80';
  const accent = areaAccent(recording.area);
  const headline = recordingListHeadline(recording, catalogMode, sessionTitle);
  const subtitle = recordingListSubtitle(recording, catalogMode, sessionTitle, eventDate);
  const dateLine = formatRecordingDate(eventDate ?? recording.recordedAt);
  const coverRecording =
    eventDate && eventDate !== recording.recordedAt
      ? { ...recording, recordedAt: eventDate }
      : recording;

  const progressBadge =
    progressStatus === 'watched' ? (
      <span className="absolute bottom-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-3 w-3" aria-hidden />
      </span>
    ) : progressStatus === 'in-progress' ? (
      <span className="absolute bottom-1 right-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-amber-950">
        En curso
      </span>
    ) : null;

  if (density === 'grid') {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={onSelect}
          onMouseEnter={onWarm}
          onFocus={onWarm}
          className={`group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 rounded-xl ${
            selected ? 'ring-2 ring-violet-400 ring-offset-2' : ''
          }`}
          aria-current={selected ? 'true' : undefined}
          aria-label={`${headline}, ${subtitle}`}
        >
          <div className={`relative aspect-video w-full overflow-hidden rounded-xl border ${thumbBorder}`}>
            <RecordingCoverArt
              key={recording.id}
              recording={coverRecording}
              variant="thumb"
              catalogMode={catalogMode}
              className="rounded-none"
            />
            {progressBadge}
          </div>
          <p className={`mt-2 line-clamp-2 text-xs font-semibold uppercase leading-snug tracking-tight ${textTitle}`}>
            {headline}
          </p>
          <p className={`mt-0.5 line-clamp-2 text-[10px] ${textMuted}`}>
            {subtitle}
          </p>
        </button>
        {onToggleFavorite ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
              isCourse
                ? 'border-[var(--course-border)] bg-[var(--course-surface)]/95 hover:bg-[var(--course-surface-muted)]'
                : isDark
                  ? 'border-white/10 bg-black/50 hover:bg-black/70'
                  : 'border-slate-200/80 bg-white/95 hover:bg-white'
            }`}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            aria-pressed={isFavorite}
          >
            <Star
              className={`h-3.5 w-3.5 ${isFavorite ? 'fill-amber-400 text-amber-400' : isDark ? 'text-white/80' : 'text-slate-500'}`}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
    );
  }

  const isCompact = density === 'compact';
  const thumbClass = isCompact
    ? 'relative h-[56px] w-[100px] shrink-0 overflow-hidden rounded-lg border [container-type:inline-size]'
    : 'relative h-[72px] w-[128px] shrink-0 overflow-hidden rounded-lg border [container-type:inline-size]';
  const itemPadding = isCompact ? 'gap-2 rounded-lg p-1.5' : 'gap-3 p-2.5';
  const youtubeFlat = isCompact && showAreaBadge;
  const courseListItemClass = (sel: boolean) => {
    const base =
      'flex w-full items-center text-left transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--course-accent)]/40';
    if (youtubeFlat) {
      return `${base} rounded-lg border border-transparent p-1 hover:bg-[var(--course-surface-muted)] ${
        sel ? 'bg-[var(--course-surface-muted)]' : ''
      }`;
    }
    if (sel) {
      return `${base} rounded-xl border ring-1 ring-[var(--course-border-strong)] text-[var(--course-text)]`;
    }
    return `${base} rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] text-[var(--course-text)] hover:border-[var(--course-border-strong)] hover:bg-[var(--course-surface-muted)]`;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={onWarm}
        onFocus={onWarm}
        className={`${isCourse ? courseListItemClass(selected) : catalogListItemClass(variant, selected)} w-full ${youtubeFlat ? 'gap-2' : itemPadding}`}
        style={selected && !youtubeFlat ? sgSessionSelectedStyle(accent.hex, isDark) : undefined}
        aria-current={selected ? 'true' : undefined}
        aria-label={`${headline}, ${subtitle}`}
      >
        <div className={`${thumbClass} ${thumbBorderCompact}`}>
          <RecordingCoverArt
            key={recording.id}
            recording={coverRecording}
            variant="thumb"
            catalogMode={catalogMode}
            className="rounded-none"
          />
          {progressBadge}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p
            className={`${isCompact ? (youtubeFlat ? 'line-clamp-2 text-[13px] font-semibold normal-case' : 'line-clamp-2 text-xs font-bold') : 'truncate text-sm font-bold'} leading-snug ${textTitle}`}
          >
            {headline}
          </p>
          {!isCompact ? (
            <p className={`mt-0.5 line-clamp-2 text-xs leading-relaxed ${textBody}`}>
              {subtitle}
            </p>
          ) : (
            <p className={`mt-0.5 line-clamp-1 text-[10px] ${textMuted}`}>
              {showAreaBadge ? (
                <span
                  className="mr-1 inline-block rounded px-1 py-px text-[9px] font-bold uppercase tracking-wide"
                  style={{
                    color: accent.hex,
                    backgroundColor: `${accent.hex}14`,
                  }}
                >
                  {accent.short}
                </span>
              ) : null}
              {subtitle}
              {dateLine ? ` · ${dateLine}` : ''}
            </p>
          )}
          {!isCompact ? (
            <p className={`mt-1.5 truncate text-[11px] font-medium ${textMeta}`}>
              {simulationId}
              {dateLine ? ` · ${dateLine}` : ''}
            </p>
          ) : null}
        </div>
      </button>
      {onToggleFavorite && !isCompact ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
            isDark
              ? 'border-white/10 bg-black/40 hover:bg-black/60'
              : 'border-slate-200 bg-white/90 hover:bg-white'
          }`}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={isFavorite}
        >
          <Star
            className={`h-4 w-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : isDark ? 'text-white/70' : 'text-slate-400'}`}
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );
}
