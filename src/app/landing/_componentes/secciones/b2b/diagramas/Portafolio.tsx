import { B2B_N1, B2B_N2, B2B_N3 } from '../../../../_contenido/b2b/programa';
import { B2B_PROPUESTA } from '../../../../_contenido/b2b/modelo';
import { B2B_CANALES, B2B_ENTREGABLES } from '../../../../_contenido/b2b/servicio';
import {
  B2B_ACTA_FECHAS,
  B2B_ALERTAS_CADENA,
  B2B_COHORTE,
  B2B_COMUNICACION,
} from '../../../../_contenido/b2b/portafolio';
import { AlEntrar } from '../base/AlEntrar';
import { CicloSvg } from './CicloSvg';
import { FlujoPqrs } from './FlujoPqrs';

function Cta({ href, label, nota }: { href: string; label: string; nota?: string }) {
  return (
    <div className="ag-pf-cta">
      <a className="ag-b2b-btn" href={href}>{label}</a>
      {nota ? <p>{nota}</p> : null}
    </div>
  );
}

const DIFERENCIAS = [
  'La evaluación no termina en un puntaje: explica qué está pasando y dónde intervenir.',
  'Usted ve la asistencia, la participación y el desempeño mientras el proceso avanza.',
  'Sus estudiantes tienen una experiencia digital continua, no solo encuentros sueltos.',
  'En el Nivel 3, familias, docentes y directivos reciben herramientas propias de acompañamiento.',
  'El programa anual conecta dos calendarios con diagnóstico, refuerzo y verificación, para que ningún ciclo empiece de cero.',
];

/** p.3: cinco capacidades y cinco diferenciadores. */
export function Capacidades() {
  return (
    <AlEntrar className="ag-pf ag-pf-capas-wrap">
      <h3 className="ag-pf-h">Lo que hacemos por su colegio</h3>
      <p className="ag-pf-lead">Formación, evaluación, tecnología, analítica y acompañamiento para preparar el Saber 11. Trabajamos de forma virtual con su institución: las clases y los encuentros se hacen por Google Meet y los gestiona nuestro equipo.</p>
      <ol className="ag-pf-capacidades">
        {B2B_PROPUESTA.capacidades.map((item, index) => (
          <li key={item.title} style={{ ['--i' as string]: index }}>
            <span className="ag-pf-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
          </li>
        ))}
      </ol>
      <h3 className="ag-pf-h">Qué nos diferencia</h3>
      <ul className="ag-pf-checks">
        {DIFERENCIAS.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <Cta href="#solicitar-reunion" label="Agendar reunión de 30 min" nota="Contacto: seamosgenios@adpmh.com · SEAMOSGENIOS S.A.S." />
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
      <div className="ag-pf-ramas" aria-hidden="true">
        <svg viewBox="0 0 600 48" preserveAspectRatio="xMidYMid meet">
          <path className="ag-pf-trazo" d="M300 0 V20 H150 V44 M300 20 H450 V44" />
          <polygon points="150,48 145,40 155,40" /><polygon points="450,48 445,40 455,40" />
        </svg>
        <span className="ag-pf-flecha">↓</span>
      </div>
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
      <h4 className="ag-pf-h">Seis reuniones, un plan</h4>
      <p className="ag-pf-lead">En el Nivel 3, cada encuentro con rectoría termina en compromisos con responsable y fecha. Estas reuniones van aparte de las horas de clase de sus estudiantes y siguen nuestro Modelo Basado en Evidencias (MBE). Total: hasta 15 h por calendario.</p>
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
      <Cta href="#n3" label="Ver el Nivel 3" nota="Ejemplo ilustrativo: las cifras y fechas de su acta saldrán de sus propios datos." />
    </AlEntrar>
  );
}

/** p.15: sistema de alertas tempranas. */
/** Subtítulos cortos (Caveat) de cada alerta, descriptivos del texto existente; sin datos nuevos. */
const ALERTA_SUB = ['Faltas y pruebas pendientes', 'Bajo desempeño', 'Inactividad en la plataforma', 'Cuenta y registros'];
/** Escalera de intervención: textos del protocolo y de cierre de alerta (sin la mención a WhatsApp, excluida del B2B). */
const ESCALERA = [
  'Notificación automática en la plataforma.',
  'Contacto directo por tutor.',
  'Notificación a la familia y a la coordinación.',
  'Si escala, reunión de coordinación; si se cierra, el estudiante se reactivó.',
];

export function Alertas() {
  const [normal, ...tipos] = B2B_N3.alertas;
  return (
    <AlEntrar className="ag-pf ag-pf-alertas">
      <h4 className="ag-pf-h">Alertas antes del problema</h4>
      <p className="ag-pf-lead">Detectamos a tiempo al estudiante que se está quedando atrás o a punto de abandonar. La plataforma vigila asistencia, actividad y desempeño; la gravedad de cada alerta define quién se entera.</p>
      <div className="al7">
        <section className="al7-col al7-col-1" aria-labelledby="al7-h1">
          <h5 id="al7-h1" className="al7-h">Punto de partida</h5>
          <div className="al7-card al7-normal"><strong>{normal.title}</strong><span>{normal.text}</span></div>
        </section>
        <svg className="al7-con al7-con-1" viewBox="0 0 60 400" preserveAspectRatio="none" aria-hidden="true">
          {[50, 150, 250, 350].map((y, i) => <path key={y} data-i={i} d={`M0 200H30V${y}H60`} vectorEffect="non-scaling-stroke" />)}
        </svg>
        <section className="al7-col al7-col-2" aria-labelledby="al7-h2">
          <h5 id="al7-h2" className="al7-h">Señales de alerta</h5>
          <ul className="al7-tipos">
            {tipos.map((t, i) => (
              <li key={t.title} className="al7-card al7-tipo">
                <strong>{t.title}</strong>
                <em className="al7-mano">{ALERTA_SUB[i]}</em>
                <span>{t.text}</span>
              </li>
            ))}
          </ul>
        </section>
        <svg className="al7-con al7-con-2" viewBox="0 0 60 400" preserveAspectRatio="none" aria-hidden="true">
          {[50, 150, 250, 350].map((y, i) => <path key={y} data-i={i} d={`M0 ${y}H30V200H60`} vectorEffect="non-scaling-stroke" />)}
        </svg>
        <section className="al7-col al7-col-3" aria-labelledby="al7-h3">
          <h5 id="al7-h3" className="al7-h">Cómo intervenimos</h5>
          <div className="al7-card al7-protocolo">
            <strong>Protocolo de intervención</strong>
            <ol>{B2B_N3.protocolo.map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
          <svg className="al7-fork" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
            <path className="is-ok" d="M50 0V12H25V32" vectorEffect="non-scaling-stroke" />
            <path className="is-up" d="M50 12H75V32" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="al7-salida">
            {B2B_N3.cierreAlerta.map((c, i) => <p key={c.title} className={`al7-card ${i === 0 ? 'is-ok' : 'is-up'}`}><strong>{c.title}</strong>{c.text}</p>)}
          </div>
        </section>
      </div>
      <h5 className="ag-pf-h5">Jerarquía de escalamiento</h5>
      <ol className="esc7" aria-label="Escalera de intervención">
        {ESCALERA.map((x, i) => (
          <li key={x} className="esc7-paso" style={{ ['--n' as string]: i + 1 }}>
            <span className="esc7-n" aria-hidden="true">{i + 1}</span>
            <span className="esc7-t">{x}</span>
            {i < ESCALERA.length - 1 && (
              <svg className="esc7-fl" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12H18M13 7L18 12L13 17" vectorEffect="non-scaling-stroke" /></svg>
            )}
          </li>
        ))}
      </ol>
      <ol className="ag-pf-cadena">{B2B_ALERTAS_CADENA.map((x) => <li key={x}>{x}</li>)}</ol>
      <p className="ag-pf-lead">No todas las alertas ameritan llegar a las directivas. La severidad determina quién recibe la notificación:</p>
      <ol className="ag-pf-sev">{B2B_N3.severidad.map((x, i) => <li key={x} className={`is-${i + 1}`}>{x}</li>)}</ol>
      <Cta href="#plataforma" label="Ver cómo funciona la plataforma" nota="Las alertas hacen parte del Nivel 3." />
    </AlEntrar>
  );
}

/** p.16: semestral vs anual. */
export function SemestralAnual() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Semestral o anual</h4>
      <p className="ag-pf-lead">La modalidad anual no repite el programa: conecta dos ciclos con análisis, refuerzo y verificación.</p>
      <div className="ag-pf-tabla-wrap" tabIndex={0} role="region" aria-label="Modalidad semestral y anual">
        <table className="ag-pf-tabla is-comparar">
          <caption className="ag-b2b-sr">Modalidad semestral y anual</caption>
          <thead><tr>{B2B_N3.modalidadHeaders.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{B2B_N3.modalidad.map((f) => <tr key={f[0]}><th scope="row">{f[0]}</th><td>{f[1]}</td><td>{f[2]}</td></tr>)}</tbody>
        </table>
      </div>
      <Cta href="#agendar" label="Cotizar la modalidad anual" />
    </AlEntrar>
  );
}

/** p.17: ciclo anual, plan interciclo y T0→T1→T2. */
export function CicloAnual() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Un año que suma</h4>
      <p className="ag-pf-lead">Entre un calendario y otro, refuerzo según sus brechas y medición de si se cerraron.</p>
      <div className="ag-pf-anual">
        <CicloSvg pasos={B2B_N3.ciclo} centro="Mejora continua · Calendario 1 → Calendario 2" />
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
      <Cta href="#agendar" label="Hablar del plan anual" nota="Mostramos el avance observado; no atribuimos automáticamente todo cambio al programa." />
    </AlEntrar>
  );
}

/** p.19: cohorte compartida y dedicada. */
export function Cohorte() {
  return (
    <AlEntrar className="ag-pf ag-pf-cohorte">
      <h4 className="ag-pf-h">Horarios solo para su colegio</h4>
      <p className="ag-pf-lead">Por defecto, sus estudiantes comparten clases; si necesita grupos exclusivos, lo cotizamos aparte.</p>
      <div className="ag-pf-dos">
        {[B2B_COHORTE.compartida, B2B_COHORTE.dedicada].map((c, i) => (
          <article key={c.title} className={`ag-pf-tarjeta${i === 1 ? ' is-cotiza' : ''}`}>
            <h4>{c.title}</h4>
            <ul>{c.points.map((x) => <li key={x}>{x}</li>)}</ul>
          </article>
        ))}
      </div>
      <Cta href="#agendar" label="Cotizar una cohorte dedicada" nota="Los resultados se publican en la semana siguiente a cada simulacro, después de validarlos." />
    </AlEntrar>
  );
}

/** p.20: entregables adicionales cotizables. */
export function Adicionales() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Entregables a su medida</h4>
      <p className="ag-pf-lead">Además de lo que incluye su nivel, puede sumar estos entregables con cotización aparte.</p>
      <ul className="ag-pf-extras">
        {B2B_ENTREGABLES.extra.map((x) => <li key={x}><span className="ag-pf-badge">Se cotiza aparte</span>{x}</li>)}
      </ul>
      <Cta href="#agendar" label="Solicitar una cotización" />
    </AlEntrar>
  );
}

const PQRS = [['Radicar', 'Número de caso'], ['Clasificar', 'Tipo y prioridad'], ['Asignar', 'Responsable'], ['Gestionar', 'Evidencia'], ['Responder y cerrar', 'Respuesta, tiempo y resultado']] as const;

/** pp.21–22: tipos de comunicación y flujo PQRS. */
export function Comunicaciones() {
  return (
    <AlEntrar className="ag-pf">
      <h4 className="ag-pf-h">Reglas claras, canales claros</h4>
      <p className="ag-pf-lead">Quién hace qué, por dónde se comunica cada cosa y cómo medimos el servicio. {B2B_CANALES.lead}</p>
      <div className="ag-pf-com">
        {B2B_COMUNICACION.map((g) => (
          <article key={g.tipo}>
            <h5>Comunicación {g.tipo.toLowerCase()}</h5>
            <ul>{g.canales.map((c) => <li key={c.title}><strong>{c.title}</strong><span>{c.text}</span></li>)}</ul>
          </article>
        ))}
      </div>
      <h4 className="ag-pf-h">Flujo PQRS</h4>
      <FlujoPqrs pasos={PQRS} />
      <Cta href="mailto:seamosgenios@adpmh.com?subject=PQRS" label="Radicar una PQRS" nota="Cada caso queda con número de radicado e historial. Correo: seamosgenios@adpmh.com" />
    </AlEntrar>
  );
}
