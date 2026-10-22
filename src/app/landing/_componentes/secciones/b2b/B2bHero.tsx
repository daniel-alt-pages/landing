import { BarChart3, Layers, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { B2B_HERO } from '../../../_contenido/b2b/modelo';
import { b2bWhatsappUrl, B2B_CONTACTO } from '../../../_contenido/b2b/precios';

const ICONO: LucideIcon[] = [Layers, BarChart3, Users];

function Palabras({ texto, desde, cierre = '' }: { texto: string; desde: number; cierre?: string }) {
  const palabras = texto.split(' ').filter(Boolean);
  return palabras.map((palabra, index) => (
    <span key={`${palabra}-${index}`}>
      {index > 0 ? ' ' : null}
      <span className="ag-b2b-word" style={{ animationDelay: `${desde + index * 40}ms` }}>
        {palabra}{index === palabras.length - 1 ? cierre : ''}
      </span>
    </span>
  ));
}

export function B2bHero() {
  const [antes, despues = ''] = B2B_HERO.title.split(B2B_HERO.accent);
  const retrasoAcento = antes.split(' ').filter(Boolean).length * 40;
  return (
    <section id="portada" className="ag-section ag-tone-black ag-b2b ag-b2b-portada" aria-labelledby="b2b-hero-title">
      <div className="ag-wrap ag-b2b-portada-grid">
        <div>
          <p className="ag-b2b-chip">{B2B_HERO.chip}</p>
          <p className="ag-b2b-kicker">{B2B_HERO.kicker}</p>
          <h1 id="b2b-hero-title">
            <Palabras texto={antes} desde={0} />
            {' '}
            <span className="ag-accent-line">
              <Palabras texto={B2B_HERO.accent} desde={retrasoAcento} cierre={despues.trim()} />
            </span>
          </h1>
          <p className="ag-b2b-bajada">{B2B_HERO.lead}</p>
          <ul className="ag-b2b-chips">
            {B2B_HERO.pilares.map((pilar, index) => {
              const Icono = ICONO[index] ?? Layers;
              return (
                <li key={pilar.title}>
                  <Icono size={18} strokeWidth={1.75} aria-hidden="true" />
                  {pilar.title}
                </li>
              );
            })}
          </ul>
          <div className="ag-b2b-acciones">
            <a className="ag-b2b-btn" href={`mailto:${B2B_CONTACTO.email}`}>Agendar reunión</a>
            <a className="ag-b2b-btn ag-b2b-btn-ghost" href={b2bWhatsappUrl()}>Escribir por WhatsApp</a>
          </div>
          <p className="ag-b2b-nota">{B2B_HERO.panelNote}</p>
        </div>
        <figure className="ag-b2b-panel">
          <picture>
            <source type="image/avif" srcSet="/landing/mascota/mascota-480.avif 480w, /landing/mascota/mascota-960.avif 960w" sizes="(min-width: 1024px) 480px, 90vw" />
            <source type="image/webp" srcSet="/landing/mascota/mascota-480.webp 480w, /landing/mascota/mascota-960.webp 960w" sizes="(min-width: 1024px) 480px, 90vw" />
            <img className="ag-b2b-panel-mascota" src="/landing/mascota/mascota-480.webp" width={480} height={472} alt="Mascota de SEAMOSGENIOS" decoding="async" fetchPriority="high" />
          </picture>
        </figure>
      </div>
    </section>
  );
}
