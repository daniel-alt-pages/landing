import type { Metadata } from 'next';
import CoordinadorClientShell from './CoordinadorClientShell';

export const metadata: Metadata = {
    title: 'Panel Coordinador',
    description: 'Dashboard institucional con métricas, ranking, análisis de preguntas y alertas para coordinadores.',
    robots: { index: false, follow: false },
};

export default function CoordinadorLayout({ children }: { children: React.ReactNode }) {
    return <CoordinadorClientShell>{children}</CoordinadorClientShell>;
}
