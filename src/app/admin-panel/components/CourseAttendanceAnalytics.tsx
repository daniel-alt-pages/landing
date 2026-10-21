'use client';

import { useMemo } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  MapPin,
} from 'lucide-react';
import type { AdminAttendanceReport } from '@features/admin/lib/fetchAdminCourseAttendanceReport';
import {
  ATTENDANCE_RANKING_SORT_LABELS,
  type AttendanceRankingSort,
} from '@features/curso/lib/courseAttendanceRanking';
import { CURSO_SEGUIMIENTO_ICONS } from '@features/curso/lib/courseSeguimientoIcons';
import { formatHoursLabel } from '@features/curso/lib/courseMeetAttendance';
import {
  SeguimientoDualMetricClip,
  SeguimientoMetricClip,
  SeguimientoSection,
} from '@features/curso/pages/seguimiento/components/SeguimientoClips';
import { pluralClases } from '@features/curso/pages/seguimiento/lib/seguimientoMetricCopy';
import { SgSkeletonCard } from '@shared/components/SgSkeleton';
import SgEmptyState from '@shared/components/SgEmptyState';
import {
  BUCKET_BAR_CLASS,
  computeAdminAttendanceAnalytics,
  type GroupWeekTrendPoint,
} from '@features/admin/lib/adminAttendanceAnalytics';
import type { CourseEnrollmentGeoSlice } from '@features/curso/lib/courseEnrollmentIndex';
import AdminNationalStudyPanel from './AdminNationalStudyPanel';

type Props = {
  report: AdminAttendanceReport | null;
  loading: boolean;
  onStudentSelect?: (personKey: string) => void;
};

const CHART_HEIGHT_PX = 128;

function GeoSliceList({
  items,
  maxCount,
  showAttendance = false,
  showDeptOnMuni = false,
}: {
  items: Array<CourseEnrollmentGeoSlice & { departamento?: string }>;
  maxCount: number;
  showAttendance?: boolean;
  showDeptOnMuni?: boolean;
}) {
  if (!items.length) {
    return <p className="text-sm text-[var(--course-text-muted)]">Sin datos geográficos.</p>;
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 8).map((item) => (
        <div
          key={`${item.name}-${item.departamento ?? ''}`}
          className="flex items-center gap-2 rounded-lg px-1 py-0.5 transition hover:bg-[var(--course-surface-muted)]/40"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--course-text)] truncate" title={item.name}>
              {item.name}
              {showDeptOnMuni && item.departamento ? (
                <span className="text-[var(--course-text-muted)]"> · {item.departamento}</span>
              ) : null}
            </p>
            <div className="mt-1 h-1.5 rounded-full bg-[var(--course-surface-muted)] overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500/80 transition-all duration-500"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            {showAttendance && item.avgPct != null ? (
              <p className="text-xs font-bold tabular-nums text-[var(--course-text)]">{item.avgPct}%</p>
            ) : null}
            <p className="text-[10px] text-[var(--course-text-muted)] tabular-nums">
              {item.count} insc.
              {showAttendance && item.attending != null ? ` · ${item.attending} asisten` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WeekTrendBar({ point }: { point: GroupWeekTrendPoint }) {
  const pct = point.avgPct ?? 0;
  const barHeight =
    point.status === 'active' ? Math.max(6, Math.round((pct / 100) * CHART_HEIGHT_PX)) : 6;

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[3.25rem] flex-1">
      <span className="text-[11px] font-bold tabular-nums text-[var(--course-text)]">
        {point.status === 'active' ? `${pct}%` : point.status === 'pending' ? '—' : '·'}
      </span>
      <div
        className="w-full flex items-end justify-center"
        style={{ height: CHART_HEIGHT_PX }}
        title={point.heading}
      >
        <div
          className={`w-full max-w-[2.5rem] rounded-t-lg transition-all ${
            point.status === 'active'
              ? 'bg-gradient-to-t from-violet-600 to-fuchsia-400/90 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
              : point.status === 'pending'
                ? 'border border-dashed border-violet-400/40 bg-violet-500/10'
                : 'border border-white/10 bg-white/5'
          }`}
          style={{ height: barHeight }}
        />
      </div>
      <div className="text-center w-full">
        <p className="text-[10px] font-semibold text-[var(--course-text)]">{point.shortLabel}</p>
        <p className="text-[9px] leading-tight text-[var(--course-text-muted)] line-clamp-2">
          {point.scheduledClasses > 0
            ? `${point.attended}/${point.completed || point.scheduled} clases`
            : 'Sin programa'}
        </p>
      </div>
    </div>
  );
}

function CourseAttendanceAnalyticsBody({
  report,
  onStudentSelect,
}: {
  report: AdminAttendanceReport;
  onStudentSelect?: (personKey: string) => void;
}) {
  const analytics = useMemo(() => computeAdminAttendanceAnalytics(report), [report]);
  const enrollment = report.enrollmentSummary;
  const geo = report.enrollmentGeoSummary;
  const inscritosDept = geo?.inscritos?.byDepartamento ?? [];
  const rosterDept = geo?.roster?.byDepartamento ?? [];
  const inscritosMuni = geo?.inscritos?.byMunicipio ?? [];
  const maxInscritosDept = Math.max(1, ...inscritosDept.map((d) => d.count));
  const maxRosterDept = Math.max(1, ...rosterDept.map((d) => d.count));
  const maxInscritosMuni = Math.max(1, ...inscritosMuni.map((m) => m.count));

  const dimensionBars = (
    [
      'sessionsAttended',
      'attendedHours',
      'classStreak',
      'attendanceRate',
    ] as AttendanceRankingSort[]
  ).map((sort) => {
    const list = analytics.rankings[sort];
    const top = list.slice(0, Math.min(20, list.length));
    const avg =
      top.length
        ? top.reduce((acc, e) => {
            if (sort === 'attendanceRate') return acc + e.attendanceRate;
            if (sort === 'attendedHours') return acc + e.attendedHours;
            if (sort === 'classStreak') return acc + e.classStreak;
            return acc + e.sessionsAttended;
          }, 0) / top.length
        : 0;
    return { sort, avg };
  });

  return (
    <div className="space-y-5">
      {enrollment ? (
        <SeguimientoSection
          title="Inscripción vacacional"
          subtitle="Becado o pago · sin detalle de montos"
          accent="accent"
        >
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            <SeguimientoMetricClip
              iconSrc={CURSO_SEGUIMIENTO_ICONS.clasesProgramadas}
              labelTitle="Inscritos (vacacional)"
              labelSpec={`${enrollment.inscritosBecado} becado · ${enrollment.inscritosPago} pago`}
              value={String(enrollment.inscritosTotal)}
              tone="accent"
            />
            <SeguimientoMetricClip
              iconSrc={CURSO_SEGUIMIENTO_ICONS.tasaSemanal}
              labelTitle="En roster Mi Curso"
              labelSpec={`${enrollment.rosterBecado} becado · ${enrollment.rosterPago} pago`}
              value={String(enrollment.rosterEnrolled)}
              tone="violet"
            />
            <SeguimientoMetricClip
              iconSrc={CURSO_SEGUIMIENTO_ICONS.asistenciasCompletas}
              labelTitle="Asisten al curso"
              labelSpec={`${enrollment.attendingBecado} becado · ${enrollment.attendingPago} pago`}
              value={String(enrollment.attendingTotal)}
              tone="default"
            />
            <SeguimientoDualMetricClip
              iconSrc={CURSO_SEGUIMIENTO_ICONS.ausencia}
              labelTitle="Sin asistencia"
              labelSpec="En roster, 0 clases"
              primary={{ shortLabel: 'Sin asistir', value: String(enrollment.notAttending) }}
              secondary={{
                shortLabel: 'Tasa',
                value:
                  enrollment.rosterEnrolled > 0
                    ? `${Math.round((enrollment.attendingTotal / enrollment.rosterEnrolled) * 100)}%`
                    : '—',
              }}
              tone="orange"
            />
          </div>
        </SeguimientoSection>
      ) : null}

      <SeguimientoSection
        title="Panorama del grupo"
        subtitle={`${analytics.total} estudiantes · ${analytics.totalSessionsAttended} asistencias registradas`}
        accent="violet"
      >
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <SeguimientoMetricClip
            iconSrc={CURSO_SEGUIMIENTO_ICONS.clasesProgramadas}
            labelTitle="Estudiantes en roster"
            labelSpec={`${analytics.matchWarnings} alertas Meet · ${analytics.perfect} al 100%`}
            value={String(analytics.total)}
            tone="violet"
          />
          <SeguimientoMetricClip
            iconSrc={CURSO_SEGUIMIENTO_ICONS.tasaGlobal}
            labelTitle="Asistencia media (curso)"
            labelSpec={`Mediana ${Math.round(analytics.medRate * 100)}%`}
            value={`${Math.round(analytics.avgRate * 100)}%`}
            tone="accent"
          />
          <SeguimientoMetricClip
            iconSrc={CURSO_SEGUIMIENTO_ICONS.horas}
            labelTitle="Horas en vivo (total)"
            labelSpec={`Promedio ${formatHoursLabel(analytics.avgHours)}`}
            value={formatHoursLabel(analytics.totalHours)}
            tone="default"
          />
          <SeguimientoDualMetricClip
            iconSrc={CURSO_SEGUIMIENTO_ICONS.tasaSemanal}
            labelTitle="Riesgo y desempeño"
            labelSpec="Menos de 50% vs 80% o más"
            primary={{ shortLabel: 'Riesgo', value: String(analytics.below50) }}
            secondary={{ shortLabel: 'Alto', value: String(analytics.above80) }}
            tone="orange"
          />
        </div>
      </SeguimientoSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <SeguimientoSection
          title="Distribución de asistencia"
          subtitle="Porcentaje acumulado del curso por estudiante"
          accent="neutral"
        >
          <div className="space-y-2.5">
            {analytics.buckets.map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-3">
                <span className="w-14 text-xs font-medium tabular-nums text-[var(--course-text-muted)]">
                  {bucket.label}
                </span>
                <div className="flex-1 h-8 rounded-xl bg-[var(--course-surface-muted)] overflow-hidden">
                  <div
                    className={`h-full rounded-xl ${BUCKET_BAR_CLASS[bucket.tone]} transition-all`}
                    style={{ width: `${(bucket.count / analytics.maxBucket) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-bold tabular-nums text-[var(--course-text)]">
                  {bucket.count}
                </span>
              </div>
            ))}
          </div>
        </SeguimientoSection>

        <SeguimientoSection
          title="Rachas del grupo"
          subtitle="Clases y días · mismo criterio que Mi Curso"
          accent="neutral"
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            <SeguimientoMetricClip
              streakDayCount={Math.round(analytics.maxClassStreak)}
              labelTitle="Racha máxima (clases)"
              labelSpec={`Media mejor racha ${analytics.avgBestClassStreak.toFixed(1)}`}
              value={pluralClases(analytics.maxClassStreak)}
              tone="orange"
            />
            <SeguimientoMetricClip
              streakDayCount={Math.max(1, Math.round(analytics.avgCurrentClassStreak))}
              labelTitle="Racha activa ahora"
              labelSpec={`${analytics.streak3Plus} con mejor racha ≥3`}
              value={String(analytics.activeClassStreakNow)}
              tone="accent"
            />
            <SeguimientoMetricClip
              labelTitle="Sin racha de clases"
              labelSpec={`Media racha día ${analytics.avgBestDayStreak.toFixed(1)} · máx ${analytics.maxDayStreak} días`}
              value={String(analytics.streak0)}
              tone="default"
            />
          </div>
        </SeguimientoSection>
      </div>

      <SeguimientoSection
        title="Tendencia semanal del grupo"
        subtitle="Asistidas ÷ clases ya dictadas (no incluye semanas solo programadas)"
        accent="accent"
      >
        {analytics.activeWeeks.length === 0 ? (
          <p className="text-sm text-[var(--course-text-muted)]">
            Aún no hay semanas con clases dictadas en el registro.
          </p>
        ) : (
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
            {analytics.activeWeeks.map((point) => (
              <WeekTrendBar key={point.index} point={point} />
            ))}
          </div>
        )}
        {analytics.pendingWeeks.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {analytics.pendingWeeks.map((point) => (
              <span
                key={point.index}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-violet-500/30 bg-violet-500/5 px-2.5 py-1 text-[11px] text-[var(--course-text-muted)]"
                title={point.heading}
              >
                <CalendarDays className="h-3 w-3 text-violet-400" aria-hidden />
                {point.shortLabel}: pendiente ({point.scheduledClasses} programadas)
              </span>
            ))}
          </div>
        ) : null}
      </SeguimientoSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <SeguimientoSection title="Top 20 — media por dimensión" subtitle="Ranking interno" accent="neutral">
          <div className="space-y-3">
            {dimensionBars.map(({ sort, avg }) => {
              const max =
                sort === 'attendanceRate'
                  ? 1
                  : sort === 'attendedHours'
                    ? Math.max(1, analytics.rankings.attendedHours[0]?.attendedHours ?? 1)
                    : sort === 'classStreak'
                      ? Math.max(1, analytics.rankings.classStreak[0]?.classStreak ?? 1)
                      : Math.max(1, analytics.rankings.sessionsAttended[0]?.sessionsAttended ?? 1);
              const raw =
                sort === 'attendanceRate'
                  ? avg
                  : avg;
              const width = Math.round((raw / max) * 100);
              const display =
                sort === 'attendanceRate'
                  ? `${Math.round(avg * 100)}%`
                  : sort === 'attendedHours'
                    ? formatHoursLabel(avg)
                    : String(Math.round(avg));
              return (
                <div key={sort}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[var(--course-text)]">
                      {ATTENDANCE_RANKING_SORT_LABELS[sort]}
                    </span>
                    <span className="tabular-nums text-[var(--course-text-muted)]">{display}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--course-surface-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--course-accent)]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SeguimientoSection>

        <SeguimientoSection title="Instituciones" subtitle="Top 8 por matrícula" accent="neutral">
          <div className="space-y-2">
            {analytics.institutions.map((inst) => (
              <div key={inst.name} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--course-text)] truncate" title={inst.name}>
                    {inst.name}
                  </p>
                  <div className="mt-1 h-1.5 rounded-full bg-[var(--course-surface-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-500/80"
                      style={{ width: `${(inst.count / analytics.maxInstCount) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold tabular-nums text-[var(--course-text)]">{inst.avgPct}%</p>
                  <p className="text-[10px] text-[var(--course-text-muted)]">{inst.count} est.</p>
                </div>
              </div>
            ))}
          </div>
        </SeguimientoSection>
      </div>

      {geo ? (
        <SeguimientoSection
          title="Cobertura geográfica"
          subtitle="Municipio y departamento · CSV vacacional"
          accent="violet"
        >
          <div className="mb-4 flex flex-wrap gap-3 text-xs text-[var(--course-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-violet-400" aria-hidden />
              {geo.inscritos
                ? `${geo.inscritos.departamentosCount} departamentos · ${geo.inscritos.municipiosCount} municipios (inscritos)`
                : `${geo.roster.departamentosCount} departamentos · ${geo.roster.municipiosCount} municipios (roster)`}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {geo.inscritos ? (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-violet-300/90 mb-2">
                  Inscritos por departamento
                </h4>
                <GeoSliceList items={inscritosDept} maxCount={maxInscritosDept} />
              </div>
            ) : null}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-cyan-300/90 mb-2">
                Roster por departamento
              </h4>
              <GeoSliceList items={rosterDept} maxCount={maxRosterDept} showAttendance />
            </div>
            {geo.inscritos ? (
              <div className="lg:col-span-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-violet-300/90 mb-2">
                  Top municipios (inscritos)
                </h4>
                <GeoSliceList
                  items={inscritosMuni}
                  maxCount={maxInscritosMuni}
                  showDeptOnMuni
                />
              </div>
            ) : null}
          </div>
        </SeguimientoSection>
      ) : null}

      <SeguimientoSection
        title="Estudio comparativo nacional"
        subtitle="Departamentos vs referencia del cohorte · becado vs pago · rachas"
        accent="accent"
      >
        <div className="mb-3 flex items-center gap-2">
          <img
            src={CURSO_SEGUIMIENTO_ICONS.tasaGlobal}
            alt=""
            className="h-8 w-8 rounded-lg opacity-90"
          />
          <p className="text-xs text-[var(--course-text-muted)]">
            Comparación entre estudiantes según departamento (CSV vacacional) y métricas del roster.
          </p>
        </div>
        <AdminNationalStudyPanel study={analytics.nationalStudy} />
      </SeguimientoSection>

      <SeguimientoSection title="Destacados" subtitle="Líderes por dimensión" accent="violet">
        <div className="grid gap-2 sm:grid-cols-2">
          {analytics.rankingHighlights.map(({ key, label, entry }) => (
            <button
              key={key}
              type="button"
              onClick={() => entry?.personKey && onStudentSelect?.(entry.personKey)}
              disabled={!entry?.personKey || !onStudentSelect}
              className="rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/30 px-3 py-2.5 text-left transition hover:border-[var(--course-accent)]/40 hover:bg-[var(--course-accent)]/10 disabled:cursor-default disabled:opacity-80 active:scale-[0.98]"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-400/90">{label}</p>
              <p className="mt-0.5 text-sm font-bold text-[var(--course-text)]">
                {entry?.displayLabel ?? '—'}
              </p>
            </button>
          ))}
        </div>
        {analytics.matchWarnings > 0 ? (
          <p className="mt-3 flex items-start gap-2 text-xs text-amber-300/90">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
            {analytics.matchWarnings} estudiantes con posible desajuste nombre Meet ↔ roster. Revisa en
            Estudiantes → filtro alertas.
          </p>
        ) : null}
      </SeguimientoSection>
    </div>
  );
}

export default function CourseAttendanceAnalytics({
  report,
  loading,
  onStudentSelect,
}: Props) {
  if (loading) {
    return <SgSkeletonCard lines={10} />;
  }

  if (!report?.rows.length) {
    return (
      <SgEmptyState
        icon={BarChart3}
        title="Sin datos para analizar"
        message="Carga el reporte de asistencia o revisa roster / sync de Meet."
      />
    );
  }

  return (
    <CourseAttendanceAnalyticsBody report={report} onStudentSelect={onStudentSelect} />
  );
}
