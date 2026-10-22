import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { B2bCierre } from '../_componentes/secciones/b2b/B2bCierre';
import { B2bGobierno } from '../_componentes/secciones/b2b/B2bGobierno';
import { B2bHero } from '../_componentes/secciones/b2b/B2bHero';
import { MapaSitio } from '../_componentes/secciones/MapaSitio';
import { B2bNiveles } from '../_componentes/secciones/b2b/B2bNiveles';
import { B2bNosotros } from '../_componentes/secciones/b2b/B2bNosotros';
import { B2bPlataforma } from '../_componentes/secciones/b2b/B2bPlataforma';
import { B2bPreicfes } from '../_componentes/secciones/b2b/B2bPreicfes';
import { B2bPrograma } from '../_componentes/secciones/b2b/B2bPrograma';
import { B2bResumen } from '../_componentes/secciones/b2b/B2bResumen';
import './b2b-base.css';
import './b2b-secciones.css';
import './b2b-diagramas.css';
import './b2b-portafolio.css';
import './b2b-pdf.css';
import './b2b-diagramas-v2.css';
import './b2b-problema-quienes.css';
import './b2b-mapa.css';
import './b2b-hero.css';
import './b2b-desktop.css';

/** Fuente del panel B2B en escritorio (referencia de Daniel, 21-oct-2026). */
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: { absolute: 'Modelo de servicios institucionales B2B | SEAMOSGENIOS' },
  description: 'Portafolio B2B Calendario B-A 2027-1: evaluación tipo Saber 11, formación focalizada y programa institucional integral para colegios y consejos directivos.',
};

export default function InstitucionesPage() {
  return (
    <div className={`b2b-panel ${jakarta.variable}`}>
      <B2bHero />
      <MapaSitio variante="b2b" />
      <B2bResumen />
      <B2bNosotros />
      <B2bNiveles />
      <B2bPrograma />
      <B2bPreicfes />
      <B2bPlataforma />
      <B2bGobierno />
      <B2bCierre />
    </div>
  );
}
