/**
 * Mapa del sitio para el inicio. Los resúmenes salen del propio contenido del repo
 * (MENU en menu.ts y las páginas de cada ruta). Las cifras de alianzas son las verificadas
 * por Daniel (21-oct-2026). No agregar cifras sin fuente.
 */
import { MENU } from './menu';

const feature = (id: string) => MENU.find((g) => g.id === id)!;

export const ALCANCE = [
  { valor: '716', texto: 'estudiantes de grado 11 en 9 colegios oficiales de Soacha' },
  { valor: '420', texto: 'estudiantes en 20 instituciones de Casanare' },
  { valor: '65', texto: 'instituciones ya aplicaron al menos un simulacro' },
] as const;

export const ALIANZAS_URL = 'https://daniel-alt-pages.github.io/alianzas-react/';

export const RUTAS = [
  { id: 'instituciones', para: 'Colegios y rectores', href: '/landing/instituciones', titulo: feature('instituciones').feature.title, texto: feature('instituciones').feature.text },
  { id: 'plataforma', para: 'Coordinación y docentes', href: '/landing/plataforma', titulo: feature('plataforma').feature.title, texto: feature('plataforma').feature.text },
  { id: 'programas', para: 'Estudiantes y familias', href: '/landing/programas', titulo: 'Programas, simulacros y cursos', texto: 'Compare por necesidad y pague en línea si es estudiante o familia.' },
  { id: 'resultados', para: 'Evidencia', href: '/landing/resultados', titulo: 'Resultados y mensajes 2026-A', texto: 'Puntajes destacados, lo que escribieron estudiantes del Calendario A 2026 y las 65 instituciones con al menos un simulacro.' },
  { id: 'nosotros', para: 'El equipo', href: '/landing/nosotros', titulo: feature('nosotros').feature.title, texto: 'Quiénes somos, nuestro fundador y el equipo de tutores.' },
  { id: 'datos', para: 'Legal', href: '/landing/politica-de-datos', titulo: 'Política de datos y cookies', texto: 'Tratamiento de datos personales según la Ley 1581 de 2012 y el Decreto 1377 de 2013, y cookies del sitio.' },
] as const;
