'use client';

import { ArrowRight, LogIn, Moon, Sun } from 'lucide-react';
import type { LandingTone } from '../tipos';

type LandingNavActionsProps = {
  tone: LandingTone;
  onToggleTone: () => void;
  onContactSales: () => void;
  /** `toolbar` = barra fija móvil; `desktop` = barra xl */
  variant: 'toolbar' | 'desktop';
};

const bubbleIcon =
  'cotiz-nav-bubble cotiz-nav-bubble--icon focus:outline-none focus:ring-2 focus:ring-offset-0';
const bubbleText =
  'cotiz-nav-bubble cotiz-nav-bubble--text focus:outline-none focus:ring-2 focus:ring-offset-0';
const bubbleCta =
  'cotiz-nav-bubble cotiz-nav-bubble--cta focus:outline-none focus:ring-2 focus:ring-offset-0';

export function LandingNavActions({ tone, onToggleTone, onContactSales, variant }: LandingNavActionsProps) {
  const isLight = tone === 'light';
  const isToolbar = variant === 'toolbar';

  if (isToolbar) {
    const themeBtn = isLight
      ? 'cotiz-mhdr-icon-btn text-slate-700 hover:text-slate-950 focus:ring-slate-400/35'
      : 'cotiz-mhdr-icon-btn text-white/75 hover:text-white focus:ring-white/25';
    const linkClass = isLight
      ? 'cotiz-mhdr-link cotiz-adpmh-text text-slate-900 hover:text-slate-950 focus:ring-slate-400/35'
      : 'cotiz-mhdr-link cotiz-adpmh-text text-white hover:text-white focus:ring-white/25';

    return (
      <div className="cotiz-mhdr-actions" role="group" aria-label="Acciones de cuenta">
        <button
          type="button"
          aria-label={isLight ? 'Activar tema oscuro' : 'Activar tema claro'}
          onClick={onToggleTone}
          className={`${themeBtn} focus:outline-none focus:ring-2 focus:ring-offset-0`}
        >
          {isLight ? <Moon className="h-3.5 w-3.5" aria-hidden /> : <Sun className="h-3.5 w-3.5" aria-hidden />}
        </button>
        <a
          href="/login"
          className={`${linkClass} focus:outline-none focus:ring-2 focus:ring-offset-0`}
        >
          <LogIn className="cotiz-mhdr-link__icon h-3 w-3" aria-hidden />
          <span className="cotiz-mhdr-link__label">Ingresar</span>
        </a>
        <button
          type="button"
          aria-label="Contactar ventas"
          onClick={onContactSales}
          className={`${linkClass} focus:outline-none focus:ring-2 focus:ring-offset-0`}
        >
          <span>Ventas</span>
          <ArrowRight className="cotiz-mhdr-link__icon h-3 w-3" aria-hidden />
        </button>
      </div>
    );
  }

  const toneBtnClass = isLight
    ? `${bubbleIcon} border-slate-200/90 bg-white/95 text-slate-900 shadow-md shadow-slate-900/8 hover:bg-white focus:ring-slate-400/35`
    : `${bubbleIcon} border-white/12 bg-white/[0.08] text-white shadow-lg shadow-black/30 hover:bg-white/[0.12] focus:ring-white/25`;

  const loginClass = isLight
    ? `${bubbleText} border-slate-200/90 bg-white/95 text-slate-800 shadow-md shadow-slate-900/8 hover:bg-white hover:text-slate-950 focus:ring-slate-400/35`
    : `${bubbleText} border-white/12 bg-white/[0.08] text-white/85 shadow-lg shadow-black/30 hover:bg-white/[0.12] hover:text-white focus:ring-white/25`;

  const contactClass = isLight
    ? `${bubbleCta} bg-[#CC0000] text-white shadow-lg shadow-black/15 hover:bg-[#B30000] focus:ring-[#CC0000]/30`
    : `${bubbleCta} bg-[#CC0000] text-white shadow-lg shadow-black/30 hover:bg-[#B30000] focus:ring-white/35`;

  return (
    <div className="cotiz-nav-actions-group flex max-w-full shrink-0 items-center self-center">
      <button
        type="button"
        aria-label={isLight ? 'Activar tema oscuro' : 'Activar tema claro'}
        onClick={onToggleTone}
        className={toneBtnClass}
      >
        {isLight ? <Moon className="h-3.5 w-3.5" aria-hidden /> : <Sun className="h-3.5 w-3.5" aria-hidden />}
      </button>
      <a href="/login" className={loginClass}>
        <LogIn className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="cotiz-nav-label">Ingresar</span>
      </a>
      <button type="button" aria-label="Contactar ventas" title="Contactar ventas" onClick={onContactSales} className={contactClass}>
        <span className="cotiz-nav-label">Contactar ventas</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </button>
    </div>
  );
}
