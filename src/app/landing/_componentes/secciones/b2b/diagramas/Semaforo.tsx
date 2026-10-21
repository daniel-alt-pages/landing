const NIVELES = [
  { label: 'Leve', texto: 'Solo el estudiante' },
  { label: 'Medio', texto: 'Avisa a la familia' },
  { label: 'Crítico', texto: 'Llega a coordinación' },
] as const;

export function Semaforo() {
  return (
    <figure className="ag-b2b-semaforo">
      <svg viewBox="0 0 48 148" aria-hidden="true">
        <rect x="8" y="4" width="32" height="140" rx="16" />
        <circle cx="24" cy="36" r="8" />
        <circle cx="24" cy="74" r="8" />
        <circle cx="24" cy="112" r="8" />
      </svg>
      <ol>
        {NIVELES.map((nivel) => (
          <li key={nivel.label}>
            <strong>{nivel.label}</strong>
            <span>{nivel.texto}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
