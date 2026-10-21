/**
 * Generador determinístico del seed de previews.
 *
 * Calcula estudiantes sintéticos, ranking, estadísticas y respuestas detalladas
 * para los 4 simulacros mostrados en la landing (SG11-08/09/10/19).
 *
 * Salida cacheada en memoria: la primera llamada calcula, las siguientes reutilizan.
 */

import type { Estudiante, EstadisticasGrupo, RespuestaDetallada } from '@shared/types';
import { resolveQuestionSesion } from '@features/coordinador/lib/analisis/questionSession';
import { scoreToNivel } from '@features/coordinador/lib/icfesCurricularModel';
import {
  PREVIEW_AVAILABLE_SIMS,
  PREVIEW_GROUP_SIZE,
  PREVIEW_INSTITUTION_DEPARTAMENTO,
  PREVIEW_INSTITUTION_MUNICIPIO,
  PREVIEW_INSTITUTION_NAME,
  PREVIEW_MATERIAS,
  PREVIEW_SESIONES,
  PREVIEW_STUDENT_APELLIDOS,
  PREVIEW_STUDENT_ID,
  PREVIEW_STUDENT_NOMBRES,
} from './constants';
import { getPreviewQuestionNumbers } from './questionNumbers';
import { APELLIDOS, INSTITUCIONES_OTRAS, NOMBRES_F, NOMBRES_M } from './nombres';
import { hashString, mulberry32, pick, randInt, randNormal } from './prng';

type SimId = (typeof PREVIEW_AVAILABLE_SIMS)[number];

const OPCIONES = ['A', 'B', 'C', 'D'] as const;

const SIM_DIFFICULTY: Record<SimId, number> = {
  'SG11-10': 0.98,
  'SG11-16': 1.0,
  'SG11-08': 0.97,
  'SG11-09': 0.99,
  'SG11-18': 0.96,
};

function genIdentificacion(rand: () => number): string {
  return String(randInt(rand, 1_000_000_000, 1_099_999_999));
}

function genNombreCompleto(rand: () => number): { nombres: string; apellidos: string } {
  const usaFemenino = rand() < 0.5;
  const pool = usaFemenino ? NOMBRES_F : NOMBRES_M;
  return { nombres: pick(rand, pool), apellidos: pick(rand, APELLIDOS) };
}

function genRespuestas(
  rand: () => number,
  materiaKey: string,
  baseAcierto: number,
): RespuestaDetallada[] {
  const numeros = getPreviewQuestionNumbers(materiaKey);
  const respuestas: RespuestaDetallada[] = [];
  for (const numero of numeros) {
    const correcta = pick(rand, OPCIONES);
    const acierto = rand() < baseAcierto;
    const estudiante = acierto ? correcta : pick(rand, OPCIONES.filter((o) => o !== correcta));
    respuestas.push({
      numero,
      respuesta_estudiante: estudiante,
      respuesta_correcta: correcta,
      es_correcta: estudiante === correcta,
      sesion: resolveQuestionSesion(materiaKey, numero),
    } as RespuestaDetallada);
  }
  return respuestas;
}

const NIVEL_GLOBAL_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: 'Bajo',
  2: 'Medio',
  3: 'Alto',
  4: 'Superior',
};

function nivelDesempenoFromGlobal(puntajeGlobal: number): string {
  const n = scoreToNivel(puntajeGlobal);
  return n ? NIVEL_GLOBAL_LABEL[n] : 'Bajo';
}

function buildEstudiante(
  rand: () => number,
  options: {
    simId: SimId;
    id: string;
    nombres: string;
    apellidos: string;
    institucion: string;
    baseSkill: number;
    isFeatured?: boolean;
  }
): Estudiante {
  const { simId, id, nombres, apellidos, institucion, baseSkill, isFeatured = false } = options;
  const dificultad = SIM_DIFFICULTY[simId] ?? 1;

  const puntajes: Estudiante['puntajes'] = {};
  const respuestas: Record<string, RespuestaDetallada[]> = {};

  let puntajeGlobalSum = 0;
  let s1Aciertos = 0;
  let s1Total = 0;
  let s2Aciertos = 0;
  let s2Total = 0;

  for (const materia of PREVIEW_MATERIAS) {
    const noiseRaw = randNormal(rand, 0, 7);
    const noise = Math.max(-18, Math.min(18, noiseRaw));
    const puntajeObjetivo = Math.max(20, Math.min(98, Math.round(baseSkill * dificultad + noise)));
    const acierto = puntajeObjetivo / 100;
    const respuestasMateria = genRespuestas(rand, materia.key, acierto);
    const total = respuestasMateria.length;
    const correctas = respuestasMateria.filter((r) => r.es_correcta).length;
    const puntaje = total > 0 ? Math.round((correctas / total) * 100) : 0;
    puntajes[materia.key] = {
      puntaje,
      correctas,
      total_preguntas: total,
    };
    respuestas[materia.key] = respuestasMateria;
    puntajeGlobalSum += puntaje;

    for (const r of respuestasMateria) {
      const sesion = (r as RespuestaDetallada & { sesion?: string }).sesion;
      if (sesion === 'S1') {
        s1Total += 1;
        if (r.es_correcta) s1Aciertos += 1;
      } else if (sesion === 'S2') {
        s2Total += 1;
        if (r.es_correcta) s2Aciertos += 1;
      }
    }
  }

  const puntajeGlobalBase = puntajeGlobalSum / PREVIEW_MATERIAS.length;
  const puntajeGlobal = Math.max(180, Math.min(485, Math.round(puntajeGlobalBase * 5)));

  return {
    informacion_personal: {
      nombres,
      apellidos,
      tipo_identificacion: 'TI',
      numero_identificacion: id,
      telefono: '3' + String(randInt(rand, 100000000, 199999999)),
      municipio: PREVIEW_INSTITUTION_MUNICIPIO,
      departamento: PREVIEW_INSTITUTION_DEPARTAMENTO,
      institucion,
      correo_electronico: `${id}@demo.seamosgenios.co`,
    },
    tipo: isFeatured ? 'estudiante-demo' : 'estudiante',
    puntajes,
    respuestas_detalladas: respuestas,
    puntaje_global: puntajeGlobal,
    nivel_desempeno: nivelDesempenoFromGlobal(puntajeGlobal),
    fecha: '2026-05-01',
    secciones_completadas: [...PREVIEW_SESIONES],
    sesiones: [...PREVIEW_SESIONES],
    s1_aciertos: s1Aciertos,
    s1_total: s1Total,
    s2_aciertos: s2Aciertos,
    s2_total: s2Total,
  };
}

function buildGroupForSim(simId: SimId): Estudiante[] {
  const rand = mulberry32(hashString(`preview_seed::${simId}`));

  const estudiantes: Estudiante[] = [];

  // Estudiante destacado (el "yo" del preview)
  estudiantes.push(
    buildEstudiante(rand, {
      simId,
      id: PREVIEW_STUDENT_ID,
      nombres: PREVIEW_STUDENT_NOMBRES,
      apellidos: PREVIEW_STUDENT_APELLIDOS,
      institucion: PREVIEW_INSTITUTION_NAME,
      baseSkill: 70,
      isFeatured: true,
    })
  );

  // Resto del grupo (misma institución)
  const groupSize = PREVIEW_GROUP_SIZE - 1;
  const usedIds = new Set<string>([PREVIEW_STUDENT_ID]);

  for (let i = 0; i < groupSize; i++) {
    let id = genIdentificacion(rand);
    while (usedIds.has(id)) id = genIdentificacion(rand);
    usedIds.add(id);

    const nombre = genNombreCompleto(rand);
    const skill = Math.max(30, Math.min(90, randNormal(rand, 60, 11)));
    // Para enriquecer comparativas inter-institucionales el ~18% va a otra institución
    const otraInst = rand() < 0.18 ? pick(rand, INSTITUCIONES_OTRAS) : PREVIEW_INSTITUTION_NAME;
    estudiantes.push(
      buildEstudiante(rand, {
        simId,
        id,
        nombres: nombre.nombres,
        apellidos: nombre.apellidos,
        institucion: otraInst,
        baseSkill: skill,
      })
    );
  }

  return estudiantes;
}

function buildEstadisticasFromGroup(estudiantes: Estudiante[]): EstadisticasGrupo {
  const materias: EstadisticasGrupo['materias'] = {};
  let totalConPuntaje = 0;

  for (const est of estudiantes) {
    if ((est.puntaje_global || 0) > 0) totalConPuntaje += 1;
  }

  for (const materia of PREVIEW_MATERIAS) {
    materias[materia.key] = {};
    const numeros = getPreviewQuestionNumbers(materia.key);
    for (const numero of numeros) {
      const distribucion: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, NR: 0 };
      let correcta = 'A';
      let aciertos = 0;
      let totalRespuestas = 0;
      for (const est of estudiantes) {
        const respuestas = (est.respuestas_detalladas as Record<string, RespuestaDetallada[]> | undefined)?.[
          materia.key
        ];
        if (!respuestas) continue;
        const r = respuestas.find((row) => row.numero === numero);
        if (!r) continue;
        correcta = r.respuesta_correcta;
        if (r.respuesta_estudiante && distribucion[r.respuesta_estudiante] !== undefined) {
          distribucion[r.respuesta_estudiante] += 1;
        } else {
          distribucion.NR += 1;
        }
        if (r.es_correcta) aciertos += 1;
        totalRespuestas += 1;
      }
      const porcentaje = totalRespuestas === 0 ? 0 : Math.round((aciertos / totalRespuestas) * 1000) / 10;
      materias[materia.key][String(numero)] = {
        numero,
        respuesta_correcta: correcta,
        distribucion: distribucion as EstadisticasGrupo['materias'][string][string]['distribucion'],
        porcentaje_acierto: porcentaje,
        total_evaluados: totalRespuestas,
        total_respuestas: totalRespuestas,
        porcentaje_aciertos: porcentaje,
        aciertos,
      };
    }
  }

  return {
    metadata: {
      total_evaluados: totalConPuntaje,
      total_registros: estudiantes.length,
      fecha_generacion: '2026-05-08T15:00:00-05:00',
    },
    materias,
  };
}

export type PreviewSimSeed = {
  estudiantes: Estudiante[];
  estadisticas: EstadisticasGrupo;
};

/** Incrementar al cambiar forma del seed (numeración global, puntajes, sesiones). */
const PREVIEW_SEED_VERSION = 3;
const cache = new Map<string, PreviewSimSeed>();

export function getSimSeed(simId: SimId): PreviewSimSeed {
  const cacheKey = `${simId}::v${PREVIEW_SEED_VERSION}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const estudiantes = buildGroupForSim(simId);
  const estadisticas = buildEstadisticasFromGroup(estudiantes);
  const seed: PreviewSimSeed = { estudiantes, estadisticas };
  cache.set(cacheKey, seed);
  return seed;
}

export function getAllSimSeeds(): Record<SimId, PreviewSimSeed> {
  const out: Partial<Record<SimId, PreviewSimSeed>> = {};
  for (const id of PREVIEW_AVAILABLE_SIMS) {
    out[id] = getSimSeed(id);
  }
  return out as Record<SimId, PreviewSimSeed>;
}

export function getFeaturedStudent(simId: SimId = 'SG11-10'): Estudiante {
  return getSimSeed(simId).estudiantes[0];
}
