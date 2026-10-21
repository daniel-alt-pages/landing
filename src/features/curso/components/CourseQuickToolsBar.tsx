'use client';

import { CalendarClock, Clapperboard, MessageCircle, Star } from 'lucide-react';
import { buildCourseSupportUrl } from '../lib/courseSupportWhatsApp';
import type { CourseDoc, CourseSectionTab } from '../types/courseTypes';
import { useCourseFavorites } from '../hooks/useCourseFavorites';
import { useCourseProgress } from '../hooks/useCourseProgress';
import { useCourseReminders } from '../hooks/useCourseReminders';
import { useCourseRecordingsFiltersOptional } from '../context/CourseRecordingsFiltersContext';

type CourseQuickToolsBarProps = {
  course: CourseDoc;
  activeTab: CourseSectionTab;
  onOpenTab: (tab: CourseSectionTab, opts?: { recordingId?: string }) => void;
};

type ToolChip = {
  id: string;
  label: string;
  icon: typeof Star;
  tab?: CourseSectionTab;
  href?: string;
  active?: boolean;
};

export default function CourseQuickToolsBar({
  course,
  activeTab,
  onOpenTab,
}: CourseQuickToolsBarProps) {
  const { recordingFavoriteCount, materialFavoriteCount } = useCourseFavorites(course.id);
  const { continueWatching } = useCourseProgress(course.id, course.recordings);
  const { countdown } = useCourseReminders(course.classLinks);
  const filtersCtx = useCourseRecordingsFiltersOptional();
  const supportUrl = buildCourseSupportUrl(course.name);

  const favTotal = recordingFavoriteCount + materialFavoriteCount;
  const favoritesFilterActive =
    activeTab === 'grabaciones' && Boolean(filtersCtx?.filters.favoritesOnly);

  const chips: ToolChip[] = [
    {
      id: 'continue',
      label: continueWatching ? 'Seguir viendo' : 'Grabaciones',
      icon: Clapperboard,
      tab: 'grabaciones',
      active: activeTab === 'grabaciones' && !favoritesFilterActive,
    },
    {
      id: 'favorites',
      label: favTotal ? `${favTotal} favoritos` : 'Favoritos',
      icon: Star,
      tab: 'grabaciones',
      active: favoritesFilterActive,
    },
    {
      id: 'reminder',
      label: countdown?.label ? `Clase · ${countdown.label}` : 'Próxima clase',
      icon: CalendarClock,
      tab: 'clases',
      active: activeTab === 'clases',
    },
  ];

  if (supportUrl) {
    chips.push({
      id: 'support',
      label: 'Soporte',
      icon: MessageCircle,
      href: supportUrl,
    });
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="toolbar"
      aria-label="Accesos rápidos del curso"
    >
      {chips.map((chip) => {
        const Icon = chip.icon;
        const baseClass = `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          chip.active
            ? 'border-[var(--course-accent)] bg-[var(--course-accent-soft)] text-[var(--course-accent)]'
            : 'border-[var(--course-border)] bg-[var(--course-surface)] text-[var(--course-text-muted)] hover:border-[var(--course-accent)] hover:text-[var(--course-accent)]'
        }`;

        if (chip.href) {
          return (
            <a
              key={chip.id}
              href={chip.href}
              target="_blank"
              rel="noopener noreferrer"
              className={baseClass}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {chip.label}
            </a>
          );
        }

        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => {
              if (chip.id === 'continue' && continueWatching) {
                onOpenTab('grabaciones', { recordingId: continueWatching.id });
                return;
              }
              if (chip.id === 'favorites') {
                if (favTotal > 0) {
                  filtersCtx?.patchFilters({ favoritesOnly: true });
                }
                onOpenTab('grabaciones');
                return;
              }
              if (chip.tab) {
                onOpenTab(chip.tab);
              }
            }}
            className={baseClass}
            disabled={chip.id === 'favorites' && favTotal === 0}
            title={
              chip.id === 'favorites' && favTotal === 0
                ? 'Marca favoritos en grabaciones o materiales'
                : undefined
            }
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
