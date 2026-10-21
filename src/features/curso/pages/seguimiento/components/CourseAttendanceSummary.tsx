'use client';

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  MinusCircle,
  Percent,
  UserCheck,
  XCircle,
} from 'lucide-react';
import SgEmptyState from '@shared/components/SgEmptyState';
import { SgSkeletonCard } from '@shared/components/SgSkeleton';
import SgCard from '@shared/components/SgCard';
import type { CourseAttendanceSummary as AttendanceStats, CourseRecentSession, CourseStudentMetrics } from '../../../types/courseTypes';
import { useCourseTheme } from '../../../hooks/useCourseTheme';
import { vacacionalEventCardTheme } from '../../../lib/courseVacacionalEventArea';
import {
  formatHoursLabel,
  formatMinutesAsDuration,
  statusLabel,
} from '../../../lib/courseMeetAttendance';
import CourseNextClassCountdown from '../../../components/CourseNextClassCountdown';
import { CourseLiveCountdownRow } from '../../../components/CourseLiveCountdown';
import { filterVacacionalLiveRecentSessions } from '../../../lib/courseVacacionalAttendance';
import { reconcileSessionForHistorial } from '../../../lib/courseAttendanceWeek';
import { compareSessionsHistorialDesc } from '../../../lib/courseSessionSort';
import HistorialSessionClip from './HistorialSessionClip';

export type CourseAttendanceSummaryProps = {
  metrics: CourseStudentMetrics | null;
  loading?: boolean;
  error?: string | null;
  studentName?: string;
  /** Solo lista de sesiones (pestaña Historial del panel seguimiento). */
  historyOnly?: boolean;
  dark?: boolean;
};

function resolveSessionStats(attendance: AttendanceStats) {
  const completed = attendance.sessionsCompleted ?? attendance.sessionsTotal;
  const upcoming = attendance.sessionsUpcoming ?? 0;
  const total =
    attendance.sessionsTotal > 0 ? attendance.sessionsTotal : completed + upcoming;
  return { completed, upcoming, total };
}

function formatDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, d));
}

function sessionStatusBadgeClass(status: CourseRecentSession['status'], dark: boolean): string {
  switch (status) {
    case 'present':
      return dark
        ? 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40'
        : 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-500/50';
    case 'partial':
      return dark
        ? 'bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40'
        : 'bg-amber-100 text-amber-950 ring-1 ring-amber-500/50';
    case 'upcoming':
    case 'live-soon':
      return dark
        ? 'bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/40'
        : 'bg-violet-100 text-violet-900 ring-1 ring-violet-500/45';
    default:
      return dark
        ? 'bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/35'
        : 'bg-rose-50 text-rose-900 ring-1 ring-rose-300/70';
  }
}

function AttendanceSessionCard({
  session,
  dark,
}: {
  session: CourseRecentSession;
  dark: boolean;
}) {
  const topic = session.topic || 'Clase en vivo';
  const theme = vacacionalEventCardTheme(topic, dark);
  const isUpcoming = session.status === 'upcoming' || session.status === 'live-soon';
  const timeLabel =
    !isUpcoming &&
    (session.durationLabel ||
      (session.minutes ? formatMinutesAsDuration(session.minutes) : '—'));

  return (
    <li
      className="flex flex-col gap-2.5 rounded-xl border p-2.5 sm:gap-3 sm:p-3"
      style={theme.cardStyle}
    >
      <div className="min-w-0">
        <p
          className="text-[11px] font-bold leading-snug sm:text-xs"
          style={{ color: theme.titleColor }}
        >
          {topic}
        </p>
        <p className="mt-1 text-[10px] font-semibold text-[var(--course-text)]/80 sm:text-[11px]">
          {formatDateLabel(session.date)}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] sm:grid-cols-4 sm:text-[11px]">
        <div className={isUpcoming ? 'col-span-2 sm:col-span-4' : undefined}>
          <dt className="font-semibold uppercase tracking-wide text-[var(--course-text-muted)]">
            {isUpcoming ? 'Cuenta regresiva' : 'Tiempo'}
          </dt>
          <dd className="mt-1 font-medium tabular-nums text-[var(--course-text)]">
            {isUpcoming && session.startsAtIso ? (
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
            ) : (
              timeLabel
            )}
          </dd>
        </div>
        {!isUpcoming ? (
          <>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-[var(--course-text-muted)]">
                Entrada
              </dt>
              <dd className="mt-0.5 font-medium tabular-nums text-[var(--course-text)]">
                {session.joinedAt || '—'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-[var(--course-text-muted)]">
                Salida
              </dt>
              <dd className="mt-0.5 font-medium tabular-nums text-[var(--course-text)]">
                {session.leftAt || '—'}
              </dd>
            </div>
          </>
        ) : null}
        <div className={`flex flex-col justify-end ${isUpcoming ? '' : ''}`}>
          <dt className="sr-only">Estado</dt>
          <dd>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-[11px] ${sessionStatusBadgeClass(session.status, dark)}`}
            >
              {statusLabel(session.status)}
            </span>
          </dd>
        </div>
      </dl>
    </li>
  );
}

function StatMini({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'warn' | 'muted' | 'accent';
}) {
  const toneClass = {
    default: 'text-[var(--course-text)]',
    success: 'text-emerald-500',
    warn: 'text-amber-500',
    muted: 'text-[var(--course-text-muted)]',
    accent: 'text-[var(--course-accent)]',
  }[tone];

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--course-border)]/80 bg-[var(--course-surface-muted)]/40 px-3 py-2">
      <Icon className={`h-4 w-4 shrink-0 ${toneClass}`} aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--course-text-muted)]">
          {label}
        </p>
        <p className={`text-lg font-black tabular-nums ${toneClass}`}>{value}</p>
      </div>
    </div>
  );
}

export default function CourseAttendanceSummary({
  metrics,
  loading,
  error,
  studentName,
  historyOnly = false,
  dark: darkProp,
}: CourseAttendanceSummaryProps) {
  const { dark: themeDark } = useCourseTheme();
  const dark = darkProp ?? themeDark;

  if (loading) {
    return <SgSkeletonCard lines={6} />;
  }

  if (!metrics) {
    return (
      <SgEmptyState
        icon={Percent}
        title={error ? 'No pudimos cargar tu asistencia' : 'Seguimiento pendiente'}
        message={
          error ||
          (studentName
            ? `Cuando publiquemos las listas de Meet, verás tus horas aquí cruzadas con "${studentName}".`
            : 'Tu asistencia se publicará aquí cuando el equipo procese los registros de Meet.')
        }
      />
    );
  }

  const { attendance, recentSessions, displayName } = metrics;
  const { completed, upcoming, total } = resolveSessionStats(attendance);
  const pct = Math.round((attendance.attendanceRate || 0) * 100);
  const attendedHoursLabel = formatHoursLabel(attendance.attendedHours);
  const totalHoursLabel = formatHoursLabel(attendance.totalHours);
  const remainingHours = Math.max(
    0,
    Math.round((attendance.totalHours - attendance.attendedHours) * 10) / 10,
  );
  const remainingHoursLabel = formatHoursLabel(remainingHours);
  const classProgressPct =
    completed > 0 ? Math.round((completed / Math.max(total, 1)) * 100) : 0;

  if (historyOnly) {
    const historialSessions = filterVacacionalLiveRecentSessions(
      recentSessions,
      metrics.courseId,
    )
      .map((session) => reconcileSessionForHistorial(session))
      .sort(compareSessionsHistorialDesc);

    if (!historialSessions.length) {
      return (
        <SgEmptyState
          icon={CalendarDays}
          title="Sin historial aún"
          message="Las clases dictadas aparecerán aquí con entrada, salida y estado."
        />
      );
    }
    return (
      <div className="space-y-3">
        <p className="text-xs text-[var(--course-text-muted)]">
          Calendario vacacional + registro Meet cuando exista.
        </p>
        <ul className="flex flex-wrap gap-2 p-0">
          {historialSessions.map((session) => (
            <HistorialSessionClip
              key={`${session.sessionId || session.date}-${session.topic}`}
              session={session}
              dark={dark}
            />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[var(--course-radius-lg)] border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-[var(--course-surface)] to-cyan-500/10 px-4 py-5 sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">
              <Activity className="h-3.5 w-3.5" aria-hidden />
              Panel de seguimiento
            </p>
            <h2 className="mt-1 text-xl font-black text-[var(--course-text)] sm:text-2xl">
              Tu progreso en vivo
            </h2>
            <p className="mt-1 text-xs text-[var(--course-text-muted)]">
              Datos del calendario vacacional · actualización automática en caché
              {displayName ? ` · ${displayName}` : ''}
            </p>
          </div>
          <div
            className="relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center sm:mx-0"
            role="img"
            aria-label={`${pct} por ciento de horas completadas`}
          >
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 120 120" aria-hidden>
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="var(--course-surface-muted)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#courseProgressGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0, Math.min(100, pct)) * 3.27} 999`}
              />
              <defs>
                <linearGradient id="courseProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--course-accent)" />
                  <stop offset="100%" stopColor="var(--course-accent-2)" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-xl font-black tabular-nums text-[var(--course-accent)]">
              {pct}%
            </span>
          </div>
        </div>
        <div
          className="relative mt-4 h-2 overflow-hidden rounded-full bg-[var(--course-surface-muted)]"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--course-accent)] to-[var(--course-accent-2)] transition-all duration-500"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SgCard
          padding="md"
          className="relative overflow-hidden border-[var(--course-border)] ring-1 ring-violet-500/10"
        >
          <div className="mb-3 flex items-center gap-2 text-[var(--course-accent)]">
            <Clock className="h-4 w-4" aria-hidden />
            <p className="text-xs font-semibold uppercase text-[var(--course-text-muted)]">
              Horas asistidas
            </p>
          </div>
          <p className="text-3xl font-black tabular-nums text-[var(--course-text)]">
            {attendedHoursLabel}
          </p>
          <p className="mt-1 text-xs text-[var(--course-text-muted)]">
            Meta {totalHoursLabel} · faltan {remainingHoursLabel}
          </p>
        </SgCard>

        <SgCard
          padding="md"
          className="relative overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent ring-1 ring-violet-500/15"
        >
          <div className="mb-3 flex items-center gap-2 text-violet-500">
            <CalendarDays className="h-4 w-4" aria-hidden />
            <p className="text-xs font-semibold uppercase text-[var(--course-text-muted)]">
              Clases vacacional
            </p>
          </div>
          <p className="text-3xl font-black tabular-nums text-[var(--course-text)]">
            {completed}
            <span className="text-xl font-bold text-[var(--course-text-muted)]">/{total}</span>
          </p>
          <p className="mt-1 text-xs text-[var(--course-text-muted)]">
            {completed} dictada{completed === 1 ? '' : 's'}
            {upcoming > 0
              ? ` · ${upcoming} programada${upcoming === 1 ? '' : 's'}`
              : ''}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-300">
            Asistidas: {attendance.sessionsAttended}/{completed || total}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--course-surface-muted)]">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-500"
              style={{ width: `${classProgressPct}%` }}
              role="progressbar"
              aria-valuenow={classProgressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Clases dictadas del total programado"
            />
          </div>
        </SgCard>

        <SgCard padding="md" className="ring-1 ring-[var(--course-accent)]/10">
          <div className="mb-3 flex items-center gap-2 text-[var(--course-accent)]">
            <UserCheck className="h-4 w-4" aria-hidden />
            <p className="text-xs font-semibold uppercase text-[var(--course-text-muted)]">
              Avance horas
            </p>
          </div>
          <p className="text-3xl font-black tabular-nums text-[var(--course-accent)]">{pct}%</p>
          <p className="mt-1 text-xs text-[var(--course-text-muted)]">
            Sobre {totalHoursLabel} del vacacional Meet
          </p>
        </SgCard>
      </div>

      {recentSessions?.length ? (
        <CourseNextClassCountdown sessions={recentSessions} />
      ) : null}

      {(attendance.sessionsPresent !== undefined ||
        attendance.sessionsPartial !== undefined) && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <StatMini
            icon={CheckCircle2}
            label="Presentes"
            value={attendance.sessionsPresent ?? 0}
            tone="success"
          />
          <StatMini
            icon={MinusCircle}
            label="Parciales"
            value={attendance.sessionsPartial ?? 0}
            tone="warn"
          />
          <StatMini
            icon={XCircle}
            label="Ausentes"
            value={attendance.sessionsAbsent ?? 0}
            tone="muted"
          />
          <StatMini
            icon={CalendarDays}
            label="Programadas"
            value={upcoming}
            tone="accent"
          />
        </div>
      )}

      {recentSessions?.length ? (
        <SgCard padding="none" className="overflow-hidden ring-1 ring-[var(--course-border)]">
          <div className="border-b border-[var(--course-border)] bg-[var(--course-surface-muted)]/30 px-4 py-4 sm:px-6">
            <h3 className="text-sm font-bold text-[var(--course-text)]">Historial vacacional</h3>
            <p className="mt-1 text-xs text-[var(--course-text-muted)]">
              Calendario ICS + asistencia Meet cuando exista registro.
            </p>
          </div>
          <ul className="flex flex-col gap-3 p-4 sm:gap-3 sm:p-6">
            {recentSessions.map((session) => (
              <AttendanceSessionCard
                key={`${session.sessionId || session.date}-${session.topic}`}
                session={session}
                dark={dark}
              />
            ))}
          </ul>
        </SgCard>
      ) : null}
    </div>
  );
}
