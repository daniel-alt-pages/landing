'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

export type ResumenPunto = { titulo: string; texto?: string };

/**
 * «Ver resumen»: abre un diálogo modal accesible (aria-modal, foco atrapado, Esc, devuelve el foco)
 * con los puntos clave de una sección densa. Motion con transform/opacity; sin movimiento si el
 * usuario prefiere menos movimiento.
 */
export function ResumenModal({ titulo, puntos, etiqueta = 'Ver resumen', intro }: {
  titulo: string;
  puntos: ResumenPunto[];
  etiqueta?: string;
  intro?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const reduce = useReducedMotion();
  const id = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const node = dialog.current;
    const frame = window.requestAnimationFrame(() => node?.querySelector<HTMLElement>('button')?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); return; }
      if (event.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
      trigger.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button ref={trigger} type="button" className="sg-resumen-btn" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 6h16M4 12h10M4 18h7" /></svg>
        {etiqueta}
      </button>
      {mounted ? createPortal(
        <AnimatePresence>
          {open ? (
            <motion.div
              className="sg-modal-back"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
            >
              <motion.div
                ref={dialog}
                className="sg-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${id}-t`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: reduce ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="sg-modal-head">
                  <div>
                    <p className="ag-eyebrow">Resumen</p>
                    <h2 id={`${id}-t`}>{titulo}</h2>
                  </div>
                  <button type="button" className="sg-modal-close" aria-label="Cerrar resumen" onClick={() => setOpen(false)}>
                    <X size={18} aria-hidden />
                  </button>
                </div>
                {intro ? <p className="sg-cifra-label" style={{ marginTop: 12 }}>{intro}</p> : null}
                <ol className="sg-modal-list">
                  {puntos.map((p, i) => (
                    <li key={p.titulo}>
                      <span className="sg-modal-n" aria-hidden>{i + 1}</span>
                      <span><b>{p.titulo}</b>{p.texto}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.querySelector('.alianza-root') || document.body,
      ) : null}
    </>
  );
}
