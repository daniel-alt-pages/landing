import { COLEGIOS } from '../../_contenido/colegios';
import { HERO } from '../../_contenido/hero';
import { contactoHref } from '../../_lib/links';
import BlurText from '../bits/BlurText';
import FadeContent from '../bits/FadeContent';
import { Eyebrow } from '../primitivas/Eyebrow';
import { Lead } from '../primitivas/Lead';
import { Marquee } from '../primitivas/Marquee';

export function Hero() {
  return (
    <section id="inicio" className="ag-section ag-tone-grey ag-hero" aria-labelledby="hero-title">
      <div className="ag-hero-center">
        <Eyebrow>{HERO.eyebrow}</Eyebrow>
        <h1 id="hero-title" className="ag-display">
          <BlurText as="span" align="center" className="ag-blur-line ag-title-line" text={HERO.title[0]} delay={50} blur={8} distance={14} />
          <BlurText as="span" align="center" className="ag-blur-line ag-accent" text={HERO.title[1]} delay={90} blur={8} distance={14} />
        </h1>
        <FadeContent blur duration={0.8} trigger="mount">
          <Lead>{HERO.lead}</Lead>
          <div className="ag-hero-cta">
            <a className="ag-btn" href={contactoHref('reunion')}>
              {HERO.ctaPrimary}
            </a>
            <a className="ag-btn-ghost" href={contactoHref('simulacro')}>
              {HERO.ctaSecondary}
            </a>
          </div>
        </FadeContent>
      </div>
      <FadeContent blur duration={1} delay={0.05}>
      <figure className="ag-hero-window">
        <img
          src="/landing/hero/planificacion-calendario.webp"
          alt="Estudiantes reunidos en un aula durante una sesión de SeamosGenios."
          width={1600}
          height={1200}
        />
      </figure>
      </FadeContent>
      <FadeContent blur duration={0.9} delay={0.1}>
      <div className="ag-hero-proof">
        <p>{HERO.trust}</p>
        <Marquee className="ag-hero-logos" label="Instituciones que ya aplicaron al menos un simulacro">
          {COLEGIOS.map((school) => (
            <img key={school.id} src={school.src} alt={school.short} width={56} height={56} />
          ))}
        </Marquee>
      </div>
      </FadeContent>
    </section>
  );
}
