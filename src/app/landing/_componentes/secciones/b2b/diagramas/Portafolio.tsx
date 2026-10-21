import { B2B_N1, B2B_N2, B2B_N3 } from '../../../../_contenido/b2b/programa';
import { B2B_VALOR } from '../../../../_contenido/b2b/modelo';
import { B2B_CANALES, B2B_ENTREGABLES } from '../../../../_contenido/b2b/servicio';
import {
  B2B_ACTA_FECHAS,
  B2B_ALERTAS_CADENA,
  B2B_COHORTE,
  B2B_COMUNICACION,
  B2B_ECOSISTEMA,
} from '../../../../_contenido/b2b/portafolio';
import { AlEntrar } from '../base/AlEntrar';

/** p.3: cinco capacidades y cinco diferenciadores. */
export function Capacidades() {
  return (
    <AlEntrar className="ag-pf ag-pf-capas-wrap">
      <h3 className="ag-pf-h">Capacidad y aplicación</h3>
      <ol className="ag-pf-capacidades">
        {B2B_VALOR.capacidades.map((item, index) => (
          <li key={item.title} style={{ ['--i' as string]: index }}>
            <span className="ag-pf-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
          </li>
        ))}
      </ol>
      <h3 className="ag-pf-h">Qué diferencia la propuesta institucional</h3>
      <ul className="ag-pf-checks">
        {B2B_VALOR.checks.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </AlEntrar>
  );
}

/** p.8: arquitectura de datos de doble impacto. */
export function DobleImpacto() {
  const d = B2B_N1.doble;
  return (
    <AlEntrar className="ag-pf ag-pf-doble">
      <h4 className="ag-pf-h">{d.title}</h4>
      <p className="ag-pf-lead">{d.lead}</p>
      <div className="ag-pf-fuente"><strong>Simulacro institucional tipo Saber 11</strong><span>Instrumento unificado con baremos estandarizados</span></div>
      <div className="ag-pf-ramas" aria-hidden="true"><span>Reporte del estudiante</span><span>Informe directivo</span></div>
      <div className="ag-pf-salidas">
        <article><h5>Salida A · Reporte individual del estudiante</h5><ul>{d.alumno.map((x) => <li key={x}>{x}</li>)}</ul></article>
        <article><h5>Salida B · Tablero e informe institucional</h5><ul>{d.directivo.map((x) => <li key={x}>{x}</li>)}</ul></article>
      </div>
      <div className="ag-pf-barra"><strong>Cierre formal del Nivel 1: socialización institucional de resultados</strong><span>{d.cierre}</span></div>
    </AlEntrar>
  );
}

/** p.10: entregables completos y ciclo de corrección del Nivel 2. */
export function EntregablesN2() {
  return (
    <AlEntrar className="ag-pf">
      <div className="ag-pf-dos">
        {[['Estudiante', B2B_N2.estudiante], ['Institución', B2B_N2.institucion]].map(([titulo, items]) => (
          <article key={titulo as string} className="ag-pf-tarjeta">
            <h4>{titulo as string}</h4>
            <ul className="ag-pf-defs">
              {(items as typeof B2B_N2.estudiante).map((item) => <li key={item.title}><strong>{item.title}</strong><span>{item.text}</span></li>)}
            </ul>
          </article>
        ))}
      </div>
      <h4 className="ag-pf-h">Metodología: el ciclo de corrección</h4>
      <ol className="ag-pf-cadena">{B2B_N2.ciclo.map((x) => <li key={x}>{x}</li>)}</ol>
      <ul className="ag-pf-checks">{B2B_N2.metodo.map((x) => <li key={x}>{x}</li>)}</ul>
      <p className="ag-pf-nota"><strong>Complemento.</strong> {B2B_N2.addon}</p>
    </AlEntrar>
  );
}

function Nodo({ n, clase }: { n: { title: string; sub: string; text: string }; clase: string }) {
  return (
    <div className={`ag-pf-actor ${clase}`}>
      <strong>{n.title}</strong>
      <em>{n.sub}</em>
      <span>{n.text}</span>
    </div>
  );
}

/** p.12: ecosistema articulado de los 4 actores. */
export function Ecosistema() {
  const e = B2B_ECOSISTEMA;
  return (
    <AlEntrar className="ag-pf ag-pf-eco-wrap">
      <h4 className="ag-pf-h">{e.titulo}</h4>
      <p className="ag-pf-lead">{B2B_N3.ecoLead}</p>
      <figure className="ag-pf-eco" aria-labelledby="pf-eco-cap">
        <svg className="ag-pf-eco-lineas" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true">
          <path d="M150 60 V240 M50 150 H250" />
          <path className="is-arco" d="M60 120 Q60 50 120 45 M240 120 Q240 50 180 45 M60 180 Q60 250 120 255 M240 180 Q240 250 180 255" />
        </svg>
        <Nodo n={e.estudiante} clase="is-est" />
        <Nodo n={e.docentes} clase="is-doc" />
        <Nodo n={e.centro} clase="is-sg" />
        <Nodo n={e.familias} clase="is-fam" />
        <Nodo n={e.directivos} clase="is-dir" />
        <figcaption id="pf-eco-cap" className="ag-b2b-sr">El estudiante en el centro; SEAMOSGENIOS conecta a docentes, familias y directivos.</figcaption>
      </figure>
      <ul className="ag-pf-flujos">{e.flujos.map((x) => <li key={x}>{x}</li>)}</ul>
    </AlEntrar>
  );
}

/** p.13: cinco capas y tres pilares. */
export function CapasPilares() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Ecosistema de la comunidad educativa</h4>
      <p className="ag-pf-lead">{B2B_N3.experiencia}</p>
      <ol className="ag-pf-pila">
        {[...B2B_N3.capas].reverse().map((c) => (
          <li key={c.n}><span>Capa {c.n}</span><strong>{c.title}</strong><p>{c.text}</p></li>
        ))}
      </ol>
      <div className="ag-pf-tres">
        {B2B_N3.pilares.map((p) => (
          <article key={p.title} className="ag-pf-tarjeta"><h5>{p.title}</h5><ul>{p.points.map((x) => <li key={x}>{x}</li>)}</ul></article>
        ))}
      </div>
    </AlEntrar>
  );
}

/** p.14: seis reuniones y acta de ejemplo. */
export function Reuniones() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Acompañamiento institucional: 6 encuentros por calendario</h4>
      <p className="ag-pf-lead">{B2B_N3.reunionesLead} Hasta 15 h por calendario.</p>
      <ol className="ag-pf-timeline">
        {B2B_N3.reuniones.map((r, index) => (
          <li key={r.n} style={{ ['--i' as string]: index }}>
            <span className="ag-pf-hito" aria-hidden="true">{r.n}</span>
            <div>
              <p className="ag-pf-reu">Reunión {r.n} · <b>{r.horas}</b></p>
              <strong>{r.cuando}</strong>
              <ul>{r.points.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </li>
        ))}
      </ol>
      <div className="ag-pf-dos">
        <article className="ag-pf-tarjeta">
          <h5>Cada reunión produce un plan de acción</h5>
          <ol className="ag-pf-numerada">{B2B_N3.acta.map((x) => <li key={x}>{x}</li>)}</ol>
          <p className="ag-pf-nota"><strong>Principio.</strong> {B2B_N3.principio}</p>
        </article>
        <div className="ag-pf-tabla-wrap" tabIndex={0} role="region" aria-label="Ejemplo de acta de compromiso">
          <table className="ag-pf-tabla">
            <caption>Modelo de acta de compromiso (ejemplo)</caption>
            <thead><tr><th scope="col">Hallazgo</th><th scope="col">Acción acordada</th><th scope="col">Resp.</th><th scope="col">Fecha</th><th scope="col">Estado</th></tr></thead>
            <tbody>
              {B2B_N3.actaEjemplo.map((f, i) => (
                <tr key={f[0]}><td>{f[0]}</td><td>{f[1]}</td><td>{f[2]}</td><td>{B2B_ACTA_FECHAS[i]}</td><td><span className={`ag-pf-estado is-${f[3].toLowerCase().replace(/\s/g, '')}`}>{f[3]}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AlEntrar>
  );
}

/** p.15: sistema de alertas tempranas. */
export function Alertas() {
  const [normal, ...tipos] = B2B_N3.alertas;
  return (
    <AlEntrar className="ag-pf ag-pf-alertas">
      <h4 className="ag-pf-h">Sistema de alertas tempranas</h4>
      <p className="ag-pf-lead">Detección proactiva antes de que el estudiante abandone o baje su desempeño.</p>
      <div className="ag-pf-alert-grid">
        <div className="ag-pf-normal"><strong>{normal.title}</strong><span>{normal.text}</span></div>
        <ul className="ag-pf-tipos">{tipos.map((t) => <li key={t.title}><strong>{t.title}</strong><span>{t.text}</span></li>)}</ul>
        <div className="ag-pf-protocolo">
          <strong>Protocolo de intervención</strong>
          <ol>{B2B_N3.protocolo.map((x) => <li key={x}>{x}</li>)}</ol>
          <div className="ag-pf-salida">
            {B2B_N3.cierreAlerta.map((c, i) => <p key={c.title} className={i === 0 ? 'is-ok' : 'is-up'}><strong>{c.title}</strong>{c.text}</p>)}
          </div>
        </div>
      </div>
      <h5 className="ag-pf-h5">Jerarquía de escalamiento</h5>
      <ol className="ag-pf-cadena">{B2B_ALERTAS_CADENA.map((x) => <li key={x}>{x}</li>)}</ol>
      <p className="ag-pf-lead">No todas las alertas ameritan llegar a las directivas. La severidad determina quién recibe la notificación:</p>
      <ol className="ag-pf-sev">{B2B_N3.severidad.map((x, i) => <li key={x} className={`is-${i + 1}`}>{x}</li>)}</ol>
    </AlEntrar>
  );
}

/** p.16: semestral vs anual. */
export function SemestralAnual() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Modalidad semestral y anual</h4>
      <p className="ag-pf-lead">{B2B_N3.modalidadLead}</p>
      <div className="ag-pf-tabla-wrap" tabIndex={0} role="region" aria-label="Modalidad semestral y anual">
        <table className="ag-pf-tabla is-comparar">
          <caption className="ag-b2b-sr">Modalidad semestral y anual</caption>
          <thead><tr>{B2B_N3.modalidadHeaders.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{B2B_N3.modalidad.map((f) => <tr key={f[0]}><th scope="row">{f[0]}</th><td>{f[1]}</td><td>{f[2]}</td></tr>)}</tbody>
        </table>
      </div>
    </AlEntrar>
  );
}

/** p.17: ciclo anual, plan interciclo y T0→T1→T2. */
export function CicloAnual() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Ciclo de mejora continua anual</h4>
      <p className="ag-pf-lead">No es repetir el curso: es una espiral ascendente de diagnóstico, refuerzo e impacto acumulado.</p>
      <div className="ag-pf-anual">
        <ol className="ag-pf-rueda" aria-label="Ciclo anual en 6 pasos">
          {B2B_N3.ciclo.map((c, i) => (
            <li key={c.n} style={{ ['--i' as string]: i }}><span>{c.n}</span><strong>{c.title}</strong><em>{c.text}</em></li>
          ))}
          <li className="ag-pf-rueda-centro" aria-hidden="true"><strong>Mejora continua</strong><em>Calendario 1 → Calendario 2</em></li>
        </ol>
        <div className="ag-pf-plan">
          <p className="ag-pf-plan-t">Plan de mejora institucional interciclo</p>
          <article><h5>Componente A · Refuerzo académico estudiantil</h5><ul>{B2B_N3.refuerzo.map((x) => <li key={x}>{x}</li>)}</ul></article>
          <article><h5>Componente B · Acompañamiento institucional</h5><ul>{B2B_N3.gobernanza.map((x) => <li key={x}>{x}</li>)}</ul></article>
        </div>
      </div>
      <ol className="ag-pf-t" aria-label="Medición de impacto">
        <li><b>T0</b><span>Línea base después del Calendario 1</span></li>
        <li><b>T1</b><span>Medición a los 1–2 meses</span></li>
        <li><b>T2</b><span>Cierre final</span></li>
      </ol>
      <p className="ag-pf-nota">Objetivo: comprobar con datos si las brechas detectadas se cerraron.</p>
    </AlEntrar>
  );
}

/** p.19: cohorte compartida y dedicada. */
export function Cohorte() {
  return (
    <AlEntrar className="ag-pf ag-pf-dos ag-pf-cohorte">
      {[B2B_COHORTE.compartida, B2B_COHORTE.dedicada].map((c, i) => (
        <article key={c.title} className={`ag-pf-tarjeta${i === 1 ? ' is-cotiza' : ''}`}>
          <h4>{c.title}</h4>
          <ul>{c.points.map((x) => <li key={x}>{x}</li>)}</ul>
        </article>
      ))}
    </AlEntrar>
  );
}

/** p.20: entregables adicionales cotizables. */
export function Adicionales() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Entregables adicionales cotizables</h4>
      <p className="ag-pf-lead">Fuera de la configuración estándar. Cada uno se cotiza aparte.</p>
      <ul className="ag-pf-extras">
        {B2B_ENTREGABLES.extra.map((x) => <li key={x}><span className="ag-pf-badge">Se cotiza aparte</span>{x}</li>)}
      </ul>
    </AlEntrar>
  );
}

const PQRS = [['Radicar', 'Número de caso'], ['Clasificar', 'Tipo y prioridad'], ['Asignar', 'Responsable'], ['Gestionar', 'Evidencia'], ['Responder y cerrar', 'Respuesta, tiempo y resultado']] as const;

/** pp.21–22: tipos de comunicación y flujo PQRS. */
export function Comunicaciones() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Tipos y canales de comunicación</h4>
      <p className="ag-pf-lead">{B2B_CANALES.lead}</p>
      <div className="ag-pf-com">
        {B2B_COMUNICACION.map((g) => (
          <article key={g.tipo}>
            <h5>Comunicación {g.tipo.toLowerCase()}</h5>
            <ul>{g.canales.map((c) => <li key={c.title}><strong>{c.title}</strong><span>{c.text}</span></li>)}</ul>
          </article>
        ))}
      </div>
      <h4 className="ag-pf-h">Flujo PQRS</h4>
      <ol className="ag-pf-pqrs">
        {PQRS.map(([t, d], i) => (
          <li key={t} style={{ ['--i' as string]: i }}><span>{String(i + 1).padStart(2, '0')}</span><strong>{t}</strong><em>{d}</em></li>
        ))}
      </ol>
    </AlEntrar>
  );
}
