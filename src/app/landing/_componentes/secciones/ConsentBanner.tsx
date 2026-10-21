'use client';

import { useEffect, useState } from 'react';
import { CONTACTO } from '../../_contenido/contacto';
import { track } from '../../_lib/analytics';
import { mirrorCartCookie } from '../../_lib/carrito';
import {
  CONSENT_EVENT,
  OPEN_CONSENT_EVENT,
  applyConsent,
  browserCookieStore,
  captureCampaign,
  clearLegacyConsent,
  parseConsentValue,
  readConsentSnapshot,
  type ConsentChoice,
  type ConsentFlags,
} from '../../_lib/cookies';

const EMPTY: ConsentFlags = { analytics: false, personalization: false, advertising: false };

function safeMeasurement(id: string) {
  return /^[A-Za-z0-9_-]{4,40}$/.test(id) ? id : '';
}

function safePixel(id: string) {
  return /^\d{5,20}$/.test(id) ? id : '';
}

function unload(id: string, globalName: 'gtag' | 'fbq') {
  document.getElementById(id)?.remove();
  window[globalName] = undefined;
}

function loadGa(id: string, advertising: boolean) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  const ads = advertising ? 'granted' : 'denied';
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    functionality_storage: 'granted',
    security_storage: 'granted',
  });
  window.gtag('js', new Date());
  window.gtag('config', id);
  if (document.getElementById('ag-ga4')) return;
  const script = document.createElement('script');
  script.id = 'ag-ga4';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
}

function loadPixel(id: string) {
  if (document.getElementById('ag-pixel')) return;
  const script = document.createElement('script');
  script.id = 'ag-pixel';
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  script.onload = () => window.fbq?.('init', id);
  document.head.appendChild(script);
}

function syncVendors(choice: ConsentChoice) {
  const ga = safeMeasurement(CONTACTO.ga4Id);
  const pixel = safePixel(CONTACTO.metaPixelId);
  if (choice.analytics && ga) loadGa(ga, choice.advertising);
  else unload('ag-ga4', 'gtag');
  if (choice.advertising && pixel) loadPixel(pixel);
  else unload('ag-pixel', 'fbq');
}

function flagsOf(choice: ConsentChoice | null): ConsentFlags {
  if (!choice) return EMPTY;
  return {
    analytics: choice.analytics,
    personalization: choice.personalization,
    advertising: choice.advertising,
  };
}

export function ConsentBanner() {
  const [raw, setRaw] = useState('');
  const [ready, setReady] = useState(false);
  const [forced, setForced] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState<ConsentFlags>(EMPTY);
  const saved = parseConsentValue(raw);

  useEffect(() => {
    const pull = () => setRaw(readConsentSnapshot());
    pull();
    setReady(true);
    mirrorCartCookie();
    captureCampaign(window.location.search, document.referrer);
    window.addEventListener(CONSENT_EVENT, pull);
    window.addEventListener('storage', pull);
    return () => {
      window.removeEventListener(CONSENT_EVENT, pull);
      window.removeEventListener('storage', pull);
    };
  }, []);

  useEffect(() => {
    if (!ready || (raw !== 'yes' && raw !== 'no')) return;
    applyConsent(
      raw === 'yes'
        ? { analytics: true, personalization: true, advertising: true }
        : EMPTY,
      browserCookieStore(),
      sessionStorage,
    );
    clearLegacyConsent();
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }, [raw, ready]);

  useEffect(() => {
    if (!ready || raw === 'yes' || raw === 'no') return;
    const choice = parseConsentValue(raw);
    if (!choice) return;
    syncVendors(choice);
  }, [ready, raw]);

  useEffect(() => {
    let sent = false;
    const onScroll = () => {
      if (sent) return;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height <= 0 || window.scrollY / height < 0.75) return;
      sent = true;
      track('scroll_75');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const open = () => {
      setDraft(flagsOf(parseConsentValue(readConsentSnapshot())));
      setCustom(true);
      setForced(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  function commit(flags: ConsentFlags) {
    applyConsent(flags, browserCookieStore(), sessionStorage);
    clearLegacyConsent();
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setCustom(false);
    setForced(false);
  }

  if (!ready || (saved && !forced)) return null;

  return (
    <div className="ag-consent" role="region" aria-label="Cookies">
      {custom ? (
        <>
          <p>Elija cada finalidad. Las necesarias siguen activas.</p>
          <ul className="ag-consent-cats">
            <li className="ag-consent-cat">
              <strong>Funcionalidad y seguridad</strong>
              <span>Siempre</span>
              <p>Elección de cookies por 13 meses y carrito por 6 meses. La sesión de la plataforma dura 12 horas y solo aparece al entrar.</p>
            </li>
            <Category
              title="Analítica"
              checked={draft.analytics}
              onToggle={() => setDraft((current) => ({ ...current, analytics: !current.analytics }))}
              text="Identificador y conteo de esta página por 13 meses. Google Analytics, si está configurado, añade _ga por 2 años solo en este sitio."
            />
            <Category
              title="Personalización"
              checked={draft.personalization}
              onToggle={() => setDraft((current) => ({ ...current, personalization: !current.personalization }))}
              text="Recuerda los filtros y el último programa del catálogo durante 6 meses."
            />
            <Category
              title="Publicidad"
              checked={draft.advertising}
              onToggle={() => setDraft((current) => ({ ...current, advertising: !current.advertising }))}
              text="No hay red de anuncios propia. Meta Pixel solo se carga si está configurado y usted lo acepta."
            />
          </ul>
        </>
      ) : (
        <div className="ag-consent-copy">
          <p>
            Usamos cookies propias. Las necesarias quedan siempre: su elección (13 meses) y el carrito (6 meses). La sesión de la plataforma dura 12 horas y solo nace al iniciar sesión.
          </p>
          <p className="ag-consent-note">
            Analítica (13 meses, y _ga 2 años si hay Google Analytics), personalización del catálogo (6 meses) y publicidad quedan apagadas hasta que usted las acepte. No guardamos una cookie propia de anuncios.{' '}
            <a href="/legal/cookies">Política de cookies</a>
          </p>
        </div>
      )}
      <div className="ag-consent-actions">
        {custom ? (
          <button type="button" className="ag-btn" onClick={() => commit(draft)}>Guardar elección</button>
        ) : (
          <button
            type="button"
            className="ag-btn"
            onClick={() => commit({ analytics: true, personalization: true, advertising: true })}
          >
            Aceptar todo
          </button>
        )}
        {custom ? (
          <button type="button" className="ag-btn-ghost ag-on-dark" onClick={() => setCustom(false)}>Volver</button>
        ) : (
          <>
            <button type="button" className="ag-btn-ghost ag-on-dark" onClick={() => commit(EMPTY)}>
              Solo necesarias
            </button>
            <button
              type="button"
              className="ag-btn-ghost ag-on-dark"
              onClick={() => {
                setDraft(flagsOf(saved));
                setCustom(true);
              }}
            >
              Elegir
            </button>
          </>
        )}
        {saved ? (
          <button
            type="button"
            className="ag-btn-ghost ag-on-dark"
            onClick={() => {
              setForced(false);
              setCustom(false);
            }}
          >
            Cerrar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Category({
  title,
  text,
  checked,
  onToggle,
}: {
  title: string;
  text: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="ag-consent-cat">
      <strong>{title}</strong>
      <button
        type="button"
        className="ag-switch"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={onToggle}
      >
        <i aria-hidden="true" />
      </button>
      <p>{text}</p>
    </li>
  );
}
