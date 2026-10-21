import { PROBLEMA } from '../../_contenido/problema';
import { Card } from '../primitivas/Card';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Pending } from '../primitivas/bits';
import { Section } from '../primitivas/Section';

function People({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="ag-people" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className="ag-person" data-on={index < filled} />
      ))}
    </div>
  );
}

export function ProblemSection() {
  return (
    <Section id="problema" tone="grey" label="problema-title">
      <DisplayTitle id="problema-title" lines={[{ text: PROBLEMA.title[0] }, { text: PROBLEMA.title[1], accent: true }]} />
      <Lead>{PROBLEMA.lead}</Lead>
      <div className="ag-grid-2" style={{ marginTop: 28 }}>
        {[PROBLEMA.urbana, PROBLEMA.rural].map((card) => (
          <Card key={card.title}>
            <People filled={card.filled} total={card.total} />
            <h3 className="ag-h3">{card.title}</h3>
            <p>{card.text}</p>
          </Card>
        ))}
      </div>
      <Pending note={PROBLEMA.confirmar}>
        <p style={{ fontSize: 13, color: 'var(--ag-muted)' }}>
          Fuente: {PROBLEMA.fuenteUrl ? <a href={PROBLEMA.fuenteUrl}>{PROBLEMA.fuente}</a> : PROBLEMA.fuente}
        </p>
      </Pending>
      <div className="ag-grid-3" style={{ marginTop: 20 }}>
        {PROBLEMA.ciclo.map((item) => (
          <Card key={item.id} dark={item.id === 'oportunidad'}>
            <p className="ag-eyebrow">{item.label}</p>
            <p style={{ margin: 0 }}>{item.text}</p>
          </Card>
        ))}
      </div>
      <p className="ag-h3" style={{ marginTop: 28, fontSize: 24 }}>
        {PROBLEMA.cierre}
      </p>
    </Section>
  );
}
