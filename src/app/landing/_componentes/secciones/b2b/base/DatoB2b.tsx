export function DatoB2b({ cifra, linea }: { cifra: string; linea: string }) {
  return (
    <article className="ag-b2b-dato">
      <strong>{cifra}</strong>
      <p>{linea}</p>
    </article>
  );
}
