import type { ReactNode } from 'react';

/** Lámina p.3 del portafolio: "El problema que resolvemos" + "¿Quiénes somos?". HTML/SVG reales. */

const I = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
);
const IcoCiudad = () => <I><path d="M4 44h40M8 44V22h8v22M16 44V10h10v34M26 44V18h8v26M34 44V26h8v18" /><path d="M20 15v2M20 21v2M20 27v2M20 33v2M11 27v2M11 33v2M30 23v2M30 29v2M38 31v2" /></I>;
const IcoRural = () => <I><path d="M4 44h40" /><path d="M4 38c8-6 14-6 20 0s12 6 20 0" /><path d="M4 31l9-11 7 8 8-12 16 15" /><circle cx="38" cy="9" r="4" /><path d="M10 20v-6M10 14l-3 3M10 14l3 3" /></I>;
const IcoBirrete = () => <I><path d="M2 18l22-10 22 10-22 10z" /><path d="M12 23v10c0 3 6 6 12 6s12-3 12-6V23" /><path d="M44 19v12" /></I>;
const IcoCasa = () => <I><path d="M5 22L24 6l19 16" /><path d="M10 18v24h28V18" /><path d="M20 42V30h8v12" /></I>;
const IcoPantalla = () => <I><rect x="6" y="9" width="36" height="24" rx="2" /><path d="M2 38h44" /></I>;
const IcoCohete = () => <I><path d="M28 6c8 0 14 6 14 14L26 36l-14-14z" /><circle cx="31" cy="17" r="3" /><path d="M12 22l-6 2 4-8 8-2M26 36l-2 6 8-4 2-8" /><path d="M14 34l-6 6" /></I>;
const IcoDiana = () => (
  <svg viewBox="0 0 64 64" width="64" height="64" fill="none" aria-hidden="true" focusable="false">
    <circle cx="28" cy="36" r="24" stroke="#111" strokeWidth="5" /><circle cx="28" cy="36" r="14" stroke="#111" strokeWidth="5" /><circle cx="28" cy="36" r="5" fill="var(--ag-red)" />
    <path d="M28 36L52 12" stroke="#111" strokeWidth="3.5" strokeLinecap="round" /><path d="M50 4l2 8 8 2-6 6-8-2-2-8z" fill="var(--ag-red)" />
  </svg>
);
const IcoMision = () => <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="var(--ag-red)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 28V5M8 6h14l-3 4 3 4H8" /><path d="M4 28h24M14 28l4-8 6 8" /></svg>;
const IcoVision = () => <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="var(--ag-red)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 7l9 9-9 9" /></svg>;

const CICLO = [
  { t: 'Problema', d: 'Preparación insuficiente, recursos limitados y metodologías tradicionales que no responden a las exigencias actuales.' },
  { t: 'Consecuencia', d: 'Resultados bajos, menos oportunidades de ingreso a la universidad y futuros limitados para miles de jóvenes.' },
  { t: 'Oportunidad', d: 'Con el acompañamiento correcto y las herramientas adecuadas, cada estudiante puede alcanzar su máximo potencial.' },
];

const RASGOS = [
  { t: 'Acceso a los Mejores', d: 'Tutores de las mejores universidades: U. Andes, UIS, ICESI, UdeA, Nacional, etc.', i: <IcoBirrete /> },
  { t: 'Cero Desplazamientos', d: 'Más tiempo para estudiar desde la comodidad de sus casas.', i: <IcoCasa /> },
  { t: 'Flexibilidad Horaria', d: 'Clases en vivo grabadas y disponibles 24/7 en nuestra plataforma.', i: <IcoPantalla /> },
  { t: 'Aprendizaje Adaptativo IA', d: 'Reportes de resultados enfocados en niveles de desempeño individuales y grupales.', i: <IcoCohete /> },
];

export function ProblemaQuienes() {
  return (
    <div className="ag-pq">
      <div className="ag-pq-col">
        <header className="ag-pq-head"><p className="ag-pq-num">02</p>
        <h2 id="b2b-porque-title" className="ag-pq-h">El problema <span>que resolvemos</span></h2></header>
        <p className="ag-pq-p">Cada año, <strong>miles de estudiantes no logran alcanzar los resultados</strong> en la prueba Saber 11 y esto dificulta el ingreso a la educación superior. Las causas son estructurales y profundas.</p>
        <div className="ag-pq-statsg"><div className="ag-pq-stats">
          <article className="ag-pq-stat"><IcoCiudad /><p className="ag-pq-cifra">5 de cada 10</p><p><strong>estudiantes</strong> de <strong>zona urbana</strong> ingresan a la universidad justo después de terminar el colegio.</p></article>
          <article className="ag-pq-stat"><IcoRural /><p className="ag-pq-cifra">3 de cada 10</p><p><strong>estudiantes</strong> de <strong>zona rural</strong> ingresan a la universidad justo después de terminar el colegio.</p></article>
        </div>
        <p className="ag-pq-fuente">Fuente: Presidencia de la República (2025)</p></div>
        <section className="ag-pq-ciclo" aria-labelledby="ag-pq-ciclo-h">
          <h3 id="ag-pq-ciclo-h">El ciclo que está limitando su futuro</h3>
          <ol>{CICLO.map((c) => <li key={c.t}><strong>{c.t}</strong><p>{c.d}</p></li>)}</ol>
        </section>
        <div className="ag-pq-compromiso"><IcoDiana /><p>Nuestro compromiso es romper este ciclo y <strong>abrirles las puertas</strong> a un futuro posible.</p></div>
      </div>

      <div className="ag-pq-col">
        <header className="ag-pq-head"><p className="ag-pq-num">03</p>
        <h2 className="ag-pq-h">¿Quiénes <span>somos?</span></h2></header>
        <p className="ag-pq-lead">En Colombia, el acceso a una preparación de calidad para las pruebas Saber 11 ICFES sigue siendo un privilegio. En <strong>SEAMOSGENIOS SAS,</strong> NIT 902080201-8, trabajamos para <strong>romper esta barrera, democratizando la excelencia académica</strong> orientada a la preparación Saber 11, evaluación educativa, tecnología y análisis de datos.</p>
        <ul className="ag-pq-rasgos">
          {RASGOS.map((r) => <li key={r.t}>{r.i}<strong>{r.t}:</strong><p>{r.d}</p></li>)}
        </ul>
        <div className="ag-pq-mv">
          <article><h3><span className="ag-pq-mv-ico"><IcoMision /></span>Misión</h3><p>Transformar vidas brindando herramientas reales <strong>para abrir las puertas del futuro</strong> académico de cualquier estudiante.</p></article>
          <article><h3><span className="ag-pq-mv-ico"><IcoVision /></span>Visión</h3><p><strong>Democratizar la educación en Colombia</strong> y ser el programa virtual líder, comprometido con la calidad, el impacto social y la oportunidad para todos.</p></article>
        </div>
      </div>
    </div>
  );
}
