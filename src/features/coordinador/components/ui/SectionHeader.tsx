'use client';
import { ReactNode } from 'react';

/**
 * Cabecera de sección consistente en todas las vistas del coordinador.
 * Estructura: [bar acento] [icono?] [título / descripción] [helper slot a la derecha].
 *
 * Uso:
 *   <SectionHeader
 *     title="Evolución del puntaje"
 *     description="Promedio por simulacro y delta vs anterior."
 *     accent="#8b5cf6"
 *     icon={<ChartIcon />}
 *     right={<TabBar ... />}
 *   />
 */
export interface SectionHeaderProps {
    title: string;
    description?: string;
    /** Color CSS o token (`var(--coord-...)`) para la barra/acento */
    accent?: string;
    icon?: ReactNode;
    right?: ReactNode;
    /** Atributo opcional `data-coord-tour` para anclar la guía */
    tourId?: string;
}

export default function SectionHeader({
    title,
    description,
    accent,
    icon,
    right,
    tourId,
}: SectionHeaderProps) {
    return (
        <div
            className="coord-section-header flex-wrap"
            data-coord-tour={tourId || undefined}
        >
            <div
                className="coord-section-header__bar"
                style={accent ? { background: accent } : undefined}
            />
            {icon && (
                <span
                    className="inline-flex items-center justify-center shrink-0"
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: accent ? `${accent}1A` : 'var(--coord-trace-bg)',
                        border: `1px solid ${accent ? `${accent}33` : 'var(--coord-border)'}`,
                        color: accent || 'var(--coord-text-secondary)',
                    }}
                    aria-hidden
                >
                    {icon}
                </span>
            )}
            <div className="min-w-0 flex-1" style={{ minWidth: '8rem' }}>
                <h3 className="coord-section-header__title">{title}</h3>
                {description && <p className="coord-section-header__desc">{description}</p>}
            </div>
            {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
        </div>
    );
}
