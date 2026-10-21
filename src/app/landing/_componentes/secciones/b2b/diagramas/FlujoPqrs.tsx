import { AlEntrar } from '../base/AlEntrar';

export function FlujoPqrs({ pasos }: { pasos: readonly string[] }) {
  return (
    <AlEntrar>
      <ol className="ag-b2b-flujo" aria-label="Flujo de una PQRS">
        {pasos.map((paso, index) => (
          <li key={paso}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{paso.split(',')[0]}</strong>
          </li>
        ))}
      </ol>
    </AlEntrar>
  );
}
