'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MEDIA_MENTIONS } from '@/lib/mediaMentions';
import { EQUIPO } from '../../_contenido/equipo';
import { FUNDADOR_HISTORIA } from '../../_contenido/quienes';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';
import PixelCard from './PixelCard';

const FOTOS_FUNDADOR = [
  '/landing/fundador/daniel-de-la-cruz-1.svg',
  '/landing/fundador/daniel-de-la-cruz-2.svg',
  '/landing/fundador/daniel-de-la-cruz-3.svg',
];

const PRENSA = ['Samsung Newsroom', 'Forbes Colombia', 'El Nuevo Siglo', 'Universidad del Rosario', 'Revista C-Level', 'AVI Latinoamérica'];

const PRENSA_LOGO: Record<string, { src: string; plate?: 'dark' }> = {
  'Samsung Newsroom': { src: '/landing/prensa/samsung.svg?v=2' },
  'Universidad del Rosario': { src: '/landing/prensa/urosario.svg' },
  'Forbes Colombia': { src: '/landing/prensa/forbes.svg' },
  'El Nuevo Siglo': { src: '/landing/prensa/nuevo-siglo.png' },
  'AVI Latinoamérica': { src: '/landing/prensa/avi.png' },
  'Revista C-Level': { src: '/landing/prensa/clevel.png', plate: 'dark' },
};

const FUNDADOR_MARCAS = [
  { src: '/landing/fundador/insignia-py.svg', alt: 'Insignia de programación' },
  { src: '/landing/fundador/insignia-ia.svg', alt: 'Insignia de inteligencia artificial' },
  { src: '/landing/fundador/universidad-rosario.svg', alt: 'Universidad del Rosario' },
  { src: '/landing/fundador/together-for-tomorrow.svg', alt: 'Together for Tomorrow, Enabling People' },
] as const;

const PERFILES = ['Daniel de la Cruz', 'Ángel David Pacheco'] as const;
const COFUNDADORES = ['daniel', 'angel'];

const ANGEL_INSIGNIAS = ['Beca Fundación Mazda', 'Matemáticas · Uniandes', '308 → 475 ICFES'] as const;

/** Fuente: https://sites.google.com/view/msmaths/inicio (texto del propio Ángel, solo corrección ortográfica). */
const ANGEL_HISTORIA = {
  titulo: 'Entre ideas, café y futuros posibles',
  parrafos: [
    'Desde años atrás se dio cuenta de que le gustaba aprender algo nuevo, sin importar el tema, lo complejo o lo extraño. Desde entonces ve a diario contenidos audiovisuales que le dejen alguna enseñanza extra.',
    'En su último grupo de estudio estudiaban más de 10 horas diarias: aprendió mucho de ellos y ellos de él.',
    'Con más de 3 años de experiencia encontró el amor por dar clases, y eso lo impulsó a seguir con sus estudios para el ICFES hasta sacar 475. Hoy sigue dando clases con el mismo amor con el que empezó todo.',
  ],
  cita: '«La sensación de plenitud que me generaba terminar una clase y que alguien me agradeciera fue un motor que me impulsó a seguir».',
} as const;

const ANGEL_ENLACES = [
  { label: 'Anuncio Beca Fundación Mazda – Uniandes', source: 'Universidad de los Andes', url: 'https://ingenieria.uniandes.edu.co/es/Beneficiarios-Beca-Fundacion-Mazda' },
  { label: 'Ingeniería Uniandes en LinkedIn', source: 'LinkedIn', url: 'https://es.linkedin.com/posts/ingenieria-uniandes_beca-fundaci%C3%B3n-mazda-activity-7402463950535151616-5Uci' },
  { label: 'Sitio personal MATHS', source: 'Google Sites', url: 'https://sites.google.com/view/msmaths/inicio' },
] as const;

export function FounderSection() {
  const prensa = MEDIA_MENTIONS.filter((item) => PRENSA.includes(item.name));
  const [shot, setShot] = useState(0);
  const swapTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(swapTimer.current), []);

  function swapPhoto() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.clearTimeout(swapTimer.current);
    swapTimer.current = window.setTimeout(() => {
      setShot((current) => (current + 1) % FOTOS_FUNDADOR.length);
    }, reduce ? 0 : 280);
  }

  const [perfil, setPerfil] = useState(0);
  const cambiar = (delta: number) => setPerfil((current) => (current + delta + PERFILES.length) % PERFILES.length);
  const teclas = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); cambiar(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); cambiar(1); }
  };
  const angel = EQUIPO.find((person) => person.id === 'angel');

  return (
    <Section id="fundador" tone="paper" label="fundador-title">
      <div
        className="ag-cofounders"
        role="group"
        aria-roledescription="carrusel"
        aria-label="Cofundadores"
        tabIndex={0}
        onKeyDown={teclas}
      >
      <div className="ag-cofounders-nav">
        <button type="button" className="ag-cofounders-arrow" aria-label="Perfil anterior" onClick={() => cambiar(-1)}>
          <ChevronLeft size={22} strokeWidth={2.25} aria-hidden />
        </button>
        <p className="ag-cofounders-count" aria-live="polite" aria-atomic="true">
          <span aria-hidden>{perfil + 1} / {PERFILES.length}</span>
          <span className="ag-sr-only">Perfil {perfil + 1} de {PERFILES.length}: {PERFILES[perfil]}</span>
        </p>
        <button type="button" className="ag-cofounders-arrow" aria-label="Perfil siguiente" onClick={() => cambiar(1)}>
          <ChevronRight size={22} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
      {perfil === 0 ? (
      <>
      <div className="ag-founder">
        <article className="ag-founder-card">
          <div className="ag-founder-side">
            <figure className="ag-founder-figure" onMouseEnter={swapPhoto} onFocus={swapPhoto}>
              <PixelCard noFocus colors="#1a1a1a,#3a1014,#CC0000" gap={8} speed={36}>
                <img className="ag-pixel-shot" src={FOTOS_FUNDADOR[shot]} alt="Daniel Eduardo De La Cruz Vega" />
              </PixelCard>
              <figcaption>
                <strong>Daniel De La Cruz</strong>
                <span>Presidente y fundador</span>
              </figcaption>
            </figure>
            <div className="ag-founder-marks" aria-label="Reconocimientos">
              {FUNDADOR_MARCAS.map((mark) => (
                <img key={mark.src} src={mark.src} alt={mark.alt} />
              ))}
            </div>
          </div>
          <div className="ag-founder-copy">
            <h2 id="fundador-title">Rompiendo barreras con tecnología</h2>
            {FUNDADOR_HISTORIA.parrafos.map((text) => (
              <p key={text}>{text}</p>
            ))}
            <blockquote className="ag-founder-quote">{FUNDADOR_HISTORIA.cita}</blockquote>
            <img className="ag-founder-samsung" src="/landing/prensa/samsung.svg" alt="Samsung" />
          </div>
        </article>
        <p className="ag-founder-source">
          Tomado y adaptado de{' '}
          <a href="https://csr.samsung.com/en/story/inspiring-journeys/breaking-barriers-with-tech" target="_blank" rel="noreferrer">
            Samsung Newsroom, «Breaking barriers with tech»
          </a>
        </p>
      </div>
      <div className="ag-press">
        <p className="ag-eyebrow">En los medios</p>
        <ul>
          {prensa.map((item) => (
            <li key={item.url}>
              <a href={item.url} target="_blank" rel="noreferrer">
                <span className={PRENSA_LOGO[item.name]?.plate === 'dark' ? 'ag-press-mark is-on-dark' : 'ag-press-mark'}>
                  <img src={PRENSA_LOGO[item.name]?.src} alt="" />
                </span>
                <strong>{item.name}</strong>
                <span>{item.headline}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      </>
      ) : angel ? (
      <>
      <div className="ag-founder">
        <article className="ag-founder-card">
          <div className="ag-founder-side">
            <figure className="ag-founder-figure">
              <div className="ag-cofounder-initials" role="img" aria-label={`Iniciales de ${angel.name}`}>
                <span aria-hidden>ÁP</span>
              </div>
              <figcaption>
                <strong>{angel.name}</strong>
                <span>{angel.role} · {angel.years}</span>
              </figcaption>
            </figure>
            <ul className="ag-founder-marks ag-cofounder-badges" aria-label="Reconocimientos">
              {ANGEL_INSIGNIAS.map((badge) => (
                <li key={badge}>{badge}</li>
              ))}
            </ul>
          </div>
          <div className="ag-founder-copy">
            <h2>{ANGEL_HISTORIA.titulo}</h2>
            <p>{angel.bio}</p>
            {ANGEL_HISTORIA.parrafos.map((text) => (
              <p key={text}>{text}</p>
            ))}
            <blockquote className="ag-founder-quote">{ANGEL_HISTORIA.cita}</blockquote>
          </div>
        </article>
        <p className="ag-founder-source">
          Relato tomado y adaptado de{' '}
          <a href="https://sites.google.com/view/msmaths/inicio" target="_blank" rel="noopener noreferrer">
            MATHS, sitio personal de Ángel David Pacheco
          </a>
        </p>
      </div>
      <div className="ag-press ag-cofounder-links">
        <p className="ag-eyebrow">Enlaces</p>
        <ul>
          {ANGEL_ENLACES.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <strong>{link.label}</strong>
                <span>{link.source}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      </>
      ) : null}
      </div>
    </Section>
  );
}

const AREAS = [
  { id: 'todos', label: 'Todos' },
  { id: 'lectura', label: 'Lectura crítica' },
  { id: 'matematicas', label: 'Matemáticas' },
  { id: 'sociales', label: 'Sociales' },
  { id: 'ciencias', label: 'Ciencias' },
  { id: 'ingles', label: 'Inglés' },
  { id: 'direccion', label: 'Dirección' },
] as const;

type AreaId = (typeof AREAS)[number]['id'];

const AREAS_DE: Record<string, readonly AreaId[]> = {
  hellen: ['lectura'],
  alexandra: ['lectura'],
  sofia: ['lectura'],
  luis: ['matematicas'],
  sara: ['matematicas', 'ingles'],
  diego: ['matematicas', 'direccion'],
  david: ['sociales'],
  carlos: ['sociales'],
  valentina: ['sociales', 'ciencias'],
  jesus: ['ciencias'],
  cuspoca: ['ciencias'],
  gabriel: ['ingles'],
  christian: ['ingles'],
  daniel: ['direccion'],
  angel: ['direccion'],
  leon: ['direccion'],
};

function PersonCard({ person }: { person: (typeof EQUIPO)[number] }) {
  return (
    <article className="ag-card ag-person-card">
      <img className="ag-person-guide" src={`/landing/equipo/${person.id}.svg`} alt="" />
      <h3 className="ag-h3">{person.name}</h3>
      <p className="ag-person-role">
        {person.role} · {person.years}
      </p>
      <p>{person.bio}</p>
    </article>
  );
}

export function TeamSection() {
  const [area, setArea] = useState<AreaId>('todos');
  const hold = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false, overflow: false });

  // La barra se pega con `position: sticky` (CSS). Aquí solo se mide la altura del
  // header pegajoso cuando cambia de tamaño, nunca en cada frame de scroll.
  useEffect(() => {
    const holdEl = hold.current;
    const header = document.querySelector<HTMLElement>('.ag-header');
    if (!holdEl || !header) return;
    const sync = () => {
      const sticky = getComputedStyle(header).position === 'sticky';
      holdEl.style.setProperty('--ag-team-top', `${sticky ? header.offsetHeight : 0}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({
        overflow: max > 4,
        left: el.scrollLeft > 4,
        right: max > 4 && el.scrollLeft < max - 4,
      });
    };
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      observer.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [area]);

  useEffect(() => {
    const rail = scroller.current;
    const tab = rail?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!rail || !tab) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const left = tab.offsetLeft - (rail.clientWidth - tab.offsetWidth) / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
  }, [area]);

  const desplazar = (delta: number) => {
    const rail = scroller.current;
    if (!rail) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({ left: delta, behavior: reduce ? 'auto' : 'smooth' });
  };

  const grupos = AREAS.filter((item) => item.id !== 'todos').map((item) => ({
    ...item,
    people: EQUIPO.filter((person) => !COFUNDADORES.includes(person.id)).filter((person) => {
      const areas = AREAS_DE[person.id] ?? [];
      return area === 'todos' ? areas[0] === item.id : area === item.id && areas.includes(item.id);
    }),
  })).filter((group) => group.people.length > 0);

  const mover = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = AREAS.findIndex((item) => item.id === area);
    const next =
      event.key === 'Home' ? 0
      : event.key === 'End' ? AREAS.length - 1
      : event.key === 'ArrowRight' ? (index + 1) % AREAS.length
      : (index - 1 + AREAS.length) % AREAS.length;
    setArea(AREAS[next].id);
    const button = event.currentTarget.querySelectorAll('button')[next];
    if (button instanceof HTMLButtonElement) button.focus();
  };

  return (
    <Section id="equipo" tone="grey" label="equipo-title">
      <DisplayTitle id="equipo-title" lines={[{ text: 'Un equipo' }, { text: 'de élite', accent: true }]} />
      <Lead>Tutores que ya obtuvieron los puntajes que hoy enseñan a alcanzar. Estudian en las mejores universidades del país y conocen el examen desde adentro.</Lead>
      <div className="ag-team-hold" ref={hold}>
        <div className="ag-team-bar">
          {edges.overflow ? (
            <button
              type="button"
              className="ag-team-arrow"
              aria-label="Desplazar áreas a la izquierda"
              disabled={!edges.left}
              onClick={() => desplazar(-220)}
            >
              <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
          <div
            className="ag-team-scroller"
            ref={scroller}
            role="tablist"
            aria-label="Áreas del equipo"
            onKeyDown={mover}
          >
            {AREAS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`equipo-tab-${item.id}`}
                aria-selected={area === item.id}
                aria-controls="equipo-panel"
                tabIndex={area === item.id ? 0 : -1}
                onClick={() => setArea(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {edges.overflow ? (
            <button
              type="button"
              className="ag-team-arrow"
              aria-label="Desplazar áreas a la derecha"
              disabled={!edges.right}
              onClick={() => desplazar(220)}
            >
              <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      <div id="equipo-panel" className="ag-team-groups" role="tabpanel" aria-labelledby={`equipo-tab-${area}`}>
        {grupos.map((group) => (
          <section key={group.id} aria-label={group.label}>
            <h3 className="ag-team-area">{group.label}</h3>
            <div className="ag-grid-3">
              {group.people.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Section>
  );
}
