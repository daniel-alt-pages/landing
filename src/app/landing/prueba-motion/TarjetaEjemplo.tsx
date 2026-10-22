/**
 * Tarjeta de ejemplo (componente de servidor, sin JS).
 * T-M2/T-M3: el botón de carrito y el drawer se montan aparte; la tarjeta expone
 * `data-pm-card` y la zona `.pm-card-actions` como punto de enganche.
 */
export function TarjetaEjemplo({ id, titulo, precio, indice }: { id: string; titulo: string; precio: string; indice: number }) {
  return (
    <li className="pm-item" style={{ ['--pm-i' as string]: Math.min(indice, 5) }}>
      <a className="pm-card" href={`#${id}`} id={id} data-pm-card={id} aria-label={`${titulo}, precio ${precio}`}>
        <span className="pm-badge">EJEMPLO</span>
        <span className="pm-title">{titulo}</span>
        <span className="pm-note">Tarjeta de prueba</span>
        <span className="pm-card-actions">
          <span className="pm-price">{precio}</span>
          <svg className="pm-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </a>
    </li>
  );
}
