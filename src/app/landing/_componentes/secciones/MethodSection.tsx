import { CAPAS, DESAFIOS, METODO, RUTA_DOMINIO } from '../../_contenido/metodo';
import { PANTALLAS } from '../../_contenido/pantallas';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Eyebrow } from '../primitivas/Eyebrow';
import { Lead } from '../primitivas/Lead';
import { PhoneFrame } from '../primitivas/PhoneFrame';
import { Section } from '../primitivas/Section';
import { Spotlight } from '../primitivas/Spotlight';

export function MethodSection() {
  return (
    <Section id="metodo" tone="paper" label="metodo-title">
      <Eyebrow>{METODO.eyebrow}</Eyebrow>
      <DisplayTitle id="metodo-title" lines={[{ text: METODO.title[0] }, { text: METODO.title[1], accent: true }]} />
      <Lead>{METODO.lead}</Lead>
      <ol className="ag-step-rail ag-steps-4 ag-plain-list">
        {METODO.pasos.map((paso) => (
          <li key={paso.n} className="ag-card">
            <span className="ag-num">{paso.n}</span>
            <h3 className="ag-h3" style={{ marginTop: 12 }}>
              {paso.title}
            </h3>
            <p>{paso.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function LayersSection() {
  return (
    <Section id="capas" tone="black" label="capas-title">
      <Eyebrow>{CAPAS.eyebrow}</Eyebrow>
      <DisplayTitle id="capas-title" onDark lines={[{ text: CAPAS.title[0] }, { text: CAPAS.title[1], accent: true }]} />
      <Lead>{CAPAS.lead}</Lead>
      <ol className="ag-layers ag-plain-list">
        {CAPAS.items.map((item) => (
          <li key={item.n}>
            <span className="ag-num">{item.n}</span>
            <div>
              <h3 className="ag-h3">{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function ChallengesSection() {
  return (
    <Section id="desafios" tone="grey" label="desafios-title">
      <Eyebrow>{DESAFIOS.eyebrow}</Eyebrow>
      <DisplayTitle id="desafios-title" lines={[{ text: DESAFIOS.title[0] }, { text: DESAFIOS.title[1], accent: true }]} />
      <Lead>{DESAFIOS.lead}</Lead>
      <div className="ag-phone-split">
        <PhoneFrame src={PANTALLAS[2].src} alt={PANTALLAS[2].alt} />
        <div className="ag-grid-2">
        {DESAFIOS.items.map((item) => (
          <Spotlight key={item.title}>
            <h3 className="ag-h3">{item.title}</h3>
            <p>{item.text}</p>
          </Spotlight>
        ))}
        </div>
      </div>
      <p className="ag-footnote">{DESAFIOS.nota}</p>
    </Section>
  );
}

export function DomainRouteSection() {
  return (
    <Section id="ruta-dominio" tone="white" label="dominio-title">
      <Eyebrow>{RUTA_DOMINIO.eyebrow}</Eyebrow>
      <DisplayTitle id="dominio-title" lines={[{ text: RUTA_DOMINIO.title[0] }, { text: RUTA_DOMINIO.title[1], accent: true }]} />
      <Lead>{RUTA_DOMINIO.lead}</Lead>
      <ol className="ag-phases ag-plain-list">
        {RUTA_DOMINIO.fases.map((fase, index) => (
          <li key={fase.n} data-last={index === RUTA_DOMINIO.fases.length - 1}>
            <span className="ag-num">{fase.n}</span>
            <h3 className="ag-h3">{fase.title}</h3>
            <p>{fase.text}</p>
          </li>
        ))}
      </ol>
      <p className="ag-footnote">{RUTA_DOMINIO.nota}</p>
    </Section>
  );
}
