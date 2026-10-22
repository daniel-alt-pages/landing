'use client';

import { useState, type KeyboardEvent } from 'react';
import { CICLO_CADENA, CICLO_FILTROS, CICLO_PASOS } from '../../../_contenido/b2b/ciclo';

const CX = 270, CY = 225, R = 150, RP = 196;
const ANG = [-90, -30, 30, 90, 150, 210];
const pt = (a: number, r: number) => [Math.round((CX + r * Math.cos((a * Math.PI) / 180)) * 100) / 100, Math.round((CY + r * Math.sin((a * Math.PI) / 180)) * 100) / 100] as const;
const CIRC = 2 * Math.PI * R;
const TOTAL = CICLO_PASOS.length;
/** Etiquetas cortas de las pestañas; el nombre largo del filtro se muestra en el inspector. */
const CORTO: Record<(typeof CICLO_FILTROS)[number]['id'], string> = { todos: 'Ciclo completo', N1: 'Nivel 1', N2: 'Nivel 2', N3: 'Nivel 3' };


/**
 * Ciclo de 6 pasos, solo manual (v1.0.15): no hay recorrido automático; el paso cambia únicamente cuando la persona
 * elige una pestaña, un paso (chips o nodo del círculo) o usa «Anterior» / «Siguiente».
 * Escritorio: barra de controles arriba y 2 columnas (círculo + navegación | detalle). Móvil: pestañas → círculo → pasos → detalle.
 */
export function CicloInteractivo() {
  const [activo, setActivo] = useState(0);
  const [filtro, setFiltro] = useState<(typeof CICLO_FILTROS)[number]['id']>('todos');
  const [vista, setVista] = useState<'circulo' | 'completo'>('completo');
  const aplica = CICLO_FILTROS.find((f) => f.id === filtro)!.pasos as readonly number[];

  const k = aplica.indexOf(activo);
  const ir = (delta: number) => setActivo(aplica[(k + delta + aplica.length) % aplica.length]);

  const elegirFiltro = (id: typeof filtro) => {
    setFiltro(id);
    const p = CICLO_FILTROS.find((f) => f.id === id)!.pasos as readonly number[];
    if (!p.includes(activo)) setActivo(p[0]);
  };

  const tecladoFiltro = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const ids = CICLO_FILTROS.map((f) => f.id);
    const i = ids.indexOf(filtro);
    const sig = event.key === 'Home' ? ids[0] : event.key === 'End' ? ids[ids.length - 1]
      : ids[(i + (event.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length];
    elegirFiltro(sig);
    document.getElementById(`cic-tab-${sig}`)?.focus();
  };

  const p = CICLO_PASOS[activo];
  const nv = (n: readonly string[]) => n.join(' · ');

  return (
    <div className="cic" data-vista={vista} data-manual="">
      <div className="cic-controles">
        <div className="cic-tabs" role="tablist" aria-label="Filtrar por nivel" onKeyDown={tecladoFiltro}>
          {CICLO_FILTROS.map((f) => (
            <button key={f.id} type="button" role="tab" id={`cic-tab-${f.id}`} className="cic-tab" aria-selected={filtro === f.id}
              aria-controls="cic-escena" tabIndex={filtro === f.id ? 0 : -1} onClick={() => elegirFiltro(f.id)}>{CORTO[f.id]}</button>
          ))}
        </div>
        <div className="cic-grupo cic-vista" role="group" aria-label="Vista">
          <button type="button" className="cic-chip" aria-pressed={vista === 'completo'} onClick={() => setVista('completo')}>Círculo y detalle</button>
          <button type="button" className="cic-chip" aria-pressed={vista === 'circulo'} onClick={() => setVista('circulo')}>Solo círculo</button>
        </div>
      </div>

      <div className="cic-grid" id="cic-escena" role="tabpanel" aria-labelledby={`cic-tab-${filtro}`}>
        <div className="cic-col">
        <div className="cic-svgcaja">
          <svg className="cic-svg" viewBox="0 0 540 450" aria-hidden="true">
            <defs>
              <filter id="cic-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
            </defs>
            <path className="cic-mancha" d="M110 120C150 40 300 20 400 60C500 100 520 220 480 320C440 410 300 440 190 410C80 380 40 300 60 220C70 180 85 150 110 120Z" />
            <circle cx={CX} cy={CY} r={R + 26} className="cic-punteado" />
            <circle cx={CX} cy={CY} r={R} className="cic-base" />
            <circle cx={CX} cy={CY} r={R} className="cic-arco" transform={`rotate(-90 ${CX} ${CY})`}
              strokeDasharray={CIRC}
              style={{ ['--hasta' as string]: CIRC * (1 - (activo + 1) / TOTAL) }} />
            {ANG.map((a, i) => {
              const m = a + 30; const [x, y] = pt(m, R + 14);
              return (
                <path key={a} d="M-3 -5L2 0L-3 5" className="cic-flecha" data-hecha={i <= activo || undefined}
                  transform={`translate(${x} ${y}) rotate(${m + 90})`} vectorEffect="non-scaling-stroke" aria-hidden="true" />
              );
            })}
            {CICLO_PASOS.map((s, i) => {
              const [x, y] = pt(ANG[i], R); const [px, py] = pt(ANG[i], RP);
              const estado = i < activo ? 'pasado' : i === activo ? 'activo' : 'futuro';
              const off = !aplica.includes(i);
              return (
                <g key={s.id} className="cic-nodo" data-estado={estado} data-off={off || undefined} aria-hidden="true"
                  onClick={() => { if (!off) setActivo(i); }}>
                  {i === activo && <circle cx={x} cy={y} r={30} className="cic-glow" filter="url(#cic-glow)" />}
                  {i === activo && <circle cx={x} cy={y} r={26} className="cic-halo" />}
                  <circle cx={x} cy={y} r={i === activo ? 18 : 13} className="cic-punto" />
                  <rect x={px - 76} y={py - 17} width={152} height={34} rx={17} className="cic-pill" />
                  <text x={px} y={py + 6} textAnchor="middle" className="cic-pilltxt">{s.n} {s.title}</text>
                </g>
              );
            })}
          </svg>
          <div className="cic-centro" aria-hidden="true">
            <b>PASO {p.n} / 06</b>
            <span className="cic-centro-q">{p.pregunta}</span>
            <span className="cic-centro-d">{p.corto}</span>
            <span className="cic-centro-n">{nv(p.niveles)}</span>
          </div>
        </div>

        <nav className="cic-nav" aria-label="Pasos del ciclo">
          <button type="button" className="cic-paso-btn" onClick={() => ir(-1)} aria-label="Paso anterior">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <ol className="cic-pasos">
            {CICLO_PASOS.map((s, i) => (
              <li key={s.id}>
                <button type="button" className="cic-paso" aria-current={i === activo ? 'step' : undefined} disabled={!aplica.includes(i)}
                  aria-label={`Paso ${s.n}: ${s.title}`} onClick={() => setActivo(i)}>{Number(s.n)}</button>
              </li>
            ))}
          </ol>
          <button type="button" className="cic-paso-btn" onClick={() => ir(1)} aria-label="Paso siguiente">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </nav>
        </div>

        <aside className="cic-inspector" aria-live="polite">
          <div className="cic-badges">
            <span className="cic-badge is-rojo">PASO {p.n} DE 06</span>
            <span className="cic-badge">{nv(p.niveles)}</span>
            {filtro !== 'todos' && <span className="cic-badge">{CICLO_FILTROS.find((f) => f.id === filtro)!.label}</span>}
          </div>
          <p className="cic-q">{p.pregunta}</p>
          <h3 className="cic-t">{p.title}</h3>
          <p className="cic-d">{p.corto}</p>
          <div className="cic-cajas">
            <div className="cic-caja"><h4>Lo que ejecuta SEAMOSGENIOS</h4><p>{p.ejecuta}</p></div>
            <div className="cic-caja is-rosa"><h4>Entregable para la institución</h4><p>{p.entregable}</p></div>
          </div>
        </aside>
      </div>

      <ol className="cic-cadena" aria-label="Cadena de valor de 6 eslabones">
        {CICLO_CADENA.map((c, i) => {
          const on = (c.pasos as readonly number[]).includes(activo);
          const nivelOk = filtro === 'todos' || (c.niveles as readonly string[]).includes(filtro);
          return (
            <li key={c.title} className="cic-eslabon" data-activo={on || undefined} data-off={!nivelOk || undefined} aria-current={on ? 'step' : undefined}>
              <span className="cic-es-n">{String(i + 1).padStart(2, '0')}</span>
              <strong>{c.title}</strong>
              <span className="cic-es-q">{c.enlace}</span>
              <span className="cic-es-nv">{nv(c.niveles)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
