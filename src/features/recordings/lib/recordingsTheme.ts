import {
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  Languages,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { sgAreaColor, type SgAreaKey } from '@shared/lib/sgAreaColors';
import {
  CLASES_EXTRA_AREA_KEY,
  CLASES_EXTRA_AREA_SHORT,
  isPlataformaAreaKey,
  PLATAFORMA_AREA_SHORT,
} from '@shared/lib/sgClasesExtra';

export type AreaAccent = {
  hex: string;
  icon: LucideIcon;
  short: string;
};

const AREA_ICONS: Record<SgAreaKey, LucideIcon> = {
  'lectura crítica': BookOpen,
  matemáticas: Calculator,
  'sociales y ciudadanas': Globe,
  'ciencias naturales': FlaskConical,
  inglés: Languages,
};

const DEFAULT_ACCENT: AreaAccent = {
  hex: '#818cf8',
  icon: BookOpen,
  short: 'SG',
};

export function areaAccent(areaKey: string): AreaAccent {
  const normalized = areaKey.trim().toLowerCase();
  if (isPlataformaAreaKey(normalized)) {
    return { hex: '#64748b', icon: Plus, short: PLATAFORMA_AREA_SHORT };
  }
  if (normalized === CLASES_EXTRA_AREA_KEY) {
    return { hex: '#0D9488', icon: Plus, short: CLASES_EXTRA_AREA_SHORT };
  }
  const c = sgAreaColor(areaKey);
  const icon = AREA_ICONS[c.key as SgAreaKey] ?? BookOpen;
  if (c.key in AREA_ICONS) {
    return { hex: c.hex, icon, short: c.short };
  }
  return DEFAULT_ACCENT;
}

export type RecordingsTheme = {
  shell: string;
  ambientA: string;
  ambientB: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  meta: string;
  backBtn: string;
  statChip: string;
  statChipAccent: string;
  sidebarCard: string;
  sidebarScroll: string;
  groupEyebrow: string;
  playerCard: string;
  playerEyebrow: string;
  playerTitle: string;
  playerHint: string;
  loading: string;
  error: string;
  commentsShell: string;
  commentsTitle: string;
  commentsHint: string;
  accentGradient: string;
};

export function recordingsTheme(variant: 'light' | 'dark'): RecordingsTheme {
  if (variant === 'dark') {
    return {
      shell: 'text-white',
      ambientA: 'bg-cyan-500/10',
      ambientB: 'bg-violet-600/10',
      eyebrow: 'text-violet-300/80',
      title: 'text-white',
      subtitle: 'text-white/55',
      meta: 'text-white/35',
      backBtn:
        'border-white/10 bg-white/[0.04] text-white/80 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400/40',
      statChip: 'border-white/10 bg-white/[0.04] text-white/70',
      statChipAccent: 'text-cyan-300',
      sidebarCard:
        'rounded-2xl border border-white/[0.08] bg-[#111827]/90 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
      sidebarScroll:
        'min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pr-1',
      groupEyebrow: 'text-white/45',
      playerCard:
        'rounded-2xl border border-white/[0.08] bg-[#111827]/90 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.4)]',
      playerEyebrow: 'text-cyan-300/70',
      playerTitle: 'text-white',
      playerHint: 'text-white/40',
      loading: 'border-white/10 bg-white/[0.03] text-white/50',
      error: 'border-white/10 bg-white/[0.03] text-white/50',
      commentsShell: 'border-white/12 bg-gradient-to-br from-white/[0.03] to-violet-500/[0.04]',
      commentsTitle: 'text-white/50',
      commentsHint: 'text-white/30',
      accentGradient: 'from-cyan-400 via-violet-400 to-indigo-400',
    };
  }

  return {
    shell: 'text-slate-900',
    ambientA: 'bg-teal-100/40',
    ambientB: 'bg-slate-200/40',
    eyebrow: 'text-teal-700',
    title: 'text-slate-900',
    subtitle: 'text-slate-600',
    meta: 'text-slate-400',
    backBtn:
      'border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50/80 hover:text-teal-800 focus-visible:ring-2 focus-visible:ring-teal-300',
    statChip: 'border-slate-200 bg-white text-slate-600',
    statChipAccent: 'text-teal-700',
    sidebarCard: 'rounded-lg border border-slate-200 bg-white',
    sidebarScroll:
      'min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pr-1',
    groupEyebrow: 'text-slate-500',
    playerCard: 'rounded-lg border border-slate-200 bg-white',
    playerEyebrow: 'text-teal-700',
    playerTitle: 'text-slate-900',
    playerHint: 'text-slate-400',
    loading: 'border-slate-200 bg-white text-slate-500',
    error: 'border-slate-200 bg-white text-slate-500',
    commentsShell: 'border-slate-200 bg-slate-50',
    commentsTitle: 'text-slate-500',
    commentsHint: 'text-slate-400',
    accentGradient: 'from-teal-600 via-teal-500 to-sky-500',
  };
}

export function catalogListItemClass(variant: 'light' | 'dark', selected: boolean): string {
  const base =
    'flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2';
  if (selected) {
    return `${base} ring-1 focus-visible:ring-offset-0 ${
      variant === 'dark'
        ? 'text-white ring-white/10 focus-visible:ring-white/25'
        : 'text-slate-900 ring-slate-200/80 focus-visible:ring-violet-300'
    }`;
  }
  return variant === 'dark'
    ? `${base} border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20 hover:bg-white/[0.05] focus-visible:ring-cyan-400/40`
    : `${base} border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-violet-300`;
}

export function sessionItemClass(variant: 'light' | 'dark', selected: boolean): string {
  const base =
    'w-full rounded-xl border px-3 py-3 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2';
  if (selected) {
    return `${base} ring-1 focus-visible:ring-offset-0 ${
      variant === 'dark'
        ? 'text-white ring-white/10 focus-visible:ring-white/25'
        : 'text-slate-900 ring-slate-200/80 focus-visible:ring-violet-300'
    }`;
  }
  return variant === 'dark'
    ? `${base} border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20 hover:bg-white/[0.05] focus-visible:ring-cyan-400/40`
    : `${base} border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-violet-300`;
}
