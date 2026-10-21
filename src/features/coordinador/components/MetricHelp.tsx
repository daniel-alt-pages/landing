'use client';
import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

/**
 * Burbuja de ayuda contextual para métricas y gráficas del panel coordinador.
 * Pedido explícito en la propuesta DOCX (puntos 1, 3): explicar qué significa
 * cada dato y para qué sirve.
 *
 * Uso:
 *   <MetricHelp text="Promedio del puntaje global de la institución (0-500)." />
 *   <MetricHelp title="P75" text="Tres de cada cuatro estudiantes están por debajo de este puntaje." />
 */
export default function MetricHelp({
    text,
    title,
    children,
    side = 'top',
}: {
    text: string;
    title?: string;
    children?: ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
}) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;
        const updatePosition = () => {
            const rect = ref.current?.getBoundingClientRect();
            if (!rect) return;

            const width = 224;
            const gap = 10;
            const viewportWidth = window.innerWidth;
            const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 8), viewportWidth - width - 8);
            const resolvedSide = side === 'top' && rect.top < 130 ? 'bottom' : side;

            if (resolvedSide === 'bottom') {
                setTooltipStyle({ top: rect.bottom + gap, left, width });
                return;
            }
            if (resolvedSide === 'left') {
                setTooltipStyle({
                    top: rect.top + rect.height / 2,
                    left: Math.max(8, rect.left - width - gap),
                    width,
                    transform: 'translateY(-50%)',
                });
                return;
            }
            if (resolvedSide === 'right') {
                setTooltipStyle({
                    top: rect.top + rect.height / 2,
                    left: Math.min(viewportWidth - width - 8, rect.right + gap),
                    width,
                    transform: 'translateY(-50%)',
                });
                return;
            }

            setTooltipStyle({ top: rect.top - gap, left, width, transform: 'translateY(-100%)' });
        };
        updatePosition();
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, side]);

    return (
        <span ref={ref} className="inline-flex items-center">
            {children}
            <button
                type="button"
                aria-label={title ? `Ayuda: ${title}` : 'Ayuda contextual'}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(v => !v);
                }}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                className="coord-help-trigger ml-1.5 cursor-help"
            >
                <HelpCircle aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
            {open && mounted && createPortal(
                <span
                    role="tooltip"
                    className="pointer-events-none fixed z-[9999] rounded-lg p-3 shadow-xl"
                    style={{
                        background: '#1e293b',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        color: 'rgba(255,255,255,0.92)',
                        fontSize: '11px',
                        lineHeight: 1.5,
                        ...tooltipStyle,
                    }}
                >
                    {title && (
                        <span className="block font-bold text-indigo-300 mb-1 text-[11px] uppercase tracking-wider">
                            {title}
                        </span>
                    )}
                    {text}
                </span>,
                document.body
            )}
        </span>
    );
}
