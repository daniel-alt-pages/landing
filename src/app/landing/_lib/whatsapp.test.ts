import { describe, expect, it } from 'vitest';
import { buildWaUrl, WA_TEXT } from './whatsapp';

describe('buildWaUrl', () => {
  it('codifica el texto y limpia el teléfono', () => {
    const url = buildWaUrl('+57 304 235 9048', 'Hola, institución');
    expect(url.startsWith('https://wa.me/573042359048?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toBe('Hola, institución');
  });

  it('agrega la referencia al final', () => {
    const url = buildWaUrl('573042359048', WA_TEXT.fab, 'utm_source=ig');
    expect(decodeURIComponent(url.split('text=')[1])).toContain('Ref: utm_source=ig');
  });
});
