import { Section } from '../primitivas/Section';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { ALBUMES } from '../../_contenido/albumes';
import { INSTAGRAM_RESULTADOS_INTRO } from '../../_contenido/videos';

/** Cinta "Resultados Calendario B 2026" (antes dentro de CifrasClave); en /landing va tras los mensajes 2026A. */
const puntaje = (alt: string) => Number(/(\d{3})\/500/.exec(alt)?.[1] ?? 0);
/** Los 6 puntajes más altos del álbum Calendario B 2026 (albumes.ts). */
export const TOP_B2026 = ALBUMES.filter((a) => a.id.startsWith('b2026'))
  .flatMap((a) => a.fotos)
  .sort((x, y) => puntaje(y.alt) - puntaje(x.alt))
  .slice(0, 6);

type Linea = { text: string; accent?: boolean };
/** `titulo`/`lead`: textos opcionales por página (p. ej. /landing/resultados); sin ellos, los de siempre. */
export function ResultadosB2026({ titulo, lead }: { titulo?: readonly Linea[]; lead?: string } = {}) {
  return (
    <Section id="resultados-b2026" tone="grey" label="b2026-title">
      <div className="sg-b2026" aria-labelledby="b2026-title">
        <DisplayTitle id="b2026-title" lines={titulo ?? [{ text: 'Resultados' }, { text: 'Calendario B 2026', accent: true }]} />
        <p className="sg-b2026-lead">{lead ?? INSTAGRAM_RESULTADOS_INTRO}</p>
        <ul className="sg-b2026-cards">
          {TOP_B2026.map((f) => (
            <li key={f.src} className="sg-b2026-card">
              <img src={f.src} alt={f.alt} width={1080} height={1350} loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>
        <p className="sg-b2026-cta">
          <a className="ag-btn" href="/landing/resultados#resultados">Ver los álbumes completos</a>
        </p>
      </div>
    </Section>
  );
}
