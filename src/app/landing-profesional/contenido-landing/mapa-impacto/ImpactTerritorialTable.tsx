'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { LandingTone } from '../tipos';
import type { LandingImpactDepartmentRow } from '../tipos/landingReference';
import { ImpactSubjectAveragesStrip } from './ImpactDepartmentSubjects';
import {
  buildImpactMaxUsers,
  getScorePerformance,
  getScorePerformanceClass,
  numberFormatter,
  scorePerformanceBands,
} from './impactData';

function ImpactDepartmentDetailDialog({
  row,
  tone,
  impactMaxUsers,
  open,
  onClose,
}: {
  row: LandingImpactDepartmentRow;
  tone: LandingTone;
  impactMaxUsers: number;
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isLight = tone === 'light';
  const scorePerformance = getScorePerformance(row.averageScore ?? 0);
  const coverage = Math.min(100, (row.uniqueUsers / impactMaxUsers) * 100);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        'cotiz-impact-dept-dialog m-auto w-[min(22rem,calc(100vw-1.5rem))] max-h-[min(90dvh,36rem)] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl backdrop:bg-black/50',
        isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white',
      )}
    >
      <div className="flex max-h-[min(90dvh,36rem)] flex-col">
        <header
          className={cn(
            'flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3',
            isLight ? 'border-slate-100 bg-gradient-to-br from-sky-50 to-white' : 'border-white/[0.08] bg-gradient-to-br from-sky-950/80 to-slate-950',
          )}
        >
          <div className="min-w-0">
            <p className={cn('font-mono text-[10px] font-semibold uppercase tracking-[0.18em]', isLight ? 'text-slate-500' : 'text-white/50')}>
              Departamento
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold tracking-tight">{row.department}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-xl ring-1 transition',
              isLight ? 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50' : 'bg-white/[0.06] text-white/80 ring-white/10 hover:bg-white/10',
            )}
            aria-label="Cerrar detalle"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={cn('rounded-xl p-3 ring-1', isLight ? 'bg-slate-50 ring-slate-200/80' : 'bg-white/[0.04] ring-white/[0.08]')}>
              <p className={cn('text-[11px] font-medium', isLight ? 'text-slate-600' : 'text-white/60')}>Usuarios únicos</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{numberFormatter.format(row.uniqueUsers)}</p>
              <div className={cn('mt-2 h-1.5 overflow-hidden rounded-full', isLight ? 'bg-slate-200' : 'bg-white/[0.08]')}>
                <span className={cn('block h-full rounded-full', isLight ? 'bg-sky-600' : 'bg-sky-400')} style={{ width: `${coverage}%` }} />
              </div>
              <p className={cn('mt-1.5 text-[10px]', isLight ? 'text-slate-500' : 'text-white/45')}>
                vs. máximo regional ({numberFormatter.format(impactMaxUsers)})
              </p>
            </div>

            <div className={cn('rounded-xl p-3 ring-1', isLight ? 'bg-slate-50 ring-slate-200/80' : 'bg-white/[0.04] ring-white/[0.08]')}>
              <p className={cn('text-[11px] font-medium', isLight ? 'text-slate-600' : 'text-white/60')}>Promedio global</p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
                {row.averageScore}
                <span className={cn('text-sm font-medium', isLight ? 'text-slate-500' : 'text-white/45')}>/500</span>
              </p>
              <span
                className={cn(
                  'mt-2 inline-flex rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] ring-1',
                  getScorePerformanceClass(scorePerformance.id, tone),
                )}
              >
                {scorePerformance.label} · {scorePerformance.range}
              </span>
            </div>
          </div>

          <div className={cn('mt-3 grid grid-cols-3 gap-2 rounded-xl p-3 ring-1 text-center text-[11px]', isLight ? 'bg-slate-50 ring-slate-200/80' : 'bg-white/[0.04] ring-white/[0.08]')}>
            <div>
              <p className={isLight ? 'text-slate-500' : 'text-white/45'}>Eval. totales</p>
              <p className="mt-0.5 font-mono font-semibold tabular-nums">{numberFormatter.format(row.evaluations)}</p>
            </div>
            <div>
              <p className={isLight ? 'text-slate-500' : 'text-white/45'}>Válidas</p>
              <p className="mt-0.5 font-mono font-semibold tabular-nums">{numberFormatter.format(row.validEvaluations)}</p>
            </div>
            <div>
              <p className={isLight ? 'text-slate-500' : 'text-white/45'}>Éxito</p>
              <p className="mt-0.5 font-mono font-semibold tabular-nums text-sky-600 dark:text-sky-300">{row.successRate}%</p>
            </div>
          </div>

          <div className="mt-4">
            <p className={cn('mb-2 text-[11px] font-medium', isLight ? 'text-slate-600' : 'text-white/55')}>
              Promedios por área <span className="font-mono opacity-80">/100</span>
            </p>
            <ImpactSubjectAveragesStrip subjectAverages={row.subjectAverages} tone={tone} className="grid-cols-5 gap-1.5" />
          </div>
        </div>
      </div>
    </dialog>
  );
}

export function ImpactTerritorialTable({
  rows,
  tone,
}: {
  rows: LandingImpactDepartmentRow[];
  tone: LandingTone;
}) {
  const isLight = tone === 'light';
  const impactMaxUsers = buildImpactMaxUsers(rows);
  const rowsPerPage = 5;
  const [page, setPage] = useState(0);
  const [detailRow, setDetailRow] = useState<LandingImpactDepartmentRow | null>(null);
  const totalPages = Math.ceil(rows.length / rowsPerPage) || 1;
  const start = page * rowsPerPage;
  const visibleRows = rows.slice(start, start + rowsPerPage);
  const end = start + visibleRows.length;

  return (
    <div
      className={cn(
        'mt-5 overflow-hidden rounded-[1.35rem] border',
        isLight ? 'border-slate-200 bg-white' : 'border-cyan-200/10 bg-slate-950/60',
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-3 border-b px-3 py-3 sm:flex-row sm:items-end sm:justify-between',
          isLight ? 'border-slate-200 bg-slate-50/90' : 'border-cyan-200/10 bg-cyan-300/[0.035]',
        )}
      >
        <div className="min-w-0">
          <h4 className={cn('text-sm font-semibold', isLight ? 'text-slate-950' : 'text-white')}>Tabla territorial</h4>
          <p className={cn('mt-1 text-xs leading-relaxed', isLight ? 'text-slate-600' : 'text-white/55')}>
            Vista compacta. Toca un departamento para ver evaluaciones, promedios y áreas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('font-mono text-[10px] uppercase tracking-[0.16em]', isLight ? 'text-cyan-700' : 'text-cyan-200/70')}>
            {rows.length ? `${start + 1}-${end} de ${rows.length}` : '0'}
          </span>
          <div className={cn('flex overflow-hidden rounded-full border', isLight ? 'border-slate-200 bg-white' : 'border-cyan-200/10 bg-slate-950/70')}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className={cn(
                'px-3 py-1.5 text-[11px] font-semibold transition',
                isLight ? 'text-slate-700 hover:bg-slate-50 disabled:text-slate-300' : 'text-white/75 hover:bg-white/[0.06] disabled:text-white/25',
              )}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={cn(
                'border-l px-3 py-1.5 text-[11px] font-semibold transition',
                isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-50 disabled:text-slate-300' : 'border-cyan-200/10 text-white/75 hover:bg-white/[0.06] disabled:text-white/25',
              )}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-wrap gap-1.5 border-b px-3 py-2',
          isLight ? 'border-slate-200 bg-white' : 'border-cyan-200/10 bg-slate-950/40',
        )}
      >
        {scorePerformanceBands.map((band) => (
          <span
            key={band.id}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ring-1',
              getScorePerformanceClass(band.id, tone),
            )}
            title={`${band.label}: ${band.range} — ${band.description}`}
          >
            {band.label}
            <span className="opacity-70">{band.range}</span>
          </span>
        ))}
      </div>

      <ul className={cn('divide-y', isLight ? 'divide-slate-100' : 'divide-white/[0.06]')} role="list">
        {visibleRows.map((row, index) => {
          const absoluteIndex = start + index;
          const scorePerformance = getScorePerformance(row.averageScore ?? 0);
          const coverage = Math.max(0.08, row.uniqueUsers / impactMaxUsers);

          return (
            <li key={row.department}>
              <button
                type="button"
                onClick={() => setDetailRow(row)}
                className={cn(
                  'group flex w-full min-w-0 items-center gap-3 px-3 py-3 text-left transition',
                  isLight ? 'hover:bg-sky-50/70' : 'hover:bg-cyan-300/[0.05]',
                )}
              >
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full font-mono text-[10px] font-semibold',
                    isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-300/10 text-cyan-100',
                  )}
                >
                  {String(absoluteIndex + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm font-semibold', isLight ? 'text-slate-950' : 'text-white')}>{row.department}</p>
                  <div className={cn('mt-1.5 h-1 max-w-[8rem] overflow-hidden rounded-full', isLight ? 'bg-slate-200' : 'bg-white/[0.08]')}>
                    <span
                      className={cn('block h-full rounded-full', isLight ? 'bg-cyan-600' : 'bg-cyan-300')}
                      style={{ width: `${Math.min(100, coverage * 100)}%` }}
                    />
                  </div>
                  <p className={cn('mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] tabular-nums', isLight ? 'text-slate-500' : 'text-white/45')}>
                    <span>{numberFormatter.format(row.uniqueUsers)} usuarios</span>
                    <span>{row.successRate}% éxito</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={cn(
                      'whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums ring-1',
                      getScorePerformanceClass(scorePerformance.id, tone),
                    )}
                  >
                    {row.averageScore}/500
                  </span>
                  <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', isLight ? 'text-sky-700' : 'text-sky-300/90')}>
                    Detalle
                    <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {detailRow ? (
        <ImpactDepartmentDetailDialog
          row={detailRow}
          tone={tone}
          impactMaxUsers={impactMaxUsers}
          open={Boolean(detailRow)}
          onClose={() => setDetailRow(null)}
        />
      ) : null}
    </div>
  );
}
