'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { clearCart, removeFromCart, setCartQty, type CartItem } from '../../_lib/carrito';
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

const EASE = [0.16, 1, 0.3, 1] as const;

export function CartPanel({ items, prices, catalogReady, onClose }: Props) {
  const reduce = useReducedMotion();
  const payable = items.filter((item) => onSale(item, prices, catalogReady));
  const units = items.reduce((sum, item) => sum + (item.qty || 1), 0);
  const total = payable.reduce((sum, item) => sum + linePrice(item, prices) * (item.qty || 1), 0);
  const firstPay = payable.map((item) => payHref(item)).find(Boolean) || '';
  return (
    <div className="ag-cart" id="ag-cart">
      <motion.div
        className="ag-cart-panel ag-cx"
        role="dialog"
        aria-label="Carrito"
        initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: EASE }}
      >
        <div className="ag-cart-head">
          <p className="ag-cart-title">
            Carrito
            {units ? <span>{units}</span> : null}
          </p>
          <button type="button" className="ag-cart-close" aria-label="Cerrar carrito" onClick={onClose}>
            <X size={16} aria-hidden />
          </button>
        </div>
        {items.length ? (
          <ul className="ag-cx-list">
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const sale = onSale(item, prices, catalogReady);
                const amount = linePrice(item, prices);
                const qty = item.qty || 1;
                return (
                  <motion.li
                    key={item.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.24, ease: EASE }}
                    className="ag-cx-item"
                  >
                    <span className="ag-cx-thumb">
                      {item.image ? <img src={item.image} alt="" loading="lazy" /> : <ShoppingBag size={18} aria-hidden />}
                    </span>
                    <div className="ag-cx-info">
                      <strong>{item.title}</strong>
                      <span className="ag-cx-price">{sale ? money(amount * qty) : 'Ya no está a la venta'}</span>
                      {qty > 1 && sale ? <span className="ag-cx-unit">{money(amount)} c/u</span> : null}
                      <div className="ag-cx-row">
                        <div className="ag-cx-qty" role="group" aria-label={`Cantidad de ${item.title}`}>
                          <button type="button" aria-label="Quitar uno" disabled={qty <= 1} onClick={() => setCartQty(item.id, qty - 1)}><Minus size={14} aria-hidden /></button>
                          <motion.output key={qty} aria-live="polite" initial={reduce ? false : { y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{qty}</motion.output>
                          <button type="button" aria-label="Agregar uno" disabled={qty >= 10} onClick={() => setCartQty(item.id, qty + 1)}><Plus size={14} aria-hidden /></button>
                        </div>
                        {sale && payHref(item) ? <a className="ag-cx-pay" href={payHref(item)}>Pagar</a> : (
                          <span className="ag-cart-unavailable">No se puede pagar</span>
                        )}
                        <button type="button" className="ag-cx-remove" aria-label={`Quitar ${item.title}`} onClick={() => removeFromCart(item.id)}>
                          <Trash2 size={15} aria-hidden />
                        </button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="ag-cart-empty ag-cx-empty">
            <span className="ag-cart-empty-mark" aria-hidden>
              <ShoppingBag size={22} />
            </span>
            <p>Su carrito está vacío.</p>
            <p>Elija un programa en la tienda. Queda aquí hasta que lo pague.</p>
          </div>
        )}
        {payable.length ? (
          <div className="ag-cx-sum">
            <p><span>Subtotal ({units} {units === 1 ? 'programa' : 'programas'})</span><span>{money(total)}</span></p>
            <p className="ag-cx-total"><span>Total</span><strong>{money(total)}</strong></p>
            <p className="ag-cart-note">Cada programa se paga por separado.</p>
          </div>
        ) : items.length ? (
          <p className="ag-cart-note">Quítelos y elija un producto de la tienda.</p>
        ) : null}
        <div className="ag-cx-foot">
          {items.length ? (
            firstPay ? (
              <a className="ag-store-primary ag-cx-go" href={firstPay}>Continuar</a>
            ) : (
              <button type="button" className="ag-store-primary ag-cx-go" disabled>Aún no se puede pagar</button>
            )
          ) : null}
          <Link className="ag-store-secondary ag-cx-go" href="/landing/programas" onClick={onClose}>
            {items.length ? 'Seguir viendo' : 'Ver la tienda'}
          </Link>
          {items.length ? (
            <button type="button" className="ag-cart-clear ag-cx-clear" onClick={() => clearCart()}>
              Vaciar carrito
            </button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
