import type {
  CourseAttendanceManifest,
  CourseAttendanceManifestSession,
  CourseIdentity,
  CourseRecentSession,
  CourseStudentMetrics,
  MeetAttendanceRow,
} from '../types/courseTypes';
import { COURSE_DEFAULT_TOTAL_HOURS } from '../types/courseTypes';
import { buildCoursePersonKey } from './courseAccessKeys';
import { readStudentDisplayName } from './courseStudentSession';

const MEET_PREFIX_RE =
  /^(?:(?:pvsg?|psvg|pvg)(?:[\s-]*(?:\d{2,4}))?[\s-]+|sg\s*-\s*[a-z0-9-]+\s*-\s*|ietac\s*-\s*)/i;

export function normalizeMeetName(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(MEET_PREFIX_RE, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameTokens(value: string): string[] {
  return normalizeMeetName(value)
    .split(' ')
    .filter((token) => token.length > 1);
}

/** Coincidencia fuzzy entre nombre del estudiante y fila Meet (Nombre + Apellido). */
export function meetRowMatchesStudent(
  studentName: string | undefined,
  row: Pick<MeetAttendanceRow, 'firstName' | 'lastName'>,
): boolean {
  const query = normalizeMeetName(studentName || '');
  if (!query) return false;

  const meetFull = normalizeMeetName(`${row.firstName} ${row.lastName}`);
  if (!meetFull) return false;
  if (meetFull === query || meetFull.includes(query) || query.includes(meetFull)) {
    return true;
  }

  const queryTokens = nameTokens(studentName || '');
  const meetTokens = nameTokens(`${row.firstName} ${row.lastName}`);
  if (!queryTokens.length || !meetTokens.length) return false;

  const queryApellidos = queryTokens.slice(-2);
  const queryNombres = queryTokens.slice(0, Math.max(1, queryTokens.length - 1));

  const apellidoHits = queryApellidos.filter((token) =>
    meetTokens.some((m) => m === token || m.startsWith(token) || token.startsWith(m)),
  ).length;
  const nombreHits = queryNombres.filter((token) =>
    meetTokens.some((m) => m === token || m.startsWith(token) || token.startsWith(m)),
  ).length;

  return apellidoHits >= 1 && nombreHits >= 1;
}

/** Parsea duraciones Meet: "1 h 5 min", "35 min", "29 s". */
export function parseMeetDurationMinutes(raw: string): number {
  const text = String(raw || '').trim().toLowerCase();
  if (!text) return 0;

  let total = 0;
  const hourMatch = text.match(/(\d+)\s*h/);
  const minMatch = text.match(/(\d+)\s*m(?:in)?/);
  const secMatch = text.match(/(\d+)\s*s(?:eg)?/);

  if (hourMatch) total += Number(hourMatch[1]) * 60;
  if (minMatch) total += Number(minMatch[1]);
  if (!hourMatch && !minMatch && secMatch) {
    total += Number(secMatch[1]) / 60;
  }
  return Math.max(0, Math.round(total * 10) / 10);
}

export function formatMinutesAsDuration(minutes: number): string {
  if (minutes <= 0) return '0 min';
  if (minutes < 1) return 'Menos de 1 min';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

export function formatHoursLabel(hours: number): string {
  if (hours <= 0) return '0 min';
  return formatMinutesAsDuration(Math.round(hours * 60));
}

/** Hora Meet ("8:55 p.m.", "10:09 p.m.") → minutos desde medianoche. */
export function parseMeetClockToMinutesOfDay(raw?: string): number | null {
  const text = String(raw || '')
    .trim()
    .replace(/\u202f/g, ' ')
    .replace(/\s+/g, ' ');
  if (!text || text === '—' || text === '-') return null;

  const en = text.match(/^(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)$/i);
  if (en) {
    let h = Number(en[1]);
    const m = Number(en[2]);
    const pm = /p/i.test(en[3]);
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
    if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
    return null;
  }

  const plain = text.match(/^(\d{1,2}):(\d{2})$/);
  if (plain) {
    const h = Number(plain[1]);
    const m = Number(plain[2]);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
  }

  return null;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

/** CSV exportado por Google Meet (encabezados en español). */
export function parseMeetAttendanceCsv(csvText: string): MeetAttendanceRow[] {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const idx = {
    firstName: header.findIndex((h) => h.startsWith('nombre')),
    lastName: header.findIndex((h) => h.startsWith('apellido')),
    duration: header.findIndex((h) => h.includes('duraci')),
    joined: header.findIndex((h) => h.includes('uni')),
    left: header.findIndex((h) => h.includes('abandon')),
  };

  if (idx.firstName === -1 || idx.duration === -1) return [];

  const rows: MeetAttendanceRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const firstName = cells[idx.firstName] ?? '';
    const lastName = idx.lastName >= 0 ? cells[idx.lastName] ?? '' : '';
    const durationRaw = cells[idx.duration] ?? '';
    const durationMinutes = parseMeetDurationMinutes(durationRaw);
    rows.push({
      firstName,
      lastName,
      durationMinutes,
      durationLabel: durationRaw || formatMinutesAsDuration(durationMinutes),
      joinedAt: idx.joined >= 0 ? cells[idx.joined] ?? '' : '',
      leftAt: idx.left >= 0 ? cells[idx.left] ?? '' : '',
    });
  }
  return rows;
}

function sessionStatusFromMinutes(
  minutes: number,
  scheduledMinutes?: number,
): CourseRecentSession['status'] {
  if (minutes <= 0) return 'absent';
  const threshold = scheduledMinutes ? Math.max(15, scheduledMinutes * 0.5) : 30;
  return minutes >= threshold ? 'present' : 'partial';
}

export function findStudentRowForMeet(
  rows: MeetAttendanceRow[],
  studentName: string | undefined,
): MeetAttendanceRow | null {
  if (!studentName?.trim()) return null;
  return rows.find((row) => meetRowMatchesStudent(studentName, row)) ?? null;
}

export { sessionStatusFromMinutes };

export function buildMetricsFromMeetSessions(
  courseId: string,
  identity: CourseIdentity,
  manifest: CourseAttendanceManifest,
  sessions: { meta: CourseAttendanceManifestSession; rows: MeetAttendanceRow[] }[],
  displayName?: string,
): CourseStudentMetrics | null {
  const studentName = displayName || readStudentDisplayName() || 'Estudiante';
  const totalHours = manifest.totalHours || COURSE_DEFAULT_TOTAL_HOURS;
  let attendedMinutes = 0;
  let sessionsAttended = 0;
  let sessionsTotal = 0;
  const liveSessions: CourseRecentSession[] = [];

  for (const { meta, rows } of sessions) {
    const hit = findStudentRowForMeet(rows, studentName);
    const minutes = hit?.durationMinutes ?? 0;
    const status = sessionStatusFromMinutes(minutes, meta.scheduledMinutes);
    const attended = minutes > 0;
    const countsTowardHours = meta.countsTowardHours !== false;

    sessionsTotal += 1;
    if (status === 'present' || status === 'partial') sessionsAttended += 1;

    if (attended && countsTowardHours) {
      attendedMinutes += minutes;
    }

    liveSessions.push({
      sessionId: meta.id,
      date: meta.date,
      topic: meta.subtitle ? `${meta.title} · ${meta.subtitle}` : meta.title,
      attended,
      minutes,
      joinedAt: hit?.joinedAt || undefined,
      leftAt: hit?.leftAt || undefined,
      durationLabel: hit?.durationLabel || (attended ? formatMinutesAsDuration(minutes) : '—'),
      status,
    });
  }

  const recentSessions = [...liveSessions].sort((a, b) => b.date.localeCompare(a.date));
  const attendedHours = Math.round((attendedMinutes / 60) * 10) / 10;
  const attendanceRate = totalHours > 0 ? attendedHours / totalHours : 0;

  if (!recentSessions.length) return null;

  return {
    courseId,
    personKey: buildCoursePersonKey(identity),
    studentId: identity.studentId,
    emailLower: identity.emailLower,
    documento: identity.documento,
    displayName: studentName,
    attendance: {
      totalHours,
      attendedHours,
      attendanceRate,
      sessionsAttended,
      sessionsTotal,
      lastUpdatedAt: new Date().toISOString(),
    },
    recentSessions,
    version: 1,
  };
}

export function statusLabel(status: CourseRecentSession['status']): string {
  switch (status) {
    case 'present':
      return 'Asistió';
    case 'partial':
      return 'Parcial';
    case 'upcoming':
      return 'Programada';
    case 'live-soon':
      return 'Por iniciar';
    case 'absent':
    default:
      return 'Sin registro';
  }
}
