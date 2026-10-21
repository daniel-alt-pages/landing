import { Bell, Mail, MessageCircle, MessagesSquare, Newspaper, Ticket, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { B2B_CALIDAD, B2B_CANALES, B2B_ENTREGABLES } from '../../../_contenido/b2b/servicio';
import { Pestanas } from './base/Pestanas';
import { SeccionB2b } from './base/SeccionB2b';
import { TablaONivel } from './base/TablaONivel';
import { Responsables } from './Responsables';
import { Balanza } from './diagramas/Balanza';
import { FlujoPqrs } from './diagramas/FlujoPqrs';

const ICONO: LucideIcon[] = [Newspaper, MessagesSquare, Ticket, Bell, Users, Mail, MessageCircle];

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
          <aside className="ag-b2b-extra">
            <h3>Alcance adicional</h3>
            <ul className="ag-b2b-lista">{B2B_ENTREGABLES.extra.map((item) => <li key={item}>{item}</li>)}</ul>
          </aside>
        </div>
        <div>
          <Responsables />
        </div>
        <div>
          <FlujoPqrs pasos={B2B_CANALES.flujo} />
          <ul className="ag-b2b-canales">
            {B2B_CANALES.canales.map((canal, index) => {
              const Icono = ICONO[index] ?? Bell;
              return (
                <li key={canal.title}>
                  <details>
                    <summary>
                      <Icono size={20} strokeWidth={1.75} aria-hidden="true" />
                      <strong>{canal.title}</strong>
                    </summary>
                    <p>{canal.text}</p>
                  </details>
                </li>
              );
            })}
          </ul>
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
