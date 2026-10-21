'use client';

import { useEffect, useMemo, useState } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import RecordingsAreaNav from '@features/recordings/components/RecordingsAreaNav';
import RecordingGeminiNotesSection from '@features/recordings/components/RecordingGeminiNotesSection';
import RecordingsMobileFeed from '@features/recordings/components/RecordingsMobileFeed';
import RecordingsUpNextPanel from '@features/recordings/components/RecordingsUpNextPanel';
import RecordingsWatchHero from '@features/recordings/components/RecordingsWatchHero';
import SgEmptyState from '@shared/components/SgEmptyState';
import type { CourseCalendarEventDto } from '@features/curso/lib/courseCalendarTypes';
import {
  resolveRecordingGeminiNote,
  resolveRecordingEventDate,
  resolveRecordingSessionTitle,
  type RecordingGeminiNote,
} from '@features/curso/lib/courseRecordingGeminiNotes';
import { useCourseFavorites } from '@features/curso/hooks/useCourseFavorites';
import { useCourseProgress } from '@features/curso/hooks/useCourseProgress';
import { buildCourseSupportUrl } from '@/lib/supportWhatsApp';
import {
  applyRecordingsAreaSelection,
  groupRecordings,
  parseRecordingsAreaParam,
  type RecordingsCatalogMode,
} from '@features/recordings/lib/recordingsCatalog';
import { recordingsTheme } from '@features/recordings/lib/recordingsTheme';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';
import CourseRecordingsSegmentTabs from '@features/curso/components/CourseRecordingsSegmentTabs';
import CourseRecordingsToolbar from '@features/curso/components/CourseRecordingsToolbar';
import { useCourseRecordingsFiltersOptional } from '@features/curso/context/CourseRecordingsFiltersContext';
import {
  COURSE_RECORDING_SEGMENT_LABELS,
  countSimRecordingsBySegment,
  courseRecordingCatalogSegment,
  filterSimRecordingsBySegment,
} from '@features/curso/lib/courseRecordingsSegments';
import type { CourseRecordingCatalogSegment } from '@features/recordings/lib/recordingsTypes';
import {
  loadCourseRecordingPlayback,
  saveCourseRecordingPlayback,
} from '@features/curso/lib/courseRecordingPlaybackSession';
import {
  EMPTY_COURSE_RECORDING_FILTERS,
  filterCourseSimRecordings,
  type CourseRecordingFilterState,
} from '@features/curso/lib/courseRecordingsFilters';
import { pruneStudentToolsFavorites } from '@features/curso/lib/studentToolsStore';

/** Lee ?area= sin useSearchParams — evita Suspense eterno dentro de next/dynamic + static export. */
function useAreaQueryParam(): string | null {
  const [area, setArea] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('area');
  });

  useEffect(() => {
    const sync = () => setArea(new URLSearchParams(window.location.search).get('area'));
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  return area;
}

type RecordingsCatalogViewProps = {
  simulationId: string;
  recordings: SimRecording[];
  homeHref: string;
  onNavigateHome?: () => void;
  variant?: 'light' | 'dark';
  catalogMode?: RecordingsCatalogMode;
  initialRecordingId?: string;
  courseName?: string;
  calendarEvents?: CourseCalendarEventDto[];
  calendarLoading?: boolean;
  geminiNotesIndex?: Map<string, RecordingGeminiNote>;
  /** Otra sección del curso visible (Grabaciones en keep-alive). */
  sectionInactive?: boolean;
};

export default function RecordingsCatalogView({
  simulationId,
  recordings,
  homeHref,
  onNavigateHome,
  variant = 'light',
  catalogMode = 'simulation',
  initialRecordingId,
  courseName,
  calendarEvents = [],
  calendarLoading = false,
  geminiNotesIndex,
  sectionInactive = false,
}: RecordingsCatalogViewProps) {
  const areaFromUrl = useAreaQueryParam();
  const isCourseCatalog = catalogMode === 'course';
  const filtersCtx = useCourseRecordingsFiltersOptional();
  const [localCourseFilters, setLocalCourseFilters] = useState<CourseRecordingFilterState>(
    EMPTY_COURSE_RECORDING_FILTERS,
  );
  const courseFilters = filtersCtx?.filters ?? localCourseFilters;
  const setCourseFilters = filtersCtx?.setFilters ?? setLocalCourseFilters;
  const patchCourseFilters = filtersCtx?.patchFilters;

  const { toggleRecordingFavorite, isRecordingFavorite } = useCourseFavorites(
    isCourseCatalog ? simulationId : null,
  );
  const { markOpened, isWatched } = useCourseProgress(
    isCourseCatalog ? simulationId : null,
    isCourseCatalog
      ? recordings.map((r) => ({
          id: r.id,
          title: r.title,
          sortOrder: r.sortOrder ?? 0,
          visibleToStudents: r.visibleToStudents !== false,
        }))
      : [],
  );

  const favoriteCount = useMemo(() => {
    if (!isCourseCatalog) return 0;
    return recordings.filter((r) => isRecordingFavorite(r.id)).length;
  }, [isCourseCatalog, recordings, isRecordingFavorite]);

  useEffect(() => {
    if (!isCourseCatalog || !recordings.length) return;
    pruneStudentToolsFavorites(simulationId, new Set(recordings.map((r) => r.id)));
  }, [isCourseCatalog, recordings, simulationId]);

  useEffect(() => {
    if (!isCourseCatalog || !courseFilters.favoritesOnly || favoriteCount > 0) return;
    if (patchCourseFilters) {
      patchCourseFilters({ favoritesOnly: false });
    } else {
      setLocalCourseFilters((prev) => ({ ...prev, favoritesOnly: false }));
    }
  }, [isCourseCatalog, courseFilters.favoritesOnly, favoriteCount, patchCourseFilters]);

  const [activeSegment, setActiveSegment] = useState<CourseRecordingCatalogSegment>('official');

  const segmentCounts = useMemo(
    () => (isCourseCatalog ? countSimRecordingsBySegment(recordings) : { official: 0, induction: 0 }),
    [isCourseCatalog, recordings],
  );

  // Si calendario aún no trae oficiales, no dejar el tab vacío: ir a inducciones.
  useEffect(() => {
    if (!isCourseCatalog || initialRecordingId) return;
    if (segmentCounts.official === 0 && segmentCounts.induction > 0 && activeSegment === 'official') {
      setActiveSegment('induction');
    }
  }, [
    isCourseCatalog,
    initialRecordingId,
    segmentCounts.official,
    segmentCounts.induction,
    activeSegment,
  ]);

  const segmentPool = useMemo(() => {
    if (!isCourseCatalog) return recordings;
    return filterSimRecordingsBySegment(recordings, activeSegment);
  }, [isCourseCatalog, recordings, activeSegment]);

  const catalogRecordings = useMemo(() => {
    if (!isCourseCatalog) return recordings;
    return filterCourseSimRecordings(segmentPool, courseFilters, {
      isFavorite: isRecordingFavorite,
      courseId: simulationId,
    });
  }, [isCourseCatalog, recordings, segmentPool, courseFilters, isRecordingFavorite]);

  const groups = useMemo(() => groupRecordings(catalogRecordings), [catalogRecordings]);

  const groupKeys = useMemo(() => groups.map((g) => g.key), [groups]);
  const [activeId, setActiveId] = useState(catalogRecordings[0]?.id ?? '');
  const [activeAreaKey, setActiveAreaKey] = useState(groups[0]?.key ?? '');
  const [isDesktop, setIsDesktop] = useState(true);
  const [catalogOpen, setCatalogOpen] = useState(true);

  const active =
    catalogRecordings.find((r) => r.id === activeId) ?? catalogRecordings[0] ?? null;
  const isDark = variant === 'dark';
  const baseTheme = recordingsTheme(variant);
  const theme = isCourseCatalog
    ? {
        ...baseTheme,
        sidebarCard:
          'rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] shadow-[var(--course-shadow)] xl:rounded-2xl',
        groupEyebrow: 'text-[var(--course-text-muted)]',
      }
    : baseTheme;
  const supportUrl = isCourseCatalog
    ? buildCourseSupportUrl(courseName ?? simulationId)
    : null;

  const geminiIndex = geminiNotesIndex ?? new Map<string, RecordingGeminiNote>();
  const activeGeminiNote = useMemo(() => {
    if (!active) return null;
    return resolveRecordingGeminiNote(active, geminiIndex, calendarEvents);
  }, [active, geminiIndex, calendarEvents]);

  const activeSessionTitle = useMemo(() => {
    if (!active || !isCourseCatalog) return null;
    return resolveRecordingSessionTitle(active, geminiIndex, calendarEvents);
  }, [active, isCourseCatalog, geminiIndex, calendarEvents]);

  const activeEventDate = useMemo(() => {
    if (!active || !isCourseCatalog) return null;
    return resolveRecordingEventDate(active, calendarEvents);
  }, [active, isCourseCatalog, calendarEvents]);

  const stickyTopClass = isCourseCatalog
    ? 'xl:sticky xl:top-[calc(var(--course-panel-chrome-height,6.75rem)+0.5rem)] xl:h-[calc(100dvh-var(--course-panel-chrome-height,6.75rem)-2rem)] xl:max-h-[calc(100dvh-var(--course-panel-chrome-height,6.75rem)-2rem)]'
    : 'xl:sticky xl:top-24 xl:h-[calc(100dvh-6rem)] xl:max-h-[calc(100dvh-6rem)]';

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const sync = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      setCatalogOpen(desktop);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!initialRecordingId) return;
    const target =
      recordings.find((r) => r.id === initialRecordingId) ??
      recordings.find(
        (r) => r.driveFileId && initialRecordingId.includes(r.driveFileId),
      );
    if (!target) return;
    setActiveId(target.id);
    setActiveAreaKey(target.area);
    if (isCourseCatalog) setActiveSegment(courseRecordingCatalogSegment(target));
  }, [initialRecordingId, recordings, isCourseCatalog]);

  useEffect(() => {
    if (!isCourseCatalog || initialRecordingId) return;
    const saved = loadCourseRecordingPlayback(simulationId).activeId;
    if (saved && recordings.some((r) => r.id === saved)) {
      setActiveId(saved);
      const target = recordings.find((r) => r.id === saved);
      if (target) setActiveAreaKey(target.area);
    }
  }, [isCourseCatalog, initialRecordingId, recordings, simulationId]);

  useEffect(() => {
    if (catalogRecordings.some((r) => r.id === activeId)) return;
    const first = catalogRecordings[0];
    if (first) {
      setActiveId(first.id);
      setActiveAreaKey(first.area);
    }
  }, [catalogRecordings, activeId]);

  useEffect(() => {
    if (!groups.length) return;
    if (!groups.some((g) => g.key === activeAreaKey)) {
      setActiveAreaKey(groups[0].key);
    }
  }, [groups, activeAreaKey]);

  useEffect(() => {
    if (!groups.length || !areaFromUrl) return;
    const parsed = parseRecordingsAreaParam(areaFromUrl, groupKeys);
    if (!parsed) return;
    const selection = applyRecordingsAreaSelection(parsed, groups);
    if (!selection) return;
    setActiveAreaKey(selection.areaKey);
    if (selection.recordingId) setActiveId(selection.recordingId);
  }, [areaFromUrl, groupKeys, groups]);

  useEffect(() => {
    if (!isCourseCatalog || !active?.id) return;
    markOpened(active.id);
  }, [isCourseCatalog, active?.id, markOpened]);

  useEffect(() => {
    if (!isCourseCatalog || !active?.id) return;
    const snap = loadCourseRecordingPlayback(simulationId);
    snap.activeId = active.id;
    saveCourseRecordingPlayback(simulationId, snap);
  }, [isCourseCatalog, active?.id, simulationId]);

  const handleAreaChange = (areaKey: string) => {
    setActiveAreaKey(areaKey);
    const group = groups.find((g) => g.key === areaKey);
    const first = group?.items[0];
    if (first) setActiveId(first.id);
  };

  const handleSegmentChange = (segment: CourseRecordingCatalogSegment) => {
    setActiveSegment(segment);
    if (patchCourseFilters) {
      patchCourseFilters({ classType: 'all' });
    } else {
      setLocalCourseFilters((prev) => ({ ...prev, classType: 'all' }));
    }
    const inSegment = filterCourseSimRecordings(
      filterSimRecordingsBySegment(recordings, segment),
      { ...courseFilters, classType: 'all' },
      { isFavorite: isRecordingFavorite },
    );
    const first = inSegment[0];
    if (first) {
      setActiveId(first.id);
      setActiveAreaKey(first.area);
    }
  };

  const segmentTabs = isCourseCatalog ? (
    <CourseRecordingsSegmentTabs
      activeSegment={activeSegment}
      onSegmentChange={handleSegmentChange}
      counts={segmentCounts}
    />
  ) : null;

  const segmentTabsCompact = isCourseCatalog ? (
    <CourseRecordingsSegmentTabs
      activeSegment={activeSegment}
      onSegmentChange={handleSegmentChange}
      counts={segmentCounts}
      compact
    />
  ) : null;

  const listProps = {
    groups,
    activeId: active?.id,
    simulationId,
    variant,
    catalogMode,
    isCourseCatalog,
    isDark,
    sidebarCardClass: theme.sidebarCard,
    sidebarScrollClass: theme.sidebarScroll,
    groupEyebrowClass: theme.groupEyebrow,
    stickyTopClass,
    totalCount: catalogRecordings.length,
    onSelect: setActiveId,
    isRecordingFavorite: isCourseCatalog ? isRecordingFavorite : undefined,
    onToggleFavorite: isCourseCatalog ? toggleRecordingFavorite : undefined,
    isWatched: isCourseCatalog ? isWatched : undefined,
    calendarEvents: isCourseCatalog ? calendarEvents : undefined,
    geminiNotesIndex: isCourseCatalog ? geminiIndex : undefined,
    listTitle: isCourseCatalog ? COURSE_RECORDING_SEGMENT_LABELS[activeSegment] : undefined,
  };

  const courseToolbarMobile = isCourseCatalog ? (
    <div className="xl:hidden space-y-3">
      {segmentTabs}
      <CourseRecordingsToolbar
        allRecordings={segmentPool}
        filters={courseFilters}
        onFiltersChange={setCourseFilters}
        favoriteCount={favoriteCount}
        hideClassTypeFilter
        courseId={simulationId}
      />
    </div>
  ) : null;

  const courseToolbarSidebar = isCourseCatalog ? (
    <div className="space-y-3">
      {segmentTabsCompact}
      <CourseRecordingsToolbar
        allRecordings={segmentPool}
        filters={courseFilters}
        onFiltersChange={setCourseFilters}
        favoriteCount={favoriteCount}
        compact
        hideClassTypeFilter
        courseId={simulationId}
      />
    </div>
  ) : null;

  if (!recordings.length) {
    return (
      <p className="text-[var(--course-text-muted)]">
        Aún no hay grabaciones para {simulationId}.
      </p>
    );
  }

  if (isCourseCatalog && !catalogRecordings.length) {
    return (
      <>
        {segmentTabs}
        <CourseRecordingsToolbar
          allRecordings={segmentPool}
          filters={courseFilters}
          onFiltersChange={setCourseFilters}
          favoriteCount={favoriteCount}
          hideClassTypeFilter
          courseId={simulationId}
        />
        <SgEmptyState
          title={
            courseFilters.favoritesOnly ? 'Sin favoritos que coincidan' : 'Sin coincidencias'
          }
          message={
            courseFilters.favoritesOnly
              ? 'No hay favoritos con estos filtros. Quita filtros o marca la estrella en otra clase.'
              : 'Ninguna grabación coincide con los filtros. Prueba limpiarlos o ajusta la búsqueda.'
          }
        />
      </>
    );
  }

  if (!active) return null;

  return (
    <>
      {!isCourseCatalog && !catalogOpen && isDesktop ? (
        <div className="mb-3 hidden justify-end xl:flex">
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold ${
              isDark
                ? 'border-white/12 bg-white/[0.06] text-white/85'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
            Mostrar lista
          </button>
        </div>
      ) : null}

      <div
        className={`grid min-h-0 gap-5 xl:items-start xl:gap-4 ${
          catalogOpen && isDesktop
            ? 'xl:grid-cols-[minmax(0,1fr)_minmax(300px,402px)]'
            : 'xl:grid-cols-1'
        }`}
      >
        <div className="min-w-0 space-y-4">
          {isCourseCatalog ? (
            <div className="hidden xl:block">{segmentTabs}</div>
          ) : null}
          <RecordingsWatchHero
            active={active}
            catalogRecordings={catalogRecordings}
            simulationId={simulationId}
            variant={variant}
            catalogMode={catalogMode}
            isCourseCatalog={isCourseCatalog}
            isFavorite={isCourseCatalog ? isRecordingFavorite(active.id) : false}
            onToggleFavorite={
              isCourseCatalog ? () => toggleRecordingFavorite(active.id) : undefined
            }
            supportUrl={supportUrl}
            sessionTitle={activeSessionTitle}
            eventDate={activeEventDate}
            playbackSessionKey={isCourseCatalog ? simulationId : undefined}
            autoPictureInPicture={isCourseCatalog}
            sectionInactive={isCourseCatalog ? sectionInactive : false}
          />

          <RecordingGeminiNotesSection
            note={activeGeminiNote}
            loading={calendarLoading}
            courseId={isCourseCatalog ? simulationId : undefined}
            sessionTitle={activeSessionTitle}
          />

          {courseToolbarMobile}

          <RecordingsMobileFeed
            recordings={catalogRecordings}
            activeId={active.id}
            simulationId={simulationId}
            variant={variant}
            catalogMode={catalogMode}
            isCourseCatalog={isCourseCatalog}
            isDark={isDark}
            onSelect={setActiveId}
            isRecordingFavorite={listProps.isRecordingFavorite}
            onToggleFavorite={listProps.onToggleFavorite}
            isWatched={listProps.isWatched}
            calendarEvents={calendarEvents}
            geminiNotesIndex={geminiIndex}
            listTitle={listProps.listTitle}
          />
        </div>

        {catalogOpen && isDesktop ? (
          <RecordingsUpNextPanel
            {...listProps}
            flatRecordings={isCourseCatalog ? catalogRecordings : undefined}
            toolbar={courseToolbarSidebar}
            onClose={isCourseCatalog ? undefined : () => setCatalogOpen(false)}
          />
        ) : null}

        {!catalogOpen && isDesktop ? (
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className={`fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold shadow-lg xl:inline-flex ${
              isCourseCatalog
                ? 'border-[var(--course-border)] bg-[var(--course-surface)] text-[var(--course-text)] shadow-[var(--course-shadow)]'
                : isDark
                  ? 'border-white/12 bg-[#111827]/95 text-white/85'
                  : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
            Lista
          </button>
        ) : null}
      </div>

      {!isCourseCatalog ? (
        <RecordingsAreaNav
          groups={groups}
          activeAreaKey={activeAreaKey}
          onAreaChange={handleAreaChange}
          homeHref={homeHref}
          onNavigateHome={onNavigateHome}
          variant={variant}
        />
      ) : null}
    </>
  );
}
