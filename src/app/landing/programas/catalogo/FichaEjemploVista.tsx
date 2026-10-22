'use client';

import { coverForKind, type TiendaConfig } from '../../_lib/tienda';
import type { FichaEjemplo } from '../../_contenido/tienda-ejemplo-fichas';
import { kindLabel, priceLabel, type CatalogItem } from './catalogUi';

function Estrellas({ valor, size = 16 }: { valor: number; size?: number }) {
  const label = `${valor.toLocaleString('es-CO')} de 5 estrellas`;
  return (
    <span className="ag-fx-stars" role="img" aria-label={label} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden className={valor >= n - 0.25 ? 'on' : valor >= n - 0.75 ? 'half' : ''}>★</span>
      ))}
    </span>
  );
}

function payLine(config: TiendaConfig) {
  const pays = [
    config.bold !== false ? 'Tarjeta, PSE y Nequi con Bold' : '',
    config.transfer !== false ? 'Transferencia' : '',
    config.allowInstallments ? 'Pago en cuotas' : '',
  ].filter(Boolean);
  return pays.join(' · ');
}

const Ejemplo = () => <span className="ag-fx-tag">Ejemplo ilustrativo</span>;

type Props = { item: CatalogItem; ficha: FichaEjemplo; config: TiendaConfig; inCart: boolean; onAdd: (item: CatalogItem) => void };

export function FichaEjemploVista({ item, ficha, config, inCart, onAdd }: Props) {
  const cover = item.catalog?.coverUrl || coverForKind(item.catalog?.kind);
  const total = ficha.distribucion.reduce((a, b) => a + b, 0) || 1;
  const pays = payLine(config);
  return (
    <article className="ag-fx" aria-labelledby="ag-fx-title">
      <div className="ag-fx-main">
        <figure className="ag-fx-card ag-fx-gallery">
          <img src={cover} alt={`Imagen de ejemplo de ${item.title}`} />
          <figcaption><Ejemplo /></figcaption>
        </figure>

        <aside className="ag-fx-card ag-fx-buy" aria-label="Compra">
          <p className="ag-fx-kind">{kindLabel(item.catalog?.kind)} · <Ejemplo /></p>
          <h1 id="ag-fx-title">{item.title}</h1>
          <a className="ag-fx-rating" href="#opiniones">
            <Estrellas valor={ficha.promedio} />
            <span>{ficha.promedio.toLocaleString('es-CO')} ({ficha.totalOpiniones} opiniones de ejemplo)</span>
          </a>
          <p className="ag-fx-price">{priceLabel(item.priceCop)}</p>
          <p className="ag-mk-badge">EJEMPLO</p>
          {pays ? <p className="ag-fx-pays">Medios de pago: {pays}</p> : null}
          <button type="button" className="ag-store-primary" disabled title="Producto de ejemplo. No está a la venta.">Inscribirme</button>
          <button type="button" className="ag-store-secondary" disabled={inCart} onClick={() => onAdd(item)}>
            {inCart ? 'En el carrito' : 'Agregar al carrito'}
          </button>
          <p className="ag-fx-note">Este producto es de ejemplo y no está a la venta.</p>
        </aside>

        <section className="ag-fx-card ag-fx-block" aria-labelledby="fx-desc">
          <h2 id="fx-desc">Descripción</h2>
          {ficha.descripcion.map((p) => <p key={p}>{p}</p>)}
        </section>

        <section className="ag-fx-card ag-fx-block" aria-labelledby="fx-inc">
          <h2 id="fx-inc">Qué incluye</h2>
          <ul className="ag-fx-list">{ficha.incluye.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>

        <section className="ag-fx-card ag-fx-block" aria-labelledby="fx-det">
          <h2 id="fx-det">Características del programa</h2>
          <table className="ag-fx-table">
            <tbody>
              {ficha.detalles.map((d) => (
                <tr key={d.label}><th scope="row">{d.label}</th><td>{d.value}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="opiniones" className="ag-fx-card ag-fx-block" aria-labelledby="fx-op">
          <h2 id="fx-op">Opiniones del programa <Ejemplo /></h2>
          <div className="ag-fx-summary">
            <div className="ag-fx-avg">
              <p className="ag-fx-avg-num">{ficha.promedio.toLocaleString('es-CO')}</p>
              <Estrellas valor={ficha.promedio} size={20} />
              <p className="ag-fx-muted">{ficha.totalOpiniones} calificaciones</p>
            </div>
            <ul className="ag-fx-bars" aria-label="Distribución de calificaciones">
              {ficha.distribucion.map((n, i) => (
                <li key={i}>
                  <span>{5 - i} ★</span>
                  <span className="ag-fx-bar" aria-hidden><span style={{ width: `${(n / total) * 100}%` }} /></span>
                  <span className="ag-fx-muted">{n}</span>
                  <span className="ag-fx-sr">{`${n} opiniones de ${5 - i} estrellas`}</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className="ag-fx-reviews">
            {ficha.resenas.map((r) => (
              <li key={r.nombre}>
                <Estrellas valor={r.estrellas} size={14} />
                <p className="ag-fx-review-meta"><strong>{r.nombre}</strong> · {r.fecha}</p>
                <p>{r.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="ag-fx-card ag-fx-block" aria-labelledby="fx-qa">
          <h2 id="fx-qa">Preguntas y respuestas <Ejemplo /></h2>
          <dl className="ag-fx-qa">
            {ficha.preguntas.map((q) => (
              <div key={q.q}><dt>{q.q}</dt><dd>{q.a}</dd></div>
            ))}
          </dl>
        </section>
      </div>
    </article>
  );
}
