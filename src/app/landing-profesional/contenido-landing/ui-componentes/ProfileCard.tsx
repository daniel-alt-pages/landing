'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FocusEventHandler, type ReactNode } from 'react';
import { ArrowRight, Code2, Cpu, Sparkles } from 'lucide-react';
import Image from 'next/image';

type PixelAction = 'appear' | 'disappear';

class Pixel {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  color: string;
  speed: number;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSizeInteger: number;
  maxSize: number;
  delay: number;
  counter: number;
  counterStep: number;
  isIdle: boolean;
  isReverse: boolean;
  isShimmer: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    speed: number,
    delay: number,
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5;
    this.maxSizeInteger = 2;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
  }

  getRandomValue(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }

  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    if (this.size >= this.maxSize) {
      this.isShimmer = true;
    }
    if (this.isShimmer) {
      this.shimmer();
    } else {
      this.size += this.sizeStep;
    }
    this.draw();
  }

  disappear() {
    this.isShimmer = false;
    this.counter = 0;
    if (this.size <= 0) {
      this.isIdle = true;
      return;
    }
    this.size -= 0.1;
    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }
    this.size += this.isReverse ? -this.speed : this.speed;
  }
}

const VARIANTS = {
  default: {
    activeColor: null,
    gap: 5,
    speed: 35,
    colors: '#f8fafc,#f1f5f9,#cbd5e1',
    noFocus: false,
  },
  blue: {
    activeColor: '#e0f2fe',
    gap: 8,
    speed: 30,
    colors: '#e0f2fe,#7dd3fc,#22d3ee,#38bdf8',
    noFocus: false,
  },
  yellow: {
    activeColor: '#fef08a',
    gap: 3,
    speed: 20,
    colors: '#fef08a,#fde047,#eab308',
    noFocus: false,
  },
  pink: {
    activeColor: '#fecdd3',
    gap: 6,
    speed: 80,
    colors: '#fecdd3,#fda4af,#e11d48',
    noFocus: true,
  },
};

function getEffectiveSpeed(value: number, reducedMotion: boolean) {
  if (value <= 0 || reducedMotion) return 0;
  if (value >= 100) return 0.1;
  return value * 0.001;
}

function PixelCard({
  variant = 'blue',
  gap,
  speed,
  colors,
  noFocus,
  pulseKey,
  className = '',
  style,
  children,
}: {
  variant?: keyof typeof VARIANTS;
  gap?: number;
  speed?: number;
  colors?: string;
  noFocus?: boolean;
  pulseKey?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number | null>(null);
  const timePreviousRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const variantCfg = VARIANTS[variant] || VARIANTS.default;
  const finalGap = gap ?? variantCfg.gap;
  const finalSpeed = speed ?? variantCfg.speed;
  const finalColors = colors ?? variantCfg.colors;
  const finalNoFocus = noFocus ?? variantCfg.noFocus;

  const initPixels = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.5);
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colorsArray = finalColors.split(',');
    const pxs: Pixel[] = [];
    const step = Math.max(2, parseInt(finalGap.toString(), 10));
    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < height; y += step) {
        const color = colorsArray[Math.floor(Math.random() * colorsArray.length)] || '#e0f2fe';
        const dx = x - width / 2;
        const dy = y - height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const delay = reducedMotionRef.current ? 0 : distance;
        pxs.push(new Pixel(canvas, ctx, x, y, color, getEffectiveSpeed(finalSpeed, reducedMotionRef.current), delay));
      }
    }
    pixelsRef.current = pxs;
  };

  const doAnimate = (fnName: PixelAction) => {
    animationRef.current = window.requestAnimationFrame(() => doAnimate(fnName));
    const timeNow = performance.now();
    const timePassed = timeNow - timePreviousRef.current;
    const timeInterval = 1000 / 60;
    if (timePassed < timeInterval) return;
    timePreviousRef.current = timeNow - (timePassed % timeInterval);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let allIdle = true;
    for (const pixel of pixelsRef.current) {
      pixel[fnName]();
      if (!pixel.isIdle) allIdle = false;
    }
    if (allIdle && animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const handleAnimation = (name: PixelAction) => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
    }
    timePreviousRef.current = performance.now();
    animationRef.current = window.requestAnimationFrame(() => doAnimate(name));
  };

  const onFocus: FocusEventHandler<HTMLDivElement> = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    handleAnimation('appear');
  };

  const onBlur: FocusEventHandler<HTMLDivElement> = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    handleAnimation('disappear');
  };

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    initPixels();
    const observer = new ResizeObserver(initPixels);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalGap, finalSpeed, finalColors, finalNoFocus]);

  useEffect(() => {
    if (pulseKey === undefined) return;
    handleAnimation('appear');
    const timer = window.setTimeout(() => handleAnimation('disappear'), 1200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulseKey]);

  return (
    <div
      ref={containerRef}
      className={`relative isolate grid select-none place-items-center overflow-hidden rounded-[25px] border border-white/12 ${className}`}
      style={style}
      onMouseEnter={() => handleAnimation('appear')}
      onMouseLeave={() => handleAnimation('disappear')}
      onFocus={finalNoFocus ? undefined : onFocus}
      onBlur={finalNoFocus ? undefined : onBlur}
      tabIndex={finalNoFocus ? -1 : 0}
    >
      {children}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-30 block h-full w-full mix-blend-screen" />
    </div>
  );
}

export type ProfileCardProps = {
  name: string;
  title: string;
  handle: string;
  status: string;
  contactText: string;
  avatarUrl: string;
  images?: string[];
  showUserInfo?: boolean;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  onContactClick?: () => void;
  behindGlowColor?: string;
  iconUrl?: string;
  behindGlowEnabled?: boolean;
  innerGradient?: string;
  shellClassName?: string;
};

export default function ProfileCard({
  name,
  title,
  handle,
  status,
  contactText,
  avatarUrl,
  images,
  showUserInfo = true,
  enableTilt = true,
  onContactClick,
  behindGlowColor = 'rgba(125, 190, 255, 0.67)',
  iconUrl,
  behindGlowEnabled = true,
  innerGradient = 'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)',
  shellClassName,
}: ProfileCardProps) {
  const gallery = useMemo(() => (images?.length ? images : [avatarUrl]), [avatarUrl, images]);
  const [imageIndex, setImageIndex] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);
  const currentImage = gallery[imageIndex % gallery.length] || avatarUrl;
  const imageObjectPosition = currentImage.includes('IMG-20260514-WA0001') ? 'left center' : 'center center';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const preloadTargets = [
      gallery[imageIndex % gallery.length],
      gallery[(imageIndex + 1) % gallery.length],
    ].filter(Boolean) as string[];
    for (const src of preloadTargets) {
      const image = new window.Image();
      image.decoding = 'async';
      image.loading = 'lazy';
      image.src = src;
    }
  }, [gallery, imageIndex]);

  useEffect(() => {
    if (gallery.length <= 1 || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % gallery.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [gallery.length, reduceMotion]);

  return (
    <div className={shellClassName ?? 'cotiz-profile-card-shell relative mx-auto w-full max-w-[23rem]'}>
      {behindGlowEnabled ? (
        <div
          className="pointer-events-none absolute -inset-8 rounded-[2.5rem] blur-3xl"
          style={{ background: behindGlowColor, opacity: 0.34 }}
          aria-hidden
        />
      ) : null}
      <PixelCard
        pulseKey={imageIndex}
        variant="blue"
        className="w-full bg-slate-950 shadow-2xl shadow-cyan-950/35 transition-[height] duration-500"
        style={{ aspectRatio: '1280 / 1450' }}
      >
        <div
          className="absolute inset-0 z-10 transition-transform duration-300 ease-out"
          style={{
            transform: enableTilt ? `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` : undefined,
            background: innerGradient,
          }}
          onMouseMove={(event) => {
            if (!enableTilt) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width - 0.5;
            const py = (event.clientY - rect.top) / rect.height - 0.5;
            setTilt({ x: px * 7, y: py * -7 });
          }}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        >
          <Image
            key={currentImage}
            src={currentImage}
            alt={`${name}, desarrollador de la plataforma SEAMOSGENIOS`}
            fill
            sizes="(min-width: 1024px) 23rem, 92vw"
            className="object-cover opacity-95 transition-opacity duration-700"
            style={{ objectPosition: imageObjectPosition }}
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.02)_0%,rgba(2,6,23,0.08)_58%,rgba(2,6,23,0.28)_100%)]" />
        </div>

        <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
            {status}
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md">
            {iconUrl ? (
              <Image src={iconUrl} alt="" width={20} height={20} className="h-5 w-5" unoptimized />
            ) : (
              <Code2 className="h-5 w-5" aria-hidden />
            )}
          </div>
        </div>

        <div className="absolute inset-x-4 bottom-4 z-20 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200/20 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-cyan-100 backdrop-blur-md">
            <Cpu className="h-3.5 w-3.5" aria-hidden />
            Plataforma completa
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            IA + educación
          </span>
        </div>
      </PixelCard>

      {showUserInfo ? (
        <div className="relative z-10 mt-3 rounded-[1.25rem] border border-white/12 bg-slate-950/90 p-4 text-white shadow-xl shadow-cyan-950/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">@{handle}</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight">{name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-white/62">{title}</p>
          <button
            type="button"
            onClick={onContactClick}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          >
            {contactText}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
