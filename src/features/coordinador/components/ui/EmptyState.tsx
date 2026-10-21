'use client';
import { ReactNode } from 'react';

/**
 * Estado vacío unificado: icono + título + descripción + acción opcional.
 *
 * Uso:
 *   <EmptyState
 *     title="Selecciona al menos 2 simulacros"
 *     body="Las tendencias se mostrarán cuando elijas más de uno."
 *     icon={<TrendingIcon />}
 *     action={<button className="coord-btn-primary" ...>Cambiar</button>}
 *   />
 */
export interface EmptyStateProps {
    title: string;
    body?: string;
    icon?: ReactNode;
    action?: ReactNode;
}

export default function EmptyState({ title, body, icon, action }: EmptyStateProps) {
    return (
        <div className="coord-empty-state" role="status">
            {icon && <div className="coord-empty-state__icon">{icon}</div>}
            <div className="coord-empty-state__title">{title}</div>
            {body && <div className="coord-empty-state__body">{body}</div>}
            {action && <div className="mt-1">{action}</div>}
        </div>
    );
}
