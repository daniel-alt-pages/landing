import { COOKIE, COOKIE_DAYS, browserCookieStore, writeCappedCookie } from './cookies';

export type CartItem = {
  id: string;
  title: string;
  priceCop: number;
  /** Id del producto en Comercio. Vacío si la línea es un aula publicada. */
  productId?: string;
  aulaId?: string;
};

const KEY = 'ag-programas-cart';
const EVENT = 'ag-programas-cart';
export const CART_OPEN_EVENT = 'ag-programas-cart-open';

export function requestCartOpen() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CART_OPEN_EVENT));
}

function parse(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((row) => row && typeof row.id === 'string' && typeof row.title === 'string')
      .map((row) => {
        const item: CartItem = {
          id: String(row.id),
          title: String(row.title),
          priceCop: Number(row.priceCop) || 0,
        };
        if (row.productId) item.productId = String(row.productId).slice(0, 80);
        if (row.aulaId) item.aulaId = String(row.aulaId).slice(0, 80);
        return item;
      });
  } catch {
    return [];
  }
}

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const cookie = browserCookieStore().read(COOKIE.cart);
  if (cookie !== null) return parse(cookie);
  return parse(window.localStorage.getItem(KEY));
}

function write(items: CartItem[]) {
  const full = JSON.stringify(items);
  window.localStorage.setItem(KEY, full);
  const slim = JSON.stringify(items.map((item) => {
    const row: CartItem = {
      id: item.id.slice(0, 80),
      title: item.title.slice(0, 80),
      priceCop: Number(item.priceCop) || 0,
    };
    if (item.productId) row.productId = item.productId.slice(0, 80);
    if (item.aulaId) row.aulaId = item.aulaId.slice(0, 80);
    return row;
  }));
  const store = browserCookieStore();
  const maxAge = COOKIE_DAYS.cart * 86400;
  if (!writeCappedCookie(store, COOKIE.cart, slim, maxAge)) store.drop(COOKIE.cart);
  window.dispatchEvent(new Event(EVENT));
}

/** Copia el carrito ya guardado a la cookie de funcionalidad, sin pedir consentimiento. */
export function mirrorCartCookie() {
  if (typeof window === 'undefined') return;
  const store = browserCookieStore();
  if (store.read(COOKIE.cart) !== null) return;
  const raw = window.localStorage.getItem(KEY);
  if (!raw || !raw.startsWith('[')) return;
  write(parse(raw));
}

export function addToCart(item: CartItem) {
  const items = readCart().filter((row) => row.id !== item.id);
  const next: CartItem = { id: item.id, title: item.title, priceCop: Number(item.priceCop) || 0 };
  if (item.productId) next.productId = item.productId;
  if (item.aulaId) next.aulaId = item.aulaId;
  items.push(next);
  write(items);
}

export function removeFromCart(id: string) {
  write(readCart().filter((row) => row.id !== id));
}

export function clearCart() {
  write([]);
}

export function subscribeCart(onChange: () => void) {
  const notify = () => onChange();
  window.addEventListener(EVENT, notify);
  window.addEventListener('storage', notify);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener('storage', notify);
  };
}
