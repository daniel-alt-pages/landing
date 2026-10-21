import React from 'react';

type PercentilValueSize = 'xs' | 'sm' | 'md' | 'lg' | 'hero';

const LABEL: Record<PercentilValueSize, string> = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    hero: 'text-xs sm:text-sm',
};

const VALUE: Record<PercentilValueSize, string> = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    hero: 'text-3xl sm:text-4xl',
};

type PercentilValueProps = {
    value: number;
    size?: PercentilValueSize;
    layout?: 'inline' | 'stacked';
    className?: string;
    style?: React.CSSProperties;
};

/** Muestra "Percentil N" sin abreviaturas (Pct., P63, etc.). */
export default function PercentilValue({
    value,
    size = 'md',
    layout = 'inline',
    className = '',
    style,
}: PercentilValueProps) {
    if (layout === 'stacked') {
        return (
            <span className={`inline-flex flex-col items-center leading-none gap-0.5 ${className}`} style={style}>
                <span className={`${LABEL[size]} font-bold text-white/70`}>Percentil</span>
                <span className={`${VALUE[size]} font-black tabular-nums`}>{value}</span>
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-baseline gap-0.5 font-black leading-tight whitespace-nowrap ${className}`}
            style={style}
        >
            <span className={`${LABEL[size]} font-bold shrink-0`}>Percentil</span>
            <span className={`${VALUE[size]} tabular-nums`}>{value}</span>
        </span>
    );
}
