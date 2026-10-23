'use client';

import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';
import { AlbumesCarousel } from './AlbumesCarousel';

export function ResultsGallery() {
  return (
    <Section id="resultados" tone="grey" label="resultados-title">
      <DisplayTitle id="resultados-title" lines={[{ text: 'Puntajes que' }, { text: 'cambian trayectorias', accent: true }]} />
      <Lead>Un puntaje perfecto, cuatro resultados de élite y estudiantes que subieron más de 100 puntos con nuestro acompañamiento.</Lead>
      <AlbumesCarousel />
    </Section>
  );
}
