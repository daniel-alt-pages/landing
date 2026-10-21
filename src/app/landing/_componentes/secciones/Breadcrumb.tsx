'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  '/landing': 'Inicio',
  '/landing/plataforma': 'Plataforma',
  '/landing/instituciones': 'Portafolio B2B',
  '/landing/programas': 'Programas',
  '/landing/programas/catalogo': 'Elige tu programa',
  '/landing/programas/ficha': 'Ficha',
  '/landing/resultados': 'Resultados',
  '/landing/nosotros': 'Nosotros',
  '/landing/politica-de-datos': 'Política de datos',
  '/landing/gracias': 'Solicitud recibida',
};

function labelFor(href: string) {
  if (href.startsWith('/landing/programas/ficha/')) return 'Ficha';
  if (LABELS[href]) return LABELS[href];
  const last = href.split('/').filter(Boolean).pop() || 'Inicio';
  return last.replace(/-/g, ' ');
}

export function Breadcrumb() {
  const pathname = usePathname() || '/landing';
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/landing';
  const parts = path.split('/').filter(Boolean);
  const crumbs: { href: string; label: string }[] = [];
  let acc = '';
  for (const part of parts) {
    acc += `/${part}`;
    crumbs.push({ href: acc, label: labelFor(acc) });
  }
  // En la página de inicio no hay ruta que mostrar: la barra sobra.
  if (crumbs.length < 2) return null;

  return (
    <div className="ag-breadcrumb-bar">
      <div className="ag-wrap">
        <nav aria-label="Ruta de navegación" className="ag-breadcrumb">
          {crumbs.map((crumb, index) => {
            const current = index === crumbs.length - 1;
            return (
              <span key={crumb.href} className="ag-breadcrumb-step">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {current ? <span>{crumb.label}</span> : <Link href={crumb.href}>{crumb.label}</Link>}
              </span>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
