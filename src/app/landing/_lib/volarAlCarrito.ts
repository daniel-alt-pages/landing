'use client';

import { requestCartOpen } from './carrito';

/**
 * «Agregar al carrito» estilo marketplace: una miniatura vuela en curva hasta el ícono
 * del carrito del header (~600 ms, solo transform/opacity), el ícono rebota y aparece
 * un aviso «Agregado al carrito · Ver carrito» por ~3 s. No abre el panel del carrito.
 * Con prefers-reduced-motion: solo el aviso.
 */
let toastTimer = 0;

function toast() {
  let node = document.getElementById('ag-fly-toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'ag-fly-toast';
    node.className = 'ag-fly-toast';
    node.setAttribute('role', 'status');
    const text = document.createElement('span');
    text.textContent = 'Agregado al carrito';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Ver carrito';
    btn.addEventListener('click', (event) => { event.stopPropagation(); node?.classList.remove('is-on'); requestCartOpen(); });
    node.append(text, btn);
    document.body.append(node);
  }
  node.classList.add('is-on');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => node?.classList.remove('is-on'), 3000);
}

export function volarAlCarrito(imageSrc?: string, from?: Element | null) {
  if (typeof window === 'undefined') return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const target = [...document.querySelectorAll<HTMLElement>('.ag-cart-btn')].find((el) => el.offsetParent !== null);
  const source = (from as HTMLElement | null) || (document.activeElement as HTMLElement | null);
  if (reduce || !target || !source || source === document.body || !imageSrc) { toast(); return; }
  const a = source.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = 56;
  const img = document.createElement('img');
  img.src = imageSrc;
  img.alt = '';
  img.className = 'ag-fly-thumb';
  img.style.left = `${a.left + a.width / 2 - size / 2}px`;
  img.style.top = `${a.top + a.height / 2 - size / 2}px`;
  document.body.append(img);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = img.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(0.8)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.2 },
  ], { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  anim.onfinish = () => {
    img.remove();
    target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
    toast();
  };
}
