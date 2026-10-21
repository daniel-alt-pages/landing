'use client';
import type { Estudiante } from '@shared/types';
import { resolveQuestionSesion } from './questionSession';

function withSesionFallback(r: any, idx: number, materia?: string) {
    const numero = r.numero ?? idx + 1;
    const sesionRaw = typeof r.sesion === 'string' ? r.sesion : null;
    const sesion =
        sesionRaw ||
        (materia ? resolveQuestionSesion(materia, numero) : null);
    return {
        numero,
        respuesta_estudiante: r.respuesta_estudiante || r.respuesta || '?',
        respuesta_correcta: r.respuesta_correcta || r.correcta || '?',
        es_correcta: !!r.es_correcta,
        sesion,
    };
}

// Normalize respuestas_detalladas for a single subject
// Supports both array format and object-with-numeric-keys format
export function normalizeSubjectResp(raw: any, materia?: string): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw.map((r: any, idx: number) => withSesionFallback(r, idx, materia));
    }
    if (typeof raw === 'object') {
        return Object.entries(raw)
            .map(([qNum, r]: [string, any]) =>
                withSesionFallback({ ...r, numero: parseInt(qNum) || r.numero }, 0, materia),
            )
            .sort((a, b) => a.numero - b.numero);
    }
    return [];
}

export function getSubjectPuntaje(student: Estudiante, materia: string): { puntaje: number; correctas: number; total_preguntas: number } {
    const puntajes = (student as any).puntajes || {};
    const normalize = (s: string) => String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const direct = puntajes[materia];
    const key = direct ? materia : Object.keys(puntajes).find(k => normalize(k) === normalize(materia));
    const raw = key ? puntajes[key] : undefined;
    if (raw && typeof raw === 'object') {
        return {
            puntaje: Number(raw.puntaje) || 0,
            correctas: Number(raw.correctas) || 0,
            total_preguntas: Number(raw.total_preguntas) || 0,
        };
    }
    return { puntaje: Number(raw) || 0, correctas: 0, total_preguntas: 0 };
}

export function getSubjectRespuestas(student: Estudiante, materia: string): any {
    const respuestas = (student as any).respuestas_detalladas || {};
    const normalize = (s: string) => String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const direct = respuestas[materia];
    if (direct) return direct;
    const key = Object.keys(respuestas).find(k => normalize(k) === normalize(materia));
    return key ? respuestas[key] : undefined;
}

// Group normalized questions by sesion → [{ label, items }]
export function groupBySesion(items: any[], materia?: string): { sesionKey: string; label: string; items: any[] }[] {
    const enriched = items.map((p, idx) => {
        if (p.sesion) return p;
        const numero = p.numero ?? idx + 1;
        return materia
            ? { ...p, sesion: resolveQuestionSesion(materia, numero) }
            : p;
    });
    const hasSesion = enriched.some(p => p.sesion);
    if (!hasSesion) return [{ sesionKey: '', label: '', items: enriched }];
    const map: Record<string, any[]> = {};
    enriched.forEach(p => {
        const k = p.sesion || 'Sin sesión';
        if (!map[k]) map[k] = [];
        map[k].push(p);
    });
    return Object.keys(map).sort().map(k => ({
        sesionKey: k,
        label: k.replace(/^S(\d+)$/, 'Sesión $1'),
        items: map[k],
    }));
}
