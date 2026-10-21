export type CourseEnrollmentKind = 'becado' | 'pago' | 'unknown';

export const COURSE_ENROLLMENT_KIND_LABEL: Record<CourseEnrollmentKind, string> = {
  becado: 'Becado',
  pago: 'Pago',
  unknown: 'Sin clasificar',
};

/** Clasifica inscripción vacacional sin exponer montos ni referencias de pago. */
export function classifyVacacionalEnrollment(input: {
  segmento?: string;
  tipoRegistro?: string;
  formaPago?: string;
  grupoVacacional?: string;
  registroId?: string;
}): CourseEnrollmentKind {
  const registroId = (input.registroId || '').toLowerCase();
  if (registroId.startsWith('beca_')) return 'becado';
  if (registroId.startsWith('pago_') || registroId.startsWith('pase_')) return 'pago';

  const blob = [
    input.segmento,
    input.tipoRegistro,
    input.formaPago,
    input.grupoVacacional,
  ]
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  if (blob.includes('beca')) return 'becado';
  if (
    blob.includes('wompi') ||
    blob.includes('pago') ||
    blob.includes('105k') ||
    blob.includes('125k') ||
    blob.includes('confirmacion') ||
    blob.includes('instituciones') ||
    blob.includes('inscripcion')
  ) {
    return 'pago';
  }
  return 'unknown';
}

export function mergeEnrollmentKind(
  current: CourseEnrollmentKind | undefined,
  next: CourseEnrollmentKind,
): CourseEnrollmentKind {
  if (current === 'becado' || next === 'becado') return 'becado';
  if (current === 'pago' || next === 'pago') return 'pago';
  return 'unknown';
}
