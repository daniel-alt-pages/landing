'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  animate,
  motion,
  type MotionValue,
  type PanInfo,
  type Transition,
  useDragControls,
  useMotionValue,
  useTransform,
} from 'framer-motion';

export type MethodShowcase3DSlide = {
  id: string | number;
  title: string;
  description?: string;
  icon?: ReactNode;
  content?: ReactNode;
  /** Tiempo en esta diapositiva antes del autoplay (p. ej. demo Drive ~15 s + vídeo) */
  autoplayHoldMs?: number;
};

export type MethodShowcase3DCarouselProps = {
  slides: MethodShowcase3DSlide[];
  isLightLanding: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  itemHeight?: number;
  /** Zona visual 16:9 (ancho tarjeta ÷ ratio + pie si hay content) */
  contentAspectRatio?: number;
  /** Alto del pie título+descripción bajo el content (px) */
  contentFooterHeight?: number;
  /** wide = ancho casi completo del contenedor padre (sección Método) */
  layout?: 'default' | 'wide';
};

const DEFAULT_CONTENT_FOOTER_HEIGHT = 76;

/** true solo en la tarjeta centrada del carrusel 3D (p. ej. pausar demo Drive) */
export const MethodShowcase3DActiveContext = createContext(false);

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS: Transition = { type: 'spring', stiffness: 300, damping: 30 };

function isCarouselDragBlocked(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('iframe, video, button, a, input, textarea, select, [data-no-carousel-drag]'),
  );
}

type SlideShellProps = {
  slide: MethodShowcase3DSlide;
  index: number;
  isActive: boolean;
  itemWidth: number;
  itemHeight: number;
  contentAreaHeight?: number;
  trackItemOffset: number;
  x: MotionValue<number>;
  transition: Transition;
  isLightLanding: boolean;
  dragControls: ReturnType<typeof useDragControls>;
};

function Showcase3DSlideShell({
  slide,
  index,
  isActive,
  itemWidth,
  itemHeight,
  contentAreaHeight,
  trackItemOffset,
  x,
  transition,
  isLightLanding,
  dragControls,
}: SlideShellProps) {
  const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
  const rotateY = useTransform(x, range, [28, 0, -28], { clamp: false });

  const shellClass = isLightLanding
    ? 'border-slate-200/90 bg-white text-slate-900 shadow-lg shadow-slate-900/10'
    : 'border-white/12 bg-[#0f1a2e] text-white shadow-xl shadow-black/30';

  return (
    <motion.div
      className={`relative flex shrink-0 flex-col overflow-hidden rounded-2xl border ${shellClass} ${
        isActive ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{
        width: itemWidth,
        height: itemHeight,
        rotateY,
      }}
      transition={transition}
      onPointerDown={(event) => {
        if (!isActive || isCarouselDragBlocked(event.target)) return;
        dragControls.start(event);
      }}
    >
      {slide.content ? (
        <>
          <div
            className="method-showcase-card-content flex min-h-0 flex-col overflow-hidden"
            style={
              contentAreaHeight != null
                ? { height: contentAreaHeight, flex: '0 0 auto' }
                : { flex: '1 1 auto' }
            }
          >
            {slide.content}
          </div>
          <div
            className={`shrink-0 border-t px-4 py-3 ${
              isLightLanding ? 'border-slate-200/80' : 'border-white/10'
            }`}
          >
            <p className="text-sm font-bold leading-snug sm:text-base">{slide.title}</p>
            {slide.description ? (
              <p
                className={`mt-1 text-xs leading-relaxed sm:text-sm ${isLightLanding ? 'text-slate-600' : 'text-white/60'}`}
              >
                {slide.description}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <>
          {slide.icon ? (
            <div className="p-5 pb-0">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  isLightLanding ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-500/15 text-cyan-200'
                }`}
              >
                {slide.icon}
              </span>
            </div>
          ) : null}
          <div className="flex flex-1 flex-col justify-end p-5 pt-3">
            <p className="text-lg font-bold leading-snug">{slide.title}</p>
            {slide.description ? (
              <p className={`mt-2 text-sm leading-relaxed ${isLightLanding ? 'text-slate-600' : 'text-white/65'}`}>
                {slide.description}
              </p>
            ) : null}
          </div>
        </>
      )}
    </motion.div>
  );
}

export function MethodShowcase3DCarousel({
  slides,
  isLightLanding,
  autoplay = true,
  autoplayDelay = 5000,
  pauseOnHover = true,
  loop = true,
  itemHeight: itemHeightProp = 400,
  contentAspectRatio,
  contentFooterHeight = DEFAULT_CONTENT_FOOTER_HEIGHT,
  layout = 'default',
}: MethodShowcase3DCarouselProps) {
  const isWide = layout === 'wide';
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelAtRef = useRef(0);
  const [baseWidth, setBaseWidth] = useState(isWide ? 640 : 360);
  const [framePaddingX, setFramePaddingX] = useState(32);

  useEffect(() => {
    const measure = () => {
      const frame = containerRef.current;
      const outer = outerRef.current;
      const node = frame ?? outer;
      if (!node) return;

      if (frame) {
        const styles = getComputedStyle(frame);
        const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
        setFramePaddingX(padX);
        setBaseWidth(Math.max(300, frame.clientWidth));
        return;
      }

      const w = outer?.clientWidth ?? 360;
      if (isWide) {
        setBaseWidth(Math.max(300, w));
        return;
      }
      setBaseWidth(Math.min(520, Math.max(280, w)));
    };

    measure();
    const targets = [outerRef.current, containerRef.current].filter(Boolean) as Element[];
    const ro = new ResizeObserver(measure);
    targets.forEach((t) => ro.observe(t));
    return () => ro.disconnect();
  }, [isWide]);

  const itemWidth = Math.max(260, baseWidth - framePaddingX);
  const trackItemOffset = itemWidth + GAP;

  const contentAreaHeight =
    contentAspectRatio != null && contentAspectRatio > 0
      ? Math.round(itemWidth / contentAspectRatio)
      : undefined;

  const itemHeight =
    contentAreaHeight != null
      ? contentAreaHeight + contentFooterHeight
      : itemHeightProp;

  const iconSlideHeight =
    contentAspectRatio != null && contentAspectRatio > 0
      ? Math.round(itemWidth / contentAspectRatio)
      : itemHeight;

  const itemsForRender = useMemo(() => {
    if (!loop || slides.length === 0) return slides;
    return [slides[slides.length - 1], ...slides, slides[0]];
  }, [slides, loop]);

  const [position, setPosition] = useState(loop && slides.length > 0 ? 1 : 0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();
  const positionRef = useRef(position);
  positionRef.current = position;

  useEffect(() => {
    if (!pauseOnHover || !containerRef.current) return undefined;
    const container = containerRef.current;
    const onEnter = () => setIsHovered(true);
    const onLeave = () => setIsHovered(false);
    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mouseleave', onLeave);
    return () => {
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('mouseleave', onLeave);
    };
  }, [pauseOnHover]);

  const activeSlideIndex =
    slides.length === 0
      ? 0
      : loop
        ? (position - 1 + slides.length) % slides.length
        : Math.min(position, slides.length - 1);

  const currentHoldMs = slides[activeSlideIndex]?.autoplayHoldMs ?? autoplayDelay;

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) return undefined;
    if (pauseOnHover && isHovered) return undefined;

    const timer = setInterval(() => {
      setPosition((prev) => Math.min(prev + 1, itemsForRender.length - 1));
    }, currentHoldMs);

    return () => clearInterval(timer);
  }, [autoplay, currentHoldMs, isHovered, pauseOnHover, itemsForRender.length]);

  useEffect(() => {
    const start = loop && slides.length > 0 ? 1 : 0;
    setPosition(start);
    x.set(-start * trackItemOffset);
  }, [slides.length, loop, trackItemOffset, x]);

  useEffect(() => {
    if (!loop && position > itemsForRender.length - 1) {
      setPosition(Math.max(0, itemsForRender.length - 1));
    }
  }, [itemsForRender.length, loop, position]);

  const snapTrackToPosition = useCallback(
    (targetPosition: number, instant = false) => {
      const targetX = -targetPosition * trackItemOffset;
      if (instant || isJumping) {
        x.set(targetX);
        return undefined;
      }
      return animate(x, targetX, {
        ...SPRING_OPTIONS,
        onComplete: () => {
          const pos = positionRef.current;
          if (!loop || slides.length <= 1) return;

          const lastCloneIndex = itemsForRender.length - 1;
          if (pos === lastCloneIndex) {
            setIsJumping(true);
            const jumpTo = 1;
            setPosition(jumpTo);
            x.set(-jumpTo * trackItemOffset);
            requestAnimationFrame(() => setIsJumping(false));
            return;
          }
          if (pos === 0) {
            setIsJumping(true);
            const jumpTo = slides.length;
            setPosition(jumpTo);
            x.set(-jumpTo * trackItemOffset);
            requestAnimationFrame(() => setIsJumping(false));
          }
        },
      });
    },
    [trackItemOffset, x, loop, slides.length, itemsForRender.length],
  );

  useEffect(() => {
    if (isDragging) return;
    const controls = snapTrackToPosition(position, isJumping);
    return () => {
      controls?.stop();
    };
  }, [position, isDragging, isJumping, snapTrackToPosition]);

  const effectiveTransition: Transition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  const goToOffset = useCallback(
    (direction: number) => {
      if (direction === 0) return;
      setPosition((prev) => {
        const next = prev + direction;
        const max = itemsForRender.length - 1;
        return Math.max(0, Math.min(next, max));
      });
    },
    [itemsForRender.length],
  );

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const { offset, velocity } = info;
    const max = itemsForRender.length - 1;
    let next = positionRef.current;

    if (offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD) {
      next += 1;
    } else if (offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD) {
      next -= 1;
    } else {
      const draggedIndex = Math.round(-x.get() / trackItemOffset);
      next = draggedIndex;
    }

    setPosition(Math.max(0, Math.min(next, max)));
  };

  useEffect(() => {
    const frame = containerRef.current;
    if (!frame || slides.length <= 1) return undefined;

    const onWheel = (event: WheelEvent) => {
      const dominantVertical = Math.abs(event.deltaY) >= Math.abs(event.deltaX);
      if (!dominantVertical || Math.abs(event.deltaY) < 6) return;
      const now = Date.now();
      if (now - lastWheelAtRef.current < 380) return;
      lastWheelAtRef.current = now;
      event.preventDefault();
      goToOffset(event.deltaY > 0 ? 1 : -1);
    };

    frame.addEventListener('wheel', onWheel, { passive: false });
    return () => frame.removeEventListener('wheel', onWheel);
  }, [slides.length, goToOffset]);

  const dragConstraints = {
    left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0),
    right: 0,
  };

  const activeIndex =
    slides.length === 0
      ? 0
      : loop
        ? (position - 1 + slides.length) % slides.length
        : Math.min(position, slides.length - 1);

  if (slides.length === 0) return null;

  const frameClass = isLightLanding
    ? 'rounded-[1.75rem] border border-slate-200/90 bg-slate-50/80'
    : 'rounded-[1.75rem] border border-white/10 bg-black/20';

  const outerClass = isWide
    ? 'mx-auto my-1 w-full min-w-0 max-w-[min(68rem,100%)] px-1 sm:my-2 sm:px-2 lg:px-4'
    : 'mx-auto w-full max-w-[min(32rem,100%)]';

  return (
    <div ref={outerRef} className={outerClass}>
      <div
        ref={containerRef}
        className={`relative overflow-hidden p-4 sm:p-6 ${isWide ? 'sm:px-7' : ''} ${frameClass}`}
        style={{ width: '100%', ...(isWide ? {} : { maxWidth: baseWidth, margin: '0 auto' }) }}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Capacidades del método"
      >
        <motion.div
          className="flex w-max cursor-grab touch-none select-none active:cursor-grabbing"
          drag={isJumping ? false : 'x'}
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={dragConstraints}
          dragElastic={0.12}
          dragMomentum={false}
          style={{
            gap: `${GAP}px`,
            perspective: 1200,
            perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
            x,
          }}
          onPointerDown={(event) => {
            if (isCarouselDragBlocked(event.target)) return;
            dragControls.start(event);
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {itemsForRender.map((slide, index) => {
            const isActive = index === position;
            return (
              <MethodShowcase3DActiveContext.Provider key={`${slide.id}-${index}`} value={isActive}>
                <Showcase3DSlideShell
                  slide={slide}
                  index={index}
                  isActive={isActive}
                  itemWidth={itemWidth}
                  itemHeight={slide.content ? itemHeight : iconSlideHeight}
                  contentAreaHeight={slide.content ? contentAreaHeight : undefined}
                  trackItemOffset={trackItemOffset}
                  x={x}
                  transition={effectiveTransition}
                  isLightLanding={isLightLanding}
                  dragControls={dragControls}
                />
              </MethodShowcase3DActiveContext.Provider>
            );
          })}
        </motion.div>

        {slides.length > 1 ? (
          <div className="mt-4 flex justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Ir a ${slide.title}`}
                aria-current={activeIndex === index ? 'true' : undefined}
                className={`h-2 rounded-full transition-all ${
                  activeIndex === index
                    ? `w-7 ${isLightLanding ? 'bg-cyan-600' : 'bg-cyan-300'}`
                    : `w-2 ${isLightLanding ? 'bg-slate-300 hover:bg-slate-400' : 'bg-white/25 hover:bg-white/40'}`
                }`}
                onClick={() => setPosition(loop ? index + 1 : index)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
