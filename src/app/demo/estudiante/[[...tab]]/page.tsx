import DemoEstudiantePageClient from '@/app/demo/estudiante/DemoEstudiantePageClient';
import { DEMO_ESTUDIANTE_ALLOWED_TABS } from '@/app/demo/_shared/demoRoutePaths';

const STUDENT_DEMO_TABS = DEMO_ESTUDIANTE_ALLOWED_TABS;

export function generateStaticParams() {
  return [{ tab: [] as string[] }, ...STUDENT_DEMO_TABS.map((tab) => ({ tab: [tab] }))];
}

/** Demo estudiante local: sin login (piloto EduGenios). */
export default function DemoEstudiantePage() {
  return <DemoEstudiantePageClient />;
}
