'use client';

import { useState } from 'react';

import { coverForKind, type TiendaConfig } from '../../_lib/tienda';
import type { FichaPrograma as FichaEjemplo } from '../../_datos/tienda';
import { AddToCartButton } from '../../_componentes/bits/AddToCartButton';
import { ResumenModal } from '../../_componentes/bits/ResumenModal';
import { Avatar } from '../../_componentes/bits/Avatar';
import { DejaOpinion } from './DejaOpinion';
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
  const fotos = Array.from(new Set([cover, '/landing/productos/simulacro.jpg', '/landing/productos/curso.jpg', coverForKind('programa')]));
  const [foto, setFoto] = useState(0);
  const [utiles, setUtiles] = useState<Record<number, boolean>>({});
  return (
    <article className="ag-fx" aria-labelledby="ag-fx-title">
      <div className="ag-fx-top">
        <div className="ag-fx-main-col">
        <figure className="ag-fx-card ag-fx-gallery">
          <div className="ag-fx-gallery-in">
            <ul className="ag-fx-thumbs" aria-label="Imágenes del programa">
              {fotos.map((src, i) => (
                <li key={src}>
                  <button type="button" aria-label={`Ver imagen ${i + 1} de ${fotos.length}`} aria-pressed={foto === i} onClick={() => setFoto(i)}>
                    <img src={src} alt="" />
                  </button>
                </li>
              ))}
            </ul>
            <img className="ag-fx-hero" src={fotos[foto]} alt={`Imagen de ejemplo ${foto + 1} de ${item.title}`} />
          </div>
          <figcaption><Ejemplo /></figcaption>
        </figure>
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

        <section className="ag-fx-card ag-fx-block" aria-labelledby="fx-desc">
          <h2 id="fx-desc">Descripción</h2>
          {ficha.descripcion.map((p) => <p key={p}>{p}</p>)}
        </section>

        <section className="ag-fx-card ag-fx-block" aria-labelledby="fx-inc">
          <h2 id="fx-inc">Qué incluye</h2>
          <ul className="ag-fx-list">{ficha.incluye.map((t) => <li key={t}>{t}</li>)}</ul>
          <ResumenModal titulo={`Resumen de ${item.title}`} puntos={[
            ...ficha.detalles.map((d) => ({ titulo: d.label, texto: `: ${d.value}` })),
            { titulo: 'Incluye', texto: `: ${ficha.incluye.join(', ')}.` },
          ]} />
        </section>
          <section className="ag-fx-card ag-fx-side" aria-labelledby="fx-garantias">
            <h2 id="fx-garantias">Garantías y datos clave <Ejemplo /></h2>
            <ul className="ag-fx-list">
              <li>Clases grabadas si no puede asistir en vivo.</li>
              <li>Informe de resultados después de cada simulacro.</li>
              <li>Soporte por WhatsApp durante todo el programa.</li>
            </ul>
          </section>


        </div>

      <div className="ag-fx-side-col">
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
          <p className="ag-fx-stock"><strong>Cupos disponibles</strong> · quedan 12 (ejemplo)</p>
          <button type="button" className="ag-store-primary" disabled title="Producto de ejemplo. No está a la venta.">Inscribirme</button>
          <AddToCartButton className="ag-store-secondary" disabled={inCart} onAdd={() => onAdd(item)}>
            {inCart ? 'En el carrito' : 'Agregar al carrito'}
          </AddToCartButton>
          <p className="ag-fx-note">Este producto es de ejemplo y no está a la venta.</p>
          {(() => {
            // Solo lo que no repite la tabla «Características del programa».
            const enTabla = ficha.detalles.map((d) => `${d.label} ${d.value}`.toLowerCase());
            const extra = ficha.incluye.slice(0, 2).filter((t) => !enTabla.some((x) => x.includes(t.toLowerCase())));
            return extra.length ? (
              <>
                <h2 className="ag-fx-know">Lo que tiene que saber de este programa</h2>
                <ul className="ag-fx-list">{extra.map((t) => <li key={t}>{t}.</li>)}</ul>
              </>
            ) : null;
          })()}
        </aside>
          <section className="ag-fx-card ag-fx-side" aria-labelledby="fx-acceso">
            <h2 id="fx-acceso">Cómo accede <Ejemplo /></h2>
            <ul className="ag-fx-list">
              <li>Acceso inmediato a su panel de estudiante al confirmar el pago.</li>
              <li>Clases en vivo, simulacros e informes por área en el mismo panel.</li>
              <li>Modalidad: {ficha.detalles.find((d) => d.label === 'Modalidad')?.value || 'Virtual'}.</li>
              <li>Duración: {ficha.detalles.find((d) => d.label === 'Duración')?.value || '—'}.</li>
              <li>Inicio: 3 de noviembre de 2026.</li>
            </ul>
          </section>
          <section className="ag-fx-card ag-fx-side" aria-labelledby="fx-vende">
            <h2 id="fx-vende">Quién lo dicta <Ejemplo /></h2>
            <p><strong>SEAMOSGENIOS</strong> · Preparación Saber 11</p>
            <ul className="ag-fx-list">
              <li>Tutores por área con seguimiento semanal.</li>
              <li>+2.000 estudiantes acompañados (dato de ejemplo).</li>
              <li>Atención por WhatsApp de lunes a sábado.</li>
              <li>Responde en menos de 24 horas.</li>
            </ul>
          </section>
          <section className="ag-fx-card ag-fx-side" aria-labelledby="fx-pagos">
            <h2 id="fx-pagos">Medios de pago</h2>
            <ul className="ag-fx-paychips">
              {config.bold !== false ? ['Tarjeta', 'PSE', 'Nequi', 'Bancolombia'].map((m) => <li key={m}>{m}</li>) : null}
              {config.transfer !== false ? <li>Transferencia</li> : null}
            </ul>
            {config.bold !== false ? <p className="ag-fx-note">Pagos procesados con Bold.</p> : null}
          </section>
        </div>
      </div>

      <div className="ag-fx-bottom">

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
            {ficha.resenas.map((r, i) => (
              <li key={r.nombre}>
                <Estrellas valor={r.estrellas} size={14} />
                <div className="ag-fx-review-head">
                  <Avatar name={r.nombre} src={r.foto} alt={`Avatar ilustrado de ${r.nombre} (ejemplo)`} />
                  <p className="ag-fx-review-meta"><strong>{r.nombre} (ejemplo)</strong> · {r.fecha}</p>
                </div>
                <p>{r.texto}</p>
                <button type="button" className="ag-fx-useful" aria-pressed={Boolean(utiles[i])} onClick={() => setUtiles((u) => ({ ...u, [i]: !u[i] }))}>
                  Es útil · {(r.utiles ?? 0) + (utiles[i] ? 1 : 0)}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <DejaOpinion programaId={item.id} />

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
