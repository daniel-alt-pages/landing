import { collection, doc } from 'firebase/firestore';
import { db } from '@features/auth/lib/firebase';
import { gatedGetDoc, gatedGetDocs } from '@features/simulacro/lib/firestoreService';
import type { CourseCalendarEventDto } from '@features/curso/lib/courseCalendarTypes';
import { getOrFetchCourseAttendanceReport } from '@features/curso/lib/courseAttendanceReportCache';
import type { CourseIdentity, CourseStudentMetrics } from '@features/curso/types/courseTypes';
import {
  fetchAttendanceManifest,
  fetchExcusasManifest,
  fetchExcusaSessionOverridesManifest,
  loadMeetSessionsForManifest,
} from '@features/curso/lib/courseAttendanceLocal';
import type { CourseExcusasManifest } from '@features/curso/lib/courseAttendanceExcusas';
import { excusaSessionOverridesForEmail } from '@features/curso/lib/courseExcusaSessionOverrides';
import { normalizeVacacionalInstitution } from '@features/curso/lib/vacacionalCourseLabels';
import {
  buildAllWeekStats,
  buildWeekSchedulesFromCalendar,
  PREICFES_SG26_VACACIONAL_LIVE_BOUNDS,
  scheduledSessionsForReport,
  sessionDurationLabel,
  sessionStatusText,
  type WeekAttendanceStats,
  type WeekScheduledClass,
} from '@features/curso/lib/courseAttendanceWeek';
import { formatHoursLabel, formatMinutesAsDuration } from '@features/curso/lib/courseMeetAttendance';
import {
  buildMetricsFromVacacionalCalendar,
  fetchVacacionalCalendarEventsForAttendance,
} from '@features/curso/lib/courseVacacionalAttendance';
import { mapCourseStudentMetrics } from '@features/curso/lib/courseMappers';
import {
  attachEnrollmentToReport,
  fetchCourseEnrollmentIndex,
  type CourseEnrollmentGeoSummary,
  type CourseEnrollmentIndex,
  type CourseEnrollmentSummary,
} from '@features/curso/lib/courseEnrollmentIndex';
import type { CourseEnrollmentKind } from '@features/curso/lib/courseEnrollmentKind';
import { COURSE_ENROLLMENT_KIND_LABEL } from '@features/curso/lib/courseEnrollmentKind';
import { normalizeDocumento, normalizeEmailLower } from '@features/curso/lib/courseAccessKeys';
import { mergeSimulacroBonusesIntoMetrics } from '@features/curso/lib/courseAttendancePoints';
import { fetchCourseRuntime } from '@features/curso/lib/courseRuntimeFirestore';
import { ensureCourseFirestoreAuth } from '@features/curso/lib/ensureCourseFirestoreAuth';
import {
  formatAcademicWeekNavLabel,
  formatCourseWeekNavLabel,
  formatWeekHeading,
  listVacacionalAcademicWeekRanges,
  resolveCourseDateBounds,
  type BogotaWeekRange,
  type VacacionalAcademicWeekRange,
} from '@features/curso/lib/courseVacacionalWeek';

export type CourseAttendanceRosterRow = {
  documento: string;
  nombres: string;
  apellidos: string;
  institucion: string;
  correo: string;
  displayName: string;
};

export type CourseAttendanceReportRow = CourseStudentMetrics & {
  rosterName: string;
  institution?: string;
  matchWarning?: boolean;
  enrollmentKind?: CourseEnrollmentKind;
  enrollmentMunicipio?: string;
  enrollmentDepartamento?: string;
  enrollmentInstitucion?: string;
  weekStats: WeekAttendanceStats[];
};

export type CourseAttendanceWeekMeta = {
  index: number;
  start: string;
  end: string;
  label: string;
  heading: string;
  /** Clases programadas en calendario para esta semana. */
  scheduledClasses: number;
};

export type CourseAttendanceReport = {
  courseId: string;
  rows: CourseAttendanceReportRow[];
  weeks: CourseAttendanceWeekMeta[];
  /** Programación ICS por semana (misma para todos los estudiantes). */
  weekSchedules: WeekScheduledClass[][];
  bounds: { start: string; end: string };
  source: 'firestore' | 'local';
  attendanceVersion?: number;
  generatedAt: string;
  warnings: string[];
  enrollmentSummary?: CourseEnrollmentSummary;
  enrollmentGeoSummary?: {
    inscritos?: CourseEnrollmentGeoSummary;
    roster: CourseEnrollmentGeoSummary;
  };
  excusas?: CourseExcusasManifest | null;
  /** Estudiantes del curso vacacional (roster canonical). */
  rosterCount?: number;
  /** Documentos permitidos (desde sync / CSV vacacional). */
  allowedDocuments?: string[];
};

export type FetchCourseAttendanceReportOptions = {
  calendarEvents?: CourseCalendarEventDto[];
  attendanceVersion?: number;
  topLimit?: number;
};

type LeaderboardAggregateMeta = {
  attendanceVersion?: number;
  chunkCount?: number;
  topLimit?: number;
  rosterCount?: number;
  allowedDocuments?: string[];
  weeks?: CourseAttendanceWeekMeta[];
  weekSchedules?: WeekScheduledClass[][];
  bounds?: { start: string; end: string };
  generatedAt?: string;
  warnings?: string[];
};

type VacacionalAllowlist = {
  documents: Set<string>;
  emails: Set<string>;
};

function buildVacacionalAllowlist(
  roster: CourseAttendanceRosterRow[],
  enrollmentIndex: CourseEnrollmentIndex | null,
  allowedDocuments?: string[],
): VacacionalAllowlist | null {
  const documents = new Set<string>();
  const emails = new Set<string>();

  for (const student of roster) {
    const doc = normalizeDocumento(student.documento);
    const email = normalizeEmailLower(student.correo);
    if (doc) documents.add(doc);
    if (email) emails.add(email);
  }
  if (documents.size || emails.size) {
    return { documents, emails };
  }

  if (enrollmentIndex) {
    for (const doc of Object.keys(enrollmentIndex.byDocument ?? {})) {
      const normalized = normalizeDocumento(doc);
      if (normalized) documents.add(normalized);
    }
    for (const email of Object.keys(enrollmentIndex.byEmail ?? {})) {
      const normalized = normalizeEmailLower(email);
      if (normalized) emails.add(normalized);
    }
    if (documents.size || emails.size) {
      return { documents, emails };
    }
  }

  if (allowedDocuments?.length) {
    for (const doc of allowedDocuments) {
      const normalized = normalizeDocumento(doc);
      if (normalized) documents.add(normalized);
    }
    return { documents, emails };
  }

  return null;
}

function rowMatchesVacacionalAllowlist(
  row: CourseAttendanceReportRow,
  allow: VacacionalAllowlist,
): boolean {
  const doc = normalizeDocumento(row.documento);
  const personDoc = row.personKey.match(/^doc_(\d+)$/);
  const docFromKey = personDoc?.[1] ? normalizeDocumento(personDoc[1]) : '';
  const email = normalizeEmailLower(row.emailLower);

  if (doc && allow.documents.has(doc)) return true;
  if (docFromKey && allow.documents.has(docFromKey)) return true;
  if (email && allow.emails.has(email)) return true;
  return false;
}

function filterRowsToVacacionalAllowlist(
  rows: CourseAttendanceReportRow[],
  allow: VacacionalAllowlist | null,
): CourseAttendanceReportRow[] {
  if (!allow || (!allow.documents.size && !allow.emails.size)) return rows;
  return rows.filter((row) => rowMatchesVacacionalAllowlist(row, allow));
}

function applyVacacionalRosterGate(
  report: CourseAttendanceReport,
  roster: CourseAttendanceRosterRow[],
  enrollmentIndex: CourseEnrollmentIndex | null,
): CourseAttendanceReport {
  const allow = buildVacacionalAllowlist(roster, enrollmentIndex, report.allowedDocuments);
  if (!allow) {
    return {
      ...report,
      rosterCount: report.rosterCount ?? report.rows.length,
    };
  }

  const rows = filterRowsToVacacionalAllowlist(report.rows, allow);
  const dropped = report.rows.length - rows.length;
  return {
    ...report,
    rows,
    rosterCount: rows.length,
    warnings:
      dropped > 0
        ? [
            ...report.warnings,
            `Ranking limitado al curso vacacional (${rows.length} estudiantes).`,
          ]
        : report.warnings,
  };
}

function resolveCourseAttendanceBounds(courseId: string) {
  if (courseId === 'preicfes-sg26') {
    return { ...PREICFES_SG26_VACACIONAL_LIVE_BOUNDS };
  }
  return resolveCourseDateBounds();
}

function buildWeekMeta(
  weeks: BogotaWeekRange[],
  weekSchedules: WeekScheduledClass[][],
): CourseAttendanceWeekMeta[] {
  return weeks.map((week, index) => {
    const academic = week as VacacionalAcademicWeekRange;
    const heading = formatWeekHeading(week.start, week.end);
    const label =
      academic.weekNumber && academic.label
        ? formatAcademicWeekNavLabel(academic, weeks.length)
        : formatCourseWeekNavLabel(index, weeks.length, week);
    return {
      index,
      start: week.start,
      end: week.end,
      heading,
      label,
      scheduledClasses: weekSchedules[index]?.length ?? 0,
    };
  });
}

async function loadAttendanceWeekContext(
  courseId: string,
  calendarEventsInput?: CourseCalendarEventDto[],
) {
  const bounds = resolveCourseAttendanceBounds(courseId);
  const weekRanges = listVacacionalAcademicWeekRanges(courseId, bounds);
  const calendarEvents =
    calendarEventsInput?.length
      ? calendarEventsInput
      : await fetchVacacionalCalendarEventsForAttendance(bounds.start, bounds.end);
  const weekSchedules = buildWeekSchedulesFromCalendar(calendarEvents, weekRanges, courseId);
  const weeks = buildWeekMeta(weekRanges, weekSchedules);
  return { bounds, weekRanges, weeks, weekSchedules, calendarEvents };
}

function attachWeekStats(
  row: Omit<CourseAttendanceReportRow, 'weekStats'>,
  weeks: BogotaWeekRange[],
  weekSchedules: WeekScheduledClass[][],
): CourseAttendanceReportRow {
  return {
    ...row,
    weekStats: buildAllWeekStats(row.recentSessions, weeks, weekSchedules),
  };
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

export async function fetchCourseRosterCsv(
  courseId: string,
): Promise<CourseAttendanceRosterRow[]> {
  if (!courseId || typeof window === 'undefined') return [];

  const url = `/data/course/roster_${encodeURIComponent(courseId)}.csv`;
  let res: Response;
  try {
    res = await fetch(url, { credentials: 'same-origin' });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  const contentType = res.headers.get('content-type') || '';
  if (contentType.toLowerCase().includes('text/html')) return [];

  const text = await res.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  if (header.indexOf('numero_identificacion') < 0) return [];
  const idx = {
    doc: header.indexOf('numero_identificacion'),
    nombres: header.indexOf('nombres'),
    apellidos: header.indexOf('apellidos'),
    institucion: header.indexOf('institucion'),
    correo: header.indexOf('correo'),
  };

  const rows: CourseAttendanceRosterRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const documento = normalizeDocumento(cells[idx.doc] || '');
    const nombres = (cells[idx.nombres] || '').trim();
    const apellidos = (cells[idx.apellidos] || '').trim();
    const correo = normalizeEmailLower(cells[idx.correo] || '');
    if (!documento && !correo) continue;

    rows.push({
      documento,
      nombres,
      apellidos,
      institucion: (cells[idx.institucion] || '').trim(),
      correo,
      displayName: `${nombres} ${apellidos}`.trim() || correo || documento,
    });
  }
  return rows;
}

function rosterLookupMaps(roster: CourseAttendanceRosterRow[]) {
  const byDoc = new Map<string, CourseAttendanceRosterRow>();
  const byEmail = new Map<string, CourseAttendanceRosterRow>();
  for (const student of roster) {
    if (student.documento) byDoc.set(student.documento, student);
    if (student.correo) byEmail.set(student.correo, student);
  }
  return { byDoc, byEmail };
}

function findRosterForMetricsRow(
  row: CourseStudentMetrics,
  maps: ReturnType<typeof rosterLookupMaps>,
): CourseAttendanceRosterRow | undefined {
  const doc = normalizeDocumento(row.documento);
  if (doc && maps.byDoc.has(doc)) return maps.byDoc.get(doc);
  const email = normalizeEmailLower(row.emailLower);
  if (email && maps.byEmail.has(email)) return maps.byEmail.get(email);
  const personDoc = row.personKey.match(/^doc_(\d+)$/);
  if (personDoc?.[1] && maps.byDoc.has(personDoc[1])) return maps.byDoc.get(personDoc[1]);
  return undefined;
}

type AttendanceReportRowBase = Omit<CourseAttendanceReportRow, 'weekStats'>;

function mergeRosterIntoReportRow<T extends AttendanceReportRowBase>(
  row: T,
  roster?: CourseAttendanceRosterRow,
): T {
  if (!roster) return row;
  return {
    ...row,
    documento: roster.documento || row.documento,
    emailLower: roster.correo || row.emailLower,
    rosterName: roster.displayName || row.rosterName,
    institution: normalizeVacacionalInstitution(roster.institucion || row.institution),
    displayName: roster.displayName || row.displayName,
  };
}

function shouldPreferLocalAttendance(
  firestoreRow: CourseAttendanceReportRow,
  localMetrics: CourseStudentMetrics,
): boolean {
  const firestoreAttended = firestoreRow.attendance.sessionsAttended ?? 0;
  const localAttended = localMetrics.attendance.sessionsAttended ?? 0;
  const firestoreTotal = firestoreRow.attendance.sessionsTotal ?? 0;
  const localTotal = localMetrics.attendance.sessionsTotal ?? 0;
  if (firestoreRow.matchWarning) return true;
  if (localTotal > 0 && localTotal !== firestoreTotal) return true;
  if (localAttended > firestoreAttended) return true;
  const firestoreMinutes =
    firestoreRow.attendance.attendedHours != null
      ? Math.round(firestoreRow.attendance.attendedHours * 60)
      : 0;
  const localMinutes = localMetrics.attendance.attendedHours != null
    ? Math.round(localMetrics.attendance.attendedHours * 60)
    : 0;
  return localMinutes > firestoreMinutes && localAttended >= firestoreAttended;
}

async function reconcileAttendanceWithVacacionalRoster(
  report: CourseAttendanceReport,
  roster: CourseAttendanceRosterRow[],
): Promise<CourseAttendanceReport> {
  const maps = rosterLookupMaps(roster);
  const manifest = await fetchAttendanceManifest(report.courseId);
  const sessionOverridesManifest = await fetchExcusaSessionOverridesManifest(report.courseId);
  const loaded = manifest ? await loadMeetSessionsForManifest(report.courseId, manifest) : [];
  const { bounds, weekRanges, calendarEvents } = await loadAttendanceWeekContext(report.courseId);

  const rowByDoc = new Map<string, CourseAttendanceReportRow>();
  for (const row of report.rows) {
    const doc = normalizeDocumento(row.documento);
    if (doc) rowByDoc.set(doc, row);
    const personDoc = row.personKey.match(/^doc_(\d+)$/);
    if (personDoc?.[1]) rowByDoc.set(personDoc[1], row);
  }

  const warnings: string[] = [];
  const mergedRows: CourseAttendanceReportRow[] = [];

  for (const student of roster) {
    const identity: CourseIdentity = {
      documento: student.documento,
      emailLower: student.correo,
    };

    const overrides = excusaSessionOverridesForEmail(sessionOverridesManifest, student.correo);
    const localMetrics =
      manifest && student.correo
        ? buildMetricsFromVacacionalCalendar(
            report.courseId,
            identity,
            manifest,
            calendarEvents,
            loaded,
            student.displayName,
            Date.now(),
            overrides.size ? overrides : undefined,
          )
        : null;

    const existing =
      (student.documento && rowByDoc.get(student.documento)) ||
      report.rows.find(
        (r) =>
          normalizeEmailLower(r.emailLower) === student.correo ||
          normalizeDocumento(r.documento) === student.documento,
      );

    if (existing && localMetrics && (shouldPreferLocalAttendance(existing, localMetrics) || overrides.size > 0)) {
      const completed = localMetrics.attendance.sessionsCompleted ?? 0;
      const attended = localMetrics.attendance.sessionsAttended ?? 0;
      const matchWarning = completed > 0 && attended === 0;
      if (matchWarning) warnings.push(student.displayName);

      mergedRows.push(
        attachWeekStats(
          mergeRosterIntoReportRow(
            mergeSimulacroBonusesIntoMetrics(
              {
                ...existing,
                ...localMetrics,
                personKey: existing.personKey,
                rosterName: student.displayName,
                institution: normalizeVacacionalInstitution(student.institucion),
                emailLower: student.correo,
                matchWarning,
              },
              existing,
            ),
            student,
          ),
          weekRanges,
          report.weekSchedules,
        ),
      );
      continue;
    }

    if (existing) {
      const completed = existing.attendance.sessionsCompleted ?? 0;
      const attended = existing.attendance.sessionsAttended ?? 0;
      const matchWarning = existing.matchWarning || (completed > 0 && attended === 0);
      if (matchWarning) warnings.push(student.displayName);
      mergedRows.push(
        attachWeekStats(
          mergeRosterIntoReportRow({ ...existing, matchWarning }, student),
          weekRanges,
          report.weekSchedules,
        ),
      );
      continue;
    }

    if (!localMetrics) continue;

    const completed = localMetrics.attendance.sessionsCompleted ?? 0;
    const attended = localMetrics.attendance.sessionsAttended ?? 0;
    const matchWarning = completed > 0 && attended === 0;
    if (matchWarning) warnings.push(student.displayName);

    mergedRows.push(
      attachWeekStats(
        mergeRosterIntoReportRow(
          {
            ...localMetrics,
            rosterName: student.displayName,
            institution: normalizeVacacionalInstitution(student.institucion),
            matchWarning,
          },
          student,
        ),
        weekRanges,
        report.weekSchedules,
      ),
    );
  }

  mergedRows.sort((a, b) =>
    (a.rosterName || '').localeCompare(b.rosterName || '', 'es', { sensitivity: 'base' }),
  );

  return {
    ...report,
    rows: mergedRows,
    warnings: [...new Set(warnings)],
  };
}

async function fetchFirestoreAttendanceFromAggregates(
  courseId: string,
  expectedVersion?: number,
  calendarEventsInput?: CourseCalendarEventDto[],
  topLimit?: number,
): Promise<CourseAttendanceReport | null> {
  const metaRef = doc(db, 'courseMetrics', courseId, 'aggregates', 'leaderboard_meta');
  let metaSnap;
  try {
    metaSnap = await gatedGetDoc(metaRef, 'courseLeaderboardMeta');
  } catch {
    return null;
  }
  if (!metaSnap?.exists()) return null;

  const meta = metaSnap.data() as LeaderboardAggregateMeta;
  // ponytail: si runtime local va atrás, igual servir aggregates más nuevos (evita scan 189 docs)
  if (
    expectedVersion != null &&
    meta.attendanceVersion != null &&
    meta.attendanceVersion < expectedVersion
  ) {
    return null;
  }

  const chunkCount = meta.chunkCount ?? 0;
  if (!chunkCount) return null;

  const compactRows: Omit<CourseAttendanceReportRow, 'weekStats'>[] = [];
  if (topLimit != null && topLimit > 0) {
    const topRef = doc(db, 'courseMetrics', courseId, 'aggregates', 'leaderboard_top');
    try {
      const topSnap = await gatedGetDoc(topRef, 'courseLeaderboardTop');
      const top = topSnap?.exists()
        ? (topSnap.data() as { topLimit?: number; rows?: Omit<CourseAttendanceReportRow, 'weekStats'>[] })
        : null;
      if ((top?.topLimit ?? 0) >= topLimit && top?.rows?.length) {
        compactRows.push(...top.rows.slice(0, topLimit));
      }
    } catch {
      /* fallback chunks */
    }
  }

  if (!compactRows.length) {
    for (let i = 0; i < chunkCount; i += 1) {
      const chunkRef = doc(db, 'courseMetrics', courseId, 'aggregates', `leaderboard_${i}`);
      let chunkSnap;
      try {
        chunkSnap = await gatedGetDoc(chunkRef, 'courseLeaderboardChunk');
      } catch {
        continue;
      }
      if (!chunkSnap?.exists()) continue;
      const chunk = chunkSnap.data() as { rows?: Omit<CourseAttendanceReportRow, 'weekStats'>[] };
      if (chunk.rows?.length) compactRows.push(...chunk.rows);
    }
  }

  if (!compactRows.length) return null;

  const bounds = meta.bounds ?? resolveCourseAttendanceBounds(courseId);
  const weekRanges = listVacacionalAcademicWeekRanges(courseId, bounds);
  let weeks = meta.weeks ?? [];
  let weekSchedules = meta.weekSchedules ?? [];

  if (!weekSchedules.length || !weeks.length) {
    const ctx = await loadAttendanceWeekContext(courseId, calendarEventsInput);
    weeks = ctx.weeks;
    weekSchedules = ctx.weekSchedules;
  }

  const rows: CourseAttendanceReportRow[] = compactRows.map((row) => {
    const withStats = row as CourseAttendanceReportRow;
    if (withStats.weekStats?.length) return withStats;
    return attachWeekStats(row, weekRanges, weekSchedules);
  });

  rows.sort((a, b) =>
    (a.rosterName || '').localeCompare(b.rosterName || '', 'es', { sensitivity: 'base' }),
  );

  return {
    courseId,
    rows,
    weeks,
    weekSchedules,
    bounds,
    source: 'firestore',
    attendanceVersion: meta.attendanceVersion,
    rosterCount: meta.rosterCount ?? rows.length,
    allowedDocuments: meta.allowedDocuments,
    generatedAt: meta.generatedAt ?? new Date().toISOString(),
    warnings: meta.warnings ?? rows.filter((r) => r.matchWarning).map((r) => r.rosterName),
  };
}

async function fetchFirestoreAttendanceReport(
  courseId: string,
  roster: CourseAttendanceRosterRow[] = [],
  calendarEventsInput?: CourseCalendarEventDto[],
  expectedAttendanceVersion?: number,
  topLimit?: number,
): Promise<CourseAttendanceReport | null> {
  if (!(await ensureCourseFirestoreAuth('fetchCourseAttendanceReport'))) {
    return null;
  }

  let attendanceVersion: number | undefined = expectedAttendanceVersion;
  if (attendanceVersion == null) {
    try {
      const runtime = await fetchCourseRuntime(courseId);
      attendanceVersion = runtime?.attendanceVersion;
    } catch {
      /* optional */
    }
  }

  try {
    const fromAggregates = await fetchFirestoreAttendanceFromAggregates(
      courseId,
      attendanceVersion,
      calendarEventsInput,
      topLimit,
    );
    if (fromAggregates?.rows.length) {
      const aggregateIsLimited =
        topLimit != null &&
        topLimit > 0 &&
        fromAggregates.rows.length <= topLimit &&
        (fromAggregates.rosterCount ?? fromAggregates.rows.length) > fromAggregates.rows.length;
      if (roster.length && !aggregateIsLimited) {
        return reconcileAttendanceWithVacacionalRoster(fromAggregates, roster);
      }
      return fromAggregates;
    }
  } catch {
    /* fallback scan */
  }

  const coll = collection(db, 'courseMetrics', courseId, 'students');
  let snap;
  try {
    snap = await gatedGetDocs(coll, 'courseAttendanceReport', 500);
  } catch {
    return null;
  }
  if (!snap?.docs.length) return null;

  const { bounds, weekRanges, weeks, weekSchedules } = await loadAttendanceWeekContext(
    courseId,
    calendarEventsInput,
  );

  const maps = rosterLookupMaps(roster);

  const rows: CourseAttendanceReportRow[] = snap.docs.map((docSnap) => {
    const mapped = mapCourseStudentMetrics(
      docSnap.data() as Record<string, unknown>,
      courseId,
      docSnap.id,
    );
    const rosterMatch = findRosterForMetricsRow(mapped, maps);
    const merged = mergeRosterIntoReportRow(
      {
        ...mapped,
        rosterName: mapped.displayName || mapped.emailLower || docSnap.id,
        institution: undefined,
      },
      rosterMatch,
    );
    const completed = merged.attendance.sessionsCompleted ?? 0;
    const attended = merged.attendance.sessionsAttended ?? 0;
    return attachWeekStats(
      {
        ...merged,
        matchWarning: completed > 0 && attended === 0,
      },
      weekRanges,
      weekSchedules,
    );
  });

  rows.sort((a, b) =>
    (a.rosterName || '').localeCompare(b.rosterName || '', 'es', { sensitivity: 'base' }),
  );

  const report: CourseAttendanceReport = {
    courseId,
    rows,
    weeks,
    weekSchedules,
    bounds,
    source: 'firestore',
    attendanceVersion,
    generatedAt: new Date().toISOString(),
    warnings: rows.filter((r) => r.matchWarning).map((r) => r.rosterName),
  };

  if (roster.length) {
    return reconcileAttendanceWithVacacionalRoster(report, roster);
  }

  return report;
}

async function fetchLocalAttendanceReport(
  courseId: string,
  roster: CourseAttendanceRosterRow[],
  calendarEventsInput?: CourseCalendarEventDto[],
): Promise<CourseAttendanceReport> {
  const { bounds, weekRanges, weeks, weekSchedules, calendarEvents } =
    await loadAttendanceWeekContext(courseId, calendarEventsInput);

  const manifest = await fetchAttendanceManifest(courseId);
  const excusas = await fetchExcusasManifest(courseId);
  const sessionOverridesManifest = await fetchExcusaSessionOverridesManifest(courseId);
  const loaded = manifest ? await loadMeetSessionsForManifest(courseId, manifest) : [];

  const warnings: string[] = [];
  const rows: CourseAttendanceReportRow[] = [];

  for (const student of roster) {
    const identity: CourseIdentity = {
      documento: student.documento,
      emailLower: student.correo,
    };

    const overrides = excusaSessionOverridesForEmail(sessionOverridesManifest, student.correo);
    const metrics = manifest
      ? buildMetricsFromVacacionalCalendar(
          courseId,
          identity,
          manifest,
          calendarEvents,
          loaded,
          student.displayName,
          Date.now(),
          overrides.size ? overrides : undefined,
        )
      : null;

    if (!metrics) continue;

    const completed = metrics.attendance.sessionsCompleted ?? 0;
    const attended = metrics.attendance.sessionsAttended ?? 0;
    const matchWarning = completed > 0 && attended === 0;
    if (matchWarning) warnings.push(student.displayName);

    rows.push(
      attachWeekStats(
        {
          ...metrics,
          rosterName: student.displayName,
          institution: normalizeVacacionalInstitution(student.institucion),
          matchWarning,
        },
        weekRanges,
        weekSchedules,
      ),
    );
  }

  rows.sort((a, b) =>
    (a.rosterName || '').localeCompare(b.rosterName || '', 'es', { sensitivity: 'base' }),
  );

  return {
    courseId,
    rows,
    weeks,
    weekSchedules,
    bounds,
    source: 'local',
    generatedAt: new Date().toISOString(),
    warnings,
    excusas,
  };
}

async function fetchCourseAttendanceReportUncached(
  courseId: string,
  options?: FetchCourseAttendanceReportOptions,
): Promise<CourseAttendanceReport> {
  const roster = await fetchCourseRosterCsv(courseId);
  const calendarEvents = options?.calendarEvents;
  const enrollmentIndex = await fetchCourseEnrollmentIndex(courseId);

  const finalize = async (report: CourseAttendanceReport) =>
    attachEnrollmentToReport(
      applyVacacionalRosterGate(report, roster, enrollmentIndex),
      enrollmentIndex,
    );

  try {
    const firestoreReport = await fetchFirestoreAttendanceReport(
      courseId,
      roster,
      calendarEvents,
      options?.attendanceVersion,
      options?.topLimit,
    );
    if (firestoreReport?.rows.length) {
      return finalize(firestoreReport);
    }

    const { bounds, weeks, weekSchedules } = await loadAttendanceWeekContext(
      courseId,
      calendarEvents,
    );

    if (!roster.length) {
      return finalize({
        courseId,
        rows: [],
        weeks,
        weekSchedules,
        bounds,
        source: 'local',
        generatedAt: new Date().toISOString(),
        warnings: ['Sin roster local ni métricas en Firestore.'],
      });
    }

    return finalize(await fetchLocalAttendanceReport(courseId, roster, calendarEvents));
  } catch {
    const bounds = resolveCourseAttendanceBounds(courseId);
    const weekRanges = listVacacionalAcademicWeekRanges(courseId, bounds);
    const weekSchedules = buildWeekSchedulesFromCalendar(
      calendarEvents ?? [],
      weekRanges,
      courseId,
    );
    return finalize({
      courseId,
      rows: [],
      weeks: buildWeekMeta(weekRanges, weekSchedules),
      weekSchedules,
      bounds,
      source: 'local',
      generatedAt: new Date().toISOString(),
      warnings: ['No pudimos cargar el ranking desde Firestore.'],
    });
  }
}

/** Reporte agregado de asistencia — Firestore chunks o cálculo local dev. */
export async function fetchCourseAttendanceReport(
  courseId = 'preicfes-sg26',
  options?: FetchCourseAttendanceReportOptions,
): Promise<CourseAttendanceReport> {
  return getOrFetchCourseAttendanceReport(
    courseId,
    options?.attendanceVersion,
    options?.topLimit,
    () => fetchCourseAttendanceReportUncached(courseId, options),
  );
}

export function exportAttendanceReportCsv(
  report: CourseAttendanceReport,
  weekIndex?: number | null,
): string {
  const useWeek = weekIndex != null && weekIndex >= 0 && weekIndex < report.weeks.length;
  const weekMeta = useWeek ? report.weeks[weekIndex] : null;

  const header = [
    'nombre',
    'email',
    'documento',
    'institucion',
    'municipio',
    'departamento',
    'inscripcion_tipo',
    ...(weekMeta
      ? [
          'semana',
          'semana_rango',
          'tasa_semana',
          'clases_asistidas_semana',
          'clases_programadas_semana',
          'clases_dictadas_semana',
          'clases_pendientes_semana',
        ]
      : []),
    'tasa_asistencia',
    'clases_asistidas',
    'clases_dictadas',
    'clases_total',
    'horas_asistidas',
    'horas_meta',
    'sin_match_meet',
  ];

  const lines = [header.join(',')];
  for (const row of report.rows) {
    const a = row.attendance;
    const weekStats = useWeek ? row.weekStats[weekIndex] : null;
    const cells = [
      row.rosterName,
      row.emailLower || '',
      row.documento || '',
      row.institution || '',
      row.enrollmentMunicipio || '',
      row.enrollmentDepartamento || '',
      COURSE_ENROLLMENT_KIND_LABEL[row.enrollmentKind ?? 'unknown'],
      ...(weekMeta && weekStats
        ? [
            weekMeta.label,
            weekMeta.heading,
            String(
              weekStats.sessionsScheduled > 0
                ? Math.round((weekStats.sessionsAttended / weekStats.sessionsScheduled) * 100) /
                  100
                : 0,
            ),
            String(weekStats.sessionsAttended),
            String(weekStats.sessionsScheduled),
            String(weekStats.sessionsCompleted),
            String(weekStats.sessionsPending),
          ]
        : []),
      String(Math.round((a.attendanceRate || 0) * 100) / 100),
      String(a.sessionsAttended ?? 0),
      String(a.sessionsCompleted ?? 0),
      String(a.sessionsTotal ?? 0),
      formatHoursLabel(a.attendedHours ?? 0),
      formatHoursLabel(a.totalHours ?? 0),
      row.matchWarning ? 'si' : 'no',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(cells.join(','));
  }
  return lines.join('\n');
}

/** Una fila por estudiante y clase — entrada, salida y tiempo en h/min. */
export function exportAttendanceSessionsDetailCsv(
  report: CourseAttendanceReport,
  weekIndex?: number | null,
): string {
  const useWeek = weekIndex != null && weekIndex >= 0 && weekIndex < report.weeks.length;

  const header = [
    'nombre',
    'email',
    'documento',
    'institucion',
    'fecha',
    'clase',
    'entrada',
    'salida',
    'tiempo',
    'estado',
    ...(useWeek ? ['semana', 'semana_rango'] : []),
  ];

  const lines = [header.join(',')];
  for (const row of report.rows) {
    const sessions = scheduledSessionsForReport(
      row.recentSessions,
      report.weekSchedules,
      useWeek ? weekIndex : undefined,
    );
    for (const session of sessions) {
      const cells = [
        row.rosterName,
        row.emailLower || '',
        row.documento || '',
        row.institution || '',
        session.date,
        session.topic || '',
        session.joinedAt || '',
        session.leftAt || '',
        sessionDurationLabel(session),
        sessionStatusText(session),
        ...(useWeek
          ? [report.weeks[weekIndex]!.label, report.weeks[weekIndex]!.heading]
          : []),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cells.join(','));
    }
  }
  return lines.join('\n');
}

export function formatAttendedMinutesLabel(minutes: number): string {
  return formatMinutesAsDuration(minutes);
}
