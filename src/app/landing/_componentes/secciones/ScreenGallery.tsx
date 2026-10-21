import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PANTALLAS, PANTALLAS_NOTA } from '../../_contenido/pantallas';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';
import { Pending } from '../primitivas/bits';
import { PhoneRow } from './PhoneRow';

export function ScreenGallery() {
  return (
    <Section id="pantallas" tone="white" label="pantallas-title">
      <DisplayTitle id="pantallas-title" lines={[{ text: 'Así se ve' }, { text: 'por dentro', accent: true }]} />
      <Lead>Tres pantallas del producto, en el celular. No hay que pulsar nada: es la vista que recibe cada quien.</Lead>
      <Pending note={PANTALLAS_NOTA} block>
        <PhoneRow />
      </Pending>
      <p style={{ marginTop: 8 }}>
        <Link className="ag-text-link" href="/landing/plataforma">
          Ver la plataforma <ArrowRight size={16} aria-hidden />
        </Link>
      </p>
    </Section>
  );
}
