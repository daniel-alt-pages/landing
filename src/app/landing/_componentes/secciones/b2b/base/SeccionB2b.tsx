import type { ReactNode } from 'react';

export function SeccionB2b({
  id,
  tone,
  numero,
  pregunta,
  titulo,
  acento,
  bajada,
  onDark = false,
  children,
}: {
  id: string;
  tone: 'black' | 'grey' | 'white' | 'paper' | 'charcoal' | 'red';
  numero: string;
  pregunta: string;
  titulo: string;
  acento: string;
  bajada?: string;
  onDark?: boolean;
  children: ReactNode;
}) {
  const [antes, despues = ''] = titulo.split(acento);
  const etiqueta = `b2b-${id}-title`;
  return (
    <section id={id} className={`ag-section ag-tone-${tone} ag-b2b`} aria-labelledby={etiqueta}>
      <div className="ag-wrap ag-b2b-sec">
        <p className={`ag-b2b-pregunta${onDark ? ' is-on-dark' : ''}`}><span>{numero} ·</span> {pregunta}</p>
        <h2 id={etiqueta} className="ag-b2b-title">
          {antes}
          <span className={onDark ? 'ag-accent-line' : 'ag-accent'}>{acento}</span>
          {despues}
        </h2>
        {bajada ? <p className="ag-b2b-bajada">{bajada}</p> : null}
        {children}
      </div>
    </section>
  );
}
