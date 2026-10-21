'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';
import { shouldMaskDemoPii } from '@/app/demo/_shared/demoPrivacy';
import { useShowcaseEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/context/ShowcaseEmbedProvider';
import {
  maskDisplayPersonal,
  maskStudentListForShowcase,
  showcaseDocumentLabel,
  type ShowcasePersonalSlice,
} from './showcase-privacy';

export function useShowcasePrivacyActive(): boolean {
  const pathname = usePathname();
  const { active } = useShowcaseEmbed();
  return active || isDemoEstudianteRoute(pathname) || shouldMaskDemoPii();
}

export function useShowcasePrivacyStudent<T extends { informacion_personal: ShowcasePersonalSlice }>(
  estudiante: T | null | undefined,
): T | null | undefined {
  const masked = useShowcasePrivacyActive();
  return useMemo(() => {
    if (!estudiante || !masked) return estudiante ?? null;
    return {
      ...estudiante,
      informacion_personal: maskDisplayPersonal(estudiante.informacion_personal, {
        masked: true,
        isSelf: true,
      }),
    };
  }, [estudiante, masked]);
}

export function useShowcasePrivacyList<T extends { informacion_personal: ShowcasePersonalSlice }>(
  list: T[],
  myId: string,
): T[] {
  const masked = useShowcasePrivacyActive();
  return useMemo(
    () => maskStudentListForShowcase(list, myId, masked),
    [list, myId, masked],
  );
}

export function useShowcasePrivacyDocument(doc: string, isSelf = true): string {
  const masked = useShowcasePrivacyActive();
  return useMemo(
    () => showcaseDocumentLabel(doc, masked, isSelf),
    [doc, masked, isSelf],
  );
}
