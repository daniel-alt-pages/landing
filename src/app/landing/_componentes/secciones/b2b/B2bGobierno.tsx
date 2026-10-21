import { B2B_CALIDAD, B2B_ENTREGABLES } from '../../../_contenido/b2b/servicio';
import { Pestanas } from './base/Pestanas';
import { SeccionB2b } from './base/SeccionB2b';
import { TablaONivel } from './base/TablaONivel';
import { Responsables } from './Responsables';
import { Balanza } from './diagramas/Balanza';
import { Adicionales, Comunicaciones } from './diagramas/Portafolio';


export function B2bGobierno() {
  return (
    <SeccionB2b
      id="servicio"
      tone="white"
      numero="06"
      pregunta="¿Cómo responden?"
      titulo="Entregables, roles y seguimiento"
      acento="seguimiento"
      bajada="Lo que se entrega, quién responde y qué se mide."
    >
      <Pestanas
        label="Cómo trabajamos"
        tabs={[
          { id: 'entregables', label: 'Entregables' },
          { id: 'responsables', label: 'Responsables' },
          { id: 'pqrs', label: 'PQRS' },
          { id: 'indicadores', label: 'Indicadores' },
        ]}
      >
        <div>
          <TablaONivel caption="Entregables según el nivel" headers={B2B_ENTREGABLES.headers} rows={B2B_ENTREGABLES.rows} puntos />
          <Adicionales />
        </div>
        <div>
          <Responsables />
        </div>
        <div>
          <Comunicaciones />
        </div>
        <div>
          <ul className="ag-b2b-chips">
            {B2B_CALIDAD.tipos.map((tipo) => <li key={tipo.title}>{tipo.title}</li>)}
          </ul>
          <Balanza
            tituloIzquierda="Lo que garantizamos"
            tituloDerecha="Lo que observamos"
            izquierda={B2B_CALIDAD.sla}
            derecha={B2B_CALIDAD.observados}
          />
          <p className="ag-b2b-promesa">{B2B_CALIDAD.promesa}</p>
        </div>
      </Pestanas>
    </SeccionB2b>
  );
}
