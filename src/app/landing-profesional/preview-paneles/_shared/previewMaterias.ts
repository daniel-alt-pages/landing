import { PREVIEW_MATERIAS } from '../_data/seeds/constants';

/** Claves canónicas UTF-8 (alineadas con Firestore, JSON embebido y seeds). */
export const PREVIEW_MATERIAS_UI = [
  {
    key: PREVIEW_MATERIAS[0].key,
    label: PREVIEW_MATERIAS[0].label,
    short: PREVIEW_MATERIAS[0].short,
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    key: PREVIEW_MATERIAS[1].key,
    label: PREVIEW_MATERIAS[1].label,
    short: PREVIEW_MATERIAS[1].short,
    color: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    key: PREVIEW_MATERIAS[2].key,
    label: 'Sociales',
    short: PREVIEW_MATERIAS[2].short,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    key: PREVIEW_MATERIAS[3].key,
    label: 'Ciencias',
    short: PREVIEW_MATERIAS[3].short,
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    key: PREVIEW_MATERIAS[4].key,
    label: PREVIEW_MATERIAS[4].label,
    short: PREVIEW_MATERIAS[4].short,
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
  },
] as const;

export type PreviewMateriaKey = (typeof PREVIEW_MATERIAS_UI)[number]['key'];
