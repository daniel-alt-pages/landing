import { DobleImpacto } from './diagramas/Portafolio';
import { B2B_N1 } from '../../../_contenido/b2b/programa';
import { SeccionB2b } from './base/SeccionB2b';

/** Arquitectura de datos (lámina p. 8): un simulacro, dos salidas, socialización. Reutiliza DobleImpacto (HTML/SVG). */
export function B2bArquitectura() {
  return (
    <SeccionB2b
      id="datos"
      tone="white"
      numero="03"
      pregunta="¿Qué recibe su institución?"
      titulo={B2B_N1.doble.title}
      acento="doble impacto"
      bajada={B2B_N1.doble.lead}
    >
      <DobleImpacto />
    </SeccionB2b>
  );
}
