export function DobleY({
  alumno,
  directivo,
}: {
  alumno: readonly string[];
  directivo: readonly string[];
}) {
  return (
    <div className="ag-b2b-doble">
      <article>
        <h3>Estudiante</h3>
        <ul>{alumno.map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
      <p>Un simulacro, dos lecturas</p>
      <article>
        <h3>Rectoría</h3>
        <ul>{directivo.map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
    </div>
  );
}
