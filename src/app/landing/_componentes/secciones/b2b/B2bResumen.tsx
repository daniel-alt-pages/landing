import { B2B_CADENA, B2B_CICLO_CENTRO, B2B_CICLO_CIERRE, B2B_RESUMEN } from '../../../_contenido/b2b/modelo';
import { SeccionB2b } from './base/SeccionB2b';
import { IdeaCentral } from './diagramas/Laminas';
import { CicloSvg } from './diagramas/CicloSvg';

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
      <CicloSvg pasos={B2B_RESUMEN.pasos} centro={B2B_CICLO_CENTRO} />
      <ol className="ag-b2b-cadena7" aria-label="Cadena de valor institucional (p. 4 del portafolio)">
        {B2B_CADENA.eslabones.map((e) => (
          <li key={e.n}><span>{e.n}. {e.title}</span><p>{e.text}</p></li>
        ))}
      </ol>
      <p className="ag-b2b-cierre-linea">{B2B_CICLO_CIERRE}</p>
      <IdeaCentral />
    </SeccionB2b>
  );
}
