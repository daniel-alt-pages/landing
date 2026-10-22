/**
 * FICHAS DE EJEMPLO para la vista de detalle (/landing/programas/ficha/[id]).
 * Contenido ficticio, guardado en el repo (sin API). Solo se usa si
 * tiendaEjemploActiva() es true. Todo se marca «Ejemplo ilustrativo».
 */
import { TIENDA_EJEMPLO_PRODUCTOS } from './tienda-ejemplo';

export type ResenaEjemplo = { nombre: string; fecha: string; estrellas: number; texto: string };
export type PreguntaEjemplo = { q: string; a: string };
export type FichaEjemplo = {
  descripcion: string[];
  incluye: string[];
  detalles: { label: string; value: string }[];
  promedio: number;
  totalOpiniones: number;
  distribucion: [number, number, number, number, number]; // 5,4,3,2,1 estrellas (conteos)
  resenas: ResenaEjemplo[];
  preguntas: PreguntaEjemplo[];
};

const RESENAS: ResenaEjemplo[] = [
  { nombre: 'Laura M.', fecha: '12 de septiembre de 2026', estrellas: 5, texto: 'Las clases son claras y los simulacros se parecen mucho a la prueba. Mi hija subió su puntaje en matemáticas.' },
  { nombre: 'Andrés R.', fecha: '28 de agosto de 2026', estrellas: 5, texto: 'Muy buena organización. Los horarios se cumplen y los profesores responden las dudas.' },
  { nombre: 'Valentina G.', fecha: '3 de agosto de 2026', estrellas: 4, texto: 'El material es completo. Me habría gustado tener más ejercicios de lectura crítica.' },
  { nombre: 'Camilo P.', fecha: '19 de julio de 2026', estrellas: 4, texto: 'Buen acompañamiento. La plataforma es fácil de usar desde el celular.' },
  { nombre: 'Sofía T.', fecha: '2 de julio de 2026', estrellas: 3, texto: 'Buen contenido, aunque algunas sesiones fueron muy rápidas para mi ritmo.' },
];

const PREGUNTAS: PreguntaEjemplo[] = [
  { q: '¿Las clases quedan grabadas?', a: 'Sí. En este ejemplo, cada sesión queda disponible en la plataforma para repasar.' },
  { q: '¿Puedo pagar con PSE o Nequi?', a: 'Sí, con los medios de pago de Bold que se muestran en esta página.' },
  { q: '¿Cuándo empiezo?', a: 'Al confirmar el pago recibe el acceso por correo. Las fechas son de ejemplo.' },
];

const BASE: Record<string, Omit<FichaEjemplo, 'resenas' | 'preguntas'>> = {
  pase: {
    descripcion: ['Pase de ejemplo con acceso a clases en vivo y simulacros durante el periodo de preparación.', 'Está pensado para estudiantes de grado 11 que quieren organizar su estudio antes de la prueba Saber 11.'],
    incluye: ['Clases en vivo de las 5 áreas', 'Acceso a la plataforma', '4 simulacros tipo Saber 11', 'Informe de resultados por área'],
    detalles: [{ label: 'Duración', value: '12 semanas' }, { label: 'Modalidad', value: 'Virtual en vivo' }, { label: 'Nivel', value: 'Grado 10 y 11' }, { label: 'Intensidad', value: '6 horas por semana' }, { label: 'Certificado', value: 'Sí, de asistencia' }],
    promedio: 4.7, totalOpiniones: 128, distribucion: [96, 22, 6, 2, 2],
  },
  combo: {
    descripcion: ['Combo de ejemplo que reúne el curso completo, simulacros y material impreso en una sola compra.', 'Ideal si quiere una preparación integral con seguimiento de su avance.'],
    incluye: ['Curso completo de las 5 áreas', '8 simulacros tipo Saber 11', 'Cartilla de ejercicios', 'Asesoría de orientación vocacional'],
    detalles: [{ label: 'Duración', value: '20 semanas' }, { label: 'Modalidad', value: 'Virtual y presencial' }, { label: 'Nivel', value: 'Grado 11' }, { label: 'Intensidad', value: '8 horas por semana' }, { label: 'Certificado', value: 'Sí, de aprobación' }],
    promedio: 4.8, totalOpiniones: 86, distribucion: [72, 10, 2, 1, 1],
  },
  simulacro: {
    descripcion: ['Simulacro de ejemplo con preguntas tipo Saber 11 y tiempo controlado, como en la prueba real.', 'Al terminar recibe un informe por área con sus fortalezas y temas por reforzar.'],
    incluye: ['Prueba completa de 2 sesiones', 'Corrección automática', 'Informe de resultados', 'Explicación de respuestas'],
    detalles: [{ label: 'Duración', value: '1 día' }, { label: 'Modalidad', value: 'Virtual' }, { label: 'Nivel', value: 'Grado 11' }, { label: 'Preguntas', value: '254' }, { label: 'Certificado', value: 'No aplica' }],
    promedio: 4.5, totalOpiniones: 54, distribucion: [34, 14, 4, 1, 1],
  },
  material: {
    descripcion: ['Curso de ejemplo con material de estudio por temas y ejercicios resueltos.', 'Avance a su ritmo con lecciones cortas y prácticas al final de cada unidad.'],
    incluye: ['Lecciones en video', 'Guías descargables', 'Bancos de preguntas por tema', 'Soporte por chat'],
    detalles: [{ label: 'Duración', value: '8 semanas' }, { label: 'Modalidad', value: 'Virtual a su ritmo' }, { label: 'Nivel', value: 'Grado 10 y 11' }, { label: 'Intensidad', value: '4 horas por semana' }, { label: 'Certificado', value: 'Sí, de finalización' }],
    promedio: 4.6, totalOpiniones: 41, distribucion: [28, 9, 2, 1, 1],
  },
};

export function fichaEjemploDe(id: string): FichaEjemplo | null {
  const prod = TIENDA_EJEMPLO_PRODUCTOS.find((row) => row.id === id);
  if (!prod) return null;
  const base = BASE[prod.kind || ''] || BASE.pase;
  return { ...base, resenas: RESENAS, preguntas: PREGUNTAS };
}

export const FICHA_EJEMPLO_IDS = TIENDA_EJEMPLO_PRODUCTOS.map((row) => row.id);
