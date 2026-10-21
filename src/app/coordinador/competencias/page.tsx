import { redirect } from 'next/navigation';

/**
 * Ruta legado. El diagnóstico ICFES quedó unido a Desempeño.
 */
export default function CoordinadorCompetenciasPage() {
    redirect('/coordinador/desempeno');
}
