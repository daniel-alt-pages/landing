'use client';
import React, { useRef, useEffect, useState } from 'react';

type AnimationType =
    | 'fadeUp'
    | 'fadeDown'
    | 'fadeLeft'
    | 'fadeRight'
    | 'scaleUp'
    | 'blurIn'
    | 'slideUp'
    | 'flipUp'
    | 'rotateIn';

interface AnimateInProps {
    children: React.ReactNode;
    type?: AnimationType;
    delay?: number;
    duration?: number;
    className?: string;
    once?: boolean;
    threshold?: number;
    as?: React.ElementType;
}

const animations: Record<AnimationType, { from: React.CSSProperties; to: React.CSSProperties }> = {
    fadeUp: {
        from: { opacity: 0, transform: 'translateY(30px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
    },
    fadeDown: {
        from: { opacity: 0, transform: 'translateY(-30px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
    },
    fadeLeft: {
        from: { opacity: 0, transform: 'translateX(-40px)' },
        to: { opacity: 1, transform: 'translateX(0)' },
    },
    fadeRight: {
        from: { opacity: 0, transform: 'translateX(40px)' },
        to: { opacity: 1, transform: 'translateX(0)' },
    },
    scaleUp: {
        from: { opacity: 0, transform: 'scale(0.85)' },
        to: { opacity: 1, transform: 'scale(1)' },
    },
    blurIn: {
        from: { opacity: 0, filter: 'blur(12px)', transform: 'translateY(10px)' },
        to: { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' },
    },
    slideUp: {
        from: { opacity: 0, transform: 'translateY(60px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
    },
    flipUp: {
        from: { opacity: 0, transform: 'perspective(800px) rotateX(25deg) translateY(30px)' },
        to: { opacity: 1, transform: 'perspective(800px) rotateX(0deg) translateY(0)' },
    },
    rotateIn: {
        from: { opacity: 0, transform: 'rotate(-5deg) scale(0.9)' },
        to: { opacity: 1, transform: 'rotate(0deg) scale(1)' },
    },
};

export default function AnimateIn({
    children,
    type = 'fadeUp',
    delay = 0,
    duration = 0.6,
    className = '',
    once = true,
    threshold = 0.15,
    as: Tag = 'div',
}: AnimateInProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Check for prefers-reduced-motion
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (once) observer.unobserve(el);
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            { threshold: Math.min(threshold, 0.05), rootMargin: '0px 0px 50px 0px' }
        );

        observer.observe(el);

        // Fallback: ensure animation fires after 2s even if observer misses
        const fallbackTimer = setTimeout(() => {
            setIsVisible(true);
        }, 2500);

        return () => {
            observer.disconnect();
            clearTimeout(fallbackTimer);
        };
    }, [once, threshold]);

    const anim = animations[type];
    const style: React.CSSProperties = {
        ...(isVisible ? anim.to : anim.from),
        transition: `all ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
        willChange: 'transform, opacity, filter',
    };

    return (
        <Tag ref={ref} className={className} style={style}>
            {children}
        </Tag>
    );
}

// Convenience wrapper for staggered children
export function StaggerIn({
    children,
    type = 'fadeUp',
    staggerDelay = 0.1,
    baseDelay = 0,
    duration = 0.6,
    className = '',
    childClassName = '',
    once = true,
}: {
    children: React.ReactNode;
    type?: AnimationType;
    staggerDelay?: number;
    baseDelay?: number;
    duration?: number;
    className?: string;
    childClassName?: string;
    once?: boolean;
}) {
    return (
        <div className={className}>
            {React.Children.map(children, (child, i) => (
                <AnimateIn
                    type={type}
                    delay={baseDelay + i * staggerDelay}
                    duration={duration}
                    className={childClassName}
                    once={once}
                >
                    {child}
                </AnimateIn>
            ))}
        </div>
    );
}
