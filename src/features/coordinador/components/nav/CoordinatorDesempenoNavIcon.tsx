import type { ReactNode } from 'react';

/** Lucide `TrendingUp` — icono canónico de la sección Desempeño. */
export function CoordinatorDesempenoNavIcon({ size = 18 }: { size?: number }): ReactNode {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    );
}

export function CoordinatorDesempenoMobileNavIcon({ active }: { active: boolean }): ReactNode {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={active ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={active ? 0 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            {active ? (
                <>
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" fill="currentColor" stroke="none" opacity="0.85" />
                    <polyline points="16 7 22 7 22 13" fill="currentColor" stroke="none" opacity="0.55" />
                </>
            ) : (
                <>
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                </>
            )}
        </svg>
    );
}
