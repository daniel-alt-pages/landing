export type ShowcaseRespuestaRaw = {
  respuesta: string;
  correcta: string;
  es_correcta: boolean;
  invalidada?: boolean;
  sesion?: string;
};

export type ShowcaseRespuestaCell = ShowcaseRespuestaRaw & { numero: string };

/** Parte respuestas en S1/S2 como `/estudiante/analisis` (heatmap). */
export function splitShowcaseRespuestasSessions(
  materiaKey: string,
  respuestasMateria: Record<string, ShowcaseRespuestaRaw>,
): { sesion1: ShowcaseRespuestaCell[]; sesion2: ShowcaseRespuestaCell[] } {
  const list: ShowcaseRespuestaCell[] = Object.entries(respuestasMateria)
    .map(([numero, data]) => ({ ...data, numero }))
    .sort((a, b) => Number(a.numero) - Number(b.numero));

  const esSesionUnica =
    materiaKey === 'lectura crítica' || materiaKey === 'inglés';

  if (esSesionUnica) {
    return { sesion1: list, sesion2: [] };
  }

  const tieneTagSesion = list.some((r) => r.sesion);
  if (tieneTagSesion) {
    return {
      sesion1: list.filter((r) => r.sesion === 'S1'),
      sesion2: list.filter((r) => r.sesion === 'S2'),
    };
  }

  let splitIdx = -1;
  for (let i = 1; i < list.length; i++) {
    if (Number(list[i].numero) < Number(list[i - 1].numero)) {
      splitIdx = i;
      break;
    }
  }

  if (splitIdx > 0) {
    return {
      sesion1: list.slice(0, splitIdx),
      sesion2: list.slice(splitIdx),
    };
  }

  const mitad = Math.ceil(list.length / 2);
  return {
    sesion1: list.slice(0, mitad),
    sesion2: list.slice(mitad),
  };
}

export function showcaseMockGroupStats(qNumStr: string) {
  const num = Number(qNumStr) || 1;
  const correctPct = ((num * 17 + 23) % 45) + 35;
  const dist = {
    A: ((num * 3 + 12) % 30) + 10,
    B: ((num * 7 + 2) % 25) + 5,
    C: ((num * 9 + 8) % 20) + 5,
    D: 0,
  };
  dist.D = Math.max(5, 100 - dist.A - dist.B - dist.C);
  return { correctPct, dist };
}
