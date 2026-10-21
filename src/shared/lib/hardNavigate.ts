import { isLocalDevHost } from './isLocalDev';

/** Full page navigation — required for static export on Firebase Hosting. */
export function hardNavigate(href: string): void {
  if (typeof window === 'undefined') return;
  window.location.assign(href);
}

/** Soft router nav on localhost; hard nav on deployed hosting. */
export function navigateClient(href: string, softNavigate?: (href: string) => void): void {
  if (typeof window === 'undefined') return;
  if (isLocalDevHost() && softNavigate) {
    softNavigate(href);
    return;
  }
  hardNavigate(href);
}

export function createClientNavigate(softNavigate: (href: string) => void): (href: string) => void {
  return (href: string) => navigateClient(href, softNavigate);
}
