import type { SimulacionEstadisticas } from '@features/simulacro/lib/firestoreService';
import { resolveQuestionSesion } from '@features/coordinador/lib/analisis/questionSession';

export type SimulacroClaveItem = {
    numero: number;
    respuesta_correcta: string;
    sesion: string;
    porcentaje_acierto: number;
};

function normalizeAreaKey(value: string): string {
    return String(value || '')
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export function clavesForMateria(
    stats: SimulacionEstadisticas | null,
    materiaKey: string,
): SimulacroClaveItem[] {
    if (!stats?.materias) return [];

    const target = normalizeAreaKey(materiaKey);
    const materiaEntry = Object.entries(stats.materias).find(
        ([key]) => normalizeAreaKey(key) === target,
    );
    if (!materiaEntry) return [];

    return Object.values(materiaEntry[1])
        .map((pregunta) => {
            const numero = Number(pregunta.numero) || 0;
            const respuesta = String(pregunta.respuesta_correcta || '?')
                .trim()
                .toUpperCase();
            return {
                numero,
                respuesta_correcta: respuesta,
                sesion: resolveQuestionSesion(materiaKey, numero),
                porcentaje_acierto: Number(pregunta.porcentaje_acierto) || 0,
            };
        })
        .filter(
            (item) =>
                item.numero > 0 &&
                item.respuesta_correcta &&
                !item.respuesta_correcta.includes('ANULADA'),
        )
        .sort((a, b) => a.numero - b.numero);
}

export function groupClavesBySesion(items: SimulacroClaveItem[]): {
    sesionKey: string;
    label: string;
    items: SimulacroClaveItem[];
}[] {
    if (items.length === 0) return [];

    const map = new Map<string, SimulacroClaveItem[]>();
    for (const item of items) {
        const key = item.sesion || 'S1';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
    }

    return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([sesionKey, groupItems]) => ({
            sesionKey,
            label: sesionKey === 'S2' ? 'Sesión 2' : 'Sesión 1',
            items: groupItems,
        }));
}
