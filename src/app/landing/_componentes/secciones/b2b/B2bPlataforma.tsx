import { B2B_PLATAFORMA, B2B_SIMULACROS } from '../../../_contenido/b2b/servicio';
import { MatrizPlataforma, SimulacrosAnalitica } from './diagramas/Laminas';
import { SeccionB2b } from './base/SeccionB2b';
import { RutaSvg } from './diagramas/RutaSvg';
import { Cohorte } from './diagramas/Portafolio';
import { CuatroRoles } from './diagramas/CuatroRoles';

export function B2bPlataforma() {
  return (
    <SeccionB2b
      id="plataforma"
      tone="white"
      numero="05"
      pregunta="¿Qué ve mi comunidad?"
      titulo="Plataforma y reportes para directivos, docentes, estudiantes y familias"
      acento="un ecosistema"
      bajada={B2B_PLATAFORMA.lead}
    >
      <CuatroRoles />
      <RutaSvg etiqueta="De la prueba al resultado" pasos={B2B_SIMULACROS.rows.map((fila) => ({ title: fila[0] }))} />
      <ul className="ag-b2b-chips">
        {['Global y por área', 'Percentiles', 'Preguntas críticas', 'Por cohorte', 'Histórico', 'Alertas N3', 'Benchmark'].map((item) => <li key={item}>{item}</li>)}
      </ul>
      <Cohorte />
      <MatrizPlataforma />
      <SimulacrosAnalitica />
    </SeccionB2b>
  );
}
