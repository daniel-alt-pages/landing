import { TIENDA_EJEMPLO_PRODUCTOS, tiendaEjemploActiva } from '../../_contenido/tienda-ejemplo';

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/** Tira compacta de la tienda de ejemplo dentro del hero. Misma bandera que la vitrina: nunca en producción. */
export function HeroTiendaEjemplo() {
  if (!tiendaEjemploActiva()) return null;
  return (
    <div className="ag-hero-tienda" aria-label="Tienda (productos de ejemplo)">
      <div className="ag-hero-tienda-head">
        <span>Tienda (ejemplo)</span>
        <a className="ag-text-link" href="#tienda">Ver tienda</a>
      </div>
      <ul className="ag-hero-tienda-row">
        {TIENDA_EJEMPLO_PRODUCTOS.map((p) => (
          <li key={p.id}>
            <a href="#tienda" className="ag-hero-tienda-card">
              <span className="ag-hero-tienda-img" aria-hidden="true">{p.kind}</span>
              <span className="ag-hero-tienda-name">{p.name}</span>
              <span className="ag-hero-tienda-price">{cop.format(p.priceCop)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
