import { HISTORIAS } from '../../../_contenido/historias';
import { B2B_PORQUE, B2B_PROBLEMA, B2B_QUIENES, B2B_VALOR } from '../../../_contenido/b2b/modelo';
import { Plegable } from './base/Plegable';
import { SeccionB2b } from './base/SeccionB2b';
import { BrechaSvg } from './diagramas/BrechaSvg';

const CASOS = [
  { id: 'soacha', dato: '716', linea: 'estudiantes en 9 colegios' },
  { id: 'casanare', dato: '420', linea: 'estudiantes en 20 colegios' },
  { id: 'jovenes-bogota', dato: 'Bogotá', linea: 'PreICFES gratuito con la cohorte' },
] as const;

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
      <p className="ag-b2b-flecha">{B2B_PORQUE.cadena.join(' → ')}</p>
      <p className="ag-b2b-fuente">{B2B_PROBLEMA.fuente}</p>
      <div className="ag-b2b-casos">
        {CASOS.map((caso) => {
          const historia = HISTORIAS.find((item) => item.id === caso.id);
          if (!historia) return null;
          return (
            <figure key={caso.id}>
              <img src={historia.images[0].src} alt={historia.images[0].alt} />
              <figcaption>
                <strong>{caso.dato}</strong>
                <span>{caso.linea}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
      <Plegable titulo="Quiénes somos" cuenta="Misión y visión">
        <p>{B2B_QUIENES.lead}</p>
        <ul className="ag-b2b-lista">
          {B2B_QUIENES.rasgos.map((item) => (
            <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>
          ))}
        </ul>
        <p><strong>Misión.</strong> {B2B_QUIENES.mision}</p>
        <p><strong>Visión.</strong> {B2B_QUIENES.vision}</p>
      </Plegable>
      <Plegable titulo="Ficha de la empresa" cuenta="6 datos">
        <dl className="ag-b2b-ficha">
          {B2B_VALOR.ficha.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </Plegable>
    </SeccionB2b>
  );
}
