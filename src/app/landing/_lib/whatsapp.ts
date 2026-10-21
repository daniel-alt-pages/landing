export type WaContext =
  | 'hero'
  | 'bar'
  | 'fab'
  | 'oferta_preicfes'
  | 'cta_final'
  | 'lead_fallback'
  | 'estudiantes'
  | 'header';

export const WA_TEXT: Record<WaContext, string> = {
  hero: 'Hola, quiero agendar la reunión para mi institución.',
  bar: 'Hola, quiero el simulacro gratuito para mi institución.',
  fab: 'Hola, quiero agendar la reunión para mi institución.',
  header: 'Hola, quiero agendar la reunión para mi institución.',
  oferta_preicfes: 'Hola, quiero información del PreICFES completo para mi institución.',
  cta_final: 'Hola, quiero hablar sobre la alianza para mi institución.',
  lead_fallback: 'Hola, no pude enviar el formulario y quiero dejar estos datos de mi institución.',
  estudiantes: 'Hola, quiero información del PreICFES para estudiantes.',
};

export function buildWaUrl(phone: string, text: string, ref?: string): string {
  const digits = phone.replace(/\D/g, '');
  const body = ref ? `${text}\n\nRef: ${ref}` : text;
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}
