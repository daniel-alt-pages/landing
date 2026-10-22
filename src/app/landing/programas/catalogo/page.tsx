import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CatalogoClient } from './CatalogoClient';

export const metadata: Metadata = {
  title: { absolute: 'Elige tu programa | Alianza SEAMOSGENIOS' },
  description:
    'Programas preICFES y simulacros de SEAMOSGENIOS. Solicite su cotización y pague con Bold.',
};

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={(
        <section className="ag-section ag-store" aria-busy="true">
          <div className="ag-wrap">
            <div className="ag-store-shelf">
              <div className="ag-store-skeleton is-deal" />
              <div className="ag-store-skeleton is-rail" />
            </div>
          </div>
        </section>
      )}
    >
      <CatalogoClient />
    </Suspense>
  );
}
