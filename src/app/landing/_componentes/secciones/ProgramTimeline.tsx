import { CARRILES, FASES, SEMANAS, type SemanaId } from '../../_contenido/programas';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

function hitoEn(carrilId: (typeof CARRILES)[number]['id'], semana: SemanaId) {
  return CARRILES.find((carril) => carril.id === carrilId)?.hitos.find((hito) => hito.semana === semana);
}

export function ProgramTimeline() {
  return (
    <Section id="calendario" tone="white" label="calendario-title">
      <DisplayTitle id="calendario-title" lines={[{ text: 'Dieciocho semanas' }, { text: 'dos programas', accent: true }]} />
      <Lead>
        El intensivo recorre todo el calendario. El vacacional entra en la semana 6 y se une en la semana 9. El chip rojo marca un simulacro.
      </Lead>
      <div className="ag-tl-scroll">
        <div className="ag-tl">
          <div className="ag-tl-corner">Programa</div>
          {FASES.map((fase) => {
            const count = SEMANAS.filter((semana) => semana.fase === fase.id).length;
            return (
              <div key={fase.id} className="ag-tl-fase" style={{ gridColumn: `span ${count}` }}>
                <strong>{fase.label}</strong>
                <span>{fase.rango}</span>
              </div>
            );
          })}
          <div className="ag-tl-lane ag-tl-lane-head">Semana</div>
          {SEMANAS.map((semana) => (
            <div key={semana.id} className="ag-tl-week">
              {semana.label}
            </div>
          ))}
          {CARRILES.map((carril) => (
            <div key={carril.id} className="ag-tl-row">
              <div className="ag-tl-lane">
                <strong>{carril.nombre}</strong>
                <span>{carril.detalle}</span>
              </div>
              {SEMANAS.map((semana) => {
                const hito = hitoEn(carril.id, semana.id);
                if (!hito) {
                  return <div key={semana.id} className="ag-tl-cell ag-tl-empty" aria-hidden />;
                }
                return (
                  <div key={semana.id} className="ag-tl-cell">
                    {hito.simulacro ? <span className="ag-sim-chip">Simulacro</span> : null}
                    <strong>{hito.titulo}</strong>
                    <span>{hito.texto}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="ag-tl-mobile">
        {FASES.map((fase) => (
          <section key={fase.id} className="ag-tl-phase">
            <h3 className="ag-h3">{fase.label}</h3>
            <p>
              {fase.rango}. {fase.texto}
            </p>
            {CARRILES.map((carril) => {
              const items = carril.hitos.filter((hito) => SEMANAS.find((semana) => semana.id === hito.semana)?.fase === fase.id);
              if (!items.length) return null;
              return (
                <div key={carril.id}>
                  <p className="ag-eyebrow">{carril.nombre}</p>
                  <ul className="ag-tl-list">
                    {items.map((hito) => (
                      <li key={`${carril.id}-${hito.semana}`}>
                        <span className="ag-tl-when">{SEMANAS.find((semana) => semana.id === hito.semana)?.label}</span>
                        {hito.simulacro ? <span className="ag-sim-chip">Simulacro</span> : null}
                        <strong>{hito.titulo}</strong>
                        <span>{hito.texto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </Section>
  );
}
