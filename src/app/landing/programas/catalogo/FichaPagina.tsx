'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { programasUrl, tiendaLandingUrl } from '../../_contenido/contacto';
import { addToCart, readCart, subscribeCart } from '../../_lib/carrito';
import { volarAlCarrito } from '../../_lib/volarAlCarrito';
import { coverForKind, storeFromCommerce, type TiendaConfig, type TiendaProduct } from '../../_lib/tienda';
import type { CatalogItem } from './catalogUi';
import { ProductOffer } from './ProductOffer';
import { FichaEjemploVista } from './FichaEjemploVista';
import { fuenteTienda } from '../../_datos/tienda';

export function FichaPagina({ id }: { id: string }) {
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [missing, setMissing] = useState(false);
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    const sync = () => setInCart(readCart().some((row) => row.id === id));
    sync();
    return subscribeCart(sync);
  }, [id]);

  const fuente = fuenteTienda();
  const ejemplo = fuente.ficha(id);
  const catalogoLocal = fuente.catalogo();
  const ejemploItem = ejemplo ? storeFromCommerce(catalogoLocal.products).find((row) => row.id === id) || null : null;

  useEffect(() => {
    if (ejemplo) return undefined;
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
  }, [id, ejemplo]);

  const add = (next: CatalogItem) => {
    addToCart({ id: next.id, title: next.title, priceCop: next.priceCop || 0, productId: next.commerce?.productId, aulaId: next.commerce?.aulaId, image: next.catalog?.coverUrl || coverForKind(next.catalog?.kind) });
    volarAlCarrito(next.catalog?.coverUrl || coverForKind(next.catalog?.kind));
  };

  if (ejemplo && ejemploItem) {
    return (
      <section className="ag-section ag-store ag-mk">
        <div className="ag-wrap">
          <p className="ag-mk-kicker"><Link href="/landing/programas">Tienda</Link> › {ejemploItem.title}</p>
          <FichaEjemploVista item={ejemploItem} ficha={ejemplo} config={catalogoLocal.config} inCart={inCart} onAdd={add} />
        </div>
      </section>
    );
  }

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
