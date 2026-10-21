'use client';

import { useEffect, type RefObject } from 'react';

type UseRecordingCoverShieldOptions = {
  /** Reproducción activa (portada oculta). */
  enabled: boolean;
  onShield: () => void;
  stageRef: RefObject<HTMLElement | null>;
};

/**
 * Muestra la portada ante intentos de captura (mejor esfuerzo en web).
 * PrintScreen, atajos de captura, menú contextual, copiar.
 * No usa visibilitychange: ocultar pestaña no debe pausar ni reiniciar.
 */
export function useRecordingCoverShield({
  enabled,
  onShield,
  stageRef,
}: UseRecordingCoverShieldOptions) {
  useEffect(() => {
    if (!enabled) return;

    const shield = () => onShield();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        shield();
        return;
      }
      const captureCombo =
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === '3' || e.key === '4' || e.key === '5' || e.key === 's' || e.key === 'S');
      if (captureCombo) shield();
    };

    const onContextMenu = (e: Event) => {
      e.preventDefault();
      shield();
    };

    const onCopy = () => shield();

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('copy', onCopy);
    const stage = stageRef.current;
    stage?.addEventListener('contextmenu', onContextMenu);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('copy', onCopy);
      stage?.removeEventListener('contextmenu', onContextMenu);
    };
  }, [enabled, onShield, stageRef]);
}
