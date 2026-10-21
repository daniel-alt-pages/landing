'use client';

import { useShowcaseEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/context/ShowcaseEmbedProvider';
import { showcaseDomIds } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/constants/dom-ids';

type Props = {
  router: { back: () => void };
  navigateTo: (path: string) => void;
  className?: string;
};

/** Volver: en embed usa `returnTo` + pila; fuera del embed, `router.back()` o dashboard. */
export function PreviewSmartBackButton({ router, navigateTo, className }: Props) {
  const embed = useShowcaseEmbed();

  const handleBack = () => {
    if (embed.active) {
      embed.goBack();
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    navigateTo('/estudiante/dashboard');
  };

  return (
    <button
      id={showcaseDomIds.navBack}
      type="button"
      onClick={handleBack}
      className={
        className ??
        'flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-all hover:border-violet-500/30 hover:bg-white/10'
      }
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Volver
    </button>
  );
}
