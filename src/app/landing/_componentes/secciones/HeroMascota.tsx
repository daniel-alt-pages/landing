'use client';

import { motion, MotionConfig } from 'motion/react';

/**
 * Mascota del hero. Presentación tomada de factus.com.co: imagen estática con
 * drop-shadow, una sola entrada fade-in-up (20px, 800ms, ease-out) y sin
 * animación en reposo. Solo opacity/transform; el contenedor reserva su caja.
 */
export function HeroMascota() {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="ag-hero-mascota"
        aria-hidden="true"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <img
          src="/landing/mascota/mascota-480.webp"
          srcSet="/landing/mascota/mascota-480.webp 480w, /landing/mascota/mascota-1000.webp 1000w"
          sizes="(min-width: 1024px) 420px, 340px"
          width={1000}
          height={984}
          alt=""
          decoding="async"
          fetchPriority="low"
        />
      </motion.div>
    </MotionConfig>
  );
}
