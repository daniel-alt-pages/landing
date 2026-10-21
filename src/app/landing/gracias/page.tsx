import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GraciasView } from './GraciasView';

export const metadata: Metadata = {
  title: { absolute: 'Solicitud recibida | Alianza SEAMOSGENIOS' },
  robots: { index: false, follow: false },
};

export default function GraciasPage() {
  return (
    <Suspense fallback={<p className="ag-wrap">Cargando la confirmación.</p>}>
      <GraciasView />
    </Suspense>
  );
}
