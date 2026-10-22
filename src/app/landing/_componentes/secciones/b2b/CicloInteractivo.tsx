'use client';

import { useCallback, useEffect, useState, type KeyboardEvent } from 'react';
import { CICLO_CADENA, CICLO_FILTROS, CICLO_PASOS } from '../../../_contenido/b2b/ciclo';

const CX = 270, CY = 225, R = 150, RP = 196;
const ANG = [-90, -30, 30, 90, 150, 210];
const pt = (a: number, r: number) => [Math.round((CX + r * Math.cos((a * Math.PI) / 180)) * 100) / 100, Math.round((CY + r * Math.sin((a * Math.PI) / 180)) * 100) / 100] as const;
const CIRC = 2 * Math.PI * R;
const TOTAL = CICLO_PASOS.length;

export function CicloInteractivo() {
  const [activo, setActivo] = useState(0);
  const [filtro, setFiltro] = useState<(typeof CICLO_FILTROS)[number]['id']>('todos');
  const [vista, setVista] = useState<'circulo' | 'completo'>('completo');
  const [auto, setAuto] = useState(false);
  const [reducido, setReducido] = useState(false);

  const aplica = CICLO_FILTROS.find((f) => f.id === filtro)!.pasos as readonly number[];
  const ir = useCallback((i: number) => setActivo(((i % TOTAL) + TOTAL) % TOTAL), []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => { setReducido(mq.matches); if (mq.matches) setAuto(false); };
    f(); mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  useEffect(() => {
    if (!auto) return;
    const t = window.setInterval(() => setActivo((a) => (a + 1) % TOTAL), 2600);
    return () => window.clearInterval(t);
  }, [auto]);

  const elegirFiltro = (id: typeof filtro) => {
    setFiltro(id);
    const p = CICLO_FILTROS.find((f) => f.id === id)!.pasos as readonly number[];
    if (!p.includes(activo)) setActivo(p[0]);
  };

  const teclaNodo = (e: KeyboardEvent, i: number) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(i); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); ir(i + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); ir(i - 1); }
  };

  const p = CICLO_PASOS[activo];
  const nv = (n: readonly string[]) => n.join(' · ');

  return (
    <div className="cic" data-vista={vista}>
      <div className="cic-controles">
        <div className="cic-grupo" role="group" aria-label="Filtrar por nivel">
          {CICLO_FILTROS.map((f) => (
            <button key={f.id} type="button" className="cic-chip" aria-pressed={filtro === f.id} onClick={() => elegirFiltro(f.id)}>{f.label}</button>
          ))}
        </div>
        <div className="cic-grupo" role="group" aria-label="Vista">
          <button type="button" className="cic-chip" aria-pressed={vista === 'circulo'} onClick={() => setVista('circulo')}>Solo círculo</button>
          <button type="button" className="cic-chip" aria-pressed={vista === 'completo'} onClick={() => setVista('completo')}>Círculo + inspector + 7 pasos</button>
        </div>
      </div>

      <div className="cic-grid">
        <div className="cic-svgcaja">
          <svg className="cic-svg" viewBox="0 0 540 450" role="group" aria-label="Ciclo de 6 pasos">
            <defs>
              <marker id="cic-fl" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="#0A0A0A" strokeWidth="1.8" /></marker>
              <filter id="cic-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
            </defs>
            <path className="cic-mancha" d="M110 120C150 40 300 20 400 60C500 100 520 220 480 320C440 410 300 440 190 410C80 380 40 300 60 220C70 180 85 150 110 120Z" />
            <circle cx={CX} cy={CY} r={R + 26} className="cic-punteado" />
            <circle cx={CX} cy={CY} r={R} className="cic-base" />
            <circle cx={CX} cy={CY} r={R} className="cic-arco" transform={`rotate(-90 ${CX} ${CY})`}
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - activo / TOTAL)} />
            {ANG.map((a) => {
              const [x1, y1] = pt(a + 27, R); const [x2, y2] = pt(a + 33, R);
              return <path key={a} d={`M${x1} ${y1}L${x2} ${y2}`} className="cic-flecha" markerEnd="url(#cic-fl)" />;
            })}
            {CICLO_PASOS.map((s, i) => {
              const [x, y] = pt(ANG[i], R); const [px, py] = pt(ANG[i], RP);
              const estado = i < activo ? 'pasado' : i === activo ? 'activo' : 'futuro';
              const off = !aplica.includes(i);
              return (
                <g key={s.id} className="cic-nodo" data-estado={estado} data-off={off || undefined}
                  role="button" tabIndex={0} aria-pressed={i === activo}
                  aria-label={`Paso ${s.n}: ${s.title}. ${s.pregunta}${off ? ' (no aplica al nivel elegido)' : ''}`}
                  onClick={() => ir(i)} onKeyDown={(e) => teclaNodo(e, i)}>
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

        <aside className="cic-inspector" aria-live="polite" aria-atomic="true">
          <div className="cic-badges">
            <span className="cic-badge is-rojo">PASO {p.n} DE 06 · ACTIVO</span>
            <span className="cic-badge">{nv(p.niveles)}</span>
          </div>
          <p className="cic-q">{p.pregunta}</p>
          <h3 className="cic-t">{p.title}</h3>
          <p className="cic-d">{p.corto}</p>
          <div className="cic-cajas">
            <div className="cic-caja"><h4>Lo que ejecuta SEAMOSGENIOS</h4><p>{p.ejecuta}</p></div>
            <div className="cic-caja is-rosa"><h4>Entregable para la institución</h4><p>{p.entregable}</p></div>
          </div>
          <div className="cic-nav">
            <button type="button" className="cic-btn" onClick={() => ir(activo - 1)} aria-label="Paso anterior">← Anterior</button>
            <button type="button" className="cic-btn" onClick={() => ir(activo + 1)} aria-label="Paso siguiente">Siguiente →</button>
            {!reducido && (
              <button type="button" className="cic-btn is-auto" aria-pressed={auto} onClick={() => setAuto((v) => !v)}>
                {auto ? 'Pausar auto-recorrido' : 'Auto-recorrido'}
              </button>
            )}
          </div>
        </aside>
      </div>

      <ol className="cic-cadena" aria-label="Cadena de valor de 7 eslabones">
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
