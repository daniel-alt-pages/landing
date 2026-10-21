'use client';

import type { CourseRecentSession } from '../../../types/courseTypes';
import { vacacionalEventCardTheme } from '../../../lib/courseVacacionalEventArea';
import { formatMinutesAsDuration, statusLabel } from '../../../lib/courseMeetAttendance';
import { CourseLiveCountdownRow } from '../../../components/CourseLiveCountdown';

type HistorialSessionClipProps = {
  session: CourseRecentSession;
  dark: boolean;
};

function formatShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(y, m - 1, d));
}

function statusDotClass(status: CourseRecentSession['status'], dark: boolean): string {
  switch (status) {
    case 'present':
      return dark ? 'bg-emerald-400' : 'bg-emerald-500';
    case 'partial':
      return dark ? 'bg-amber-400' : 'bg-amber-500';
    case 'upcoming':
    case 'live-soon':
      return dark ? 'bg-violet-400' : 'bg-violet-500';
    default:
      return dark ? 'bg-rose-400' : 'bg-rose-500';
  }
}

export default function HistorialSessionClip({ session, dark }: HistorialSessionClipProps) {
  const topic = session.topic || 'Clase en vivo';
  const theme = vacacionalEventCardTheme(topic, dark);
  const isUpcoming = session.status === 'upcoming' || session.status === 'live-soon';
  const durationLabel =
    !isUpcoming &&
    (session.durationLabel ||
      (session.minutes ? formatMinutesAsDuration(session.minutes) : null));

  return (
    <li
      className="inline-flex min-w-full flex-col gap-1 rounded-xl border px-3 py-2.5 sm:min-w-[calc(50%-0.25rem)] sm:flex-1 sm:basis-[calc(50%-0.25rem)] lg:basis-[calc(33.333%-0.34rem)]"
      style={theme.cardStyle}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${statusDotClass(session.status, dark)}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p
            className="line-clamp-2 text-[11px] font-bold leading-snug"
            style={{ color: theme.titleColor }}
          >
            {topic}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-[var(--course-text-muted)]">
            {formatShortDate(session.date)}
            {durationLabel ? ` · ${durationLabel}` : ''}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
            dark ? 'bg-black/25 text-white/90' : 'bg-white/80 text-[var(--course-text)]'
          }`}
        >
          {statusLabel(session.status)}
        </span>
      </div>
      {isUpcoming && session.startsAtIso ? (
        <div className="pl-4 text-[10px] font-semibold tabular-nums text-[var(--course-text)]">
          <CourseLiveCountdownRow
            compact
            target={{
              id: session.sessionId || session.date,
              topic,
              startsAtIso: session.startsAtIso,
              status:
                session.status === 'upcoming' || session.status === 'live-soon'
                  ? session.status
                  : undefined,
            }}
          />
        </div>
      ) : null}
    </li>
  );
}
