'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import gsap from 'gsap';
import './DepthCarousel.css';

type Slide = { image: string; alt: string };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type Props = {
  items: Slide[];
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tint?: string;
  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: 'left' | 'right';
  perspective?: number;
  visibleCards?: number;
  falloff?: number;
  blur?: number;
  duration?: number;
  ease?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  align?: 'center' | 'start';
  label?: string;
  onActivate?: (index: number) => void;
};

export function DepthCarousel({
  items,
  cardWidth = 220,
  cardHeight = 300,
  radius = 16,
  tint = '#1a1a1a',
  depth = 160,
  spread = 70,
  tilt = 18,
  tiltDirection = 'right',
  perspective = 1400,
  visibleCards = 3,
  falloff = 0.18,
  blur = 5,
  duration = 700,
  ease = 'power3.out',
  autoplay = false,
  autoplayDelay = 3200,
  loop = true,
  showControls = true,
  showIndicators = true,
  align = 'center',
  label = 'Carrusel',
  onActivate,
}: Props) {
  const data = useMemo(() => items, [items]);
  const count = data.length;

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const posRef = useRef(0);
  const focusRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const scaleRef = useRef(1);
  const dragRef = useRef<{
    x: number;
    startPos: number;
    lastX: number;
    lastT: number;
    v: number;
    moved: boolean;
    id: number;
  } | null>(null);
  const wheelTimerRef = useRef<number>(0);
  const autoTimerRef = useRef<number>(0);
  const reducedRef = useRef(false);
  const onActivateRef = useRef(onActivate);
  const [active, setActive] = useState(0);

  onActivateRef.current = onActivate;

  const cfgRef = useRef({
    count, depth, spread, tilt, tiltDirection, visibleCards, falloff, blur, duration, ease, loop, cardWidth, cardHeight, autoplayDelay, align,
  });
  cfgRef.current = {
    count, depth, spread, tilt, tiltDirection, visibleCards, falloff, blur, duration, ease, loop, cardWidth, cardHeight, autoplayDelay, align,
  };

  const layout = useCallback((pos: number) => {
    const cfg = cfgRef.current;
    const n = cfg.count;
    if (!n) return;
    const dir = cfg.tiltDirection === 'left' ? -1 : 1;
    const sc = scaleRef.current;
    const root = rootRef.current;
    const stageW = root?.clientWidth ?? 0;
    const half = (cfg.cardWidth * sc) / 2;
    const anchor = cfg.align === 'start' || stageW < 1 ? half : stageW / 2;
    const shift = stageW > 0 ? anchor - stageW / 2 : 0;
    if (root) {
      root.style.setProperty('--dc-half', `${half}px`);
      root.style.setProperty('--dc-half-h', `${(cfg.cardHeight * sc) / 2}px`);
      root.style.setProperty('--dc-anchor', `${anchor}px`);
    }

    for (let i = 0; i < n; i += 1) {
      const el = cardRefs.current[i];
      if (!el) continue;
      let d = i - pos;
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const back = Math.max(0, d);
      const az = Math.abs(d);
      const shown = az <= cfg.visibleCards + 0.5;
      const tz = -cfg.depth * d;
      const tx = dir * cfg.spread * d;
      const ry = dir * cfg.tilt * clamp(d, 0, 1);
      let opacity = d < 0 ? Math.max(0, 1 + d) : 1;
      if (!shown) opacity = 0;
      const brightness = Math.max(0.15, 1 - back * cfg.falloff);
      const away = Math.abs(d);
      const blurPx = cfg.blur > 0 && away > 0.05 ? Math.min(cfg.blur * away, cfg.blur * 1.35) : 0;
      el.style.transform = `translateX(${shift.toFixed(2)}px) translate(-50%, -50%) scale(${sc}) translateX(${tx.toFixed(2)}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`;
      el.style.zIndex = String(Math.round(2000 - d * 20));
      el.style.pointerEvents = shown && opacity > 0.05 ? 'auto' : 'none';
      const overlay = overlayRefs.current[i];
      if (overlay) overlay.style.opacity = clamp(back * cfg.falloff * 1.25, 0, 0.86).toFixed(3);
    }
  }, []);

  const tweenTo = useCallback((target: number, animate: boolean) => {
    tweenRef.current?.kill();
    const cfg = cfgRef.current;
    const proxy = { p: posRef.current };
    tweenRef.current = gsap.to(proxy, {
      p: target,
      duration: animate && !reducedRef.current ? cfg.duration / 1000 : 0,
      ease: cfg.ease,
      onUpdate: () => {
        posRef.current = proxy.p;
        layout(proxy.p);
      },
      onComplete: () => {
        const n = cfg.count;
        if (n > 0) posRef.current = ((posRef.current % n) + n) % n;
        layout(posRef.current);
      },
    });
  }, [layout]);

  const setFocus = useCallback((rawIndex: number, animate = true) => {
    const cfg = cfgRef.current;
    const n = cfg.count;
    if (!n) return;
    const idx = cfg.loop ? ((rawIndex % n) + n) % n : clamp(rawIndex, 0, n - 1);
    let delta = idx - posRef.current;
    if (cfg.loop && n > 1) {
      delta = ((delta % n) + n) % n;
      if (delta > n / 2) delta -= n;
    }
    tweenTo(posRef.current + delta, animate);
    if (idx !== focusRef.current) {
      focusRef.current = idx;
      setActive(idx);
    }
  }, [tweenTo]);

  const navigateBy = useCallback((step: number) => setFocus(focusRef.current + step, true), [setFocus]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const cfg = cfgRef.current;
      const available = Math.max(width - 36, 220);
      scaleRef.current = clamp(available / cfg.cardWidth, 0.62, 1);
      layout(posRef.current);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [layout]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const onWheel = (event: WheelEvent) => {
      const cfg = cfgRef.current;
      if (cfg.count < 2) return;
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;
      if (!horizontal) return;
      event.preventDefault();
      tweenRef.current?.kill();
      const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const delta = event.deltaMode === 1 ? raw * 24 : raw;
      posRef.current += clamp(delta / (cfg.cardWidth * 0.9), -0.6, 0.6);
      layout(posRef.current);
      window.clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = window.setTimeout(() => setFocus(Math.round(posRef.current), true), 130);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.clearTimeout(wheelTimerRef.current);
    };
  }, [layout, setFocus]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (cfgRef.current.count < 2) return;
    tweenRef.current?.kill();
    dragRef.current = {
      x: event.clientX,
      startPos: posRef.current,
      lastX: event.clientX,
      lastT: performance.now(),
      v: 0,
      moved: false,
      id: event.pointerId,
    };
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const cfg = cfgRef.current;
    const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40);
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) {
      drag.moved = true;
      rootRef.current?.setPointerCapture(drag.id);
    }
    if (!drag.moved) return;
    const now = performance.now();
    const dt = Math.max(now - drag.lastT, 1);
    drag.v = (event.clientX - drag.lastX) / dt;
    drag.lastX = event.clientX;
    drag.lastT = now;
    posRef.current = drag.startPos - dx / stepPx;
    layout(posRef.current);
  }, [layout]);

  const onPointerEnd = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (!drag.moved) return;
    const cfg = cfgRef.current;
    const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40);
    setFocus(Math.round(posRef.current - (drag.v * 180) / stepPx), true);
  }, [setFocus]);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!autoplay || reducedRef.current || count < 2) return undefined;
    const root = rootRef.current;
    let hovered = false;
    let focused = false;
    const stop = () => {
      window.clearInterval(autoTimerRef.current);
      autoTimerRef.current = 0;
    };
    const start = () => {
      stop();
      autoTimerRef.current = window.setInterval(() => {
        if (!hovered && !focused) navigateBy(1);
      }, Math.max(cfgRef.current.autoplayDelay, 600));
    };
    const onEnter = () => { hovered = true; };
    const onLeave = () => { hovered = false; };
    const onFocusIn = () => { focused = true; };
    const onFocusOut = () => { focused = false; };
    root?.addEventListener('mouseenter', onEnter);
    root?.addEventListener('mouseleave', onLeave);
    root?.addEventListener('focusin', onFocusIn);
    root?.addEventListener('focusout', onFocusOut);
    start();
    return () => {
      stop();
      root?.removeEventListener('mouseenter', onEnter);
      root?.removeEventListener('mouseleave', onLeave);
      root?.removeEventListener('focusin', onFocusIn);
      root?.removeEventListener('focusout', onFocusOut);
    };
  }, [autoplay, autoplayDelay, count, navigateBy]);

  useEffect(() => {
    layout(posRef.current);
  }, [layout, depth, spread, tilt, tiltDirection, visibleCards, falloff, blur, cardWidth, cardHeight, radius, count, align]);

  useEffect(() => () => {
    tweenRef.current?.kill();
    window.clearTimeout(wheelTimerRef.current);
    window.clearInterval(autoTimerRef.current);
  }, []);

  return (
    <div
      ref={rootRef}
      className="depth-carousel"
      style={{
        ['--dc-perspective' as string]: `${perspective}px`,
        ['--dc-half' as string]: `${cardWidth / 2}px`,
        ['--dc-half-h' as string]: `${cardHeight / 2}px`,
      }}
      role="group"
      aria-roledescription="carrusel"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          navigateBy(-1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          navigateBy(1);
        }
      }}
    >
      <div className="depth-carousel__stage">
        {data.map((item, index) => (
          <div
            key={item.image}
            className="depth-carousel__card"
            ref={(el) => { cardRefs.current[index] = el; }}
            style={{ width: cardWidth, height: cardHeight, borderRadius: radius }}
            aria-roledescription="diapositiva"
            aria-label={`${index + 1} de ${count}`}
            aria-hidden={active !== index}
            onClick={() => {
              if (dragRef.current?.moved) return;
              if (index === focusRef.current) onActivateRef.current?.(index);
              else setFocus(index, true);
            }}
          >
            <img className="depth-carousel__img" src={item.image} alt={item.alt} draggable={false} />
            <span
              className="depth-carousel__tint"
              ref={(el) => { overlayRefs.current[index] = el; }}
              style={{ background: tint }}
            />
          </div>
        ))}
      </div>
      {showControls && count > 1 ? (
        <>
          <button type="button" className="depth-carousel__arrow depth-carousel__arrow--prev" aria-label={`Imágenes anteriores de ${label}`} onClick={() => navigateBy(-1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="depth-carousel__arrow depth-carousel__arrow--next" aria-label={`Imágenes siguientes de ${label}`} onClick={() => navigateBy(1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      ) : null}
      {showIndicators && count > 1 ? (
        <div className="depth-carousel__dots" role="tablist" aria-label={label}>
          {data.map((item, index) => (
            <button
              key={item.image}
              type="button"
              role="tab"
              aria-selected={active === index}
              aria-label={`Ir a la imagen ${index + 1} de ${label}`}
              className={active === index ? 'depth-carousel__dot is-active' : 'depth-carousel__dot'}
              onClick={() => setFocus(index, true)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
