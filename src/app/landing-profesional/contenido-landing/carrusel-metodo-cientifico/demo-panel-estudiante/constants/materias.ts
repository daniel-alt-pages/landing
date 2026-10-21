export const SHOWCASE_MATERIAS = [
  {
    key: 'lectura crítica',
    label: 'Lectura Crítica',
    color: '#ec4899',
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500/20',
  },
  {
    key: 'matemáticas',
    label: 'Matemáticas',
    color: '#3b82f6',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  {
    key: 'sociales y ciudadanas',
    label: 'Ciencias Sociales',
    color: '#f59e0b',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  {
    key: 'ciencias naturales',
    label: 'Ciencias Naturales',
    color: '#10b981',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  {
    key: 'inglés',
    label: 'Inglés',
    color: '#8b5cf6',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
  },
] as const;

export type ShowcaseMateriaConfig = (typeof SHOWCASE_MATERIAS)[number];
