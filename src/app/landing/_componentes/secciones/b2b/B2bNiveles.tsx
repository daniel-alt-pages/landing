import { Check, ClipboardCheck, GraduationCap, Network } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { B2B_CADENA, B2B_COMPARATIVO, B2B_NIVELES } from '../../../_contenido/b2b/modelo';
import { ModalB2b } from './base/ModalB2b';
import { Plegable } from './base/Plegable';
import { SeccionB2b } from './base/SeccionB2b';
import { TablaONivel } from './base/TablaONivel';
import { CoberturaMatriz } from './diagramas/CoberturaMatriz';
import { EscaleraNiveles } from './diagramas/EscaleraNiveles';

const ICONO: Record<(typeof B2B_NIVELES)[number]['id'], LucideIcon> = {
  'nivel-1': ClipboardCheck,
  'nivel-2': GraduationCap,
  'nivel-3': Network,
};

export function B2bNiveles() {
  return (
    <SeccionB2b
      id="niveles"
      tone="white"
      numero="04"
      pregunta="¿Qué puedo contratar?"
      titulo="Tres niveles de servicio para su institución"
      acento="Tres niveles"
      bajada={B2B_CADENA.nota}
    >
      <EscaleraNiveles />
      <div className="ag-b2b-cartas">
        {B2B_NIVELES.map((nivel) => {
          const Icono = ICONO[nivel.id];
          return (
            <article key={nivel.id} className={nivel.id === 'nivel-3' ? 'is-foco' : undefined}>
              <Icono size={24} strokeWidth={1.75} aria-hidden="true" />
              <h3>{nivel.label}</h3>
              <p className="ag-b2b-oferta">{nivel.offer}</p>
              <p>{nivel.question}</p>
              <p className="ag-b2b-incluye">{nivel.includesLabel}</p>
              <ul>
                {nivel.includes.slice(0, 4).map((item) => (
                  <li key={item}>
                    <Check size={16} strokeWidth={2.25} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <ModalB2b boton={`Ver detalle del ${nivel.label}`} titulo={nivel.name} etiqueta={nivel.label}>
                <p>{nivel.cover}</p>
                <ul className="b2m-lista">{nivel.includes.map((x) => <li key={x}>{x}</li>)}</ul>
              </ModalB2b>
            </article>
          );
        })}
      </div>
      <CoberturaMatriz />
      <Plegable titulo="Comparar en detalle" cuenta="12 dimensiones">
        <TablaONivel caption="Comparativo de valor institucional" headers={B2B_COMPARATIVO.headers} rows={B2B_COMPARATIVO.rows} />
      </Plegable>
    </SeccionB2b>
  );
}
