'use client';

import {
  Gauge,
  ListChecks,
  Medal,
  PlayCircle,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { CourseEntitlementsResult } from '../types/courseTypes';
import {
  courseDashboardSectionDesc,
  courseDashboardSectionTitle,
  type CourseMetricClipTone,
} from '../lib/courseMetricClipUi';
import CourseDashboardClip from './CourseDashboardClip';
import { CoursePanelStagger, CoursePanelStaggerItem } from './CoursePanelStagger';

type SimulacroToolItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  tone: CourseMetricClipTone;
};

const SIMULACRO_TOOLS: SimulacroToolItem[] = [
  {
    id: 'dashboard',
    title: 'Panel de resultados',
    description: 'Puntaje global, áreas y simulacros que ya presentaste.',
    icon: Gauge,
    href: '/estudiante/dashboard',
    tone: 'accent',
  },
  {
    id: 'clases-sim',
    title: 'Clases del simulacro',
    description: 'Videos por área del Saber 11 para repasar antes del ICFES.',
    icon: PlayCircle,
    href: '/estudiante/clases',
    tone: 'violet',
  },
  {
    id: 'metricas',
    title: 'Métricas',
    description: 'Ve cómo ha evolucionado tu puntaje entre simulacros.',
    icon: TrendingUp,
    href: '/estudiante/estadisticas',
    tone: 'accent',
  },
  {
    id: 'analisis',
    title: 'Análisis por pregunta',
    description: 'Revisa respuestas correctas, errores y patrones por pregunta.',
    icon: ListChecks,
    href: '/estudiante/analisis',
    tone: 'violet',
  },
  {
    id: 'ranking',
    title: 'Ranking',
    description: 'Tu posición frente a otros estudiantes del simulacro.',
    icon: Medal,
    href: '/estudiante/ranking',
    tone: 'orange',
  },
  {
    id: 'perfil',
    title: 'Mi perfil',
    description: 'Correos de acceso, datos personales y configuración.',
    icon: UserRound,
    href: '/estudiante/perfil',
    tone: 'default',
  },
];

type CourseToolsHubProps = {
  entitlements: CourseEntitlementsResult | null;
};

/**
 * Accesos al panel del simulacro — solo si el estudiante ya presentó al menos uno.
 */
export default function CourseToolsHub({ entitlements }: CourseToolsHubProps) {
  const hasSimulacros = entitlements?.hasSimulacros ?? false;

  if (!hasSimulacros) return null;

  return (
    <section className="space-y-4" aria-labelledby="simulacro-tools-heading">
      <div>
        <h3 id="simulacro-tools-heading" className={courseDashboardSectionTitle}>
          Simulacro Saber 11
        </h3>
        <p className={courseDashboardSectionDesc}>
          Consulta tus resultados y mejora por área del macro
        </p>
      </div>
      <CoursePanelStagger className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-3">
        {SIMULACRO_TOOLS.map((item) => (
          <CoursePanelStaggerItem key={item.id}>
            <CourseDashboardClip
              title={item.title}
              description={item.description}
              icon={item.icon}
              tone={item.tone}
              href={item.href}
              footer="Abrir"
              footerKind="action"
            />
          </CoursePanelStaggerItem>
        ))}
      </CoursePanelStagger>
    </section>
  );
}
