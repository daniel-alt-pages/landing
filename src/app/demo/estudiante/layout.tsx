import type { ReactNode } from 'react';
import EstudianteClientShell from '@/app/estudiante/EstudianteClientShell';
import DemoStudentSessionInit from '@/app/demo/estudiante/DemoStudentSessionInit';

/** Mismo shell que `/estudiante/*`; auth demo en EstudianteClientShell. */
export default function DemoEstudianteLayout({ children }: { children: ReactNode }) {
  return (
    <EstudianteClientShell>
      <DemoStudentSessionInit />
      {children}
    </EstudianteClientShell>
  );
}
