'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, type LucideIcon } from 'lucide-react';

type InsightAccent = 'indigo' | 'cyan' | 'amber' | 'emerald' | 'rose';

const accentStyles: Record<
    InsightAccent,
    { iconBg: string; iconBorder: string; iconColor: string; stripe: string }
> = {
    indigo: {
        iconBg: 'rgba(99,102,241,0.18)',
        iconBorder: 'rgba(129,140,248,0.35)',
        iconColor: '#a5b4fc',
        stripe: 'linear-gradient(90deg, #8b5cf6, #6366f1, #06b6d4)',
    },
    cyan: {
        iconBg: 'rgba(6,182,212,0.14)',
        iconBorder: 'rgba(34,211,238,0.32)',
        iconColor: '#67e8f9',
        stripe: 'linear-gradient(90deg, #06b6d4, #22d3ee, #8b5cf6)',
    },
    amber: {
        iconBg: 'rgba(245,158,11,0.14)',
        iconBorder: 'rgba(251,191,36,0.32)',
        iconColor: '#fcd34d',
        stripe: 'linear-gradient(90deg, #f59e0b, #fbbf24, #fb923c)',
    },
    emerald: {
        iconBg: 'rgba(16,185,129,0.14)',
        iconBorder: 'rgba(52,211,153,0.32)',
        iconColor: '#6ee7b7',
        stripe: 'linear-gradient(90deg, #10b981, #34d399, #06b6d4)',
    },
    rose: {
        iconBg: 'rgba(244,63,94,0.14)',
        iconBorder: 'rgba(251,113,133,0.32)',
        iconColor: '#fda4af',
        stripe: 'linear-gradient(90deg, #f43f5e, #fb7185, #f59e0b)',
    },
};

interface Props {
    open: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    icon?: LucideIcon;
    accent?: InsightAccent;
    size?: 'md' | 'lg';
}

/** Modal ligero accesible para complementar información en Resumen / Insights. */
export default function CoordinadorInsightModal({
    open,
    title,
    subtitle,
    onClose,
    children,
    footer,
    icon: Icon,
    accent = 'indigo',
    size = 'md',
}: Props) {
    const tone = accentStyles[accent];

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (typeof document === 'undefined' || !open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 coord-insight-modal-root"
            role="presentation"
        >
            <button
                type="button"
                className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm cursor-default"
                aria-label="Cerrar ventana"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="coord-insight-modal-title"
                data-coordinator-theme
                className={`coord-insight-modal relative w-full ${size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[88vh] overflow-hidden rounded-t-[1.35rem] sm:rounded-[1.35rem] flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                    style={{ background: tone.stripe }}
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full blur-3xl opacity-30"
                    style={{ background: tone.iconColor }}
                    aria-hidden
                />

                <div className="relative flex items-start gap-3 border-b border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 shrink-0">
                    {Icon ? (
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                            style={{
                                background: tone.iconBg,
                                borderColor: tone.iconBorder,
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                            }}
                        >
                            <Icon className="h-5 w-5" style={{ color: tone.iconColor }} aria-hidden />
                        </div>
                    ) : null}
                    <div className={`min-w-0 flex-1 ${Icon ? '' : 'pr-8'}`}>
                        <h2
                            id="coord-insight-modal-title"
                            className="text-base sm:text-[1.05rem] font-extrabold leading-snug tracking-tight text-white"
                        >
                            {title}
                        </h2>
                        {subtitle ? (
                            <p className="mt-1.5 text-[11px] leading-relaxed text-white/50">{subtitle}</p>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-white/65 transition-colors hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white"
                        aria-label="Cerrar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="coord-insight-modal__body relative overflow-y-auto p-4 sm:p-5 space-y-4 text-[13px] leading-relaxed text-white/70">
                    {children}
                </div>

                {footer ? (
                    <div className="relative shrink-0 border-t border-white/[0.08] bg-white/[0.02] px-4 py-3 sm:px-5">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>,
        document.body,
    );
}

/** Bloque destacado — headline o dato principal. */
export function CoordInsightHighlight({ children }: { children: ReactNode }) {
    return (
        <div className="coord-insight-highlight rounded-xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/12 via-transparent to-cyan-500/8 px-4 py-3.5 text-[13px] font-semibold leading-relaxed text-white/90">
            {children}
        </div>
    );
}

/** Sección con título, icono y contenedor. */
export function CoordInsightSection({
    title,
    icon: Icon,
    accent = 'indigo',
    children,
}: {
    title: string;
    icon?: LucideIcon;
    accent?: InsightAccent;
    children: ReactNode;
}) {
    const tone = accentStyles[accent];
    return (
        <section className="coord-insight-section rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5 bg-white/[0.02]">
                {Icon ? (
                    <span
                        className="flex h-6 w-6 items-center justify-center rounded-md border"
                        style={{ background: tone.iconBg, borderColor: tone.iconBorder }}
                    >
                        <Icon className="h-3.5 w-3.5" style={{ color: tone.iconColor }} aria-hidden />
                    </span>
                ) : null}
                <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">{title}</h3>
            </div>
            <div className="px-3.5 py-3">{children}</div>
        </section>
    );
}

/** Lista contextual con viñetas de marca. */
export function CoordInsightBulletList({ children }: { children: ReactNode }) {
    return <ul className="coord-insight-list space-y-2.5 text-[12px] leading-relaxed text-white/68">{children}</ul>;
}

/** Ítems de metodología numerados. */
export function CoordInsightMethodology({ items }: { items: string[] }) {
    return (
        <ol className="coord-insight-method space-y-2">
            {items.map((item, i) => (
                <li key={i} className="coord-insight-method__row flex gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <span className="coord-insight-method__idx flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-500/20 text-[10px] font-black text-indigo-200">
                        {i + 1}
                    </span>
                    <span className="text-[12px] leading-relaxed text-white/68">{item}</span>
                </li>
            ))}
        </ol>
    );
}

/** Callout de acción / práctica. */
export function CoordInsightCallout({
    title,
    children,
    accent = 'indigo',
}: {
    title: string;
    children: ReactNode;
    accent?: InsightAccent;
}) {
    const tone = accentStyles[accent];
    return (
        <div
            className="rounded-xl border p-3.5 text-[12px]"
            style={{ background: tone.iconBg, borderColor: tone.iconBorder }}
        >
            <strong className="text-[11px] font-bold uppercase tracking-wider" style={{ color: tone.iconColor }}>
                {title}
            </strong>
            <div className="mt-2 text-white/68">{children}</div>
        </div>
    );
}
