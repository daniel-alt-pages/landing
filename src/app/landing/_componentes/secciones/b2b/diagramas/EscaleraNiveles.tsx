import { AlEntrar } from '../base/AlEntrar';

const PELDAÑOS = [
  { x: 28, y: 118, w: 190, h: 46, label: 'N1 · Diagnóstico' },
  { x: 214, y: 72, w: 200, h: 92, label: 'N2 · Intervención' },
  { x: 400, y: 26, w: 220, h: 138, label: 'N3 · Mejora continua' },
] as const;

const VERTICAL = [
  { y: 16, w: 150, label: 'N1 · Diagnóstico' },
  { y: 72, w: 220, label: 'N2 · Intervención' },
  { y: 128, w: 288, label: 'N3 · Mejora continua' },
] as const;

const ETIQUETA = 'Los tres niveles cubren cada vez más de la misma cadena, de evaluar a mejorar.';

export function EscaleraNiveles() {
  return (
    <AlEntrar className="ag-b2b-escalera">
      <svg viewBox="0 0 640 190" role="img" aria-label={ETIQUETA}>
        <line x1="24" y1="164" x2="616" y2="164" />
        <text x="24" y="182">Evaluar</text>
        <text x="560" y="182">Mejorar</text>
        {PELDAÑOS.map((paso, index) => (
          <g key={paso.label} className={`ag-b2b-peldano p${index + 1}`}>
            <rect x={paso.x} y={paso.y} width={paso.w} height={paso.h} rx="12" />
            <text x={paso.x + 16} y={paso.y + 28}>{paso.label}</text>
          </g>
        ))}
      </svg>
      <svg className="ag-b2b-escalera-v" viewBox="0 0 320 188" role="img" aria-label={ETIQUETA}>
        {VERTICAL.map((paso, index) => (
          <g key={paso.label} className={`ag-b2b-peldano p${index + 1}`}>
            <rect x="16" y={paso.y} width={paso.w} height="44" rx="12" />
            <text x="28" y={paso.y + 28}>{paso.label}</text>
          </g>
        ))}
      </svg>
    </AlEntrar>
  );
}
