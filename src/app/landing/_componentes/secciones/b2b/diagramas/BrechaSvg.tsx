import { AlEntrar } from '../base/AlEntrar';

function Fila({ llenos, etiqueta }: { llenos: number; etiqueta: string }) {
  return (
    <div className="ag-b2b-brecha-fila">
      <svg viewBox="0 0 320 36" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <g key={index} transform={`translate(${16 + index * 32} 18)`} className={index < llenos ? 'is-on' : undefined}>
            <circle cy="-8" r="5" />
            <path d="M-7 8 Q0 1 7 8" />
          </g>
        ))}
      </svg>
      <p><strong>{llenos} de 10</strong> {etiqueta}</p>
    </div>
  );
}

export function BrechaSvg() {
  return (
    <AlEntrar className="ag-b2b-brecha">
      <Fila llenos={5} etiqueta="en zona urbana entran a la universidad al terminar el colegio." />
      <Fila llenos={3} etiqueta="en zona rural entran a la universidad al terminar el colegio." />
    </AlEntrar>
  );
}
