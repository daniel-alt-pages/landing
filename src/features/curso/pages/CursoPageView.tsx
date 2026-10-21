'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { CourseVacacionalCalendarProvider, useCourseVacacionalCalendar } from '../context/CourseVacacionalCalendarContext';
import CourseAccessGate from '../components/CourseAccessGate';
import CourseEmptyState from '../components/CourseEmptyState';
import CoursePanelChrome, {
  COURSE_PANEL_CHROME_HEIGHT,
  COURSE_PANEL_CHROME_HEIGHT_GRABACIONES,
} from '../components/CoursePanelChrome';
import { CourseRecordingsFiltersProvider } from '../context/CourseRecordingsFiltersContext';
import { CourseThemeProvider } from '../context/CourseThemeContext';
import CourseSectionTabs from '../components/CourseSectionTabs';
import CoursePanelSectionTransition from '../components/CoursePanelSectionTransition';
import CourseSelector from '../components/CourseSelector';
import { useCourseMetrics } from '../hooks/useCourseMetrics';
import { useCourseSectionRoute } from '../hooks/useCourseSectionRoute';
import { useCourseTheme } from '../hooks/useCourseTheme';
import { useCourseWorkspace } from '../hooks/useCourseWorkspace';
import {
  buildCourseCalendarEmbedInput,
  resolveCourseCalendarProgram,
  VACACIONAL_CALENDAR_LABEL,
} from '../lib/courseCalendarConfig';
import {
  coursePanelCacheVersion,
  coursePanelNeedsCalendar,
  peekCoursePanelSnapshot,
  writeCoursePanelSnapshot,
} from '../lib/coursePanelCache';
import { SgSkeletonCard } from '@shared/components/SgSkeleton';

const ResumenSection = dynamic(() => import('./resumen/ResumenSection'), {
  loading: () => <SgSkeletonCard lines={4} />,
});

const GrabacionesSection = dynamic(() => import('./grabaciones/GrabacionesSection'), {
  loading: () => <SgSkeletonCard lines={5} />,
});

const MaterialesSection = dynamic(() => import('./materiales/MaterialesSection'), {
  loading: () => <SgSkeletonCard lines={4} />,
});

const ClasesSection = dynamic(() => import('./clases/ClasesSection'), {
  loading: () => <SgSkeletonCard lines={4} />,
});

const SeguimientoPanel = dynamic(
  () => import('./seguimiento/SeguimientoPanel'),
  { loading: () => <SgSkeletonCard lines={4} /> },
);

export default function CursoPageView() {
  return (
    <CourseAccessGate>
      <CourseThemeProvider>
        <Suspense fallback={<SgSkeletonCard lines={4} />}>
          <CursoPageContent />
        </Suspense>
      </CourseThemeProvider>
    </CourseAccessGate>
  );
}

function CursoPageContent() {
  const {
    course,
    courseIds,
    selectedCourseId,
    selectCourse,
    initialLoading,
    refreshing: workspaceRefreshing,
    error,
    entitlements,
  } = useCourseWorkspace();
  const { tab } = useCourseSectionRoute();

  const calendarPresentation = useMemo(() => {
    if (!course) {
      return {
        embedInput: undefined as string | undefined,
        program: null as ReturnType<typeof resolveCourseCalendarProgram>,
        title: 'Calendario de clases',
        subtitle: 'Horarios del curso · zona horaria Colombia',
      };
    }
    const program = resolveCourseCalendarProgram(course);
    const isVacacional = program === 'vacacional';
    return {
      embedInput: buildCourseCalendarEmbedInput(course),
      program,
      title: isVacacional ? VACACIONAL_CALENDAR_LABEL : `Horarios · ${course.name}`,
      subtitle: isVacacional
        ? 'Solo clases del programa vacacional · no incluye calendarios por área'
        : 'Horarios del curso · zona horaria Colombia',
    };
  }, [course]);

  const isVacacionalProgram =
    Boolean(course) && calendarPresentation.program === 'vacacional';

  const calendarEnabled = coursePanelNeedsCalendar(tab, isVacacionalProgram);

  return (
    <CourseRecordingsFiltersProvider>
      <CourseVacacionalCalendarProvider
        enabled={calendarEnabled}
        courseId={selectedCourseId}
        courseStartDate={course?.courseStartDate}
        courseEndDate={course?.courseEndDate}
      >
        <CursoPagePanel
          course={course}
          courseIds={courseIds}
          selectedCourseId={selectedCourseId}
          selectCourse={selectCourse}
          initialLoading={initialLoading}
          workspaceRefreshing={workspaceRefreshing}
          error={error}
          entitlements={entitlements}
          tab={tab}
          calendarPresentation={calendarPresentation}
          isVacacionalProgram={isVacacionalProgram}
        />
      </CourseVacacionalCalendarProvider>
    </CourseRecordingsFiltersProvider>
  );
}

type CursoPagePanelProps = {
  course: ReturnType<typeof useCourseWorkspace>['course'];
  courseIds: string[];
  selectedCourseId: string;
  selectCourse: (id: string) => void;
  initialLoading: boolean;
  workspaceRefreshing: boolean;
  error: string | null;
  entitlements: ReturnType<typeof useCourseWorkspace>['entitlements'];
  tab: ReturnType<typeof useCourseSectionRoute>['tab'];
  calendarPresentation: {
    embedInput?: string;
    program: ReturnType<typeof resolveCourseCalendarProgram> | null;
    title: string;
    subtitle: string;
  };
  isVacacionalProgram: boolean;
};

function CursoPagePanel({
  course,
  courseIds,
  selectedCourseId,
  selectCourse,
  initialLoading,
  workspaceRefreshing,
  error,
  entitlements,
  tab,
  calendarPresentation,
  isVacacionalProgram,
}: CursoPagePanelProps) {
  const { pendingRecordingId, navigateToTab } = useCourseSectionRoute();
  const calendar = useCourseVacacionalCalendar();
  const panelSnapshot = useMemo(() => {
    if (!selectedCourseId || !courseIds.includes(selectedCourseId)) return null;
    const version = coursePanelCacheVersion(
      calendar.runtimeVersion,
      calendar.attendanceVersion,
    );
    return peekCoursePanelSnapshot(selectedCourseId, version);
  }, [calendar.attendanceVersion, calendar.runtimeVersion, courseIds, selectedCourseId]);
  const displayCourse = course ?? panelSnapshot?.course ?? null;

  const metricsEnabled = tab === 'seguimiento' || tab === 'resumen';
  const {
    metrics,
    loading: metricsLoading,
    refreshing: metricsRefreshing,
    error: metricsError,
    studentName,
  } = useCourseMetrics(selectedCourseId, metricsEnabled);
  const displayMetrics = metrics ?? panelSnapshot?.metrics ?? null;

  const { dark } = useCourseTheme();
  const [grabacionesMounted, setGrabacionesMounted] = useState(tab === 'grabaciones');

  const showSeguimiento = entitlements?.features.seguimiento ?? false;

  const onGrabacionesTab = tab === 'grabaciones';
  const chromeHeight = onGrabacionesTab
    ? COURSE_PANEL_CHROME_HEIGHT_GRABACIONES
    : COURSE_PANEL_CHROME_HEIGHT;

  const courseLabels = useMemo(() => {
    const map: Record<string, string> = {};
    if (displayCourse) map[displayCourse.id] = displayCourse.name;
    courseIds.forEach((id) => {
      if (!map[id]) map[id] = id;
    });
    return map;
  }, [displayCourse, courseIds]);

  const showCourseShell = Boolean(displayCourse) || initialLoading;
  const sectionLoading =
    (tab === 'seguimiento' && metricsLoading && !displayMetrics) ||
    (tab === 'resumen' && metricsEnabled && metricsLoading && !displayMetrics) ||
    (onGrabacionesTab && !displayCourse && initialLoading);

  const vacacionalCalendarEnabled =
    Boolean(displayCourse) && calendarPresentation.program === 'vacacional';

  const openGrabacionesTab = (recordingId?: string) => {
    navigateToTab('grabaciones', { recordingId: recordingId ?? null });
  };

  useEffect(() => {
    document.documentElement.classList.add('course-panel-route');
    document.body.classList.add('course-panel-route');
    return () => {
      document.documentElement.classList.remove('course-panel-route');
      document.body.classList.remove('course-panel-route');
    };
  }, []);

  useEffect(() => {
    if (tab === 'grabaciones') setGrabacionesMounted(true);
  }, [tab]);

  useEffect(() => {
    if (!selectedCourseId || !displayCourse) return;
    writeCoursePanelSnapshot({
      courseId: selectedCourseId,
      course: displayCourse,
      entitlements: entitlements ?? null,
      metrics: displayMetrics,
      calendarVersion: calendar.runtimeVersion ?? panelSnapshot?.calendarVersion ?? null,
      attendanceVersion: calendar.attendanceVersion ?? panelSnapshot?.attendanceVersion ?? null,
      updatedAt: Date.now(),
    });
  }, [
    selectedCourseId,
    displayCourse,
    entitlements,
    displayMetrics,
    calendar.runtimeVersion,
    calendar.attendanceVersion,
    panelSnapshot?.calendarVersion,
    panelSnapshot?.attendanceVersion,
  ]);

  useEffect(() => {
    if (!displayCourse) return;

    const prefetchSections = () => {
      void import('./grabaciones/GrabacionesSection');
      void import('./clases/ClasesSection');
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetchSections, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(prefetchSections, 900);
    return () => window.clearTimeout(timer);
  }, [displayCourse?.id]);

  const courseTabs = (
    <>
      {tab === 'resumen' ? (
        sectionLoading ? (
          <SgSkeletonCard lines={4} />
        ) : (
          <ResumenSection
            course={displayCourse}
            metrics={displayMetrics}
            metricsLoading={metricsLoading}
            studentName={studentName}
            entitlements={entitlements}
            onOpenTab={navigateToTab}
            sectionLoading={false}
            error={error}
            hasCourse={Boolean(displayCourse)}
          />
        )
      ) : null}

      {displayCourse && grabacionesMounted ? (
        <GrabacionesSection
          active={onGrabacionesTab}
          course={displayCourse}
          showVacacionalCalendar={vacacionalCalendarEnabled}
          linkGeminiFromCalendar={isVacacionalProgram}
          initialRecordingId={pendingRecordingId}
          onNavigateHome={() => navigateToTab('resumen')}
        />
      ) : null}

      {tab === 'materiales' && displayCourse ? (
        <MaterialesSection
          course={displayCourse}
          showVacacionalCalendar={vacacionalCalendarEnabled}
          onOpenClasesTab={() => navigateToTab('clases')}
        />
      ) : null}

      {tab === 'clases' && displayCourse ? (
        <ClasesSection
          course={displayCourse}
          calendarEmbedUrl={calendarPresentation.embedInput}
          calendarProgram={calendarPresentation.program ?? undefined}
          calendarTitle={calendarPresentation.title}
          calendarSubtitle={calendarPresentation.subtitle}
          onOpenGrabacionesTab={openGrabacionesTab}
        />
      ) : null}

      {tab === 'seguimiento' ? (
        sectionLoading ? (
          <SgSkeletonCard lines={4} />
        ) : (
          <SeguimientoPanel
            metrics={displayMetrics}
            loading={metricsLoading && !displayMetrics}
            error={metricsError}
            studentName={studentName}
            courseId={displayCourse?.id ?? selectedCourseId}
          />
        )
      ) : null}
    </>
  );

  const showBackgroundRefresh =
    workspaceRefreshing || metricsRefreshing || (Boolean(displayCourse) && !course);

  return (
    <div
      className={`course-panel relative isolate min-h-dvh w-full max-w-full overflow-x-clip pb-6 ${
        showCourseShell
          ? 'max-lg:pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]'
          : ''
      } ${dark ? 'dark' : ''}`}
      style={{
        backgroundColor: 'var(--course-bg)',
        backgroundImage: onGrabacionesTab
          ? undefined
          : 'linear-gradient(to bottom, var(--course-bg-gradient-from), var(--course-bg-gradient-via), var(--course-bg))',
        paddingTop: `var(--course-panel-chrome-height, ${chromeHeight})`,
      }}
    >
      {showCourseShell && (
        <CoursePanelChrome
          course={displayCourse}
          tab={tab}
          entitlementsMode={entitlements?.mode}
          showSeguimiento={showSeguimiento}
          onNavigateTab={navigateToTab}
        />
      )}

      {showBackgroundRefresh ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-0.5 overflow-hidden"
          aria-hidden
        >
          <div className="h-full w-1/3 animate-pulse bg-[var(--course-accent)]/80" />
        </div>
      ) : null}

      {!onGrabacionesTab ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="course-panel-orb absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl"
            style={{ backgroundColor: 'var(--course-orb-a)' }}
          />
          <div
            className="course-panel-orb course-panel-orb--delay absolute right-0 top-32 h-80 w-80 translate-x-1/3 rounded-full blur-3xl"
            style={{ backgroundColor: 'var(--course-orb-b)' }}
          />
        </div>
      ) : null}

      <div
        className="relative z-[1] mx-auto min-w-0 max-w-7xl px-4 py-4 sm:px-6 sm:py-6"
      >
        {initialLoading && !displayCourse ? (
          <div data-sg-panel-stuck="true">
            <SgSkeletonCard lines={4} />
          </div>
        ) : error && !displayCourse ? (
          <CourseEmptyState title="No pudimos cargar el curso" message={error} />
        ) : showCourseShell ? (
          <div className="space-y-6">
            {courseIds.length > 1 ? (
              <CourseSelector
                courseIds={courseIds}
                selectedCourseId={selectedCourseId}
                labels={courseLabels}
                onSelect={selectCourse}
              />
            ) : null}

            <CoursePanelSectionTransition sectionKey={tab}>{courseTabs}</CoursePanelSectionTransition>
          </div>
        ) : (
          <CourseEmptyState />
        )}
      </div>

      {showCourseShell ? (
        <CourseSectionTabs
          active={tab}
          onChange={navigateToTab}
          showSeguimiento={showSeguimiento}
        />
      ) : null}
    </div>
  );
}
