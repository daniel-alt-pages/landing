'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, type ElementType } from 'react';

type TabDef = {
    id: string;
    label: string;
    shortLabel: string;
    Icon: ElementType;
    badge?: number | string;
};

type Props = {
    tabs: readonly TabDef[];
    activeId: string;
    onSelect: (id: string) => void;
    tourAnchor?: string;
};

function scrollTabIntoView(
    scrollEl: HTMLDivElement,
    btn: HTMLButtonElement,
    padding = 10,
) {
    const sr = scrollEl.getBoundingClientRect();
    const br = btn.getBoundingClientRect();

    if (br.right > sr.right - padding) {
        scrollEl.scrollLeft += br.right - sr.right + padding;
    } else if (br.left < sr.left + padding) {
        scrollEl.scrollLeft -= sr.left - br.left + padding;
    }
}

/** Pills dashboard con indicador deslizante — patrón Stitch glass. */
export default function CoordinadorDashboardTabs({ tabs, activeId, onSelect, tourAnchor }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const gliderRef = useRef<HTMLDivElement>(null);
    const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const pillRef = useRef({ left: 0, width: 0 });
    const activeIndexRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    const activeIndex = Math.max(
        0,
        tabs.findIndex((t) => t.id === activeId),
    );
    activeIndexRef.current = activeIndex;

    const applyPill = useCallback((animate: boolean) => {
        const btn = btnRefs.current[activeIndexRef.current];
        const glider = gliderRef.current;
        if (!btn || !glider) return;

        const left = Math.round(btn.offsetLeft);
        const width = Math.round(btn.offsetWidth);
        const prev = pillRef.current;
        if (prev.left === left && prev.width === width) return;

        pillRef.current = { left, width };
        glider.classList.toggle('coord-tab-pills-glider--slide', animate);
        glider.style.left = `${left}px`;
        glider.style.width = `${width}px`;
    }, []);

    const schedulePillSync = useCallback(
        (animate: boolean) => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                applyPill(animate);
            });
        },
        [applyPill],
    );

    useLayoutEffect(() => {
        schedulePillSync(false);
    }, [activeIndex, tabs.length, schedulePillSync]);

    useEffect(() => {
        const onResize = () => schedulePillSync(false);
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        };
    }, [schedulePillSync]);

    useEffect(() => {
        const scroll = scrollRef.current;
        const track = trackRef.current;
        if (!scroll || !track || typeof ResizeObserver === 'undefined') return;

        const syncOverflow = () => {
            if (window.matchMedia('(min-width: 1024px)').matches) {
                if (scroll.dataset.overflow !== 'false') {
                    scroll.dataset.overflow = 'false';
                }
                return;
            }

            const buttons = btnRefs.current.filter(Boolean) as HTMLButtonElement[];
            const gap = 4;
            const padding = 14;
            const contentWidth =
                buttons.reduce((sum, btn) => sum + btn.scrollWidth, 0) +
                Math.max(0, buttons.length - 1) * gap +
                padding;

            const currentlyOverflow = scroll.dataset.overflow === 'true';
            const threshold = currentlyOverflow ? -10 : 10;
            const nextOverflow = contentWidth > scroll.clientWidth + threshold ? 'true' : 'false';

            if (scroll.dataset.overflow !== nextOverflow) {
                scroll.dataset.overflow = nextOverflow;
                schedulePillSync(false);
            }
        };

        syncOverflow();
        const ro = new ResizeObserver(() => syncOverflow());
        ro.observe(scroll);
        window.addEventListener('resize', syncOverflow);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', syncOverflow);
        };
    }, [tabs.length, schedulePillSync]);

    useEffect(() => {
        const scroll = scrollRef.current;
        const btn = btnRefs.current[activeIndex];
        if (!scroll || !btn) return;
        scrollTabIntoView(scroll, btn);
        schedulePillSync(true);
    }, [activeIndex, schedulePillSync]);

    return (
        <div className="coord-tab-pills">
            <div ref={scrollRef} className="coord-tab-pills__scroll scrollbar-none">
                <div
                    ref={trackRef}
                    data-coord-tour={tourAnchor}
                    className="coord-tab-pills-track coord-tab-pills-track--sliding"
                    role="tablist"
                >
                    <div ref={gliderRef} className="coord-tab-pills-glider" aria-hidden />
                    {tabs.map((t, idx) => {
                        const isActive = t.id === activeId;
                        return (
                            <button
                                key={t.id}
                                ref={(el) => {
                                    btnRefs.current[idx] = el;
                                }}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => onSelect(t.id)}
                                className={`coord-tab-pill ${isActive ? 'coord-tab-pill-active coord-tab-pill-active--glide' : ''}`}
                            >
                                <t.Icon className="coord-tab-pill__icon" aria-hidden />
                                <span className="coord-tab-pill__label coord-tab-pill__label--full">{t.label}</span>
                                <span className="coord-tab-pill__label coord-tab-pill__label--short">{t.shortLabel}</span>
                                {t.badge != null && t.badge !== '' && Number(t.badge) !== 0 ? (
                                    <span className="coord-tab-pill-badge">{t.badge}</span>
                                ) : null}
                            </button>
                        );
                    })}
                    <span className="coord-tab-pills-track__spacer" aria-hidden />
                </div>
            </div>
        </div>
    );
}
