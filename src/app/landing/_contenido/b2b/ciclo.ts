/** Ciclo interactivo B2B (referencia HTML de Daniel, 22-oct-2026). Textos exactos dados por Daniel. */

export type NivelCiclo = 'N1' | 'N2' | 'N3';

export const CICLO_PASOS = [
  {
    id: 'evaluar', n: '01', title: 'Evaluar', pregunta: '¿Dónde estamos?',
    corto: 'Línea base real con simulacro tipo Saber 11',
    ejecuta: 'Configura y califica el simulacro diagnosticando percentiles, niveles de desempeño y respuestas por competencia',
    entregable: 'Reporte individual para cada estudiante + tablero institucional de línea base (T0)',
    niveles: ['N1', 'N2', 'N3'] as NivelCiclo[],
  },
  {
    id: 'comprender', n: '02', title: 'Comprender', pregunta: '¿Qué está pasando?',
    corto: 'Analítica de brechas y preguntas críticas',
    ejecuta: 'Matriz de brechas curriculares, comparativa entre salones y benchmark frente a 65 colegios',
    entregable: 'Jornada de socialización directiva y docente con hallazgos priorizados',
    niveles: ['N1', 'N2', 'N3'] as NivelCiclo[],
  },
  {
    id: 'formar', n: '03', title: 'Formar', pregunta: '¿Qué reforzar?',
    corto: 'Clases en vivo sobre errores frecuentes y conceptos clave',
    ejecuta: 'Tutores aplican el ciclo de corrección: pregunta real, análisis del distractor, concepto y estrategia',
    entregable: 'Clases en vivo grabadas, material PDF y práctica en Desafíos',
    niveles: ['N2', 'N3'] as NivelCiclo[],
  },
  {
    id: 'acompanar', n: '04', title: 'Acompañar', pregunta: '¿Quién necesita apoyo?',
    corto: 'Comité directivo, alertas tempranas y encuentros con familias',
    ejecuta: 'Monitorea asistencia, activa alertas y lidera hasta 15 horas de comité con rectoría',
    entregable: 'Actas de compromiso + 2 encuentros con familias y tablero privado',
    niveles: ['N3'] as NivelCiclo[],
  },
  {
    id: 'verificar', n: '05', title: 'Verificar', pregunta: '¿Qué cambió?',
    corto: 'Medición de avance T0, T1 y T2',
    ejecuta: 'Cruza los cortes T0, T1 y T2 por grupo y área',
    entregable: 'Informe comparativo de evolución y cierre de brechas',
    niveles: ['N2', 'N3'] as NivelCiclo[],
  },
  {
    id: 'mejorar', n: '06', title: 'Mejorar', pregunta: '¿Qué sigue?',
    corto: 'Impacto sostenido en Saber 11 y continuidad interciclo',
    ejecuta: 'Cruza resultados oficiales Saber 11 y diseña el plan de la siguiente cohorte',
    entregable: 'Reunión post-Saber 11 + plan de mejora interciclo',
    niveles: ['N3'] as NivelCiclo[],
  },
] as const;

/** Pasos del círculo que aplican a cada filtro (índices 0-5). */
export const CICLO_FILTROS = [
  { id: 'todos', label: 'Ciclo completo (6)', pasos: [0, 1, 2, 3, 4, 5] },
  { id: 'N1', label: 'Nivel 1 Diagnóstico', pasos: [0, 1] },
  { id: 'N2', label: 'Nivel 2 Intervención', pasos: [0, 1, 2, 4] },
  { id: 'N3', label: 'Nivel 3 Mejora continua', pasos: [0, 1, 2, 3, 4, 5] },
] as const;

/**
 * Cadena de 7 eslabones (textos y cobertura de modelo.ts: B2B_CADENA y B2B_COBERTURA).
 * `pasos`: índices del círculo con los que se sincroniza. «Intervenir» no es un paso del círculo:
 * se marca cuando el paso activo es Acompañar (3) o Verificar (4), porque en la cadena va entre ambos.
 */
export const CICLO_CADENA = [
  { title: 'Evaluar', enlace: '¿Dónde estamos?', niveles: ['N1', 'N2', 'N3'], pasos: [0] },
  { title: 'Comprender', enlace: '¿Qué está pasando?', niveles: ['N1', 'N2', 'N3'], pasos: [1] },
  { title: 'Formar', enlace: '¿Qué reforzar?', niveles: ['N2', 'N3'], pasos: [2] },
  { title: 'Acompañar', enlace: '¿Quién necesita apoyo?', niveles: ['N3'], pasos: [3] },
  { title: 'Intervenir', enlace: 'Refuerzo y solución de errores', niveles: ['N2', 'N3'], pasos: [3, 4] },
  { title: 'Verificar', enlace: '¿Qué cambió?', niveles: ['N2', 'N3'], pasos: [4] },
  { title: 'Mejorar', enlace: '¿Qué sigue?', niveles: ['N3'], pasos: [5] },
] as const;
