import { B2B_PROBLEMA, B2B_QUIENES, B2B_RESUMEN, B2B_PROPUESTA } from '../../../../_contenido/b2b/modelo';
import { B2B_CALIDAD, B2B_GOBIERNO, B2B_PLATAFORMA, B2B_SIMULACROS } from '../../../../_contenido/b2b/servicio';
import { AlEntrar } from '../base/AlEntrar';

/** Lám. 2 (p.1): idea central. */
export function IdeaCentral() {
  return (
    <AlEntrar className="ag-pf ag-pf-idea">
      <div className="ag-pf-tarjeta is-cotiza">
        <h4>Idea central</h4>
        <p>{B2B_RESUMEN.idea}</p>
        <p><strong>{B2B_RESUMEN.cierre}</strong></p>
      </div>
    </AlEntrar>
  );
}

/** Lám. 3 (p.2): el ciclo problema → consecuencia → oportunidad, y misión/visión. */
export function CicloProblema() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">{B2B_PROBLEMA.cicloTitulo}</h4>
      <ol className="ag-pf-tres-pasos">
        {B2B_PROBLEMA.ciclo.map((c) => <li key={c.title}><span>{c.title}</span><p>{c.text}</p></li>)}
      </ol>
    </AlEntrar>
  );
}

export function QuienesSomos() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">¿Quiénes somos?</h4>
      <p className="ag-pf-lead">{B2B_QUIENES.lead}</p>
      <ul className="ag-pf-rasgos">
        {B2B_QUIENES.rasgos.map((r) => <li key={r.title}><strong>{r.title}</strong><span>{r.text}</span></li>)}
      </ul>
      <div className="ag-pf-dos">
        <article className="ag-pf-mv"><h5>Misión</h5><p>{B2B_QUIENES.mision}</p></article>
        <article className="ag-pf-mv"><h5>Visión</h5><p>{B2B_QUIENES.vision}</p></article>
      </div>
    </AlEntrar>
  );
}

/** Lám. 4 (p.3): ficha de identificación como tabla. */
export function Ficha() {
  return (
    <AlEntrar className="ag-pf">
      <div className="ag-pf-tabla-wrap" tabIndex={0} role="region" aria-label="Identificación de la empresa">
        <table className="ag-pf-tabla">
          <caption>Identificación</caption>
          <thead><tr><th scope="col">Dato</th><th scope="col">Información</th></tr></thead>
          <tbody>{B2B_PROPUESTA.ficha.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody>
        </table>
      </div>
    </AlEntrar>
  );
}

/** Lám. 19 (p.18): matriz de módulos por rol, grabaciones y asistencia. */
export function MatrizPlataforma() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Plataforma de SEAMOSGENIOS</h4>
      <div className="ag-pf-tabla-wrap" tabIndex={0} role="region" aria-label="Módulos de la plataforma por rol">
        <table className="ag-pf-tabla is-matriz">
          <caption className="ag-b2b-sr">Módulos de la plataforma por rol</caption>
          <thead><tr>{B2B_PLATAFORMA.headers.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{B2B_PLATAFORMA.rows.map((f) => (
            <tr key={f[0]}><th scope="row">{f[0]}</th>{f.slice(1).map((c, i) => <td key={i} data-rol={B2B_PLATAFORMA.headers[i + 1]}>{c}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
      <div className="ag-pf-dos">
        <article className="ag-pf-tarjeta"><h5>Grabaciones y recursos</h5><ul>{B2B_PLATAFORMA.grabaciones.map((x) => <li key={x}>{x}</li>)}</ul></article>
        <article className="ag-pf-tarjeta"><h5>Asistencia</h5><ul><li>{B2B_PLATAFORMA.asistencia}</li></ul></article>
      </div>
    </AlEntrar>
  );
}

/** Lám. 20 (p.19): simulacros (7 aspectos), analítica y rigor. */
export function SimulacrosAnalitica() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Simulacros de SEAMOSGENIOS</h4>
      <div className="ag-pf-anual">
        <div className="ag-pf-tabla-wrap" tabIndex={0} role="region" aria-label="Simulacros: aspectos">
          <table className="ag-pf-tabla">
            <caption className="ag-b2b-sr">Simulacros: aspectos y definición</caption>
            <thead><tr>{B2B_SIMULACROS.headers.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{B2B_SIMULACROS.rows.map(([a, d]) => <tr key={a}><th scope="row">{a}</th><td>{d}</td></tr>)}</tbody>
          </table>
        </div>
        <article className="ag-pf-tarjeta"><h5>Analítica</h5><ul>{B2B_SIMULACROS.analitica.map((x) => <li key={x}>{x}</li>)}</ul></article>
      </div>
      <p className="ag-pf-nota"><strong>Rigor en la interpretación.</strong> {B2B_SIMULACROS.rigor}</p>
    </AlEntrar>
  );
}

/** Lám. 22 (p.21): acuerdo de corresponsabilidad y gobierno del proyecto. */
export function Corresponsabilidad() {
  return (
    <AlEntrar className="ag-pf">
      <h3 className="ag-pf-h">Gobierno del servicio y corresponsabilidad</h3>
      <p className="ag-pf-lead">{B2B_GOBIERNO.lead}</p>
      <div className="ag-pf-marco">
        <span className="ag-pf-marco-tab">Acuerdo de corresponsabilidad educativa</span>
        <ul className="ag-pf-partes">
          {B2B_GOBIERNO.partes.map((p, i) => <li key={p.title} className={i === 0 ? 'is-sg' : undefined}><strong>{p.title}</strong><span>{p.text}</span></li>)}
        </ul>
      </div>
      <div className="ag-pf-tabla-wrap" tabIndex={0} role="region" aria-label="Gobierno del proyecto">
        <table className="ag-pf-tabla">
          <caption>Gobierno del proyecto</caption>
          <thead><tr><th scope="col">Rol SEAMOSGENIOS</th><th scope="col">Función en B2B</th></tr></thead>
          <tbody>{B2B_GOBIERNO.roles.map(([r, f]) => <tr key={r}><th scope="row" className="is-rojo">{r}</th><td>{f}</td></tr>)}</tbody>
        </table>
      </div>
    </AlEntrar>
  );
}

/** Lám. 24 (p.23): ocho tipos de indicadores con su descripción. */
export function TiposIndicadores() {
  return (
    <AlEntrar className="ag-pf">
      <h3 className="ag-pf-h">Indicadores de seguimiento y calidad</h3>
      <p className="ag-pf-lead">{B2B_CALIDAD.lead}</p>
      <dl className="ag-pf-indicadores">
        {B2B_CALIDAD.tipos.map((t) => <div key={t.title}><dt>{t.title}</dt><dd>{t.text}</dd></div>)}
      </dl>
    </AlEntrar>
  );
}
