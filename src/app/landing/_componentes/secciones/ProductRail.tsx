'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { programasUrl, tiendaLandingUrl } from '../../_contenido/contacto';
import { addToCart, readCart, requestCartOpen, subscribeCart, type CartItem } from '../../_lib/carrito';
import { storeFromCommerce, type TiendaConfig } from '../../_lib/tienda';
import BlurText from '../bits/BlurText';
import { ProgramCard } from '../../programas/catalogo/ProgramCard';
import type { CatalogItem } from '../../programas/catalogo/catalogUi';

function payLine(config: TiendaConfig | null) {
  if (!config) return '';
  const pays = [
    config.bold !== false ? 'Tarjeta, PSE y Nequi con Bold' : '',
    config.transfer !== false ? 'Transferencia' : '',
    config.allowInstallments ? 'Pago en cuotas' : '',
  ].filter(Boolean);
  return pays.length ? `Medios de pago: ${pays.join(' · ')}` : '';
}

/** Vitrina del inicio. Solo muestra productos activos de Comercio. */
export function ProductRail() {
  const scroller = useRef<HTMLUListElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [config, setConfig] = useState<TiendaConfig | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const shopUrl = tiendaLandingUrl();
    if (!shopUrl) return undefined;
    const aulasUrl = programasUrl();
    const controller = new AbortController();
    const load = (target: string) => fetch(target, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
    Promise.all([load(shopUrl), aulasUrl ? load(aulasUrl) : Promise.resolve(null)])
      .then(([shop, aulas]) => {
        setConfig(shop?.config || null);
        setItems(storeFromCommerce(shop?.products || [], aulas?.items || []));
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const sync = () => setCart(readCart());
    sync();
    return subscribeCart(sync);
  }, []);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return undefined;
    const measure = () => {
      const max = node.scrollWidth - node.clientWidth;
      setCanLeft(node.scrollLeft > 8);
      setCanRight(max - node.scrollLeft > 8);
    };
    measure();
    node.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      node.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [items]);

  if (!items.length) return null;

  function move(direction: number) {
    const node = scroller.current;
    if (!node) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const card = node.querySelector<HTMLElement>('li');
    const styles = getComputedStyle(node);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 16;
    const step = (card?.offsetWidth ?? 220) + gap;
    node.scrollBy({ left: direction * step, behavior: reduce ? 'auto' : 'smooth' });
  }

  function add(item: CatalogItem) {
    if (item.seatsFull) return;
    addToCart({
      id: item.id,
      title: item.title,
      priceCop: item.priceCop || 0,
      productId: item.commerce?.productId,
      aulaId: item.commerce?.aulaId,
    });
    window.setTimeout(() => requestCartOpen(), 0);
  }

  const pays = payLine(config);
  const cartIds = cart.map((row) => row.id);

  return (
    <section className="ag-section ag-mk ag-mk-home" aria-labelledby="productos-tienda">
      <div className="ag-wrap">
        <div className="ag-product-rail-head">
          <div>
            <p className="ag-eyebrow">Tienda</p>
            <h2 id="productos-tienda" className="ag-shelf-title">
              <BlurText as="span" align="start" className="ag-blur-line" text={config?.heroTitle || 'Programas a la venta'} delay={40} blur={6} distance={12} />
            </h2>
          </div>
          <a className="ag-text-link" href="/landing/programas">Ver toda la tienda</a>
        </div>
        {config?.heroSubtitle ? <p className="ag-product-rail-lead">{config.heroSubtitle}</p> : null}
        <div className="ag-product-rail-wrap">
          {canLeft ? (
            <button type="button" className="ag-product-rail-btn is-prev" aria-label="Productos anteriores" onClick={() => move(-1)}>
              <ChevronLeft size={20} aria-hidden />
            </button>
          ) : null}
          <ul className="ag-mk-rail" ref={scroller}>
            {items.map((item) => (
              <li key={item.id}>
                <ProgramCard
                  item={item}
                  inCart={cartIds.includes(item.id)}
                  onAdd={add}
                  href={`/landing/programas?programa=${encodeURIComponent(item.id)}`}
                />
              </li>
            ))}
          </ul>
          {canRight ? (
            <button type="button" className="ag-product-rail-btn is-next" aria-label="Productos siguientes" onClick={() => move(1)}>
              <ChevronRight size={20} aria-hidden />
            </button>
          ) : null}
        </div>
        {pays ? <p className="ag-footnote ag-mk-pays">{pays}</p> : null}
      </div>
    </section>
  );
}
