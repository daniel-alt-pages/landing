import { bogotaWeekMonday } from './courseVacacionalWeek';

const MIN_MINUTES_FOR_DAY_STREAK = 60;

function sessionQualifiesForDayStreak(session: {
  status?: string;
  minutes?: number;
}): boolean {
  const attended = session.status === 'present' || session.status === 'partial';
  if (!attended) return false;
  return (session.minutes || 0) >= MIN_MINUTES_FOR_DAY_STREAK;
}

const BOGOTA = 'America/Bogota';

export type CourseExcusaRecord = {
  id: string;
  emailLower: string;
  personKey?: string;
  displayName?: string;
  /** Día protegido (YYYY-MM-DD, Bogotá). */
  date: string;
  /** Lunes de la semana de la excusa. */
  weekStart: string;
  priorWeekAttendancePct?: number;
  motivo?: string;
  /** Solo salva racha; no suma minutos ni puntos. */
  streakProtectionOnly: true;
};

export type CourseExcusasManifest = {
  courseId: string;
  version: number;
  /** Máximo 1 excusa aprobada por estudiante por semana (weekStart). */
  maxPerWeek: number;
  excusas: CourseExcusaRecord[];
};

export type AttendanceStreakOptions = {
  excusaDates?: ReadonlySet<string>;
};

export function isSundayBogota(dateKey: string): boolean {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return false;
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: BOGOTA,
    weekday: 'short',
  }).format(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
  return weekday === 'Sun';
}

export function streakTrackableDate(dateKey: string): boolean {
  return Boolean(dateKey) && !isSundayBogota(dateKey);
}

export function resolveExcusaWeekStart(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return bogotaWeekMonday(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
}

export function buildExcusaDatesForEmail(
  manifest: CourseExcusasManifest | null | undefined,
  emailLower?: string,
): Set<string> {
  const dates = new Set<string>();
  const email = (emailLower || '').trim().toLowerCase();
  if (!email || !manifest?.excusas?.length) return dates;
  for (const record of manifest.excusas) {
    if (record.emailLower === email && record.date) dates.add(record.date);
  }
  return dates;
}

export function buildExcusaDatesByEmail(
  manifest: CourseExcusasManifest | null | undefined,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  if (!manifest?.excusas?.length) return map;
  for (const record of manifest.excusas) {
    const email = record.emailLower;
    if (!email || !record.date) continue;
    const bucket = map.get(email) || new Set<string>();
    bucket.add(record.date);
    map.set(email, bucket);
  }
  return map;
}

/** Día perfecto para racha: sesiones reales ≥60 min/clase o excusa aprobada ese día. */
export function dayIsPerfectForStreak(
  daySessions: { status?: string; minutes?: number }[],
  date: string,
  excusaDates?: ReadonlySet<string>,
): boolean {
  if (!streakTrackableDate(date)) return false;
  if (excusaDates?.has(date)) return true;
  return daySessions.length > 0 && daySessions.every(sessionQualifiesForDayStreak);
}

export function attendedForClassStreak(
  status: 'present' | 'partial' | 'absent' | 'upcoming' | 'live-soon' | undefined,
  date: string | undefined,
  excusaDates?: ReadonlySet<string>,
): boolean {
  if (status === 'present' || status === 'partial') return true;
  if (date && excusaDates?.has(date)) return true;
  return false;
}
