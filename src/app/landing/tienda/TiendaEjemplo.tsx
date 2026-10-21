'use client';

import { motion, useReducedMotion } from 'motion/react';
import { PRODUCTOS_EJEMPLO, formatoCop } from '../_contenido/tienda-local';

export function TiendaEjemplo() {
  const reduce = useReducedMotion();
  return (
    <section className="te-wrap" aria-labelledby="te-title">
      <header className="te-head">
        <p className="te-eyebrow">Tienda</p>
        <h1 id="te-title">Programas de preparación Saber 11</h1>
        <p className="te-lead">Simulacros, cursos y material para preparar la prueba. Precios en pesos colombianos (COP).</p>
        <p className="te-note" role="note">Productos de ejemplo · no están a la venta</p>
      </header>
      <ul className="te-grid">
        {PRODUCTOS_EJEMPLO.map((p, i) => (
          <motion.li
            key={p.id}
            className="te-card"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="te-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imagen} alt="" loading="lazy" />
              <span className="te-badge">Ejemplo</span>
            </div>
            <div className="te-body">
              <p className="te-cat">{p.categoria}</p>
              <h2>{p.nombre}</h2>
              <p className="te-desc">{p.descripcion}</p>
              <ul className="te-inc">{p.incluye.map((x) => <li key={x}>{x}</li>)}</ul>
              <p className="te-price"><strong>{formatoCop(p.precioCop)}</strong> <span>COP</span></p>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
