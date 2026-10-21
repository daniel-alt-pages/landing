'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { areaAccent } from '@features/recordings/lib/recordingsTheme';
import {
  buildRecordingsClasesHref,
  recordingAreaLabel,
} from '@features/recordings/lib/recordingsCatalog';
import { useSimRecordings } from '@features/recordings/hooks/useSimRecordings';
import { canAccessSimRecordingsCatalog } from '@features/recordings/lib/recordingsAccess';
import { SG_AREA_ORDER, sgAreaColor } from '@shared/lib/sgAreaColors';

type RecordingsPromoCardProps = {
  simulationId: string;
  href: string;
  variant?: 'light' | 'dark';
  documentId?: string | null;
  audience?: 'estudiante' | 'coordinador';
};

const PROMO_CSS = `
  @keyframes rpc-orb-drift {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.55; }
    50% { transform: translate(8%, -6%) scale(1.08); opacity: 0.85; }
  }
  @keyframes rpc-orb-drift-alt {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.45; }
    50% { transform: translate(-6%, 8%) scale(1.06); opacity: 0.75; }
  }
  @keyframes rpc-shimmer {
    0% { transform: translateX(-120%) skewX(-12deg); }
    100% { transform: translateX(220%) skewX(-12deg); }
  }
  @keyframes rpc-sparkle {
    0%, 100% { transform: rotate(0deg) scale(1); opacity: 1; }
    50% { transform: rotate(8deg) scale(1.08); opacity: 0.85; }
  }
  @keyframes rpc-border-glow {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.7; }
  }
  .rpc-orb-a { animation: rpc-orb-drift 9s ease-in-out infinite; }
  .rpc-orb-b { animation: rpc-orb-drift-alt 11s ease-in-out infinite; }
  .rpc-sparkle { animation: rpc-sparkle 2.8s ease-in-out infinite; }
  .rpc-border-glow { animation: rpc-border-glow 4s ease-in-out infinite; }
  .rpc-shimmer-track {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    border-radius: inherit;
  }
  .rpc-shimmer-track::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 42%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.07),
      rgba(255, 255, 255, 0.22),
      rgba(255, 255, 255, 0.07),
      transparent
    );
    transform: translateX(-120%) skewX(-12deg);
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .rpc-card:hover .rpc-shimmer-track::after,
  .rpc-card:focus-visible .rpc-shimmer-track::after {
    opacity: 1;
    animation: rpc-shimmer 1.1s ease-out forwards;
  }
  @media (prefers-reduced-motion: reduce) {
    .rpc-orb-a, .rpc-orb-b, .rpc-sparkle, .rpc-border-glow { animation: none !important; }
    .rpc-card:hover .rpc-shimmer-track::after,
    .rpc-card:focus-visible .rpc-shimmer-track::after { animation: none !important; opacity: 0 !important; }
  }
`;

export default function RecordingsPromoCard({
  simulationId,
  href,
  variant = 'light',
  documentId = null,
  audience = 'estudiante',
}: RecordingsPromoCardProps) {
  const router = useRouter();
  const { count, loading, hasRecordings, recordings, catalog } = useSimRecordings(simulationId);
  const isDark = variant === 'dark';
  const allowed = canAccessSimRecordingsCatalog(catalog, {
    documentId,
    audience,
  });

  const areasWithRecordings = useMemo(() => {
    const keys = new Set(recordings.map((r) => r.area));
    return SG_AREA_ORDER.filter((key) => keys.has(key));
  }, [recordings]);

  const areaCount = areasWithRecordings.length;

  const shellClass = useMemo(
    () =>
      isDark
        ? 'border-cyan-400/25 shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:border-cyan-400/45 hover:shadow-[0_20px_52px_rgba(6,182,212,0.18)]'
        : 'border-indigo-200/70 shadow-md shadow-indigo-100/50 hover:border-violet-300/80 hover:shadow-[0_20px_48px_rgba(99,102,241,0.16)]',
    [isDark],
  );

  useEffect(() => {
    if (!hasRecordings) return;
    router.prefetch(href);
    for (const key of areasWithRecordings) {
      router.prefetch(buildRecordingsClasesHref(href, key));
    }
  }, [areasWithRecordings, hasRecordings, href, router]);

  if (loading || !hasRecordings || !allowed) return null;

  return (
    <>
      <style>{PROMO_CSS}</style>
      <div
        className={`rpc-card group relative overflow-hidden rounded-[1.25rem] border transition-all duration-500 ${shellClass}`}
      >
        <div
          className={`pointer-events-none absolute inset-0 ${
            isDark
              ? 'bg-gradient-to-br from-slate-950 via-[#0f172a] to-indigo-950'
              : 'bg-gradient-to-br from-white via-indigo-50/50 to-violet-50/70'
          }`}
          aria-hidden
        />

        <div
          className={`rpc-orb-a pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full blur-3xl ${
            isDark ? 'bg-cyan-500/20' : 'bg-indigo-400/25'
          }`}
          aria-hidden
        />
        <div
          className={`rpc-orb-b pointer-events-none absolute -bottom-24 -right-12 h-64 w-64 rounded-full blur-3xl ${
            isDark ? 'bg-violet-600/20' : 'bg-violet-400/20'
          }`}
          aria-hidden
        />
        <div
          className={`rpc-border-glow pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${
            isDark
              ? 'from-transparent via-cyan-400/70 to-transparent'
              : 'from-transparent via-indigo-400/80 to-transparent'
          }`}
          aria-hidden
        />
        <div className="rpc-shimmer-track" aria-hidden />

        <div className="relative z-[1] flex min-w-0 flex-col justify-between gap-4 p-4 sm:p-5">
          <Link
            href={href}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
          >
            <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg shadow-sm ${
                  isDark
                    ? 'bg-gradient-to-br from-cyan-500/25 to-violet-600/20 text-cyan-300 ring-1 ring-cyan-400/25'
                    : 'bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 ring-1 ring-indigo-200/80'
                }`}
              >
                <Sparkles className="rpc-sparkle h-4 w-4" aria-hidden />
              </span>
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
                  isDark
                    ? 'bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent'
                }`}
              >
                Retro en vivo
              </p>
            </div>

            <h3
              className={`text-base font-black leading-tight tracking-tight sm:text-lg ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Grabaciones de retroalimentación
            </h3>
            <p
              className={`mt-1.5 text-xs leading-relaxed sm:text-sm ${
                isDark ? 'text-white/55' : 'text-slate-600'
              }`}
            >
              <span className="font-semibold">{count}</span> clase{count === 1 ? '' : 's'} para{' '}
              <span
                className={`font-bold ${
                  isDark
                    ? 'bg-gradient-to-r from-cyan-200 to-violet-200 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-700 bg-clip-text text-transparent'
                }`}
              >
                {simulationId}
              </span>
              . Repasa la explicación del docente por área.
            </p>
            </div>
          </Link>

          <div
            className={`flex items-center gap-1 rounded-xl border p-1 backdrop-blur-sm ${
              isDark
                ? 'border-white/10 bg-white/[0.04]'
                : 'border-indigo-100/90 bg-white/70'
            }`}
          >
            {areasWithRecordings.map((key, index) => {
              const c = sgAreaColor(key);
              const { icon: Icon, short } = areaAccent(key);
              const areaHref = buildRecordingsClasesHref(href, key);
              return (
                <Link
                  key={key}
                  href={areaHref}
                  aria-label={`Ver clases de ${recordingAreaLabel(key)}`}
                  className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5 transition-all duration-300 hover:scale-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-1 active:scale-[0.98]"
                  style={{
                    background: isDark
                      ? `linear-gradient(180deg, ${c.hex}22 0%, ${c.hex}08 100%)`
                      : `linear-gradient(180deg, ${c.hex}18 0%, ${c.hex}06 100%)`,
                    transitionDelay: `${index * 35}ms`,
                  }}
                >
                  <Icon
                    className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5"
                    style={{
                      color: isDark ? c.hex : c.hexDark,
                      transitionDelay: `${index * 35}ms`,
                    }}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span
                    className="max-w-full truncate text-[9px] font-bold uppercase tracking-wide sm:text-[10px]"
                    style={{ color: isDark ? `${c.hex}ee` : c.hexDark }}
                  >
                    {short}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={`text-[11px] font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              {areaCount} áreas · acceso incluido en tu plan
            </p>
            <Link
              href={href}
              className={`relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 sm:text-sm ${
                isDark
                  ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-violet-400 hover:shadow-cyan-400/30 hover:scale-[1.02]'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/35 hover:scale-[1.02]'
              } active:scale-[0.98]`}
            >
              Ver clases
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
