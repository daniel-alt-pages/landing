import type { CSSProperties, ReactNode } from 'react';
import { RUTAS } from '../../_contenido/sitio';
import { MotionIn } from '../primitivas/MotionIn';

/** Icono 1: Calendario institucional (Colegios y rectores) */
function IconInstituciones() {
  return (
    <svg width="42" height="42" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="11" y="2" width="3" height="6" rx="1.5" fill="#111827" />
      <rect x="30" y="2" width="3" height="6" rx="1.5" fill="#111827" />
      <rect x="6" y="5" width="32" height="34" rx="6" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
      <path d="M6 14H38V11C38 7.68629 35.3137 5 32 5H12C8.68629 5 6 7.68629 6 11V14Z" fill="#e52b2b" />
      <circle cx="13" cy="21" r="2" fill="#111827" />
      <circle cx="22" cy="21" r="2" fill="#111827" />
      <circle cx="31" cy="21" r="2" fill="#111827" />
      <circle cx="13" cy="28" r="2" fill="#111827" />
      <circle cx="22" cy="28" r="2" fill="#111827" />
      <circle cx="31" cy="28" r="2" fill="#111827" />
      <circle cx="13" cy="34" r="2" fill="#111827" />
      <circle cx="22" cy="34" r="2" fill="#111827" />
    </svg>
  );
}

/** Icono 2: Laptop con analítica y destellos (Coordinación y docentes) */
function IconPlataforma() {
  return (
    <svg width="44" height="44" viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <path d="M6 14L2 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 8L5 4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 6L14 2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <rect x="9" y="11" width="28" height="20" rx="3.5" fill="#18181b" stroke="#ffffff" strokeWidth="2.2" />
      <rect x="14" y="23" width="3" height="4" rx="1" fill="#e52b2b" />
      <rect x="20" y="19" width="3" height="8" rx="1" fill="#e52b2b" />
      <rect x="26" y="15" width="3" height="12" rx="1" fill="#e52b2b" />
      <circle cx="31" cy="16" r="1.5" fill="#ffffff" />
      <path d="M4 33H42C42.8 33 43.5 33.7 43 34.5L40.8 38C40.4 38.6 39.7 39 39 39H7C6.3 39 5.6 38.6 5.2 38L3 34.5C2.5 33.7 3.2 33 4 33Z" fill="#18181b" stroke="#ffffff" strokeWidth="2" />
      <path d="M19 34H27" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Icono 3: Estudiantes con figura central roja y destellos (Estudiantes y familias) */
function IconProgramas() {
  return (
    <svg width="44" height="44" viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <path d="M23 3V6" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 5L19 7" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
      <path d="M29 5L27 7" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
      <circle cx="13" cy="18" r="4" fill="#ffffff" stroke="#111827" strokeWidth="2.2" />
      <path d="M5 34C5 28 8.5 25 13 25C15.2 25 17.2 26 18.5 27.5" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="33" cy="18" r="4" fill="#ffffff" stroke="#111827" strokeWidth="2.2" />
      <path d="M27.5 27.5C28.8 26 30.8 25 33 25C37.5 25 41 28 41 34" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="23" cy="15" r="4.5" fill="#e52b2b" />
      <path d="M14 34C14 27.5 18 24 23 24C28 24 32 27.5 32 34V35H14V34Z" fill="#e52b2b" stroke="#111827" strokeWidth="2.2" />
    </svg>
  );
}

/** Icono 4: Reporte con estrella de evidencia (Evidencia y resultados) */
function IconResultados() {
  return (
    <svg width="44" height="44" viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <rect x="9" y="5" width="28" height="36" rx="5" fill="#18181b" stroke="#ffffff" strokeWidth="2.2" />
      <path
        d="M17.5 13.5L19 16.5L22.5 17L20 19.5L20.5 23L17.5 21.2L14.5 23L15 19.5L12.5 17L16 16.5L17.5 13.5Z"
        fill="#e52b2b"
        stroke="#e52b2b"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <line x1="14" y1="28" x2="32" y2="28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="33" x2="28" y2="33" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Icono 5: Equipo de tutores con corona de liderazgo (El equipo) */
function IconEquipo() {
  return (
    <svg width="44" height="44" viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <path
        d="M18 10L19.5 6L23 8L26.5 6L28 10H18Z"
        fill="#e52b2b"
        stroke="#e52b2b"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="20" r="3.5" fill="#ffffff" stroke="#111827" strokeWidth="2" />
      <path d="M6 34C6 29 9 26.5 12 26.5C14 26.5 15.8 27.5 17 29" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
      <circle cx="34" cy="20" r="3.5" fill="#ffffff" stroke="#111827" strokeWidth="2" />
      <path d="M29 29C30.2 27.5 32 26.5 34 26.5C37 26.5 40 29 40 34" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
      <circle cx="23" cy="18" r="4.25" fill="#ffffff" stroke="#111827" strokeWidth="2.2" />
      <path d="M15 35C15 29 18.5 25.5 23 25.5C27.5 25.5 31 29 31 35" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Icono 6: Escudo de seguridad y datos (Legal) */
function IconLegal() {
  return (
    <svg width="44" height="44" viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <path d="M23 2V5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 4L17 7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <path d="M31 4L29 7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M23 9L35 13.5V23C35 30.5 29.5 37 23 40C16.5 37 11 30.5 11 23V13.5L23 9Z"
        fill="#18181b"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="23" cy="24" r="6" fill="#e52b2b" />
      <path
        d="M20.5 24L22 25.5L25.5 22"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Configuración de tema e ilustraciones para cada tarjeta */
const TARJETAS_CONFIG: Record<
  string,
  { theme: 'light' | 'dark'; icon: ReactNode; isCompact: boolean; mobileOrder: number }
> = {
  instituciones: { theme: 'light', icon: <IconInstituciones />, isCompact: true, mobileOrder: 1 },
  plataforma: { theme: 'dark', icon: <IconPlataforma />, isCompact: false, mobileOrder: 2 },
  programas: { theme: 'light', icon: <IconProgramas />, isCompact: true, mobileOrder: 3 },
  resultados: { theme: 'dark', icon: <IconResultados />, isCompact: false, mobileOrder: 4 },
  nosotros: { theme: 'light', icon: <IconEquipo />, isCompact: true, mobileOrder: 5 },
  datos: { theme: 'dark', icon: <IconLegal />, isCompact: false, mobileOrder: 6 },
};

/**
 * Organización en 3 columnas para escritorio con ritmo alternado (intercalando alturas):
 * - Columna 1: Chiquito arriba (instituciones) + Grande abajo (resultados)
 * - Columna 2: Grande arriba (plataforma) + Chiquito abajo (nosotros)
 * - Columna 3: Chiquito arriba (programas) + Grande abajo (datos)
 * Esto evita cajas gigantescas artificiales en las tarjetas con poco texto y crea un ritmo balanceado.
 */
const COLUMNAS_DESKTOP = [
  { id: 'col-1', items: [RUTAS[0], RUTAS[3]] },
  { id: 'col-2', items: [RUTAS[1], RUTAS[4]] },
  { id: 'col-3', items: [RUTAS[2], RUTAS[5]] },
];

/**
 * Sección "Qué encuentra en el sitio" (MapaSitio)
 * - Diseño limpio sin rayones externos ni anotaciones.
 * - Tarjetas con badges ilustrados y patrón ajedrezado (Blanco/Negro).
 * - Alturas naturales y ritmo intercalado: tarjetas pequeñas no tienen cajas sobredimensionadas.
 */
export function MapaSitio() {
  return (
    <section id="explorar" className="ag-section ag-mapa" aria-labelledby="mapa-titulo">
      <div className="ag-wrap">
        <MotionIn>
          <div className="ag-mapa-head">
            <h2 id="mapa-titulo" className="ag-mapa-title">
              Qué encuentra en el sitio
            </h2>
            <p className="ag-mapa-lead">
              Una página para cada pregunta: el modelo para colegios, la plataforma, los programas para estudiantes y la evidencia.
            </p>
          </div>
        </MotionIn>

        <div className="ag-mapa-grid">
          {COLUMNAS_DESKTOP.map((col, colIdx) => (
            <div key={col.id} className="ag-mapa-col">
              {col.items.map((r, itemIdx) => {
                const cfg = TARJETAS_CONFIG[r.id];
                const isDark = cfg?.theme === 'dark';
                const isCompact = cfg?.isCompact ?? false;
                const mobileOrder = cfg?.mobileOrder ?? (colIdx * 2 + itemIdx + 1);

                return (
                  <div
                    key={r.id}
                    className="ag-mapa-card-wrap"
                    style={{ '--mobile-order': mobileOrder } as CSSProperties}
                  >
                    <MotionIn delay={(colIdx * 2 + itemIdx) * 45}>
                      <a
                        href={r.href}
                        className={`ag-mapa-card ${isDark ? 'is-dark' : 'is-light'} ${
                          isCompact ? 'is-compact' : 'is-expanded'
                        }`}
                      >
                        <div className="ag-mapa-badge">
                          {cfg?.icon}
                        </div>
                        <div className="ag-mapa-info">
                          <span className="ag-mapa-para">{r.para}</span>
                          <strong className="ag-mapa-titulo">{r.titulo}</strong>
                          <p className="ag-mapa-texto">{r.texto}</p>
                          <div className="ag-mapa-action">
                            <span className="ag-mapa-action-text">Ver página</span>
                            <span className="ag-mapa-circle-btn" aria-hidden="true">
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path
                                  d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </a>
                    </MotionIn>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
