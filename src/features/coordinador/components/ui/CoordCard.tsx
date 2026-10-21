'use client';
import { CSSProperties, HTMLAttributes, ReactNode } from 'react';

/**
 * Tarjeta base del panel coordinador.
 * - Borde + radio + superficie tokenizados (`coord-*`).
 * - Soporta franja superior con acento semántico (`stripe`).
 * - Padding responsive uniforme (`coord-card-pad` o `coord-card-pad-sm`).
 *
 * Uso:
 *   <CoordCard stripe="violet">
 *     <SectionHeader title="..." />
 *     ...contenido...
 *   </CoordCard>
 */
export type CoordCardAccent =
    | 'brand'
    | 'violet'
    | 'indigo'
    | 'cyan'
    | 'emerald'
    | 'amber'
    | 'rose'
    | 'pink';

export interface CoordCardProps extends HTMLAttributes<HTMLDivElement> {
    /** Acento de la franja superior (default: sin franja) */
    stripe?: CoordCardAccent;
    /** Variante de padding interno */
    padding?: 'sm' | 'md' | 'none';
    /** Permite color de fondo distinto (e.g. surface-muted) */
    surface?: 'default' | 'muted' | 'elevated';
    /** Hover suave (border highlight) */
    hoverable?: boolean;
    children: ReactNode;
}

const surfaceClass: Record<NonNullable<CoordCardProps['surface']>, string> = {
    default: 'coord-surface',
    muted: 'coord-surface-muted',
    elevated: 'coord-surface-elevated',
};

export default function CoordCard({
    stripe,
    padding = 'md',
    surface = 'default',
    hoverable = false,
    className = '',
    children,
    style,
    ...rest
}: CoordCardProps) {
    const padClass =
        padding === 'sm' ? 'coord-card-pad-sm' : padding === 'md' ? 'coord-card-pad' : '';

    const composed: CSSProperties = {
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '1.35rem',
        overflow: 'hidden',
        background: '#111827',
        boxShadow:
            '0 24px 80px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        ...style,
    };

    return (
        <div
            {...rest}
            className={`ring-1 ring-inset ring-indigo-400/15 ${surfaceClass[surface]} ${hoverable ? 'coord-card-hover' : ''} ${className}`.trim()}
            style={composed}
        >
            {stripe && <div className="coord-card-stripe" data-accent={stripe} />}
            {padClass ? <div className={padClass}>{children}</div> : children}
        </div>
    );
}
