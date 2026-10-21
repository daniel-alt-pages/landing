/**
 * PRODUCTOS DE EJEMPLO para la página /landing/tienda.
 * Datos locales embebidos: no dependen de app.seamosgenios.org ni de NEXT_PUBLIC_EDUGENIOS_API_URL.
 * Precios en pesos colombianos (COP), enteros. No son ofertas reales.
 */
export type ProductoEjemplo = {
  id: string;
  nombre: string;
  categoria: string;
  precioCop: number;
  imagen: string;
  descripcion: string;
  incluye: string[];
};

export const PRODUCTOS_EJEMPLO: ProductoEjemplo[] = [
  {
    id: 'simulacro-saber11',
    nombre: 'Simulacro Saber 11 completo',
    categoria: 'Simulacro',
    precioCop: 39000,
    imagen: '/landing/productos/simulacro.jpg',
    descripcion: 'Prueba con estructura tipo ICFES en las cinco áreas, con retroalimentación por pregunta.',
    incluye: ['Dos sesiones cronometradas', 'Informe por competencia'],
  },
  {
    id: 'curso-preicfes',
    nombre: 'Curso PreICFES intensivo',
    categoria: 'Curso',
    precioCop: 289000,
    imagen: '/landing/productos/intensivo.jpg',
    descripcion: 'Clases en vivo con tutores y plan de estudio por semanas para preparar el Saber 11.',
    incluye: ['Clases en vivo y grabadas', 'Simulacros de seguimiento'],
  },
  {
    id: 'guias-area',
    nombre: 'Guías por área',
    categoria: 'Material',
    precioCop: 59000,
    imagen: '/landing/productos/curso.jpg',
    descripcion: 'Guías de estudio de Matemáticas, Lectura Crítica, Sociales, Ciencias e Inglés.',
    incluye: ['Teoría resumida', 'Ejercicios resueltos'],
  },
  {
    id: 'desafios',
    nombre: 'Desafíos semanales',
    categoria: 'Práctica',
    precioCop: 89000,
    imagen: '/landing/productos/desafios.jpg',
    descripcion: 'Retos cortos cada semana para mantener el ritmo de práctica antes de la prueba.',
    incluye: ['Retos por área', 'Seguimiento de avance'],
  },
  {
    id: 'ingles',
    nombre: 'Módulo de Inglés',
    categoria: 'Curso',
    precioCop: 129000,
    imagen: '/landing/productos/ingles.jpg',
    descripcion: 'Preparación enfocada en la prueba de Inglés del Saber 11, por niveles.',
    incluye: ['Lecturas y vocabulario', 'Práctica tipo prueba'],
  },
  {
    id: 'paquete-institucional',
    nombre: 'Paquete institucional',
    categoria: 'Colegios',
    precioCop: 2500000,
    imagen: '/landing/productos/vacacional.jpg',
    descripcion: 'Simulacros y plataforma para un grupo de grado 11, con acompañamiento al colegio.',
    incluye: ['Acceso para un grupo', 'Reportes para docentes'],
  },
];

const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const formatoCop = (valor: number) => fmt.format(valor);
