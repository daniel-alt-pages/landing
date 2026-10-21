import { B2B_MODULOS_VISIBLES, B2B_PLATAFORMA, B2B_SIMULACROS } from '../../../_contenido/b2b/servicio';
import { Plegable } from './base/Plegable';
import { SeccionB2b } from './base/SeccionB2b';
import { RutaSvg } from './diagramas/RutaSvg';
import { B2bEscenario } from './B2bEscenario';

export function B2bPlataforma() {
  const resto = B2B_PLATAFORMA.rows.filter((fila) => !(B2B_MODULOS_VISIBLES as readonly string[]).includes(fila[0]));
  return (
    <SeccionB2b
      id="plataforma"
      tone="black"
      numero="05"
      pregunta="¿Qué ve mi comunidad?"
      titulo="Cuatro roles, un ecosistema"
      acento="un ecosistema"
      bajada={B2B_PLATAFORMA.lead}
      onDark
    >
      <B2bEscenario />
      <RutaSvg etiqueta="De la prueba al resultado" pasos={B2B_SIMULACROS.rows.map((fila) => ({ title: fila[0] }))} />
      <ul className="ag-b2b-chips">
        {['Global y por área', 'Percentiles', 'Preguntas críticas', 'Por cohorte', 'Histórico', 'Alertas N3', 'Benchmark'].map((item) => <li key={item}>{item}</li>)}
      </ul>
      <Plegable titulo="Ver los 8 módulos" cuenta={`${resto.length} más`}>
        <ul className="ag-b2b-lista">
          {B2B_PLATAFORMA.rows.map((fila) => (
            <li key={fila[0]}><strong>{fila[0]}.</strong> Estudiante: {fila[1]}. Familia: {fila[2]}. Docente o directivo: {fila[3]}.</li>
          ))}
        </ul>
      </Plegable>
      <Plegable titulo="Qué hace cada paso del simulacro" cuenta="7 pasos">
        <dl className="ag-b2b-ficha">
          {B2B_SIMULACROS.rows.map((fila) => (
            <div key={fila[0]}>
              <dt>{fila[0]}</dt>
              <dd>{fila[1]}</dd>
            </div>
          ))}
        </dl>
      </Plegable>
      <Plegable titulo="Analítica completa" cuenta="7 lecturas">
        <ul className="ag-b2b-lista">{B2B_SIMULACROS.analitica.map((item) => <li key={item}>{item}</li>)}</ul>
      </Plegable>
      <Plegable titulo="Reglas de operación" cuenta="Grabación y cohorte">
        <ul className="ag-b2b-lista">{B2B_PLATAFORMA.grabaciones.map((item) => <li key={item}>{item}</li>)}</ul>
        <p>{B2B_PLATAFORMA.asistencia}</p>
        <p>{B2B_SIMULACROS.rigor} {B2B_SIMULACROS.cohorte}</p>
      </Plegable>
    </SeccionB2b>
  );
}
