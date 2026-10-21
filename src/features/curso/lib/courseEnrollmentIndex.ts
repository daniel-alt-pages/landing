import type { CourseAttendanceReport, CourseAttendanceReportRow } from './courseAttendanceReport';

import { normalizeDocumento, normalizeEmailLower } from './courseAccessKeys';

import {

  classifyVacacionalEnrollment,

  mergeEnrollmentKind,

  type CourseEnrollmentKind,

} from './courseEnrollmentKind';



export type CourseEnrollmentIndexEntry = {

  kind: CourseEnrollmentKind;

  municipio?: string;

  departamento?: string;

  institucion?: string;

};



export type CourseEnrollmentGeoSlice = {

  name: string;

  count: number;

  becado?: number;

  pago?: number;

  attending?: number;

  avgPct?: number;

};



export type CourseEnrollmentGeoSummary = {

  byDepartamento: CourseEnrollmentGeoSlice[];

  byMunicipio: Array<CourseEnrollmentGeoSlice & { departamento?: string }>;

  departamentosCount: number;

  municipiosCount: number;

};



export type CourseEnrollmentSummary = {

  /** Total inscripciones únicas (documento) en el índice vacacional. */

  inscritosTotal: number;

  inscritosBecado: number;

  inscritosPago: number;

  inscritosUnknown: number;

  /** Estudiantes en roster de curso (acceso Mi Curso). */

  rosterEnrolled: number;

  rosterBecado: number;

  rosterPago: number;

  /** Al menos una clase asistida (presente o parcial). */

  attendingTotal: number;

  attendingBecado: number;

  attendingPago: number;

  notAttending: number;

};



export type CourseEnrollmentIndex = {

  courseId: string;

  generatedAt: string;

  byDocument: Record<string, CourseEnrollmentIndexEntry>;

  byEmail: Record<string, CourseEnrollmentIndexEntry>;

  summary: Pick<

    CourseEnrollmentSummary,

    'inscritosTotal' | 'inscritosBecado' | 'inscritosPago' | 'inscritosUnknown'

  >;

  geoSummary?: CourseEnrollmentGeoSummary;

};



function isAttendingRow(row: CourseAttendanceReportRow): boolean {

  return (row.attendance.sessionsAttended ?? 0) > 0;

}



function lookupEnrollmentEntry(

  index: CourseEnrollmentIndex,

  row: CourseAttendanceReportRow,

): CourseEnrollmentIndexEntry | null {

  const doc = normalizeDocumento(row.documento);

  if (doc && index.byDocument[doc]) return index.byDocument[doc];

  const email = normalizeEmailLower(row.emailLower);

  if (email && index.byEmail[email]) return index.byEmail[email];

  const personDoc = row.personKey.match(/^doc_(\d+)$/);

  if (personDoc?.[1] && index.byDocument[personDoc[1]]) {

    return index.byDocument[personDoc[1]];

  }

  return null;

}



function lookupEnrollment(

  index: CourseEnrollmentIndex,

  row: CourseAttendanceReportRow,

): CourseEnrollmentKind {

  return lookupEnrollmentEntry(index, row)?.kind ?? 'unknown';

}



function buildRosterGeoSummary(rows: CourseAttendanceReportRow[]): CourseEnrollmentGeoSummary {

  const deptMap = new Map<string, { count: number; rateSum: number; attending: number }>();

  const muniMap = new Map<

    string,

    { name: string; departamento: string; count: number; rateSum: number; attending: number }

  >();



  for (const row of rows) {

    const dept = (row.enrollmentDepartamento || '').trim() || 'Sin departamento';

    const muni = (row.enrollmentMunicipio || '').trim() || 'Sin municipio';

    const rate = row.attendance.attendanceRate ?? 0;

    const attending = isAttendingRow(row) ? 1 : 0;



    const deptRow = deptMap.get(dept) ?? { count: 0, rateSum: 0, attending: 0 };

    deptRow.count += 1;

    deptRow.rateSum += rate;

    deptRow.attending += attending;

    deptMap.set(dept, deptRow);



    const muniKey = `${dept}::${muni}`;

    const muniRow =

      muniMap.get(muniKey) ?? { name: muni, departamento: dept, count: 0, rateSum: 0, attending: 0 };

    muniRow.count += 1;

    muniRow.rateSum += rate;

    muniRow.attending += attending;

    muniMap.set(muniKey, muniRow);

  }



  const byDepartamento = [...deptMap.entries()]

    .map(([name, stats]) => ({

      name,

      count: stats.count,

      attending: stats.attending,

      avgPct: Math.round((stats.rateSum / stats.count) * 100),

    }))

    .sort((a, b) => b.count - a.count);



  const byMunicipio = [...muniMap.values()]

    .map((m) => ({

      name: m.name,

      departamento: m.departamento,

      count: m.count,

      attending: m.attending,

      avgPct: Math.round((m.rateSum / m.count) * 100),

    }))

    .sort((a, b) => b.count - a.count);



  return {

    byDepartamento,

    byMunicipio,

    departamentosCount: byDepartamento.filter((d) => d.name !== 'Sin departamento').length,

    municipiosCount: byMunicipio.filter((m) => m.name !== 'Sin municipio').length,

  };

}



export async function fetchCourseEnrollmentIndex(

  courseId: string,

): Promise<CourseEnrollmentIndex | null> {

  if (!courseId || typeof window === 'undefined') return null;



  const url = `/data/course/enrollment_${encodeURIComponent(courseId)}.json`;

  let res: Response;
  try {
    res = await fetch(url, { credentials: 'same-origin' });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) return null;


  let data: CourseEnrollmentIndex;
  try {
    data = (await res.json()) as CourseEnrollmentIndex;
  } catch {
    return null;
  }

  if (!data?.byDocument) return null;

  return data;

}



export function attachEnrollmentToReport(

  report: CourseAttendanceReport,

  index: CourseEnrollmentIndex | null,

): CourseAttendanceReport {

  const rows = index

    ? report.rows.map((row) => {

        const entry = lookupEnrollmentEntry(index, row);

        return {

          ...row,

          enrollmentKind: entry?.kind ?? 'unknown',

          enrollmentMunicipio: entry?.municipio,

          enrollmentDepartamento: entry?.departamento,

          enrollmentInstitucion: entry?.institucion,

          institution: row.institution || entry?.institucion || row.institution,

        };

      })

    : report.rows;



  const summary: CourseEnrollmentSummary = index

    ? {

        inscritosTotal: index.summary.inscritosTotal,

        inscritosBecado: index.summary.inscritosBecado,

        inscritosPago: index.summary.inscritosPago,

        inscritosUnknown: index.summary.inscritosUnknown,

        rosterEnrolled: rows.length,

        rosterBecado: rows.filter((r) => r.enrollmentKind === 'becado').length,

        rosterPago: rows.filter((r) => r.enrollmentKind === 'pago').length,

        attendingTotal: rows.filter(isAttendingRow).length,

        attendingBecado: rows.filter((r) => r.enrollmentKind === 'becado' && isAttendingRow(r)).length,

        attendingPago: rows.filter((r) => r.enrollmentKind === 'pago' && isAttendingRow(r)).length,

        notAttending: rows.filter((r) => !isAttendingRow(r)).length,

      }

    : {

        inscritosTotal: rows.length,

        inscritosBecado: 0,

        inscritosPago: 0,

        inscritosUnknown: rows.length,

        rosterEnrolled: rows.length,

        rosterBecado: 0,

        rosterPago: 0,

        attendingTotal: rows.filter(isAttendingRow).length,

        attendingBecado: 0,

        attendingPago: 0,

        notAttending: rows.filter((r) => !isAttendingRow(r)).length,

      };



  const rosterGeo = buildRosterGeoSummary(rows);



  return {

    ...report,

    rows,

    enrollmentSummary: summary,

    enrollmentGeoSummary: index?.geoSummary

      ? { inscritos: index.geoSummary, roster: rosterGeo }

      : { roster: rosterGeo },

  };

}



export { classifyVacacionalEnrollment, mergeEnrollmentKind };


