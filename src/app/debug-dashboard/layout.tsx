import '@/app/globals.css';
import type { ReactNode } from 'react';

/** Estilos globales de la app (antes en el layout raíz; la landing ya no los carga). */
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
