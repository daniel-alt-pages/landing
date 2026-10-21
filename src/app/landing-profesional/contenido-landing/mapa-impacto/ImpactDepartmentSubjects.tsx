'use client';

import { cn } from '@shared/lib/utils';
import type { LandingTone } from '../tipos';
import type { LandingImpactSubjectAverages } from '../tipos/landingReference';
import { formatSubjectAverageScore, getDepartmentSubjectScores, impactSubjectAreas } from './impactData';

export function ImpactSubjectAveragesStrip({
  subjectAverages,
  tone,
  className,
}: {
  subjectAverages?: LandingImpactSubjectAverages;
  tone: LandingTone;
  className?: string;
}) {
  const isLight = tone === 'light';
  const subjects = getDepartmentSubjectScores(subjectAverages);

  return (
    <div
      className={cn('grid grid-cols-5 gap-1', isLight ? 'text-slate-600' : 'text-white/55', className)}
      role="list"
      aria-label="Promedios por área, escala 0 a 100"
    >
      {subjects.map((subject) => (
        <div
          key={subject.key}
          role="listitem"
          className={cn(
            'min-w-0 rounded-lg px-1 py-1.5 text-center ring-1',
            isLight ? 'bg-white ring-slate-200/90' : 'bg-white/[0.03] ring-white/[0.08]',
          )}
          title={`${subject.label}: ${formatSubjectAverageScore(subject.score)}/100`}
        >
          <p className="truncate font-mono text-[8px] font-semibold uppercase tracking-[0.06em]">{subject.short}</p>
          <p
            className={cn(
              'mt-0.5 font-mono text-[11px] font-semibold tabular-nums leading-none',
              isLight ? 'text-slate-950' : 'text-white',
            )}
          >
            {formatSubjectAverageScore(subject.score)}
          </p>
        </div>
      ))}
    </div>
  );
}

export const impactSubjectTableHeaders = impactSubjectAreas.map((area) => ({
  key: area.key,
  label: area.short,
  title: `${area.label} · promedio /100`,
}));

export function ImpactSubjectAveragesTableCells({
  subjectAverages,
  tone,
}: {
  subjectAverages?: LandingImpactSubjectAverages;
  tone: LandingTone;
}) {
  const isLight = tone === 'light';
  const subjects = getDepartmentSubjectScores(subjectAverages);

  return (
    <>
      {subjects.map((subject) => (
        <td key={`subject-${subject.key}`} className="px-1.5 py-2 text-center">
          <span
            className={cn(
              'inline-block min-w-[2.25rem] font-mono text-[9px] font-semibold tabular-nums',
              isLight ? 'text-slate-800' : 'text-white/85',
            )}
            title={`${subject.label}: promedio /100`}
          >
            {formatSubjectAverageScore(subject.score)}
          </span>
        </td>
      ))}
    </>
  );
}
