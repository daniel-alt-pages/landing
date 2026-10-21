import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

export function InstitutionLadder() {
  return (
    <Section id="niveles" tone="white" label="niveles-title">
      <DisplayTitle id="niveles-title" lines={[{ text: 'Para su' }, { text: 'colegio', accent: true }]} />
      <Lead>
        Simulacros, formación focalizada y programa continuo están en el portafolio institucional.
      </Lead>
      <div className="ag-actions">
        <a className="ag-btn" href="/landing/instituciones#niveles">Ver el modelo para instituciones</a>
      </div>
    </Section>
  );
}

export function ContinuityCycle() {
  return (
    <Section id="continuidad" tone="charcoal" label="continuidad-title">
      <DisplayTitle
        id="continuidad-title"
        onDark
        lines={[{ text: 'De un calendario' }, { text: 'al siguiente', accent: true }]}
      />
      <Lead>Ese ciclo es el Nivel 3 del portafolio institucional: dos calendarios, refuerzo y verificación.</Lead>
      <div className="ag-actions">
        <a className="ag-btn" href="/landing/instituciones#n3">Ver el ciclo anual</a>
      </div>
    </Section>
  );
}
