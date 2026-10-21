import type { RespuestaDetallada } from './types';

export function normalizeRespuestas(data: unknown): RespuestaDetallada[] {
    if (!data) return [];
    if (Array.isArray(data)) {
        return data.map((item: Record<string, unknown>) => ({
            numero: item.numero as number,
            respuesta_estudiante: String(item.respuesta_estudiante || item.respuesta || ''),
            respuesta_correcta: String(item.respuesta_correcta || item.correcta || ''),
            es_correcta: Boolean(item.es_correcta),
            sesion: typeof item.sesion === 'string' ? item.sesion : undefined,
            tema_raw: typeof item.tema_raw === 'string' ? item.tema_raw : undefined,
            temas: Array.isArray(item.temas) ? item.temas.filter((t): t is string => typeof t === 'string') : undefined,
            tema_principal: typeof item.tema_principal === 'string' ? item.tema_principal : undefined,
            area: typeof item.area === 'string' ? item.area : undefined,
            competencia: typeof item.competencia === 'string' ? item.competencia : undefined,
            componente: typeof item.componente === 'string' ? item.componente : undefined,
            afirmacion: typeof item.afirmacion === 'string' ? item.afirmacion : undefined,
            evidencia: typeof item.evidencia === 'string' ? item.evidencia : undefined,
            nivel_cognitivo: typeof item.nivel_cognitivo === 'string' ? item.nivel_cognitivo : undefined,
            tipo_texto_o_evidencia: typeof item.tipo_texto_o_evidencia === 'string' ? item.tipo_texto_o_evidencia : undefined,
            fuente_marco: typeof item.fuente_marco === 'string' ? item.fuente_marco : undefined,
        }));
    }
    if (typeof data === 'object') {
        return Object.entries(data as Record<string, Record<string, unknown>>)
            .map(([key, value]) => ({
                numero: parseInt(key, 10),
                respuesta_estudiante: String(value.respuesta_estudiante || value.respuesta || ''),
                respuesta_correcta: String(value.respuesta_correcta || value.correcta || ''),
                es_correcta: Boolean(value.es_correcta),
                sesion: typeof value.sesion === 'string' ? value.sesion : undefined,
                tema_raw: typeof value.tema_raw === 'string' ? value.tema_raw : undefined,
                temas: Array.isArray(value.temas) ? value.temas.filter((t): t is string => typeof t === 'string') : undefined,
                tema_principal: typeof value.tema_principal === 'string' ? value.tema_principal : undefined,
                area: typeof value.area === 'string' ? value.area : undefined,
                competencia: typeof value.competencia === 'string' ? value.competencia : undefined,
                componente: typeof value.componente === 'string' ? value.componente : undefined,
                afirmacion: typeof value.afirmacion === 'string' ? value.afirmacion : undefined,
                evidencia: typeof value.evidencia === 'string' ? value.evidencia : undefined,
                nivel_cognitivo: typeof value.nivel_cognitivo === 'string' ? value.nivel_cognitivo : undefined,
                tipo_texto_o_evidencia: typeof value.tipo_texto_o_evidencia === 'string' ? value.tipo_texto_o_evidencia : undefined,
                fuente_marco: typeof value.fuente_marco === 'string' ? value.fuente_marco : undefined,
            }))
            .sort((a, b) => a.numero - b.numero);
    }
    return [];
}
