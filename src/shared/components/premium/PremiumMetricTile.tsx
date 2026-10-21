'use client';

import type { ElementType, ReactNode } from 'react';
import PremiumMiniRing from './PremiumMiniRing';

export type PremiumMetricTone = 'amber' | 'rose' | 'indigo' | 'cyan';

const TONE_PALETTE: Record<
  PremiumMetricTone,
  { text: string; value: string; glow: string; bar: string; bg: string }
> = {
  amber: {
    text: 'text-amber-200',
    value: 'text-amber-300',
    glow: 'rgba(245,158,11,0.22)',
    bar: '#f59e0b',
    bg: 'from-amber-500/[0.16]',
  },
  rose: {
    text: 'text-rose-200',
    value: 'text-rose-300',
    glow: 'rgba(244,63,94,0.22)',
    bar: '#fb7185',
    bg: 'from-rose-500/[0.16]',
  },
  indigo: {
    text: 'text-indigo-200',
    value: 'text-white',
    glow: 'rgba(99,102,241,0.22)',
    bar: '#818cf8',
    bg: 'from-indigo-500/[0.16]',
  },
  cyan: {
    text: 'text-cyan-200',
    value: 'text-white',
    glow: 'rgba(34,211,238,0.18)',
    bar: '#22d3ee',
    bg: 'from-cyan-500/[0.13]',
  },
};

type PremiumMetricTileProps = {
  label: string;
  value: string | number;
  detail: string;
  icon?: ElementType;
  tone?: PremiumMetricTone;
  progress?: number;
  ringColor?: string;
  trailing?: ReactNode;
  className?: string;
};

export default function PremiumMetricTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'indigo',
  progress = 0,
  ringColor,
  trailing,
  className = '',
}: PremiumMetricTileProps) {
  const palette = TONE_PALETTE[tone];
  const bar = ringColor ?? palette.bar;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${palette.bg} to-white/[0.025] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-transform duration-300 hover:-translate-y-0.5 ${className}`}
      style={{ boxShadow: `0 24px 80px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.05)` }}
    >
      <div className="pointer-events-none absolute -right-10 -top-14 h-28 w-28 rounded-full bg-white/[0.05] blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${palette.text}`}>{label}</p>
          <p className={`mt-2 text-4xl font-black tabular-nums tracking-tight ${palette.value}`}>{value}</p>
          <p className="mt-1 text-[11px] font-semibold text-white/72">{detail}</p>
        </div>
        {trailing ?? (
          <div className="relative shrink-0">
            <PremiumMiniRing value={progress} color={bar} />
            {Icon ? (
              <Icon className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white/70" />
            ) : null}
          </div>
        )}
      </div>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(4, Math.min(progress, 100))}%`, background: bar }}
        />
      </div>
    </div>
  );
}
