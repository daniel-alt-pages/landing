/** Logos ImageKit — instituciones que han presentado simulacros con SEAMOSGENIOS (landing cotización). */

/** `text`: nombre completo (accesibilidad). `shortLabel`: pie bajo el logo (siglas o forma corta). */
export type CotizGalleryItem = { image: string; text: string; shortLabel?: string };

function imageKitLogoUrl(imagePath: string) {
  return `https://ik.imagekit.io/SG/tr:w-800,q-80,f-png/${imagePath}`;
}

/** Logos solicitados a ImageKit en alta resolución para evitar blur en canvas DPR 2x. */
export const COTIZ_INSTITUTION_GALLERY_ITEMS: CotizGalleryItem[] = [
  {
    image: imageKitLogoUrl('IE%20SAN%20AGUSTI%C3%8DN%20-%20SIMULACROS.png'),
    text: 'IESA',
  },
  {
    image: imageKitLogoUrl('IETAC%20-%20SIMULACROS.png'),
    text: 'IETAC',
  },
  {
    image: imageKitLogoUrl('IED%20RURAL%20PALERMO%20-%20SIMULACROS.png'),
    text: 'IED Rural de Palermo',
    shortLabel: 'IRP',
  },
  {
    image: imageKitLogoUrl('IE%20SAN%20GERARDO%20-%20SIMULACROS.png'),
    text: 'Institución Educativa San Gerardo',
    shortLabel: 'ISG',
  },
  {
    image: imageKitLogoUrl('IE%20SAGRADO%20CORAZ%C3%93N%20-%20SIMULACROS.png'),
    text: 'IESC',
  },
  {
    image: imageKitLogoUrl('IE%20PEDRO%20DE%20HEREDIA%20-%20SIMULACROS.png'),
    text: 'IED Pedro de Heredia',
    shortLabel: 'IPH',
  },
  {
    image: imageKitLogoUrl('IERD%20LA%20FUENTE%20-%20SIMULACROS.png'),
    text: 'Institución Educativa La Fuente',
    shortLabel: 'ILF',
  },
  {
    image: imageKitLogoUrl('IED%20MAR%C3%8DA%20MEDINA%20-%20SIMULACROS.png'),
    text: 'I.E.D. María Medina Fosca',
    shortLabel: 'IED MMF',
  },
  {
    image: imageKitLogoUrl('IE%20LUIS%20HERNANDEZ%20VARGAS%20-%20SIMULACROS.png'),
    text: 'IED Luis Hernández Vargas — Hato Corozal',
    shortLabel: 'IED LHV',
  },
];
