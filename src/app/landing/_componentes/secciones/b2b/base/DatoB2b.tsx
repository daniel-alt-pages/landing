export function DatoB2b({ valor, linea }: { valor: string; linea: string }) {
  return (
    <article className="ag-b2b-dato">
      <strong>{valor}</strong>
      <p>{linea}</p>
    </article>
  );
}
