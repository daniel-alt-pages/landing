'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  Trophy,
  Users,
} from 'lucide-react';
import AdminAttendanceRankingPanel from './AdminAttendanceRankingPanel';
import AdminAttendanceStudentModal from './AdminAttendanceStudentModal';
import AdminSeguimientoScope from './adminSeguimientoScope';
import {
  adminSeguimientoGhostButtonClass,
  adminSeguimientoIconButtonClass,
  adminSeguimientoInputClass,
  adminSeguimientoMenuClass,
  adminSeguimientoMenuItemClass,
  adminSeguimientoPanelClass,
  adminSeguimientoPrimaryButtonClass,
  adminSeguimientoRateClass,
  adminSeguimientoRowClass,
  adminSeguimientoSelectClass,
  adminSeguimientoTabClass,
  adminSeguimientoTabGroupClass,
} from './adminSeguimientoUi';
import CourseAttendanceAnalytics from './CourseAttendanceAnalytics';
import EnrollmentKindBadge from './EnrollmentKindBadge';
import type { CourseEnrollmentKind } from '@features/curso/lib/courseEnrollmentKind';
import { useCourseTheme } from '@features/curso/hooks/useCourseTheme';
import {
  buildAllDimensionRankings,
  entryForPerson,
  ranksByPerson,
} from '@features/curso/lib/courseAttendanceRanking';
import {
  scheduledSessionsForReport,
  sessionDurationLabel,
  sessionStatusText,
  weekAttendanceRate,
} from '@features/curso/lib/courseAttendanceWeek';
import { formatHoursLabel } from '@features/curso/lib/courseMeetAttendance';
import type { CourseRecentSession } from '@features/curso/types/courseTypes';
import {
  bogotaTodayKey,
  clampWeekIndex,
  formatWeekHeading,
  listVacacionalAcademicWeekRanges,
  weekIndexForDate,
} from '@features/curso/lib/courseVacacionalWeek';
import {
  exportAttendanceReportCsv,
  exportAttendanceSessionsDetailCsv,
  fetchAdminCourseAttendanceReport,
  formatAttendedMinutesLabel,
  type AdminAttendanceReport,
  type AdminAttendanceReportRow,
} from '@features/admin/lib/fetchAdminCourseAttendanceReport';

const DEFAULT_COURSE_ID = 'preicfes-sg26';

type Scope = 'week' | 'course';
type MonitorView = 'analytics' | 'students' | 'ranking';

function shortClassLabel(topic?: string): string {
  if (!topic) return 'Clase';
  const num = topic.match(/CLASE\s*#?\s*(\d+)/i);
  if (num) return `Clase ${num[1]}`;
  const area = topic.match(/AREA\s*\(([^)]+)\)/i);
  if (area) return area[1].trim();
  return topic.length > 48 ? `${topic.slice(0, 45)}…` : topic;
}

function sessionBadgeClass(status?: CourseRecentSession['status']): string {
  if (status === 'present') return 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25';
  if (status === 'partial') return 'bg-amber-500/15 text-amber-100 border-amber-500/25';
  if (status === 'upcoming' || status === 'live-soon') {
    return 'bg-violet-500/15 text-violet-200 border-violet-500/25';
  }
  return 'bg-rose-500/10 text-rose-200 border-rose-500/20';
}

function StudentWeekDetail({
  row,
  weekIndex,
  weekSchedules,
}: {
  row: AdminAttendanceReportRow;
  weekIndex: number;
  weekSchedules: AdminAttendanceReport['weekSchedules'];
}) {
  const sessions = scheduledSessionsForReport(row.recentSessions, weekSchedules, weekIndex);

  if (!sessions.length) {
    return (
      <p className="px-4 py-3 text-sm text-[var(--course-text-muted)]">
        Sin clases programadas esta semana.
      </p>
    );
  }

  return (
    <div className="px-4 py-3 bg-[var(--course-surface-muted)]/40">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[var(--course-text-muted)] text-left">
            <th className="pb-2 pr-3 font-medium">Fecha</th>
            <th className="pb-2 pr-3 font-medium">Clase</th>
            <th className="pb-2 pr-3 font-medium">Entrada</th>
            <th className="pb-2 pr-3 font-medium">Salida</th>
            <th className="pb-2 pr-3 font-medium">Tiempo</th>
            <th className="pb-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={`${session.sessionId}-${session.date}`} className="border-t border-[var(--course-border)]">
              <td className="py-2 pr-3 text-[var(--course-text-muted)] whitespace-nowrap">{session.date}</td>
              <td className="py-2 pr-3 text-[var(--course-text)] max-w-[14rem]">
                <span title={session.topic}>{shortClassLabel(session.topic)}</span>
              </td>
              <td className="py-2 pr-3 text-[var(--course-accent)]/90 tabular-nums whitespace-nowrap">
                {session.joinedAt || '—'}
              </td>
              <td className="py-2 pr-3 text-[var(--course-accent)]/90 tabular-nums whitespace-nowrap">
                {session.leftAt || '—'}
              </td>
              <td className="py-2 pr-3 text-[var(--course-text-muted)] tabular-nums whitespace-nowrap">
                {sessionDurationLabel(session)}
              </td>
              <td className="py-2">
                <span
                  className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${sessionBadgeClass(session.status)}`}
                >
                  {sessionStatusText(session)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CourseAttendanceMonitor() {
  return (
    <AdminSeguimientoScope>
      <CourseAttendanceMonitorInner />
    </AdminSeguimientoScope>
  );
}

function CourseAttendanceMonitorInner() {
  const { dark } = useCourseTheme();
  const [report, setReport] = useState<AdminAttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyWarnings, setOnlyWarnings] = useState(false);
  const [enrollmentFilter, setEnrollmentFilter] = useState<'all' | CourseEnrollmentKind>('all');
  const [departamentoFilter, setDepartamentoFilter] = useState('all');
  const [weekIndex, setWeekIndex] = useState(0);
  const [scope, setScope] = useState<Scope>('week');
  const [monitorView, setMonitorView] = useState<MonitorView>('analytics');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [selectedStudentKey, setSelectedStudentKey] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminCourseAttendanceReport(DEFAULT_COURSE_ID);
      setReport(data);
      if (data.weeks.length) {
        const weekRanges = listVacacionalAcademicWeekRanges(DEFAULT_COURSE_ID, data.bounds);
        const todayIdx = weekIndexForDate(weekRanges, bogotaTodayKey());
        setWeekIndex(clampWeekIndex(todayIdx, weekRanges));
      }
      if (!data.rows.length) {
        setError('No hay datos. Revisa roster o ejecuta sync de asistencia.');
      }
    } catch {
      setError('Error cargando reporte.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedWeek = report?.weeks[weekIndex] ?? null;
  const weekProgram = report?.weekSchedules[weekIndex] ?? [];
  const atFirstWeek = weekIndex <= 0;
  const atLastWeek = !report?.weeks.length || weekIndex >= report.weeks.length - 1;

  const departamentoOptions = useMemo(() => {
    if (!report?.rows.length) return [];
    const set = new Set<string>();
    for (const row of report.rows) {
      const dept = (row.enrollmentDepartamento || '').trim();
      if (dept) set.add(dept);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [report]);

  const filtered = useMemo(() => {
    if (!report) return [];
    const q = search.trim().toLowerCase();
    return report.rows.filter((row) => {
      if (onlyWarnings && !row.matchWarning) return false;
      if (enrollmentFilter !== 'all' && row.enrollmentKind !== enrollmentFilter) return false;
      if (
        departamentoFilter !== 'all' &&
        (row.enrollmentDepartamento || '').trim() !== departamentoFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        row.rosterName.toLowerCase().includes(q) ||
        (row.emailLower || '').includes(q) ||
        (row.documento || '').includes(q) ||
        (row.enrollmentMunicipio || '').toLowerCase().includes(q) ||
        (row.enrollmentDepartamento || '').toLowerCase().includes(q) ||
        (row.institution || '').toLowerCase().includes(q)
      );
    });
  }, [report, search, onlyWarnings, enrollmentFilter, departamentoFilter]);

  const rankings = useMemo(() => {
    if (!report?.rows.length) return null;
    return buildAllDimensionRankings(report.rows, report.weekSchedules);
  }, [report]);

  const ranksMap = useMemo(() => {
    if (!rankings) return new Map();
    return ranksByPerson(rankings);
  }, [rankings]);

  const selectedStudentRow = selectedStudentKey
    ? report?.rows.find((r) => r.personKey === selectedStudentKey)
    : undefined;
  const selectedStudentEntry =
    selectedStudentKey && rankings ? entryForPerson(rankings, selectedStudentKey) : undefined;

  const weekSummary = useMemo(() => {
    if (!report?.rows.length || !selectedWeek) {
      return { students: 0, avgPct: 0, scheduled: 0, warnings: 0, withAttendance: 0 };
    }
    const stats = report.rows.map((r) => r.weekStats[weekIndex]).filter(Boolean);
    const rates = stats.filter((s) => s.sessionsScheduled > 0).map(weekAttendanceRate);
    return {
      students: report.rows.length,
      avgPct: rates.length ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) : 0,
      scheduled: selectedWeek.scheduledClasses,
      warnings: report.warnings.length,
      withAttendance: stats.filter((s) => s.sessionsAttended > 0).length,
    };
  }, [report, selectedWeek, weekIndex]);

  const handleExportSummary = () => {
    if (!report?.rows.length) return;
    setExportOpen(false);
    const csv = exportAttendanceReportCsv(report, scope === 'week' ? weekIndex : null);
    downloadCsv(csv, `resumen-${report.courseId}-semana-${weekIndex + 1}.csv`);
  };

  const handleExportDetail = () => {
    if (!report?.rows.length) return;
    setExportOpen(false);
    const csv = exportAttendanceSessionsDetailCsv(report, scope === 'week' ? weekIndex : null);
    downloadCsv(csv, `detalle-${report.courseId}-semana-${weekIndex + 1}.csv`);
  };

  const courseSpanLabel = report ? formatWeekHeading(report.bounds.start, report.bounds.end) : '';

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--course-text)]">Asistencia vacacional</h2>
          <p className="text-sm text-[var(--course-text-muted)] mt-1">
            {courseSpanLabel || DEFAULT_COURSE_ID}
            {report?.source === 'firestore' ? ' · en línea' : ' · local'}
            {report?.enrollmentSummary ? (
              <>
                {' · '}
                <span>
                  {report.enrollmentSummary.inscritosTotal} inscritos ·{' '}
                  {report.enrollmentSummary.attendingTotal} asisten
                </span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={adminSeguimientoGhostButtonClass()}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              disabled={!report?.rows.length}
              className={adminSeguimientoPrimaryButtonClass()}
            >
              <Download className="w-4 h-4" />
              Exportar
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
            {exportOpen ? (
              <div className={adminSeguimientoMenuClass()}>
                <button type="button" onClick={handleExportSummary} className={adminSeguimientoMenuItemClass()}>
                  Resumen por estudiante
                </button>
                <button type="button" onClick={handleExportDetail} className={adminSeguimientoMenuItemClass()}>
                  Detalle entrada / salida
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={adminSeguimientoTabGroupClass()} role="tablist" aria-label="Vista seguimiento">
        <button
          type="button"
          role="tab"
          aria-selected={monitorView === 'analytics'}
          onClick={() => {
            setMonitorView('analytics');
            setExpandedKey(null);
          }}
          className={adminSeguimientoTabClass(monitorView === 'analytics', dark)}
        >
          <BarChart3 className="w-4 h-4" aria-hidden />
          Análisis
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={monitorView === 'students'}
          onClick={() => setMonitorView('students')}
          className={adminSeguimientoTabClass(monitorView === 'students', dark)}
        >
          <Users className="w-4 h-4" aria-hidden />
          Estudiantes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={monitorView === 'ranking'}
          onClick={() => {
            setMonitorView('ranking');
            setExpandedKey(null);
          }}
          className={adminSeguimientoTabClass(monitorView === 'ranking', dark)}
        >
          <Trophy className="w-4 h-4" aria-hidden />
          Ranking y rachas
        </button>
      </div>

      {monitorView === 'analytics' ? (
        <section className="space-y-2">
          <div>
            <h3 className="text-lg font-bold text-[var(--course-text)]">Panorama del curso</h3>
            <p className="mt-1 text-sm text-[var(--course-text-muted)]">
              KPIs, distribución, tendencia semanal e instituciones
            </p>
          </div>
          <CourseAttendanceAnalytics
            report={report}
            loading={loading}
            onStudentSelect={(key) => setSelectedStudentKey(key)}
          />
        </section>
      ) : null}

      {monitorView === 'ranking' ? (
        <AdminAttendanceRankingPanel report={report} loading={loading} error={error} />
      ) : null}

      {monitorView !== 'students' ? null : (
      <>
      <div className={adminSeguimientoTabGroupClass()}>
        <button
          type="button"
          onClick={() => setScope('week')}
          className={adminSeguimientoTabClass(scope === 'week', dark)}
        >
          Por semana
        </button>
        <button
          type="button"
          onClick={() => {
            setScope('course');
            setExpandedKey(null);
          }}
          className={adminSeguimientoTabClass(scope === 'course', dark)}
        >
          Todo el curso
        </button>
      </div>

      {scope === 'week' && report?.weeks.length ? (
        <section className={`${adminSeguimientoPanelClass()} p-4 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
                disabled={atFirstWeek}
                className={adminSeguimientoIconButtonClass()}
                aria-label="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="min-w-[10rem] text-center">
                <p className="text-sm font-semibold text-[var(--course-text)]">
                  Semana {weekIndex + 1} de {report.weeks.length}
                </p>
                <p className="text-xs text-[var(--course-text-muted)] capitalize">{selectedWeek?.heading}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setWeekIndex((i) =>
                    report.weeks.length ? Math.min(report.weeks.length - 1, i + 1) : i,
                  )
                }
                disabled={atLastWeek}
                className={adminSeguimientoIconButtonClass()}
                aria-label="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--course-text-muted)]">
              <span>
                <strong className="text-[var(--course-text)]">{weekSummary.scheduled}</strong> clases programadas
              </span>
              <span>
                <strong className="text-[var(--course-text)]">{weekSummary.withAttendance}</strong> con asistencia
              </span>
              <span>
                Promedio{' '}
                <strong className={adminSeguimientoRateClass(weekSummary.avgPct / 100)}>
                  {weekSummary.avgPct}%
                </strong>
              </span>
              {weekSummary.warnings > 0 ? (
                <span className="text-amber-300">{weekSummary.warnings} sin match Meet</span>
              ) : null}
            </div>
          </div>

          {weekProgram.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={() => setShowSchedule((v) => !v)}
                className="flex items-center gap-2 text-xs font-medium text-[var(--course-accent)] transition hover:brightness-110"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                {showSchedule ? 'Ocultar' : 'Ver'} calendario de la semana
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${showSchedule ? 'rotate-180' : ''}`}
                />
              </button>
              {showSchedule ? (
                <ol className="mt-3 space-y-1.5 border-l-2 border-[var(--course-accent)]/30 pl-4">
                  {weekProgram.map((planned) => (
                    <li key={planned.sessionId} className="text-sm">
                      <span className="font-semibold text-[var(--course-text)]">{planned.date}</span>
                      <span className="text-[var(--course-text-muted)] mx-2">—</span>
                      <span className="text-[var(--course-text-muted)]">{shortClassLabel(planned.topic)}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--course-text-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar estudiante…"
            className={adminSeguimientoInputClass()}
          />
        </div>
        <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--course-border)] text-sm text-[var(--course-text-muted)] cursor-pointer shrink-0 transition hover:bg-[var(--course-surface-muted)]/40">
          <input
            type="checkbox"
            checked={onlyWarnings}
            onChange={(e) => setOnlyWarnings(e.target.checked)}
            className="rounded accent-[var(--course-accent)]"
          />
          Solo alertas Meet
        </label>
        <select
          value={enrollmentFilter}
          onChange={(e) => setEnrollmentFilter(e.target.value as 'all' | CourseEnrollmentKind)}
          className={adminSeguimientoSelectClass()}
          aria-label="Filtrar por inscripción"
        >
          <option value="all">Todas inscripciones</option>
          <option value="becado">Solo becado</option>
          <option value="pago">Solo pago</option>
          <option value="unknown">Sin clasificar</option>
        </select>
        <select
          value={departamentoFilter}
          onChange={(e) => setDepartamentoFilter(e.target.value)}
          className={`${adminSeguimientoSelectClass()} max-w-[11rem]`}
          aria-label="Filtrar por departamento"
        >
          <option value="all">Todos departamentos</option>
          {departamentoOptions.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-100 text-sm">
          {error}
        </div>
      ) : null}

      <div className={adminSeguimientoPanelClass()}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--course-surface-muted)]/40 text-left text-xs text-[var(--course-text-muted)]">
                <th className="px-4 py-3 font-medium w-8" />
                <th className="px-4 py-3 font-medium">Estudiante</th>
                <th className="px-4 py-3 font-medium">Inscripción</th>
                {scope === 'week' ? (
                  <>
                    <th className="px-4 py-3 font-medium text-right">Clases</th>
                    <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Pend.</th>
                    <th className="px-4 py-3 font-medium text-right">%</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 font-medium text-right">Clases</th>
                    <th className="px-4 py-3 font-medium text-right">Tiempo</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={scope === 'week' ? 6 : 5} className="px-4 py-12 text-center text-[var(--course-text-muted)]">
                    Cargando…
                  </td>
                </tr>
              ) : null}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={scope === 'week' ? 6 : 5} className="px-4 py-12 text-center text-[var(--course-text-muted)]">
                    Sin resultados.
                  </td>
                </tr>
              ) : null}
              {!loading &&
                filtered.map((row) => {
                  const weekStats = row.weekStats[weekIndex];
                  const a = row.attendance;
                  const isExpanded = expandedKey === row.personKey;
                  const canExpand = scope === 'week' && (weekStats?.sessionsScheduled ?? 0) > 0;

                  if (scope === 'course') {
                    return (
                      <tr
                        key={row.personKey}
                        className={adminSeguimientoRowClass(selectedStudentKey === row.personKey)}
                        onClick={() => setSelectedStudentKey(row.personKey)}
                      >
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--course-text)] flex items-center gap-2">
                            {row.matchWarning ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : null}
                            {row.rosterName}
                          </p>
                          <p className="text-xs text-[var(--course-text-muted)] mt-0.5">{row.emailLower || '—'}</p>
                          {(row.enrollmentMunicipio || row.enrollmentDepartamento) ? (
                            <p className="text-[11px] text-[var(--course-accent)]/70 mt-0.5">
                              {[row.enrollmentMunicipio, row.enrollmentDepartamento]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <EnrollmentKindBadge kind={row.enrollmentKind} />
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--course-text)] tabular-nums">
                          {a.sessionsAttended ?? 0} / {a.sessionsCompleted ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--course-text)] tabular-nums">
                          {formatHoursLabel(a.attendedHours ?? 0)}
                        </td>
                      </tr>
                    );
                  }

                  const rate = weekStats ? weekAttendanceRate(weekStats) : 0;
                  const attended = weekStats?.sessionsAttended ?? 0;
                  const scheduled = weekStats?.sessionsScheduled ?? 0;
                  const pending = weekStats?.sessionsPending ?? 0;
                  const progress =
                    scheduled > 0 ? Math.round((attended / scheduled) * 100) : 0;

                  return (
                    <Fragment key={row.personKey}>
                      <tr
                        className={adminSeguimientoRowClass(
                          isExpanded || selectedStudentKey === row.personKey,
                        )}
                        onClick={() => setSelectedStudentKey(row.personKey)}
                      >
                        <td className="px-4 py-3 text-[var(--course-text-muted)]">
                          {canExpand ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedKey(isExpanded ? null : row.personKey);
                              }}
                              className="rounded-md p-1 transition hover:bg-[var(--course-surface-muted)] hover:text-[var(--course-text)]"
                              aria-label={isExpanded ? 'Ocultar semana' : 'Expandir semana'}
                              aria-expanded={isExpanded}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </button>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--course-text)] flex items-center gap-2">
                            {row.matchWarning ? (
                              <span title="Revisar nombre en Meet">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              </span>
                            ) : null}
                            {row.rosterName}
                          </p>
                          <p className="text-xs text-[var(--course-text-muted)] mt-0.5">{row.emailLower || '—'}</p>
                          {(row.enrollmentMunicipio || row.enrollmentDepartamento) ? (
                            <p className="text-[11px] text-[var(--course-accent)]/70 mt-0.5">
                              {[row.enrollmentMunicipio, row.enrollmentDepartamento]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <EnrollmentKindBadge kind={row.enrollmentKind} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-semibold text-[var(--course-text)] tabular-nums">
                            {attended} / {scheduled}
                          </p>
                          <div className="mt-1.5 h-1 w-20 ml-auto rounded-full bg-[var(--course-surface-muted)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--course-accent)] transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span
                            className={
                              pending > 0
                                ? 'text-violet-300 font-medium'
                                : 'text-[var(--course-text-muted)]'
                            }
                          >
                            {pending}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-semibold tabular-nums ${adminSeguimientoRateClass(rate)}`}
                        >
                          {scheduled > 0 ? `${Math.round(rate * 100)}%` : '—'}
                        </td>
                      </tr>
                      {isExpanded && report ? (
                        <tr className="border-t border-[var(--course-border)]">
                          <td colSpan={6} className="p-0">
                            <StudentWeekDetail
                              row={row}
                              weekIndex={weekIndex}
                              weekSchedules={report.weekSchedules}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {scope === 'week' ? (
        <p className="text-xs text-[var(--course-text-muted)] text-center">
          Toca una fila para el detalle completo · chevron para clases de la semana.
        </p>
      ) : (
        <p className="text-xs text-[var(--course-text-muted)] text-center">
          Toca una fila para ver ranking, puntos y sesiones del estudiante.
        </p>
      )}
      </>
      )}

      {selectedStudentRow && selectedStudentEntry && report ? (
        <AdminAttendanceStudentModal
          row={selectedStudentRow}
          entry={selectedStudentEntry}
          report={report}
          ranksByPerson={ranksMap}
          onClose={() => setSelectedStudentKey(null)}
        />
      ) : null}
    </div>
  );
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
