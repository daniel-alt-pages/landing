import { QUIENES } from '../../_contenido/quienes';
import { Section } from '../primitivas/Section';

function Mark({ id }: { id: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (id === 'tutores') {
    return (
      <svg {...common}>
        <path d="M3 9.5 12 5l9 4.5L12 14 3 9.5Z" />
        <path d="M7.5 11.5V16c0 .8 2 2.5 4.5 2.5s4.5-1.7 4.5-2.5v-4.5" />
        <path d="M21 10v5" />
      </svg>
    );
  }
  if (id === 'clases') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="12" rx="2.5" />
        <path d="M10 9.2v5.6l4.6-2.8L10 9.2Z" />
        <path d="M8 20h8" />
      </svg>
    );
  }
  if (id === 'casa') {
    return (
      <svg {...common}>
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M6.5 10.5V19h11v-8.5" />
        <path d="M10 19v-4.5h4V19" />
      </svg>
    );
  }
  if (id === 'ia') {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16V11" />
        <path d="M12 16V8" />
        <path d="M16 16v-6" />
      </svg>
    );
  }
  if (id === 'mision') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="16.5" cy="8" r="2.25" />
      <path d="M3 17.5 8.2 12l3.6 3.4L15 12.2 21 17.5" />
      <path d="M3 17.5h18" />
    </svg>
  );
}

export function AboutSection() {
  return (
    <Section id="quienes-somos" tone="white" label="quienes-title">
      <header className="ag-about-head">
        <h2 id="quienes-title">¿Quiénes somos?</h2>
        <p>{QUIENES.lead}</p>
      </header>
      <ul className="ag-about-steps">
        {QUIENES.diferenciales.map((item) => (
          <li key={item.id}>
            <span className="ag-about-mark">
              <Mark id={item.id} />
            </span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="ag-about-pair">
        <article>
          <span className="ag-about-mark">
            <Mark id="mision" />
          </span>
          <div>
            <h3>Misión</h3>
            <p>{QUIENES.mision}</p>
          </div>
        </article>
        <article>
          <span className="ag-about-mark">
            <Mark id="vision" />
          </span>
          <div>
            <h3>Visión</h3>
            <p>{QUIENES.vision}</p>
          </div>
        </article>
      </div>
    </Section>
  );
}
