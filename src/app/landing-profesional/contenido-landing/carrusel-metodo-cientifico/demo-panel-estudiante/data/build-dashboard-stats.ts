import { showcaseGetNivel } from '../constants/performance';
import type { ShowcaseDashboardStats } from '../types/showcase.types';
import type { ShowcaseEmbeddedDashboard } from './embedded-student';
import { getShowcaseSimSnapshot } from './sim-snapshots';

function pct(correctas: number, total: number) {
  return total > 0 ? Math.round((correctas / total) * 100) : 0;
}

/** Deriva métricas del panel según simulacro activo (sin React). */
export function buildShowcaseDashboardStats(
  embedded: ShowcaseEmbeddedDashboard,
  activeSim: string,
): ShowcaseDashboardStats {
  const snap = getShowcaseSimSnapshot(activeSim);
  const ip = embedded.estudiante.informacion_personal;
  const nombre =
    `${ip.nombres.split(' ')[0]} ${ip.apellidos.split(' ')[0]}`.trim().toUpperCase();

  return {
    embedded,
    nombre,
    nivel: showcaseGetNivel(snap.score),
    totalCorrectas: snap.aciertos,
    totalPreguntas: snap.preguntas,
    porcentajeGlobal: pct(snap.aciertos, snap.preguntas),
    superados: Math.max(0, snap.total - snap.puesto),
    percentil: snap.percentil,
    diffPromedio: snap.diffPromedio,
    activeSimScore: snap.score,
    activeSimAciertos: snap.aciertos,
    activeSimPreguntas: snap.preguntas,
    activeSimPuesto: snap.puesto,
    activeSimTotal: snap.total,
    activeSimPercentil: snap.percentil,
    activeSimDiff: snap.diffPromedio,
    activeSimPuntajes: snap.puntajes,
    activeSimSubjectRankings: snap.subjectRankings,
  };
}
