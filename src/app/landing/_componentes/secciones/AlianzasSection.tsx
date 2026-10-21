import { MotionIn } from '../primitivas/MotionIn';
import { HeroAlianzas } from './HeroAlianzas';

/** Sección propia para la pantalla de alianzas (antes en la columna derecha del hero). */
export function AlianzasSection() {
  return (
    <section id="alianzas" className="ag-section ag-alianzas-sec" aria-labelledby="alianzas-titulo">
      <div className="ag-wrap">
        <MotionIn>
          <h2 id="alianzas-titulo" className="ag-mapa-title">Alianzas en curso</h2>
        </MotionIn>
        <MotionIn delay={40} className="ag-alianzas-sec-body">
          <HeroAlianzas />
        </MotionIn>
      </div>
    </section>
  );
}
