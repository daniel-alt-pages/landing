import { BarChart3, Layers, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { B2B_HERO } from '../../../_contenido/b2b/modelo';
import { b2bWhatsappUrl, B2B_CONTACTO } from '../../../_contenido/b2b/precios';

const ICONO: LucideIcon[] = [Layers, BarChart3, Users];

export function B2bHero() {
  const [antes, despues = ''] = B2B_HERO.title.split(B2B_HERO.accent);
  return (
    <section id="portada" className="ag-section ag-tone-white ag-b2b ag-b2b-portada is-claro" aria-labelledby="b2b-hero-title">
      <div className="ag-wrap ag-b2b-portada-grid">
        <div>
          <p className="ag-b2b-chip">{B2B_HERO.chip}</p>
          <p className="ag-b2b-kicker">{B2B_HERO.kicker}</p>
          <h1 id="b2b-hero-title">
            {antes}
            <span className="ag-accent">{B2B_HERO.accent}</span>
            {despues}
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
          <img src="/landing/pantallas/coordinador.webp" alt={B2B_HERO.panelAlt} />
          <figcaption>{B2B_HERO.panelLabel}</figcaption>
        </figure>
      </div>
    </section>
  );
}
