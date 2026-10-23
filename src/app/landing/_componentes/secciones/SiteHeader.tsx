'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, LogIn, Menu, X } from 'lucide-react';
import { CONTACTO, platformAppUrl, platformLoginUrl, tiendaLandingUrl } from '../../_contenido/contacto';
import { MENU, RECURSOS, RECURSOS_LABEL } from '../../_contenido/menu';
import { track } from '../../_lib/analytics';
import { CART_OPEN_EVENT, readCart, subscribeCart, type CartItem } from '../../_lib/carrito';
import { pricesFromStore } from '../../_lib/tienda';
import { CartPanel } from './CartPanel';

/** Ícono del carrito: mismo trazo (2px, extremos redondos) que los íconos lucide del header. */
function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M2.5 3.5h2.2l2.4 11.1a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2l1.6-6.7H6" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </svg>
  );
}

function SheetSection({
  groupId,
  appHref,
  onBack,
  onNavigate,
}: {
  groupId: string;
  appHref: string;
  onBack: () => void;
  onNavigate: () => void;
}) {
  const group = MENU.find((item) => item.id === groupId);
  if (!group) return null;
  const toApp = group.id === 'plataforma';
  return (
    <>
      <button type="button" className="ag-sheet-row is-back" onClick={onBack}>
        <span className="ag-sheet-go" aria-hidden>
          <ChevronLeft size={18} strokeWidth={2} />
        </span>
        <span>Volver</span>
      </button>
      {toApp ? (
        <a className="ag-sheet-row" href={appHref} onClick={onNavigate}>
          <span>{group.label}</span>
          <span className="ag-sheet-go" aria-hidden>
            <ChevronRight size={18} strokeWidth={2} />
          </span>
        </a>
      ) : (
        <Link className="ag-sheet-row" href={group.href} onClick={onNavigate}>
          <span>{group.label}</span>
          <span className="ag-sheet-go" aria-hidden>
            <ChevronRight size={18} strokeWidth={2} />
          </span>
        </Link>
      )}
      {group.items.map((link) => (
        <Link key={link.href} className="ag-sheet-row" href={link.href} onClick={onNavigate}>
          <span>{link.label}</span>
          <span className="ag-sheet-go" aria-hidden>
            <ChevronRight size={18} strokeWidth={2} />
          </span>
        </Link>
      ))}
    </>
  );
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

function TikTokMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="currentColor" d="M14 4h2.1a5.2 5.2 0 0 0 3.4 3.2v2.2A7.3 7.3 0 0 1 16 8.2v6.3a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.3a3.2 3.2 0 1 0 2.2 3.1V4Z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="currentColor" d="M15.1 8.5h-2V7.1c0-.5.3-.6.6-.6h1.4V4.1l-1.9-.1c-2.1 0-2.6 1.6-2.6 2.6v1.9H8.4V11h2.2v9h2.5v-9h2l.3-2.5Z" />
    </svg>
  );
}

/** href inicial (SSR / sin JS): en Pages no existe /login; el efecto lo ajusta al host. */
const PUBLIC_LOGIN_FALLBACK = 'https://app.seamosgenios.org/login';

function contactBase(pathname: string | null) {
  if (!pathname) return '/landing';
  return pathname.includes('/gracias') || pathname.includes('/politica-de-datos') ? '/landing' : '';
}

export function SiteHeader() {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [catalogReady, setCatalogReady] = useState(false);
  const [bumpKey, setBumpKey] = useState(0);
  /** Total de unidades (suma de cantidades), no de programas distintos. */
  const cartUnits = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const [loginHref, setLoginHref] = useState(PUBLIC_LOGIN_FALLBACK);
  const [appHref, setAppHref] = useState(PUBLIC_LOGIN_FALLBACK);
  const headerRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef<number | null>(null);
  const base = contactBase(pathname);
  const group = MENU.find((item) => item.id === openId) ?? null;

  useEffect(() => {
    const host = window.location.hostname;
    setLoginHref(platformLoginUrl(host));
    setAppHref(platformAppUrl(host));
  }, []);

  useEffect(() => {
    const sync = () => setCart(readCart());
    sync();
    return subscribeCart(sync);
  }, []);

  useEffect(() => {
    if (prevCount.current != null && cartUnits !== prevCount.current) setBumpKey((value) => value + 1);
    prevCount.current = cartUnits;
  }, [cartUnits]);

  useEffect(() => {
    const shopUrl = tiendaLandingUrl();
    if (!shopUrl) return undefined;
    const controller = new AbortController();
    fetch(shopUrl, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((shop) => {
        if (!Array.isArray(shop?.products)) return;
        setPrices(pricesFromStore(shop.products));
        setCatalogReady(true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const open = () => {
      setOpenId(null);
      setMobile(false);
      setCartOpen(true);
    };
    window.addEventListener(CART_OPEN_EVENT, open);
    return () => window.removeEventListener(CART_OPEN_EVENT, open);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenId(null);
        setMobile(false);
        setCartOpen(false);
      }
    };
    const onClick = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenId(null);
        setCartOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => {
    if (!mobile) return;
    sheetRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobile]);

  function close() {
    setOpenId(null);
    setMobile(false);
    setCartOpen(false);
    setSheetId(null);
  }

  return (
    <header ref={headerRef} className={mobile ? 'ag-header is-menu' : 'ag-header'}>
      <a className="ag-skip" href="#contenido">
        Saltar al contenido
      </a>
      <div className="ag-wrap ag-header-inner">
        <Link href="/landing" aria-label="SEAMOSGENIOS, inicio de la alianza" onClick={close}>
          <Image className="ag-logo" src="/landing/brand/logo-banner-blanco.svg" alt="" width={360} height={45} priority />
        </Link>
        <nav className="ag-nav" aria-label="Principal">
          {MENU.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <button
                key={item.id}
                type="button"
                className="ag-nav-btn"
                data-active={active}
                aria-expanded={openId === item.id}
                aria-controls="ag-mega"
                onClick={() => setOpenId((value) => (value === item.id ? null : item.id))}
                onMouseEnter={() => setOpenId(item.id)}
              >
                {item.label}
                <ChevronDown size={14} aria-hidden />
              </button>
            );
          })}
        </nav>
        <div className="ag-header-cta">
          <button
            type="button"
            className="ag-icon-btn ag-cart-btn"
            aria-expanded={cartOpen}
            aria-controls="ag-cart"
            aria-label={`Carrito, ${cartUnits} ${cartUnits === 1 ? 'producto' : 'productos'}`}
            onClick={() => {
              setOpenId(null);
              setMobile(false);
              setCartOpen((value) => !value);
            }}
          >
            <CartIcon />
            <span className="ag-cart-label">Carrito</span>
            {cartUnits ? (
              <span key={bumpKey} className={bumpKey ? 'ag-cart-count is-bump' : 'ag-cart-count'} aria-hidden>{cartUnits}</span>
            ) : null}
          </button>
          <a
            className="ag-login"
            href={loginHref}
            aria-label="Ingresar a la plataforma"
            onClick={() => {
              track('cta_click', { cta_id: 'header_login' });
              close();
            }}
          >
            <LogIn size={16} strokeWidth={2} aria-hidden />
            <span>Ingresar</span>
          </a>
          <a
            className="ag-btn ag-header-meet"
            href={`${base}#solicitar-reunion`}
            onClick={() => {
              track('cta_click', { cta_id: 'header_reunion' });
              close();
            }}
          >
            <span className="ag-only-desktop">Agendar reunión de 30 min</span>
            <span className="ag-only-mobile">Agendar</span>
          </a>
          <button
            type="button"
            className="ag-icon-btn ag-menu-btn"
            aria-expanded={mobile}
            aria-controls="ag-sheet"
            aria-label={mobile ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => {
              setCartOpen(false);
              setOpenId(null);
              setSheetId(null);
              setMobile((value) => !value);
            }}
          >
            {mobile ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {cartOpen ? (
        <CartPanel
          items={cart}
          prices={prices}
          catalogReady={catalogReady}
          onClose={() => setCartOpen(false)}
        />
      ) : null}

      {group ? (
        <div className="ag-mega" id="ag-mega" onMouseLeave={() => setOpenId(null)}>
          <div className="ag-wrap ag-mega-grid">
            <div className="ag-mega-feature">
              <p className="ag-mega-label">{group.feature.eyebrow}</p>
              <p className="ag-mega-title">{group.feature.title}</p>
              <p>{group.feature.text}</p>
              {group.id === 'plataforma' ? (
                <a className="ag-text-link" href={appHref} onClick={close}>
                  Ir a {group.label} <ArrowRight size={16} aria-hidden />
                </a>
              ) : (
                <Link className="ag-text-link" href={group.href} onClick={close}>
                  Ir a {group.label} <ArrowRight size={16} aria-hidden />
                </Link>
              )}
            </div>
            <div className="ag-mega-links">
              <p className="ag-mega-label">{group.linksLabel}</p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={close}>
                      <strong>{item.label}</strong>
                      <span>{item.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <aside className="ag-mega-aside">
              <p className="ag-mega-label">{RECURSOS_LABEL}</p>
              <ul>
                {RECURSOS.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={close}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <a className="ag-btn ag-btn-block" href={`${base}#solicitar-simulacro`} onClick={close}>
                Solicite el simulacro gratis
              </a>
            </aside>
          </div>
        </div>
      ) : null}

      {mobile ? (
        <div
          className="ag-sheet"
          id="ag-sheet"
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          tabIndex={-1}
        >
          <div className="ag-sheet-top">
            <Link href="/landing" aria-label="SEAMOSGENIOS, inicio de la alianza" onClick={close}>
              <Image className="ag-logo" src="/landing/brand/logo-banner-blanco.svg" alt="" width={360} height={45} />
            </Link>
            <a
              className="ag-sheet-login"
              href={loginHref}
              aria-label="Ingresar a la plataforma"
              onClick={() => {
                track('cta_click', { cta_id: 'sheet_login' });
                close();
              }}
            >
              <LogIn size={18} strokeWidth={2} aria-hidden />
              <span>Ingresar</span>
            </a>
          </div>
          <nav className="ag-sheet-nav" aria-label="Secciones">
            {sheetId ? (
              <SheetSection groupId={sheetId} appHref={appHref} onBack={() => setSheetId(null)} onNavigate={close} />
            ) : (
              MENU.map((item) => (
                <button key={item.id} type="button" className="ag-sheet-row" onClick={() => setSheetId(item.id)}>
                  <span>{item.label}</span>
                  <span className="ag-sheet-go" aria-hidden>
                    <ChevronRight size={18} strokeWidth={2} />
                  </span>
                </button>
              ))
            )}
          </nav>
          <div className="ag-sheet-foot">
            <div className="ag-sheet-social">
              <a href={CONTACTO.redes.instagram} aria-label="Instagram" target="_blank" rel="noreferrer">
                <InstagramMark />
              </a>
              <a href={CONTACTO.redes.tiktok} aria-label="TikTok" target="_blank" rel="noreferrer">
                <TikTokMark />
              </a>
              <a href={CONTACTO.redes.facebook} aria-label="Facebook" target="_blank" rel="noreferrer">
                <FacebookMark />
              </a>
            </div>
            <button type="button" className="ag-sheet-close" aria-label="Cerrar menú" onClick={close}>
              <X size={22} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
