import { CIFRAS, CIFRAS_NOTAS, CIFRAS_TITULO } from '../../_contenido/cifras';
import { CALENDARIO_2026 } from '../../_contenido/metodo';
import { Counter } from '../primitivas/Counter';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Section } from '../primitivas/Section';
import { Pending } from '../primitivas/bits';

export function StatsBand({ withCalendar = false }: { withCalendar?: boolean }) {
  return (
    <Section id="cifras" tone="black" label="cifras-title">
      <DisplayTitle id="cifras-title" onDark lines={[{ text: CIFRAS_TITULO[0] }, { text: CIFRAS_TITULO[1], accent: true }]} />
      <div className="ag-grid-4 ag-stats" style={{ marginTop: 32 }}>
        {CIFRAS.map((stat) => (
          <Pending key={stat.id} note={stat.confirmar}>
            <div>
              <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              <div className="ag-bar" />
              <p style={{ margin: 0, fontWeight: 700 }}>{stat.label}</p>
              <p className="ag-stat-note">{stat.note}</p>
            </div>
          </Pending>
        ))}
      </div>
      {withCalendar ? (
        <div className="ag-calendar">
          <p className="ag-eyebrow">{CALENDARIO_2026.eyebrow}</p>
          <div className="ag-grid-4">
            <div>
              <Counter value={CALENDARIO_2026.estudiantes} />
              <p className="ag-stat-note">Estudiantes en el ranking</p>
            </div>
            <div>
              <Counter value={CALENDARIO_2026.promedio} suffix="/500" />
              <p className="ag-stat-note">Promedio</p>
            </div>
            <div>
              <Counter value={CALENDARIO_2026.maximo} suffix="/500" />
              <p className="ag-stat-note">Puntaje máximo</p>
            </div>
            <div>
              <Counter value={CALENDARIO_2026.sobre400} />
              <p className="ag-stat-note">Estudiantes sobre 400</p>
            </div>
          </div>
          <p className="ag-stat-note">{CALENDARIO_2026.nota}</p>
        </div>
      ) : null}
      <ol className="ag-stat-notes">
        {CIFRAS_NOTAS.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ol>
    </Section>
  );
}
