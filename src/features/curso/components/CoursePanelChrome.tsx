'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Search } from 'lucide-react';
import type { CourseDoc, CourseSectionTab } from '../types/courseTypes';
import { courseSectionPath } from '../lib/courseRoutePaths';
import { isCourseOnlyShell } from '../lib/courseEntitlements';
import { logoutEstudianteSession } from '@/lib/studentSession';
import CourseGlobalSearch from './CourseGlobalSearch';
import CourseChromeSearchField from './CourseChromeSearchField';
import CourseThemeToggle from './CourseThemeToggle';
import CourseRecordingsSearchBar from './CourseRecordingsSearchBar';
import CoursePanelSectionTabs from './CoursePanelSectionTabs';

const SECTION_LABELS: Record<CourseSectionTab, string> = {
  resumen: 'Dashboard',
  herramientas: 'Dashboard',
  grabaciones: 'Grabaciones',
  materiales: 'Materiales',
  clases: 'Clases',
  seguimiento: 'Seguimiento',
};

type CoursePanelChromeProps = {
  course: CourseDoc | null;
  tab: CourseSectionTab;
  entitlementsMode?: 'results_only' | 'course_only' | 'unified';
  showSeguimiento?: boolean;
  onNavigateTab: (tab: CourseSectionTab, opts?: { recordingId?: string }) => void;
  /** Ranking en seguimiento: filtra roster ya cargado (sin fetch extra). */
  rankingSearch?: {
    value: string;
    onChange: (value: string) => void;
    active: boolean;
  };
};

export default function CoursePanelChrome({
  course,
  tab,
  entitlementsMode,
  showSeguimiento = false,
  onNavigateTab,
  rankingSearch,
}: CoursePanelChromeProps) {
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const [grabacionesSearchExpanded, setGrabacionesSearchExpanded] = useState(false);
  const isGrabaciones = tab === 'grabaciones';
  const isSeguimiento = tab === 'seguimiento';
  const showRankingSearch = Boolean(rankingSearch?.active);
  const showLogout = entitlementsMode === 'course_only' || isCourseOnlyShell();
  const backHref =
    entitlementsMode === 'course_only' ? courseSectionPath('resumen') : '/estudiante/dashboard';
  const backLabel = entitlementsMode === 'course_only' ? 'Mi Curso' : 'Panel';

  const handleLogout = async () => {
    await logoutEstudianteSession();
    router.replace('/login');
  };

  useEffect(() => {
    if (!isGrabaciones) setGrabacionesSearchExpanded(false);
  }, [isGrabaciones]);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncChromeHeight = () => {
      const heightPx = Math.ceil(header.getBoundingClientRect().height);
      const value = `${heightPx}px`;
      const panel = header.closest('.course-panel') as HTMLElement | null;
      panel?.style.setProperty('--course-panel-chrome-height', value);
      document.documentElement.style.setProperty('--course-panel-chrome-height', value);
    };

    syncChromeHeight();
    const ro = new ResizeObserver(syncChromeHeight);
    ro.observe(header);
    window.addEventListener('resize', syncChromeHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncChromeHeight);
      document.documentElement.style.removeProperty('--course-panel-chrome-height');
    };
  }, [
    course,
    isGrabaciones,
    isSeguimiento,
    showSeguimiento,
    showRankingSearch,
    tab,
    grabacionesSearchExpanded,
  ]);

  const grabacionesBackButton = (
    <button
      type="button"
      onClick={() => onNavigateTab('resumen')}
      className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium text-[var(--course-text)] transition hover:bg-[var(--course-surface-muted)] sm:px-2.5"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      <span className="sr-only sm:not-sr-only sm:inline">Dashboard</span>
    </button>
  );

  const chromeActions = (
    <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0 lg:gap-1.5">
      {showLogout ? (
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-[var(--course-border)] bg-[var(--course-surface)] text-[var(--course-text-muted)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
      <CourseThemeToggle />
    </div>
  );

  return (
    <header
      ref={headerRef}
      className="pointer-events-none fixed inset-x-0 top-0 z-[56]"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto max-w-7xl px-3 pt-2 sm:px-4 sm:pt-2.5 lg:px-6 lg:pt-3">
        <div
          className={`pointer-events-auto ${
            isGrabaciones
              ? 'max-lg:border-b max-lg:border-[var(--course-border)]/60 max-lg:bg-[var(--course-bg)]/95 max-lg:backdrop-blur-xl max-lg:-mx-3 max-lg:px-3 max-lg:py-2 sm:max-lg:-mx-4 sm:max-lg:px-4 lg:rounded-full lg:border lg:border-[var(--course-border)] lg:bg-[var(--course-surface)]/92 lg:px-2.5 lg:py-1.5 lg:shadow-lg lg:shadow-black/[0.06] lg:backdrop-blur-xl'
              : 'max-lg:border-b max-lg:border-[var(--course-border)] max-lg:bg-[var(--course-bg)]/95 max-lg:backdrop-blur-xl max-lg:-mx-3 max-lg:px-3 max-lg:py-2 sm:max-lg:-mx-4 sm:max-lg:px-4 lg:rounded-full lg:border lg:border-[var(--course-border)] lg:bg-[var(--course-surface)]/92 lg:px-2.5 lg:py-1.5 lg:shadow-lg lg:shadow-black/[0.06] lg:backdrop-blur-xl'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5">
            {isGrabaciones ? (
              grabacionesBackButton
            ) : (
              <Link
                href={backHref}
                className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-[var(--course-border)] bg-[var(--course-surface)] px-2 py-1.5 text-sm font-semibold text-[var(--course-text)] transition hover:border-[var(--course-accent)] sm:px-2.5 lg:rounded-full"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{backLabel}</span>
              </Link>
            )}

            {isGrabaciones ? (
              <>
                {grabacionesSearchExpanded ? (
                  <CourseRecordingsSearchBar
                    compact
                    expanded
                    className="min-w-0 flex-1"
                    onRequestCollapse={() => setGrabacionesSearchExpanded(false)}
                  />
                ) : (
                  <>
                    {course ? (
                      <div className="hidden min-w-0 flex-1 overflow-hidden lg:block">
                        <CoursePanelSectionTabs
                          active={tab}
                          onChange={onNavigateTab}
                          showSeguimiento={showSeguimiento}
                          compact
                        />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setGrabacionesSearchExpanded(true)}
                      className="hidden min-h-9 shrink-0 items-center justify-center rounded-full border border-[var(--course-border)] bg-[var(--course-surface)] px-3 text-[var(--course-text-muted)] transition hover:border-[var(--course-accent)] hover:text-[var(--course-accent)] lg:inline-flex"
                      aria-label="Buscar grabaciones"
                    >
                      <Search className="h-4 w-4" aria-hidden />
                    </button>
                    <CourseRecordingsSearchBar compact className="min-w-0 flex-1 lg:hidden" />
                  </>
                )}
              </>
            ) : showRankingSearch && rankingSearch ? (
              <CourseChromeSearchField
                value={rankingSearch.value}
                onChange={rankingSearch.onChange}
                placeholder="Nombre, email, colegio o documento…"
                ariaLabel="Buscar estudiante en el ranking"
                className="min-w-0 flex-1 lg:max-w-xs xl:max-w-sm"
              />
            ) : (
              <div className="min-w-0 flex-1 lg:hidden">
                <p className="truncate text-sm font-bold leading-tight text-[var(--course-text)]">
                  {course?.name ?? 'Mi curso'}
                </p>
                {!isSeguimiento ? (
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--course-accent)]">
                    {SECTION_LABELS[tab]}
                  </p>
                ) : null}
              </div>
            )}

            {course && !isGrabaciones ? (
              <p className="sr-only">{course.name}</p>
            ) : null}

            {isGrabaciones ? (
              <p className="sr-only">Grabaciones · {course?.name ?? 'Mi curso'}</p>
            ) : null}

            {course && !isGrabaciones && !showRankingSearch ? (
              <CoursePanelSectionTabs
                active={tab}
                onChange={onNavigateTab}
                showSeguimiento={showSeguimiento}
                compact
                className="hidden min-w-0 flex-1 lg:flex lg:items-center lg:gap-1 lg:overflow-x-auto"
              />
            ) : null}

            {!isGrabaciones && !showRankingSearch && course && !isSeguimiento ? (
              <div className="hidden shrink-0 md:block md:max-w-[11rem] lg:w-44 lg:max-w-none xl:w-52">
                <CourseGlobalSearch course={course} onNavigate={onNavigateTab} compact />
              </div>
            ) : null}

            {chromeActions}
          </div>

          {course && !isGrabaciones && !showRankingSearch && !isSeguimiento ? (
            <div className="mt-2 md:hidden">
              <CourseGlobalSearch course={course} onNavigate={onNavigateTab} compact />
            </div>
          ) : null}

          {course && isGrabaciones && !grabacionesSearchExpanded ? (
            <CoursePanelSectionTabs
              active={tab}
              onChange={onNavigateTab}
              showSeguimiento={showSeguimiento}
              className="mt-2 flex flex-wrap items-center gap-1 lg:hidden"
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

/** Fallback SSR/hidratación antes de medir el header real (ResizeObserver). */
export const COURSE_PANEL_CHROME_HEIGHT_GRABACIONES = '4.5rem';
export const COURSE_PANEL_CHROME_HEIGHT = '5.25rem';
