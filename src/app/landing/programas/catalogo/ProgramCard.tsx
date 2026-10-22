'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { fuenteTienda } from '../../_datos/tienda';
import { coverForKind } from '../../_lib/tienda';
import GlareHover from '../../_componentes/bits/GlareHover';
import { kindLabel, priceLabel, seatsLabel, type CatalogItem } from './catalogUi';

type Props = {
  item: CatalogItem;
  inCart: boolean;
  onAdd: (item: CatalogItem) => void;
  /** En la tienda abre el detalle; fuera de ella, el enlace lleva a la tienda. */
  onOpen?: (id: string) => void;
  href?: string;
  /** Vitrina del home: insignia sobre la imagen. */
  variant?: 'rail';
};

function Open({ item, onOpen, href, className, children }: {
  item: CatalogItem;
  onOpen?: (id: string) => void;
  href?: string;
  className: string;
  children: ReactNode;
}) {
  if (href) return <Link className={className} href={href}>{children}</Link>;
  return (
    <button type="button" className={className} onClick={() => onOpen?.(item.id)}>
      {children}
    </button>
  );
}

function discount(price: number, compare: number) {
  if (!compare || compare <= price || price <= 0) return 0;
  return Math.round((1 - price / compare) * 100);
}

export function ProgramCard({ item, inCart, onAdd, onOpen, href, variant }: Props) {
  const rail = variant === 'rail';
  const [broken, setBroken] = useState(false);
  const full = Boolean(item.seatsFull);
  const price = Number(item.priceCop) || 0;
  const compare = Number(item.comparePriceCop) || 0;
  const off = discount(price, compare);
  const cover = item.catalog?.coverUrl || coverForKind(item.catalog?.kind);
  const extra = fuenteTienda().extras(item.id);
  const addLabel = full ? 'Sin cupos' : inCart ? 'En el carrito' : 'Agregar al carrito';

  return (
    <article className="ag-mk-card" data-full={full ? 'true' : undefined} id={`ag-program-${item.id}`}>
      <GlareHover
        className="ag-mk-glare"
        borderRadius="12px"
        background="transparent"
        borderColor="transparent"
        glareColor="#cc0000"
        glareOpacity={0.22}
        mode="hover"
        rimGlint={false}
      >
        {rail && item.badge ? <span className="ag-mk-flag">{item.badge}</span> : null}
        {extra?.destacado ? <span className="ag-mk-hot">{extra.destacado}</span> : null}
        <Open item={item} onOpen={onOpen} href={href} className="ag-mk-photo">
          {broken ? (
            <span className="ag-mk-photo-label">{kindLabel(item.catalog?.kind)}</span>
          ) : (
            <img src={cover} alt="" loading="lazy" onError={() => setBroken(true)} />
          )}
        </Open>
      </GlareHover>
      <div className="ag-mk-body">
        <p className="ag-mk-kind">{kindLabel(item.catalog?.kind)}</p>
        <h3 className="ag-mk-title">
          <Open item={item} onOpen={onOpen} href={href} className="ag-mk-title-hit">{item.title}</Open>
        </h3>
        {extra ? (
          <p className="ag-mk-rating">
            <span role="img" aria-label={`${extra.promedio.toLocaleString('es-CO')} de 5 estrellas`}>
              {[1, 2, 3, 4, 5].map((n) => <span key={n} aria-hidden className={extra.promedio >= n - 0.25 ? 'on' : ''}>★</span>)}
            </span>
            <span className="ag-mk-rating-n">({extra.total})</span>
          </p>
        ) : null}
        <p className="ag-mk-meta">
          {item.badge && !rail ? <span className="ag-mk-badge">{item.badge}</span> : null}
          <span>{seatsLabel(item)}</span>
        </p>
        {<p className="ag-mk-price">
          <span>{priceLabel(price)}</span>
          {compare > price ? <s className="ag-mk-was">{priceLabel(compare)}</s> : null}
          {off ? <span className="ag-mk-offer">Oferta</span> : null}
        </p>}
        {extra ? <p className="ag-mk-free">Incluye: {extra.incluye}</p> : null}
        <div className="ag-mk-actions">
          <Open item={item} onOpen={onOpen} href={href} className="ag-mk-link">Ver programa</Open>
          <button
            type="button"
            className="ag-mk-cart"
            disabled={full || inCart}
            onClick={() => onAdd(item)}
          >
            {addLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
