import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Icon, LandingTone } from '../tipos';

type ScientificChartPanel = {
  label: string;
  title: string;
  metric: string;
  description: string;
  kind: 'line' | 'bars';
  values: readonly number[];
};

export function Pill({ surface, children }: { surface: 'light' | 'dark'; children: ReactNode }) {
  const onLightChrome = surface === 'light';
  return (
    <span
      className={
        onLightChrome
          ? 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm'
          : 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70'
      }
    >
      {children}
    </span>
  );
}

export function GradientIcon({ icon: IconComponent }: { icon: Icon }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.06] text-white">
      <IconComponent className="h-5 w-5" aria-hidden />
    </div>
  );
}

export function AccessCard({
  icon,
  title,
  text,
  tone = 'dark',
}: {
  icon: Icon;
  title: string;
  text: string;
  tone?: LandingTone;
}) {
  const isLight = tone === 'light';
  return (
    <article
      className={
        isLight
          ? 'eg-card group border border-[rgba(130,96,75,0.16)] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]'
          : 'eg-card group border border-white/16 bg-white/[0.035] p-5'
      }
    >
      <GradientIcon icon={icon} />
      <h3 className={`mt-5 text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
      <p className={`mt-2 text-sm leading-6 ${isLight ? 'text-slate-600' : 'text-white/62'}`}>{text}</p>
    </article>
  );
}

export function ScientificMiniChart({
  panel,
  tone,
}: {
  panel: ScientificChartPanel;
  tone: LandingTone;
}) {
  const isLight = tone === 'light';
  const max = Math.max(...panel.values);
  const min = Math.min(...panel.values);
  const range = Math.max(max - min, 1);
  const linePoints = panel.values
    .map((value, index) => {
      const x = 14 + index * (172 / Math.max(panel.values.length - 1, 1));
      const y = 78 - ((value - min) / range) * 48;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <article
      className={`overflow-hidden rounded-[1.35rem] border p-4 ${
        isLight
          ? 'border-slate-200 bg-slate-50 text-slate-950 shadow-sm shadow-slate-900/5'
          : 'border-white/[0.08] bg-white/[0.035] text-white shadow-xl shadow-black/20'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${isLight ? 'text-cyan-700' : 'text-cyan-300/90'}`}>
            {panel.label}
          </p>
          <h3 className="mt-2 text-sm font-semibold">{panel.title}</h3>
        </div>
        <p className={`font-mono text-lg font-semibold tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {panel.metric}
        </p>
      </div>

      <svg
        viewBox="0 0 200 96"
        role="img"
        aria-label={`${panel.title}: ${panel.description}`}
        className={`mt-4 h-24 w-full ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}
      >
        <line x1="12" y1="82" x2="188" y2="82" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
        <line x1="12" y1="58" x2="188" y2="58" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
        <line x1="12" y1="34" x2="188" y2="34" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
        {panel.kind === 'line' ? (
          <>
            <polyline
              points={linePoints}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
            />
            {panel.values.map((value, index) => {
              const x = 14 + index * (172 / Math.max(panel.values.length - 1, 1));
              const y = 78 - ((value - min) / range) * 48;
              return <circle key={`${panel.title}-${value}-${index}`} cx={x} cy={y} r="4.5" fill="currentColor" />;
            })}
          </>
        ) : (
          panel.values.map((value, index) => {
            const height = Math.max(12, (value / 100) * 62);
            const x = 20 + index * 35;
            return (
              <rect
                key={`${panel.title}-${value}-${index}`}
                x={x}
                y={82 - height}
                width="18"
                height={height}
                rx="5"
                fill="currentColor"
                opacity={0.42 + index * 0.1}
              />
            );
          })
        )}
      </svg>

      <p className={`mt-3 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
        {panel.description}
      </p>
      <p className={`mt-2 font-mono text-[10px] uppercase tracking-[0.18em] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
        Visual ilustrativo
      </p>
    </article>
  );
}


export function CursorLinkButton({
  tone,
  href,
  children,
  external,
}: {
  tone: LandingTone;
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const isLight = tone === 'light';
  const cls = isLight
    ? 'group inline-flex items-center gap-1 text-sm font-semibold text-slate-800 underline decoration-slate-300 underline-offset-4 transition hover:decoration-cyan-700/75 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-400/35 rounded-sm'
    : 'group inline-flex items-center gap-1 text-sm font-semibold text-white/88 underline decoration-white/25 underline-offset-4 transition hover:decoration-cyan-300/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 rounded-sm';
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={cls}
    >
      {children}
      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
    </a>
  );
}

