import DemoCoordinadorPageClient from './DemoCoordinadorPageClient';

const COORD_DEMO_TABS = [
  'pensum',
  'desempeno',
  'estudiantes',
  'respuestas',
  'analisis',
  'comparativa',
  'historico',
] as const;

export function generateStaticParams() {
  return [{ tab: [] as string[] }, ...COORD_DEMO_TABS.map((tab) => ({ tab: [tab] }))];
}

export default function DemoCoordinadorPage() {
  return <DemoCoordinadorPageClient />;
}
