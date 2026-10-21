import { B2B_CICLO_CENTRO, B2B_CICLO_CIERRE, B2B_RESUMEN } from '../../../_contenido/b2b/modelo';
import { SeccionB2b } from './base/SeccionB2b';
import { CicloSvg } from './diagramas/CicloSvg';

export function B2bResumen() {
  return (
    <SeccionB2b
      id="ciclo"
      tone="white"
      numero="01"
      pregunta="¿Cómo funciona?"
      titulo="Medir, intervenir y volver a medir"
      acento="volver a medir"
      bajada="Seis pasos que se repiten. El colegio elige hasta dónde llega."
    >
      <CicloSvg pasos={B2B_RESUMEN.pasos} centro={B2B_CICLO_CENTRO} />
      <p className="ag-b2b-cierre-linea">{B2B_CICLO_CIERRE}</p>
    </SeccionB2b>
  );
}
