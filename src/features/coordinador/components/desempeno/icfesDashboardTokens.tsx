import {
    BookOpen,
    Calculator,
    Globe,
    Languages,
    Microscope,
} from 'lucide-react';
import type { IcfesAreaKey, IcfesNivelKey } from '@features/coordinador/lib/icfesCurricularModel';
import { ICFES_AREA_COLORS } from '@features/coordinador/lib/icfesAreaColors';

export const NIVEL_COLORS: Record<IcfesNivelKey, string> = {
    1: '#fb7185',
    2: '#fbbf24',
    3: '#60a5fa',
    4: '#34d399',
};

export const NIVEL_SHORT: Record<IcfesNivelKey, string> = {
    1: 'Mínimo',
    2: 'Básico',
    3: 'Satisfac.',
    4: 'Avanzado',
};

export const AREA_ICONS: Partial<Record<IcfesAreaKey, React.ReactNode>> = {
    'matemáticas': <Calculator size={13} />,
    'lectura crítica': <BookOpen size={13} />,
    'sociales y ciudadanas': <Globe size={13} />,
    'ciencias naturales': <Microscope size={13} />,
    'inglés': <Languages size={13} />,
};

export const AREA_SHORT: Partial<Record<IcfesAreaKey, string>> = {
    'matemáticas': 'Matemáticas',
    'lectura crítica': 'Lectura Crítica',
    'sociales y ciudadanas': 'Sociales',
    'ciencias naturales': 'Ciencias',
    'inglés': 'Inglés',
};

export const AREA_ABBR: Partial<Record<IcfesAreaKey, string>> = {
    'matemáticas': 'MAT',
    'lectura crítica': 'LEC',
    'sociales y ciudadanas': 'SOC',
    'ciencias naturales': 'CIE',
    'inglés': 'ING',
};

/** Acento fijo por área (nav móvil / pills). */
export const AREA_ACCENT: Partial<Record<IcfesAreaKey, string>> = ICFES_AREA_COLORS;

export const COORD_MOBILE_NAV_OFFSET = 'calc(60px + env(safe-area-inset-bottom, 0px) + 8px)';
