'use client';
import { AlertTriangle } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Estado de error unificado para el panel coordinador.
 */
export default function ErrorState({
    message,
    detail,
    action,
}: {
    message: string;
    detail?: string;
    action?: ReactNode;
}) {
    return (
        <div
            className="flex items-center justify-center min-h-[40vh] p-6"
            role="alert"
            aria-live="assertive"
        >
            <div className="text-center max-w-md">
                <div
                    className="mx-auto mb-3 inline-flex items-center justify-center"
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: 'var(--coord-danger-soft)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: 'var(--coord-danger)',
                    }}
                >
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <p className="coord-text-head" style={{ fontSize: 14, fontWeight: 700 }}>
                    {message}
                </p>
                {detail && (
                    <p className="coord-text-muted mt-1" style={{ fontSize: 12 }}>
                        {detail}
                    </p>
                )}
                {action && <div className="mt-3">{action}</div>}
            </div>
        </div>
    );
}
