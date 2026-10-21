'use client';

import CourseToolsHub from '../../components/CourseToolsHub';
import type { CourseEntitlementsResult } from '../../types/courseTypes';

type HerramientasSectionProps = {
  entitlements: CourseEntitlementsResult | null;
};

/** Legacy route — contenido fusionado en Dashboard (`resumen`). */
export default function HerramientasSection({ entitlements }: HerramientasSectionProps) {
  return <CourseToolsHub entitlements={entitlements} />;
}
