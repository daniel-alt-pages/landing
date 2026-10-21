import { AlEntrar } from '../base/AlEntrar';

const COLORES = ['#9B1116', '#CC0000', '#DD5959', '#F9E0DF', '#0a0a0a'] as const;

function arco(i: number, total: number, r1: number, r2: number) {
  const gap = 0.03;
  const a0 = -Math.PI / 2 + (i / total) * 2 * Math.PI + gap;
  const a1 = -Math.PI / 2 + ((i + 1) / total) * 2 * Math.PI - gap;
  const p = (r: number, a: number) => `${(120 + r * Math.cos(a)).toFixed(2)} ${(120 + r * Math.sin(a)).toFixed(2)}`;
  return `M${p(r2, a0)} A${r2} ${r2} 0 0 1 ${p(r2, a1)} L${p(r1, a1)} A${r1} ${r1} 0 0 0 ${p(r1, a0)}Z`;
}

/** p.22: rueda «Flujo PQRS» de 5 segmentos. La lista es la fuente de verdad; el donut es decorativo. */
export function FlujoPqrs({ pasos }: { pasos: readonly (readonly [string, string])[] }) {
  return (
    <AlEntrar className="ag-pf-rueda-pqrs">
      <figure className="ag-pf-lienzo">
        <svg viewBox="0 0 240 240" aria-hidden="true">
          {pasos.map((_, i) => {
            const a = -Math.PI / 2 + ((i + 0.5) / pasos.length) * 2 * Math.PI;
            return (
              <g key={i} style={{ ['--i' as string]: i }}>
                <path d={arco(i, pasos.length, 62, 110)} fill={COLORES[i]} />
                <text x={120 + 86 * Math.cos(a)} y={124 + 86 * Math.sin(a)} textAnchor="middle" fill={i === 3 ? '#9B1116' : '#fff'}>{String(i + 1).padStart(2, '0')}</text>
              </g>
            );
          })}
          <text x="120" y="117" textAnchor="middle" className="is-centro">FLUJO</text>
          <text x="120" y="135" textAnchor="middle" className="is-centro">PQRS</text>
        </svg>
        <figcaption className="ag-b2b-sr">Flujo de una PQRS en cinco pasos.</figcaption>
      </figure>
      <ol className="ag-pf-pqrs" aria-label="Flujo de una PQRS">
        {pasos.map(([t, d], i) => (
          <li key={t} style={{ ['--i' as string]: i }}><span>{String(i + 1).padStart(2, '0')}</span><strong>{t}</strong><em>{d}</em></li>
        ))}
      </ol>
    </AlEntrar>
  );
}
