'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Estudiante } from '@shared/types';
import type { InstitutionQuestionStats, SimulacionEstadisticas } from '@features/simulacro/lib/firestoreService';
import {
  COORD_STORAGE_KEYS,
  DEFAULT_COORDINADOR_DATA_OPTIONS,
  type CoordinadorDataOptions,
  type CoordinadorStorageKeys,
} from '@features/coordinador/hooks/coordinadorDataOptions';
import type {
  AlertaEstudiante,
  CoordinadorData,
  InstitutionMetrics,
  QuestionStat,
  SubjectStat,
} from '@features/coordinador/hooks/coordinadorTypes';
import {
  COORD_AREAS,
  clasificarNivel,
  crossFilteredSimulationsForInstitution,
  simulationHasInstitutionInSummary,
  collectSimulationInstitutionKeys,
  distribucionToCounts,
  filterInstitutionKeys,
  filterSimsForDemo,
  filterSummaryForDemo,
  hasDetailedAnswers,
  hydrateCoordinatorStudents,
  institutionMatchesScope,
  mean,
  median,
  mode,
  rankingEntriesToEstudiantes,
  resolveCoordinadorDataOptions,
  simulationHasInstitutionScope,
  stddev,
} from '@features/coordinador/lib/coordinadorDataHelpers';
import {
  isGlobalCoordinatorScope,
  isCoordinatorSelectionAggregated,
  parseCoordinatorScope,
} from '@features/auth/lib/admin-auth';
import { isDemoCoordinadorRoute } from '@/app/demo/_shared/demoRoutePaths';
import {
  DEMO_INSTITUTION,
  maskEstudianteListForDemo,
} from '@/app/demo/_shared/demoPrivacy';
import {
  canonicalInstitutionName,
  institutionsMatch,
} from '@shared/lib/institucionesAcondicionamiento';
import {
  PIFA_CURSO_TODOS,
  PIFA_GRADO_TODOS,
  collectGroupedCursoOptions,
  enrichEstudiantesConPifaCurso,
  ensurePifaCatalogLoaded,
  filterStudentsByPifaCurso,
  gradoFromPifaOption,
  isIndividualInstitution,
} from '@shared/lib/pifaCurso';
import { useCoordinadorFilters } from '@features/coordinador/hooks/useCoordinadorFilters';
import { broadcastCoordinatorSimulation } from '@features/coordinador/lib/coordinatorNavPolicy';

export type {
  AlertaEstudiante,
  CoordinadorData,
  InstitutionMetrics,
  QuestionStat,
  SubjectStat,
} from '@features/coordinador/hooks/coordinadorTypes';
export type { CoordinadorDataOptions } from '@features/coordinador/hooks/coordinadorDataOptions';
export { DEMO_COORDINADOR_DATA_OPTIONS } from '@features/coordinador/hooks/coordinadorDataOptions';

// ─── Hook ───────────────────────────────────────────────────
export function useCoordinadorData(
  options: CoordinadorDataOptions = DEFAULT_COORDINADOR_DATA_OPTIONS,
): CoordinadorData {
    const pathname = usePathname();
    const resolved = useMemo(
      () => resolveCoordinadorDataOptions(pathname, options),
      [pathname, options],
    );
    const storageKeys: CoordinadorStorageKeys = {
        ...COORD_STORAGE_KEYS,
        ...resolved.storageKeys,
    };
    const loadDataModule =
        resolved.loadDataModule ?? DEFAULT_COORDINADOR_DATA_OPTIONS.loadDataModule!;
    const allSimulationsUnfiltered = resolved.allSimulationsUnfiltered === true;
    const {
        baseInstitution,
        selectedInstitution,
        currentSimulation,
        setBaseInstitution,
        setSelectedInstitution,
        setCurrentSimulation,
    } = useCoordinadorFilters(resolved, storageKeys);
    const [allStudents, setAllStudents] = useState<Estudiante[]>([]);
    const [availableSimulations, setAvailableSimulations] = useState<string[]>([]);
    const [selectedCurso, setSelectedCurso] = useState(PIFA_CURSO_TODOS);
    const [pifaCatalogReady, setPifaCatalogReady] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Fallback: pre-aggregated data when admin_students chunks are absent
    const [aggregateStats, setAggregateStats] = useState<SimulacionEstadisticas | null>(null);
    const [institutionQuestionStats, setInstitutionQuestionStats] = useState<InstitutionQuestionStats | null>(null);
    // coordinator_summary cached for cross-filtering (0 extra reads)
    const [summary, setSummary] = useState<Record<string, any> | null>(null);
    // All simulations from config (unfiltered)
    const [allSims, setAllSims] = useState<string[]>([]);

    useEffect(() => {
        if (currentSimulation) {
            broadcastCoordinatorSimulation(currentSimulation);
        }
    }, [currentSimulation]);

    const coordinatorScopeAllowed = useMemo(
        () => parseCoordinatorScope(baseInstitution),
        [baseInstitution],
    );
    const isScopedCoordinator =
        coordinatorScopeAllowed.length > 0 && !isGlobalCoordinatorScope(baseInstitution);
    const isSingleInstitutionScope = isScopedCoordinator && coordinatorScopeAllowed.length === 1;
    const isMultiInstitutionScope = isScopedCoordinator && coordinatorScopeAllowed.length > 1;

    // Load simulations + coordinator_summary (1 Firestore read total)
    useEffect(() => {
        if (!baseInstitution) {
            queueMicrotask(() => setLoading(false));
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const { listAvailableSimulations, getAppConfig, getCoordinatorSummary } =
                    await loadDataModule();
                const [sims, cfg, summaryData] = await Promise.all([
                    listAvailableSimulations(), getAppConfig(), getCoordinatorSummary()
                ]);

                if (cancelled) return;

                const demoSummary = filterSummaryForDemo(
                    summaryData as Record<string, unknown>,
                    resolved.allowedSimulationIds,
                );
                const demoSims = filterSimsForDemo(sims, resolved.allowedSimulationIds);

                setAllSims(demoSims);
                setSummary(demoSummary);

                const isGlobalScope = isGlobalCoordinatorScope(baseInstitution);

                // Filter sims where scoped institution(s) participated
                let filteredSims = demoSims;
                if (
                    !allSimulationsUnfiltered &&
                    !isGlobalScope &&
                    isScopedCoordinator &&
                    demoSummary &&
                    Object.keys(demoSummary).length > 0
                ) {
                    const matched = demoSims.filter((simId) =>
                        simulationHasInstitutionScope(
                            demoSummary as Record<string, { institutions?: Record<string, unknown> }>,
                            simId,
                            coordinatorScopeAllowed,
                        ),
                    );
                    if (matched.length > 0) filteredSims = matched;
                }

                filteredSims = filterSimsForDemo(filteredSims, resolved.allowedSimulationIds);
                setAvailableSimulations(filteredSims);
                const activeSim = cfg.activeSimulation || '';
                const savedSim = localStorage.getItem(storageKeys.selectedSimulation);
                const preferredDemoSim = isDemoCoordinadorRoute(pathname) && filteredSims.includes('EDU-PILOT-01')
                    ? 'EDU-PILOT-01'
                    : '';
                const startSim = preferredDemoSim
                    ? preferredDemoSim
                    : (savedSim && filteredSims.includes(savedSim))
                    ? savedSim
                    : filteredSims.includes(activeSim)
                    ? activeSim
                    : filteredSims[filteredSims.length - 1] || '';

                if (!startSim) {
                    localStorage.removeItem(storageKeys.selectedSimulation);
                    setCurrentSimulation('');
                    setError('No hay simulacros disponibles para esta institución');
                    setLoading(false);
                    return;
                }

                localStorage.setItem(storageKeys.selectedSimulation, startSim);
                setCurrentSimulation(startSim);
            } catch (e) {
                if (cancelled) return;
                console.error('[Coordinador] Error:', e);
                setError('Error cargando simulacros');
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [
        allSimulationsUnfiltered,
        baseInstitution,
        coordinatorScopeAllowed,
        isScopedCoordinator,
        loadDataModule,
        storageKeys.selectedSimulation,
        resolved.allowedSimulationIds,
    ]);

    // ── Cross-filter: institutions available for current simulation ──
    const crossFilteredInstitutions = useMemo(() => {
        if (isDemoCoordinadorRoute(pathname)) {
            return [DEMO_INSTITUTION];
        }
        let keys = collectSimulationInstitutionKeys({
            summary,
            simulationId: currentSimulation,
            students: allStudents,
            institutionQuestionStats,
        });
        if (isScopedCoordinator) {
            keys = filterInstitutionKeys(keys, coordinatorScopeAllowed);
        }
        return keys;
    }, [
        summary,
        currentSimulation,
        pathname,
        allStudents,
        institutionQuestionStats,
        isScopedCoordinator,
        coordinatorScopeAllowed,
    ]);

    // Coordinador global / multi-institución sin selección previa → primera institución del sim.
    useEffect(() => {
        const isGlobal = isGlobalCoordinatorScope(baseInstitution);
        if (!isGlobal && !isMultiInstitutionScope) return;
        if (!summary || !currentSimulation) return;

        const current = selectedInstitution.trim();
        if (current) return;

        if (crossFilteredInstitutions.length === 0) return;

        const next = crossFilteredInstitutions[0];
        setSelectedInstitution(next);
        localStorage.setItem(storageKeys.selectedInstitution, next);
    }, [
        baseInstitution,
        isMultiInstitutionScope,
        summary,
        currentSimulation,
        selectedInstitution,
        crossFilteredInstitutions,
        storageKeys.selectedInstitution,
    ]);

    /** Sims donde la institución sí participó pero aún no están en coordinator_summary. */
    const [rankingConfirmedSimIds, setRankingConfirmedSimIds] = useState<string[]>([]);
    const rankingInstitutionCacheRef = useRef<Map<string, boolean>>(new Map());

    useEffect(() => {
        const inst = selectedInstitution.trim();
        if (!inst || inst.toUpperCase() === 'TODAS' || inst === '*') {
            setRankingConfirmedSimIds([]);
            return;
        }
        // Probar contra todos los sims publicados, no solo los ya filtrados por summary
        // (p. ej. SG11-18 con IETAC en ranking pero summary desactualizado en Firestore).
        const simsToProbe = allSims.length > 0 ? allSims : availableSimulations;
        if (!summary || simsToProbe.length === 0) {
            setRankingConfirmedSimIds([]);
            return;
        }

        const instCanon = canonicalInstitutionName(inst);
        const needsProbe = simsToProbe.filter((simId) => {
            if (simulationHasInstitutionInSummary(summary, simId, inst)) return false;
            const cacheKey = `${simId}|${instCanon}`;
            return !rankingInstitutionCacheRef.current.has(cacheKey);
        });

        const fromCache = simsToProbe.filter((simId) => {
            const cacheKey = `${simId}|${instCanon}`;
            return rankingInstitutionCacheRef.current.get(cacheKey) === true;
        });

        setRankingConfirmedSimIds(fromCache);

        if (needsProbe.length === 0) {
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const { getRanking } = await loadDataModule();
                const newlyConfirmed: string[] = [];
                await Promise.all(
                    needsProbe.map(async (simId) => {
                        const cacheKey = `${simId}|${instCanon}`;
                        try {
                            const ranking = await getRanking(simId);
                            const hasInst = ranking.some((entry) =>
                                institutionsMatch(entry.institucion || '', inst),
                            );
                            rankingInstitutionCacheRef.current.set(cacheKey, hasInst);
                            if (hasInst) newlyConfirmed.push(simId);
                        } catch {
                            rankingInstitutionCacheRef.current.set(cacheKey, false);
                        }
                    }),
                );
                if (!cancelled) {
                    setRankingConfirmedSimIds([...new Set([...fromCache, ...newlyConfirmed])]);
                }
            } catch {
                if (!cancelled) setRankingConfirmedSimIds(fromCache);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [
        selectedInstitution,
        summary,
        allSims,
        availableSimulations,
        loadDataModule,
    ]);

    const crossFilteredSimulations = useMemo(
        () =>
            crossFilteredSimulationsForInstitution(
                summary,
                availableSimulations,
                selectedInstitution,
                rankingConfirmedSimIds,
            ),
        [summary, selectedInstitution, availableSimulations, rankingConfirmedSimIds],
    );

    const availableInstitutionsList = useMemo(() => {
        if (isSingleInstitutionScope) {
            return [coordinatorScopeAllowed[0].toUpperCase()];
        }
        if (isMultiInstitutionScope) {
            return ['TODAS', ...crossFilteredInstitutions];
        }
        return ['TODAS', ...crossFilteredInstitutions];
    }, [
        isSingleInstitutionScope,
        isMultiInstitutionScope,
        coordinatorScopeAllowed,
        crossFilteredInstitutions,
    ]);

    // Track whether we've already tried auto-fallback to avoid loops
    const [triedFallback, setTriedFallback] = useState(false);

    // ── Load students ONLY for the current simulation (not all) ──
    useEffect(() => {
        if (!currentSimulation) return;

        setLoading(true);
        setAllStudents([]);
        setAggregateStats(null);
        setInstitutionQuestionStats(null);
        setError(null);

        let cancelled = false;
        (async () => {
            try {
                const {
                    getAllStudents,
                    getRanking,
                    getSimulationEstadisticas,
                    getInstitutionQuestionStats,
                } = await loadDataModule();

                let students: Estudiante[] = [];
                let statsData: SimulacionEstadisticas | null = null;
                let instQuestionStatsData: InstitutionQuestionStats | null = null;

                // Carga completa: chunks / students.json primero; ranking solo como fallback.
                try {
                    [students, statsData, instQuestionStatsData] = await Promise.all([
                        getAllStudents(currentSimulation),
                        getSimulationEstadisticas(currentSimulation),
                        getInstitutionQuestionStats(currentSimulation),
                    ]);
                } catch { /* ignore */ }

                if (cancelled) return;

                if (students.length === 0) {
                    try {
                        const [rankingEntries, stats, instStats] = await Promise.all([
                            getRanking(currentSimulation),
                            getSimulationEstadisticas(currentSimulation),
                            getInstitutionQuestionStats(currentSimulation),
                        ]);
                        statsData = stats;
                        instQuestionStatsData = instStats;
                        students = rankingEntriesToEstudiantes(rankingEntries);
                    } catch { /* ignore */ }
                } else if (!statsData) {
                    try {
                        [statsData, instQuestionStatsData] = await Promise.all([
                            getSimulationEstadisticas(currentSimulation),
                            getInstitutionQuestionStats(currentSimulation),
                        ]);
                    } catch { /* ignore */ }
                }

                if (cancelled) return;

                // No hidratar answerDetails aquí (N reads). Scores vienen en chunks.
                // Análisis/Estudiantes llaman loadFullStudents() para el detalle.
                if (isDemoCoordinadorRoute(pathname)) {
                    students = maskEstudianteListForDemo(students, { force: true });
                }
                setAggregateStats(statsData);
                setInstitutionQuestionStats(instQuestionStatsData);
                setAllStudents(students);
                console.log(`[Coordinador] ${currentSimulation}: ${students.length} estudiantes cargados`);

            } catch (e) {
                if (!cancelled) {
                    console.error('[Coordinador] Error cargando estudiantes:', e);
                    setError('Error cargando estudiantes');
                }
            }
            if (!cancelled) setLoading(false);
        })();

        return () => { cancelled = true; };
    }, [currentSimulation, baseInstitution, selectedInstitution, loadDataModule, pathname]);

    // Catálogo PIFA (documento → grado/curso) — fetch si el import está vacío
    useEffect(() => {
        let cancelled = false;
        ensurePifaCatalogLoaded().then((n) => {
            if (!cancelled) setPifaCatalogReady(n);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // ─── Compute Everything ────────────────────────
    const result = useMemo(() => {
        if (allStudents.length === 0) return {
            myInstitution: null, allInstitutions: [], questionAnalysis: {},
            alertas: { critico: [], alto: [], moderado: [], monitoreo: [] },
            ranking: [], availableInstitutions: [],
            availableCursos: [],
            cohortStudents: [] as Estudiante[],
        };

        // Group by institution (aliases → canónico) + enriquecer curso/grado PIFA
        const scopedStudents = enrichEstudiantesConPifaCurso(
            isScopedCoordinator
                ? allStudents.filter((s) =>
                      institutionMatchesScope(
                          s.informacion_personal?.institucion || '',
                          coordinatorScopeAllowed,
                      ),
                  )
                : allStudents,
        );

        const groups = new Map<string, Estudiante[]>();
        scopedStudents.forEach(s => {
            const raw = s.informacion_personal?.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)';
            const inst = canonicalInstitutionName(raw);
            if (!groups.has(inst)) groups.set(inst, []);
            groups.get(inst)!.push(s);
        });

        const selectedKey = canonicalInstitutionName(selectedInstitution);
        const aggregatedSelection = isCoordinatorSelectionAggregated(
            baseInstitution,
            selectedInstitution,
        );
        
        // Cross-filtered institutions: only those present in the current simulation
        const availableInstitutions = isSingleInstitutionScope
            ? [canonicalInstitutionName(coordinatorScopeAllowed[0])]
            : ['TODAS', ...crossFilteredInstitutions];

        const buildMetrics = (name: string, students: Estudiante[]): InstitutionMetrics => {
            const scores = students.map(s => s.puntaje_global || 0).filter(p => p > 0);
            const n = scores.length || 1;
            const sorted = [...scores].sort((a, b) => a - b);
            const avg = mean(scores);
            const med = median(scores);
            const sd = stddev(scores);
            const p25v = sorted[Math.floor(n * 0.25)] || 0;
            const p75v = sorted[Math.floor(n * 0.75)] || 0;
            const p90v = sorted[Math.floor(n * 0.90)] || 0;

            const niveles = { superior: 0, alto: 0, medio: 0, bajo: 0 };
            students.forEach(s => {
                const p = s.puntaje_global || 0;
                const niv = clasificarNivel(p).toLowerCase() as keyof typeof niveles;
                if (niv in niveles) niveles[niv]++;
            });

            const distribucion: Record<string, number> = {
                '0-199': 0, '200-249': 0, '250-299': 0, '300-324': 0,
                '325-349': 0, '350-374': 0, '375-399': 0, '400-449': 0, '450-500': 0,
            };
            scores.forEach(p => {
                if (p < 200) distribucion['0-199']++;
                else if (p < 250) distribucion['200-249']++;
                else if (p < 300) distribucion['250-299']++;
                else if (p < 325) distribucion['300-324']++;
                else if (p < 350) distribucion['325-349']++;
                else if (p < 375) distribucion['350-374']++;
                else if (p < 400) distribucion['375-399']++;
                else if (p < 450) distribucion['400-449']++;
                else distribucion['450-500']++;
            });

            const subjectStats: SubjectStat[] = COORD_AREAS.map(area => {
                const ss = students
                    .map(s => Number(s.puntajes?.[area.key]?.puntaje) || 0)
                    .filter(v => v > 0);
                const correctas = students.reduce((sum, s) => sum + (Number(s.puntajes?.[area.key]?.correctas) || 0), 0);
                const totalPreguntas = students.reduce((sum, s) => sum + (Number(s.puntajes?.[area.key]?.total_preguntas) || 0), 0);
                const a = mean(ss);
                const sd2 = stddev(ss);
                return {
                    name: area.name, key: area.key,
                    avg: Math.round(a * 10) / 10,
                    median: Math.round(median(ss) * 10) / 10,
                    mode: mode(ss.map(Math.round)),
                    min: ss.length > 0 ? Math.min(...ss) : 0,
                    max: ss.length > 0 ? Math.max(...ss) : 0,
                    stdDev: Math.round(sd2 * 10) / 10,
                    varPct: a > 0 ? Math.round((sd2 / a) * 1000) / 10 : 0,
                    correctas, totalPreguntas, countStudents: ss.length,
                };
            });

            const top5 = [...students].filter(s => (s.puntaje_global || 0) > 0)
                .sort((a, b) => (b.puntaje_global || 0) - (a.puntaje_global || 0)).slice(0, 5);
            const enRiesgo = [...students].filter(s => (s.puntaje_global || 0) > 0 && (s.puntaje_global || 0) < 300)
                .sort((a, b) => (a.puntaje_global || 0) - (b.puntaje_global || 0)).slice(0, 5);

            return {
                name, students, avg: Math.round(avg), median: Math.round(med),
                stdDev: Math.round(sd * 10) / 10, coefVar: avg > 0 ? Math.round((sd / avg) * 1000) / 10 : 0,
                max: Math.max(...scores, 0), min: scores.length > 0 ? Math.min(...scores) : 0,
                p25: p25v, p75: p75v, p90: p90v, iqr: p75v - p25v,
                tasaAprobacion: Math.round((scores.filter(p => p >= 300).length / n) * 1000) / 10,
                niveles, distribucion, subjectStats, top5, enRiesgo,
            };
        };

        const allInst = Array.from(groups.entries())
            .map(([name, sts]) => buildMetrics(name, sts))
            .sort((a, b) => b.avg - a.avg);

        let myInst: InstitutionMetrics | null = null;
        let cohortForPifa: Estudiante[] = [];

        if (aggregatedSelection) {
            cohortForPifa = scopedStudents;
        } else {
            myInst = allInst.find((i) => institutionsMatch(i.name, selectedKey)) || null;
            if (!myInst) {
                const matchedStudents = scopedStudents.filter((s) =>
                    institutionsMatch(s.informacion_personal?.institucion || '', selectedKey),
                );
                if (matchedStudents.length > 0) {
                    myInst = buildMetrics(selectedKey, matchedStudents);
                }
            }
            cohortForPifa = myInst?.students || [];
        }

        // Un solo filtro PIFA: grado/curso (columna `curso` del Excel → 9, 11-1, …).
        // Individuales: sin selector. TODAS: sí, sobre cohorte global.
        const skipPifaFilter =
            isIndividualInstitution(selectedKey) ||
            isIndividualInstitution(myInst?.name);
        const availableCursos = skipPifaFilter
            ? []
            : collectGroupedCursoOptions(cohortForPifa);
        const cursoFilter =
            !skipPifaFilter && availableCursos.includes(selectedCurso)
                ? selectedCurso
                : PIFA_CURSO_TODOS;
        const gradoFilter = gradoFromPifaOption(cursoFilter) || PIFA_GRADO_TODOS;
        const myStudents = filterStudentsByPifaCurso(
            cohortForPifa,
            gradoFilter,
            gradoFilter === PIFA_GRADO_TODOS ? cursoFilter : PIFA_CURSO_TODOS,
        );

        if (aggregatedSelection) {
            myInst = buildMetrics('TODAS LAS INSTITUCIONES', myStudents);
        } else {
            const displayName = myInst?.name || selectedKey;
            myInst = myStudents.length > 0 || cohortForPifa.length === 0
                ? buildMetrics(displayName, myStudents)
                : buildMetrics(displayName, []);
        }
        // ─── Question Analysis ────────────────────────────────
        // Path A: per-student respuestas_detalladas (primary — full audit capability)
        // Path B: pre-aggregated estadisticas doc (fallback — counts only, no per-student breakdown)
        const questionAnalysis: Record<string, QuestionStat[]> = {};

        const studentsHaveAnswers = myStudents.some(s => s.respuestas_detalladas && Object.keys(s.respuestas_detalladas).length > 0);
        const institutionStatsForSelection = (() => {
            if (!institutionQuestionStats || Object.keys(institutionQuestionStats).length === 0) return null;
            if (aggregatedSelection) {
                return institutionQuestionStats.TODAS || institutionQuestionStats['TODAS LAS INSTITUCIONES'] || null;
            }
            const target = myInst?.name || selectedKey;
            const key = Object.keys(institutionQuestionStats).find((k) =>
                institutionsMatch(k, target),
            );
            return key ? institutionQuestionStats[key] : null;
        })();

        if (studentsHaveAnswers) {
            // ── Path A: Compute from per-student answer details ──
            const qRaw: Record<string, Record<number, { failed: number; total: number; correct: string; counts: Record<string, number>; studentMap: Record<string, string[]> }>> = {};

            myStudents.forEach(est => {
                if (!est.respuestas_detalladas) return;
                Object.entries(est.respuestas_detalladas).forEach(([materia, resps]) => {
                    if (!qRaw[materia]) qRaw[materia] = {};

                    let items: { numero: number; respuesta_estudiante: string; respuesta_correcta: string; es_correcta: boolean }[] = [];
                    if (Array.isArray(resps)) {
                        items = (resps as any[]).map((r: any) => ({
                            numero: r.numero, respuesta_estudiante: r.respuesta_estudiante || r.respuesta || '',
                            respuesta_correcta: r.respuesta_correcta || r.correcta || '?', es_correcta: !!r.es_correcta,
                        }));
                    } else if (resps && typeof resps === 'object') {
                        items = Object.entries(resps as Record<string, any>).map(([qNum, r]) => ({
                            numero: parseInt(qNum) || 0, respuesta_estudiante: r.respuesta_estudiante || r.respuesta || '',
                            respuesta_correcta: r.respuesta_correcta || r.correcta || '?', es_correcta: !!r.es_correcta,
                        }));
                    }

                    const nombre = `${est.informacion_personal?.nombres || ''} ${est.informacion_personal?.apellidos || ''}`.trim();
                    items.forEach(r => {
                        if (!qRaw[materia][r.numero]) qRaw[materia][r.numero] = { failed: 0, total: 0, correct: r.respuesta_correcta || '?', counts: {}, studentMap: {} };
                        const q = qRaw[materia][r.numero];
                        q.total++;
                        if (!r.es_correcta) q.failed++;
                        const opt = (r.respuesta_estudiante?.trim().toUpperCase()) || 'NR';
                        q.counts[opt] = (q.counts[opt] || 0) + 1;
                        if (!q.studentMap[opt]) q.studentMap[opt] = [];
                        q.studentMap[opt].push(nombre);
                    });
                });
            });

            Object.entries(qRaw).forEach(([materia, questions]) => {
                questionAnalysis[materia] = Object.entries(questions)
                    .map(([num, stat]) => ({ num: parseInt(num), ...stat, rate: stat.total > 0 ? stat.failed / stat.total : 0 }))
                    .filter(q => !String(q.correct || '').toUpperCase().includes('ANULADA'))
                    .sort((a, b) => b.rate - a.rate);
            });
        } else if (institutionStatsForSelection) {
            Object.entries(institutionStatsForSelection).forEach(([materia, rows]) => {
                const stats = (Array.isArray(rows) ? rows : [])
                    .map(q => {
                        const total = Number(q.total) || 0;
                        const rawRate = Number(q.rate) || 0;
                        const rate = rawRate > 1 ? rawRate / 100 : rawRate;
                        const failed = Number(q.failed) || Math.round(total * rate);
                        return {
                            num: Number(q.num) || 0,
                            failed,
                            total,
                            rate: total > 0 ? failed / total : rate,
                            correct: String(q.correct || '?'),
                            counts: q.counts || {},
                            studentMap: {} as Record<string, string[]>,
                        } satisfies QuestionStat;
                    })
                    .filter(q => q.num > 0 && !String(q.correct || '').toUpperCase().includes('ANULADA'))
                    .sort((a, b) => b.rate - a.rate);

                if (stats.length > 0) questionAnalysis[materia] = stats;
            });
        } else if (aggregateStats) {
            // ── Path B: Build from pre-aggregated estadisticas document ──
            // studentMap will be empty (no per-student answer detail), but all
            // percentage/count/distribution data is fully available.
            Object.entries(aggregateStats.materias).forEach(([materia, preguntas]) => {
                const stats = Object.values(preguntas)
                    .map(p => {
                        const failed = p.total_respuestas > 0 ? Math.round(p.total_respuestas * (1 - p.porcentaje_acierto / 100)) : (p.total_respuestas - p.aciertos);
                        const counts = distribucionToCounts(
                            p.distribucion as Record<string, unknown> | undefined,
                            p.total_respuestas
                        );
                        return {
                            num: p.numero,
                            failed,
                            total: p.total_respuestas,
                            rate: p.total_respuestas > 0 ? failed / p.total_respuestas : 0,
                            correct: p.respuesta_correcta,
                            counts,
                            studentMap: {} as Record<string, string[]>,
                        } satisfies QuestionStat;
                    })
                    .filter(q => !String(q.correct || '').toUpperCase().includes('ANULADA'))
                    .sort((a, b) => b.rate - a.rate);

                if (stats.length > 0) questionAnalysis[materia] = stats;
            });
        }

        // ─── Alertas ─────────────────────────────────
        const alertas: CoordinadorData['alertas'] = { critico: [], alto: [], moderado: [], monitoreo: [] };
        myStudents.forEach(est => {
            const global = Number(est.puntaje_global) || 0;
            if (global === 0) return;
            const nombre = `${est.informacion_personal?.nombres || ''} ${est.informacion_personal?.apellidos || ''}`.trim();
            const id = est.informacion_personal?.numero_identificacion || '';
            let areaDebil = '-', minP = 100;
            if (est.puntajes) {
                Object.entries(est.puntajes).forEach(([area, data]) => {
                    const p = Number(data.puntaje) || 0;
                    if (p < minP && p > 0) { minP = p; areaDebil = area; }
                });
            }
            const brecha = (myInst?.avg || 0) - global;
            const registro = { nombre, id, global, areaDebil, minPuntaje: minP, brecha };

            if (global < 200) alertas.critico.push({ ...registro, nivel: 'CRÍTICO', recomendacion: 'Intervención inmediata' });
            else if (global < 250) alertas.alto.push({ ...registro, nivel: 'ALTO', recomendacion: 'Seguimiento semanal' });
            else if (minP < 40 && minP > 0 && global < 350) alertas.moderado.push({ ...registro, nivel: 'MODERADO', recomendacion: `Refuerzo en ${areaDebil}` });
            else if (global < 300) alertas.monitoreo.push({ ...registro, nivel: 'MONITOREO', recomendacion: 'Supervisión regular' });
        });

        // ─── Full Ranking ────────────────────────────
        const ranking = [...myStudents].filter(s => (s.puntaje_global || 0) > 0)
            .sort((a, b) => (b.puntaje_global || 0) - (a.puntaje_global || 0));

        return {
            myInstitution: myInst,
            allInstitutions: allInst,
            questionAnalysis,
            alertas,
            ranking,
            availableInstitutions,
            availableCursos,
            cohortStudents: cohortForPifa,
        };
    }, [
        allStudents,
        selectedInstitution,
        selectedCurso,
        pifaCatalogReady,
        baseInstitution,
        aggregateStats,
        institutionQuestionStats,
        crossFilteredInstitutions,
        coordinatorScopeAllowed,
        isScopedCoordinator,
        isSingleInstitutionScope,
    ]);

    return {
        ...result,
        availableSimulations: crossFilteredSimulations,
        currentSimulation,
        availableInstitutions: availableInstitutionsList,
        currentInstitution: selectedInstitution,
        availableCursos: result.availableCursos || [],
        currentCurso: selectedCurso,
        cohortStudents: result.cohortStudents || [],
        loading,
        error,
        setSimulation: (sim: string) => {
            setTriedFallback(true);
            setCurrentSimulation(sim);
            localStorage.setItem(storageKeys.selectedSimulation, sim);
            setSelectedCurso(PIFA_CURSO_TODOS);
        },
        setCurso: (curso: string) => {
            setSelectedCurso(curso || PIFA_CURSO_TODOS);
        },
        setInstitution: (inst: string) => {
            const next =
                !inst || inst.toUpperCase() === 'TODAS' || inst === '*'
                    ? inst
                    : canonicalInstitutionName(inst);
            setSelectedInstitution(next);
            localStorage.setItem(storageKeys.selectedInstitution, next);
            setSelectedCurso(PIFA_CURSO_TODOS);
            // Filtro inteligente: solo saltar de simulacro si la institución NO
            // participó en el simulacro actual. El selector ya lista instituciones
            // del sim vigente (students/stats); summary a veces va atrasado
            // (ej. SG11-23 local sin entrada en coordinator_summary → saltaba a SG11-08).
            if (summary && next.toUpperCase() !== 'TODAS' && next !== '*') {
                const instCanon = canonicalInstitutionName(next);
                const listedInCurrent = crossFilteredInstitutions.some((k) =>
                    institutionsMatch(k, next),
                );
                if (listedInCurrent) {
                    const cacheKey = `${currentSimulation}|${instCanon}`;
                    rankingInstitutionCacheRef.current.set(cacheKey, true);
                    setRankingConfirmedSimIds((prev) =>
                        prev.includes(currentSimulation)
                            ? prev
                            : [...prev, currentSimulation],
                    );
                    return;
                }

                const simIncludesInst = (simId: string) =>
                    simulationHasInstitutionInSummary(summary, simId, next) ||
                    rankingConfirmedSimIds.includes(simId);

                if (!simIncludesInst(currentSimulation)) {
                    const validSim = availableSimulations.find(simIncludesInst);
                    if (validSim) {
                        setCurrentSimulation(validSim);
                        localStorage.setItem(storageKeys.selectedSimulation, validSim);
                    }
                }
            }
        },
        // Carga detalle completo para la institución activa. Se usa en Análisis/Auditoría,
        // donde el desglose por pregunta y estudiante es parte del producto.
        loadFullStudents: async () => {
            if (!currentSimulation) return;
            try {
                const {
                    getAllStudents,
                    getSimulationEstadisticas,
                    getInstitutionQuestionStats,
                    enrichStudentWithDetailedAnswers,
                } = await loadDataModule();
                const [students, stats, instStats] = await Promise.all([
                    getAllStudents(currentSimulation),
                    getSimulationEstadisticas(currentSimulation),
                    getInstitutionQuestionStats(currentSimulation),
                ]);
                setAggregateStats(stats);
                setInstitutionQuestionStats(instStats);
                if (students.length > 0) {
                    const hydrated = await hydrateCoordinatorStudents(
                        students,
                        currentSimulation,
                        selectedInstitution,
                        enrichStudentWithDetailedAnswers,
                    );
                    const finalStudents = isDemoCoordinadorRoute(pathname)
                        ? maskEstudianteListForDemo(hydrated, { force: true })
                        : hydrated;
                    setAllStudents(finalStudents);
                }
            } catch { /* ignore */ }
        },
    };
}
