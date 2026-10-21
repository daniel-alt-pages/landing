import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Estudiante } from '@shared/types';
import { NATIONAL_STATS, AREA_MAP, loadNationalRankings, estimatePercentile, findSimilarSchools, getDepartmentPosition, getPercentileEmoji } from '@features/benchmark/lib/nationalData';

// helpers estadísticos
const calculateMean = (nums: number[]) => {
    if (nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
};

const calculateStdDev = (nums: number[]) => {
    if (nums.length <= 1) return 0;
    const mean = calculateMean(nums);
    const squareDiffs = nums.map(n => Math.pow(n - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / nums.length; // Poblacional (P)
    return Math.sqrt(avgSquareDiff);
};

const calculateMedian = (nums: number[]) => {
    if (nums.length === 0) return 0;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const calculateMode = (nums: number[]) => {
    if (nums.length === 0) return 0;
    const counts: { [k: number]: number } = {};
    let maxCount = 0;
    let mode = nums[0];
    nums.forEach(n => {
        counts[n] = (counts[n] || 0) + 1;
        if (counts[n] > maxCount) {
            maxCount = counts[n];
            mode = n;
        }
    });
    return mode;
};

export interface OtherSimulation {
    id: string;
    name: string;
    date: string;
    students: Estudiante[];
}

export const generateExcelReport = async (
    estudiantesRaw: Estudiante[],
    filename: string = 'Reporte_Master_Suite_Diagnostica_v18_Profesional',
    otherSimulations: OtherSimulation[] = []
) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Seamos Genios Suite AI';
    workbook.created = new Date();

    // ==========================================
    // DEDUPLICACIÓN: Eliminar estudiantes duplicados por ID
    // Si hay duplicados, se conserva el que tenga mayor puntaje_global
    // ==========================================
    const seenIds = new Map<string, Estudiante>();
    const noIdStudents: Estudiante[] = [];
    estudiantesRaw.forEach(e => {
        const id = (e.informacion_personal.numero_identificacion || '').toString().trim();
        if (!id) {
            noIdStudents.push(e);
            return;
        }
        const existing = seenIds.get(id);
        if (!existing || (Number(e.puntaje_global) || 0) > (Number(existing.puntaje_global) || 0)) {
            seenIds.set(id, e);
        }
    });
    const estudiantes = [...seenIds.values(), ...noIdStudents];

    const totalEstudiantes = estudiantes.length;
    const lastRow = Math.max(totalEstudiantes + 1, 2);

    // ==========================================
    // 0. DATA PRE-CALCULATION (Offline Stats)
    // ==========================================
    // Estructura actualizada: counts + studentMap para saber QUIÉN respondió QUÉ
    const questionAnalysis: Record<string, Record<number, {
        failed: number;
        total: number;
        correct: string;
        counts: Record<string, number>;
        studentMap: Record<string, string[]>; // Nuevo: Lista de nombres por opción
    }>> = {};

    estudiantes.forEach(est => {
        if (est.respuestas_detalladas) {
            Object.entries(est.respuestas_detalladas).forEach(([materia, resps]) => {
                if (!questionAnalysis[materia]) questionAnalysis[materia] = {};

                // Normalizar: soportar formato array Y formato objeto { "1": { respuesta, correcta, es_correcta } }
                let items: { numero: number; respuesta_estudiante: string; respuesta_correcta: string; es_correcta: boolean }[] = [];

                if (Array.isArray(resps)) {
                    // Formato array original
                    items = (resps as any[]).map((r: any) => ({
                        numero: r.numero,
                        respuesta_estudiante: r.respuesta_estudiante || r.respuesta || '',
                        respuesta_correcta: r.respuesta_correcta || r.correcta || '?',
                        es_correcta: !!r.es_correcta,
                    }));
                } else if (resps && typeof resps === 'object') {
                    // Formato objeto: { "1": { respuesta: "B", correcta: "B", es_correcta: true }, ... }
                    items = Object.entries(resps as Record<string, any>).map(([qNum, r]) => ({
                        numero: parseInt(qNum) || 0,
                        respuesta_estudiante: r.respuesta_estudiante || r.respuesta || '',
                        respuesta_correcta: r.respuesta_correcta || r.correcta || '?',
                        es_correcta: !!r.es_correcta,
                    }));
                } else {
                    return; // Skip invalid
                }

                items.forEach(r => {
                    if (!questionAnalysis[materia][r.numero]) {
                        questionAnalysis[materia][r.numero] = {
                            failed: 0,
                            total: 0,
                            correct: r.respuesta_correcta || '?',
                            counts: {},
                            studentMap: {}
                        };
                    }
                    questionAnalysis[materia][r.numero].total++;

                    // Sanitizar opción
                    const rawOption = r.respuesta_estudiante;
                    const pct = (rawOption && rawOption.trim() !== '') ? rawOption.trim().toUpperCase() : 'NR';

                    // Contadores
                    questionAnalysis[materia][r.numero].counts[pct] = (questionAnalysis[materia][r.numero].counts[pct] || 0) + 1;

                    // Guardar Estudiante en la lista de la opción
                    if (!questionAnalysis[materia][r.numero].studentMap[pct]) {
                        questionAnalysis[materia][r.numero].studentMap[pct] = [];
                    }
                    const nombreCompleto = `${est.informacion_personal.nombres} ${est.informacion_personal.apellidos}`.trim() || est.informacion_personal.numero_identificacion;
                    questionAnalysis[materia][r.numero].studentMap[pct].push(nombreCompleto.toString());

                    if (!r.es_correcta) questionAnalysis[materia][r.numero].failed++;
                });
            });
        }
    });

    // DEFINED NAMES (Globales) para Buscador
    workbook.definedNames.add(`BASE_DATOS!$A$2:$A$${lastRow}`, 'ID_LIST');

    // ==========================================
    // 1. HOJA DE DASHBOARD (Principal)
    // ==========================================
    const dashSheet = workbook.addWorksheet('Dashboard Ejecutivo', { views: [{ showGridLines: false, zoomScale: 90 }] });

    dashSheet.mergeCells('B2:K3');
    const title = dashSheet.getCell('B2');
    title.value = 'Tablero de Inteligencia Académica 📊';
    title.font = { name: 'Segoe UI', size: 24, bold: true, color: { argb: 'FF1E293B' } };
    title.alignment = { vertical: 'middle' };

    // Calcular estadísticas directamente en TypeScript (más robusto que fórmulas de celdas)
    const puntajesGlobales = estudiantes.map(e => Number(e.puntaje_global) || 0).filter(p => p > 0);
    const promedioGlobal = puntajesGlobales.length > 0 ? puntajesGlobales.reduce((a, b) => a + b, 0) / puntajesGlobales.length : 0;
    const maxGlobal = puntajesGlobales.length > 0 ? Math.max(...puntajesGlobales) : 0;
    const minGlobal = puntajesGlobales.length > 0 ? Math.min(...puntajesGlobales) : 0;
    const exitoCount = puntajesGlobales.filter(p => p >= 300).length;
    const porcentajeExito = puntajesGlobales.length > 0 ? exitoCount / puntajesGlobales.length : 0;

    // Subtítulo con total evaluados y fuente de datos
    dashSheet.getCell('B4').value = `Análisis de ${puntajesGlobales.length} estudiantes evaluados (de ${totalEstudiantes} registrados) — Datos: Simulacro Seamos Genios`;
    dashSheet.getCell('B4').font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };

    // Estilos reutilizables
    const labelFont = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF64748B' } };

    const createKpiCard = (col: string, title: string, value: number, numFmt: string, color: string) => {
        dashSheet.getCell(`${col}6`).value = title;
        dashSheet.getCell(`${col}6`).font = labelFont;
        dashSheet.getCell(`${col}7`).value = value;
        dashSheet.getCell(`${col}7`).font = { name: 'Segoe UI', size: 22, bold: true, color: { argb: color } };
        dashSheet.getCell(`${col}7`).numFmt = numFmt;
        dashSheet.getCell(`${col}7`).border = { bottom: { style: 'thick', color: { argb: color } } };
    };

    createKpiCard('C', 'PROMEDIO GLOBAL', promedioGlobal, '0.0', 'FF2563EB');
    createKpiCard('E', 'MÁXIMO ALCANZADO', maxGlobal, '0.0', 'FF16A34A');
    createKpiCard('G', 'MÍNIMO REGISTRADO', minGlobal, '0.0', 'FFDC2626');

    dashSheet.getCell('I6').value = '% ÉXITO (>300)';
    dashSheet.getCell('I6').font = labelFont;
    dashSheet.getCell('I7').value = porcentajeExito;
    dashSheet.getCell('I7').font = { name: 'Segoe UI', size: 22, bold: true, color: { argb: 'FFEAB308' } };
    dashSheet.getCell('I7').numFmt = '0%';
    dashSheet.getCell('I7').border = { bottom: { style: 'thick', color: { argb: 'FFEAB308' } } };

    dashSheet.getCell('C10').value = 'Rendimiento por Competencias';
    dashSheet.getCell('C10').font = { size: 14, bold: true };

    const hRow = 12;
    ['ÁREA', 'PROM.', 'DSV.', 'VISUALIZACIÓN DE DESEMPEÑO'].forEach((t, i) => {
        const c = String.fromCharCode(67 + i); // C...
        dashSheet.getCell(`${c}${hRow}`).value = t;
        dashSheet.getCell(`${c}${hRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        dashSheet.getCell(`${c}${hRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        dashSheet.getCell(`${c}${hRow}`).alignment = { horizontal: 'center' };
    });

    const areasConfig = [
        { name: 'Matemáticas', key: 'matemáticas' },
        { name: 'Lectura Crítica', key: 'lectura crítica' },
        { name: 'Sociales', key: 'sociales y ciudadanas' },
        { name: 'Ciencias', key: 'ciencias naturales' },
        { name: 'Inglés', key: 'inglés' }
    ];

    let r = 13;
    areasConfig.forEach(area => {
        const scores = estudiantes.map(e => Number(e.puntajes?.[area.key]?.puntaje) || 0).filter(s => s > 0);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const stdDevVal = calculateStdDev(scores);

        dashSheet.getCell(`C${r}`).value = area.name;
        dashSheet.getCell(`C${r}`).font = { bold: true };
        dashSheet.getCell(`D${r}`).value = avgScore;
        dashSheet.getCell(`D${r}`).numFmt = '0.0';
        dashSheet.getCell(`E${r}`).value = stdDevVal;
        dashSheet.getCell(`E${r}`).numFmt = '0.0';
        // Barra visual proporcional al promedio
        const barLength = Math.round(avgScore / 5);
        dashSheet.getCell(`F${r}`).value = '█'.repeat(barLength);
        dashSheet.getCell(`F${r}`).font = { color: { argb: 'FF2563EB' }, bold: true };
        r++;
    });

    // Heatmap - Calculado en TypeScript
    const rMatriz = 22;
    dashSheet.getCell(`C${rMatriz}`).value = 'Mapa de Calor: Distribución de Desempeño';
    dashSheet.getCell(`C${rMatriz}`).font = { size: 14, bold: true };
    const hMatriz = rMatriz + 2;
    ['COMPETENCIA', 'BAJO (0-30)', 'BÁSICO (31-60)', 'ALTO (61-80)', 'SUPERIOR (81+)'].forEach((t, i) => {
        const c = String.fromCharCode(67 + i);
        dashSheet.getCell(`${c}${hMatriz}`).value = t;
        dashSheet.getCell(`${c}${hMatriz}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
        dashSheet.getCell(`${c}${hMatriz}`).font = { size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
        dashSheet.getCell(`${c}${hMatriz}`).alignment = { horizontal: 'center' };
    });

    const levels = [
        { min: 0, max: 30, col: 'D' },
        { min: 31, max: 60, col: 'E' },
        { min: 61, max: 80, col: 'F' },
        { min: 81, max: 100, col: 'G' }
    ];

    let rM = hMatriz + 1;
    const divTotal = Math.max(puntajesGlobales.length, 1); // Usar solo estudiantes activos (puntaje > 0)
    areasConfig.forEach(area => {
        dashSheet.getCell(`C${rM}`).value = area.name;
        dashSheet.getCell(`C${rM}`).font = { bold: true };

        // Calcular distribución por niveles directamente
        const areaScores = estudiantes.map(e => Number(e.puntajes?.[area.key]?.puntaje) || 0).filter(s => s > 0);
        levels.forEach(lvl => {
            const count = areaScores.filter(s => s >= lvl.min && s <= lvl.max).length;
            const percentage = count / divTotal;
            dashSheet.getCell(`${lvl.col}${rM}`).value = percentage;
            dashSheet.getCell(`${lvl.col}${rM}`).numFmt = '0%';
            dashSheet.getCell(`${lvl.col}${rM}`).font = { size: 9 };

            // Color condicional para el heatmap
            let bgColor = 'FFFFFFFF';
            if (percentage > 0.3) bgColor = 'FFFF6B6B'; // Rojo si > 30%
            else if (percentage > 0.2) bgColor = 'FFFFEB9C'; // Amarillo si > 20%
            else if (percentage > 0.1) bgColor = 'FF92D050'; // Verde si > 10%

            if (lvl.col !== 'D') { // No colorear "Bajo" igual
                dashSheet.getCell(`${lvl.col}${rM}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            }
        });
        rM++;
    });

    dashSheet.getColumn(3).width = 20; // AREA
    dashSheet.getColumn(4).width = 15; // PROM
    dashSheet.getColumn(5).width = 15; // DSV
    dashSheet.getColumn(6).width = 40; // VISUALIZACION
    dashSheet.getColumn(7).width = 15;
    dashSheet.getColumn(9).width = 25;

    // ==========================================
    // 3. HOJA DE ESTADÍSTICAS AVANZADAS
    // ==========================================
    const statsSheet = workbook.addWorksheet('Estadísticas Avanzadas', { views: [{ showGridLines: false }] });
    statsSheet.mergeCells('B2:H3');
    statsSheet.getCell('B2').value = '🔬 ANÁLISIS ESTADÍSTICO PROFUNDO';
    statsSheet.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FF4338CA' } };
    statsSheet.mergeCells('B4:I4');
    statsSheet.getCell('B4').value = `Basado en ${puntajesGlobales.length} estudiantes con puntaje > 0 — Fuente: Simulacro Seamos Genios`;
    statsSheet.getCell('B4').font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
    statsSheet.getCell('B4').alignment = { horizontal: 'center' };

    const hSt = 5;
    const statsHeaders = ['COMPETENCIA', 'PROMEDIO', 'MEDIANA', 'MODA', 'MÍN', 'MÁX', 'DESVIACIÓN', 'VAR %'];
    const statsCols = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    statsCols.forEach((c, i) => {
        statsSheet.getCell(`${c}${hSt}`).value = statsHeaders[i];
        statsSheet.getCell(`${c}${hSt}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
        statsSheet.getCell(`${c}${hSt}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    let rSt = 6;
    areasConfig.forEach(area => {
        const scores = estudiantes.map(e => Number(e.puntajes?.[area.key]?.puntaje) || 0).filter(s => s > 0);
        statsSheet.getCell(`B${rSt}`).value = area.name;
        statsSheet.getCell(`C${rSt}`).value = calculateMean(scores);
        statsSheet.getCell(`D${rSt}`).value = calculateMedian(scores);
        statsSheet.getCell(`E${rSt}`).value = calculateMode(scores);
        statsSheet.getCell(`F${rSt}`).value = Math.min(...scores);
        statsSheet.getCell(`G${rSt}`).value = Math.max(...scores);
        statsSheet.getCell(`H${rSt}`).value = calculateStdDev(scores);
        statsSheet.getCell(`I${rSt}`).value = scores.length > 0 ? (calculateStdDev(scores) / calculateMean(scores)) : 0;
        ['C', 'D', 'E', 'F', 'G', 'H'].forEach(c => statsSheet.getCell(`${c}${rSt}`).numFmt = '0.0');
        statsSheet.getCell(`I${rSt}`).numFmt = '0.0%';
        rSt++;
    });
    // Ajuste de anchos para evitar cortes
    statsSheet.getColumn(2).width = 25; // Competencia
    statsSheet.getColumn(3).width = 15; // Promedio
    statsSheet.getColumn(4).width = 15; // Mediana
    statsSheet.getColumn(5).width = 15; // Moda
    statsSheet.getColumn(6).width = 10; // Min
    statsSheet.getColumn(7).width = 10; // Max
    statsSheet.getColumn(8).width = 15; // Desviacion
    statsSheet.getColumn(9).width = 15; // Var %

    // ==========================================
    // 4. HOJA RANKING
    // ==========================================
    const rankSheet = workbook.addWorksheet('Ranking Estudiantes', { views: [{ showGridLines: false }] });
    rankSheet.mergeCells('B2:E3');
    rankSheet.getCell('B2').value = '🏆 CUADRO DE HONOR Y RANKING';
    rankSheet.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FFD97706' } };

    const hR = 5;
    rankSheet.getCell(`B${hR}`).value = 'PUESTO';
    rankSheet.getCell(`C${hR}`).value = 'ESTUDIANTE';
    rankSheet.getCell(`D${hR}`).value = 'GLOBAL';
    rankSheet.getCell(`E${hR}`).value = 'MEDALLA';
    ['B', 'C', 'D', 'E'].forEach(c => {
        rankSheet.getCell(`${c}${hR}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        rankSheet.getCell(`${c}${hR}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };
    });

    const sortedStudents = [...estudiantes].sort((a, b) => (Number(b.puntaje_global) || 0) - (Number(a.puntaje_global) || 0));
    let rRank = 6;
    sortedStudents.forEach((est, idx) => {
        rankSheet.getCell(`B${rRank}`).value = idx + 1;
        rankSheet.getCell(`C${rRank}`).value = `${est.informacion_personal.nombres} ${est.informacion_personal.apellidos}`;
        rankSheet.getCell(`D${rRank}`).value = Number(est.puntaje_global) || 0;
        if (idx === 0) rankSheet.getCell(`E${rRank}`).value = '🥇 ORO';
        else if (idx === 1) rankSheet.getCell(`E${rRank}`).value = '🥈 PLATA';
        else if (idx === 2) rankSheet.getCell(`E${rRank}`).value = '🥉 BRONCE';
        if (idx < 3) rankSheet.getRow(rRank).font = { bold: true };
        rankSheet.getCell(`E${rRank}`).font = { color: { argb: 'FFD97706' } };
        rRank++;
    });
    rankSheet.getColumn(2).width = 10;
    rankSheet.getColumn(3).width = 35;
    rankSheet.getColumn(4).width = 15;
    rankSheet.getColumn(5).width = 15;

    // ==========================================
    // 5. HOJA BENCHMARKING
    // ==========================================
    const benchSheet = workbook.addWorksheet('Benchmarking_Institucional', { views: [{ showGridLines: false }] });
    benchSheet.mergeCells('B2:J3'); // Expanded to J
    const benchTitle = benchSheet.getCell('B2');
    benchTitle.value = '🏛️ BENCHMARKING: BALANCE POR INSTITUCIÓN';
    benchTitle.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    benchTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
    benchTitle.alignment = { vertical: 'middle', horizontal: 'center' };

    const instMap = new Map<string, Estudiante[]>();
    estudiantes.forEach(e => {
        const inst = e.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)';
        if (!instMap.has(inst)) instMap.set(inst, []);
        instMap.get(inst)?.push(e);
    });

    const hBench = 5;
    const benchHeaders = ['INSTITUCIÓN', 'EVALUADOS', 'PROM. GLOBAL', 'VISUALIZACIÓN', 'MATEMÁTICAS', 'LECTURA', 'SOCIALES', 'CIENCIAS', 'INGLÉS'];
    const benchKeys = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    benchKeys.forEach((k, i) => {
        benchSheet.getCell(`${k}${hBench}`).value = benchHeaders[i];
        benchSheet.getCell(`${k}${hBench}`).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        benchSheet.getCell(`${k}${hBench}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
        benchSheet.getCell(`${k}${hBench}`).alignment = { horizontal: 'center' };
    });

    let rBench = 6;
    Array.from(instMap.keys()).sort().forEach(instName => {
        const group = instMap.get(instName) || [];
        const count = group.length;
        const sum = (fieldAccessor: (e: Estudiante) => any) => group.reduce((acc, curr) => acc + (Number(fieldAccessor(curr)) || 0), 0);
        const avgGlobal = sum(e => e.puntaje_global) / count;

        benchSheet.getCell(`B${rBench}`).value = instName;
        benchSheet.getCell(`C${rBench}`).value = count;
        benchSheet.getCell(`D${rBench}`).value = avgGlobal;
        const barLen = Math.round(avgGlobal / 20);
        benchSheet.getCell(`E${rBench}`).value = "█".repeat(barLen);
        benchSheet.getCell(`E${rBench}`).font = { color: { argb: 'FF3B82F6' }, size: 8 };
        benchSheet.getCell(`E${rBench}`).alignment = { vertical: 'middle' };

        benchSheet.getCell(`F${rBench}`).value = sum(e => e.puntajes?.['matemáticas']?.puntaje) / count;
        benchSheet.getCell(`G${rBench}`).value = sum(e => e.puntajes?.['lectura crítica']?.puntaje) / count;
        benchSheet.getCell(`H${rBench}`).value = sum(e => e.puntajes?.['sociales y ciudadanas']?.puntaje) / count;
        benchSheet.getCell(`I${rBench}`).value = sum(e => e.puntajes?.['ciencias naturales']?.puntaje) / count;
        benchSheet.getCell(`J${rBench}`).value = sum(e => e.puntajes?.['inglés']?.puntaje) / count;

        benchSheet.getRow(rBench).font = { name: 'Segoe UI', size: 10 };
        benchSheet.getCell(`B${rBench}`).font = { bold: true };
        benchSheet.getCell(`D${rBench}`).font = { bold: true, color: { argb: 'FF1E40AF' } };

        const colorize = (cellAddr: string, val: number) => {
            let color = 'FF374151';
            if (val >= 60) color = 'FF166534';
            else if (val >= 50) color = 'FFCA8A04';
            else color = 'FF991B1B';
            benchSheet.getCell(cellAddr).font = { color: { argb: color }, bold: true };
        };
        colorize(`F${rBench}`, benchSheet.getCell(`F${rBench}`).value as number);
        colorize(`G${rBench}`, benchSheet.getCell(`G${rBench}`).value as number);
        colorize(`H${rBench}`, benchSheet.getCell(`H${rBench}`).value as number);
        colorize(`I${rBench}`, benchSheet.getCell(`I${rBench}`).value as number);
        colorize(`J${rBench}`, benchSheet.getCell(`J${rBench}`).value as number);

        ['D', 'F', 'G', 'H', 'I', 'J'].forEach(c => benchSheet.getCell(`${c}${rBench}`).numFmt = '0.0');
        rBench++;
    });
    benchSheet.getColumn(2).width = 40; benchSheet.getColumn(3).width = 12; benchSheet.getColumn(4).width = 15; benchSheet.getColumn(5).width = 25;
    ['F', 'G', 'H', 'I', 'J'].forEach((_, i) => benchSheet.getColumn(i + 6).width = 15);

    // ==========================================
    // 6. HOJA 6: ANÁLISIS DE RIESGO DE PREGUNTAS (ENRIQUECIDO 2.0 + PRECISIÓN)
    // ==========================================
    const qSheet = workbook.addWorksheet('Análisis Preguntas Críticas', { views: [{ showGridLines: false }] });

    // Header Maestro
    qSheet.mergeCells('B2:N3'); // Expandido hasta N
    const qTitle = qSheet.getCell('B2');
    qTitle.value = '🚨 DIAGNÓSTICO PROFUNDO: ANÁLISIS DE ERRORES Y DISTRACTORES';
    qTitle.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    qTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } };
    qTitle.alignment = { vertical: 'middle', horizontal: 'center' };

    // Subtítulo Explicativo
    qSheet.mergeCells('B4:N4');
    qSheet.getCell('B4').value = "Esta hoja identifica preguntas críticas (>40% fallo) y desglosa la intención de respuesta. Los porcentajes incluyen decimales para mayor precisión.";
    qSheet.getCell('B4').font = { italic: true, color: { argb: 'FF4B5563' } };

    const hQ = 6;
    // Estructura de Columnas Ampliada con NR
    const qHeaders = [
        'ÁREA',
        'PREGUNTA',
        'TASA DE FALLO',
        'NIVEL DE RIESGO',
        'CORRECTA',
        'EVALUADOS',
        '% A',
        '% B',
        '% C',
        '% D',
        '% NR', // Nueva Columna NR
        'DISTRACTOR MÁS FUERTE'
    ];
    const qCols = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];

    qCols.forEach((c, i) => {
        qSheet.getCell(`${c}${hQ}`).value = qHeaders[i];
        qSheet.getCell(`${c}${hQ}`).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        qSheet.getCell(`${c}${hQ}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7F1D1D' } };
        qSheet.getCell(`${c}${hQ}`).alignment = { horizontal: 'center', wrapText: true };
    });

    let rQ = 7;
    let foundCritical = false;

    Object.entries(questionAnalysis).forEach(([materia, questions]) => {
        const sortedQs = Object.entries(questions)
            .map(([qNum, stat]) => ({ num: qNum, ...stat, rate: stat.failed / stat.total }))
            // 🚫 Filtrar preguntas anuladas
            .filter(q => !String(q.correct || '').toUpperCase().includes('ANULADA'))
            .sort((a, b) => b.rate - a.rate);

        sortedQs.forEach(q => {
            if (q.rate > 0.40) {
                foundCritical = true;

                const total = Math.max(q.total, 1);

                // Sanitización y Suma Segura
                let cA = 0, cB = 0, cC = 0, cD = 0, cNR = 0;
                Object.entries(q.counts).forEach(([k, v]) => {
                    const key = k.toUpperCase().trim();
                    if (key === 'A') cA += v;
                    else if (key === 'B') cB += v;
                    else if (key === 'C') cC += v;
                    else if (key === 'D') cD += v;
                    else cNR += v;
                });

                const pA = cA / total;
                const pB = cB / total;
                const pC = cC / total;
                const pD = cD / total;
                const pNR = cNR / total;

                // Distractor Analysis
                const options = [{ l: 'A', v: pA }, { l: 'B', v: pB }, { l: 'C', v: pC }, { l: 'D', v: pD }];
                const distractors = options.filter(o => o.l !== q.correct.toUpperCase().trim());
                distractors.sort((a, b) => b.v - a.v);
                const topDistractor = distractors[0];

                qSheet.getCell(`B${rQ}`).value = materia.toUpperCase();
                qSheet.getCell(`C${rQ}`).value = Number(q.num);
                qSheet.getCell(`D${rQ}`).value = q.rate;

                const riskBars = Math.round(q.rate * 15);
                qSheet.getCell(`E${rQ}`).value = "▓".repeat(riskBars);
                qSheet.getCell(`E${rQ}`).font = { color: { argb: 'FFEF4444' }, size: 9 };

                qSheet.getCell(`F${rQ}`).value = q.correct;
                qSheet.getCell(`F${rQ}`).font = { bold: true, color: { argb: 'FF16A34A' } };
                qSheet.getCell(`F${rQ}`).alignment = { horizontal: 'center' };

                qSheet.getCell(`G${rQ}`).value = q.total;

                qSheet.getCell(`H${rQ}`).value = pA;
                qSheet.getCell(`I${rQ}`).value = pB;
                qSheet.getCell(`J${rQ}`).value = pC;
                qSheet.getCell(`K${rQ}`).value = pD;
                qSheet.getCell(`L${rQ}`).value = pNR;

                // Resaltar Correcta
                const colMap: { [k: string]: string } = { 'A': 'H', 'B': 'I', 'C': 'J', 'D': 'K' };
                const cleanCorrect = q.correct.toUpperCase().trim();
                if (colMap[cleanCorrect]) {
                    qSheet.getCell(`${colMap[cleanCorrect]}${rQ}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
                    qSheet.getCell(`${colMap[cleanCorrect]}${rQ}`).font = { bold: true, color: { argb: 'FF166534' } };
                }

                // Distractor Info
                if (topDistractor && topDistractor.v > 0) {
                    const isHigh = topDistractor.v > 0.30;
                    qSheet.getCell(`M${rQ}`).value = `Opción ${topDistractor.l} (${(topDistractor.v * 100).toFixed(1)}%)`;
                    if (isHigh) {
                        qSheet.getCell(`M${rQ}`).font = { color: { argb: 'FFB91C1C' }, bold: true };
                        qSheet.getCell(`M${rQ}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                    }
                } else {
                    qSheet.getCell(`M${rQ}`).value = "-";
                }

                // Decimales para evitar confusión "101%"
                ['D', 'H', 'I', 'J', 'K', 'L'].forEach(c => qSheet.getCell(`${c}${rQ}`).numFmt = '0.0%');

                qSheet.getRow(rQ).border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
                rQ++;
            }
        });
    });

    if (!foundCritical) {
        qSheet.getCell('B7').value = "¡Excelente! No se detectaron preguntas con margen de error superior al 40%.";
        qSheet.mergeCells('B7:L7'); // Ajustar merge si no hay datos
    }

    qSheet.getColumn(2).width = 25;
    qSheet.getColumn(3).width = 12;
    qSheet.getColumn(4).width = 15;
    qSheet.getColumn(5).width = 25;
    qSheet.getColumn(6).width = 12;
    qSheet.getColumn(7).width = 12;
    ['H', 'I', 'J', 'K', 'L'].forEach((_, i) => qSheet.getColumn(i + 8).width = 9);
    qSheet.getColumn(13).width = 25;

    // ==========================================
    // 7. HOJA 7: SEGMENTACIÓN DE ESTUDIANTES (AUDITORÍA DE RESPUESTAS)
    // ==========================================
    const segSheet = workbook.addWorksheet('Segmentación de Errores', { views: [{ showGridLines: false }] });

    segSheet.mergeCells('B2:F3');
    const segTitle = segSheet.getCell('B2');
    segTitle.value = '📋 AUDITORÍA NOMINAL DE RESPUESTAS CRÍTICAS';
    segTitle.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    segTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Índigo
    segTitle.alignment = { vertical: 'middle', horizontal: 'center' };

    segSheet.mergeCells('B4:F4');
    segSheet.getCell('B4').value = "Listado de estudiantes clasificados por opción de respuesta en las preguntas con alta tasa de fallo.";
    segSheet.getCell('B4').font = { italic: true, color: { argb: 'FF4B5563' } };

    let rS = 6;
    const optionsList = ['A', 'B', 'C', 'D', 'NR'];
    const colMapS = ['B', 'C', 'D', 'E', 'F'];

    Object.entries(questionAnalysis).forEach(([materia, questions]) => {
        const sortedQsS = Object.entries(questions)
            .map(([qNum, stat]) => ({ num: qNum, ...stat, rate: stat.failed / stat.total }))
            // 🚫 Filtrar preguntas anuladas
            .filter(q => !String(q.correct || '').toUpperCase().includes('ANULADA'))
            .sort((a, b) => b.rate - a.rate);

        sortedQsS.forEach(q => {
            if (q.rate > 0.40) {
                // Encabezado de Pregunta
                segSheet.mergeCells(`B${rS}:F${rS}`);
                const headCell = segSheet.getCell(`B${rS}`);
                headCell.value = `${materia.toUpperCase()} - PREGUNTA ${q.num} (Correcta: ${q.correct})`;
                headCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
                headCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Gris oscuro visual
                headCell.alignment = { horizontal: 'left', indent: 1 };
                rS++;

                // Encabezados de Opciones
                optionsList.forEach((opt, idx) => {
                    const cell = segSheet.getCell(`${colMapS[idx]}${rS}`);
                    const count = q.studentMap[opt] ? q.studentMap[opt].length : 0;
                    cell.value = `Opción ${opt} (${count})`;
                    cell.font = { bold: true, size: 9 };
                    cell.alignment = { horizontal: 'center' };
                    cell.border = { bottom: { style: 'medium' } };

                    // Colores de encabezado
                    if (opt === q.correct.toUpperCase().trim()) {
                        cell.font.color = { argb: 'FF166534' }; // Verde
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
                    } else if (count > 0 && (count / q.total) > 0.25) {
                        // Distractor considerable (>25%)
                        cell.font.color = { argb: 'FF991B1B' };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                    }
                });
                rS++;

                // Listar Estudiantes (Encontrar el maximo de filas necesarias)
                let maxRows = 0;
                optionsList.forEach(opt => {
                    if (q.studentMap[opt] && q.studentMap[opt].length > maxRows) maxRows = q.studentMap[opt].length;
                });

                for (let i = 0; i < maxRows; i++) {
                    optionsList.forEach((opt, idx) => {
                        const studentName = q.studentMap[opt] ? q.studentMap[opt][i] : null;
                        if (studentName) {
                            const cell = segSheet.getCell(`${colMapS[idx]}${rS + i}`);
                            cell.value = studentName;
                            cell.font = { size: 9, color: { argb: 'FF374151' } };
                            if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Zebra striping sutil
                        }
                    });
                }
                rS += maxRows + 2; // Espacio entre bloques
            }
        });
    });

    // Ajustar anchos
    [25, 25, 25, 25, 25].forEach((w, i) => segSheet.getColumn(i + 2).width = w);


    // ==========================================
    // 8. HOJA DE ALERTAS Y ESTUDIANTES EN RIESGO
    // ==========================================
    const alertSheet = workbook.addWorksheet('⚠️ Alertas', { views: [{ showGridLines: false }] });

    // Título
    alertSheet.mergeCells('B2:J2');
    alertSheet.getCell('B2').value = '🚨 ALERTAS Y ESTUDIANTES EN RIESGO';
    alertSheet.getCell('B2').font = { size: 20, bold: true, color: { argb: 'FFDC2626' } };
    alertSheet.getCell('B2').alignment = { horizontal: 'center' };

    alertSheet.mergeCells('B3:J3');
    alertSheet.getCell('B3').value = `Identificación automática de estudiantes que requieren intervención - ${new Date().toLocaleDateString('es-CO')}`;
    alertSheet.getCell('B3').font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
    alertSheet.getCell('B3').alignment = { horizontal: 'center' };

    // Clasificar estudiantes por nivel de alerta
    const alertas = {
        critico: [] as any[],
        alto: [] as any[],
        moderado: [] as any[],
        monitoreo: [] as any[]
    };

    estudiantes.forEach(est => {
        const global = Number(est.puntaje_global) || 0;
        const nombre = `${est.informacion_personal.nombres} ${est.informacion_personal.apellidos}`.trim();
        const id = est.informacion_personal.numero_identificacion || '';
        const institucion = est.informacion_personal.institucion || '';

        // Encontrar área más débil
        let areaDebil = '-';
        let minPuntaje = 100;
        if (est.puntajes) {
            Object.entries(est.puntajes).forEach(([area, data]) => {
                const puntaje = Number(data.puntaje) || 0;
                if (puntaje < minPuntaje && puntaje > 0) {
                    minPuntaje = puntaje;
                    areaDebil = area;
                }
            });
        }

        // Calcular brecha vs promedio
        const brecha = promedioGlobal - global;

        const registro = { nombre, id, institucion, global, areaDebil, minPuntaje, brecha };

        if (global > 0 && global < 200) {
            alertas.critico.push({ ...registro, nivel: '🔴 CRÍTICO', recomendacion: 'Intervención inmediata requerida' });
        } else if (global >= 200 && global < 250) {
            alertas.alto.push({ ...registro, nivel: '🟠 ALTO', recomendacion: 'Seguimiento semanal necesario' });
        } else if (minPuntaje < 40 && minPuntaje > 0) {
            alertas.moderado.push({ ...registro, nivel: '🟡 MODERADO', recomendacion: `Refuerzo en ${areaDebil}` });
        } else if (global >= 250 && global < 300) {
            alertas.monitoreo.push({ ...registro, nivel: '🔵 MONITOREO', recomendacion: 'Supervisión regular' });
        }
    });

    // Resumen de alertas - FORMATO HORIZONTAL
    alertSheet.getCell('B5').value = 'RESUMEN DE ALERTAS';
    alertSheet.getCell('B5').font = { size: 14, bold: true };

    const resumenData = [
        { nivel: '🔴 CRÍTICO', desc: '< 200 pts', count: alertas.critico.length, color: 'FFFEE2E2', textColor: 'FFDC2626' },
        { nivel: '🟠 ALTO', desc: '200-250 pts', count: alertas.alto.length, color: 'FFFEF3C7', textColor: 'FFD97706' },
        { nivel: '🟡 MODERADO', desc: 'Área < 40', count: alertas.moderado.length, color: 'FFFFFBEB', textColor: 'FFEAB308' },
        { nivel: '🔵 MONITOREO', desc: '250-300 pts', count: alertas.monitoreo.length, color: 'FFDBEAFE', textColor: 'FF3B82F6' }
    ];

    // Disposición horizontal: cada alerta en columnas B-C, D-E, F-G, H-I
    resumenData.forEach((r, i) => {
        const startCol = 2 + (i * 2); // B=2, D=4, F=6, H=8
        const colLetter = String.fromCharCode(64 + startCol);
        const colLetter2 = String.fromCharCode(65 + startCol);

        // Celda con nivel y descripción
        alertSheet.getCell(`${colLetter}7`).value = r.nivel;
        alertSheet.getCell(`${colLetter}7`).font = { bold: true, size: 10 };
        alertSheet.getCell(`${colLetter}7`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: r.color } };

        alertSheet.getCell(`${colLetter2}7`).value = r.count;
        alertSheet.getCell(`${colLetter2}7`).font = { bold: true, size: 20, color: { argb: r.textColor } };
        alertSheet.getCell(`${colLetter2}7`).alignment = { horizontal: 'center' };
        alertSheet.getCell(`${colLetter2}7`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: r.color } };

        alertSheet.getCell(`${colLetter}8`).value = r.desc;
        alertSheet.getCell(`${colLetter}8`).font = { size: 9, color: { argb: 'FF6B7280' } };
        alertSheet.getCell(`${colLetter2}8`).value = 'estudiantes';
        alertSheet.getCell(`${colLetter2}8`).font = { size: 9, color: { argb: 'FF6B7280' } };
    });

    // Headers de tabla de alertas - mover hacia abajo
    const alertHeaders = ['#', 'NIVEL', 'DOCUMENTO', 'NOMBRE', 'INSTITUCIÓN', 'PUNTAJE', 'ÁREA DÉBIL', 'BRECHA', 'RECOMENDACIÓN'];
    const alertRow = 11; // Bajado de 13 a 11
    alertHeaders.forEach((h, i) => {
        const col = String.fromCharCode(66 + i); // B...
        alertSheet.getCell(`${col}${alertRow}`).value = h;
        alertSheet.getCell(`${col}${alertRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        alertSheet.getCell(`${col}${alertRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
        alertSheet.getCell(`${col}${alertRow}`).alignment = { horizontal: 'center' };
    });

    // Combinar todas las alertas ordenadas por severidad
    const todasAlertas = [
        ...alertas.critico,
        ...alertas.alto,
        ...alertas.moderado,
        ...alertas.monitoreo
    ];

    let alertRowNum = alertRow + 1;
    todasAlertas.forEach((alerta, index) => {
        const cols = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const values = [
            index + 1,
            alerta.nivel,
            alerta.id,
            alerta.nombre,
            alerta.institucion,
            `${alerta.global}/500`,
            alerta.areaDebil,
            `${alerta.brecha > 0 ? '-' : '+'}${Math.abs(Math.round(alerta.brecha))}`,
            alerta.recomendacion
        ];

        values.forEach((val, i) => {
            const cell = alertSheet.getCell(`${cols[i]}${alertRowNum}`);
            cell.value = val;
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            };

            // Color de fondo según nivel
            if (alerta.nivel.includes('CRÍTICO')) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            } else if (alerta.nivel.includes('ALTO')) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
            }
        });
        alertRowNum++;
    });

    // Ajustar anchos
    [5, 12, 15, 28, 25, 12, 18, 10, 30].forEach((w, i) => alertSheet.getColumn(i + 2).width = w);

    // ==========================================
    // SECCIÓN: COMPARATIVA DE RIESGO POR INSTITUCIÓN
    // ==========================================
    const compRow = alertRowNum + 3;

    alertSheet.mergeCells(`B${compRow}:J${compRow}`);
    alertSheet.getCell(`B${compRow}`).value = '🏫 COMPARATIVA DE RIESGO POR INSTITUCIÓN';
    alertSheet.getCell(`B${compRow}`).font = { size: 14, bold: true, color: { argb: 'FF1E40AF' } };

    // Calcular estadísticas por institución
    const institucionesMap: Record<string, {
        total: number;
        critico: number;
        alto: number;
        moderado: number;
        monitoreo: number;
        promedio: number;
        sumaPuntajes: number;
    }> = {};

    estudiantes.forEach(est => {
        const inst = est.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)';
        const global = Number(est.puntaje_global) || 0;

        if (!institucionesMap[inst]) {
            institucionesMap[inst] = { total: 0, critico: 0, alto: 0, moderado: 0, monitoreo: 0, promedio: 0, sumaPuntajes: 0 };
        }

        if (global > 0) {
            institucionesMap[inst].total++;
            institucionesMap[inst].sumaPuntajes += global;

            if (global < 200) institucionesMap[inst].critico++;
            else if (global < 250) institucionesMap[inst].alto++;
            else if (global < 300) institucionesMap[inst].monitoreo++;
        }
    });

    // Agregar moderados (área < 40)
    alertas.moderado.forEach(a => {
        const inst = a.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)';
        if (institucionesMap[inst]) {
            institucionesMap[inst].moderado++;
        }
    });

    // Calcular promedios y ordenar por % de riesgo
    const institucionesRanking = Object.entries(institucionesMap)
        .map(([nombre, data]) => ({
            nombre,
            total: data.total,
            enRiesgo: data.critico + data.alto,
            critico: data.critico,
            alto: data.alto,
            moderado: data.moderado,
            porcentajeRiesgo: data.total > 0 ? ((data.critico + data.alto) / data.total * 100) : 0,
            promedio: data.total > 0 ? Math.round(data.sumaPuntajes / data.total) : 0
        }))
        .filter(i => i.total > 0)
        .sort((a, b) => b.porcentajeRiesgo - a.porcentajeRiesgo);

    // Headers de tabla comparativa
    const compHeaders = ['#', 'INSTITUCIÓN', 'TOTAL', 'EN RIESGO', '% RIESGO', '🔴 CRÍTICO', '🟠 ALTO', 'PROMEDIO', 'SEMÁFORO'];
    const compHeaderRow = compRow + 2;

    compHeaders.forEach((h, i) => {
        const col = String.fromCharCode(66 + i);
        alertSheet.getCell(`${col}${compHeaderRow}`).value = h;
        alertSheet.getCell(`${col}${compHeaderRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        alertSheet.getCell(`${col}${compHeaderRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
        alertSheet.getCell(`${col}${compHeaderRow}`).alignment = { horizontal: 'center' };
    });

    // Datos por institución
    let instRow = compHeaderRow + 1;
    institucionesRanking.forEach((inst, idx) => {
        const cols = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

        // Determinar semáforo
        let semaforo = '🟢 BIEN';
        let semaforoColor = 'FFDCFCE7';
        if (inst.porcentajeRiesgo > 30) {
            semaforo = '🔴 CRÍTICO';
            semaforoColor = 'FFFEE2E2';
        } else if (inst.porcentajeRiesgo > 15) {
            semaforo = '🟠 ALERTA';
            semaforoColor = 'FFFEF3C7';
        } else if (inst.porcentajeRiesgo > 5) {
            semaforo = '🟡 ATENCIÓN';
            semaforoColor = 'FFFFFBEB';
        }

        const values = [
            idx + 1,
            inst.nombre,
            inst.total,
            inst.enRiesgo,
            inst.porcentajeRiesgo / 100,
            inst.critico,
            inst.alto,
            `${inst.promedio}/500`,
            semaforo
        ];

        values.forEach((val, i) => {
            const cell = alertSheet.getCell(`${cols[i]}${instRow}`);
            cell.value = val;
            cell.alignment = { horizontal: i === 1 ? 'left' : 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            };

            // Formato porcentaje
            if (i === 4) cell.numFmt = '0%';

            // Color semáforo
            if (i === 8) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: semaforoColor } };
                cell.font = { bold: true, size: 9 };
            }

            // Resaltar instituciones con riesgo alto
            if (inst.porcentajeRiesgo > 30 && i < 8) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            }
        });
        instRow++;
    });

    // Resumen ejecutivo de instituciones
    const resumenInstRow = instRow + 2;
    alertSheet.mergeCells(`B${resumenInstRow}:J${resumenInstRow}`);
    const instCriticas = institucionesRanking.filter(i => i.porcentajeRiesgo > 30).length;
    const instAlerta = institucionesRanking.filter(i => i.porcentajeRiesgo > 15 && i.porcentajeRiesgo <= 30).length;
    alertSheet.getCell(`B${resumenInstRow}`).value = `📊 Resumen: ${instCriticas} institución(es) en estado CRÍTICO, ${instAlerta} en ALERTA, ${institucionesRanking.length - instCriticas - instAlerta} en buen estado`;
    alertSheet.getCell(`B${resumenInstRow}`).font = { italic: true, size: 10, color: { argb: 'FF6B7280' } };

    // Congelar encabezado
    alertSheet.views = [{ state: 'frozen', ySplit: alertRow }];


    // ==========================================
    // 9. DASHBOARD EJECUTIVO (RESUMEN 1 PÁGINA)
    // ==========================================
    const execSheet = workbook.addWorksheet('📊 Ejecutivo', { views: [{ showGridLines: false }] });

    // Título
    execSheet.mergeCells('B2:K2');
    execSheet.getCell('B2').value = '📊 DASHBOARD EJECUTIVO - RESUMEN PARA RECTORES';
    execSheet.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FF1E40AF' } };
    execSheet.getCell('B2').alignment = { horizontal: 'center' };

    execSheet.mergeCells('B3:K3');
    execSheet.getCell('B3').value = `Reporte generado: ${new Date().toLocaleString('es-CO')} | Total estudiantes evaluados: ${totalEstudiantes}`;
    execSheet.getCell('B3').font = { size: 10, italic: true };
    execSheet.getCell('B3').alignment = { horizontal: 'center' };

    // KPIs grandes
    const kpiRow = 6;
    const kpis = [
        { col: 'B', title: 'PROMEDIO', value: Math.round(promedioGlobal), suffix: '/500', color: 'FF2563EB' },
        { col: 'D', title: '% ÉXITO', value: Math.round(porcentajeExito * 100), suffix: '%', color: 'FF16A34A' },
        { col: 'F', title: 'EN RIESGO', value: alertas.critico.length + alertas.alto.length, suffix: 'est.', color: 'FFDC2626' },
        { col: 'H', title: 'MÁXIMO', value: maxGlobal, suffix: '/500', color: 'FF7C3AED' }
    ];

    kpis.forEach(kpi => {
        execSheet.getCell(`${kpi.col}${kpiRow}`).value = kpi.title;
        execSheet.getCell(`${kpi.col}${kpiRow}`).font = { size: 10, bold: true, color: { argb: 'FF6B7280' } };
        execSheet.getCell(`${kpi.col}${kpiRow + 1}`).value = kpi.value;
        execSheet.getCell(`${kpi.col}${kpiRow + 1}`).font = { size: 32, bold: true, color: { argb: kpi.color } };
        execSheet.getCell(`${kpi.col}${kpiRow + 2}`).value = kpi.suffix;
        execSheet.getCell(`${kpi.col}${kpiRow + 2}`).font = { size: 12, color: { argb: 'FF9CA3AF' } };
    });

    // Mejor área
    const mejorArea = areasConfig.reduce((best, area) => {
        const scores = estudiantes.map(e => Number(e.puntajes?.[area.key]?.puntaje) || 0).filter(s => s > 0);
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return avg > best.avg ? { name: area.name, avg } : best;
    }, { name: '-', avg: 0 });

    execSheet.getCell('J6').value = 'MEJOR ÁREA';
    execSheet.getCell('J6').font = { size: 10, bold: true, color: { argb: 'FF6B7280' } };
    execSheet.getCell('J7').value = mejorArea.name;
    execSheet.getCell('J7').font = { size: 14, bold: true, color: { argb: 'FF059669' } };
    execSheet.getCell('J8').value = `${Math.round(mejorArea.avg)}/100`;
    execSheet.getCell('J8').font = { size: 12, color: { argb: 'FF9CA3AF' } };

    // Top 5 estudiantes
    execSheet.getCell('B12').value = '🏆 TOP 5 ESTUDIANTES';
    execSheet.getCell('B12').font = { size: 12, bold: true };

    const top5 = [...estudiantes]
        .filter(e => (e.puntaje_global || 0) > 0)
        .sort((a, b) => (b.puntaje_global || 0) - (a.puntaje_global || 0))
        .slice(0, 5);

    top5.forEach((est, i) => {
        const row = 14 + i;
        execSheet.getCell(`B${row}`).value = `${i + 1}.`;
        execSheet.getCell(`B${row}`).font = { bold: true };
        execSheet.getCell(`C${row}`).value = `${est.informacion_personal.nombres} ${est.informacion_personal.apellidos}`;
        execSheet.getCell(`E${row}`).value = `${est.puntaje_global}/500`;
        execSheet.getCell(`E${row}`).font = { bold: true, color: { argb: 'FF16A34A' } };
    });

    // Bottom 5 estudiantes (requieren atención)
    execSheet.getCell('G12').value = '⚠️ REQUIEREN ATENCIÓN';
    execSheet.getCell('G12').font = { size: 12, bold: true };

    const bottom5 = [...estudiantes]
        .filter(e => (e.puntaje_global || 0) > 0)
        .sort((a, b) => (a.puntaje_global || 0) - (b.puntaje_global || 0))
        .slice(0, 5);

    bottom5.forEach((est, i) => {
        const row = 14 + i;
        execSheet.getCell(`G${row}`).value = `${i + 1}.`;
        execSheet.getCell(`G${row}`).font = { bold: true };
        execSheet.getCell(`H${row}`).value = `${est.informacion_personal.nombres} ${est.informacion_personal.apellidos}`;
        execSheet.getCell(`J${row}`).value = `${est.puntaje_global}/500`;
        execSheet.getCell(`J${row}`).font = { bold: true, color: { argb: 'FFDC2626' } };
    });

    // Distribución por nivel
    execSheet.getCell('B21').value = '📈 DISTRIBUCIÓN POR NIVEL';
    execSheet.getCell('B21').font = { size: 12, bold: true };

    const niveles = { 'Superior': 0, 'Alto': 0, 'Básico': 0, 'Bajo': 0 };
    estudiantes.forEach(e => {
        const g = Number(e.puntaje_global) || 0;
        if (g > 400) niveles['Superior']++;
        else if (g > 300) niveles['Alto']++;
        else if (g > 200) niveles['Básico']++;
        else if (g > 0) niveles['Bajo']++;
    });

    let nRow = 23;
    Object.entries(niveles).forEach(([nivel, count]) => {
        const pct = totalEstudiantes > 0 ? (count / totalEstudiantes * 100) : 0;
        execSheet.getCell(`B${nRow}`).value = nivel;
        execSheet.getCell(`C${nRow}`).value = count;
        execSheet.getCell(`D${nRow}`).value = pct / 100;
        execSheet.getCell(`D${nRow}`).numFmt = '0%';
        execSheet.getCell(`E${nRow}`).value = '█'.repeat(Math.round(pct / 5));
        execSheet.getCell(`E${nRow}`).font = { color: { argb: nivel === 'Superior' ? 'FF16A34A' : nivel === 'Alto' ? 'FF059669' : nivel === 'Básico' ? 'FFEAB308' : 'FFDC2626' } };
        nRow++;
    });

    // Ajustar anchos - aumentados para mostrar números grandes
    [12, 28, 12, 12, 28, 12, 28, 12, 12, 25].forEach((w, i) => execSheet.getColumn(i + 2).width = w);

    // ==========================================
    // 10. CORRELACIÓN ENTRE ÁREAS
    // ==========================================
    const corrSheet = workbook.addWorksheet('🔗 Correlaciones', { views: [{ showGridLines: false }] });

    // Título
    corrSheet.mergeCells('B2:H2');
    corrSheet.getCell('B2').value = '🔗 ANÁLISIS DE CORRELACIÓN ENTRE ÁREAS';
    corrSheet.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FF7C3AED' } };
    corrSheet.getCell('B2').alignment = { horizontal: 'center' };

    corrSheet.mergeCells('B3:H3');
    corrSheet.getCell('B3').value = 'Identifica patrones de rendimiento: ¿Los estudiantes fuertes en un área también lo son en otras?';
    corrSheet.getCell('B3').font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
    corrSheet.getCell('B3').alignment = { horizontal: 'center' };

    // Función para calcular correlación de Pearson
    const calcCorrelation = (x: number[], y: number[]): number => {
        if (x.length !== y.length || x.length === 0) return 0;
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);
        const sumY2 = y.reduce((a, b) => a + b * b, 0);
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    };

    // Extraer puntajes por área para todos los estudiantes
    const areaKeys = ['matemáticas', 'lectura crítica', 'sociales y ciudadanas', 'ciencias naturales', 'inglés'];
    const areaLabels = ['MAT', 'LEC', 'SOC', 'CIE', 'ING'];
    const areaScoresMap: Record<string, number[]> = {};
    areaKeys.forEach(key => {
        areaScoresMap[key] = estudiantes.map(e => Number(e.puntajes?.[key]?.puntaje) || 0);
    });

    // Crear matriz de correlación
    const matrizRow = 6;
    corrSheet.getCell(`B${matrizRow}`).value = 'MATRIZ DE CORRELACIÓN';
    corrSheet.getCell(`B${matrizRow}`).font = { size: 14, bold: true };

    // Headers de matriz
    const corrHeaderRow = matrizRow + 2;
    corrSheet.getCell(`B${corrHeaderRow}`).value = '';
    areaLabels.forEach((label, i) => {
        const col = String.fromCharCode(67 + i); // C, D, E, F, G
        corrSheet.getCell(`${col}${corrHeaderRow}`).value = label;
        corrSheet.getCell(`${col}${corrHeaderRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        corrSheet.getCell(`${col}${corrHeaderRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
        corrSheet.getCell(`${col}${corrHeaderRow}`).alignment = { horizontal: 'center' };
    });

    // Datos de matriz
    areaKeys.forEach((keyRow, rowIdx) => {
        const excelRow = corrHeaderRow + 1 + rowIdx;
        corrSheet.getCell(`B${excelRow}`).value = areaLabels[rowIdx];
        corrSheet.getCell(`B${excelRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        corrSheet.getCell(`B${excelRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
        corrSheet.getCell(`B${excelRow}`).alignment = { horizontal: 'center' };

        areaKeys.forEach((keyCol, colIdx) => {
            const col = String.fromCharCode(67 + colIdx);
            const corr = calcCorrelation(areaScoresMap[keyRow], areaScoresMap[keyCol]);
            const cell = corrSheet.getCell(`${col}${excelRow}`);
            cell.value = corr;
            cell.numFmt = '0.00';
            cell.alignment = { horizontal: 'center' };

            // Color según correlación
            let bgColor = 'FFFFFFFF';
            if (rowIdx === colIdx) {
                bgColor = 'FFE0E7FF'; // Diagonal - azul claro
            } else if (corr >= 0.7) {
                bgColor = 'FF22C55E'; // Verde fuerte
            } else if (corr >= 0.5) {
                bgColor = 'FF86EFAC'; // Verde claro
            } else if (corr >= 0.3) {
                bgColor = 'FFFEF08A'; // Amarillo
            } else {
                bgColor = 'FFFCA5A5'; // Rojo claro
            }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        });
    });

    // Leyenda
    const legendRow = corrHeaderRow + 7;
    corrSheet.getCell(`B${legendRow}`).value = 'INTERPRETACIÓN:';
    corrSheet.getCell(`B${legendRow}`).font = { bold: true };
    const legends = [
        { texto: '≥ 0.70 = Correlación FUERTE', color: '22C55E' },
        { texto: '0.50 - 0.69 = Correlación MODERADA', color: '86EFAC' },
        { texto: '0.30 - 0.49 = Correlación DÉBIL', color: 'FEF08A' },
        { texto: '< 0.30 = Correlación MUY DÉBIL', color: 'FCA5A5' }
    ];
    legends.forEach((leg, i) => {
        corrSheet.getCell(`B${legendRow + 1 + i}`).value = '●';
        corrSheet.getCell(`B${legendRow + 1 + i}`).font = { color: { argb: `FF${leg.color}` } };
        corrSheet.getCell(`C${legendRow + 1 + i}`).value = leg.texto;
        corrSheet.getCell(`C${legendRow + 1 + i}`).font = { size: 10 };
    });

    // Insights automáticos
    const insightsRow = legendRow + 7;
    corrSheet.getCell(`B${insightsRow}`).value = '💡 INSIGHTS AUTOMÁTICOS';
    corrSheet.getCell(`B${insightsRow}`).font = { size: 14, bold: true };

    // Encontrar correlaciones más fuertes y más débiles
    let maxCorr = -1, minCorr = 1;
    let maxPair = ['', ''], minPair = ['', ''];
    for (let i = 0; i < areaKeys.length; i++) {
        for (let j = i + 1; j < areaKeys.length; j++) {
            const corr = calcCorrelation(areaScoresMap[areaKeys[i]], areaScoresMap[areaKeys[j]]);
            if (corr > maxCorr) { maxCorr = corr; maxPair = [areaLabels[i], areaLabels[j]]; }
            if (corr < minCorr) { minCorr = corr; minPair = [areaLabels[i], areaLabels[j]]; }
        }
    }

    corrSheet.getCell(`B${insightsRow + 2}`).value = `🔗 Correlación más fuerte: ${maxPair[0]} ↔ ${maxPair[1]} (r = ${maxCorr.toFixed(2)})`;
    corrSheet.getCell(`B${insightsRow + 3}`).value = maxCorr >= 0.5
        ? '   → Los estudiantes buenos en una suelen serlo en la otra. Considerar enseñanza integrada.'
        : '   → Correlación moderada, áreas relativamente independientes.';
    corrSheet.getCell(`B${insightsRow + 3}`).font = { italic: true, size: 10, color: { argb: 'FF6B7280' } };

    corrSheet.getCell(`B${insightsRow + 5}`).value = `⚡ Correlación más débil: ${minPair[0]} ↔ ${minPair[1]} (r = ${minCorr.toFixed(2)})`;
    corrSheet.getCell(`B${insightsRow + 6}`).value = minCorr < 0.3
        ? '   → Áreas independientes. Éxito en una no predice rendimiento en la otra.'
        : '   → Aún existe relación, pero es la más débil del grupo.';
    corrSheet.getCell(`B${insightsRow + 6}`).font = { italic: true, size: 10, color: { argb: 'FF6B7280' } };

    // === SECCIÓN EDUCATIVA: ¿QUÉ ES LA CORRELACIÓN? ===
    const eduRow = insightsRow + 9;
    corrSheet.mergeCells(`B${eduRow}:G${eduRow}`);
    corrSheet.getCell(`B${eduRow}`).value = '📖 GUÍA DE INTERPRETACIÓN: ¿QUÉ ES LA CORRELACIÓN?';
    corrSheet.getCell(`B${eduRow}`).font = { size: 14, bold: true, color: { argb: 'FF1E40AF' } };
    corrSheet.getCell(`B${eduRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };

    const explicaciones = [
        { texto: '¿Qué es "r" (Coeficiente de Pearson)?', bold: true },
        { texto: 'Es una medida estadística que indica qué tan relacionadas están dos variables.' },
        { texto: 'En este caso, mide si los estudiantes que son buenos en un área también lo son en otra.' },
        { texto: '' },
        { texto: '¿Por qué el valor de r va de -1 a 1?', bold: true },
        { texto: '• r = 1.00: Correlación perfecta positiva (si uno sube, el otro siempre sube igual)' },
        { texto: '• r = 0.00: Sin correlación (son completamente independientes)' },
        { texto: '• r = -1.00: Correlación perfecta negativa (si uno sube, el otro baja)' },
        { texto: 'En educación, las correlaciones suelen estar entre 0.30 y 0.80.' },
        { texto: '' },
        { texto: '¿Cómo usar esta información?', bold: true },
        { texto: '• Correlación FUERTE (≥0.70): Las áreas están muy relacionadas. Mejorar una puede ayudar a la otra.' },
        { texto: '• Correlación MODERADA (0.50-0.69): Existe relación. Considerar enseñanza integrada.' },
        { texto: '• Correlación DÉBIL (0.30-0.49): Relación leve. Las áreas requieren estrategias independientes.' },
        { texto: '• Correlación MUY DÉBIL (<0.30): Áreas independientes. Éxito en una no predice la otra.' },
        { texto: '' },
        { texto: 'Ejemplo práctico:', bold: true },
        { texto: 'Si MAT ↔ CIE tiene r=0.75, significa que los estudiantes buenos en Matemáticas tienden' },
        { texto: 'a ser buenos en Ciencias Naturales. Esto sugiere que comparten habilidades de razonamiento.' }
    ];

    explicaciones.forEach((exp, i) => {
        corrSheet.getCell(`B${eduRow + 2 + i}`).value = exp.texto;
        if (exp.bold) {
            corrSheet.getCell(`B${eduRow + 2 + i}`).font = { bold: true, size: 10, color: { argb: 'FF1E293B' } };
        } else {
            corrSheet.getCell(`B${eduRow + 2 + i}`).font = { size: 10, color: { argb: 'FF4B5563' } };
        }
    });

    corrSheet.getColumn(2).width = 80;
    corrSheet.getColumn(3).width = 12;
    corrSheet.getColumn(4).width = 12;
    corrSheet.getColumn(5).width = 12;
    corrSheet.getColumn(6).width = 12;
    corrSheet.getColumn(7).width = 12;


    // ==========================================
    // 11. PERFIL DEL ESTUDIANTE POR NIVEL
    // ==========================================
    const profileSheet = workbook.addWorksheet('👤 Perfil por Nivel', { views: [{ showGridLines: false }] });

    // Título
    profileSheet.mergeCells('B2:K2');
    profileSheet.getCell('B2').value = '👤 PERFIL DEL ESTUDIANTE TIPO POR NIVEL DE DESEMPEÑO';
    profileSheet.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FF0891B2' } };
    profileSheet.getCell('B2').alignment = { horizontal: 'center' };

    profileSheet.mergeCells('B3:K3');
    profileSheet.getCell('B3').value = 'Caracterización del estudiante promedio en cada nivel para identificar patrones y áreas de intervención';
    profileSheet.getCell('B3').font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
    profileSheet.getCell('B3').alignment = { horizontal: 'center' };

    // Agrupar estudiantes por nivel
    const nivelesProfile = {
        'Superior': { estudiantes: [] as Estudiante[], color: 'FF22C55E', bgColor: 'FFDCFCE7', emoji: '🏆', rango: '> 400' },
        'Alto': { estudiantes: [] as Estudiante[], color: 'FF3B82F6', bgColor: 'FFDBEAFE', emoji: '⭐', rango: '301-400' },
        'Básico': { estudiantes: [] as Estudiante[], color: 'FFEAB308', bgColor: 'FFFFFBEB', emoji: '📚', rango: '201-300' },
        'Bajo': { estudiantes: [] as Estudiante[], color: 'FFEF4444', bgColor: 'FFFEE2E2', emoji: '🚨', rango: '≤ 200' }
    };

    estudiantes.forEach(est => {
        const global = Number(est.puntaje_global) || 0;
        if (global > 400) nivelesProfile['Superior'].estudiantes.push(est);
        else if (global > 300) nivelesProfile['Alto'].estudiantes.push(est);
        else if (global > 200) nivelesProfile['Básico'].estudiantes.push(est);
        else if (global > 0) nivelesProfile['Bajo'].estudiantes.push(est);
    });

    // Crear perfil para cada nivel - FORMATO HORIZONTAL TIPO DASHBOARD
    let profileRow = 6;

    // Primero, crear tabla comparativa de resumen horizontal
    const summaryHeaders = ['NIVEL', 'ESTUDIANTES', 'PROMEDIO', 'ÁREA FUERTE', 'ÁREA DÉBIL', 'BRECHA', 'RECOMENDACIÓN'];
    summaryHeaders.forEach((h, i) => {
        const col = String.fromCharCode(66 + i);
        profileSheet.getCell(`${col}${profileRow}`).value = h;
        profileSheet.getCell(`${col}${profileRow}`).font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        profileSheet.getCell(`${col}${profileRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };
        profileSheet.getCell(`${col}${profileRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
        profileSheet.getCell(`${col}${profileRow}`).border = {
            top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }
        };
    });

    profileRow++;

    Object.entries(nivelesProfile).forEach(([nivel, data]) => {
        const ests = data.estudiantes;
        if (ests.length === 0) return;

        // Calcular estadísticas
        const globalScores = ests.map(e => Number(e.puntaje_global) || 0);
        const promedioNivel = globalScores.reduce((a, b) => a + b, 0) / globalScores.length;

        const areasStats = areaKeys.map((key, i) => {
            const scores = ests.map(e => Number(e.puntajes?.[key]?.puntaje) || 0).filter(s => s > 0);
            return {
                area: areasConfig[i].name,
                promedio: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
            };
        });

        const sorted = [...areasStats].sort((a, b) => b.promedio - a.promedio);
        const fortaleza = sorted[0];
        const debilidad = sorted[sorted.length - 1];
        const brecha = fortaleza.promedio - debilidad.promedio;

        // Recomendación
        let recomendacion = '';
        if (nivel === 'Superior') recomendacion = 'Programas de enriquecimiento';
        else if (nivel === 'Alto') recomendacion = `Reforzar ${debilidad.area}`;
        else if (nivel === 'Básico') recomendacion = `Intervención en ${debilidad.area}`;
        else recomendacion = '¡ATENCIÓN URGENTE!';

        // Fila de datos
        const rowData = [
            `${data.emoji} ${nivel.toUpperCase()}`,
            ests.length,
            Math.round(promedioNivel),
            `${fortaleza.area} (${fortaleza.promedio.toFixed(0)})`,
            `${debilidad.area} (${debilidad.promedio.toFixed(0)})`,
            `${brecha.toFixed(0)} pts`,
            recomendacion
        ];

        rowData.forEach((val, i) => {
            const col = String.fromCharCode(66 + i);
            const cell = profileSheet.getCell(`${col}${profileRow}`);
            cell.value = val;
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            };

            // Color de fondo según nivel
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: data.bgColor } };

            // Estilo específico para primera columna
            if (i === 0) {
                cell.font = { bold: true, color: { argb: data.color } };
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }
            // Color para área fuerte
            if (i === 3) cell.font = { color: { argb: 'FF16A34A' } };
            // Color para área débil
            if (i === 4) cell.font = { color: { argb: 'FFDC2626' } };
            // Color para brecha alta
            if (i === 5 && brecha > 15) cell.font = { color: { argb: 'FFD97706' }, bold: true };
        });

        profileRow++;
    });

    // Tabla detallada de promedios por área
    profileRow += 3;
    profileSheet.mergeCells(`B${profileRow}:G${profileRow}`);
    profileSheet.getCell(`B${profileRow}`).value = '📊 DETALLE DE PROMEDIOS POR ÁREA Y NIVEL';
    profileSheet.getCell(`B${profileRow}`).font = { size: 14, bold: true, color: { argb: 'FF0891B2' } };

    profileRow += 2;

    // Headers de tabla detallada
    const detailHeaders = ['NIVEL', 'MATEMÁTICAS', 'LECTURA', 'SOCIALES', 'CIENCIAS', 'INGLÉS'];
    detailHeaders.forEach((h, i) => {
        const col = String.fromCharCode(66 + i);
        profileSheet.getCell(`${col}${profileRow}`).value = h;
        profileSheet.getCell(`${col}${profileRow}`).font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
        profileSheet.getCell(`${col}${profileRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
        profileSheet.getCell(`${col}${profileRow}`).alignment = { horizontal: 'center' };
        profileSheet.getCell(`${col}${profileRow}`).border = {
            top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }
        };
    });

    profileRow++;

    Object.entries(nivelesProfile).forEach(([nivel, data]) => {
        const ests = data.estudiantes;
        if (ests.length === 0) return;

        profileSheet.getCell(`B${profileRow}`).value = `${data.emoji} ${nivel}`;
        profileSheet.getCell(`B${profileRow}`).font = { bold: true };
        profileSheet.getCell(`B${profileRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: data.bgColor } };

        areaKeys.forEach((key, i) => {
            const scores = ests.map(e => Number(e.puntajes?.[key]?.puntaje) || 0).filter(s => s > 0);
            const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            const col = String.fromCharCode(67 + i);

            profileSheet.getCell(`${col}${profileRow}`).value = avg;
            profileSheet.getCell(`${col}${profileRow}`).numFmt = '0.0';
            profileSheet.getCell(`${col}${profileRow}`).alignment = { horizontal: 'center' };

            // Color condicional
            let bgColor = 'FFFFFFFF';
            if (avg >= 80) bgColor = 'FFDCFCE7';
            else if (avg >= 60) bgColor = 'FFFFFBEB';
            else if (avg > 0) bgColor = 'FFFEE2E2';

            profileSheet.getCell(`${col}${profileRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            profileSheet.getCell(`${col}${profileRow}`).border = {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            };
        });

        profileRow++;
    });

    // Ajustar anchos de columna
    [18, 12, 12, 22, 22, 12, 35].forEach((w, i) => profileSheet.getColumn(i + 2).width = w);

    // === SECCIÓN EDUCATIVA: GUÍA DE INTERPRETACIÓN ===
    profileRow += 2;
    profileSheet.mergeCells(`B${profileRow}:K${profileRow}`);
    profileSheet.getCell(`B${profileRow}`).value = '📖 GUÍA DE INTERPRETACIÓN: ¿CÓMO USAR ESTE ANÁLISIS?';
    profileSheet.getCell(`B${profileRow}`).font = { size: 14, bold: true, color: { argb: 'FF0891B2' } };
    profileSheet.getCell(`B${profileRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFFAFE' } };

    const guiaProfile = [
        { texto: '¿Qué significan los niveles de desempeño?', bold: true },
        { texto: 'Los niveles se basan en el puntaje global del ICFES (0-500) y clasifican el rendimiento del estudiante:' },
        { texto: '• SUPERIOR (>400): Desempeño sobresaliente. Estudiantes que dominan competencias avanzadas.' },
        { texto: '• ALTO (301-400): Buen desempeño. Estudiantes competentes con áreas de oportunidad específicas.' },
        { texto: '• BÁSICO (201-300): Desempeño aceptable. Requieren refuerzo focalizado para mejorar.' },
        { texto: '• BAJO (≤200): Desempeño insuficiente. Necesitan intervención urgente y apoyo integral.' },
        { texto: '' },
        { texto: '¿Qué es la "brecha entre áreas"?', bold: true },
        { texto: 'Es la diferencia en puntos entre el área más fuerte y la más débil de un grupo de estudiantes.' },
        { texto: 'Una brecha ALTA (>15 puntos) indica perfiles muy desiguales que requieren atención diferenciada.' },
        { texto: 'Una brecha BAJA (<10 puntos) indica rendimiento homogéneo en todas las áreas.' },
        { texto: '' },
        { texto: '¿Cómo usar esta información pedagógicamente?', bold: true },
        { texto: '1. Identifique el área más débil de cada nivel para planificar intervenciones focalizadas.' },
        { texto: '2. Use el área más fuerte como ancla para estrategias de aprendizaje transversal.' },
        { texto: '3. Estudiantes de nivel BAJO requieren planes de intervención intensiva y seguimiento semanal.' },
        { texto: '4. Estudiantes de nivel SUPERIOR pueden ser mentores o tutores de sus compañeros.' },
        { texto: '5. Compare los promedios por área para identificar patrones institucionales.' }
    ];

    guiaProfile.forEach((g, i) => {
        profileSheet.getCell(`B${profileRow + 2 + i}`).value = g.texto;
        if (g.bold) {
            profileSheet.getCell(`B${profileRow + 2 + i}`).font = { bold: true, size: 10, color: { argb: 'FF0F766E' } };
        } else {
            profileSheet.getCell(`B${profileRow + 2 + i}`).font = { size: 10, color: { argb: 'FF4B5563' } };
        }
    });


    // ==========================================
    // 12. SEGUIMIENTO DE SESIONES
    // ==========================================
    const sesSheet = workbook.addWorksheet('📋 Sesiones', { views: [{ showGridLines: false }] });

    sesSheet.mergeCells('B2:K2');
    sesSheet.getCell('B2').value = '📋 SEGUIMIENTO DE COMPLETITUD DE SESIONES';
    sesSheet.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FF0E7490' } };
    sesSheet.getCell('B2').alignment = { horizontal: 'center' };

    sesSheet.mergeCells('B3:K3');
    sesSheet.getCell('B3').value = `Control de asistencia y finalización de sesiones S1 y S2 — ${new Date().toLocaleDateString('es-CO')}`;
    sesSheet.getCell('B3').font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
    sesSheet.getCell('B3').alignment = { horizontal: 'center' };

    // Calcular estadísticas de sesiones
    // Inferir sesión también desde s1_aciertos/s2_aciertos cuando sesiones[] está vacío
    const checkS1 = (e: Estudiante) => (e.sesiones || []).some(s => s.toLowerCase().includes('s1')) || (e.s1_aciertos !== undefined && e.s1_aciertos > 0);
    const checkS2 = (e: Estudiante) => (e.sesiones || []).some(s => s.toLowerCase().includes('s2')) || (e.s2_aciertos !== undefined && e.s2_aciertos > 0);

    const conS1 = estudiantes.filter(e => checkS1(e)).length;
    const conS2 = estudiantes.filter(e => checkS2(e)).length;
    const conAmbas = estudiantes.filter(e => checkS1(e) && checkS2(e)).length;
    const soloS1 = conS1 - conAmbas;
    const soloS2 = conS2 - conAmbas;
    const sinNinguna = totalEstudiantes - conAmbas - soloS1 - soloS2;

    // KPIs de sesiones
    const sesKpis = [
        { col: 'B', title: 'AMBAS SESIONES', value: conAmbas, pct: conAmbas / Math.max(totalEstudiantes, 1), color: 'FF16A34A', bg: 'FFDCFCE7' },
        { col: 'D', title: 'SOLO S1', value: soloS1, pct: soloS1 / Math.max(totalEstudiantes, 1), color: 'FF3B82F6', bg: 'FFDBEAFE' },
        { col: 'F', title: 'SOLO S2', value: soloS2, pct: soloS2 / Math.max(totalEstudiantes, 1), color: 'FF8B5CF6', bg: 'FFEDE9FE' },
        { col: 'H', title: 'INCOMPLETOS', value: sinNinguna, pct: sinNinguna / Math.max(totalEstudiantes, 1), color: 'FFDC2626', bg: 'FFFEE2E2' },
    ];

    sesKpis.forEach(kpi => {
        sesSheet.getCell(`${kpi.col}5`).value = kpi.title;
        sesSheet.getCell(`${kpi.col}5`).font = { size: 9, bold: true, color: { argb: 'FF6B7280' } };
        sesSheet.getCell(`${kpi.col}6`).value = kpi.value;
        sesSheet.getCell(`${kpi.col}6`).font = { size: 28, bold: true, color: { argb: kpi.color } };
        const nextCol = String.fromCharCode(kpi.col.charCodeAt(0) + 1);
        sesSheet.getCell(`${nextCol}6`).value = kpi.pct;
        sesSheet.getCell(`${nextCol}6`).numFmt = '0%';
        sesSheet.getCell(`${nextCol}6`).font = { size: 12, color: { argb: kpi.color } };
        // Background
        [kpi.col, nextCol].forEach(c => {
            sesSheet.getCell(`${c}5`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.bg } };
            sesSheet.getCell(`${c}6`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.bg } };
        });
    });

    // Tabla detallada
    const sesHeaders = ['#', 'DOCUMENTO', 'NOMBRE', 'INSTITUCIÓN', 'SESIÓN 1', 'S1 ACIERTOS', 'SESIÓN 2', 'S2 ACIERTOS', 'ESTADO', 'PUNTAJE'];
    const sesHRow = 9;
    sesHeaders.forEach((h, i) => {
        const col = String.fromCharCode(66 + i);
        sesSheet.getCell(`${col}${sesHRow}`).value = h;
        sesSheet.getCell(`${col}${sesHRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        sesSheet.getCell(`${col}${sesHRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7490' } };
        sesSheet.getCell(`${col}${sesHRow}`).alignment = { horizontal: 'center' };
    });

    let sesRow = sesHRow + 1;
    // Ordenar: incompletos primero
    const sesEstudiantes = [...estudiantes].sort((a, b) => {
        const sesA = (a.sesiones || []).length;
        const sesB = (b.sesiones || []).length;
        return sesA - sesB;
    });

    sesEstudiantes.forEach((est, idx) => {
        const hasS1 = checkS1(est);
        const hasS2 = checkS2(est);
        const estado = hasS1 && hasS2 ? '✅ Completo' : hasS1 ? '⚠️ Falta S2' : hasS2 ? '⚠️ Falta S1' : '❌ Sin Sesiones';

        const cols = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
        const s1Aciertos = est.s1_aciertos !== undefined && est.s1_total ? `${est.s1_aciertos}/${est.s1_total}` : '-';
        const s2Aciertos = est.s2_aciertos !== undefined && est.s2_total ? `${est.s2_aciertos}/${est.s2_total}` : '-';

        const vals = [
            idx + 1,
            est.informacion_personal.numero_identificacion || '',
            `${est.informacion_personal.nombres} ${est.informacion_personal.apellidos}`.trim(),
            est.informacion_personal.institucion || '',
            hasS1 ? '✔️ Sí' : '❌ No',
            s1Aciertos,
            hasS2 ? '✔️ Sí' : '❌ No',
            s2Aciertos,
            estado,
            Number(est.puntaje_global) || 0
        ];

        vals.forEach((v, i) => {
            const cell = sesSheet.getCell(`${cols[i]}${sesRow}`);
            cell.value = v;
            cell.alignment = { horizontal: 'center' };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };

            if (!hasS1 || !hasS2) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
            }
        });
        sesRow++;
    });

    [6, 15, 28, 25, 10, 14, 10, 14, 16, 12].forEach((w, i) => sesSheet.getColumn(i + 2).width = w);
    sesSheet.views = [{ state: 'frozen', ySplit: sesHRow }];

    // ==========================================
    // 13. ANÁLISIS DE BRECHAS POR ESTUDIANTE
    // ==========================================
    const brechaSheet = workbook.addWorksheet('📏 Brechas', { views: [{ showGridLines: false }] });

    brechaSheet.mergeCells('B2:L2');
    brechaSheet.getCell('B2').value = '📏 ANÁLISIS DE BRECHAS: FORTALEZAS vs DEBILIDADES POR ESTUDIANTE';
    brechaSheet.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FF7C3AED' } };
    brechaSheet.getCell('B2').alignment = { horizontal: 'center' };

    brechaSheet.mergeCells('B3:L3');
    brechaSheet.getCell('B3').value = 'Identifica la diferencia entre el área más fuerte y más débil de cada estudiante para focalizar intervenciones';
    brechaSheet.getCell('B3').font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
    brechaSheet.getCell('B3').alignment = { horizontal: 'center' };

    // Calcular brechas globales
    const brechasData = estudiantes.map(est => {
        const areas = areasConfig.map(a => ({
            name: a.name,
            score: Number(est.puntajes?.[a.key]?.puntaje) || 0
        })).filter(a => a.score > 0);

        if (areas.length < 2) return null;

        const sorted = [...areas].sort((a, b) => b.score - a.score);
        const fuerte = sorted[0];
        const debil = sorted[sorted.length - 1];
        const brecha = fuerte.score - debil.score;

        return {
            id: est.informacion_personal.numero_identificacion,
            nombre: `${est.informacion_personal.nombres} ${est.informacion_personal.apellidos}`.trim(),
            institucion: est.informacion_personal.institucion || '',
            global: Number(est.puntaje_global) || 0,
            fuerte,
            debil,
            brecha,
            areas
        };
    }).filter(Boolean).sort((a, b) => b!.brecha - a!.brecha);

    // Resumen KPIs
    const brechasValidas = brechasData.filter(Boolean) as NonNullable<typeof brechasData[0]>[];
    const brechaPromedio = brechasValidas.length > 0 ? brechasValidas.reduce((s, b) => s + b.brecha, 0) / brechasValidas.length : 0;
    const brechaMax = brechasValidas.length > 0 ? Math.max(...brechasValidas.map(b => b.brecha)) : 0;
    const brechasAltas = brechasValidas.filter(b => b.brecha > 20).length;

    const brechaKpis = [
        { col: 'B', title: 'BRECHA PROMEDIO', value: `${Math.round(brechaPromedio)} pts`, color: 'FF7C3AED' },
        { col: 'D', title: 'BRECHA MÁXIMA', value: `${Math.round(brechaMax)} pts`, color: 'FFDC2626' },
        { col: 'F', title: 'CON BRECHA ALTA (>20)', value: `${brechasAltas}`, color: 'FFD97706' },
        { col: 'H', title: 'EVALUADOS', value: `${brechasValidas.length}`, color: 'FF3B82F6' },
    ];

    brechaKpis.forEach(kpi => {
        brechaSheet.getCell(`${kpi.col}5`).value = kpi.title;
        brechaSheet.getCell(`${kpi.col}5`).font = { size: 9, bold: true, color: { argb: 'FF6B7280' } };
        brechaSheet.getCell(`${kpi.col}6`).value = kpi.value;
        brechaSheet.getCell(`${kpi.col}6`).font = { size: 22, bold: true, color: { argb: kpi.color } };
    });

    // Tabla
    const brechaHeaders = ['#', 'DOCUMENTO', 'NOMBRE', 'INSTITUCIÓN', 'GLOBAL', 'ÁREA FUERTE', 'PUNTAJE', 'ÁREA DÉBIL', 'PUNTAJE', 'BRECHA', 'RIESGO'];
    const brechaHRow = 9;
    brechaHeaders.forEach((h, i) => {
        const col = String.fromCharCode(66 + i);
        brechaSheet.getCell(`${col}${brechaHRow}`).value = h;
        brechaSheet.getCell(`${col}${brechaHRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        brechaSheet.getCell(`${col}${brechaHRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
        brechaSheet.getCell(`${col}${brechaHRow}`).alignment = { horizontal: 'center' };
    });

    let brechaRow = brechaHRow + 1;
    brechasValidas.forEach((b, idx) => {
        const riskLevel = b.brecha > 30 ? '🔴 CRÍTICA' : b.brecha > 20 ? '🟠 ALTA' : b.brecha > 10 ? '🟡 MODERADA' : '🟢 BAJA';
        const riskBg = b.brecha > 30 ? 'FFFEE2E2' : b.brecha > 20 ? 'FFFEF3C7' : 'FFFFFFFF';

        const cols = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
        const vals = [
            idx + 1,
            b.id,
            b.nombre,
            b.institucion,
            b.global,
            b.fuerte.name,
            b.fuerte.score,
            b.debil.name,
            b.debil.score,
            b.brecha,
            riskLevel
        ];

        vals.forEach((v, i) => {
            const cell = brechaSheet.getCell(`${cols[i]}${brechaRow}`);
            cell.value = v;
            cell.alignment = { horizontal: 'center' };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };

            if (i === 5) cell.font = { color: { argb: 'FF16A34A' }, bold: true }; // Área fuerte
            if (i === 7) cell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Área débil
            if (i === 9) cell.font = { bold: true, color: { argb: b.brecha > 20 ? 'FFDC2626' : 'FF374151' } }; // Brecha
            if (i === 10) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: riskBg } };
        });
        brechaRow++;
    });

    [6, 14, 28, 24, 10, 16, 10, 16, 10, 10, 14].forEach((w, i) => brechaSheet.getColumn(i + 2).width = w);
    brechaSheet.views = [{ state: 'frozen', ySplit: brechaHRow }];

    // ==========================================
    // 14. ANÁLISIS POR DEPARTAMENTO / MUNICIPIO
    // ==========================================
    const deptoSheet = workbook.addWorksheet('🗺️ Departamentos', { views: [{ showGridLines: false }] });

    deptoSheet.mergeCells('B2:L2');
    deptoSheet.getCell('B2').value = '🗺️ ANÁLISIS POR DEPARTAMENTO / MUNICIPIO';
    deptoSheet.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FF0369A1' } };
    deptoSheet.getCell('B2').alignment = { horizontal: 'center' };

    deptoSheet.mergeCells('B3:L3');
    deptoSheet.getCell('B3').value = 'Comparativa de rendimiento por ubicación geográfica de los estudiantes';
    deptoSheet.getCell('B3').font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
    deptoSheet.getCell('B3').alignment = { horizontal: 'center' };

    // Agrupar por departamento
    const deptoMap = new Map<string, Estudiante[]>();
    estudiantes.forEach(e => {
        const depto = e.informacion_personal.departamento || e.informacion_personal.municipio || 'No especificado';
        if (!deptoMap.has(depto)) deptoMap.set(depto, []);
        deptoMap.get(depto)?.push(e);
    });

    // Headers
    const deptoHeaders = ['#', 'DEPARTAMENTO', 'EVALUADOS', 'PROMEDIO', 'MÁX', 'MÍN', '% ÉXITO', 'MAT', 'LEC', 'SOC', 'CIE', 'ING'];
    const deptoHRow = 5;
    deptoHeaders.forEach((h, i) => {
        const col = String.fromCharCode(66 + i);
        deptoSheet.getCell(`${col}${deptoHRow}`).value = h;
        deptoSheet.getCell(`${col}${deptoHRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        deptoSheet.getCell(`${col}${deptoHRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } };
        deptoSheet.getCell(`${col}${deptoHRow}`).alignment = { horizontal: 'center' };
    });

    // Calcular y ordenar departamentos por promedio
    const deptoStats = Array.from(deptoMap.entries()).map(([nombre, ests]) => {
        const globals = ests.map(e => Number(e.puntaje_global) || 0).filter(g => g > 0);
        const avg = globals.length > 0 ? globals.reduce((a, b) => a + b, 0) / globals.length : 0;
        const max = globals.length > 0 ? Math.max(...globals) : 0;
        const min = globals.length > 0 ? Math.min(...globals) : 0;
        const exitoRate = globals.length > 0 ? globals.filter(g => g >= 300).length / globals.length : 0;

        const matAvg = calculateMean(ests.map(e => Number(e.puntajes?.['matemáticas']?.puntaje) || 0));
        const lecAvg = calculateMean(ests.map(e => Number(e.puntajes?.['lectura crítica']?.puntaje) || 0));
        const socAvg = calculateMean(ests.map(e => Number(e.puntajes?.['sociales y ciudadanas']?.puntaje) || 0));
        const cieAvg = calculateMean(ests.map(e => Number(e.puntajes?.['ciencias naturales']?.puntaje) || 0));
        const ingAvg = calculateMean(ests.map(e => Number(e.puntajes?.['inglés']?.puntaje) || 0));

        return { nombre, count: ests.length, avg, max, min, exitoRate, matAvg, lecAvg, socAvg, cieAvg, ingAvg };
    }).sort((a, b) => b.avg - a.avg);

    let deptoRow = deptoHRow + 1;
    deptoStats.forEach((d, idx) => {
        const cols = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
        const vals = [idx + 1, d.nombre, d.count, d.avg, d.max, d.min, d.exitoRate, d.matAvg, d.lecAvg, d.socAvg, d.cieAvg, d.ingAvg];

        vals.forEach((v, i) => {
            const cell = deptoSheet.getCell(`${cols[i]}${deptoRow}`);
            cell.value = v;
            cell.alignment = { horizontal: i === 1 ? 'left' : 'center' };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };

            // Formato numérico
            if ([3, 4, 5, 7, 8, 9, 10, 11].includes(i)) cell.numFmt = '0.0';
            if (i === 6) cell.numFmt = '0%';

            // Color por rendimiento
            if (i === 3) {
                const avgVal = v as number;
                cell.font = { bold: true, color: { argb: avgVal >= 300 ? 'FF16A34A' : avgVal >= 250 ? 'FFEAB308' : 'FFDC2626' } };
            }
            if (i === 1) cell.font = { bold: true };

            // Zebra striping
            if (idx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
        deptoRow++;
    });

    // Distribución de estudiantes por depto - barra visual
    deptoRow += 2;
    deptoSheet.mergeCells(`B${deptoRow}:M${deptoRow}`);
    deptoSheet.getCell(`B${deptoRow}`).value = '📊 DISTRIBUCIÓN DE ESTUDIANTES POR UBICACIÓN';
    deptoSheet.getCell(`B${deptoRow}`).font = { size: 14, bold: true, color: { argb: 'FF0369A1' } };

    deptoRow += 2;
    deptoStats.forEach(d => {
        const pct = d.count / Math.max(totalEstudiantes, 1);
        deptoSheet.getCell(`B${deptoRow}`).value = d.nombre;
        deptoSheet.getCell(`B${deptoRow}`).font = { bold: true, size: 10 };
        deptoSheet.getCell(`D${deptoRow}`).value = d.count;
        deptoSheet.getCell(`D${deptoRow}`).font = { bold: true };
        deptoSheet.getCell(`E${deptoRow}`).value = pct;
        deptoSheet.getCell(`E${deptoRow}`).numFmt = '0.0%';
        const barLen = Math.max(1, Math.round(pct * 40));
        deptoSheet.getCell(`F${deptoRow}`).value = '█'.repeat(barLen);
        deptoSheet.getCell(`F${deptoRow}`).font = { color: { argb: 'FF0EA5E9' }, size: 8 };
        deptoRow++;
    });

    [6, 28, 12, 12, 10, 10, 10, 10, 10, 10, 10, 10].forEach((w, i) => deptoSheet.getColumn(i + 2).width = w);

    // ==========================================
    // 15. HOJA BENCHMARK NACIONAL (vs ICFES 2025)
    // ==========================================
    const benchNatSheet = workbook.addWorksheet('📊 Benchmark Nacional', { views: [{ showGridLines: false }] });

    benchNatSheet.mergeCells('B2:N2');
    benchNatSheet.getCell('B2').value = '📊 BENCHMARK NACIONAL: SIMULACRO vs ICFES 2025 REAL';
    benchNatSheet.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FF0C4A6E' } };
    benchNatSheet.getCell('B2').alignment = { horizontal: 'center' };

    benchNatSheet.mergeCells('B3:N3');
    benchNatSheet.getCell('B3').value = `Estudiantes Seamos Genios: ${totalEstudiantes} evaluados | Datos nacionales: ${NATIONAL_STATS.global.count.toLocaleString()} colegios ICFES Saber 11 — 2025`;
    benchNatSheet.getCell('B3').font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
    benchNatSheet.getCell('B3').alignment = { horizontal: 'center' };

    // Agrupar estudiantes por institución
    const benchInstMap: Record<string, typeof estudiantes> = {};
    estudiantes.forEach(e => {
        const inst = (e.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)').toUpperCase().trim();
        if (!benchInstMap[inst]) benchInstMap[inst] = [];
        benchInstMap[inst].push(e);
    });

    const benchAreaKeys = ['lectura crítica', 'matemáticas', 'sociales y ciudadanas', 'ciencias naturales', 'inglés'] as const;
    const benchAreaNames = ['Lectura', 'Matemáticas', 'Sociales', 'Ciencias', 'Inglés'];
    const nationalAreaKeys: (keyof typeof NATIONAL_STATS.areas)[] = ['Lectura', 'Matematicas', 'Sociales', 'Ciencias', 'Ingles'];

    // === SECCIÓN 1: RESUMEN POR INSTITUCIÓN ===
    let bRow = 5;
    benchNatSheet.mergeCells(`B${bRow}:N${bRow}`);
    benchNatSheet.getCell(`B${bRow}`).value = '🏫 SECCIÓN 1: RESUMEN INSTITUCIONAL vs PROMEDIOS NACIONALES';
    benchNatSheet.getCell(`B${bRow}`).font = { size: 14, bold: true, color: { argb: 'FF1E40AF' } };
    bRow++;
    benchNatSheet.mergeCells(`B${bRow}:N${bRow}`);
    benchNatSheet.getCell(`B${bRow}`).value = `📌 Promedios del simulacro Seamos Genios (${totalEstudiantes} est.) comparados contra promedios nacionales ICFES (${NATIONAL_STATS.global.count.toLocaleString()} colegios)`;
    benchNatSheet.getCell(`B${bRow}`).font = { size: 9, italic: true, color: { argb: 'FF9CA3AF' } };
    benchNatSheet.getCell(`B${bRow}`).alignment = { horizontal: 'center' };
    bRow++;

    // Headers
    const s1Headers = ['INSTITUCIÓN', '# EST.', 'PROM. SIM.', 'PROM. NAC.', 'Δ DIFERENCIA', 'PERCENTIL', 'INDICADOR',
        'Lectura', 'Matemáticas', 'Sociales', 'Ciencias', 'Inglés'];
    s1Headers.forEach((h, i) => {
        const col = String.fromCharCode(66 + i); // B=66
        benchNatSheet.getCell(`${col}${bRow}`).value = h;
        benchNatSheet.getCell(`${col}${bRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        benchNatSheet.getCell(`${col}${bRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C4A6E' } };
        benchNatSheet.getCell(`${col}${bRow}`).alignment = { horizontal: 'center' };
    });
    const s1HRow = bRow;
    bRow++;

    const benchInstEntries = Object.entries(benchInstMap).sort((a, b) => {
        const avgA = a[1].reduce((s, e) => s + (Number(e.puntaje_global) || 0), 0) / a[1].length;
        const avgB = b[1].reduce((s, e) => s + (Number(e.puntaje_global) || 0), 0) / b[1].length;
        return avgB - avgA;
    });

    benchInstEntries.forEach(([instName, ests], idx) => {
        const avgGlobal = ests.reduce((s, e) => s + (Number(e.puntaje_global) || 0), 0) / ests.length;

        // Calcular promedio por área
        const areaAvgs: number[] = benchAreaKeys.map(key => {
            const scores = ests.map(e => Number(e.puntajes?.[key]?.puntaje) || 0).filter(s => s > 0);
            return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        });

        const natAvg = NATIONAL_STATS.global.mean;
        const diff = avgGlobal - natAvg;
        const pct = estimatePercentile('Global', avgGlobal);
        const emoji = getPercentileEmoji(pct);

        const cols = s1Headers.map((_, i) => String.fromCharCode(66 + i));
        const vals: (string | number)[] = [
            instName,
            ests.length,
            Math.round(avgGlobal * 10) / 10,
            Math.round(natAvg * 10) / 10,
            Math.round(diff * 10) / 10,
            `P${pct}`,
            emoji,
            ...areaAvgs.map(a => Math.round(a * 10) / 10),
        ];

        vals.forEach((v, i) => {
            const cell = benchNatSheet.getCell(`${cols[i]}${bRow}`);
            cell.value = v;
            cell.alignment = { horizontal: 'center' };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };

            if (i === 0) cell.alignment = { horizontal: 'left' };
            if (i === 0) cell.font = { bold: true };
            if (i === 4) { // Diferencia
                cell.font = { bold: true, color: { argb: diff >= 0 ? 'FF16A34A' : 'FFDC2626' } };
                if (typeof v === 'number') cell.value = diff >= 0 ? `+${v}` : `${v}`;
            }
            if (i >= 7) { // Puntajes por área
                const natVal = NATIONAL_STATS.areas[nationalAreaKeys[i - 7]].mean;
                const aVal = v as number;
                cell.font = { color: { argb: aVal >= natVal ? 'FF16A34A' : 'FFDC2626' } };
            }
            if (idx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } };
        });
        bRow++;
    });

    // Fila de referencia nacional
    const refCols = s1Headers.map((_, i) => String.fromCharCode(66 + i));
    const refVals: (string | number)[] = [
        '📌 PROMEDIO NACIONAL ICFES 2025',
        NATIONAL_STATS.global.count,
        Math.round(NATIONAL_STATS.global.mean * 10) / 10,
        Math.round(NATIONAL_STATS.global.mean * 10) / 10,
        0,
        'P50',
        '📌',
        ...nationalAreaKeys.map(k => Math.round(NATIONAL_STATS.areas[k].mean * 10) / 10),
    ];
    refVals.forEach((v, i) => {
        const cell = benchNatSheet.getCell(`${refCols[i]}${bRow}`);
        cell.value = v;
        cell.alignment = { horizontal: 'center' };
        cell.font = { bold: true, color: { argb: 'FF0C4A6E' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        if (i === 0) cell.alignment = { horizontal: 'left' };
    });
    bRow += 3;

    // === SECCIÓN 2: HEATMAP POR ÁREA ===
    benchNatSheet.mergeCells(`B${bRow}:N${bRow}`);
    benchNatSheet.getCell(`B${bRow}`).value = '🔥 SECCIÓN 2: COMPARATIVA POR ÁREA — SIMULACRO vs NACIONAL';
    benchNatSheet.getCell(`B${bRow}`).font = { size: 14, bold: true, color: { argb: 'FF7C3AED' } };
    bRow += 2;

    // Sub-headers
    const s2Headers = ['ÁREA', 'PROM. NACIONAL', 'DESV. EST.', 'P25', 'P50', 'P75', 'P90'];
    // Add institution columns
    benchInstEntries.forEach(([name]) => s2Headers.push(name.substring(0, 20)));
    s2Headers.forEach((h, i) => {
        const col = String.fromCharCode(66 + i);
        if (i > 13) return; // Max columns
        benchNatSheet.getCell(`${col}${bRow}`).value = h;
        benchNatSheet.getCell(`${col}${bRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8 };
        benchNatSheet.getCell(`${col}${bRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
        benchNatSheet.getCell(`${col}${bRow}`).alignment = { horizontal: 'center', wrapText: true };
    });
    bRow++;

    benchAreaNames.forEach((areaName, aIdx) => {
        const natKey = nationalAreaKeys[aIdx];
        const nat = NATIONAL_STATS.areas[natKey];
        const simKey = benchAreaKeys[aIdx];

        const baseCols = ['B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const baseVals: (string | number)[] = [areaName, nat.mean, nat.std, nat.p25, nat.p50, nat.p75, nat.p90];

        baseVals.forEach((v, i) => {
            const cell = benchNatSheet.getCell(`${baseCols[i]}${bRow}`);
            cell.value = v;
            cell.alignment = { horizontal: 'center' };
            if (i === 0) { cell.font = { bold: true }; cell.alignment = { horizontal: 'left' }; }
            if (i >= 1 && typeof v === 'number') cell.numFmt = '0.0';
        });

        // Puntaje de cada institución en esta área
        benchInstEntries.forEach(([, ests], instIdx) => {
            const colIdx = 73 + instIdx; // 'I' = 73
            if (instIdx > 5) return; // Max 6 institutions
            const col = String.fromCharCode(colIdx);

            const scores = ests.map(e => Number(e.puntajes?.[simKey]?.puntaje) || 0).filter(s => s > 0);
            const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

            const cell = benchNatSheet.getCell(`${col}${bRow}`);
            cell.value = Math.round(avg * 10) / 10;
            cell.numFmt = '0.0';
            cell.alignment = { horizontal: 'center' };

            // Color: verde si >= P50, amarillo si >= P25, rojo si < P25
            const bgColor = avg >= nat.p75 ? 'FFC6F6D5' : avg >= nat.p50 ? 'FFFFFBEB' : avg >= nat.p25 ? 'FFFEF3C7' : 'FFFEE2E2';
            const fgColor = avg >= nat.p75 ? 'FF16A34A' : avg >= nat.p50 ? 'FF92400E' : avg >= nat.p25 ? 'FFD97706' : 'FFDC2626';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.font = { bold: true, color: { argb: fgColor } };
        });

        bRow++;
    });

    // Global row
    const globalBaseCols = ['B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const globalBaseVals: (string | number)[] = ['GLOBAL', NATIONAL_STATS.global.mean, NATIONAL_STATS.global.std, NATIONAL_STATS.global.p25, NATIONAL_STATS.global.p50, NATIONAL_STATS.global.p75, NATIONAL_STATS.global.p90];
    globalBaseVals.forEach((v, i) => {
        const cell = benchNatSheet.getCell(`${globalBaseCols[i]}${bRow}`);
        cell.value = v;
        cell.alignment = { horizontal: 'center' };
        cell.font = { bold: true, color: { argb: 'FF0C4A6E' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        if (i === 0) cell.alignment = { horizontal: 'left' };
        if (i >= 1 && typeof v === 'number') cell.numFmt = '0.0';
    });
    benchInstEntries.forEach(([, ests], instIdx) => {
        if (instIdx > 5) return;
        const col = String.fromCharCode(73 + instIdx);
        const avg = ests.reduce((s, e) => s + (Number(e.puntaje_global) || 0), 0) / ests.length;
        const cell = benchNatSheet.getCell(`${col}${bRow}`);
        cell.value = Math.round(avg * 10) / 10;
        cell.numFmt = '0.0';
        cell.alignment = { horizontal: 'center' };
        cell.font = { bold: true, color: { argb: 'FF0C4A6E' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    });

    bRow += 3;

    // === SECCIÓN 3: POSICIÓN EN RANKING DEPARTAMENTAL ===
    benchNatSheet.mergeCells(`B${bRow}:N${bRow}`);
    benchNatSheet.getCell(`B${bRow}`).value = '🏆 SECCIÓN 3: POSICIÓN ESTIMADA EN RANKING DEPARTAMENTAL ICFES';
    benchNatSheet.getCell(`B${bRow}`).font = { size: 14, bold: true, color: { argb: 'FFD97706' } };
    bRow += 2;

    // Intentar cargar rankings para sección 3
    try {
        const nationalSchools = await loadNationalRankings();

        if (nationalSchools.length > 0) {
            const s3Headers = ['INSTITUCIÓN', 'DEPTO/MUNICIPIO', 'PROM. SIM.', 'POSICIÓN EST.', 'TOTAL DEPTAL', '% SUPERIOR', 'TOP 1 DEPTO', 'PUNTAJE', 'TOP 2 DEPTO', 'PUNTAJE', 'TOP 3 DEPTO', 'PUNTAJE'];
            s3Headers.forEach((h, i) => {
                const col = String.fromCharCode(66 + i);
                benchNatSheet.getCell(`${col}${bRow}`).value = h;
                benchNatSheet.getCell(`${col}${bRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8 };
                benchNatSheet.getCell(`${col}${bRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };
                benchNatSheet.getCell(`${col}${bRow}`).alignment = { horizontal: 'center', wrapText: true };
            });
            bRow++;

            benchInstEntries.forEach(([instName, ests], idx) => {
                const avgGlobal = ests.reduce((s, e) => s + (Number(e.puntaje_global) || 0), 0) / ests.length;
                // Calcular promedio por área para obtener un "promedio" comparable con CSV
                const areaAvgs = benchAreaKeys.map(key => {
                    const scores = ests.map(e => Number(e.puntajes?.[key]?.puntaje) || 0).filter(s => s > 0);
                    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                });
                const activeAreas = areaAvgs.filter(a => a > 0);
                const instPromedio = activeAreas.length > 0 ? areaAvgs.reduce((a, b) => a + b, 0) / activeAreas.length : 0;

                // Buscar departamento/municipio
                const depto = (ests[0].informacion_personal.municipio || 'Colombia').toUpperCase().trim();

                const deptoResult = getDepartmentPosition(nationalSchools, depto, instPromedio);
                const pctSuperior = deptoResult.total > 0 ? (1 - deptoResult.position / deptoResult.total) * 100 : 0;

                const cols = s3Headers.map((_, i) => String.fromCharCode(66 + i));
                const top3 = deptoResult.topSchools.slice(0, 3);

                const vals: (string | number)[] = [
                    instName,
                    depto,
                    isFinite(instPromedio) ? Math.round(instPromedio * 10) / 10 : 0,
                    deptoResult.total > 0 ? `${deptoResult.position}°` : 'N/D',
                    deptoResult.total > 0 ? deptoResult.total : 0,
                    deptoResult.total > 0 ? `${Math.round(pctSuperior)}%` : 'N/D',
                    (top3[0]?.colegio || '-').substring(0, 35),
                    top3[0]?.promedio || 0,
                    (top3[1]?.colegio || '-').substring(0, 35),
                    top3[1]?.promedio || 0,
                    (top3[2]?.colegio || '-').substring(0, 35),
                    top3[2]?.promedio || 0,
                ];

                vals.forEach((v, i) => {
                    const cell = benchNatSheet.getCell(`${cols[i]}${bRow}`);
                    cell.value = v;
                    cell.alignment = { horizontal: 'center' };
                    cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
                    if (i === 0 || i === 6 || i === 8 || i === 10) cell.alignment = { horizontal: 'left', wrapText: true };
                    if (i === 0) cell.font = { bold: true };
                    if (idx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
                });
                bRow++;
            });
        } else {
            benchNatSheet.getCell(`B${bRow}`).value = '⚠️ No se pudieron cargar los datos nacionales del CSV. La sección 3 no está disponible.';
            benchNatSheet.getCell(`B${bRow}`).font = { italic: true, color: { argb: 'FFD97706' } };
        }
    } catch (err) {
        benchNatSheet.getCell(`B${bRow}`).value = '⚠️ Error al cargar rankings departamentales.';
        benchNatSheet.getCell(`B${bRow}`).font = { italic: true, color: { argb: 'FFDC2626' } };
    }

    // Anchos de columna
    [35, 14, 14, 14, 14, 14, 14, 24, 12, 24, 12, 24, 12].forEach((w, i) => benchNatSheet.getColumn(i + 2).width = w);
    benchNatSheet.views = [{ state: 'frozen', ySplit: s1HRow }];

    // ==========================================
    // 15. HOJA 📈 EVOLUCIÓN MULTI-SIMULACRO
    // ==========================================
    if (otherSimulations.length > 0) {
        const evoSheet = workbook.addWorksheet('📈 Evolución', { views: [{ showGridLines: false }] });

        // Tomar el simulacro anterior (el más reciente de los "otros")
        const prevSim = otherSimulations[otherSimulations.length - 1];
        const prevStudentMap = new Map<string, Estudiante>();
        prevSim.students.forEach(e => {
            const id = (e.informacion_personal.numero_identificacion || '').toString().trim();
            if (id) prevStudentMap.set(id, e);
        });

        // Match students between current and previous
        const areaKeys = ['lectura crítica', 'matemáticas', 'sociales y ciudadanas', 'ciencias naturales', 'inglés'] as const;
        const areaLabels = ['Lectura', 'Matemáticas', 'Sociales', 'Ciencias', 'Inglés'];

        interface EvolutionEntry {
            id: string;
            nombre: string;
            institucion: string;
            tipo: string;
            globalPrev: number;
            globalCurr: number;
            delta: number;
            areaPrev: number[];
            areaCurr: number[];
            areaDelta: number[];
        }

        const evoStudents: EvolutionEntry[] = [];
        estudiantes.forEach(curr => {
            const id = (curr.informacion_personal.numero_identificacion || '').toString().trim();
            if (!id) return;
            const prev = prevStudentMap.get(id);
            if (!prev) return;

            const globalPrev = Number(prev.puntaje_global) || 0;
            const globalCurr = Number(curr.puntaje_global) || 0;
            const inst = (curr.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)').toUpperCase().trim();
            const isIndividual = inst.includes('INDIVIDUAL') || inst.includes('PAGO');

            const areaPrev = areaKeys.map(k => Number(prev.puntajes?.[k]?.puntaje) || 0);
            const areaCurr = areaKeys.map(k => Number(curr.puntajes?.[k]?.puntaje) || 0);
            const areaDelta = areaCurr.map((c, i) => c - areaPrev[i]);

            evoStudents.push({
                id,
                nombre: `${curr.informacion_personal.nombres} ${curr.informacion_personal.apellidos}`.trim(),
                institucion: inst,
                tipo: isIndividual ? '🧑 Individual' : '🏫 Institucional',
                globalPrev,
                globalCurr,
                delta: globalCurr - globalPrev,
                areaPrev,
                areaCurr,
                areaDelta,
            });
        });

        // Sort by delta descending (most improvement first)
        evoStudents.sort((a, b) => b.delta - a.delta);

        // === TITLE ===
        evoSheet.mergeCells('B2:S2');
        evoSheet.getCell('B2').value = '📈 EVOLUCIÓN MULTI-SIMULACRO';
        evoSheet.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FF059669' } };
        evoSheet.getCell('B2').alignment = { horizontal: 'center', vertical: 'middle' };

        evoSheet.mergeCells('B3:S3');
        evoSheet.getCell('B3').value = `Comparación: ${prevSim.name} (${prevSim.date}) → Simulacro actual | ${evoStudents.length} estudiantes en común`;
        evoSheet.getCell('B3').font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
        evoSheet.getCell('B3').alignment = { horizontal: 'center' };

        let eRow = 5;

        // ======== SECCIÓN 1: KPIs ========
        evoSheet.mergeCells(`B${eRow}:S${eRow}`);
        evoSheet.getCell(`B${eRow}`).value = '📊 SECCIÓN 1: INDICADORES CLAVE DE EVOLUCIÓN';
        evoSheet.getCell(`B${eRow}`).font = { size: 14, bold: true, color: { argb: 'FF059669' } };
        eRow++;
        evoSheet.mergeCells(`B${eRow}:S${eRow}`);
        evoSheet.getCell(`B${eRow}`).value = `📌 Datos: Simulacro Seamos Genios | ${evoStudents.length} de ${totalEstudiantes} estudiantes presentaron ambos simulacros`;
        evoSheet.getCell(`B${eRow}`).font = { size: 9, italic: true, color: { argb: 'FF9CA3AF' } };
        eRow += 2;

        const improved = evoStudents.filter(e => e.delta > 0);
        const worsened = evoStudents.filter(e => e.delta < 0);
        const unchanged = evoStudents.filter(e => e.delta === 0);
        const avgDelta = evoStudents.length > 0 ? evoStudents.reduce((s, e) => s + e.delta, 0) / evoStudents.length : 0;
        const bestImprover = evoStudents[0];
        const worstDecline = evoStudents[evoStudents.length - 1];

        const kpis = [
            ['Total evaluados en ambos simulacros', `${evoStudents.length} de ${totalEstudiantes}`],
            ['Δ Promedio Global', `${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(1)} pts`],
            ['Estudiantes que mejoraron', `${improved.length} (${evoStudents.length > 0 ? Math.round(improved.length / evoStudents.length * 100) : 0}%)`],
            ['Estudiantes que empeoraron', `${worsened.length} (${evoStudents.length > 0 ? Math.round(worsened.length / evoStudents.length * 100) : 0}%)`],
            ['Sin cambios', `${unchanged.length}`],
            ['🏆 Mayor mejora', bestImprover ? `${bestImprover.nombre} (+${bestImprover.delta} pts)` : '-'],
            ['⚠️ Mayor descenso', worstDecline && worstDecline.delta < 0 ? `${worstDecline.nombre} (${worstDecline.delta} pts)` : 'Ninguno'],
        ];

        kpis.forEach(([label, value]) => {
            evoSheet.getCell(`B${eRow}`).value = label;
            evoSheet.getCell(`B${eRow}`).font = { bold: true, size: 10 };
            evoSheet.mergeCells(`C${eRow}:E${eRow}`);
            evoSheet.getCell(`C${eRow}`).value = value;
            evoSheet.getCell(`C${eRow}`).font = { size: 10 };
            evoSheet.getCell(`C${eRow}`).alignment = { horizontal: 'left' };
            eRow++;
        });

        eRow += 2;

        // ======== SECCIÓN 2: RESUMEN POR INSTITUCIÓN ========
        evoSheet.mergeCells(`B${eRow}:S${eRow}`);
        evoSheet.getCell(`B${eRow}`).value = '🏫 SECCIÓN 2: EVOLUCIÓN POR INSTITUCIÓN';
        evoSheet.getCell(`B${eRow}`).font = { size: 14, bold: true, color: { argb: 'FF1E40AF' } };
        eRow++;
        evoSheet.mergeCells(`B${eRow}:S${eRow}`);
        evoSheet.getCell(`B${eRow}`).value = '📌 Solo estudiantes que presentaron ambos simulacros — Fuente: Simulacro Seamos Genios';
        evoSheet.getCell(`B${eRow}`).font = { size: 9, italic: true, color: { argb: 'FF9CA3AF' } };
        eRow += 2;

        // Group by institution
        const evoInstMap: Record<string, EvolutionEntry[]> = {};
        evoStudents.forEach(e => {
            if (!evoInstMap[e.institucion]) evoInstMap[e.institucion] = [];
            evoInstMap[e.institucion].push(e);
        });

        const instHeaders = ['INSTITUCIÓN', 'TIPO', '# EST.', `PROM. ${prevSim.name}`, 'PROM. ACTUAL', 'Δ CAMBIO', '% MEJORÓ', 'TENDENCIA'];
        instHeaders.forEach((h, i) => {
            const col = String.fromCharCode(66 + i);
            const cell = evoSheet.getCell(`${col}${eRow}`);
            cell.value = h;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        eRow++;

        Object.entries(evoInstMap)
            .sort((a, b) => {
                const avgA = a[1].reduce((s, e) => s + e.delta, 0) / a[1].length;
                const avgB = b[1].reduce((s, e) => s + e.delta, 0) / b[1].length;
                return avgB - avgA;
            })
            .forEach(([instName, ests], idx) => {
                const avgPrev = ests.reduce((s, e) => s + e.globalPrev, 0) / ests.length;
                const avgCurr = ests.reduce((s, e) => s + e.globalCurr, 0) / ests.length;
                const avgD = avgCurr - avgPrev;
                const pctImproved = ests.filter(e => e.delta > 0).length / ests.length;
                const isIndiv = instName.includes('INDIVIDUAL') || instName.includes('PAGO');

                const cols = instHeaders.map((_, i) => String.fromCharCode(66 + i));
                const vals: (string | number)[] = [
                    instName.substring(0, 40),
                    isIndiv ? '🧑 Individual' : '🏫 Institucional',
                    ests.length,
                    Math.round(avgPrev * 10) / 10,
                    Math.round(avgCurr * 10) / 10,
                    Math.round(avgD * 10) / 10,
                    `${Math.round(pctImproved * 100)}%`,
                    avgD > 0 ? '📈 Subió' : avgD < 0 ? '📉 Bajó' : '➡️ Igual',
                ];

                vals.forEach((v, i) => {
                    const cell = evoSheet.getCell(`${cols[i]}${eRow}`);
                    cell.value = v;
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    if (i === 0) cell.alignment = { horizontal: 'left', vertical: 'middle' };
                    if (i === 5 && typeof v === 'number') {
                        cell.font = { bold: true, color: { argb: v >= 0 ? 'FF16A34A' : 'FFDC2626' } };
                        cell.value = v >= 0 ? `+${v}` : `${v}`;
                    }
                    cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
                    if (idx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
                });
                eRow++;
            });

        eRow += 2;

        // ======== SECCIÓN 3: DETALLE POR ESTUDIANTE ========
        evoSheet.mergeCells(`B${eRow}:S${eRow}`);
        evoSheet.getCell(`B${eRow}`).value = '👤 SECCIÓN 3: DETALLE POR ESTUDIANTE';
        evoSheet.getCell(`B${eRow}`).font = { size: 14, bold: true, color: { argb: 'FFD97706' } };
        eRow++;
        evoSheet.mergeCells(`B${eRow}:S${eRow}`);
        evoSheet.getCell(`B${eRow}`).value = `📌 ${evoStudents.length} estudiantes presentaron ${prevSim.name} y el simulacro actual — Fuente: Simulacro Seamos Genios`;
        evoSheet.getCell(`B${eRow}`).font = { size: 9, italic: true, color: { argb: 'FF9CA3AF' } };
        eRow += 2;

        // Headers
        const detHeaders = [
            '#', 'NOMBRE', 'ID', 'INSTITUCIÓN', 'TIPO',
            `GLOBAL ${prevSim.name.split(' ').pop()}`, 'GLOBAL ACTUAL', 'Δ GLOBAL',
            ...areaLabels.flatMap(a => [`${a} ANT.`, `${a} ACT.`, `Δ ${a}`]),
        ];

        detHeaders.forEach((h, i) => {
            const col = i + 2; // Start at column B
            const cell = evoSheet.getCell(eRow, col);
            cell.value = h;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });
        const evoHRow = eRow;
        eRow++;

        // Data rows
        evoStudents.forEach((evo, idx) => {
            const rowVals: (string | number)[] = [
                idx + 1,
                evo.nombre.substring(0, 30),
                evo.id,
                evo.institucion.substring(0, 25),
                evo.tipo,
                evo.globalPrev,
                evo.globalCurr,
                evo.delta,
                ...areaLabels.flatMap((_, ai) => [evo.areaPrev[ai], evo.areaCurr[ai], evo.areaDelta[ai]]),
            ];

            rowVals.forEach((v, i) => {
                const cell = evoSheet.getCell(eRow, i + 2);
                cell.value = v;
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                if (i === 1 || i === 3) cell.alignment = { horizontal: 'left', vertical: 'middle' };
                cell.font = { size: 9 };
                cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };

                // Color delta columns green/red
                if (i === 7 || (i >= 10 && (i - 10) % 3 === 2)) {
                    const numV = typeof v === 'number' ? v : 0;
                    cell.font = { size: 9, bold: true, color: { argb: numV > 0 ? 'FF16A34A' : numV < 0 ? 'FFDC2626' : 'FF6B7280' } };
                    if (typeof v === 'number') cell.value = numV >= 0 ? `+${numV}` : `${numV}`;
                }

                // Zebra striping
                if (idx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
            });
            eRow++;
        });

        // Column widths
        const evoWidths = [5, 25, 14, 22, 14, 12, 12, 10, ...areaLabels.flatMap(() => [10, 10, 8])];
        evoWidths.forEach((w, i) => evoSheet.getColumn(i + 2).width = w);
        evoSheet.views = [{ state: 'frozen', ySplit: evoHRow, xSplit: 4 }];
    }

    // ==========================================
    // 16. HOJA BASE_DATOS (FORMATO SIMPLE PARA FÓRMULAS) — ENRIQUECIDA
    // ==========================================
    const dbSheet = workbook.addWorksheet('BASE_DATOS');

    // Headers simples en fila 1 (para compatibilidad con fórmulas del Dashboard)
    dbSheet.columns = [
        { header: '#', key: 'pos', width: 6 },
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Nombres', key: 'nombres', width: 22 },
        { header: 'Apellidos', key: 'apellidos', width: 22 },
        { header: 'Correo', key: 'correo', width: 28 },
        { header: 'Teléfono', key: 'telefono', width: 14 },
        { header: 'Global', key: 'global', width: 12 },
        { header: 'Matemáticas', key: 'matematicas', width: 14 },
        { header: 'Lectura', key: 'lectura', width: 14 },
        { header: 'Sociales', key: 'sociales', width: 14 },
        { header: 'Ciencias', key: 'ciencias', width: 14 },
        { header: 'Inglés', key: 'ingles', width: 12 },
        { header: 'Nivel', key: 'nivel', width: 12 },
        { header: 'Institución', key: 'institucion', width: 28 },
        { header: 'Departamento', key: 'departamento', width: 18 },
        { header: 'S1', key: 's1', width: 12 },
        { header: 'S2', key: 's2', width: 12 },
        { header: 'Área Fuerte', key: 'areaFuerte', width: 18 },
        { header: 'Área Débil', key: 'areaDebil', width: 18 },
        { header: 'Brecha', key: 'brecha', width: 10 },
    ];

    // Estilo para headers
    const headerRow = dbSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };

    // Ordenar estudiantes por puntaje global
    const estudiantesOrdenados = [...estudiantes].sort((a, b) =>
        (Number(b.puntaje_global) || 0) - (Number(a.puntaje_global) || 0)
    );

    // Agregar datos (empezando en fila 2)
    estudiantesOrdenados.forEach((est, index) => {
        const idStr = (est.informacion_personal.numero_identificacion !== undefined && est.informacion_personal.numero_identificacion !== null) ? est.informacion_personal.numero_identificacion.toString().trim() : '';
        const globalScore = Number(est.puntaje_global) || 0;


        let nivelCalculado: string;
        if (globalScore <= 200) nivelCalculado = 'Bajo';
        else if (globalScore <= 300) nivelCalculado = 'Básico';
        else if (globalScore <= 400) nivelCalculado = 'Alto';
        else nivelCalculado = 'Superior';

        const mat = Number(est.puntajes?.['matemáticas']?.puntaje) || 0;
        const lec = Number(est.puntajes?.['lectura crítica']?.puntaje) || 0;
        const soc = Number(est.puntajes?.['sociales y ciudadanas']?.puntaje) || 0;
        const cie = Number(est.puntajes?.['ciencias naturales']?.puntaje) || 0;
        const ing = Number(est.puntajes?.['inglés']?.puntaje) || 0;

        const s1Str = (est.s1_aciertos !== undefined && est.s1_total) ? `${est.s1_aciertos}/${est.s1_total}` : '-';
        const s2Str = (est.s2_aciertos !== undefined && est.s2_total) ? `${est.s2_aciertos}/${est.s2_total}` : '-';

        // Calcular área fuerte/débil
        const areasStudents = [
            { name: 'Matemáticas', score: mat },
            { name: 'Lectura Crítica', score: lec },
            { name: 'Sociales', score: soc },
            { name: 'Ciencias', score: cie },
            { name: 'Inglés', score: ing },
        ].filter(a => a.score > 0);

        let areaFuerte = '-', areaDebil = '-', brechaVal = 0;
        if (areasStudents.length >= 2) {
            const sortedAreas = [...areasStudents].sort((a, b) => b.score - a.score);
            areaFuerte = `${sortedAreas[0].name} (${sortedAreas[0].score})`;
            areaDebil = `${sortedAreas[sortedAreas.length - 1].name} (${sortedAreas[sortedAreas.length - 1].score})`;
            brechaVal = sortedAreas[0].score - sortedAreas[sortedAreas.length - 1].score;
        }

        dbSheet.addRow({
            pos: index + 1,
            id: idStr,
            nombres: est.informacion_personal.nombres || '',
            apellidos: est.informacion_personal.apellidos || '',
            correo: est.informacion_personal.correo_electronico || '',
            telefono: est.informacion_personal.telefono || '',
            global: globalScore,
            matematicas: mat,
            lectura: lec,
            sociales: soc,
            ciencias: cie,
            ingles: ing,
            nivel: nivelCalculado,
            institucion: est.informacion_personal.institucion || '',
            departamento: est.informacion_personal.departamento || est.informacion_personal.municipio || '',
            s1: s1Str,
            s2: s2Str,
            areaFuerte,
            areaDebil,
            brecha: brechaVal,
        });
    });

    dbSheet.autoFilter = { from: 'A1', to: { row: 1, column: 20 } };

    // ==========================================
    // ESTILOS PARA BASE_DATOS: Formato condicional + Zebra striping
    // ==========================================
    // Congelar fila de encabezado
    dbSheet.views = [{ state: 'frozen' as const, ySplit: 1 }];

    // Aplicar formato condicional a filas de datos
    const dataRowCount = estudiantesOrdenados.length;
    for (let rowIdx = 2; rowIdx <= dataRowCount + 1; rowIdx++) {
        const row = dbSheet.getRow(rowIdx);

        // Zebra striping (filas pares)
        if (rowIdx % 2 === 0) {
            row.eachCell({ includeEmpty: true }, (cell) => {
                if (!cell.fill || (cell.fill as any).fgColor === undefined) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                }
            });
        }

        // Formato condicional para columna Global (col 7, 0-500)
        const globalCell = row.getCell(7);
        const globalVal = Number(globalCell.value) || 0;
        if (globalVal > 400) {
            globalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
            globalCell.font = { bold: true, color: { argb: 'FF166534' } };
        } else if (globalVal > 300) {
            globalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
            globalCell.font = { bold: true, color: { argb: 'FF1E40AF' } };
        } else if (globalVal > 200) {
            globalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
            globalCell.font = { bold: true, color: { argb: 'FF92400E' } };
        } else if (globalVal > 0) {
            globalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            globalCell.font = { bold: true, color: { argb: 'FF991B1B' } };
        }

        // Formato condicional para columnas de materias (cols 8-12, 0-100)
        for (let colIdx = 8; colIdx <= 12; colIdx++) {
            const cell = row.getCell(colIdx);
            const val = Number(cell.value) || 0;
            if (val >= 80) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
                cell.font = { color: { argb: 'FF166534' } };
            } else if (val >= 60) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
                cell.font = { color: { argb: 'FF92400E' } };
            } else if (val > 0) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                cell.font = { color: { argb: 'FF991B1B' } };
            }
        }

        // Formato para columna Nivel (col 13)
        const nivelCell = row.getCell(13);
        const nivelVal = (nivelCell.value || '').toString();
        if (nivelVal === 'Superior') {
            nivelCell.font = { bold: true, color: { argb: 'FF166534' } };
        } else if (nivelVal === 'Alto') {
            nivelCell.font = { bold: true, color: { argb: 'FF1E40AF' } };
        } else if (nivelVal === 'Básico') {
            nivelCell.font = { bold: true, color: { argb: 'FF92400E' } };
        } else if (nivelVal === 'Bajo') {
            nivelCell.font = { bold: true, color: { argb: 'FF991B1B' } };
        }
    }

    // ==========================================
    // POST-PROCESAMIENTO: Alineación vertical middle en todas las hojas
    // ==========================================
    workbook.eachSheet((sheet) => {
        sheet.eachRow((row) => {
            row.eachCell({ includeEmpty: false }, (cell) => {
                const existing = cell.alignment || {};
                cell.alignment = { ...existing, vertical: 'middle' };
            });
            // Altura mínima de fila para legibilidad
            if (!row.height || row.height < 18) {
                row.height = 18;
            }
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

