import { B2B_CALIDAD, B2B_ENTREGABLES } from '../../../_contenido/b2b/servicio';
import { Corresponsabilidad, TiposIndicadores } from './diagramas/Laminas';
import { SeccionB2b } from './base/SeccionB2b';
import { TablaONivel } from './base/TablaONivel';
import { Balanza } from './diagramas/Balanza';
import { Adicionales, Comunicaciones } from './diagramas/Portafolio';


export function B2bGobierno() {
  return (
    <SeccionB2b
      id="servicio"
      tone="white"
      numero="07"
      pregunta="¿Cómo responden?"
      titulo="Entregables, responsables y seguimiento"
      acento="seguimiento"
      bajada="Lo que se entrega, quién responde y qué se mide."
    >
      <TablaONivel caption="Entregables según el nivel" headers={B2B_ENTREGABLES.headers} rows={B2B_ENTREGABLES.rows} puntos />
      <Adicionales />
      <Corresponsabilidad />
      <Comunicaciones />
      <TiposIndicadores />
      <Balanza
        tituloIzquierda="Lo que garantizamos"
        tituloDerecha="Lo que observamos"
        izquierda={B2B_CALIDAD.sla}
        derecha={B2B_CALIDAD.observados}
      />
      <p className="ag-b2b-promesa">{B2B_CALIDAD.promesa}</p>
    </SeccionB2b>
  );
}
