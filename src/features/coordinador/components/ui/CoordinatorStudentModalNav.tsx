'use client';

import React from 'react';

type Props = {
    currentIndex: number;
    total: number;
    canPrev: boolean;
    canNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    compact?: boolean;
    className?: string;
};

export function CoordinatorStudentModalNav({
    currentIndex,
    total,
    canPrev,
    canNext,
    onPrev,
    onNext,
    compact = false,
    className = '',
}: Props) {
    if (total <= 1 || currentIndex < 0) return null;

    const btnClass =
        'flex items-center justify-center rounded-lg transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white/10';
    const size = compact ? 'w-7 h-7' : 'w-8 h-8';

    return (
        <div
            className={`flex items-center gap-1 shrink-0 ${className}`}
            role="navigation"
            aria-label="Navegar entre estudiantes"
        >
            <button
                type="button"
                onClick={onPrev}
                disabled={!canPrev}
                className={`${btnClass} ${size}`}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                aria-label="Estudiante anterior"
                title="Anterior (←)"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>
            <span
                className={`tabular-nums font-bold text-white/50 ${compact ? 'text-[10px] min-w-[2.5rem] text-center' : 'text-xs min-w-[3rem] text-center'}`}
                aria-live="polite"
            >
                {currentIndex + 1}/{total}
            </span>
            <button
                type="button"
                onClick={onNext}
                disabled={!canNext}
                className={`${btnClass} ${size}`}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                aria-label="Siguiente estudiante"
                title="Siguiente (→)"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </button>
        </div>
    );
}
