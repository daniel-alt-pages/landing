import type { Metadata } from 'next';
import { FichaPagina } from '../../catalogo/FichaPagina';

export const metadata: Metadata = {
  title: { absolute: 'Ficha del programa | Alianza SEAMOSGENIOS' },
  description: 'Ficha completa del programa: qué incluye, imágenes y cómo inscribirte.',
};

export default async function FichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FichaPagina id={decodeURIComponent(id)} />;
}
