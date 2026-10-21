'use client';

import classNames from 'classnames';
import {
    Children,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
} from 'react';
import {
    maxColsForContainer,
    splitBalancedMetricRows,
} from '@features/coordinador/lib/balancedMetricRows';

export type AdaptiveMetricGridSize = 'compact' | 'default' | 'wide';

const sizeClass: Record<AdaptiveMetricGridSize, string> = {
    compact: 'coord-adaptive-metric-grid coord-adaptive-metric-grid--compact',
    default: 'coord-adaptive-metric-grid',
    wide: 'coord-adaptive-metric-grid coord-adaptive-metric-grid--wide',
};

function useContainerMaxCols(size: AdaptiveMetricGridSize) {
    const ref = useRef<HTMLDivElement>(null);
    const [maxCols, setMaxCols] = useState(4);

    useEffect(() => {
        const node = ref.current;
        if (!node || typeof ResizeObserver === 'undefined') return;

        const update = () => {
            const width = node.getBoundingClientRect().width;
            setMaxCols(maxColsForContainer(width, size));
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(node);
        window.addEventListener('resize', update);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', update);
        };
    }, [size]);

    return { ref, maxCols };
}

/**
 * Grid de KPIs con filas equilibradas según el ancho real del contenedor.
 * Desktop: 4+3 · Tablet: 3+2+2 · Móvil: 2+2+3 (sin texto cortado ni huecos).
 */
export default function AdaptiveMetricGrid({
    children,
    className,
    size = 'default',
    ...rest
}: {
    children: ReactNode;
    className?: string;
    size?: AdaptiveMetricGridSize;
} & HTMLAttributes<HTMLDivElement>) {
    const items = Children.toArray(children);
    const { ref, maxCols } = useContainerMaxCols(size);

    const rows = useMemo(
        () => splitBalancedMetricRows(items.length, maxCols),
        [items.length, maxCols],
    );

    let offset = 0;

    return (
        <div
            ref={ref}
            className={classNames(sizeClass[size], className)}
            data-metric-cols={maxCols}
            {...rest}
        >
            {rows.map((cols, rowIdx) => {
                const rowItems = items.slice(offset, offset + cols);
                offset += cols;
                const style = { '--row-cols': cols } as CSSProperties;

                return (
                    <div
                        key={`metric-row-${rowIdx}-${cols}-${maxCols}`}
                        className="coord-adaptive-metric-grid__row"
                        style={style}
                    >
                        {rowItems}
                    </div>
                );
            })}
        </div>
    );
}
