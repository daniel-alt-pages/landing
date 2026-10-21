'use client';

import { useMemo } from 'react';
import { Estudiante } from '@shared/types';

interface CorrelationMatrixProps {
    estudiantes: Estudiante[];
}

// Configuración de áreas
const AREAS_CONFIG = [
    { key: 'matematicas', label: 'MAT', name: 'Matemáticas', color: '#3B82F6' },
    { key: 'lectura_critica', label: 'LEC', name: 'Lectura Crítica', color: '#8B5CF6' },
    { key: 'sociales_ciudadanas', label: 'SOC', name: 'Sociales', color: '#F59E0B' },
    { key: 'ciencias_naturales', label: 'CIE', name: 'Ciencias', color: '#10B981' },
    { key: 'ingles', label: 'ING', name: 'Inglés', color: '#EC4899' }
];

// Función para calcular correlación de Pearson
function calcPearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
}

// Función para obtener color según correlación
function getCorrelationColor(r: number): { bg: string; text: string; label: string } {
    const absR = Math.abs(r);
    if (absR >= 0.70) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Fuerte' };
    if (absR >= 0.50) return { bg: 'bg-emerald-500/10', text: 'text-emerald-300', label: 'Moderada' };
    if (absR >= 0.30) return { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Débil' };
    return { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Muy Débil' };
}

export default function CorrelationMatrix({ estudiantes }: CorrelationMatrixProps) {
    const { matrix, insights } = useMemo(() => {
        // Extraer puntajes por área
        const areaScores: Record<string, number[]> = {};
        AREAS_CONFIG.forEach(area => {
            areaScores[area.key] = [];
        });

        // Helper para obtener puntaje con múltiples keys posibles
        const getScore = (est: Estudiante, key: string): number => {
            if (!est.puntajes) return 0;
            // Intentar con la key directa
            if (est.puntajes[key]?.puntaje) return Number(est.puntajes[key].puntaje);
            // Intentar con variaciones comunes (nombres exactos del JSON primero)
            const variations: Record<string, string[]> = {
                'matematicas': ['matemáticas', 'matematicas', 'Matemáticas', 'MATEMATICAS'],
                'lectura_critica': ['lectura crítica', 'lectura_critica', 'Lectura Crítica', 'LECTURA_CRITICA'],
                'sociales_ciudadanas': ['sociales y ciudadanas', 'sociales_ciudadanas', 'Sociales y Ciudadanas', 'SOCIALES_CIUDADANAS'],
                'ciencias_naturales': ['ciencias naturales', 'ciencias_naturales', 'Ciencias Naturales', 'CIENCIAS_NATURALES'],
                'ingles': ['inglés', 'ingles', 'Inglés', 'INGLES']
            };
            for (const variant of (variations[key] || [])) {
                if (est.puntajes[variant]?.puntaje) return Number(est.puntajes[variant].puntaje);
            }
            return 0;
        };

        estudiantes.forEach(est => {
            if (!est.puntajes) return;

            // Contar cuántas áreas tienen puntaje
            const scores = AREAS_CONFIG.map(area => getScore(est, area.key));
            const validScores = scores.filter(s => s > 0).length;

            // Solo incluir si tiene al menos 3 áreas con puntaje
            if (validScores < 3) return;

            AREAS_CONFIG.forEach((area, i) => {
                areaScores[area.key].push(scores[i]);
            });
        });

        // Calcular matriz de correlación
        const correlationMatrix: number[][] = [];
        for (let i = 0; i < AREAS_CONFIG.length; i++) {
            correlationMatrix[i] = [];
            for (let j = 0; j < AREAS_CONFIG.length; j++) {
                if (i === j) {
                    correlationMatrix[i][j] = 1;
                } else if (j < i) {
                    correlationMatrix[i][j] = correlationMatrix[j][i];
                } else {
                    correlationMatrix[i][j] = calcPearsonCorrelation(
                        areaScores[AREAS_CONFIG[i].key],
                        areaScores[AREAS_CONFIG[j].key]
                    );
                }
            }
        }

        // Encontrar correlaciones más fuerte y débil
        let maxCorr = -1, minCorr = 2;
        let maxPair = ['', ''], minPair = ['', ''];

        for (let i = 0; i < AREAS_CONFIG.length; i++) {
            for (let j = i + 1; j < AREAS_CONFIG.length; j++) {
                const corr = correlationMatrix[i][j];
                if (corr > maxCorr) {
                    maxCorr = corr;
                    maxPair = [AREAS_CONFIG[i].label, AREAS_CONFIG[j].label];
                }
                if (corr < minCorr) {
                    minCorr = corr;
                    minPair = [AREAS_CONFIG[i].label, AREAS_CONFIG[j].label];
                }
            }
        }

        return {
            matrix: correlationMatrix,
            insights: { maxCorr, maxPair, minCorr, minPair }
        };
    }, [estudiantes]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    🔗 Correlación entre Áreas
                </h2>
                <p className="text-white/50 mt-1">
                    ¿Los estudiantes fuertes en un área también lo son en otras?
                </p>
            </div>

            {/* Matriz de correlación */}
            <div className="bg-[#0a0b10]/50 backdrop-blur border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Matriz de Correlación de Pearson</h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="p-2"></th>
                                {AREAS_CONFIG.map(area => (
                                    <th key={area.key} className="p-2 text-center text-white/70 font-medium text-sm">
                                        {area.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {AREAS_CONFIG.map((rowArea, i) => (
                                <tr key={rowArea.key}>
                                    <td className="p-2 text-white/70 font-medium text-sm">{rowArea.label}</td>
                                    {AREAS_CONFIG.map((colArea, j) => {
                                        const r = matrix[i]?.[j] ?? 0;
                                        const { bg, text } = getCorrelationColor(r);
                                        const isDiagonal = i === j;

                                        return (
                                            <td key={colArea.key} className="p-1">
                                                <div className={`
                                                    ${isDiagonal ? 'bg-white/5' : bg}
                                                    ${isDiagonal ? 'text-white/30' : text}
                                                    rounded-lg p-3 text-center font-mono font-bold
                                                    transition-all hover:scale-105
                                                `}>
                                                    {r.toFixed(2)}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Leyenda */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-emerald-500"></span>
                        <span className="text-white/60 text-sm">≥ 0.70 Fuerte</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-emerald-500/50"></span>
                        <span className="text-white/60 text-sm">0.50-0.69 Moderada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-amber-500"></span>
                        <span className="text-white/60 text-sm">0.30-0.49 Débil</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-rose-500"></span>
                        <span className="text-white/60 text-sm">&lt; 0.30 Muy Débil</span>
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                    <div className="text-emerald-400 font-bold text-sm mb-2">🔗 Correlación Más Fuerte</div>
                    <div className="text-white text-2xl font-bold">
                        {insights.maxPair[0]} ↔ {insights.maxPair[1]}
                    </div>
                    <div className="text-emerald-300 font-mono mt-1">r = {insights.maxCorr.toFixed(2)}</div>
                    <p className="text-white/50 text-sm mt-2">
                        {insights.maxCorr >= 0.7
                            ? 'Los estudiantes buenos en una suelen serlo en la otra.'
                            : 'Correlación moderada entre estas áreas.'}
                    </p>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-5">
                    <div className="text-rose-400 font-bold text-sm mb-2">⚡ Correlación Más Débil</div>
                    <div className="text-white text-2xl font-bold">
                        {insights.minPair[0]} ↔ {insights.minPair[1]}
                    </div>
                    <div className="text-rose-300 font-mono mt-1">r = {insights.minCorr.toFixed(2)}</div>
                    <p className="text-white/50 text-sm mt-2">
                        {insights.minCorr < 0.3
                            ? 'Áreas independientes. Éxito en una no predice la otra.'
                            : 'Aún existe relación, pero es la más débil.'}
                    </p>
                </div>
            </div>

            {/* Guía de interpretación */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
                <h4 className="text-blue-400 font-bold mb-3">📖 ¿Cómo interpretar esta matriz?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/60">
                    <div>
                        <p className="font-semibold text-white mb-1">¿Qué es "r" (Coeficiente de Pearson)?</p>
                        <p>Mide qué tan relacionadas están dos áreas. Si los estudiantes buenos en una también lo son en otra, r será alto.</p>
                    </div>
                    <div>
                        <p className="font-semibold text-white mb-1">¿Por qué r va de -1 a 1?</p>
                        <ul className="space-y-1">
                            <li>• <span className="text-emerald-400">r = 1.00</span>: Correlación perfecta (suben juntas)</li>
                            <li>• <span className="text-white/50">r = 0.00</span>: Sin relación (independientes)</li>
                            <li>• <span className="text-rose-400">r = -1.00</span>: Correlación inversa</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
