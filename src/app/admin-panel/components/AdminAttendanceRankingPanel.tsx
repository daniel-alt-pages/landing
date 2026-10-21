'use client';

import { useMemo, useState } from 'react';
import { HelpCircle, Search, Trophy } from 'lucide-react';
import type { AdminAttendanceReport } from '@features/admin/lib/fetchAdminCourseAttendanceReport';
import {
  ATTENDANCE_RANKING_SORT_LABELS,
  ATTENDANCE_RANKING_SORTS,
  attendanceRankingMetricNumber,
  attendanceRankingMetricValue,
  buildAllDimensionRankings,
  entryForPerson,
  ranksByPerson,
  type AttendanceRankingSort,
} from '@features/curso/lib/courseAttendanceRanking';
import { useCourseTheme } from '@features/curso/hooks/useCourseTheme';
import RankingMethodologyModal from '@features/curso/pages/seguimiento/components/RankingMethodologyModal';
import RankingPodium, {
  type RankingPodiumEntry,
} from '@features/curso/pages/seguimiento/components/RankingPodium';
import RankingStreakBadge from '@features/curso/pages/seguimiento/components/RankingStreakBadge';
import {
  courseRankingMedalClass,
  seguimientoTabClass,
} from '@features/curso/pages/seguimiento/lib/seguimientoUi';
import {
  streakTier,
  streakTierBorderClass,
} from '@features/curso/pages/seguimiento/lib/seguimientoStreakUi';
import { SgSkeletonCard } from '@shared/components/SgSkeleton';
import SgEmptyState from '@shared/components/SgEmptyState';
import SgStudentAvatar from '@shared/components/SgStudentAvatar';
import AdminAttendanceStudentModal from './AdminAttendanceStudentModal';
import { AdminModalLightScope } from './adminModalLightScope';
import { useProfilePhotos } from '@/hooks/useProfilePhotos';
import { photoUrlForPerson } from '@/lib/personPhotoLookup';
import RankingStudentContextPanel, {
  RankingStudentContextMobileLine,
} from '@features/curso/pages/seguimiento/components/RankingStudentContextPanel';
import { VACACIONAL_COURSE_DISPLAY_LABEL } from '@features/curso/pages/seguimiento/lib/seguimientoLabels';

type AdminAttendanceRankingPanelProps = {
  report: AdminAttendanceReport | null;
  loading?: boolean;
  error?: string | null;
};

function RankingMedal({ rank, dark }: { rank: number; dark: boolean }) {
  const size = rank <= 3 ? 'h-9 w-9 text-xs' : 'h-8 w-8 text-[11px]';
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg font-black tabular-nums shadow-sm ${size} ${courseRankingMedalClass(rank, dark)}`}
    >
      #{rank}
    </div>
  );
}

function AdminAttendanceRankingBody({
  report,
  loading,
  error,
}: AdminAttendanceRankingPanelProps) {
  const { dark } = useCourseTheme();
  const [sort, setSort] = useState<AttendanceRankingSort>('overall');
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const { photos } = useProfilePhotos(!loading && Boolean(report?.rows.length));

  const rankings = useMemo(() => {
    if (!report?.rows.length) return null;
    return buildAllDimensionRankings(report.rows, report.weekSchedules, report.excusas);
  }, [report]);

  const ranksMap = useMemo(() => {
    if (!rankings) return new Map();
    return ranksByPerson(rankings);
  }, [rankings]);

  const list = rankings?.[sort] ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((e) => {
      const row = report?.rows.find((r) => r.personKey === e.personKey);
      if (!row) return e.displayLabel.toLowerCase().includes(q);
      return (
        row.rosterName.toLowerCase().includes(q) ||
        (row.emailLower || '').includes(q) ||
        (row.documento || '').includes(q) ||
        (row.institution || '').toLowerCase().includes(q) ||
        (row.enrollmentDepartamento || '').toLowerCase().includes(q) ||
        (row.enrollmentMunicipio || '').toLowerCase().includes(q)
      );
    });
  }, [list, search, report]);

  const podiumEntries = useMemo((): RankingPodiumEntry[] => {
    if (!report?.rows.length) return [];
    return filtered.slice(0, 3).map((entry) => {
      const row = report.rows.find((r) => r.personKey === entry.personKey);
      const isOverall = sort === 'overall';
      return {
        personKey: entry.personKey,
        name: row?.rosterName || entry.displayLabel,
        score: isOverall
          ? entry.compositeScore ?? 0
          : attendanceRankingMetricNumber(entry, sort),
        scoreDisplay: isOverall ? undefined : attendanceRankingMetricValue(entry, sort),
        sessionsAttended: entry.sessionsAttended,
        sessionsTotal: entry.sessionsTotal || entry.sessionsCompleted,
        attendanceRate: entry.attendanceRate,
        dayStreak: entry.dayStreak,
        photoUrl: photoUrlForPerson(photos, entry.personKey, row),
        isYou: false,
      };
    });
  }, [filtered, report, photos, sort]);

  const selectedRow = selectedKey
    ? report?.rows.find((r) => r.personKey === selectedKey)
    : undefined;
  const selectedEntry =
    selectedKey && rankings ? entryForPerson(rankings, selectedKey) : undefined;

  if (loading) return <SgSkeletonCard lines={8} />;

  if (error || !report?.rows.length || !rankings) {
    return (
      <SgEmptyState
        icon={Trophy}
        title="Ranking sin datos"
        message={error || 'No hay estudiantes en el roster o falta sync de asistencia.'}
      />
    );
  }

  const sortLabel = ATTENDANCE_RANKING_SORT_LABELS[sort];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--course-accent)]/30 bg-[var(--course-accent)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--course-accent)]"
        >
          <Trophy className="h-3.5 w-3.5" aria-hidden />
          Ranking vacacional · Admin
        </span>
        <button
          type="button"
          onClick={() => setShowMethodology(true)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--course-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--course-text-muted)] transition hover:bg-[var(--course-surface-muted)]/60 hover:text-[var(--course-text)]"
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
          ¿Cómo se calcula?
        </button>
      </div>

      <div
        className="flex gap-1 overflow-x-auto pb-1"
        role="group"
        aria-label="Dimensión del ranking"
      >
        {ATTENDANCE_RANKING_SORTS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSort(key)}
            className={`${seguimientoTabClass(sort === key, dark)} shrink-0`}
            aria-pressed={sort === key}
          >
            {ATTENDANCE_RANKING_SORT_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--course-text-muted)]"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar estudiante, institución o departamento…"
          className="w-full rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--course-text)] placeholder:text-[var(--course-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--course-accent)]/40"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--course-text-muted)]">
        <span>{filtered.length} estudiantes</span>
        <span>·</span>
        <span>Orden: {sortLabel}</span>
      </div>

      <RankingPodium entries={podiumEntries} dark={dark} onSelect={setSelectedKey} />

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--course-text-muted)]">Sin resultados.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((entry, index) => {
            const rank = index + 1;
            const row = report.rows.find((r) => r.personKey === entry.personKey);
            const name = row?.rosterName || entry.displayLabel;
            const tier = streakTier(entry.dayStreak);
            const borderClass = streakTierBorderClass(tier, dark);
            const metric = attendanceRankingMetricValue(entry, sort);

            return (
              <li key={entry.personKey}>
                <button
                  type="button"
                  onClick={() => setSelectedKey(entry.personKey)}
                  className={`flex w-full flex-wrap items-stretch gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition sm:flex-nowrap sm:px-4 bg-[var(--course-surface)] ${borderClass} hover:brightness-[1.02]`}
                >
                  <div className="flex min-w-0 shrink-0 items-center gap-3">
                    <RankingMedal rank={rank} dark={dark} />
                    <RankingStreakBadge dayStreak={entry.dayStreak} size="sm" />
                    <SgStudentAvatar
                      name={name}
                      photoUrl={photoUrlForPerson(photos, entry.personKey, row)}
                      sizeClass="h-9 w-9 sm:h-10 sm:w-10"
                      roundedClass="rounded-full"
                      fallbackClassName="bg-[var(--course-surface-muted)] text-[var(--course-text-muted)]"
                    />
                  </div>
                  <div className="min-w-0 flex-1 basis-[8rem] sm:basis-[10rem]">
                    <p className="truncate text-sm font-semibold text-[var(--course-text)]">{name}</p>
                    <p className="truncate text-[10px] text-[var(--course-text-muted)]">
                      {VACACIONAL_COURSE_DISPLAY_LABEL}
                    </p>
                    <RankingStudentContextMobileLine row={row} />
                  </div>
                  <RankingStudentContextPanel row={row} variant="inline" className="min-w-[9rem] max-w-[17rem]" />
                  <div className="ml-auto shrink-0 text-right">
                    <p className="text-base font-black tabular-nums text-[var(--course-text)]">
                      {metric}
                    </p>
                    {sort === 'overall' ? (
                      <p className="text-[10px] font-semibold text-[var(--course-text-muted)]">pts</p>
                    ) : (
                      <p className="text-[10px] font-semibold text-[var(--course-text-muted)]">
                        {sortLabel}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-[11px] text-[var(--course-text-muted)]">
        Toca el podio o una fila para ver detalle y puestos por dimensión.
      </p>

      {showMethodology ? (
        <AdminModalLightScope>
          <RankingMethodologyModal onClose={() => setShowMethodology(false)} />
        </AdminModalLightScope>
      ) : null}

      {selectedRow && selectedEntry ? (
        <AdminAttendanceStudentModal
          row={selectedRow}
          entry={selectedEntry}
          report={report}
          ranksByPerson={ranksMap}
          onClose={() => setSelectedKey(null)}
        />
      ) : null}
    </div>
  );
}

export default function AdminAttendanceRankingPanel(props: AdminAttendanceRankingPanelProps) {
  return <AdminAttendanceRankingBody {...props} />;
}
