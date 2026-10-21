'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import StudentGlobalScoreModal from './StudentGlobalScoreModal';
import { ICFES_GLOBAL_TROPHY_ICON } from '@features/estudiante/lib/icfesGlobalScore';
import type { SubjectPuntaje } from '@features/estudiante/lib/icfesGlobalScore';
import { ensureStudentFloatDock } from '@features/estudiante/lib/studentFloatDock';

type StudentGlobalScoreHelpBubbleProps = {
  puntajes: Record<string, SubjectPuntaje | undefined>;
  puntajeGlobal: number;
};

/**
 * Pill en dock inferior compartido con PIFA.
 * Móvil: derecha del dock (sobre nav). Desktop: fila inferior derecha.
 */
export default function StudentGlobalScoreHelpBubble({
  puntajes,
  puntajeGlobal,
}: StudentGlobalScoreHelpBubbleProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dock, setDock] = useState<HTMLElement | null>(null);
  /** PIFA overlay (modales) en html[data-pifa-overlay] — no pelear z-index. */
  const [pifaOverlay, setPifaOverlay] = useState(false);
  const snapshotRef = useRef({ puntajes, puntajeGlobal });

  useEffect(() => {
    setMounted(true);
    setDock(ensureStudentFloatDock());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setPifaOverlay(root.hasAttribute('data-pifa-overlay'));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ['data-pifa-overlay'] });
    return () => mo.disconnect();
  }, []);

  if (!open && (!puntajeGlobal || puntajeGlobal <= 0)) return null;

  const handleOpen = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    snapshotRef.current = { puntajes, puntajeGlobal };
    window.setTimeout(() => setOpen(true), 0);
  };

  const handleClose = useCallback(() => setOpen(false), []);

  const modalPuntajes = open ? snapshotRef.current.puntajes : puntajes;
  const modalGlobal = open ? snapshotRef.current.puntajeGlobal : puntajeGlobal;

  const bubble = (
    <button
      type="button"
      onPointerUp={handleOpen}
      data-student-score-help-bubble=""
      className="pointer-events-auto order-2 ml-auto group inline-flex max-w-[min(100%,14rem)] shrink items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 pl-1.5 pr-2.5 py-1 backdrop-blur-md shadow-md shadow-slate-900/8 transition-all hover:border-indigo-200 hover:shadow-indigo-500/12 active:scale-[0.98] lg:ml-0 lg:gap-2 lg:pl-2 lg:pr-3.5 lg:py-1.5 lg:shadow-lg"
      aria-label="¿Cómo se calcula tu puntaje global?"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200/80 group-hover:bg-indigo-50 group-hover:ring-indigo-100 lg:h-7 lg:w-7">
        <img
          src={ICFES_GLOBAL_TROPHY_ICON}
          alt=""
          className="h-3.5 w-3.5 lg:h-4 lg:w-4"
          width={16}
          height={16}
        />
      </span>
      <span className="min-w-0 truncate text-[10px] font-semibold text-slate-700 group-hover:text-indigo-900 lg:text-xs">
        <span className="sm:hidden">¿Puntaje?</span>
        <span className="hidden sm:inline">¿Cómo se calcula?</span>
      </span>
    </button>
  );

  return (
    <>
      {mounted && dock && !pifaOverlay ? createPortal(bubble, dock) : null}
      <StudentGlobalScoreModal
        open={open}
        onClose={handleClose}
        puntajes={modalPuntajes}
        puntajeGlobal={modalGlobal}
      />
    </>
  );
}
