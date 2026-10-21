import { MotionIn } from '../primitivas/MotionIn';
import { HeroAlianzas } from './HeroAlianzas';

/** Sección propia para la pantalla de alianzas (antes en la columna derecha del hero). */
export function AlianzasSection() {
  return (
    <section id="alianzas" className="ag-section ag-alianzas-sec" aria-label="Alianzas">
      <div className="ag-wrap">
        <MotionIn delay={40} className="ag-alianzas-sec-body">
          <HeroAlianzas />
        </MotionIn>
      </div>
    </section>
  );
}
