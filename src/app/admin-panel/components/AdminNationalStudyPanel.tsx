'use client';

import type { DepartmentCohortRow, NationalAttendanceStudy } from '@features/admin/lib/adminNationalAttendanceStudy';
import { formatHoursLabel } from '@features/curso/lib/courseMeetAttendance';
import { pluralClases } from '@features/curso/pages/seguimiento/lib/seguimientoMetricCopy';

type Props = {
  study: NationalAttendanceStudy;
};

function VsNationalBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-[10px] text-[var(--course-text-muted)]">= nacional</span>;
  }
  const positive = delta > 0;
  return (
    <span
      className={`text-[10px] font-bold tabular-nums ${
        positive ? 'text-emerald-400' : 'text-rose-400'
      }`}
    >
      {positive ? '+' : ''}{delta}% vs nacional
    </span>
  );
}

function DepartmentTable({ rows, nationalAvg }: { rows: DepartmentCohortRow[]; nationalAvg: number }) {
  if (!rows.length) {
    return <p className="text-sm text-[var(--course-text-muted)]">Sin departamentos con datos.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--course-border)]">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[var(--course-surface-muted)]/50 text-left text-[var(--course-text-muted)]">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Departamento</th>
            <th className="px-3 py-2 font-medium text-right">Est.</th>
            <th className="px-3 py-2 font-medium text-right">Asisten</th>
            <th className="px-3 py-2 font-medium text-right">% media</th>
            <th className="px-3 py-2 font-medium text-right hidden sm:table-cell">Mediana</th>
            <th className="px-3 py-2 font-medium text-right hidden md:table-cell">Horas</th>
            <th className="px-3 py-2 font-medium text-right hidden md:table-cell">Racha</th>
            <th className="px-3 py-2 font-medium text-right hidden lg:table-cell">B/P</th>
            <th className="px-3 py-2 font-medium text-right">vs nacional</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.departamento}
              className="border-t border-[var(--course-border)] transition hover:bg-[var(--course-surface-muted)]/35"
            >
              <td className="px-3 py-2 tabular-nums text-[var(--course-text-muted)]">{row.rank}</td>
              <td className="px-3 py-2 font-medium text-[var(--course-text)] max-w-[10rem] truncate" title={row.departamento}>
                {row.departamento}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{row.students}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.attending}</td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold text-[var(--course-text)]">
                {row.avgPct}%
              </td>
              <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell">{row.medPct}%</td>
              <td className="px-3 py-2 text-right tabular-nums hidden md:table-cell text-[var(--course-text-muted)]">
                {formatHoursLabel(row.avgHours)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums hidden md:table-cell text-[var(--course-text-muted)]">
                {row.avgBestStreak.toFixed(1)} / {pluralClases(Math.round(row.avgCurrentStreak))}
              </td>
              <td className="px-3 py-2 text-right tabular-nums hidden lg:table-cell text-[var(--course-text-muted)]">
                {row.becado}/{row.pago}
              </td>
              <td className="px-3 py-2 text-right">
                <VsNationalBadge delta={row.avgPct - nationalAvg} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminNationalStudyPanel({ study }: Props) {
  const { benchmark, departments, enrollmentKinds } = study;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <div className="rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/30 px-3 py-2">
          <p className="text-[var(--course-text-muted)]">Referencia nacional (cohorte)</p>
          <p className="mt-1 text-lg font-black tabular-nums text-[var(--course-text)]">
            {benchmark.avgAttendancePct}%
          </p>
          <p className="text-[10px] text-[var(--course-text-muted)]">
            mediana {benchmark.medAttendancePct}% · {benchmark.students} est.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/30 px-3 py-2">
          <p className="text-[var(--course-text-muted)]">Cobertura territorial</p>
          <p className="mt-1 text-lg font-black tabular-nums text-[var(--course-text)]">
            {benchmark.departments} deptos
          </p>
          <p className="text-[10px] text-[var(--course-text-muted)]">{benchmark.municipalities} municipios</p>
        </div>
        <div className="rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/30 px-3 py-2">
          <p className="text-[var(--course-text-muted)]">Racha activa ahora</p>
          <p className="mt-1 text-lg font-black tabular-nums text-[var(--course-text)]">
            {benchmark.activeClassStreakNow}
          </p>
          <p className="text-[10px] text-[var(--course-text-muted)]">
            media {benchmark.avgCurrentClassStreak.toFixed(1)} clases · max {benchmark.avgBestClassStreak.toFixed(1)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/30 px-3 py-2">
          <p className="text-[var(--course-text-muted)]">Horas en vivo (media)</p>
          <p className="mt-1 text-lg font-black tabular-nums text-[var(--course-text)]">
            {formatHoursLabel(benchmark.avgHours)}
          </p>
        </div>
      </div>

      {enrollmentKinds.some((k) => k.students > 0) ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {enrollmentKinds
            .filter((k) => k.students > 0)
            .map((k) => (
              <div
                key={k.kind}
                className="rounded-xl border border-[var(--course-border)] px-3 py-2.5 bg-[var(--course-surface-muted)]/20"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-400/90">
                  {k.kind === 'becado' ? 'Becados' : 'Pago'} · {k.students} est.
                </p>
                <p className="mt-1 text-sm text-[var(--course-text)]">
                  <span className="font-black tabular-nums">{k.avgPct}%</span>
                  <span className="text-[var(--course-text-muted)]"> media · mediana {k.medPct}%</span>
                </p>
                <p className="text-[10px] text-[var(--course-text-muted)] mt-0.5">
                  {formatHoursLabel(k.avgHours)} · racha media {k.avgBestStreak.toFixed(1)} · {k.streak3Plus} con ≥3
                </p>
              </div>
            ))}
        </div>
      ) : null}

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-cyan-300/90 mb-2">
          Comparativo por departamento (todos)
        </h4>
        <DepartmentTable rows={departments} nationalAvg={benchmark.avgAttendancePct} />
      </div>
    </div>
  );
}
