'use client';

import { useEffect } from 'react';
import {
  exitPresentationFocus,
  isPresentationFocusActive,
} from '@/lib/presentationFocusMode';

/** Dev local: sale de fullscreen si quedó activo de pruebas anteriores. */
export default function PresentationFocusLocalReset() {
  useEffect(() => {
    if (isPresentationFocusActive()) {
      void exitPresentationFocus();
    }
  }, []);

  return null;
}
