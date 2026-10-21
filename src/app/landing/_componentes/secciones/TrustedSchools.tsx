import { COLEGIOS } from '../../_contenido/colegios';
import type { SchoolLogo } from '../../_contenido/tipos';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Marquee } from '../primitivas/Marquee';
import { Section } from '../primitivas/Section';

const ROW_SIZE = Math.ceil(COLEGIOS.length / 3);
const ROWS = [0, 1, 2].map((index) => COLEGIOS.slice(index * ROW_SIZE, (index + 1) * ROW_SIZE));
const ROW_LABEL = ['Primera', 'Segunda', 'Tercera'] as const;

function SchoolCard({ school }: { school: SchoolLogo }) {
  const place = school.department === 'Colombia' ? '' : school.department;
  return (
    <figure className="ag-school-card">
      <img src={school.src} alt="" width={280} height={280} />
      <figcaption>
        {school.name}
        {place ? <span>{place}</span> : null}
      </figcaption>
    </figure>
  );
}

export function TrustedSchools({ tone = 'white' }: { tone?: 'white' | 'paper' | 'grey' }) {
  return (
    <Section id="colegios" tone={tone} label="colegios-title">
      <DisplayTitle
        id="colegios-title"
        lines={[{ text: `${COLEGIOS.length} instituciones` }, { text: 'ya aplicaron al menos un simulacro', accent: true }]}
      />
      <Lead>
        Cada escudo es un colegio que ya aplicó, como mínimo, un simulacro de SeamosGenios con sus estudiantes. Oficial
        o privado, en distintas regiones: el modelo ya entró al aula.
      </Lead>
      <div className="ag-school-rows">
        {ROWS.map((row, index) => (
          <Marquee
            key={ROW_LABEL[index]}
            className="ag-marquee-schools"
            dir={index === 1 ? 'right' : 'left'}
            label={`${ROW_LABEL[index]} fila de instituciones con al menos un simulacro`}
          >
            {row.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </Marquee>
        ))}
      </div>
    </Section>
  );
}
