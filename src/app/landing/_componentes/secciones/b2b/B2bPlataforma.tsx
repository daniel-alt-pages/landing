import { B2B_PLATAFORMA } from '../../../_contenido/b2b/servicio';
import { MatrizPlataforma, SimulacrosAnalitica } from './diagramas/Laminas';
import { SeccionB2b } from './base/SeccionB2b';
import { Cohorte } from './diagramas/Portafolio';
import { CuatroRoles } from './diagramas/CuatroRoles';

export function B2bPlataforma() {
  return (
    <SeccionB2b
      id="plataforma"
      tone="white"
      numero="06"
      pregunta="¿Qué ve mi comunidad?"
      titulo="Plataforma y reportes para directivos, docentes, estudiantes y familias"
      acento="Plataforma y reportes"
      bajada={B2B_PLATAFORMA.lead}
    >
      <CuatroRoles />
      <Cohorte />
      <MatrizPlataforma />
      <SimulacrosAnalitica />
    </SeccionB2b>
  );
}
