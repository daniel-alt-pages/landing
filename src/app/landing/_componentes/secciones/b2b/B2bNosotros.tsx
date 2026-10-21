import { B2B_PORQUE, B2B_PROBLEMA } from '../../../_contenido/b2b/modelo';
import { SeccionB2b } from './base/SeccionB2b';
import { Capacidades } from './diagramas/Portafolio';
import { CicloProblema, Ficha, QuienesSomos } from './diagramas/Laminas';
import { BrechaSvg } from './diagramas/BrechaSvg';


export function B2bNosotros() {
  return (
    <SeccionB2b
      id="porque"
      tone="grey"
      numero="02"
      pregunta={B2B_PORQUE.pregunta}
      titulo={B2B_PORQUE.titulo}
      acento={B2B_PORQUE.acento}
      bajada={B2B_PORQUE.bajada}
    >
      <BrechaSvg />
      <p className="ag-b2b-cita">{B2B_PORQUE.cita}</p>
      <CicloProblema />
      <p className="ag-b2b-fuente">{B2B_PROBLEMA.fuente}</p>
      <Capacidades />
      <QuienesSomos />
      <Ficha />
    </SeccionB2b>
  );
}
