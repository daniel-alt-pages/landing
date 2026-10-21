export function Balanza({
  izquierda,
  derecha,
  tituloIzquierda,
  tituloDerecha,
}: {
  izquierda: readonly string[];
  derecha: readonly string[];
  tituloIzquierda: string;
  tituloDerecha: string;
}) {
  return (
    <div className="ag-b2b-balanza">
      <svg className="ag-b2b-balanza-eje" viewBox="0 0 200 28" aria-hidden="true">
        <line x1="16" y1="8" x2="184" y2="8" />
        <line x1="100" y1="8" x2="100" y2="24" />
        <circle cx="100" cy="8" r="5" />
      </svg>
      <article>
        <h3>{tituloIzquierda}</h3>
        <ul>
          {izquierda.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </article>
      <article>
        <h3>{tituloDerecha}</h3>
        <ul>
          {derecha.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </article>
    </div>
  );
}
