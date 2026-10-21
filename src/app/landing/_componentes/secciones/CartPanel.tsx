'use client';

import Link from 'next/link';
import { ShoppingBag, X } from 'lucide-react';
import { clearCart, removeFromCart, type CartItem } from '../../_lib/carrito';
import { payHref } from '../../programas/catalogo/catalogUi';
import { formatCop } from '@/bridge/catalogFilter';

type Props = {
  items: CartItem[];
  /** Precios vigentes en Comercio, por id de producto. */
  prices: Record<string, number>;
  catalogReady: boolean;
  onClose: () => void;
};

function linePrice(item: CartItem, prices: Record<string, number>) {
  return Object.prototype.hasOwnProperty.call(prices, item.id) ? prices[item.id] : item.priceCop;
}

function onSale(item: CartItem, prices: Record<string, number>, catalogReady: boolean) {
  if (!catalogReady) return true;
  return Object.prototype.hasOwnProperty.call(prices, item.id);
}

function money(value: number) {
  return value > 0 ? formatCop(value) : 'Gratis';
}

export function CartPanel({ items, prices, catalogReady, onClose }: Props) {
  const payable = items.filter((item) => onSale(item, prices, catalogReady));
  const total = payable.reduce((sum, item) => sum + linePrice(item, prices), 0);
  return (
    <div className="ag-cart" id="ag-cart">
      <div className="ag-cart-panel" role="dialog" aria-label="Carrito">
        <div className="ag-cart-head">
          <p className="ag-cart-title">
            Carrito
            {items.length ? <span>{items.length}</span> : null}
          </p>
          <button type="button" className="ag-cart-close" aria-label="Cerrar carrito" onClick={onClose}>
            <X size={16} aria-hidden />
          </button>
        </div>
        {items.length ? (
          <ul>
            {items.map((item) => {
              const sale = onSale(item, prices, catalogReady);
              const amount = linePrice(item, prices);
              return (
                <li key={item.id}>
                  <div className="ag-cart-line">
                    <strong>{item.title}</strong>
                    <span>{sale ? money(amount) : 'Ya no está a la venta'}</span>
                  </div>
                  <div className="ag-cart-actions">
                    {sale && payHref(item) ? <a href={payHref(item)}>Pagar</a> : (
                      <span className="ag-cart-unavailable">No se puede pagar</span>
                    )}
                    <button type="button" onClick={() => removeFromCart(item.id)}>Quitar</button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="ag-cart-empty">
            <span className="ag-cart-empty-mark" aria-hidden>
              <ShoppingBag size={18} />
            </span>
            <p>Todavía no hay programas.</p>
            <p>Elige uno en la tienda. Queda aquí hasta que lo pagues.</p>
          </div>
        )}
        {payable.length ? (
          <>
            <p className="ag-cart-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </p>
            <p className="ag-cart-note">Cada programa se paga por separado.</p>
          </>
        ) : items.length ? (
          <p className="ag-cart-note">Quítalos y elige un producto de la tienda.</p>
        ) : null}
        <div className="ag-cart-foot">
          {items.length ? (
            <button type="button" className="ag-cart-clear" onClick={() => clearCart()}>
              Vaciar carrito
            </button>
          ) : null}
          <Link className="ag-cart-follow" href="/landing/programas" onClick={onClose}>
            {items.length ? 'Seguir viendo la tienda' : 'Ver la tienda'}
          </Link>
        </div>
      </div>
    </div>
  );
}
