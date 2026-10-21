'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { programasUrl, tiendaLandingUrl } from '../../_contenido/contacto';
import { addToCart, readCart, subscribeCart } from '../../_lib/carrito';
import { storeFromCommerce, type TiendaConfig, type TiendaProduct } from '../../_lib/tienda';
import type { CatalogItem } from './catalogUi';
import { ProductOffer } from './ProductOffer';

export function FichaPagina({ id }: { id: string }) {
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [missing, setMissing] = useState(false);
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    const sync = () => setInCart(readCart().some((row) => row.id === id));
    sync();
    return subscribeCart(sync);
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    const shop = tiendaLandingUrl();
    const aulas = programasUrl();
    if (!shop || !aulas) {
      setMissing(true);
      return undefined;
    }
    Promise.all([
      fetch(shop, { signal: controller.signal }).then((res) => {
        if (!res.ok) throw new Error('tienda');
        return res.json() as Promise<{ config?: TiendaConfig; products?: TiendaProduct[] }>;
      }),
      fetch(aulas, { signal: controller.signal }).then((res) => {
        if (!res.ok) throw new Error('aulas');
        return res.json() as Promise<{ items?: CatalogItem[] }>;
      }),
    ]).then(([shopBody, aulaBody]) => {
      const found = storeFromCommerce(shopBody.products || [], aulaBody.items || []).find((row) => row.id === id);
      setItem(found || null);
      setMissing(!found);
    }).catch((err: { name?: string }) => {
      if (err?.name === 'AbortError') return;
      setMissing(true);
    });
    return () => controller.abort();
  }, [id]);

  return (
    <section className="ag-section ag-store ag-mk">
      <div className="ag-wrap">
        <p className="ag-mk-kicker">Tienda</p>
        {item ? (
          <ProductOffer
            page
            item={item}
            inCart={inCart}
            onAdd={(next) => {
              if (next.seatsFull) return;
              addToCart({
                id: next.id,
                title: next.title,
                priceCop: next.priceCop || 0,
                productId: next.commerce?.productId,
                aulaId: next.commerce?.aulaId,
              });
            }}
          />
        ) : (
          <div className="ag-offer-page-status">
            <h1>{missing ? 'Este producto no está en la tienda' : 'Abriendo la ficha'}</h1>
            <Link href="/landing/programas">Volver a programas</Link>
          </div>
        )}
      </div>
    </section>
  );
}
