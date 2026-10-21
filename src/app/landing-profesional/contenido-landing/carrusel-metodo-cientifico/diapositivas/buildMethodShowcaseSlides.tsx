'use client';

import {
  GraduationCap,
  LayoutDashboard,
  PlayCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { MethodShowcase3DSlide } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/carrusel-3d/MethodShowcase3DCarousel';
import { MethodShowcaseSlide } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/diapositivas/MethodShowcaseSlide';
import { SHOWCASE_PANEL_DEMO_MS } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/StudentPanelBrowseDemo';
import { methodShowcaseItems, type MethodShowcaseItem } from '@/app/landing-profesional/contenido-landing/content';

function showcaseSlideKey(item: MethodShowcaseItem, index: number) {
  if (item.type === 'drive-embed') return item.driveFileId;
  if (item.type === 'hosted-video') {
    return item.prismicVideoUrl ?? item.youtubeId ?? `${item.label}-${index}`;
  }
  return item.label;
}

const LABEL_ICONS: Record<string, LucideIcon> = {
  'PreICFES · Saber 11': GraduationCap,
  'Coordinación académica': Users,
  Grabaciones: PlayCircle,
  'Panel institucional': LayoutDashboard,
};

function labelDescription(item: Extract<MethodShowcaseItem, { type: 'label' }>) {
  if (item.hint) return item.hint;
  if (item.label === 'PreICFES · Saber 11') {
    return 'Simulacros y lectura de resultados alineados al examen de Estado.';
  }
  if (item.label === 'Coordinación académica') {
    return 'Vista por curso, estudiante y ciclo para decisiones pedagógicas.';
  }
  if (item.label === 'Panel institucional') {
    return 'Indicadores agregados para rectoría y equipos directivos.';
  }
  return undefined;
}

/** Convierte ítems de `content.tsx` en diapositivas del carrusel 3D. */
export function buildMethodShowcaseSlides(
  items: MethodShowcaseItem[] = methodShowcaseItems,
  isLightLanding: boolean,
): MethodShowcase3DSlide[] {
  return items.map((item, index) => {
    const id = showcaseSlideKey(item, index);

    if (item.type === 'drive-embed') {
      return {
        id,
        title: item.label,
        description:
          item.showcaseDescription ??
          (item.browseDemo
            ? 'Recorrido por carpetas de Drive hasta la grabación de la sesión.'
            : 'Vista previa en la página · sin abrir Drive en otra pestaña.'),
        content: <MethodShowcaseSlide item={item} isLightLanding={isLightLanding} layout="card" />,
        autoplayHoldMs: item.browseDemo ? 38_000 : undefined,
      };
    }

    if (item.type === 'hosted-video') {
      return {
        id,
        title: item.label,
        description: 'Demo en video',
        content: <MethodShowcaseSlide item={item} isLightLanding={isLightLanding} layout="card" />,
      };
    }

    if (item.panelDemo) {
      return {
        id,
        title: item.label,
        description: labelDescription(item),
        content: <MethodShowcaseSlide item={item} isLightLanding={isLightLanding} layout="card" />,
        autoplayHoldMs: SHOWCASE_PANEL_DEMO_MS + 3_000,
      };
    }

    const Icon = LABEL_ICONS[item.label] ?? GraduationCap;
    return {
      id,
      title: item.label,
      description: labelDescription(item),
      icon: <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />,
    };
  });
}
