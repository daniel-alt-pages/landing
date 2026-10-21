/**
 * Mascota del hero. Una sola entrada fade-in-up (20px, 800ms, ease-out) en CSS:
 * no depende de JS (antes framer-motion dejaba opacity:0 en el HTML hasta hidratar,
 * lo que retrasaba el LCP y la ocultaba sin JS). Con reduced-motion no se anima.
 */
export function HeroMascota() {
  return (
    <div className="ag-hero-mascota ag-hero-mascota-in" aria-hidden="true">
      <img
        src="/landing/mascota/mascota-480.webp"
        srcSet="/landing/mascota/mascota-480.webp 480w, /landing/mascota/mascota-1000.webp 1000w"
        sizes="(min-width: 1024px) 420px, 340px"
        width={1000}
        height={984}
        alt=""
        decoding="async"
      />
    </div>
  );
}
