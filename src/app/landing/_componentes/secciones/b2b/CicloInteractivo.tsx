'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { CICLO_CADENA, CICLO_DURACIONES_MS, CICLO_FILTROS, CICLO_PASOS } from '../../../_contenido/b2b/ciclo';

const CX = 270, CY = 225, R = 150, RP = 196;
const ANG = [-90, -30, 30, 90, 150, 210];
const pt = (a: number, r: number) => [Math.round((CX + r * Math.cos((a * Math.PI) / 180)) * 100) / 100, Math.round((CY + r * Math.sin((a * Math.PI) / 180)) * 100) / 100] as const;
const CIRC = 2 * Math.PI * R;
const TOTAL = CICLO_PASOS.length;
/** Etiquetas cortas de las pestañas; el nombre largo del filtro se muestra en el inspector. */
const CORTO: Record<(typeof CICLO_FILTROS)[number]['id'], string> = { todos: 'Ciclo completo', N1: 'Nivel 1', N2: 'Nivel 2', N3: 'Nivel 3' };


/**
 * Recorrido solo automático con la duración de cada paso (CICLO_DURACIONES_MS). El avance lo marca el fin de la
 * animación del arco, así arco y paso van siempre sincronizados y la pausa (animation-play-state) no pierde el tiempo transcurrido.
 * Del paso 6 vuelve al 1 y el arco se reinicia.
 * Se pausa con el puntero encima o el foco dentro, y se detiene si la sección no es visible (IntersectionObserver).
 * Botón visible de pausa/reanudar (aria-pressed) en todos los anchos: deja arco y halo parados hasta reanudar.
 * Con prefers-reduced-motion no avanza: se muestra una lista estática con los 6 pasos (CSS, también sin JS).
 */
export function CicloInteractivo() {
  const [activo, setActivo] = useState(0);
  const [filtro, setFiltro] = useState<(typeof CICLO_FILTROS)[number]['id']>('todos');
  const [vista, setVista] = useState<'circulo' | 'completo'>('completo');
  const [reducido, setReducido] = useState(false);
  const [visible, setVisible] = useState(false);
  const [encima, setEncima] = useState(false);
  const [foco, setFoco] = useState(false);
  // Pausa persistente elegida por el usuario (WCAG 2.2.2): detiene arco y halo hasta que la reanude.
  const [detenido, setDetenido] = useState(false);
  // «Más filtros»: panel bajo los controles en escritorio, hoja inferior en móvil.
  const [hoja, setHoja] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  const aplica = CICLO_FILTROS.find((f) => f.id === filtro)!.pasos as readonly number[];
  const pausado = reducido || !visible || encima || foco || detenido;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setReducido(mq.matches);
    f(); mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const avanzar = () => {
    if (reducido) return;
    setActivo((a) => {
      const k = aplica.indexOf(a);
      const sig = aplica[(k + 1) % aplica.length];
      return sig;
    });
  };

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
    <div ref={raiz} className="cic" data-vista={vista} data-pausado={pausado || undefined}
      onMouseEnter={() => setEncima(true)} onMouseLeave={() => setEncima(false)}
      onFocus={() => setFoco(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFoco(false); }}>
      <div className="cic-controles">
        <div className="cic-tabs" role="tablist" aria-label="Filtrar por nivel" onKeyDown={tecladoFiltro}>
          {CICLO_FILTROS.map((f) => (
            <button key={f.id} type="button" role="tab" id={`cic-tab-${f.id}`} className="cic-tab" aria-selected={filtro === f.id}
              aria-controls="cic-escena" tabIndex={filtro === f.id ? 0 : -1} onClick={() => elegirFiltro(f.id)}>{CORTO[f.id]}</button>
          ))}
        </div>
        <div className="cic-acciones">
          <button type="button" className="cic-boton cic-mas-btn" aria-expanded={hoja} aria-controls="cic-mas-filtros" onClick={() => setHoja((h) => !h)}>
            Más filtros
          </button>
          <button type="button" className="cic-boton cic-pausa" aria-pressed={detenido}
            aria-label={detenido ? 'Reanudar el recorrido automático del ciclo' : 'Pausar el recorrido automático del ciclo'}
            onClick={() => setDetenido((d) => !d)}>
            {detenido ? (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
            )}
            <span aria-hidden="true">{detenido ? 'Reanudar' : 'Pausar'}</span>
          </button>
        </div>
        {hoja && <button type="button" className="cic-velo" aria-label="Cerrar más filtros" tabIndex={-1} onClick={() => setHoja(false)} />}
        <div id="cic-mas-filtros" className="cic-hoja" role="group" aria-labelledby="cic-hoja-t" hidden={!hoja}
          onKeyDown={(e) => { if (e.key === 'Escape') setHoja(false); }}>
          <p id="cic-hoja-t" className="cic-hoja-t">Vista</p>
          <div className="cic-grupo">
            <button type="button" className="cic-chip" aria-pressed={vista === 'circulo'} onClick={() => setVista('circulo')}>Solo círculo</button>
            <button type="button" className="cic-chip" aria-pressed={vista === 'completo'} onClick={() => setVista('completo')}>Círculo + inspector + 6 pasos</button>
          </div>
          <button type="button" className="cic-boton is-primario cic-hoja-ok" onClick={() => setHoja(false)}>Listo</button>
        </div>
      </div>

      <div className="cic-grid" id="cic-escena" role="tabpanel" aria-labelledby={`cic-tab-${filtro}`}>
        <div className="cic-svgcaja">
          <svg className="cic-svg" viewBox="0 0 540 450" aria-hidden="true">
            <defs>
              <filter id="cic-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
            </defs>
            <path className="cic-mancha" d="M110 120C150 40 300 20 400 60C500 100 520 220 480 320C440 410 300 440 190 410C80 380 40 300 60 220C70 180 85 150 110 120Z" />
            <circle cx={CX} cy={CY} r={R + 26} className="cic-punteado" />
            <circle cx={CX} cy={CY} r={R} className="cic-base" />
            <circle key={`arco-${activo}-${filtro}`} cx={CX} cy={CY} r={R} className="cic-arco" transform={`rotate(-90 ${CX} ${CY})`}
              strokeDasharray={CIRC}
              style={{
                ['--desde' as string]: CIRC * (1 - activo / TOTAL),
                ['--hasta' as string]: CIRC * (1 - (activo + 1) / TOTAL),
                animationDuration: `${CICLO_DURACIONES_MS[activo]}ms`,
              }}
              onAnimationEnd={avanzar} />
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
                <g key={s.id} className="cic-nodo" data-estado={estado} data-off={off || undefined} aria-hidden="true">
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

        <aside className="cic-inspector" aria-hidden="true">
          <div className="cic-badges">
            <span className="cic-badge is-rojo">PASO {p.n} DE 06 · ACTIVO</span>
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

      <ol className="cic-estatico" aria-label="Los 6 pasos del ciclo">
        {CICLO_PASOS.map((s) => (
          <li key={s.id}>
            <p className="cic-q">{s.n} · {s.pregunta}</p>
            <h3 className="cic-t">{s.title}</h3>
            <p className="cic-d">{s.corto} · {nv(s.niveles)}</p>
            <div className="cic-cajas">
              <div className="cic-caja"><h4>Lo que ejecuta SEAMOSGENIOS</h4><p>{s.ejecuta}</p></div>
              <div className="cic-caja is-rosa"><h4>Entregable para la institución</h4><p>{s.entregable}</p></div>
            </div>
          </li>
        ))}
      </ol>

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
