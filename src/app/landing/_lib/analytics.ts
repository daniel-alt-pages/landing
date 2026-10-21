import { browserCookieStore, bumpMeter, readConsent } from './cookies';

export type AlianzaEvent =
  | 'cta_click'
  | 'click_whatsapp'
  | 'submit_lead'
  | 'lead_error'
  | 'schedule_meeting'
  | 'view_panel_tab'
  | 'faq_open'
  | 'role_select'
  | 'open_result'
  | 'scroll_75';

type EventParams = Record<string, string | number>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(name: AlianzaEvent, params: EventParams = {}) {
  if (typeof window === 'undefined') return;
  const store = browserCookieStore();
  const consent = readConsent(store);
  if (!consent) return;
  if (consent.analytics) {
    bumpMeter(store, name);
    window.gtag?.('event', name, params);
  }
  if (consent.advertising) window.fbq?.('trackCustom', name, params);
}
