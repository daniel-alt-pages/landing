import type { Metadata } from 'next';
import { TiendaEjemplo } from './TiendaEjemplo';

export const metadata: Metadata = {
  title: { absolute: 'Tienda | Alianza SEAMOSGENIOS' },
  description: 'Vitrina de ejemplo de programas de preparación Saber 11.',
};

export default function TiendaPage() {
  return <TiendaEjemplo />;
}
