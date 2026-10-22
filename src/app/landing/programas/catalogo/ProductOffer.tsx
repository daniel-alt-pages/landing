'use client';

import type { ReactNode } from 'react';
import { Calendar, Clock } from 'lucide-react';
import {
  accountHref,
  includeColumns,
  kindLabel,
  payHref,
  priceLabel,
  rowLabel,
  seatsLabel,
  type CatalogItem,
  type CatalogRow,
} from './catalogUi';
import { fichaOfItem } from './fichaLegacy';
import { FichaRender } from './FichaRender';
import { Marks } from './marks';

type Props = {
  item: CatalogItem;
  inCart: boolean;
  onAdd: (item: CatalogItem) => void;
  page?: boolean;
  close?: ReactNode;
};

function ModuleGrid({ rows }: { rows: CatalogRow[] }) {
  const labels = rows.map(rowLabel).filter(Boolean);
  if (!labels.length) return null;
  const columns = includeColumns(labels.length);
  return (
    <ul
      className={columns ? 'ag-store-pills ag-store-pills-grid' : 'ag-store-pills'}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {labels.map((label, index) => <li key={`${index}-${label}`}><Marks text={label} /></li>)}
    </ul>
  );
}

export function ProductOffer({ item, inCart, onAdd, page, close }: Props) {
  const ficha = fichaOfItem(item);
  const catalog = item.catalog || {};
  const full = Boolean(item.seatsFull);
  const pay = payHref(item);
  const hasIntro = ficha.blocks.some((block) => block.type === 'intro' && (block.title || block.body));
  const hasIncluye = ficha.blocks.some((block) => block.type === 'incluye' && (block.items || []).length);
  const buy = (
    <div className="ag-offer-buy">
      <div className="ag-price-pair">
        <p className="ag-store-price-line">{priceLabel(item.priceCop)}</p>
      </div>
      {item.badge ? <p className="ag-mk-badge">{item.badge}</p> : null}
      <p className="ag-store-seat-line">{seatsLabel(item)}</p>
      <div className="ag-store-actions">
        {full || !pay ? (
          <button type="button" className="ag-store-primary" disabled>{full ? 'Sin cupos' : 'Aún no se puede pagar'}</button>
        ) : (
          <a className="ag-store-primary" href={pay}>Inscribirme</a>
        )}
        <button type="button" className="ag-store-secondary" disabled={full || inCart} onClick={() => onAdd(item)}>
          {inCart ? 'En el carrito' : 'Agregar al carrito'}
        </button>
        <a className="ag-store-account" href={accountHref(item.commerce?.aulaId || item.id)}>Ya tengo cuenta</a>
      </div>
    </div>
  );
  const body = (
    <div className="ag-store-sheet-body">
      {close}
      <p className="ag-store-kind">{kindLabel(catalog.kind)}</p>
      <h2 id="ag-store-sheet-title">{item.title}</h2>
      {page ? null : <a className="ag-offer-full" href={`/landing/programas/ficha/${item.id}`}>Ver ficha completa</a>}
      {!hasIntro && item.description ? <p className="ag-offer-lead">{item.description}</p> : null}
      <FichaRender ficha={ficha} />
      {catalog.tagline && item.description ? <p className="ag-store-tagline">{catalog.tagline}</p> : null}
      {catalog.durationLabel || catalog.startsLabel ? (
        <p className="ag-store-meta">
          {catalog.durationLabel ? <span><Clock size={14} aria-hidden /> {catalog.durationLabel}</span> : null}
          {catalog.startsLabel ? <span><Calendar size={14} aria-hidden /> {catalog.startsLabel}</span> : null}
        </p>
      ) : null}
      {!hasIncluye && (item.includes || []).length ? (
        <div className="ag-store-includes-block">
          <p className="ag-store-filter-label">Qué incluye</p>
          <ModuleGrid rows={item.includes || []} />
        </div>
      ) : null}
      {(catalog.highlights || []).length ? <ModuleGrid rows={catalog.highlights || []} /> : null}
      {(item.addons || []).length ? (
        <div className="ag-store-addon">
          <p className="ag-store-filter-label">También puedes sumar</p>
          <ul className="ag-store-pills">
            {(item.addons || []).map((row) => (
              <li key={row.key}>{`${row.label} ${priceLabel(row.priceCop)}`}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
  if (page) {
    return (
      <article className="ag-offer-page">
        {body}
        {buy}
      </article>
    );
  }
  return (
    <>
      {body}
      {buy}
    </>
  );
}
