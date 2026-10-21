'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, ExternalLink, FileText, Timer, X } from 'lucide-react';
import type { CourseMaterial, CourseMaterialOpenNotice } from '../types/courseTypes';
import CourseMobileBottomSheet from './CourseMobileBottomSheet';
import { getCountdownToClassStartParts } from '../lib/courseVacacionalEventTime';
import {
  resolveSimulacroClosesAt,
  simulacroClosureExpired,
  simulacroFormSessionCount,
} from '../lib/courseSimulacroNotice';
import VacacionalCountdownFlip from './VacacionalCountdownFlip';

type CourseSimulacroNoticeModalProps = {
  material: CourseMaterial;
  notice: CourseMaterialOpenNotice;
  onClose: () => void;
  onOpenFolder: () => void;
};

export default function CourseSimulacroNoticeModal({
  material,
  notice,
  onClose,
  onOpenFolder,
}: CourseSimulacroNoticeModalProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const formCount = simulacroFormSessionCount(notice);
  const closesAt = resolveSimulacroClosesAt(notice);
  const expired = closesAt ? simulacroClosureExpired(closesAt, now) : false;
  const countdownParts = closesAt && !expired ? getCountdownToClassStartParts(closesAt, now) : null;

  const sessionLabel = useMemo(() => {
    if (formCount <= 0) return 'Sin formularios publicados';
    if (formCount === 1) return '1 formulario por enviar';
    return `${formCount} formularios por enviar`;
  }, [formCount]);

  return (
    <CourseMobileBottomSheet
      onClose={onClose}
      ariaLabelledBy="course-simulacro-notice-title"
      zIndexClass="z-[80]"
      backdropClassName="bg-black/55 backdrop-blur-sm"
      maxWidthClass="sm:max-w-lg"
      panelClassName="border border-[var(--course-border)] bg-[var(--course-surface)] shadow-2xl shadow-black/25"
    >
      <div className="relative shrink-0 overflow-hidden border-b border-[var(--course-border)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,color-mix(in_srgb,var(--course-accent)_22%,transparent),transparent_55%),radial-gradient(circle_at_100%_0%,color-mix(in_srgb,var(--course-accent)_12%,transparent),transparent_45%)]"
          aria-hidden
        />
        <div className="relative flex items-start gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--course-accent-soft)] ring-1 ring-[var(--course-accent)]/25">
            <FileText className="h-5 w-5 text-[var(--course-accent)]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--course-accent)]">
              Simulacro vigente
            </p>
            <h2
              id="course-simulacro-notice-title"
              className="mt-1 text-lg font-black leading-snug text-[var(--course-text)] sm:text-xl"
            >
              {notice.title}
            </h2>
            {material.description ? (
              <p className="mt-1 text-xs text-[var(--course-text-muted)]">{material.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/80 text-[var(--course-text-muted)] transition hover:bg-[var(--course-surface-muted)] hover:text-[var(--course-text)]"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/60 px-3 py-3">
            <div className="flex items-center gap-2 text-[var(--course-accent)]">
              <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em]">Formularios</span>
            </div>
            <p className="mt-2 text-2xl font-black tabular-nums text-[var(--course-text)]">
              {formCount > 0 ? formCount : '—'}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[var(--course-text-muted)]">{sessionLabel}</p>
          </div>

          <div className="rounded-2xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/60 px-3 py-3">
            <div className="flex items-center gap-2 text-[var(--course-accent)]">
              <Timer className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em]">Para cerrar envíos</span>
            </div>
            {countdownParts ? (
              <div className="mt-2">
                <VacacionalCountdownFlip parts={countdownParts} prefix="" compact />
              </div>
            ) : expired ? (
              <p className="mt-3 text-sm font-semibold text-[var(--course-text-muted)]">Cierre vencido</p>
            ) : (
              <p className="mt-3 text-sm font-semibold text-[var(--course-text-muted)]">Sin fecha de cierre</p>
            )}
          </div>
        </div>

        <p className="whitespace-pre-line text-sm leading-6 text-[var(--course-text)]">{notice.message}</p>

        {notice.deadlineLabel ? (
          <p className="rounded-2xl border border-[color-mix(in_srgb,var(--course-accent)_35%,var(--course-border))] bg-[var(--course-accent-soft)] px-4 py-3 text-sm font-semibold text-[var(--course-text)]">
            {notice.deadlineLabel}
          </p>
        ) : null}

        {notice.links?.length ? (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--course-text-muted)]">
              Enlaces de formulario
            </p>
            <ul className="grid gap-2">
              {notice.links.map((link, index) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/70 px-3 py-2.5 text-sm font-semibold text-[var(--course-text)] transition hover:border-[var(--course-accent)]/45 hover:bg-[var(--course-surface-muted)]"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--course-accent-soft)] text-xs font-black text-[var(--course-accent)]">
                        {index + 1}
                      </span>
                      <span className="truncate">{link.label}</span>
                    </span>
                    <ExternalLink
                      className="h-4 w-4 shrink-0 text-[var(--course-text-muted)] transition group-hover:text-[var(--course-accent)]"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-2 border-t border-[var(--course-border)] px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)] text-sm font-semibold text-[var(--course-text)] transition hover:bg-[var(--course-surface-muted)]/80"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={onOpenFolder}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--course-accent)] text-sm font-semibold text-white transition hover:opacity-90"
        >
          {notice.primaryLabel ?? 'Abrir material'}
          <ExternalLink className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </CourseMobileBottomSheet>
  );
}
