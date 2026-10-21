'use client';

import Link from 'next/link';
import type { StaticImageData } from 'next/image';
import { type CSSProperties, type MouseEvent, type ReactNode, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { AdpmhWordmark } from '@/app/landing-profesional/contenido-landing/ui-componentes/AdpmhWordmark';
gsap.registerPlugin(useGSAP);

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>, item: PillNavItem) => void;
};

function normalizeGsapEase(value: string): string {
  const aliases: Record<string, string> = {
    'power2.easeOut': 'power2.out',
    'power2.easeIn': 'power2.in',
    'power2.easeInOut': 'power2.inOut',
    'power3.easeOut': 'power3.out',
    'power3.easeIn': 'power3.in',
    'power3.easeInOut': 'power3.inOut',
  };
  return aliases[value] ?? value;
}

function resolveLogoSrc(logo: string | StaticImageData): string {
  if (typeof logo === 'string') return logo;
  return logo.src;
}

function isNearWhiteBase(color: string): boolean {
  const c = color.trim().toLowerCase();
  return (
    c === '#fff' ||
    c === '#ffffff' ||
    c === 'white' ||
    c === 'rgb(255, 255, 255)' ||
    c === 'rgba(255, 255, 255, 1)' ||
    c === 'rgba(255,255,255,1)'
  );
}

export interface PillNavProps {
  logo: string | StaticImageData;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  pillSurface?: 'fill' | 'outline';
  onLogoClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  desktopActionSlot?: ReactNode;
  /** Burbujas visibles en móvil (&lt;xl). Capítulos van en barra inferior. */
  mobileToolbarSlot?: ReactNode;
  initialLoadAnimation?: boolean;
}

const isExternalLink = (href: string) =>
  href.startsWith('http://') ||
  href.startsWith('https://') ||
  href.startsWith('//') ||
  href.startsWith('mailto:') ||
  href.startsWith('tel:');

const isHashLink = (href: string) => href.startsWith('#');
const isNextLink = (href?: string) => Boolean(href && !isExternalLink(href) && !isHashLink(href));

export default function PillNav({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease: easeProp,
  baseColor: baseColorProp,
  pillColor: pillColorProp,
  hoveredPillTextColor: hoveredPillTextColorProp,
  pillTextColor: pillTextColorProp,
  pillSurface = 'outline',
  onLogoClick,
  desktopActionSlot,
  mobileToolbarSlot,
  initialLoadAnimation = true,
}: PillNavProps) {
  const baseColor = baseColorProp ?? '#fff';
  const pillColor = pillColorProp ?? '#120F17';
  const hoveredPillTextColor = hoveredPillTextColorProp ?? '#120F17';
  const pillTextColor = pillTextColorProp;
  const ease = normalizeGsapEase(easeProp ?? 'power3.out');
  const logoSrc = useMemo(() => resolveLogoSrc(logo), [logo]);
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  const isLightBase = isNearWhiteBase(baseColor);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const logoSpinRef = useRef<HTMLSpanElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | null>(null);

  const cssVars = useMemo(
    () =>
      ({
        ['--base']: baseColor,
        ['--pill-bg']: pillColor,
        ['--hover-text']: hoveredPillTextColor,
        ['--pill-text']: resolvedPillTextColor,
        ['--pill-outline-ink']: isLightBase ? pillColor : resolvedPillTextColor,
        ['--pill-outline-border']: isLightBase
          ? 'color-mix(in srgb, var(--pill-bg) 38%, transparent)'
          : 'rgba(255, 255, 255, 0.28)',
        ['--nav-h']: '44px',
        ['--pill-pad-x']: '18px',
        ['--pill-gap']: '4px',
      }) as CSSProperties,
    [baseColor, hoveredPillTextColor, isLightBase, pillColor, resolvedPillTextColor],
  );

  useGSAP(
    () => {
      if (initialLoadAnimation) {
        if (logoRef.current) {
          gsap.set(logoRef.current, { scale: 0 });
          gsap.to(logoRef.current, { scale: 1, duration: 0.6, ease });
        }

        if (navItemsRef.current) {
          gsap.set(navItemsRef.current, { width: 0, overflow: 'hidden' });
          gsap.to(navItemsRef.current, { width: 'auto', duration: 0.6, ease });
        }
      }

      return () => {
        logoTweenRef.current?.kill();
      };
    },
    { scope: rootRef, dependencies: [items.length, ease, initialLoadAnimation], revertOnUpdate: true },
  );

  const handleLogoEnter = () => {
    if (!logoSpinRef.current) return;
    logoTweenRef.current?.kill();
    gsap.set(logoSpinRef.current, { rotate: 0 });
    logoTweenRef.current = gsap.to(logoSpinRef.current, { rotate: 360, duration: 0.24, ease, overwrite: 'auto' });
  };

  const renderLogo = (floating = false) => {
    const logoClasses = floating
      ? 'cotiz-nav-logo-bubble cotiz-mhdr-logo aspect-square shrink-0 overflow-hidden rounded-full p-1'
      : 'aspect-square shrink-0 overflow-hidden rounded-full p-1 inline-flex items-center justify-center';
    const logoStyle = {
      width: 'var(--nav-h)',
      height: 'var(--nav-h)',
      background: 'var(--base, #000)',
    } as CSSProperties;

    return (
      <a
        href="#inicio"
        aria-label="Ir al inicio"
        onClick={onLogoClick}
        onMouseEnter={handleLogoEnter}
        ref={logoRef}
        className={logoClasses}
        style={logoStyle}
      >
        <span
          ref={logoSpinRef}
          className="relative isolate flex size-full items-center justify-center overflow-hidden rounded-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={logoAlt}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-[118%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover object-center select-none"
            draggable={false}
          />
        </span>
      </a>
    );
  };

  const renderPillLinks = () => (
    <ul role="menubar" className="m-0 flex h-full list-none items-stretch p-[3px]" style={{ gap: 'var(--pill-gap)' }}>
      {items.map((item) => {
        const isActive = activeHref === item.href;
        const pillStyle: CSSProperties =
          pillSurface === 'outline'
            ? {
                background: isActive
                  ? isLightBase
                    ? 'color-mix(in srgb, var(--pill-outline-ink) 12%, transparent)'
                    : 'rgba(103, 232, 249, 0.14)'
                  : 'transparent',
                color: 'var(--pill-outline-ink)',
                border: isActive
                  ? '1px solid color-mix(in srgb, var(--pill-outline-ink) 52%, transparent)'
                  : '1px solid var(--pill-outline-border)',
                paddingLeft: 'var(--pill-pad-x)',
                paddingRight: 'var(--pill-pad-x)',
              }
            : {
                background: 'var(--pill-bg, #fff)',
                color: 'var(--pill-text, var(--base, #000))',
                paddingLeft: 'var(--pill-pad-x)',
                paddingRight: 'var(--pill-pad-x)',
                boxShadow: isActive
                  ? 'inset 0 0 0 2px color-mix(in srgb, var(--pill-text) 35%, transparent)'
                  : undefined,
                filter: isActive ? 'brightness(1.12)' : undefined,
              };

        const pillHoverOverlay =
          pillSurface === 'outline'
            ? isLightBase
              ? 'bg-black/0 group-hover:bg-black/[0.07]'
              : 'bg-white/0 group-hover:bg-white/10'
            : 'bg-white/0 group-hover:bg-white/12';

        const pillFocusRing =
          pillSurface === 'outline'
            ? isLightBase
              ? 'focus-visible:ring-slate-400/45'
              : 'focus-visible:ring-white/35'
            : 'focus-visible:ring-white/35';

        const pillContent = (
          <>
            {!isActive ? (
              <span
                className={`pointer-events-none absolute inset-0 z-[1] rounded-full transition-colors duration-200 ease-out ${pillHoverOverlay}`}
                aria-hidden="true"
              />
            ) : null}
            <span className="cotiz-pill-nav__label relative z-[2] inline-block whitespace-nowrap leading-tight tracking-[0.12em]">
              {item.label}
            </span>
            {isActive ? (
              <span
                className="cotiz-pill-nav__dot absolute left-1/2 z-[4] -translate-x-1/2 rounded-full opacity-90"
                style={{
                  background: pillSurface === 'outline' ? 'var(--pill-outline-ink)' : 'var(--pill-bg)',
                }}
                aria-hidden="true"
              />
            ) : null}
          </>
        );

        const basePillClasses = `cotiz-pill-nav__item group relative isolate inline-flex h-full min-w-0 shrink cursor-pointer items-center justify-center overflow-hidden rounded-full px-0 font-bold uppercase no-underline outline-none transition-[color,background-color,border-color,filter] duration-200 focus-visible:ring-2 ${pillFocusRing}`;

        return (
          <li key={item.href} role="none" className="flex h-full min-w-0">
            {isNextLink(item.href) ? (
              <Link
                href={item.href}
                role="menuitem"
                className={basePillClasses}
                style={pillStyle}
                aria-label={item.ariaLabel || item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={(event) => {
                  item.onClick?.(event, item);
                }}
              >
                {pillContent}
              </Link>
            ) : (
              <a
                href={item.href}
                role="menuitem"
                className={basePillClasses}
                style={pillStyle}
                aria-label={item.ariaLabel || item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={(event) => {
                  item.onClick?.(event, item);
                }}
              >
                {pillContent}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-[min(80rem,100%)] overflow-visible" style={cssVars}>
      {/* Móvil: logo + burbujas flotantes (sin hamburguesa; secciones abajo) */}
      <header
        className="cotiz-mobile-fixed-header xl:hidden"
        aria-label="Acciones principales"
      >
        <div className="cotiz-mobile-fixed-header__bar">
          <div className="cotiz-mobile-fixed-header__logo">
            <div className="cotiz-mhdr-brand">
              {renderLogo(true)}
              <AdpmhWordmark className="cotiz-mhdr-brand__wordmark" />
            </div>
          </div>
          {mobileToolbarSlot ? (
            <div className="cotiz-mobile-fixed-header__actions">{mobileToolbarSlot}</div>
          ) : null}
        </div>
      </header>

      {/* Escritorio: barra pill completa */}
      <nav
        className={`cotiz-desktop-pill-nav hidden xl:flex relative z-[1] w-full min-h-0 items-center rounded-full border shadow-xl backdrop-blur-xl ${className}`}
        aria-label="Principal"
      >
        <div className="cotiz-desktop-pill-nav__start flex min-w-0 flex-1 items-center">
          {renderLogo()}

          <div
            ref={navItemsRef}
            className="relative flex min-w-0 items-center rounded-full"
            style={{
              height: 'var(--nav-h)',
              background: pillSurface === 'outline' ? 'transparent' : 'var(--base, #000)',
            }}
          >
            {renderPillLinks()}
          </div>
        </div>

        {desktopActionSlot ? (
          <div className="cotiz-desktop-pill-nav__end shrink-0">{desktopActionSlot}</div>
        ) : null}
      </nav>
    </div>
  );
}
