'use client';

import { useCallback, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';

type HorizontalScrollPanelProps = {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    label?: string;
    scrollContainerRef?: RefObject<HTMLDivElement | null>;
    /** Cuando se define, el viewport scrollea vertical y horizontal (tablas largas). */
    maxHeight?: CSSProperties['maxHeight'];
};

export default function HorizontalScrollPanel({
    children,
    className = '',
    contentClassName = '',
    label = 'Desplazamiento horizontal',
    scrollContainerRef,
    maxHeight,
}: HorizontalScrollPanelProps) {
    const internalScrollRef = useRef<HTMLDivElement | null>(null);

    const setScrollRef = useCallback(
        (node: HTMLDivElement | null) => {
            internalScrollRef.current = node;
            if (scrollContainerRef) {
                scrollContainerRef.current = node;
            }
        },
        [scrollContainerRef],
    );

    const dualAxis = maxHeight != null;

    return (
        <div className={`min-w-0 max-w-full ${className}`.trim()}>
            <div
                ref={setScrollRef}
                className={
                    dualAxis
                        ? 'coord-table-scroll max-w-full overflow-auto scroll-smooth [-webkit-overflow-scrolling:touch]'
                        : 'coord-horizontal-scroll__viewport max-w-full scroll-smooth [-webkit-overflow-scrolling:touch]'
                }
                style={dualAxis ? { maxHeight } : undefined}
                aria-label={label}
            >
                {contentClassName ? (
                    <div className={contentClassName}>{children}</div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
