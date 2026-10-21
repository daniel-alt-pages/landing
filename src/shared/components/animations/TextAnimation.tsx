'use client';
import React, { useRef } from 'react';
import { motion, useInView, Variant, Variants } from 'framer-motion';

interface TextAnimationProps {
    text: string;
    as?: React.ElementType;
    classname?: string;
    className?: string;
    variants?: Variants;
    letterAnime?: boolean;
    lineAnime?: boolean;
    direction?: 'up' | 'down' | 'left' | 'right';
    delay?: number;
    staggerDelay?: number;
    once?: boolean;
    threshold?: number;
}

const defaultVariantsMap: Record<string, Variants> = {
    up: {
        hidden: { filter: 'blur(8px)', opacity: 0, y: 20 },
        visible: { filter: 'blur(0px)', opacity: 1, y: 0 },
    },
    down: {
        hidden: { filter: 'blur(8px)', opacity: 0, y: -20 },
        visible: { filter: 'blur(0px)', opacity: 1, y: 0 },
    },
    left: {
        hidden: { filter: 'blur(8px)', opacity: 0, x: 20 },
        visible: { filter: 'blur(0px)', opacity: 1, x: 0 },
    },
    right: {
        hidden: { filter: 'blur(8px)', opacity: 0, x: -20 },
        visible: { filter: 'blur(0px)', opacity: 1, x: 0 },
    },
};

export default function TextAnimation({
    text,
    as: Tag = 'h2',
    classname,
    className,
    variants,
    letterAnime = false,
    lineAnime = false,
    direction = 'up',
    delay = 0,
    staggerDelay,
    once = true,
    threshold = 0.2,
}: TextAnimationProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, amount: threshold });

    const appliedVariants = variants || defaultVariantsMap[direction] || defaultVariantsMap.up;
    const cls = classname || className || '';

    // Split text into units
    const getUnits = (): string[] => {
        if (letterAnime) {
            return text.split('');
        }
        if (lineAnime) {
            // Split by lines (newlines or sentences separated by period)
            return text.split(/(?<=\s)/);
        }
        // Default: word by word
        return text.split(' ');
    };

    const units = getUnits();
    const baseStagger = staggerDelay ?? (letterAnime ? 0.03 : lineAnime ? 0.08 : 0.05);

    return (
        <Tag ref={ref} className={cls}>
            <motion.span
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                transition={{ staggerChildren: baseStagger, delayChildren: delay }}
                style={{ display: 'inline' }}
            >
                {units.map((unit, i) => (
                    <motion.span
                        key={`${unit}-${i}`}
                        variants={appliedVariants}
                        transition={{
                            duration: letterAnime ? 0.2 : 0.35,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                        style={{
                            display: 'inline-block',
                            whiteSpace: 'pre',
                        }}
                    >
                        {letterAnime ? unit : `${unit}${lineAnime ? '' : '\u00A0'}`}
                    </motion.span>
                ))}
            </motion.span>
        </Tag>
    );
}
