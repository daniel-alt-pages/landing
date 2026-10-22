import type { Metadata } from 'next';
import { Caveat, Plus_Jakarta_Sans } from 'next/font/google';
import { EJEMPLOS, PRECIO_EJEMPLO } from './ejemplos';
import { RevealGrid } from './RevealGrid';
import { TarjetaEjemplo } from './TarjetaEjemplo';
import './prueba-motion.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--pm-sans', display: 'swap' });
const caveat = Caveat({ subsets: ['latin'], weight: ['600'], variable: '--pm-hand', display: 'swap' });

export const metadata: Metadata = {
  title: { absolute: 'Prueba de movimiento (interna)' },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function PruebaMotionPage() {
  return (
    <section className={`pm-root ${jakarta.variable} ${caveat.variable}`} aria-labelledby="pm-title">
      <div className="pm-wrap">
        <p className="pm-hand">ruta de prueba</p>
        <h1 id="pm-title" className="pm-h1">Tarjetas de ejemplo</h1>
        <p className="pm-lead">Página interna para probar el movimiento de la tienda. Los productos no existen.</p>
        <RevealGrid>
          {EJEMPLOS.map((e, i) => (
            <TarjetaEjemplo key={e.id} id={e.id} titulo={e.titulo} precio={PRECIO_EJEMPLO} indice={i} />
          ))}
        </RevealGrid>
      </div>
    </section>
  );
}
