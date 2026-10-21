import type { AdminAttendanceReport } from '@features/admin/lib/fetchAdminCourseAttendanceReport';
import { computeAttendanceStreaks } from '@features/curso/lib/courseAttendanceStreaks';
import { filterVacacionalLiveRecentSessions } from '@features/curso/lib/courseVacacionalAttendance';

export type NationalBenchmark = {
  students: number;
  departments: number;
  municipalities: number;
  avgAttendancePct: number;
  medAttendancePct: number;
  avgHours: number;
  avgBestClassStreak: number;
  avgCurrentClassStreak: number;
  avgBestDayStreak: number;
  activeClassStreakNow: number;
  streak3Plus: number;
  streak0: number;
};

export type DepartmentCohortRow = {
  departamento: string;
  students: number;
  attending: number;
  avgPct: number;
  medPct: number;
  avgHours: number;
  avgBestStreak: number;
  avgCurrentStreak: number;
  streak3Plus: number;
  becado: number;
  pago: number;
  vsNationalPct: number;
  rank: number;
};

export type EnrollmentKindCohort = {
  kind: 'becado' | 'pago';
  students: number;
  avgPct: number;
  medPct: number;
  avgHours: number;
  avgBestStreak: number;
  streak3Plus: number;
};

export type NationalAttendanceStudy = {
  benchmark: NationalBenchmark;
  departments: DepartmentCohortRow[];
  maxDeptStudents: number;
  enrollmentKinds: EnrollmentKindCohort[];
  topDepartments: DepartmentCohortRow[];
  attentionDepartments: DepartmentCohortRow[];
};

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function deptKey(row: AdminAttendanceReport['rows'][number]): string {
  return (row.enrollmentDepartamento || '').trim() || 'Sin departamento';
}

export function computeNationalAttendanceStudy(
  report: AdminAttendanceReport,
): NationalAttendanceStudy {
  const rows = report.rows;
  const rates = rows.map((r) => r.attendance.attendanceRate ?? 0);
  const nationalAvgPct = rates.length
    ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100)
    : 0;
  const nationalMedPct = Math.round(median(rates) * 100);

  const deptSet = new Set<string>();
  const muniSet = new Set<string>();

  let sumHours = 0;
  let sumBestClass = 0;
  let sumCurrentClass = 0;
  let sumBestDay = 0;
  let streak3Plus = 0;
  let streak0 = 0;
  let activeClassStreakNow = 0;

  type RowScratch = {
    rate: number;
    hours: number;
    bestClass: number;
    currentClass: number;
    bestDay: number;
    kind: string;
    attending: boolean;
  };

  const scratch: RowScratch[] = [];

  for (const row of rows) {
    const dept = deptKey(row);
    if (dept !== 'Sin departamento') deptSet.add(dept);
    const muni = (row.enrollmentMunicipio || '').trim();
    if (muni) muniSet.add(`${dept}::${muni}`);

    const streaks = computeAttendanceStreaks(
      filterVacacionalLiveRecentSessions(row.recentSessions, report.courseId),
      report.weekSchedules,
      report.courseId,
    );

    const rate = row.attendance.attendanceRate ?? 0;
    const hours = row.attendance.attendedHours ?? 0;
    const attending = (row.attendance.sessionsAttended ?? 0) > 0;

    sumHours += hours;
    sumBestClass += streaks.bestClassStreak;
    sumCurrentClass += streaks.currentClassStreak;
    sumBestDay += streaks.bestDayStreak;
    if (streaks.bestClassStreak >= 3) streak3Plus += 1;
    if (streaks.bestClassStreak === 0) streak0 += 1;
    if (streaks.currentClassStreak > 0) activeClassStreakNow += 1;

    scratch.push({
      rate,
      hours,
      bestClass: streaks.bestClassStreak,
      currentClass: streaks.currentClassStreak,
      bestDay: streaks.bestDayStreak,
      kind: row.enrollmentKind ?? 'unknown',
      attending,
    });
  }

  const n = rows.length || 1;
  const benchmark: NationalBenchmark = {
    students: rows.length,
    departments: deptSet.size,
    municipalities: muniSet.size,
    avgAttendancePct: nationalAvgPct,
    medAttendancePct: nationalMedPct,
    avgHours: sumHours / n,
    avgBestClassStreak: sumBestClass / n,
    avgCurrentClassStreak: sumCurrentClass / n,
    avgBestDayStreak: sumBestDay / n,
    activeClassStreakNow,
    streak3Plus,
    streak0,
  };

  const deptMap = new Map<
    string,
    {
      rates: number[];
      hours: number[];
      bestStreaks: number[];
      currentStreaks: number[];
      attending: number;
      becado: number;
      pago: number;
    }
  >();

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const s = scratch[i];
    const dept = deptKey(row);
    const bucket = deptMap.get(dept) ?? {
      rates: [],
      hours: [],
      bestStreaks: [],
      currentStreaks: [],
      attending: 0,
      becado: 0,
      pago: 0,
    };
    bucket.rates.push(s.rate);
    bucket.hours.push(s.hours);
    bucket.bestStreaks.push(s.bestClass);
    bucket.currentStreaks.push(s.currentClass);
    if (s.attending) bucket.attending += 1;
    if (s.kind === 'becado') bucket.becado += 1;
    if (s.kind === 'pago') bucket.pago += 1;
    deptMap.set(dept, bucket);
  }

  const departments: DepartmentCohortRow[] = [...deptMap.entries()]
    .map(([departamento, bucket]) => {
      const students = bucket.rates.length;
      const avgPct = Math.round(
        (bucket.rates.reduce((a, b) => a + b, 0) / students) * 100,
      );
      return {
        departamento,
        students,
        attending: bucket.attending,
        avgPct,
        medPct: Math.round(median(bucket.rates) * 100),
        avgHours: bucket.hours.reduce((a, b) => a + b, 0) / students,
        avgBestStreak:
          bucket.bestStreaks.reduce((a, b) => a + b, 0) / students,
        avgCurrentStreak:
          bucket.currentStreaks.reduce((a, b) => a + b, 0) / students,
        streak3Plus: bucket.bestStreaks.filter((v) => v >= 3).length,
        becado: bucket.becado,
        pago: bucket.pago,
        vsNationalPct: avgPct - nationalAvgPct,
        rank: 0,
      };
    })
    .sort((a, b) => b.avgPct - a.avgPct || b.students - a.students);

  departments.forEach((d, i) => {
    d.rank = i + 1;
  });

  const maxDeptStudents = Math.max(1, ...departments.map((d) => d.students));

  const kindMap = new Map<
    'becado' | 'pago',
    { rates: number[]; hours: number[]; bestStreaks: number[] }
  >();

  for (let i = 0; i < scratch.length; i += 1) {
    const kind = rows[i].enrollmentKind;
    if (kind !== 'becado' && kind !== 'pago') continue;
    const bucket = kindMap.get(kind) ?? { rates: [], hours: [], bestStreaks: [] };
    bucket.rates.push(scratch[i].rate);
    bucket.hours.push(scratch[i].hours);
    bucket.bestStreaks.push(scratch[i].bestClass);
    kindMap.set(kind, bucket);
  }

  const enrollmentKinds: EnrollmentKindCohort[] = (['becado', 'pago'] as const).map((kind) => {
    const bucket = kindMap.get(kind);
    if (!bucket || !bucket.rates.length) {
      return {
        kind,
        students: 0,
        avgPct: 0,
        medPct: 0,
        avgHours: 0,
        avgBestStreak: 0,
        streak3Plus: 0,
      };
    }
    const students = bucket.rates.length;
    return {
      kind,
      students,
      avgPct: Math.round((bucket.rates.reduce((a, b) => a + b, 0) / students) * 100),
      medPct: Math.round(median(bucket.rates) * 100),
      avgHours: bucket.hours.reduce((a, b) => a + b, 0) / students,
      avgBestStreak: bucket.bestStreaks.reduce((a, b) => a + b, 0) / students,
      streak3Plus: bucket.bestStreaks.filter((v) => v >= 3).length,
    };
  });

  const withMinStudents = departments.filter((d) => d.students >= 3);
  const topDepartments = withMinStudents.slice(0, 5);
  const attentionDepartments = [...withMinStudents].sort((a, b) => a.avgPct - b.avgPct).slice(0, 5);

  return {
    benchmark,
    departments,
    maxDeptStudents,
    enrollmentKinds,
    topDepartments,
    attentionDepartments,
  };
}
