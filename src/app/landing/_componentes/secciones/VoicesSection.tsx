'use client';

import { VOCES, VOCES_LEAD, VOCES_TITULO } from '../../_contenido/voces';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';
import { VoiceWall } from './VoiceWall';

export function VoicesSection({ compact = false, tone = 'grey' }: { compact?: boolean; tone?: 'grey' | 'white' | 'paper' }) {
  const withWords = VOCES.filter((item) => item.text);

  return (
    <Section id="voces" tone={tone} label="voces-title">
      <DisplayTitle id="voces-title" lines={[{ text: VOCES_TITULO[0] }, { text: VOCES_TITULO[1], accent: true }]} />
      <Lead>{VOCES_LEAD}</Lead>
      <VoiceWall items={[...withWords]} compact={compact} />
    </Section>
  );
}
