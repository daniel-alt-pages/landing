'use client';

import { useState } from 'react';
import { AlEntrar } from '../base/AlEntrar';

export function CicloSvg({
  pasos,
  centro,
}: {
  pasos: readonly { title: string; text: string }[];
  centro: string;
}) {
  const [activo, setActivo] = useState<number | null>(null);
  const total = pasos.length;
  const cx = 240;
  const cy = 240;
  const radio = 148;

  return (
    <AlEntrar className="ag-b2b-ciclo">
      <div className="ag-b2b-ciclo-stage">
        <svg viewBox="0 0 480 480" aria-hidden="true">
          <circle className="ag-b2b-ring" cx={cx} cy={cy} r={radio} />
          {pasos.map((paso, index) => {
            const angulo = -Math.PI / 2 + (index * 2 * Math.PI) / total;
            return (
              <circle
                key={paso.title}
                className={activo === index ? 'is-on' : undefined}
                cx={cx + radio * Math.cos(angulo)}
                cy={cy + radio * Math.sin(angulo)}
                r="18"
              />
            );
          })}
        </svg>
        <p className="ag-b2b-ciclo-centro">{activo === null ? centro : pasos[activo].text}</p>
        {pasos.map((paso, index) => {
          const angulo = -Math.PI / 2 + (index * 2 * Math.PI) / total;
          const x = 50 + 38 * Math.cos(angulo);
          const y = 50 + 38 * Math.sin(angulo);
          return (
            <button
              key={paso.title}
              type="button"
              className={activo === index ? 'is-on' : undefined}
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() => setActivo(index)}
              onMouseLeave={() => setActivo(null)}
              onFocus={() => setActivo(index)}
              onBlur={() => setActivo(null)}
            >
              <strong>{paso.title}</strong>
            </button>
          );
        })}
      </div>
      <ol className="ag-b2b-ciclo-lista">
        {pasos.map((paso) => (
          <li key={paso.title}><strong>{paso.title}</strong> {paso.text}</li>
        ))}
      </ol>
    </AlEntrar>
  );
}
