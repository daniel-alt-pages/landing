import { redirect } from 'next/navigation';

/** Legado: resumen curricular vive en Desempeño; Pensum solo SG11-17 en su ruta. */
export default function ResumenPage() {
    redirect('/coordinador/desempeno');
}
