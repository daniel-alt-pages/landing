import { B2B_CICLO_CIERRE } from '../../../_contenido/b2b/modelo';
import { CicloInteractivo } from './CicloInteractivo';
import { SeccionB2b } from './base/SeccionB2b';
import { IdeaCentral } from './diagramas/Laminas';

export function B2bResumen() {
  return (
    <SeccionB2b
      id="ciclo"
      tone="white"
      numero="01"
      pregunta="¿Cómo funciona?"
      titulo="Cómo funcionan los simulacros Saber 11 para colegios"
      acento="simulacros Saber 11"
      bajada="Seis pasos que se repiten. El colegio elige hasta dónde llega."
    >
      <CicloInteractivo />
      <p className="ag-b2b-cierre-linea">{B2B_CICLO_CIERRE}</p>
      <IdeaCentral />
    </SeccionB2b>
  );
}
