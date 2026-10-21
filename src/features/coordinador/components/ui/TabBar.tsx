'use client';
import { ReactNode } from 'react';

/**
 * Tab bar / segmented control consistente con el sistema `coord-*`.
 * Estilo controlado con `data-active` para evitar inline styles en cada vista.
 *
 * Uso:
 *   <TabBar
 *     value={selectedMetric}
 *     onChange={setSelectedMetric}
 *     options={[
 *       { value: 'avg', label: 'Promedio' },
 *       { value: 'median', label: 'Mediana' },
 *     ]}
 *   />
 */
export interface TabOption<T extends string> {
    value: T;
    label: ReactNode;
    /** Acceso opcional via aria-label si label es solo icono */
    ariaLabel?: string;
}

export interface TabBarProps<T extends string> {
    value: T;
    onChange: (next: T) => void;
    options: TabOption<T>[];
    size?: 'sm' | 'md';
    ariaLabel?: string;
}

export default function TabBar<T extends string>({
    value,
    onChange,
    options,
    size = 'md',
    ariaLabel,
}: TabBarProps<T>) {
    return (
        <div className="coord-tab-bar" role="tablist" aria-label={ariaLabel}>
            {options.map((opt) => {
                const active = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-label={opt.ariaLabel}
                        data-active={active}
                        onClick={() => onChange(opt.value)}
                        className="coord-tab-item"
                        style={size === 'sm' ? { padding: '0.3rem 0.55rem', fontSize: 11 } : undefined}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
