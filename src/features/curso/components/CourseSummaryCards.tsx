'use client';

import { Clapperboard, ExternalLink, FolderOpen, Link2, Percent, Wrench } from 'lucide-react';
import type { CourseClassLink, CourseDoc, CourseSectionTab, CourseStudentMetrics } from '../types/courseTypes';

type CourseSummaryCardsProps = {
  course: CourseDoc;
  metrics?: CourseStudentMetrics | null;
  onOpenTab: (tab: CourseSectionTab) => void;
  showHerramientas?: boolean;
};

function nextClassLink(links: CourseClassLink[]): CourseClassLink | null {
  const visible = links.filter((l) => l.visible !== false);
  return visible[0] ?? null;
}

export default function CourseSummaryCards({
  course,
  metrics,
  onOpenTab,
  showHerramientas = false,
}: CourseSummaryCardsProps) {
  const proxima = nextClassLink(course.classLinks);
  const cards: {
    label: string;
    value: string;
    hint: string;
    icon: typeof Clapperboard;
    action: () => void;
  }[] = [];

  if (showHerramientas) {
    cards.push({
      label: 'Herramientas',
      value: 'Accesos',
      hint: 'Simulacro, perfil y curso',
      icon: Wrench,
      action: () => onOpenTab('herramientas'),
    });
  }

  cards.push(
    {
      label: 'Grabaciones',
      value: String(course.recordings.length),
      hint: 'Clases grabadas disponibles',
      icon: Clapperboard,
      action: () => onOpenTab('grabaciones'),
    },
    {
      label: 'Compilados',
      value: String(course.materials.length),
      hint: 'Materiales para descargar',
      icon: FolderOpen,
      action: () => onOpenTab('materiales'),
    },
    {
      label: 'Próxima clase',
      value: proxima?.label || (course.calendarEmbedUrl ? 'Calendario' : 'Por anunciar'),
      hint: proxima?.topic || (course.calendarEmbedUrl ? 'Ver horarios en calendario' : 'Enlaces de clase'),
      icon: Link2,
      action: () => onOpenTab('clases'),
    },
  );

  if (metrics?.attendance) {
    cards.push({
      label: 'Asistencia',
      value: `${Math.round(metrics.attendance.attendanceRate * 100)}%`,
      hint: `${metrics.attendance.sessionsCompleted ?? metrics.attendance.sessionsTotal}/${metrics.attendance.sessionsTotal} clases`,
      icon: Percent,
      action: () => onOpenTab('seguimiento'),
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <button
          key={card.label}
          type="button"
          onClick={card.action}
          className="group rounded-2xl border border-[var(--course-border)] bg-[var(--course-surface)] p-4 text-left shadow-[var(--course-shadow)] transition hover:border-[var(--course-accent)] hover:bg-[var(--course-surface-muted)]/40 hover:shadow-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--course-text-muted)]">
              {card.label}
            </span>
            <card.icon className="h-4 w-4 text-[var(--course-accent)]" aria-hidden />
          </div>
          <p className="text-xl font-bold text-[var(--course-text)]">{card.value}</p>
          <p className="mt-1 text-xs text-[var(--course-text-muted)]">{card.hint}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--course-accent)] opacity-0 transition group-hover:opacity-100">
            Ver más <ExternalLink className="h-3 w-3" />
          </span>
        </button>
      ))}
    </div>
  );
}
