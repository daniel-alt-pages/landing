'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type TipPos = 'top' | 'bottom' | 'left' | 'right';

const TIP_SELECTOR = '[data-sg-tip], [title]';

function readTip(el: Element): { text: string; pos: TipPos } | null {
    const text = (el.getAttribute('data-sg-tip') || el.getAttribute('title') || '').trim();
    if (!text) return null;
    const raw = el.getAttribute('data-sg-tip-pos');
    const pos: TipPos =
        raw === 'bottom' || raw === 'left' || raw === 'right' || raw === 'top' ? raw : 'top';
    return { text, pos };
}

function migrateTitle(el: Element) {
    const title = el.getAttribute('title')?.trim();
    if (title && !el.getAttribute('data-sg-tip')) el.setAttribute('data-sg-tip', title);
    el.removeAttribute('title');
}

function tipPosition(
    anchor: DOMRect,
    bubble: DOMRect,
    pos: TipPos,
): { top: number; left: number } {
    const gap = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = 0;
    let left = 0;

    if (pos === 'right') {
        left = anchor.right + gap;
        top = anchor.top + anchor.height / 2 - bubble.height / 2;
    } else if (pos === 'left') {
        left = anchor.left - gap - bubble.width;
        top = anchor.top + anchor.height / 2 - bubble.height / 2;
    } else if (pos === 'bottom') {
        left = anchor.left + anchor.width / 2 - bubble.width / 2;
        top = anchor.bottom + gap;
    } else {
        left = anchor.left + anchor.width / 2 - bubble.width / 2;
        top = anchor.top - gap - bubble.height;
    }

    return {
        left: Math.max(8, Math.min(left, vw - bubble.width - 8)),
        top: Math.max(8, Math.min(top, vh - bubble.height - 8)),
    };
}

/** Tooltips SG — reemplaza `title` nativo dentro de `[data-coordinator-theme]`. */
export default function SgFloatingTipLayer({ scope = '[data-coordinator-theme]' }: { scope?: string }) {
    const bubbleRef = useRef<HTMLDivElement>(null);
    const anchorRef = useRef<Element | null>(null);
    const [visible, setVisible] = useState(false);
    const [text, setText] = useState('');
    const [pos, setPos] = useState<TipPos>('top');
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useLayoutEffect(() => {
        if (!visible || !anchorRef.current || !bubbleRef.current) return;
        const anchor = anchorRef.current.getBoundingClientRect();
        const bubble = bubbleRef.current.getBoundingClientRect();
        setCoords(tipPosition(anchor, bubble, pos));
    }, [visible, text, pos]);

    useEffect(() => {
        const root = document.querySelector(scope);
        if (!root) return;

        let hideTimer: ReturnType<typeof setTimeout> | null = null;

        const hide = () => {
            setVisible(false);
            anchorRef.current = null;
        };

        const show = (el: Element) => {
            migrateTitle(el);
            const tip = readTip(el);
            if (!tip) return;
            anchorRef.current = el;
            setText(tip.text);
            setPos(tip.pos);
            setVisible(true);
        };

        const hostFrom = (target: EventTarget | null) => {
            if (!(target instanceof Element)) return null;
            const el = target.closest(TIP_SELECTOR);
            return el && root.contains(el) ? el : null;
        };

        const onOver = (e: Event) => {
            const el = hostFrom(e.target);
            if (!el || !readTip(el)) return;
            if (hideTimer) clearTimeout(hideTimer);
            if (anchorRef.current !== el) show(el);
        };

        const onOut = (e: Event) => {
            const el = anchorRef.current;
            if (!el) return;
            const related = (e as MouseEvent).relatedTarget;
            if (related instanceof Node && el.contains(related)) return;
            hideTimer = setTimeout(hide, 60);
        };

        const onFocusIn = (e: Event) => {
            const el = hostFrom(e.target);
            if (!el || !readTip(el)) return;
            if (hideTimer) clearTimeout(hideTimer);
            show(el);
        };

        const onFocusOut = (e: Event) => {
            const el = anchorRef.current;
            if (!el) return;
            const related = (e as FocusEvent).relatedTarget;
            if (related instanceof Node && el.contains(related)) return;
            hide();
        };

        const onDismiss = () => hide();

        root.querySelectorAll('[title]').forEach(migrateTitle);

        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'attributes' && m.attributeName === 'title' && m.target instanceof Element) {
                    migrateTitle(m.target);
                }
                if (m.type === 'childList') {
                    for (const node of m.addedNodes) {
                        if (!(node instanceof Element)) continue;
                        if (node.hasAttribute('title')) migrateTitle(node);
                        node.querySelectorAll('[title]').forEach(migrateTitle);
                    }
                }
            }
        });
        observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] });

        root.addEventListener('mouseover', onOver);
        root.addEventListener('mouseout', onOut);
        root.addEventListener('focusin', onFocusIn);
        root.addEventListener('focusout', onFocusOut);
        window.addEventListener('scroll', onDismiss, true);
        window.addEventListener('resize', onDismiss);

        return () => {
            if (hideTimer) clearTimeout(hideTimer);
            observer.disconnect();
            root.removeEventListener('mouseover', onOver);
            root.removeEventListener('mouseout', onOut);
            root.removeEventListener('focusin', onFocusIn);
            root.removeEventListener('focusout', onFocusOut);
            window.removeEventListener('scroll', onDismiss, true);
            window.removeEventListener('resize', onDismiss);
        };
    }, [scope]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={bubbleRef}
            role="tooltip"
            className={`sg-floating-tip-bubble${visible ? ' sg-floating-tip-bubble--visible' : ''}`}
            data-arrow={pos}
            style={{
                top: coords.top,
                left: coords.left,
                visibility: visible ? 'visible' : 'hidden',
            }}
        >
            {text}
        </div>,
        document.body,
    );
}
