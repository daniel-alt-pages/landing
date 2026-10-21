'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  enterPresentationFocus,
  exitPresentationFocus,
  isPresentationFocusActive,
  shouldBootstrapPresentationFocus,
} from '@/lib/presentationFocusMode';

/**
 * Pantalla completa (F11) en hosting staging/prod (no en `next dev` local).
 * Paneles post-login (`/estudiante`, `/coordinador`) y rutas demo/landing.
 * Excluye `/login`, `/acceso`, `/estudiante/selector` (sin auto ni primer clic).
 * Entrada solo con gesto explícito en panel o tecla F11.
 */
export default function PresentationFocusBootstrap() {
  const pathname = usePathname();
  const enteredRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    if (!shouldBootstrapPresentationFocus(pathname)) {
      enteredRef.current = false;
      if (isPresentationFocusActive()) {
        void exitPresentationFocus();
      }
      return;
    }

    enteredRef.current = isPresentationFocusActive();

    const tryEnter = async () => {
      if (enteredRef.current || isPresentationFocusActive()) {
        enteredRef.current = true;
        return;
      }
      const ok = await enterPresentationFocus();
      if (ok) enteredRef.current = true;
    };

    const onFirstGesture = () => {
      void tryEnter();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'F11') return;
      e.preventDefault();
      if (isPresentationFocusActive()) {
        enteredRef.current = false;
        void exitPresentationFocus();
      } else {
        void tryEnter();
      }
    };

    const gestureOpts: AddEventListenerOptions = { capture: true, passive: true, once: true };
    window.addEventListener('pointerdown', onFirstGesture, gestureOpts);
    window.addEventListener('keydown', onKeyDown, true);

    return () => {
      window.removeEventListener('pointerdown', onFirstGesture, gestureOpts);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [pathname]);

  return null;
}
