import { B2B_HERO } from '../../../_contenido/b2b/modelo';
import { b2bWhatsappUrl } from '../../../_contenido/b2b/contacto';

/** Portada B2B según el diseño aprobado en Stitch (21-oct-2026): rojo #CC0000 + foto del aula a 15 %, una columna centrada. */
export function B2bHero() {
  return (
    <section id="portada" className="ag-b2b-portada sg-hero" aria-labelledby="b2b-hero-title">
      <img
        className="sg-hero-foto"
        src="/landing/b2b/aula-stitch-1280.webp"
        srcSet="/landing/b2b/aula-stitch-1280.webp 1280w, /landing/b2b/aula-stitch-1376.webp 1376w"
        sizes="100vw"
        width={1376}
        height={768}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      <div className="sg-hero-main">
        <p className="sg-hero-badge"><span>{B2B_HERO.chip}</span></p>
        <p className="sg-hero-eyebrow">{B2B_HERO.kicker}</p>
        <h1 id="b2b-hero-title" className="sg-hero-h1">{B2B_HERO.title}</h1>
        <p className="sg-hero-sub">{B2B_HERO.lead}</p>
        <ul className="sg-hero-chips">
          {B2B_HERO.pilares.map((p) => <li key={p.title}>{p.title}</li>)}
        </ul>
        <div className="sg-hero-btns">
          <a className="sg-hero-btn is-primario" href="#solicitar-reunion">Agendar reunión</a>
          <a className="sg-hero-btn is-borde" href={b2bWhatsappUrl()}>Escribir por WhatsApp</a>
        </div>
      </div>
    </section>
  );
}
