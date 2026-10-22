import { describe, expect, it } from 'vitest';
import { isSpam, leadPayload, normalizeWhatsapp, validateLead, type LeadInput } from './lead';

function base(over: Partial<LeadInput> = {}): LeadInput {
  return {
    interes: 'reunion',
    nombre: 'Ana Ruiz',
    cargo: 'Rector(a)',
    institucion: 'I. E. El Prado',
    departamento: 'La Guajira',
    municipio: 'Maicao',
    estudiantes11: '50 a 99',
    mensaje: '',
    whatsapp: '304 235 9048',
    correo: '',
    consentimiento: true,
    sitio_web: '',
    t0: 1_000,
    now: 10_000,
    ...over,
  };
}

describe('validateLead', () => {
  it('acepta un lead completo', () => {
    expect(validateLead(base())).toEqual([]);
  });

  it('normaliza el +57', () => {
    expect(normalizeWhatsapp('+57 304 235 9048')).toBe('3042359048');
    expect(leadPayload(base({ whatsapp: '+57 304 235 9048' })).whatsapp).toBe('3042359048');
  });

  it('marca el celular inválido', () => {
    const errors = validateLead(base({ whatsapp: '123' }));
    expect(errors.some((e) => e.field === 'whatsapp')).toBe(true);
  });

  it('acepta otro valor escrito en las listas', () => {
    expect(validateLead(base({ cargo: 'Otro: Psicorientador' }))).toEqual([]);
    expect(validateLead(base({ departamento: 'Otro: Distrito especial' }))).toEqual([]);
    expect(validateLead(base({ estudiantes11: 'Otro: 35' }))).toEqual([]);
  });

  it('rechaza un cargo que no está en la lista', () => {
    expect(validateLead(base({ cargo: 'Inventado' })).some((e) => e.field === 'cargo')).toBe(true);
  });

  it('exige el consentimiento', () => {
    expect(validateLead(base({ consentimiento: false })).some((e) => e.field === 'consentimiento')).toBe(true);
  });

  it('detecta honeypot y envío demasiado rápido', () => {
    expect(isSpam(base({ sitio_web: 'http://spam.test' }))).toBe(true);
    expect(isSpam(base({ t0: 9_000, now: 10_000, sitio_web: '' }))).toBe(true);
    expect(isSpam(base())).toBe(false);
  });
});
