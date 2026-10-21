'use client';

/** Anillo mini tipo Stitch — conic-gradient + núcleo glass. */
export default function CoordMiniProgressRing({
    pct,
    color,
    size = 32,
    className = '',
}: {
    pct: number;
    color: string;
    size?: number;
    className?: string;
}) {
    const clamped = Math.max(0, Math.min(100, pct));
    const inner = Math.round(size * 0.62);

    return (
        <div
            className={`coord-mini-ring shrink-0 ${className}`.trim()}
            style={{
                width: size,
                height: size,
                background: `conic-gradient(${color} ${clamped}%, rgba(255,255,255,0.08) 0)`,
            }}
            aria-hidden
        >
            <div
                className="rounded-full bg-[#11131b]"
                style={{
                    width: inner,
                    height: inner,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
            />
        </div>
    );
}
