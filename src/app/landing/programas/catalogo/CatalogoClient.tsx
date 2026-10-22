'use client';

import { useEffect, useState } from 'react';
import { CONTACTO } from '../../_contenido/contacto';
import { buildWaUrl, WA_TEXT } from '../../_lib/whatsapp';
import { addToCart, readCart, requestCartOpen, subscribeCart, type CartItem } from '../../_lib/carrito';
import { CatalogFilters } from './CatalogFilters';
import { ProgramDetail } from './ProgramDetail';
import { ProgramShelf } from './ProgramShelf';
import { volarAlCarrito } from '../../_lib/volarAlCarrito';
import { coverForKind } from '../../_lib/tienda';
import { useCatalogQuery } from './useCatalogQuery';
import { StorefrontBanner } from '../../_componentes/secciones/StorefrontBanner';
import BlurText from '../../_componentes/bits/BlurText';
import FadeContent from '../../_componentes/bits/FadeContent';
import type { CatalogItem } from './catalogUi';

const WA_COTIZACION = 'Hola, quisiera solicitar una cotización de los programas de SEAMOSGENIOS.';

const FAQ = [
  {
    q: '¿Con qué se paga?',
    a: 'Con Bold: tarjeta, PSE, Nequi o Bancolombia. El cobro es de un programa a la vez.',
  },
  {
    q: '¿Hay factura?',
    a: 'Sí. Al aprobar el pago se emite la factura electrónica a nombre de quien pagó.',
  },
  {
    q: '¿Qué pasa después de pagar?',
    a: 'Si aún no tienes cuenta, recibes un código SGA y con él creas la tuya. Si ya tienes cuenta, el programa queda en ella y entras al aula sin copiar el código.',
  },
];

function resultsLabel(count: number) {
  return count === 1 ? '1 resultado' : `${count} resultados`;
}

export function CatalogoClient() {
  const catalog = useCatalogQuery();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState(0);
  const [orden, setOrden] = useState('');
  const [tope, setTope] = useState(0);
  const wa = buildWaUrl(CONTACTO.whatsappEstudiantes, WA_TEXT.estudiantes);
  const waCotizacion = buildWaUrl(CONTACTO.whatsappEstudiantes, WA_COTIZACION);
  const ready = !catalog.loading && !catalog.error;
  const resume = catalog.resume;
  const cartIds = cart.map((row) => row.id);

  useEffect(() => {
    const sync = () => setCart(readCart());
    sync();
    return subscribeCart(sync);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(0), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const shown = catalog.items
    .filter((row) => !tope || (Number(row.priceCop) || 0) <= tope)
    .sort((a, b) => (orden === 'asc' ? 1 : orden === 'desc' ? -1 : 0) * ((Number(a.priceCop) || 0) - (Number(b.priceCop) || 0)));

  function addItem(item: CatalogItem) {
    if (item.seatsFull) return;
    addToCart({
      id: item.id,
      title: item.title,
      priceCop: item.priceCop || 0,
      productId: item.commerce?.productId,
      aulaId: item.commerce?.aulaId,
      image: item.catalog?.coverUrl || coverForKind(item.catalog?.kind),
    });
    volarAlCarrito(item.catalog?.coverUrl || coverForKind(item.catalog?.kind));
  }

  return (
    <section className="ag-section ag-store ag-mk" aria-busy={catalog.loading}>
      <StorefrontBanner />
      <div className="ag-wrap">
        <nav className="ag-mk-crumbs" aria-label="Ruta de navegación">
          <ol>
            <li><a href="/landing">Inicio</a></li>
            <li aria-current="page">Tienda</li>
          </ol>
        </nav>
        <header className="ag-mk-head">
          <p className="ag-mk-kicker">Tienda</p>
          <h1>
            <BlurText
              as="span"
              align="start"
              className="ag-blur-line"
              text={catalog.config?.heroTitle || 'Tienda'}
              delay={60}
              stepDuration={0.3}
              blur={8}
              distance={14}
            />
          </h1>
          {catalog.config?.heroSubtitle ? <p>{catalog.config.heroSubtitle}</p> : null}
          {resume ? (
            <button type="button" className="ag-store-resume" onClick={() => catalog.openProgram(resume.id)}>
              Seguir con {resume.title}
            </button>
          ) : null}
        </header>

        {ready && catalog.all.length ? (
          <div className="ag-mk-toolbar">
            <CatalogFilters
              all={catalog.all}
              kind={catalog.kind}
              need={catalog.need}
              needs={catalog.needs}
              onKind={catalog.setKind}
              onNeed={catalog.setNeed}
            />
            <div className="ag-mk-bar">
              <p>{resultsLabel(shown.length)}</p>
              <label className="ag-mk-sort">
                <span>Precio</span>
                <select value={tope} onChange={(e) => setTope(Number(e.target.value))}>
                  <option value={0}>Todos</option>
                  <option value={100000}>Hasta $ 100.000</option>
                  <option value={200000}>Hasta $ 200.000</option>
                </select>
              </label>
              <label className="ag-mk-sort">
                <span>Ordenar por</span>
                <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                  <option value="">Más relevantes</option>
                  <option value="asc">Menor precio</option>
                  <option value="desc">Mayor precio</option>
                </select>
              </label>
              {catalog.filtered ? (
                <button type="button" onClick={catalog.clearFilters}>Quitar filtros</button>
              ) : null}
            </div>
          </div>
        ) : null}

        <FadeContent blur duration={0.8} className="ag-mk-main">
            {catalog.loading ? (
              <ul className="ag-mk-grid" aria-hidden>
                {[0, 1, 2].map((key) => <li key={key} className="ag-mk-skeleton" />)}
              </ul>
            ) : null}

            {catalog.error ? (
              <div className="ag-store-status ag-store-vacia">
                <h2>Programas a su medida</h2>
                <p>Cuéntenos qué necesita y le enviamos una cotización.</p>
                <a className="ag-store-vacia-cta" href={waCotizacion} target="_blank" rel="noopener noreferrer">
                  Solicite su cotización
                </a>
              </div>
            ) : null}

            {ready && !shown.length ? (
              <div className="ag-store-status">
                <p>
                  {catalog.filtered
                    ? 'Ningún producto coincide con ese filtro.'
                    : 'Todavía no hay productos a la venta.'}
                </p>
                {catalog.filtered ? (
                  <button type="button" className="ag-store-secondary" onClick={catalog.clearFilters}>
                    Quitar filtros
                  </button>
                ) : (
                  <a href={wa}>Escríbenos por WhatsApp</a>
                )}
              </div>
            ) : null}

            {ready ? (
              <ProgramShelf items={shown} cartIds={cartIds} onOpen={catalog.openProgram} onAdd={addItem} />
            ) : null}
        </FadeContent>

        <FadeContent blur duration={0.7} delay={0.08}>
        <div className="ag-store-pay">
          <div className="ag-store-pay-head">
            <h2>Pagos</h2>
          </div>
          <div className="ag-store-pay-grid">
            {FAQ.map((row) => (
              <article key={row.q}>
                <h3>{row.q}</h3>
                <p>{row.a}</p>
              </article>
            ))}
          </div>
        </div>
        </FadeContent>
      </div>

      {catalog.open ? (
        <ProgramDetail
          item={catalog.open}
          inCart={cartIds.includes(catalog.open.id)}
          onClose={catalog.closeProgram}
          onAdd={addItem}
        />
      ) : null}

      {notice ? (
        <div className="ag-store-toast" role="status">
          <p>Añadido al carrito</p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              requestCartOpen();
            }}
          >
            Ver carrito
          </button>
        </div>
      ) : null}
    </section>
  );
}
