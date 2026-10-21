/** Enmascara PII en el embed del método científico (landing). */

export type ShowcasePersonalSlice = {
  nombres: string;
  apellidos: string;
  numero_identificacion: string;
  institucion?: string;
};

export const SHOWCASE_MASKED_SELF_NAMES = {
  nombres: '***',
  apellidos: '***',
} as const;

export const SHOWCASE_MASKED_DOCUMENT = '***';

export const SHOWCASE_MASKED_INSTITUTION = 'IETAC';

export function maskDisplayPersonal(
  info: ShowcasePersonalSlice,
  options: { masked: boolean; peerIndex?: number; isSelf?: boolean },
): ShowcasePersonalSlice {
  if (!options.masked) return info;
  if (options.isSelf) {
    return {
      ...info,
      ...SHOWCASE_MASKED_SELF_NAMES,
      institucion: SHOWCASE_MASKED_INSTITUTION,
    };
  }
  return {
    ...info,
    nombres: '***',
    apellidos: '***',
    numero_identificacion: '***',
    institucion: SHOWCASE_MASKED_INSTITUTION,
  };
}

export function showcaseDocumentLabel(
  doc: string,
  masked: boolean,
  isSelf = false,
): string {
  if (!masked) return doc;
  if (isSelf) return SHOWCASE_MASKED_DOCUMENT;
  return '***';
}

export function showcaseFirstName(nombres: string, masked: boolean, isSelf = false): string {
  if (!masked) return nombres.split(' ')[0].toUpperCase();
  return SHOWCASE_MASKED_SELF_NAMES.nombres;
}

export function maskStudentListForShowcase<T extends { informacion_personal: ShowcasePersonalSlice }>(
  list: T[],
  myId: string,
  masked: boolean,
): T[] {
  if (!masked) return list;
  return list.map((item, idx) => ({
    ...item,
    informacion_personal: maskDisplayPersonal(item.informacion_personal, {
      masked: true,
      peerIndex: idx,
      isSelf:
        String(item.informacion_personal.numero_identificacion).trim() ===
        String(myId).trim(),
    }),
  }));
}
