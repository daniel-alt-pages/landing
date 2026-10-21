import type { Estudiante } from '@shared/types';
import {
  resolveEstudianteDataModule,
  type EstudianteDataOptions,
} from '@features/estudiante/hooks/estudianteDataOptions';
import {
  estudiantePanelCacheKey,
  type EstudiantePanelBundle,
} from '@features/estudiante/lib/estudiantePanelTypes';
import { studentsFromRankingEntries } from '@features/estudiante/lib/studentsFromRankingEntries';
import { CACHE_VERSION } from '@features/simulacro/lib/firestoreService';
import { buildPanelCacheVersion } from '@shared/lib/panelCacheVersion';
import { resolveSimDataCacheTTL } from '@shared/lib/cachePolicy';
import { setPanelScreenCache } from '@shared/lib/panelScreenCache';

function dedupeStudents(studentsArray: Estudiante[]): Estudiante[] {
  const unicosMap = new Map<string, Estudiante>();
  studentsArray.forEach((e) => {
    const idNum = String(e.informacion_personal.numero_identificacion).trim();
    const prev = unicosMap.get(idNum);
    if (!prev || e.puntaje_global > prev.puntaje_global) {
      unicosMap.set(idNum, e);
    }
  });
  return Array.from(unicosMap.values());
}

function isLocalStudentDataMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
  );
}

/** Cache local de allStudents sin disparar lecturas Firestore de chunks. */
function hasPersistedAllStudents(simId: string): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(`${CACHE_VERSION}_allStudents_${simId}`);
}

function mergeOwnStudent(todos: Estudiante[], own: Estudiante | null): Estudiante[] {
  if (!own) return todos;
  const ownId = String(own.informacion_personal?.numero_identificacion ?? '').trim();
  if (!ownId) return todos;
  const inGroup = todos.some(
    (e) =>
      String(e.informacion_personal?.numero_identificacion ?? '').trim() === ownId,
  );
  return inGroup ? todos : dedupeStudents([...todos, own]);
}

export function buildDemoEstudiantePanelBundle(): EstudiantePanelBundle {
  const demoStudent: Estudiante = {
    tipo: 'estudiante',
    informacion_personal: {
      nombres: 'ESTUDIANTE',
      apellidos: 'DEMO',
      tipo_identificacion: 'CC',
      numero_identificacion: 'demo',
      telefono: '',
      municipio: '',
      institucion: '',
    },
    puntaje_global: 345,
    puntajes: {
      'lectura crítica': { puntaje: 72, correctas: 28, total_preguntas: 41 },
      matemáticas: { puntaje: 68, correctas: 19, total_preguntas: 35 },
      'sociales y ciudadanas': { puntaje: 65, correctas: 23, total_preguntas: 35 },
      'ciencias naturales': { puntaje: 70, correctas: 22, total_preguntas: 35 },
      inglés: { puntaje: 58, correctas: 28, total_preguntas: 55 },
    },
  };

  const mockGroup: Estudiante[] = [demoStudent];
  const names = [
    ['ANA', 'GARCIA'],
    ['CARLOS', 'LOPEZ'],
    ['MARIA', 'RODRIGUEZ'],
    ['PEDRO', 'MARTINEZ'],
    ['LAURA', 'HERNANDEZ'],
  ];
  names.forEach(([n, a], i) => {
    const base = 280 + Math.floor(Math.random() * 140);
    mockGroup.push({
      tipo: 'estudiante',
      informacion_personal: {
        nombres: n,
        apellidos: a,
        tipo_identificacion: 'CC',
        numero_identificacion: `mock-${i}`,
        telefono: '',
        municipio: '',
        institucion: '',
      },
      puntaje_global: base,
      puntajes: {
        'lectura crítica': { puntaje: 50 + Math.floor(Math.random() * 40), correctas: 20, total_preguntas: 41 },
        matemáticas: { puntaje: 45 + Math.floor(Math.random() * 40), correctas: 17, total_preguntas: 35 },
        'sociales y ciudadanas': { puntaje: 48 + Math.floor(Math.random() * 35), correctas: 18, total_preguntas: 35 },
        'ciencias naturales': { puntaje: 50 + Math.floor(Math.random() * 35), correctas: 19, total_preguntas: 35 },
        inglés: { puntaje: 40 + Math.floor(Math.random() * 40), correctas: 22, total_preguntas: 55 },
      },
    });
  });

  return {
    studentId: 'demo',
    simId: 'DEMO',
    estudiante: demoStudent,
    todos: mockGroup,
    rankingEntries: mockGroup.map((e, idx) => ({
      nombre: e.informacion_personal.nombres,
      apellidos: e.informacion_personal.apellidos,
      numero_identificacion: e.informacion_personal.numero_identificacion,
      puntaje_global: e.puntaje_global,
      posicion: idx + 1,
      institucion: '',
    })),
    updatedAt: Date.now(),
  };
}

export async function fetchEstudiantePanelBundle(
  studentId: string,
  simHint: string | null,
  options?: EstudianteDataOptions,
): Promise<EstudiantePanelBundle> {
  if (studentId === 'demo') {
    return buildDemoEstudiantePanelBundle();
  }

  const {
    getAllStudents,
    getAppConfig,
    getStudentResults,
    getRanking,
  } = await resolveEstudianteDataModule(options);

  let currentSim = simHint?.trim() || '';
  if (!currentSim) {
    const config = await getAppConfig();
    currentSim = config.activeSimulation;
  }

  // Estudiante: ranking + propio (~2 reads). getAllStudents solo si JSON local o cache ya persistido.
  const [own, rankingEntries] = await Promise.all([
    getStudentResults(studentId, currentSim),
    getRanking(currentSim),
  ]);

  let todos: Estudiante[] = [];
  const canLoadAllStudents =
    isLocalStudentDataMode() || hasPersistedAllStudents(currentSim);

  if (canLoadAllStudents) {
    try {
      todos = dedupeStudents(await getAllStudents(currentSim));
    } catch {
      /* ignore */
    }
  }

  if (todos.length === 0 && rankingEntries.length > 0) {
    todos = dedupeStudents(studentsFromRankingEntries(rankingEntries));
  }

  todos = mergeOwnStudent(todos, own);

  return {
    studentId,
    simId: currentSim,
    estudiante: own ?? null,
    todos,
    rankingEntries,
    updatedAt: Date.now(),
  };
}

/** Persiste bundle completo en panel screen cache. */
export function persistEstudiantePanelBundle(bundle: EstudiantePanelBundle): void {
  if (!bundle?.studentId || !bundle.simId) return;
  const key = estudiantePanelCacheKey(bundle.studentId, bundle.simId);
  const ttl = resolveSimDataCacheTTL(bundle.simId);
  const version = buildPanelCacheVersion({ studentId: bundle.studentId, simId: bundle.simId });
  setPanelScreenCache(key, { ...bundle, updatedAt: Date.now() }, ttl, version);
}
