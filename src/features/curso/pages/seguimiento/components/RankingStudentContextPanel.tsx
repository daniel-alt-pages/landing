'use client';

import { BookOpen, Building2, GraduationCap, MapPin } from 'lucide-react';
import type { CourseAttendanceReportRow } from '../../../lib/courseAttendanceReport';
import {
  hasRankingStudentContext,
  rankingStudentContextFromRow,
  rankingStudentContextItems,
  type RankingStudentContextMeta,
} from '../lib/rankingStudentContext';

const ICONS = {
  municipio: MapPin,
  departamento: MapPin,
  curso: BookOpen,
  grado: GraduationCap,
} as const;

type RankingStudentContextPanelProps = {
  row?: CourseAttendanceReportRow;
  /** Contexto explícito (p. ej. ranking simulacro sin fila de asistencia). */
  meta?: RankingStudentContextMeta;
  /** Inline en fila del ranking (tablet+). */
  variant?: 'inline' | 'stack';
  className?: string;
};

function ContextCell({
  label,
  value,
  icon: Icon,
  compact = false,
}: {
  label: string;
  value: string;
  icon: typeof MapPin;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className="min-w-0 rounded-lg border border-[var(--course-border)] bg-[var(--course-surface-muted)]/40 px-1.5 py-1.5"
        title={`${label}: ${value}`}
      >
        <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-[var(--course-text-muted)]">
          <Icon className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{label}</span>
        </p>
        <p className="mt-0.5 truncate text-[11px] font-semibold leading-snug text-[var(--course-text)]">
          {value}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-lg border border-[var(--course-border)] bg-[var(--course-surface-muted)]/40 px-2 py-1.5">
      <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-[var(--course-text-muted)]">
        <Icon className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
        {label}
      </p>
      <p className="mt-0.5 truncate text-[11px] font-semibold leading-snug text-[var(--course-text)]" title={value}>
        {value}
      </p>
    </div>
  );
}

export default function RankingStudentContextPanel({
  row,
  meta: metaProp,
  variant = 'inline',
  className = '',
}: RankingStudentContextPanelProps) {
  const meta = metaProp ?? rankingStudentContextFromRow(row);
  const items = rankingStudentContextItems(meta);

  if (!hasRankingStudentContext(meta)) {
    if (variant === 'inline') return null;
    return (
      <div
        className={`flex min-h-[3.25rem] items-center justify-center rounded-xl border border-dashed border-[var(--course-border)] bg-[var(--course-surface-muted)]/25 px-3 py-2 ${className}`}
        aria-hidden
      >
        <p className="text-center text-[10px] font-medium text-[var(--course-text-muted)]">
          Ubicación e institución no registradas
        </p>
      </div>
    );
  }

  if (variant === 'stack') {
    return (
      <dl className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${className}`}>
        {items.map((item) => {
          const Icon = ICONS[item.key] ?? Building2;
          return (
            <div key={item.key}>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--course-text-muted)]">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-[var(--course-text)]">{item.value}</dd>
              <Icon className="sr-only" aria-hidden />
            </div>
          );
        })}
      </dl>
    );
  }

  return (
    <div
      className={`hidden min-w-0 flex-[1_1_0] grid-cols-3 items-stretch gap-1.5 md:grid xl:flex-[1.15_1_0] ${className}`}
      aria-label="Ubicación e institución"
    >
      {items.map((item) => {
        const Icon = ICONS[item.key] ?? Building2;
        return (
          <ContextCell
            key={item.key}
            label={item.label}
            value={item.value}
            icon={Icon}
            compact
          />
        );
      })}
    </div>
  );
}

export function RankingStudentContextMobileLine({
  row,
  meta: metaProp,
}: {
  row?: CourseAttendanceReportRow;
  meta?: RankingStudentContextMeta;
}) {
  const meta = metaProp ?? rankingStudentContextFromRow(row);
  const parts = [meta.municipio, meta.departamento].filter(Boolean);
  if (!parts.length) return null;
  return (
    <p className="truncate text-[10px] font-medium text-[var(--course-text-muted)] md:hidden">
      {parts.join(' · ')}
    </p>
  );
}
