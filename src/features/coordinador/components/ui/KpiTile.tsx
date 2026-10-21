'use client';
import { ReactNode } from 'react';

/**
 * Tile KPI reusable: etiqueta corta + valor grande + sub texto opcional + icono.
 * Tipografía con `tabular-nums` para alineación numérica consistente.
 *
 * Uso:
 *   <KpiTile label="Promedio" value={inst.avg} sub="de 500 posibles" />
 *   <KpiTile label="Aprobación" value={`${tasa}%`} tone="success" />
 */
export type KpiTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

export interface KpiTileProps {
    label: string;
    value: string | number;
    sub?: string;
    icon?: ReactNode;
    /** Tono del valor (color) */
    tone?: KpiTone;
    /** Slot a la derecha (delta/badge/chart mini) */
    right?: ReactNode;
    /** data-coord-tour anchor (opcional) */
    tourId?: string;
}

const toneColor: Record<KpiTone, string> = {
    neutral: 'var(--coord-text-primary)',
    success: 'var(--coord-success)',
    warning: 'var(--coord-warning)',
    danger: 'var(--coord-danger)',
    info: 'var(--coord-info)',
    accent: 'var(--coord-accent)',
};

export default function KpiTile({
    label,
    value,
    sub,
    icon,
    tone = 'neutral',
    right,
    tourId,
}: KpiTileProps) {
    return (
        <div className="coord-kpi-tile" data-coord-tour={tourId || undefined}>
            <div className="flex items-center justify-between gap-2">
                <span className="coord-kpi-tile__label">{label}</span>
                {(icon || right) && (
                    <span className="flex items-center gap-1.5">
                        {icon && (
                            <span
                                className="inline-flex items-center justify-center shrink-0"
                                style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 6,
                                    background: 'var(--coord-trace-bg-strong)',
                                    color: toneColor[tone],
                                }}
                                aria-hidden
                            >
                                {icon}
                            </span>
                        )}
                        {right}
                    </span>
                )}
            </div>
            <div className="coord-kpi-tile__value" style={{ color: toneColor[tone] }}>
                {value}
            </div>
            {sub && <div className="coord-kpi-tile__sub">{sub}</div>}
        </div>
    );
}
