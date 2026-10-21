'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe2,
  GraduationCap,
  Heart,
  Lock,
  MapPin,
  Phone,
  Sparkles,
  Trophy,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  formatPifaRangeBogota,
  PIFA_RESULTS_CLASSES,
  PIFA_WATERMARK_URL,
  pifaClassStartMs,
  pifaCountdownTargetMs,
  pifaIsLive,
  pifaMeetUnlockMs,
  pifaMeetUnlocked,
  resolvePifaCoverTheme,
  resolvePifaResultsGate,
  type PifaCoverTheme,
  type PifaResultsClass,
} from '@features/estudiante/lib/pifaResultsClassGate';
import VacacionalCountdownFlip from '@features/curso/components/VacacionalCountdownFlip';
import { getCountdownToClassStartParts } from '@features/curso/lib/courseVacacionalEventTime';
import { ensureStudentFloatDock } from '@features/estudiante/lib/studentFloatDock';
import BlurText from '@/components/BlurText';

function flipThemeVars(theme: PifaCoverTheme, surface: 'light' | 'dark') {
  if (surface === 'dark') {
    return {
      ['--course-text' as string]: '#f8fafc',
      ['--course-text-muted' as string]: 'rgba(248,250,252,0.55)',
      ['--course-border' as string]: 'rgba(255,255,255,0.18)',
      ['--course-surface' as string]: theme.panel,
      ['--course-surface-muted' as string]: 'rgba(255,255,255,0.08)',
      ['--course-accent' as string]: theme.glow,
    };
  }
  return {
    ['--course-text' as string]: '#0f172a',
    ['--course-text-muted' as string]: '#64748b',
    ['--course-border' as string]: theme.border,
    ['--course-surface' as string]: '#ffffff',
    ['--course-surface-muted' as string]: theme.soft,
    ['--course-accent' as string]: theme.main,
  };
}

function panelGradient(theme: PifaCoverTheme): string {
  return `linear-gradient(165deg, ${theme.panel} 0%, ${theme.panelDeep} 55%, ${theme.deep} 140%)`;
}

function PifaFlipCountdown({
  targetMs,
  now,
  label,
  theme,
  tone = 'accent',
  surface = 'dark',
}: {
  targetMs: number;
  now: number;
  label: string;
  theme: PifaCoverTheme;
  tone?: 'accent' | 'amber' | 'rose';
  surface?: 'light' | 'dark';
}) {
  const parts = getCountdownToClassStartParts(new Date(targetMs), now);
  if (!parts) return null;
  const light = surface === 'light';
  const boxStyle =
    tone === 'accent'
      ? light
        ? { borderColor: theme.border, background: theme.soft, color: theme.ink }
        : {
            borderColor: `${theme.glow}66`,
            background: `color-mix(in srgb, ${theme.main} 18%, transparent)`,
            color: theme.glow,
          }
      : undefined;
  const toneClass = light
    ? tone === 'amber'
      ? 'border-amber-200 bg-amber-50'
      : tone === 'rose'
        ? 'border-rose-200 bg-rose-50'
        : 'border'
    : tone === 'amber'
      ? 'border-amber-400/35 bg-amber-500/15'
      : tone === 'rose'
        ? 'border-rose-400/35 bg-rose-500/15'
        : 'border';
  const labelClass = light
    ? tone === 'amber'
      ? 'text-amber-800'
      : tone === 'rose'
        ? 'text-rose-800'
        : ''
    : tone === 'amber'
      ? 'text-amber-200'
      : tone === 'rose'
        ? 'text-rose-200'
        : '';

  return (
    <div
      className={`rounded-xl border px-3 py-3 ${toneClass}`}
      style={{ ...flipThemeVars(theme, surface), ...boxStyle }}
    >
      <p
        className={`mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] ${labelClass}`}
        style={
          tone === 'accent'
            ? { color: light ? theme.ink : theme.glow }
            : undefined
        }
      >
        {label}
      </p>
      <VacacionalCountdownFlip parts={parts} prefix="" />
    </div>
  );
}

/** Soft: una vez por sesión de panel. */
const PIFA_SOFT_SEEN_KEY = 'sg_pifa_soft_gate_seen';

type Props = {
  disabled?: boolean;
};

function PifaWatermark({ opacityClass = 'opacity-[0.08]' }: { opacityClass?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PIFA_WATERMARK_URL}
        alt=""
        className={`absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 object-contain ${opacityClass}`}
        decoding="async"
      />
    </div>
  );
}

function MetaPill({
  icon: Icon,
  children,
  tone = 'neutral',
  theme,
}: {
  icon: LucideIcon;
  children: ReactNode;
  tone?: 'neutral' | 'accent';
  theme: PifaCoverTheme;
}) {
  const accent = tone === 'accent';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm"
      style={{
        background: accent
          ? `color-mix(in srgb, ${theme.main} 28%, rgba(255,255,255,0.06))`
          : 'rgba(255,255,255,0.08)',
        color: accent ? theme.glow : 'rgba(248,250,252,0.82)',
        boxShadow: accent
          ? `inset 0 0 0 1px color-mix(in srgb, ${theme.glow} 55%, transparent)`
          : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
      }}
    >
      <Icon
        className="h-3.5 w-3.5 shrink-0"
        style={{ color: accent ? theme.glow : 'rgba(248,250,252,0.65)' }}
        aria-hidden
      />
      {children}
    </span>
  );
}

/** Carrusel de portadas (Stitch: arrows + dots + swipe). */
function CoverCarousel({
  classes,
  activeId,
  onActiveChange,
  badgeFor,
}: {
  classes: PifaResultsClass[];
  activeId?: string | null;
  onActiveChange?: (id: string) => void;
  badgeFor?: (cls: PifaResultsClass) => string;
}) {
  const initial = Math.max(
    0,
    classes.findIndex((c) => c.id === activeId),
  );
  const [index, setIndex] = useState(initial >= 0 ? initial : 0);
  const indexRef = useRef(index);
  indexRef.current = index;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const multi = classes.length > 1;

  useEffect(() => {
    const i = classes.findIndex((c) => c.id === activeId);
    if (i >= 0) {
      indexRef.current = i;
      setIndex(i);
    }
  }, [activeId, classes]);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(classes.length - 1, next));
      indexRef.current = clamped;
      setIndex(clamped);
      const el = scrollerRef.current;
      const slide = el?.children[clamped] as HTMLElement | undefined;
      slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      const cls = classes[clamped];
      if (cls) onActiveChange?.(cls.id);
    },
    [classes, onActiveChange],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !multi) return;
    const onScroll = () => {
      const slides = Array.from(el.children) as HTMLElement[];
      if (!slides.length) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((slide, i) => {
        const center = slide.offsetLeft + slide.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      // No llamar onActiveChange dentro del updater de setState (rompe React).
      if (indexRef.current === best) return;
      indexRef.current = best;
      setIndex(best);
      const cls = classes[best];
      if (cls) onActiveChange?.(cls.id);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [classes, multi, onActiveChange]);

  const current = classes[index] ?? classes[0];
  if (!current) return null;
  const theme = resolvePifaCoverTheme(current.accent);

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {classes.map((cls, i) => {
          const slideTheme = resolvePifaCoverTheme(cls.accent);
          return (
            <div key={cls.id} className="relative w-full shrink-0 snap-center">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cls.coverUrl}
                  alt={`Portada PIFA #${cls.number}: ${cls.title}`}
                  className="h-full w-full object-cover object-top"
                  decoding={i === index ? 'sync' : 'async'}
                  fetchPriority={i === index ? 'high' : 'auto'}
                  draggable={false}
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"
                  aria-hidden
                />
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-md"
                    style={{
                      background: `${slideTheme.soft}f2`,
                      color: slideTheme.ink,
                      boxShadow: `inset 0 0 0 1px ${slideTheme.border}`,
                    }}
                  >
                    <GraduationCap className="h-3.5 w-3.5" style={{ color: slideTheme.main }} aria-hidden />
                    PIFA #{cls.number}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-md"
                    style={{ color: slideTheme.ink, boxShadow: `inset 0 0 0 1px ${slideTheme.border}` }}
                  >
                    <Sparkles className="h-3.5 w-3.5" style={{ color: slideTheme.main }} aria-hidden />
                    {badgeFor?.(cls) ?? formatPifaRangeBogota(cls)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {multi ? (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index <= 0}
            className="absolute left-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/20 backdrop-blur disabled:opacity-30"
            aria-label="Portada anterior"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index >= classes.length - 1}
            className="absolute right-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/20 backdrop-blur disabled:opacity-30"
            aria-label="Portada siguiente"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          <div className="flex items-center justify-center gap-1.5 py-2.5">
            {classes.map((c, i) => {
              const t = resolvePifaCoverTheme(c.accent);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? 'w-6' : 'w-2 bg-white/25'}`}
                  style={i === index ? { background: t.glow } : undefined}
                  aria-label={`Ir a clase #${c.number}`}
                />
              );
            })}
          </div>
        </>
      ) : null}

      <div className="space-y-2 px-4 pb-1 pt-3">
        <h3 className="text-lg font-black leading-snug text-white">{current.title}</h3>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/65">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
            <Trophy className="h-3.5 w-3.5 text-amber-400" aria-hidden />
            {current.tutor}
          </span>
          {current.badge ? <span className="text-white/50">· {current.badge}</span> : null}
        </p>
        <div className="flex flex-wrap gap-2 pt-0.5">
          <MetaPill icon={Clock} tone="accent" theme={theme}>
            {formatPifaRangeBogota(current)}
          </MetaPill>
          <MetaPill icon={Globe2} theme={theme}>
            America/Bogota
          </MetaPill>
          <MetaPill icon={MapPin} theme={theme}>
            Google Meet
          </MetaPill>
        </div>
      </div>
    </div>
  );
}

function wasSoftSeenThisSession(): boolean {
  if (typeof window === 'undefined') return true;
  return sessionStorage.getItem(PIFA_SOFT_SEEN_KEY) === '1';
}

function markSoftSeenThisSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PIFA_SOFT_SEEN_KEY, '1');
}

function ModalShell({
  children,
  zClass,
  labelledBy,
  describedBy,
  urgent,
}: {
  children: ReactNode;
  zClass: string;
  labelledBy: string;
  describedBy?: string;
  urgent?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Portal a body: evita que «¿Cómo se calcula?» (también portal) gane el stacking.
  return createPortal(
    <div
      className={`fixed inset-0 ${zClass} overflow-y-auto overscroll-contain ${
        urgent ? 'bg-rose-950/85' : 'bg-slate-900/55'
      } backdrop-blur-md`}
      role={urgent ? 'alertdialog' : 'dialog'}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      data-pifa-modal=""
    >
      <div className="flex min-h-[100dvh] w-full items-center justify-center p-3 sm:p-6">
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** FAB delgado en dock inferior (móvil izq / desktop junto a «¿Cómo se calcula?»). */
function PifaFloatingButton({
  live,
  theme,
  onClick,
}: {
  live: boolean;
  theme: PifaCoverTheme;
  onClick: () => void;
}) {
  const [dock, setDock] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setDock(ensureStudentFloatDock());
  }, []);

  const fab = (
    <>
      <style>{`
        @keyframes pifa-fab-pulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--pifa-fab-accent) 40%, transparent); }
          50% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--pifa-fab-accent) 0%, transparent); }
        }
        .pifa-fab-pulse { animation: pifa-fab-pulse 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pifa-fab-pulse { animation: none; }
        }
      `}</style>
      <button
        type="button"
        onClick={onClick}
        data-pifa-fab=""
        className={`pifa-fab-pulse pointer-events-auto order-1 inline-flex h-9 max-w-[min(100%,14rem)] items-center gap-1.5 rounded-full border px-2.5 text-white shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 lg:order-1 ${
          live
            ? 'border-rose-300/50 bg-gradient-to-r from-rose-600 to-rose-500 shadow-rose-700/30'
            : 'border-white/30 shadow-slate-900/20'
        }`}
        style={
          live
            ? undefined
            : {
                ['--pifa-fab-accent' as string]: theme.main,
                background: `linear-gradient(135deg, ${theme.main}, ${theme.deep})`,
              }
        }
        aria-label="Mis clases PIFA — ver programación del día"
      >
        {live ? (
          <Heart className="h-3.5 w-3.5 shrink-0 fill-white" aria-hidden />
        ) : (
          <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span className="min-w-0 truncate text-[11px] font-bold tracking-tight">
          <span className="sm:hidden">{live ? 'EN VIVO' : 'PIFA'}</span>
          <span className="hidden sm:inline">{live ? 'PIFA · EN VIVO' : 'Mis clases PIFA'}</span>
        </span>
      </button>
    </>
  );

  if (!dock) return null;
  return createPortal(fab, dock);
}

function MeetUnlockButton({
  cls,
  now,
  className,
}: {
  cls: PifaResultsClass;
  now: number;
  className?: string;
}) {
  const theme = resolvePifaCoverTheme(cls.accent);
  const unlocked = pifaMeetUnlocked(cls, now);
  if (!unlocked) {
    return (
      <div className="space-y-2">
        <PifaFlipCountdown
          targetMs={pifaMeetUnlockMs(cls)}
          now={now}
          label="Meet se abre en"
          theme={theme}
          tone="amber"
          surface="dark"
        />
        <p className="text-center text-[11px] leading-relaxed text-white/50">
          El enlace de Meet se activa 15 minutos antes de que empiece la clase.
        </p>
        <button
          type="button"
          disabled
          className={`inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-white/10 text-sm font-bold text-white/40 ring-1 ring-white/10 ${className ?? ''}`}
          aria-disabled="true"
        >
          <Lock className="h-4 w-4" aria-hidden />
          Meet aún no disponible
        </button>
      </div>
    );
  }

  return (
    <a
      href={cls.meetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-md transition hover:brightness-110 ${className ?? ''}`}
      style={{ background: `linear-gradient(135deg, ${theme.main}, ${theme.deep})` }}
    >
      <Video className="h-4 w-4" aria-hidden />
      Abrir Meet · #{cls.number}
    </a>
  );
}

function SoftGateModal({
  classes,
  focusId,
  now,
  onDismiss,
}: {
  classes: PifaResultsClass[];
  focusId: string;
  now: number;
  onDismiss: () => void;
}) {
  const [slideId, setSlideId] = useState(focusId);
  const active = classes.find((c) => c.id === slideId) ?? classes[0];
  const theme = resolvePifaCoverTheme(active?.accent);
  const focusCls = classes.find((c) => c.id === focusId) ?? active;

  return (
    <ModalShell zClass="z-[240]" labelledBy="pifa-soft-title">
      <div
        className="relative my-auto flex w-full max-w-lg max-h-[min(92dvh,920px)] flex-col overflow-hidden rounded-[1.75rem] border border-white/15 shadow-2xl shadow-black/50 transition-[background] duration-300"
        style={{ background: panelGradient(theme) }}
      >
        <PifaWatermark opacityClass="opacity-[0.07]" />
        <div className="h-1.5 w-full shrink-0 transition-colors" style={{ background: theme.main }} aria-hidden />
        <div className="relative flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-white/30" aria-hidden />
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
          aria-label="Cerrar aviso"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 pb-2 pt-2 pr-14">
            <p
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors"
              style={{ color: theme.glow }}
            >
              <Lock className="h-3 w-3" aria-hidden />
              Hoy hay clase · resultados en pausa
            </p>
            <BlurText
              as="h2"
              id="pifa-soft-title"
              text="Tu agenda PIFA de hoy"
              className="mt-1 text-xl font-black text-white"
              direction="bottom"
            />
            <p className="mt-1.5 text-sm text-white/70">
              Mira las portadas. Meet se abre 15 minutos antes de la clase. El botón{' '}
              <span className="font-semibold transition-colors" style={{ color: theme.glow }}>
                Mis clases PIFA
              </span>{' '}
              queda abajo, junto a la barra de navegación.
            </p>
          </div>
          <CoverCarousel
            classes={classes}
            activeId={slideId}
            onActiveChange={setSlideId}
            badgeFor={() => 'Hoy'}
          />
          <div className="space-y-3 px-4 pb-5 pt-2">
            {focusCls ? (
              <PifaFlipCountdown
                targetMs={pifaClassStartMs(focusCls)}
                now={now}
                label="La clase empieza en"
                theme={resolvePifaCoverTheme(focusCls.accent)}
                tone="accent"
                surface="dark"
              />
            ) : null}
            {active ? <MeetUnlockButton cls={active} now={now} /> : null}
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold shadow-md transition hover:bg-white/90"
              style={{ color: theme.deep }}
            >
              <Check className="h-4 w-4" aria-hidden />
              Entendido, seguir al panel
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function ScheduleModal({
  classes,
  focusId,
  now,
  onClose,
}: {
  classes: PifaResultsClass[];
  focusId: string | null;
  now: number;
  onClose: () => void;
}) {
  const [slideId, setSlideId] = useState(focusId ?? classes[0]?.id ?? null);
  const active = classes.find((c) => c.id === slideId) ?? classes[0];
  const theme = resolvePifaCoverTheme(active?.accent);

  return (
    <ModalShell zClass="z-[230]" labelledBy="pifa-schedule-title">
      <div
        className="relative my-auto flex w-full max-w-lg max-h-[min(92dvh,920px)] flex-col overflow-hidden rounded-[1.75rem] border border-white/15 shadow-2xl shadow-black/50 transition-[background] duration-300"
        style={{ background: panelGradient(theme) }}
      >
        <PifaWatermark opacityClass="opacity-[0.07]" />
        <div className="h-1.5 w-full shrink-0 transition-colors" style={{ background: theme.main }} aria-hidden />
        <div className="relative flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-white/30" aria-hidden />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
          aria-label="Cerrar programación"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 pb-2 pt-2 pr-14">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.18em] transition-colors"
              style={{ color: theme.glow }}
            >
              Programación de hoy
            </p>
            <BlurText
              as="h2"
              id="pifa-schedule-title"
              text="Mis clases PIFA"
              className="mt-1 text-xl font-black text-white"
              direction="bottom"
            />
            <p className="mt-1 text-sm text-white/70">
              Desliza las portadas. 15 minutos antes de la clase se bloquea la pantalla para que entres a Meet.
            </p>
          </div>

          <CoverCarousel
            classes={classes}
            activeId={slideId}
            onActiveChange={setSlideId}
            badgeFor={(c) => (c.id === focusId ? 'Próxima' : formatPifaRangeBogota(c))}
          />

          {active ? (
            <div className="space-y-3 px-4 pb-5 pt-2">
              {pifaIsLive(active, now) ? (
                <p
                  className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold"
                  style={{
                    background: `color-mix(in srgb, ${theme.main} 22%, transparent)`,
                    color: theme.glow,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${theme.glow} 55%, transparent)`,
                  }}
                >
                  <Clock className="h-4 w-4" aria-hidden />
                  Clase en curso ahora
                </p>
              ) : (
                <PifaFlipCountdown
                  targetMs={pifaClassStartMs(active)}
                  now={now}
                  label="La clase empieza en"
                  theme={theme}
                  tone="accent"
                  surface="dark"
                />
              )}
              <MeetUnlockButton cls={active} now={now} />
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold shadow-md transition hover:bg-white/90"
                style={{ color: theme.deep }}
              >
                <Check className="h-4 w-4" aria-hidden />
                Entendido
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}

export default function StudentPifaResultsClassGate({ disabled = false }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [softDismissed, setSoftDismissed] = useState(() => wasSoftSeenThisSession());
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const snap = useMemo(() => resolvePifaResultsGate(undefined, now), [now]);
  const dayClasses = useMemo(() => {
    if (snap.upcoming.length) return snap.upcoming;
    return PIFA_RESULTS_CLASSES;
  }, [snap.upcoming]);

  const showSoft = !disabled && snap.mode === 'soft' && !softDismissed && !!snap.focus;
  const showHard = !disabled && snap.mode === 'hard' && !!snap.focus;
  const scheduleVisible = scheduleOpen && snap.mode !== 'hard' && !disabled;
  const pifaOverlayOpen = showSoft || showHard || scheduleVisible;

  const showFab =
    !disabled &&
    !snap.allEnded &&
    (snap.mode === 'soft' || snap.mode === 'hard') &&
    !pifaOverlayOpen;
  const fabFocus = snap.focus;
  const fabLive = fabFocus ? pifaIsLive(fabFocus, now) : false;

  useEffect(() => {
    if (disabled || snap.mode !== 'hard') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [disabled, snap.mode]);

  useEffect(() => {
    const root = document.documentElement;
    if (pifaOverlayOpen) root.setAttribute('data-pifa-overlay', '1');
    else root.removeAttribute('data-pifa-overlay');
    return () => root.removeAttribute('data-pifa-overlay');
  }, [pifaOverlayOpen]);

  const dismissSoft = useCallback(() => {
    markSoftSeenThisSession();
    setSoftDismissed(true);
  }, []);

  useEffect(() => {
    if (disabled || snap.mode !== 'soft' || softDismissed) return;
    markSoftSeenThisSession();
  }, [disabled, snap.mode, softDismissed]);

  useEffect(() => {
    if (snap.mode === 'hard') setScheduleOpen(false);
  }, [snap.mode]);

  const fabTheme = resolvePifaCoverTheme(fabFocus?.accent);
  const hardTheme = resolvePifaCoverTheme(snap.focus?.accent);

  if (disabled) return null;

  return (
    <>
      {showFab && fabFocus ? (
        <PifaFloatingButton live={fabLive} theme={fabTheme} onClick={() => setScheduleOpen(true)} />
      ) : null}

      {scheduleVisible ? (
        <ScheduleModal
          classes={dayClasses}
          focusId={snap.focus?.id ?? null}
          now={now}
          onClose={() => setScheduleOpen(false)}
        />
      ) : null}

      {showSoft ? (
        <SoftGateModal
          classes={snap.upcoming.length ? snap.upcoming : [snap.focus!]}
          focusId={snap.focus!.id}
          now={now}
          onDismiss={dismissSoft}
        />
      ) : null}

      {showHard ? (
        <>
          <style>{`
            @keyframes pifa-heart {
              0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.55); }
              14% { transform: scale(1.045); }
              28% { transform: scale(1); box-shadow: 0 0 0 16px rgba(244, 63, 94, 0); }
              42% { transform: scale(1.06); }
              70% { transform: scale(1); }
            }
            @keyframes pifa-heart-cta {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.04); }
            }
            .pifa-heart-card { animation: pifa-heart 1.05s ease-in-out infinite; }
            .pifa-heart-cta { animation: pifa-heart-cta 0.9s ease-in-out infinite; }
            @media (prefers-reduced-motion: reduce) {
              .pifa-heart-card, .pifa-heart-cta { animation: none; }
            }
          `}</style>
          <ModalShell
            zClass="z-[260]"
            labelledBy="pifa-hard-title"
            describedBy="pifa-hard-desc"
            urgent
          >
            <div className="pifa-heart-card relative my-auto flex w-full max-w-xl max-h-[min(92dvh,920px)] flex-col overflow-hidden rounded-[1.75rem] border-2 border-rose-400/70 bg-[#1E1333] shadow-2xl shadow-rose-900/50">
              <PifaWatermark opacityClass="opacity-[0.06]" />
              <CoverCarousel
                classes={[snap.focus!]}
                activeId={snap.focus!.id}
                badgeFor={() =>
                  pifaIsLive(snap.focus!, now) ? 'EN VIVO — ÚNETE' : 'EMERGENCIA · ≤15 min'
                }
              />
              <div className="relative space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/25 text-rose-300 ring-2 ring-rose-400/50">
                    <Heart className="h-6 w-6 fill-rose-400 text-rose-300" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">
                      Ventana de emergencia
                    </p>
                    <BlurText
                      key={snap.focus!.id}
                      as="h2"
                      id="pifa-hard-title"
                      text={snap.focus!.title}
                      className="mt-1 text-xl font-black text-white"
                      direction="bottom"
                    />
                    <p id="pifa-hard-desc" className="mt-2 text-sm text-white/75">
                      Pantalla bloqueada. Entra a Meet ahora.
                    </p>
                  </div>
                </div>
                {pifaIsLive(snap.focus!, now) ? (
                  <PifaFlipCountdown
                    targetMs={pifaCountdownTargetMs(snap.focus!, now)}
                    now={now}
                    label="La clase termina en"
                    theme={hardTheme}
                    tone="rose"
                    surface="dark"
                  />
                ) : (
                  <PifaFlipCountdown
                    targetMs={pifaClassStartMs(snap.focus!)}
                    now={now}
                    label="La clase empieza en"
                    theme={hardTheme}
                    tone="rose"
                    surface="dark"
                  />
                )}
                {(snap.focus!.dial || snap.focus!.pin) && (
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-white/60">
                    <Phone className="h-3.5 w-3.5 text-indigo-300" aria-hidden />
                    {snap.focus!.dial}
                    {snap.focus!.pin ? (
                      <span className="font-semibold text-white/80">PIN {snap.focus!.pin}</span>
                    ) : null}
                  </p>
                )}
                <a
                  href={snap.focus!.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pifa-heart-cta inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-base font-black text-white shadow-lg shadow-rose-600/40"
                >
                  <Video className="h-5 w-5" aria-hidden />
                  Unirme a la clase ahora
                </a>
                <p className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-rose-200/90">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  No puedes cerrar esta alerta mientras la clase esté activa
                </p>
              </div>
            </div>
          </ModalShell>
        </>
      ) : null}
    </>
  );
}
