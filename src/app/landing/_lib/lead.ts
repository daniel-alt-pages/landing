export const CARGOS = [
  'Rector(a)',
  'Coordinador(a) académico(a)',
  'Docente',
  'Secretaría de Educación',
  'Otro',
] as const;

export const RANGOS_ESTUDIANTES = ['Menos de 50', '50 a 99', '100 a 200', 'Más de 200'] as const;

export const DEPARTAMENTOS = [
  'Amazonas',
  'Antioquia',
  'Arauca',
  'Atlántico',
  'Bogotá D.C.',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Casanare',
  'Cauca',
  'Cesar',
  'Chocó',
  'Córdoba',
  'Cundinamarca',
  'Guainía',
  'Guaviare',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Putumayo',
  'Quindío',
  'Risaralda',
  'San Andrés y Providencia',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca',
  'Vaupés',
  'Vichada',
] as const;

export type LeadInteres = 'reunion' | 'simulacro';

export type LeadInput = {
  interes: string;
  nombre: string;
  cargo: string;
  institucion: string;
  departamento: string;
  municipio: string;
  estudiantes11: string;
  mensaje: string;
  whatsapp: string;
  correo: string;
  consentimiento: boolean;
  sitio_web: string;
  t0: number;
  now?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
};

export type LeadFieldError = { field: keyof LeadInput | 'form'; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length === 12) return digits.slice(2);
  return digits;
}

export function isSpam(input: Pick<LeadInput, 'sitio_web' | 't0' | 'now'>): boolean {
  if (input.sitio_web.trim()) return true;
  const now = input.now ?? Date.now();
  if (input.t0 > 0 && now - input.t0 < 3000) return true;
  return false;
}

export function isListedOrOther(value: string, list: readonly string[], min = 2): boolean {
  if (list.includes(value)) return true;
  const match = /^Otro:\s*(.+)$/.exec(value);
  return Boolean(match && match[1].trim().length >= min && match[1].trim().length <= 80);
}

export function validateLead(input: LeadInput): LeadFieldError[] {
  const errors: LeadFieldError[] = [];
  if (input.interes !== 'reunion' && input.interes !== 'simulacro') {
    errors.push({ field: 'interes', message: 'Seleccione reunión o simulacro.' });
  }
  if (input.nombre.trim().length < 3 || input.nombre.trim().length > 80) {
    errors.push({ field: 'nombre', message: 'Escriba su nombre completo.' });
  }
  if (!isListedOrOther(input.cargo, CARGOS)) {
    errors.push({ field: 'cargo', message: 'Seleccione un cargo o escriba otro.' });
  }
  if (input.institucion.trim().length < 3 || input.institucion.trim().length > 120) {
    errors.push({ field: 'institucion', message: 'Escriba el nombre de la institución.' });
  }
  if (!isListedOrOther(input.departamento, DEPARTAMENTOS)) {
    errors.push({ field: 'departamento', message: 'Seleccione un departamento o escriba otro.' });
  }
  if (input.municipio.trim().length < 2 || input.municipio.trim().length > 80) {
    errors.push({ field: 'municipio', message: 'Escriba el municipio.' });
  }
  if (!isListedOrOther(input.estudiantes11, RANGOS_ESTUDIANTES)) {
    errors.push({ field: 'estudiantes11', message: 'Seleccione un rango o escriba otro.' });
  }
  if (input.mensaje.trim().length > 400) {
    errors.push({ field: 'mensaje', message: 'Resuma lo que desea lograr en menos de 400 caracteres.' });
  }
  if (!/^3\d{9}$/.test(normalizeWhatsapp(input.whatsapp))) {
    errors.push({ field: 'whatsapp', message: 'Escriba un número celular de Colombia de 10 dígitos que empiece por 3.' });
  }
  if (input.correo.trim() && !EMAIL.test(input.correo.trim())) {
    errors.push({ field: 'correo', message: 'Revise el correo: el formato no es válido.' });
  }
  if (!input.consentimiento) {
    errors.push({ field: 'consentimiento', message: 'Necesitamos su autorización para tratar sus datos.' });
  }
  return errors;
}

export function leadPayload(input: LeadInput) {
  return {
    interes: input.interes,
    nombre: input.nombre.trim(),
    cargo: input.cargo,
    institucion: input.institucion.trim(),
    departamento: input.departamento,
    municipio: input.municipio.trim(),
    estudiantes11: input.estudiantes11,
    mensaje: input.mensaje.trim(),
    whatsapp: normalizeWhatsapp(input.whatsapp),
    correo: input.correo.trim(),
    utm_source: input.utm_source || '',
    utm_medium: input.utm_medium || '',
    utm_campaign: input.utm_campaign || '',
    utm_content: input.utm_content || '',
    utm_term: input.utm_term || '',
    referrer: input.referrer || '',
    sitio_web: input.sitio_web,
    t0: input.t0,
  };
}

export function leadWhatsappBody(input: LeadInput): string {
  return [
    'Hola, no pude enviar el formulario de la alianza. Estos son mis datos:',
    `Interés: ${input.interes === 'simulacro' ? 'Simulacro gratis' : 'Reunión de 30 min'}`,
    `Nombre: ${input.nombre.trim()}`,
    `Cargo: ${input.cargo}`,
    `Institución: ${input.institucion.trim()}`,
    `Lugar: ${input.municipio.trim()}, ${input.departamento}`,
    `Estudiantes de grado 11: ${input.estudiantes11}`,
    input.mensaje.trim() ? `Qué desea lograr: ${input.mensaje.trim()}` : '',
    `WhatsApp: ${normalizeWhatsapp(input.whatsapp)}`,
    input.correo.trim() ? `Correo: ${input.correo.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export const PENDING_LEAD_KEY = 'ag_lead_pending';
