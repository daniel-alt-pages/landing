import { PANELES } from '../../_contenido/paneles';
import { PANTALLAS } from '../../_contenido/pantallas';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { PhoneFrame } from '../primitivas/PhoneFrame';
import { Section } from '../primitivas/Section';

const POR_PANEL = {
  coordinador: PANTALLAS[1],
  estudiante: PANTALLAS[0],
} as const;

export function PanelsShowcase() {
  return (
    <Section id="paneles" tone="white" label="plataforma-title">
      <DisplayTitle id="plataforma-title" lines={[{ text: PANELES.title[0] }, { text: PANELES.title[1], accent: true }]} />
      <Lead>La misma información, en el celular de quien la usa. Rectoría ve el grupo. El estudiante ve su propio resultado.</Lead>
      <div className="ag-phone-row ag-phone-row-2">
        {PANELES.tabs.map((tab) => {
          const pantalla = POR_PANEL[tab.id];
          return (
            <article key={tab.id} className="ag-phone-card">
              <PhoneFrame src={pantalla.src} alt={pantalla.alt} />
              <h3 className="ag-h3">{tab.label}</h3>
              <p>{tab.text}</p>
              <ul className="ag-plain-list">
                {tab.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
