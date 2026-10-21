'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Home, type LucideIcon } from 'lucide-react';
import { areaAccent } from '@features/recordings/lib/recordingsTheme';
import { icfesAreaItemAccentVars } from '@features/coordinador/lib/icfesAreaColors';
import {
  clearRecordingsAreaNavLift,
  setRecordingsAreaNavLift,
} from '@features/recordings/lib/recordingsAreaNavLift';

export type SgAreaNavItem = {
  key: string;
  label?: string;
  icon?: LucideIcon;
};

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

const CSS = `
  .sg-aibn-bar {
    position: relative;
    z-index: 54;
    margin: 0;
    pointer-events: none;
    background: transparent;
  }
  .sg-aibn-bar--fixed::before,
  .sg-aibn-bar--embed::before {
    content: '';
    position: absolute;
    inset: auto 0 0;
    height: calc(100% + env(safe-area-inset-bottom, 0px));
    background: var(--sg-aibn-bar-bg, #fff);
    pointer-events: none;
  }
  .sg-aibn-bar--fixed {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0 clamp(0.75rem, 3vw, 1.25rem) calc(0.625rem + env(safe-area-inset-bottom, 0px));
  }
  .sg-aibn-bar--fixed-top {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    z-index: 55;
    padding: max(0.25rem, env(safe-area-inset-top, 0px)) clamp(0.75rem, 3vw, 1.25rem) 0.35rem;
  }
  .sg-aibn-bar--compact .sg-aibn-inner {
    height: 46px;
  }
  .sg-aibn-bar--compact .sg-aibn-btn {
    height: 46px;
    padding: 4px 2px 2px;
  }
  .sg-aibn-bar--compact .sg-aibn-pill {
    top: 4px;
    bottom: 4px;
  }
  .sg-aibn-bar--compact .sg-aibn-btn--home {
    height: 46px;
    min-height: 46px;
  }
  .sg-aibn-bar--embed {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0 0.75rem calc(0.5rem + env(safe-area-inset-bottom, 0px));
  }
  .sg-aibn-bar--inline {
    position: relative;
    pointer-events: auto;
    padding: 0;
  }
  .sg-aibn-shell {
    position: relative;
    width: 100%;
    max-width: none;
    margin: 0 auto;
    pointer-events: auto;
  }
  .sg-aibn-bar--dark .sg-aibn-inner {
    background: color-mix(in srgb, var(--coord-surface, #111827) 94%, transparent);
    border: 1px solid var(--coord-border, rgba(255, 255, 255, 0.1));
    box-shadow:
      0 10px 32px rgba(0, 0, 0, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .sg-aibn-bar--light .sg-aibn-inner {
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }
  .sg-aibn-inner {
    display: table;
    table-layout: fixed;
    width: 100%;
    height: 58px;
    margin: 0;
    padding: 0 4px;
    border-collapse: separate;
    border-spacing: 0;
    border-radius: 1.25rem;
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    transition: box-shadow 0.28s ease, border-color 0.28s ease;
  }
  .sg-aibn-cell {
    padding: 0;
    margin: 0;
    vertical-align: middle;
    text-align: center;
  }
  .sg-aibn-pill {
    position: absolute;
    top: 6px;
    bottom: 6px;
    left: 0;
    width: 0;
    border-radius: 14px;
    pointer-events: none;
    border: 1px solid transparent;
    transition:
      left 0.32s cubic-bezier(0.34, 1.4, 0.64, 1),
      width 0.32s cubic-bezier(0.34, 1.4, 0.64, 1),
      background 0.28s ease,
      border-color 0.28s ease,
      box-shadow 0.28s ease;
  }
  .sg-aibn-btn {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    height: 58px;
    margin: 0;
    padding: 6px 2px 4px;
    border: none;
    background: transparent;
    box-sizing: border-box;
    text-align: center;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.22s ease, transform 0.12s ease;
  }
  .sg-aibn-btn:active {
    transform: scale(0.96);
  }
  .sg-aibn-bar--dark .sg-aibn-btn {
    color: var(--coord-text-faint, rgba(255, 255, 255, 0.42));
  }
  .sg-aibn-bar--light .sg-aibn-btn {
    color: rgba(15, 23, 42, 0.45);
  }
  .sg-aibn-icon {
    display: block;
    width: 22px;
    height: 22px;
    margin: 0 auto 2px;
    line-height: 0;
    transition: filter 0.22s ease, color 0.22s ease;
  }
  .sg-aibn-icon svg {
    display: block;
    margin: 0 auto;
  }
  .sg-aibn-bar--dark .sg-aibn-btn:not([data-active='true']):hover,
  .sg-aibn-bar--dark .sg-aibn-btn:not([data-active='true']):focus-visible {
    color: var(--coord-text-tertiary, rgba(255, 255, 255, 0.65));
  }
  .sg-aibn-bar--dark .sg-aibn-btn[data-active='true'] .sg-aibn-icon {
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--sg-aibn-accent, #6366f1) 50%, transparent));
  }
  .sg-aibn-label {
    display: block;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1.15;
    text-align: center;
    color: inherit;
    transition: color 0.22s ease, font-weight 0.22s ease;
  }
  .sg-aibn-btn[data-active='true'] .sg-aibn-label {
    font-weight: 700;
  }
  .sg-aibn-cell--home {
    width: 3.5rem;
    min-width: 3.5rem;
    max-width: 3.5rem;
  }
  .sg-aibn-col-home {
    width: 3.5rem;
  }
  .sg-aibn-col-area {
    width: auto;
  }
  .sg-aibn-btn--home {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 100%;
    height: 58px;
    min-height: 58px;
    box-sizing: border-box;
    color: inherit;
    text-decoration: none;
    padding: 6px 0 4px;
  }
  .sg-aibn-bar--dark .sg-aibn-btn--home {
    color: rgba(255, 255, 255, 0.62);
  }
  .sg-aibn-bar--light .sg-aibn-btn--home {
    color: rgba(15, 23, 42, 0.58);
  }
  .sg-aibn-btn--home .sg-aibn-icon {
    width: 20px;
    height: 20px;
    margin: 0;
  }
  .sg-aibn-btn--home .sg-aibn-label {
    font-size: 8px;
    letter-spacing: 0.02em;
    padding: 0;
  }
  @media (min-width: 380px) {
    .sg-aibn-btn--home .sg-aibn-label {
      font-size: 9px;
    }
  }
  .sg-aibn-btn--home:hover,
  .sg-aibn-btn--home:focus-visible {
    color: var(--sg-aibn-accent, #6366f1);
  }
  .sg-aibn-btn--home:active {
    transform: scale(0.96);
  }
  .sg-aibn-home-divider {
    position: absolute;
    top: 12px;
    bottom: 12px;
    left: 3.5rem;
    width: 1px;
    background: rgba(148, 163, 184, 0.22);
    pointer-events: none;
  }
  .sg-aibn-bar--light .sg-aibn-home-divider {
    background: rgba(15, 23, 42, 0.08);
  }
  @media (min-width: 380px) {
    .sg-aibn-label {
      font-size: 10px;
    }
  }
`;

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}${a}`;
  }
  return `#${h.slice(0, 6)}${a}`;
}

export const SG_AREA_ICON_BOTTOM_NAV_HEIGHT = 58;

export type SgAreaNavLeadingAction = {
  href: string;
  onNavigate?: () => void;
  label?: string;
  ariaLabel?: string;
};

type SgAreaIconBottomNavProps = {
  items: SgAreaNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  variant?: 'light' | 'dark';
  /** fixed = viewport bottom; fixed-top = viewport top; embed = absolute en contenedor; inline = flujo normal */
  position?: 'fixed' | 'fixed-top' | 'embed' | 'inline';
  density?: 'default' | 'compact';
  className?: string;
  /** Publica altura en --recordings-area-nav-lift (solo fixed) */
  publishLift?: boolean;
  /** Acento único cuando las claves no son áreas ICFES. */
  themeAccentHex?: string;
  /** Estilo tipo coord-select (filtros); acento en shell vía --coord-area-accent-* */
  filterStyle?: boolean;
  ariaLabel?: string;
  /** Botón inicial (p. ej. volver al inicio del panel). */
  leadingAction?: SgAreaNavLeadingAction;
};

export default function SgAreaIconBottomNav({
  items,
  activeKey,
  onSelect,
  variant = 'dark',
  position = 'fixed',
  density = 'default',
  className = '',
  publishLift = false,
  themeAccentHex,
  filterStyle = false,
  ariaLabel = 'Asignaturas',
  leadingAction,
}: SgAreaIconBottomNavProps) {
  const isDark = variant === 'dark';
  const barHeight = density === 'compact' ? 46 : 58;
  const tableStyle = useMemo(
    () => ({ ...LNB_TABLE_STYLE, height: barHeight }),
    [barHeight],
  );
  const btnStyle = useMemo(
    () => ({ ...LNB_BTN_STYLE, height: barHeight }),
    [barHeight],
  );
  const barRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLTableElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeAccent = themeAccentHex
    ? { hex: themeAccentHex, icon: Home, short: '' }
    : areaAccent(activeKey);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey),
  );

  const totalCells = items.length + (leadingAction ? 1 : 0);

  const equalCellPct = useMemo(
    () => `${100 / Math.max(totalCells, 1)}%`,
    [totalCells],
  );

  const cellStyle = useMemo(
    () =>
      ({
        width: equalCellPct,
        maxWidth: equalCellPct,
        padding: 0,
        margin: 0,
        verticalAlign: 'middle',
        textAlign: 'center',
      }) as const,
    [equalCellPct],
  );

  const areaCellStyle = useMemo(
    () =>
      ({
        padding: 0,
        margin: 0,
        verticalAlign: 'middle',
        textAlign: 'center',
      }) as const,
    [],
  );

  const syncLift = useCallback(() => {
    if (!publishLift || (position !== 'fixed' && position !== 'fixed-top')) return;
    const bar = barRef.current;
    if (!bar) return;
    setRecordingsAreaNavLift(bar.getBoundingClientRect().height);
  }, [position, publishLift]);

  const syncPill = useCallback(() => {
    const inner = innerRef.current;
    const pillEl = pillRef.current;
    if (!inner || !pillEl) return;
    if (filterStyle) {
      pillEl.style.width = '0px';
      return;
    }
    const btn = btnRefs.current[activeIndex + (leadingAction ? 1 : 0)];
    if (!btn) {
      pillEl.style.width = '0px';
      return;
    }
    const ir = inner.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    pillEl.style.left = `${br.left - ir.left}px`;
    pillEl.style.width = `${br.width}px`;

    const hex = activeAccent.hex;
    pillEl.style.background = isDark ? hexAlpha(hex, 0.18) : hexAlpha(hex, 0.12);
    pillEl.style.borderColor = isDark ? hexAlpha(hex, 0.42) : hexAlpha(hex, 0.28);
    pillEl.style.boxShadow = `0 0 16px ${hexAlpha(hex, isDark ? 0.2 : 0.14)}`;

    inner.style.borderColor = isDark ? hexAlpha(hex, 0.22) : hexAlpha(hex, 0.16);
    inner.style.boxShadow = isDark
      ? `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px ${hexAlpha(hex, 0.1)}`
      : `0 10px 28px rgba(15,23,42,0.08), 0 0 20px ${hexAlpha(hex, 0.1)}`;
  }, [activeIndex, activeAccent.hex, filterStyle, isDark, leadingAction]);

  useLayoutEffect(() => {
    syncPill();
  }, [syncPill]);

  useLayoutEffect(() => {
    syncLift();
  }, [syncLift]);

  useEffect(() => {
    if (!publishLift || (position !== 'fixed' && position !== 'fixed-top')) {
      if (publishLift) clearRecordingsAreaNavLift();
      return;
    }
    if (items.length <= 1 && !leadingAction) {
      clearRecordingsAreaNavLift();
      return;
    }
    const bar = barRef.current;
    if (!bar || typeof ResizeObserver === 'undefined') return;
    syncLift();
    const ro = new ResizeObserver(() => syncLift());
    ro.observe(bar);
    window.addEventListener('resize', syncLift);
    window.visualViewport?.addEventListener('resize', syncLift);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncLift);
      window.visualViewport?.removeEventListener('resize', syncLift);
      clearRecordingsAreaNavLift();
    };
  }, [items.length, leadingAction, position, publishLift, syncLift]);

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

  if (items.length <= 1 && !leadingAction) return null;

  return (
    <>
      <style>{CSS}</style>
      <nav
        ref={barRef}
        className={`sg-aibn-bar sg-aibn-bar--${position} ${density === 'compact' ? 'sg-aibn-bar--compact' : ''} ${isDark ? 'sg-aibn-bar--dark' : 'sg-aibn-bar--light'} ${className}`}
        role="navigation"
        aria-label={ariaLabel}
        style={{
          ['--sg-aibn-accent' as string]: activeAccent.hex,
          ['--sg-aibn-bar-bg' as string]: isDark
            ? 'var(--coord-page, #07080d)'
            : '#ffffff',
        }}
      >
        <div className="sg-aibn-shell">
          <div ref={pillRef} className="sg-aibn-pill" aria-hidden />
          {leadingAction ? <div className="sg-aibn-home-divider" aria-hidden /> : null}
          <table
            className="sg-aibn-inner"
            ref={innerRef}
            style={tableStyle}
            role="presentation"
          >
            {leadingAction ? (
              <colgroup>
                <col className="sg-aibn-col-home" />
                {items.map((item) => (
                  <col key={item.key} className="sg-aibn-col-area" />
                ))}
              </colgroup>
            ) : null}
            <tbody>
              <tr>
                {leadingAction ? (
                  <td className="sg-aibn-cell sg-aibn-cell--home">
                    {leadingAction.onNavigate ? (
                      <button
                        type="button"
                        onClick={() => leadingAction.onNavigate?.()}
                        className="sg-aibn-btn sg-aibn-btn--home"
                        aria-label={leadingAction.ariaLabel ?? leadingAction.label ?? 'Volver al inicio'}
                      >
                        <span className="sg-aibn-icon">
                          <Home size={20} strokeWidth={1.5} aria-hidden />
                        </span>
                        <span className="sg-aibn-label">
                          {leadingAction.label ?? 'Inicio'}
                        </span>
                      </button>
                    ) : (
                      <Link
                        href={leadingAction.href}
                        prefetch={false}
                        className="sg-aibn-btn sg-aibn-btn--home"
                        aria-label={leadingAction.ariaLabel ?? leadingAction.label ?? 'Volver al inicio'}
                      >
                        <span className="sg-aibn-icon">
                          <Home size={20} strokeWidth={1.5} aria-hidden />
                        </span>
                        <span className="sg-aibn-label">
                          {leadingAction.label ?? 'Inicio'}
                        </span>
                      </Link>
                    )}
                  </td>
                ) : null}
                {items.map((item, idx) => {
                  const accent = themeAccentHex
                    ? { hex: themeAccentHex, icon: item.icon ?? Home, short: item.label ?? '' }
                    : areaAccent(item.key);
                  const Icon = item.icon ?? accent.icon;
                  const isActive = item.key === activeKey;
                  const aria = item.label ?? accent.short;
                  const labelText = item.label ?? accent.short;
                  const refIndex = idx + (leadingAction ? 1 : 0);
                  return (
                    <td
                      key={item.key}
                      className={`sg-aibn-cell${leadingAction ? ' sg-aibn-cell--area' : ''}`}
                      style={leadingAction ? areaCellStyle : cellStyle}
                    >
                      <button
                        type="button"
                        ref={(el) => {
                          btnRefs.current[refIndex] = el;
                        }}
                        className="sg-aibn-btn"
                        style={{
                          ...btnStyle,
                          ...(filterStyle ? icfesAreaItemAccentVars(item.key) : {}),
                          ...(isActive && !filterStyle ? { color: accent.hex } : {}),
                        }}
                        data-active={isActive ? 'true' : 'false'}
                        onClick={() => onSelect(item.key)}
                        aria-label={aria}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <span
                          className="sg-aibn-icon"
                          style={isActive && !filterStyle ? { color: accent.hex } : undefined}
                        >
                          <Icon size={20} strokeWidth={isActive ? 2.25 : 1.5} aria-hidden />
                        </span>
                        <span className="sg-aibn-label" style={LNB_LABEL_STYLE}>
                          {labelText}
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
    </>
  );
}
