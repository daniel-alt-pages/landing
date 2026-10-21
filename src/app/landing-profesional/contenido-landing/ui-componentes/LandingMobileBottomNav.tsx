'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { COTIZ_LANDING_NAV_LINKS } from '../content';
import type { LandingTone } from '../tipos';

const SHORT_LABELS: Record<string, string> = {
  inicio: 'Inicio',
  'metodo-pdf': 'Método',
  'impacto-acumulado': 'Cobertura',
  producto: 'Plataf.',
  cotizacion: 'Cotizar',
  recursos: 'Recursos',
  faq: 'FAQ',
};

/** Estilos críticos inline: WebViews que ignoran hojas externas */
const LNB_TABLE_STYLE = {
  display: 'table',
  tableLayout: 'fixed',
  width: '100%',
  height: 58,
  borderCollapse: 'separate',
  borderSpacing: 0,
} as const;

const LNB_BTN_STYLE = {
  display: 'block',
  width: '100%',
  height: 58,
  margin: 0,
  padding: '6px 2px 4px',
  border: 'none',
  background: 'transparent',
  boxSizing: 'border-box',
  cursor: 'pointer',
  WebkitAppearance: 'none',
  appearance: 'none',
} as const;

const LNB_LABEL_STYLE = {
  display: 'block',
  width: '100%',
  margin: 0,
  padding: '0 1px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.04em',
  lineHeight: 1.15,
  textAlign: 'center',
} as const;

type LandingMobileBottomNavProps = {
  activeChapter: string;
  tone: LandingTone;
  onNavigate: (href: string) => void;
};

export function LandingMobileBottomNav({ activeChapter, tone, onNavigate }: LandingMobileBottomNavProps) {
  const options = useMemo(
    () =>
      COTIZ_LANDING_NAV_LINKS.map((item) => ({
        value: item.href.replace(/^#/, ''),
        href: item.href,
        label: SHORT_LABELS[item.href.replace(/^#/, '')] ?? item.label,
        icon: item.icon,
      })),
    [],
  );

  const cellPct = `${(100 / Math.max(options.length, 1)).toFixed(3)}%`;
  const cellStyle = useMemo(
    () =>
      ({
        width: cellPct,
        maxWidth: cellPct,
        padding: 0,
        margin: 0,
        verticalAlign: 'middle',
        textAlign: 'center',
      }) as const,
    [cellPct],
  );

  const innerRef = useRef<HTMLTableElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const syncPill = useCallback(() => {
    const inner = innerRef.current;
    const pillEl = pillRef.current;
    if (!inner || !pillEl) return;
    const idx = Math.max(0, options.findIndex((o) => o.value === activeChapter));
    const btn = btnRefs.current[idx];
    if (!btn) {
      pillEl.style.left = '0px';
      pillEl.style.width = '0px';
      return;
    }
    const ir = inner.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    pillEl.style.left = `${br.left - ir.left}px`;
    pillEl.style.width = `${br.width}px`;
  }, [activeChapter, options]);

  useLayoutEffect(() => {
    syncPill();
  }, [syncPill]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => syncPill());
    ro.observe(inner);
    window.addEventListener('resize', syncPill);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncPill);
    };
  }, [syncPill]);

  return (
    <nav
      className={`cotiz-lnb-bar xl:hidden ${tone === 'light' ? 'cotiz-lnb-bar--light' : 'cotiz-lnb-bar--dark'}`}
      role="navigation"
      aria-label="Navegación de secciones"
    >
      <div className="cotiz-lnb-shell">
        <div ref={pillRef} className="cotiz-lnb-pill" aria-hidden />
        <table className="cotiz-lnb-inner" ref={innerRef} style={LNB_TABLE_STYLE} role="presentation">
          <tbody>
            <tr>
              {options.map((option, index) => {
                const active = option.value === activeChapter;
                const Icon = option.icon;
                return (
                  <td key={option.value} className="cotiz-lnb-cell" style={cellStyle}>
                    <button
                      type="button"
                      ref={(el) => {
                        btnRefs.current[index] = el;
                      }}
                      className="cotiz-lnb-btn"
                      style={LNB_BTN_STYLE}
                      data-active={active ? 'true' : 'false'}
                      aria-label={COTIZ_LANDING_NAV_LINKS[index]?.label ?? option.label}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => onNavigate(option.href)}
                    >
                      <span className="cotiz-lnb-icon">
                        <Icon size={20} strokeWidth={active ? 2 : 1.5} aria-hidden />
                      </span>
                      <span className="cotiz-lnb-label" style={LNB_LABEL_STYLE}>
                        {option.label}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </nav>
  );
}
