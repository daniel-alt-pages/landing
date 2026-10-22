import '@/app/globals.css';
import type { Metadata } from 'next';
import EstudianteClientShell from './EstudianteClientShell';

export const metadata: Metadata = {
    title: 'Panel del Estudiante',
    description: 'Consulta tu puntaje global, ranking, análisis por materia y evolución simulacro a simulacro.',
};

export default function EstudianteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <EstudianteClientShell>{children}</EstudianteClientShell>;
}
