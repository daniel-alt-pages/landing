'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { B2B_NAV } from '../../../_contenido/b2b/modelo';

export function SubnavB2b() {
  const [visible, setVisible] = useState(false);
  const [activo, setActivo] = useState<(typeof B2B_NAV)[number]['id']>(B2B_NAV[0].id);
  const reducir = useReducedMotion();

  useEffect(() => {
    const portada = document.getElementById('portada');
    const portadaObs = new IntersectionObserver(([entrada]) => {
      setVisible(!entrada?.isIntersecting);
    }, { threshold: 0.15 });
    if (portada) portadaObs.observe(portada);

    const marcar = () => {
      const linea = 140;
      let actual: (typeof B2B_NAV)[number]['id'] = B2B_NAV[0].id;
      for (const item of B2B_NAV) {
        const nodo = document.getElementById(item.id);
        if (nodo && nodo.getBoundingClientRect().top <= linea) actual = item.id;
      }
      setActivo(actual);
    };
    let cuadro = 0;
    const alScroll = () => {
      marcar();
      window.cancelAnimationFrame(cuadro);
      cuadro = window.requestAnimationFrame(marcar);
    };
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('scrollend', marcar);
    window.addEventListener('hashchange', marcar);
    const tarde = window.setTimeout(marcar, 80);
    return () => {
      portadaObs.disconnect();
      window.cancelAnimationFrame(cuadro);
      window.removeEventListener('scroll', alScroll);
      window.removeEventListener('scrollend', marcar);
      window.removeEventListener('hashchange', marcar);
      window.clearTimeout(tarde);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const fila = document.querySelector('.ag-b2b-subnav-row');
    const enlace = fila?.querySelector<HTMLElement>('a[aria-current="true"]');
    if (!fila || !enlace) return;
    const izquierda = enlace.offsetLeft - fila.clientWidth / 2 + enlace.clientWidth / 2;
    fila.scrollTo({ left: Math.max(0, izquierda) });
  }, [activo, visible]);

  return (
    <nav className={visible ? 'ag-b2b-subnav is-on' : 'ag-b2b-subnav'} data-activo={activo} aria-label="Secciones del portafolio">
      <div className="ag-wrap ag-b2b-subnav-row">
        {B2B_NAV.map((item) => {
          const esCta = item.id === 'agendar';
          const marcado = activo === item.id;
          return (
            <a key={item.id} href={item.href} aria-current={marcado ? 'true' : undefined} className={esCta ? 'is-cta' : undefined}>
              {item.label}
              {marcado && !esCta && !reducir ? <motion.span layoutId="b2b-spy" className="ag-b2b-spy" /> : null}
              {marcado && !esCta && reducir ? <span className="ag-b2b-spy" /> : null}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
