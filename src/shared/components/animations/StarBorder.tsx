'use client';
import React from 'react';

interface StarBorderProps<T extends React.ElementType = 'div'> {
    as?: T;
    className?: string;
    color?: string;
    speed?: string;
    radius?: string;
    children: React.ReactNode;
    [key: string]: unknown;
}

export default function StarBorder<T extends React.ElementType = 'div'>({
    as,
    className = '',
    color = '#8b5cf6',
    speed = '6s',
    radius = '1rem',
    children,
    ...rest
}: StarBorderProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof StarBorderProps<T>>) {
    const Component = as || 'div';
    return (
        <Component
            className={`star-border-container ${className}`}
            style={{
                '--star-color': color,
                '--star-speed': speed,
                '--star-radius': radius,
                position: 'relative',
                borderRadius: 'var(--star-radius)',
            } as React.CSSProperties}
            {...rest}
        >
            <style jsx global>{`
                .star-border-container {
                    overflow: hidden;
                }
                .star-border-container::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: var(--star-radius);
                    padding: 2.5px;
                    background: conic-gradient(
                        from var(--star-angle, 0deg),
                        transparent 0%,
                        transparent 70%,
                        var(--star-color) 80%,
                        transparent 90%,
                        transparent 100%
                    );
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    animation: starRotate var(--star-speed) linear infinite;
                    pointer-events: none;
                    z-index: 2;
                }
                .star-border-container::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: var(--star-radius);
                    padding: 2.5px;
                    background: conic-gradient(
                        from calc(var(--star-angle, 0deg) + 180deg),
                        transparent 0%,
                        transparent 70%,
                        var(--star-color) 80%,
                        transparent 90%,
                        transparent 100%
                    );
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    animation: starRotate var(--star-speed) linear infinite;
                    opacity: 0.5;
                    pointer-events: none;
                    z-index: 2;
                }
                @property --star-angle {
                    syntax: '<angle>';
                    initial-value: 0deg;
                    inherits: false;
                }
                @keyframes starRotate {
                    from { --star-angle: 0deg; }
                    to { --star-angle: 360deg; }
                }
            `}</style>
            <div style={{ position: 'relative', zIndex: 1, borderRadius: 'inherit' }}>
                {children}
            </div>
        </Component>
    );
}
