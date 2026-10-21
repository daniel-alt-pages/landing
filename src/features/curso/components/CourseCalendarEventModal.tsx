'use client';

import { X, Video, Film, FolderOpen, Clock, Calendar } from 'lucide-react';
import type { CourseCalendarEventDto } from '../lib/courseCalendarTypes';
import {
  formatVacacionalEventClockBogota,
  isVacacionalEventEnded,
  isVacacionalMeetJoinable,
  vacacionalClassPhase,
  vacacionalEventStartDate,
  vacacionalEventEndDate,
  formatCountdownToClassStart,
  getCountdownToClassStartParts,
} from '../lib/courseVacacionalEventTime';
import { countVacacionalRecordings, resolveVacacionalRecordingCatalogId } from '../lib/courseVacacionalRecordings';
import type { CourseRecording } from '../types/courseTypes';
import VacacionalCountdownFlip from './VacacionalCountdownFlip';
import CoursePanelModalShell from './CoursePanelModalShell';

const BOGOTA = 'America/Bogota';

type CourseCalendarEventModalProps = {
  open: boolean;
  event: CourseCalendarEventDto | null;
  now: number;
  allEvents?: CourseCalendarEventDto[];
  mergedCatalog?: CourseRecording[];
  onClose: () => void;
  onOpenGrabaciones?: (recordingId?: string) => void;
};

function formatFullDate(date: Date): string {
  return date.toLocaleString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BOGOTA,
  });
}

function durationLabel(start: Date, end: Date): string {
  const mins = Math.round((end.getTime() - start.getTime()) / 60_000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export default function CourseCalendarEventModal({
  open,
  event,
  now,
  allEvents = [],
  mergedCatalog = [],
  onClose,
  onOpenGrabaciones,
}: CourseCalendarEventModalProps) {
  if (!event) return null;

  const start = vacacionalEventStartDate(event);
  const end = vacacionalEventEndDate(event);
  const phase = vacacionalClassPhase(event, now);
  const isLive = phase === 'live' || phase === 'starting-soon';
  const isEnded = isVacacionalEventEnded(event, now);
  const meetJoinable = isVacacionalMeetJoinable(event, now, allEvents);
  const recordingCount = countVacacionalRecordings(event);
  const recordingId = resolveVacacionalRecordingCatalogId(event, mergedCatalog);
  const countdownParts = start && phase === 'upcoming' ? getCountdownToClassStartParts(start, now) : null;

  const phaseBadge = isLive
    ? { label: 'En vivo', cls: 'bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/40' }
    : isEnded
    ? { label: 'Finalizada', cls: 'bg-white/10 text-white/60 ring-1 ring-white/15' }
    : { label: 'Programada', cls: 'bg-indigo-400/20 text-indigo-200 ring-1 ring-indigo-400/35' };

  return (
    <CoursePanelModalShell
      open={open}
      onClose={onClose}
      ariaLabel={event.summary || 'Detalle de clase'}
      zIndexClass="z-[200]"
      backdropClassName="bg-black/60 backdrop-blur-sm"
      panelClassName="flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden rounded-none border border-white/10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-2xl sm:mx-4 sm:h-auto sm:max-h-[90dvh] sm:rounded-3xl"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${phaseBadge.cls}`}>
              {phaseBadge.label}
            </span>
            <h2 className="mt-2 text-lg font-black leading-snug text-white">
              {event.summary || 'Clase programada'}
            </h2>
          </div>

          {start ? (
            <div className="flex items-start gap-3 rounded-xl bg-white/5 px-3 py-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-semibold capitalize text-white/90">
                  {formatFullDate(start)}
                </p>
                {end ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/55">
                    <Clock className="h-3 w-3" aria-hidden />
                    {formatVacacionalEventClockBogota(start)} – {formatVacacionalEventClockBogota(end)}
                    {' · '}
                    {durationLabel(start, end)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {event.description ? (
            <p className="rounded-xl bg-white/5 px-3 py-2.5 text-xs leading-relaxed text-white/75">
              {event.description}
            </p>
          ) : null}

          {countdownParts ? (
            <div className="rounded-xl bg-indigo-500/10 px-3 py-3">
              <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                Tiempo restante
              </p>
              <VacacionalCountdownFlip parts={countdownParts} prefix="" />
            </div>
          ) : isLive ? (
            <div className="rounded-xl bg-emerald-500/10 px-3 py-2.5 text-center text-sm font-bold text-emerald-300">
              ● Esta clase está en curso ahora
            </div>
          ) : isEnded ? (
            <div className="rounded-xl bg-white/5 px-3 py-2.5 text-center text-xs text-white/50">
              Esta reunión ya finalizó
            </div>
          ) : null}

          <div className="space-y-2">
            {meetJoinable && event.hangoutLink ? (
              <a
                href={event.hangoutLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 text-sm font-bold text-white transition hover:brightness-110"
              >
                <Video className="h-4 w-4" aria-hidden />
                Unirme a la clase
              </a>
            ) : event.hangoutLink && !isEnded ? (
              <div className="flex min-h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white/40">
                <Video className="h-3.5 w-3.5" aria-hidden />
                Meet disponible el día de la clase
              </div>
            ) : null}

            {recordingCount > 0 && onOpenGrabaciones ? (
              <button
                type="button"
                onClick={() => { onClose(); onOpenGrabaciones(recordingId); }}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              >
                <Film className="h-3.5 w-3.5" aria-hidden />
                {recordingCount === 1 ? 'Ver grabación' : `${recordingCount} grabaciones`}
              </button>
            ) : null}

            {event.attachments?.length ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  Archivos adjuntos
                </p>
                {event.attachments.map((att) => (
                  <a
                    key={att.url}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-9 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{att.title || 'Archivo adjunto'}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
    </CoursePanelModalShell>
  );
}
