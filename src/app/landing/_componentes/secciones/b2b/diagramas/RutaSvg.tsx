import { AlEntrar } from '../base/AlEntrar';

export function RutaSvg({
  etiqueta,
  pasos,
}: {
  etiqueta: string;
  pasos: readonly { title: string; text?: string }[];
}) {
  return (
    <AlEntrar>
      <ol className="ag-b2b-ruta" aria-label={etiqueta}>
        {pasos.map((paso, index) => (
          <li key={paso.title}>
            <span>{index + 1}</span>
            <strong>{paso.title}</strong>
            {paso.text ? <p>{paso.text}</p> : null}
          </li>
        ))}
      </ol>
    </AlEntrar>
  );
}
