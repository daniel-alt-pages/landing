import type { Metadata } from 'next';
import { B2bCierre } from '../_componentes/secciones/b2b/B2bCierre';
import { B2bGobierno } from '../_componentes/secciones/b2b/B2bGobierno';
import { B2bHero } from '../_componentes/secciones/b2b/B2bHero';
import { B2bNiveles } from '../_componentes/secciones/b2b/B2bNiveles';
import { B2bNosotros } from '../_componentes/secciones/b2b/B2bNosotros';
import { B2bPlataforma } from '../_componentes/secciones/b2b/B2bPlataforma';
import { B2bPrograma } from '../_componentes/secciones/b2b/B2bPrograma';
import { B2bResumen } from '../_componentes/secciones/b2b/B2bResumen';
import './b2b-base.css';
import './b2b-secciones.css';
import './b2b-diagramas.css';
import './b2b-portafolio.css';
import './b2b-pdf.css';

export const metadata: Metadata = {
  title: { absolute: 'Modelo de servicios institucionales B2B | SEAMOSGENIOS' },
  description: 'Portafolio B2B Calendario B-A 2027-1: evaluación tipo Saber 11, formación focalizada y programa institucional integral para colegios y consejos directivos.',
};

export default function InstitucionesPage() {
  return (
    <>
      <B2bHero />
      <B2bResumen />
      <B2bNosotros />
      <B2bNiveles />
      <B2bPrograma />
      <B2bPlataforma />
      <B2bGobierno />
      <B2bCierre />
    </>
  );
}
