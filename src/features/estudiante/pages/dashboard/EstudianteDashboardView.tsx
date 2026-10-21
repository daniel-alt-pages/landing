'use client';
import { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';
import { exitDemoEstudianteSession } from '@/app/demo/_shared/demoExit';
import { DEMO_STUDENT_DEFAULT_SIM, DEMO_STUDENT_ID } from '@/app/demo/_shared/demoPrivacy';
import { PREVIEW_STUDENT_ID } from '@/app/landing-profesional/preview-paneles/_data/seeds/constants';
import { waitForAuth, waitForRealUser } from '@features/auth/lib/firebase';
import type { RankingEntry } from '@features/simulacro/lib/firestoreService';
import { resolveEstudianteDataModule } from '@features/estudiante/hooks/estudianteDataOptions';
import { readCachedStudentSimList, isReadBudgetPaused } from '@features/simulacro/lib/firestoreService';
import { ensureEstudianteSessionBootstrap } from '@features/estudiante/hooks/ensureEstudianteSessionBootstrap';
import { useEstudianteSession } from '@features/estudiante/hooks/useEstudianteSession';
import { broadcastStudentSimulation } from '@features/estudiante/lib/studentNavPolicy';
import { SG_FOLLOW_OPTIONS, SG_PUBLIC_LINKS } from '@features/estudiante/pages/dashboard/lib/sgFollowOptions';
import type { ClavePregunta } from '@features/estudiante/pages/dashboard/lib/answerKeySessions';
import AnswerKeyModal from '@features/estudiante/pages/dashboard/components/AnswerKeyModal';
import StudentGlobalScoreHelpBubble from '@features/estudiante/pages/dashboard/components/StudentGlobalScoreHelpBubble';
import StudentScoreHistoryPanel from '@features/estudiante/pages/dashboard/components/StudentScoreHistoryPanel';
import { autoCleanIfNeeded } from '@/lib/storageCleanup';
import {
    STUDENT_ERRORS,
    isRetryableStudentError,
    studentFacingErrorFromUnknown,
} from '@/lib/studentUserFacingErrors';
import { PRISMIC_FONDO_16_9 } from '@/lib/prismicAssets';
import StarBorder from '@shared/components/animations/StarBorder';
import TextAnimation from '@shared/components/animations/TextAnimation';
import AnimateIn from '@shared/components/animations/AnimateIn';
import { DashboardSkeleton } from '@/components/SkeletonLoader';
import {
    buildPersonalizedLoadingMessage,
    readStudentFirstName,
} from '@/components/SgBrandedLoadingExperience';
import { getNivelDesempeno, NIVELES_DESEMPENO } from '@/lib/performanceLevels';
import RecordingsPromoCard from '@features/recordings/components/RecordingsPromoCard';
import RecordingsPrecacheBootstrap from '@features/recordings/components/RecordingsPrecacheBootstrap';
import CoursePromoCard from '@features/curso/components/CoursePromoCard';
import CourseHeaderButton from '@features/curso/components/CourseHeaderButton';
import { writeStudentDocumentoCache } from '@features/curso/lib/courseEntitlements';
import { applyStudentPanelMode } from '@features/curso/lib/courseLoginRouting';
import { hardNavigate } from '@/shared/lib/hardNavigate';
import {
    getStoredLoginMethod,
    getStoredStudentEmail,
    needsGoogleLoginForResults,
} from '@/lib/studentSession';
import { SG_MATERIAS_DASHBOARD, sgAreaHex } from '@shared/lib/sgAreaColors';

interface Puntaje {
    puntaje: number;
    correctas: number;
    total_preguntas: number;
}

interface PlanEstudioIcfesItem {
    competencia: string;
    afirmacion: string;
    tema: string;
    prioridad: string;
    motivo: string;
}

interface Estudiante {
    informacion_personal: {
        nombres: string;
        apellidos: string;
        numero_identificacion: string;
        institucion: string;
    };
    puntaje_global: number;
    puntajes: Record<string, Puntaje>;
    sesiones?: string[];
    secciones_completadas?: string[];
    penalizado?: boolean;
    motivo_penalizacion?: string;
    /** Priorización por errores en temas ICFES (merge desde pipeline / Firestore) */
    plan_estudio_sugerido_icfes?: PlanEstudioIcfesItem[];
    analisis_temas_icfes?: Record<string, Record<string, { total: number; aciertos: number; errores: number; porcentaje: number }>>;
    trazabilidad_marco?: { taxonomy_version?: string; fuente?: string };
    plan_icfes_updated_at?: string;
}

const materias = SG_MATERIAS_DASHBOARD.map((m) => ({
    ...m,
    label: m.key === 'sociales y ciudadanas' ? 'Ciencias Sociales' : m.label,
}));

const STUDENT_RESULTS_MAX_RETRIES = 3;
const STUDENT_RESULTS_RETRY_DELAY_MS = 650;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Restaura UI al volver desde Clases u otra pestaña del panel (evita skeleton infinito). */
function tryRestoreDashboardFromSession(studentId: string): {
    estudiante: Estudiante;
    simId: string;
    sims: string[];
} | null {
    const simId = localStorage.getItem('simulacro_selected');
    if (!simId) return null;
    try {
        const raw = localStorage.getItem('student_data');
        if (!raw) return null;
        const estudiante = JSON.parse(raw) as Estudiante;
        const doc = String(estudiante?.informacion_personal?.numero_identificacion || '').trim();
        if (!doc || doc !== String(studentId).trim()) return null;
        if (!estudiante.puntajes || Object.keys(estudiante.puntajes).length === 0) return null;
        const sims = readCachedStudentSimList(studentId);
        const simList = sims.length > 0 ? sims : [simId];
        return { estudiante, simId, sims: simList };
    } catch {
        return null;
    }
}

/** CDN ImageKit — clic abre modal de redes (no enlace directo por lámina). */
const SG_MARKETING_BANNERS: { src: string; alt: string }[] = [
    {
        src: 'https://ik.imagekit.io/seamosgenios/Banner%201%20principal%20-%20SEAMOSGENIOS.png?updatedAt=1777936540438',
        alt: 'Banner principal Seamos Genios',
    },
    {
        src: 'https://ik.imagekit.io/seamosgenios/Banner%202%20-%20Caracter%C3%ADsticas%201%20SEAMOSGENIOS.png?updatedAt=1777936540201',
        alt: 'Características — Seamos Genios (1)',
    },
    {
        src: 'https://ik.imagekit.io/seamosgenios/Banner%203%20-%20Camino%20en%20SEAMOSGENIOS.png?updatedAt=1777936540323',
        alt: 'Tu camino en Seamos Genios',
    },
    {
        src: 'https://ik.imagekit.io/seamosgenios/Banner%204%20-%20Podio%20SEAMOSGENIOS.png?updatedAt=1777936540226',
        alt: 'Podio — Seamos Genios',
    },
    {
        src: 'https://ik.imagekit.io/seamosgenios/Banner%205%20-%20Caracter%C3%ADsticas%202%20SEAMOSGENIOS.png?updatedAt=1777936540074',
        alt: 'Características — Seamos Genios (2)',
    },
];

export default function EstudianteDashboardView() {
    const router = useRouter();
    const pathname = usePathname();
    const { isDemo: isDemoMode, navigateTo } = useEstudianteSession();
    const disableRankingForDemo = isDemoMode;
    const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const addLog = (msg: string) => setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
    const [rankingInfo, setRankingInfo] = useState({ puesto: 0, total: 0, avgGlobal: 0, top5: [] as any[] });
    const [subjectTops, setSubjectTops] = useState<{ materia: string; label: string; color: string; icon: string; top1Nombre: string; top1Puntaje: number; miPuesto: number; miPuntaje: number; total: number }[]>([]);
    const [historicalData, setHistoricalData] = useState<Record<string, any>>({});
    const [rankingModal, setRankingModal] = useState<{ title: string, students: any[], color: string, subjectKey: string } | null>(null);
    const [welcomeModal, setWelcomeModal] = useState(false);
    const [showClavesModal, setShowClavesModal] = useState(false);
    const [clavesData, setClavesData] = useState<Record<string, ClavePregunta[]> | null>(null);
    const [clavesLoading, setClavesLoading] = useState(false);
    const [clavesSimId, setClavesSimId] = useState<string | null>(null);


    // Multi-profile support
    const [hasMultipleProfiles, setHasMultipleProfiles] = useState(false);

    // Selector de simulacro
    const [simulacroActual, setSimulacroActual] = useState<string | null>(null);
    const [simulacrosDelEstudiante, setSimulacrosDelEstudiante] = useState<string[]>([]);
    const [showSimulacroModal, setShowSimulacroModal] = useState(false);
    const [isPartialGrading, setIsPartialGrading] = useState(false);
    const [marketingBannerIndex, setMarketingBannerIndex] = useState(0);
    const [socialFollowModalOpen, setSocialFollowModalOpen] = useState(false);
    const [loadStatusMessage, setLoadStatusMessage] = useState('');
    const [needsGoogleForResults, setNeedsGoogleForResults] = useState(false);

    const leftScoreColumnRef = useRef<HTMLDivElement>(null);
    const scoreCardRef = useRef<HTMLDivElement>(null);
    const [showCoursePromoInGap, setShowCoursePromoInGap] = useState(false);

    const courseIdentityHint = useMemo(
        () =>
            estudiante?.informacion_personal?.numero_identificacion
                ? {
                      documento: String(estudiante.informacion_personal.numero_identificacion),
                  }
                : undefined,
        [estudiante?.informacion_personal?.numero_identificacion],
    );

    useLayoutEffect(() => {
        if (loading || !estudiante) {
            setShowCoursePromoInGap(false);
            return;
        }
        const col = leftScoreColumnRef.current;
        const score = scoreCardRef.current;
        if (!col || !score) return;

        const measure = () => {
            const isLg = window.matchMedia('(min-width: 1024px)').matches;
            if (!isLg) {
                setShowCoursePromoInGap(false);
                return;
            }
            const styles = window.getComputedStyle(col);
            const gapPx = parseFloat(styles.rowGap || styles.gap || '16') || 16;
            const spare = col.clientHeight - score.offsetHeight - gapPx;
            setShowCoursePromoInGap(spare >= 100);
        };

        const ro = new ResizeObserver(measure);
        ro.observe(col);
        ro.observe(score);
        window.addEventListener('resize', measure);
        measure();
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [loading, estudiante, rankingInfo, subjectTops, disableRankingForDemo, simulacroActual]);

    useLayoutEffect(() => {
        const id = localStorage.getItem('student_id');
        if (!id || id === 'demo') return;
        const restored = tryRestoreDashboardFromSession(id);
        if (!restored) return;
        setEstudiante(restored.estudiante);
        setSimulacroActual(restored.simId);
        setSimulacrosDelEstudiante(restored.sims);
        setNeedsGoogleForResults(false);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const id = window.setInterval(() => {
            setMarketingBannerIndex((i) => (i + 1) % SG_MARKETING_BANNERS.length);
        }, 5500);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        if (!socialFollowModalOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSocialFollowModalOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [socialFollowModalOpen]);

    const loadData = useCallback(async (
        simId?: string,
        simListOverride?: string[],
        options?: { background?: boolean },
    ) => {
        if (typeof window === 'undefined') return;


        const id = localStorage.getItem('student_id');
        const currentSim = simId || simulacroActual;
        const simsList = simListOverride ?? simulacrosDelEstudiante;
        const background = options?.background === true;

        if (!id) {
            console.warn("No student_id");
            if (!background) {
                setErrorMsg(STUDENT_ERRORS.sessionExpired);
                setLoading(false);
            }
            return;
        }

        const {
            getRanking,
            getStudentResults,
            getStudentSimulations,
            getAppConfig,
            getStatistics,
        } = await resolveEstudianteDataModule();

        // === DEMO MODE ===
        if (id === 'demo') {
            const demoStudent: Estudiante = {
                informacion_personal: {
                    nombres: 'ESTUDIANTE',
                    apellidos: 'DEMO',
                    numero_identificacion: 'demo',
                    institucion: 'Seamos Genios Colombia',
                },
                puntaje_global: 345,
                puntajes: {
                    'lectura crítica': { puntaje: 72, correctas: 28, total_preguntas: 41 },
                    'matemáticas': { puntaje: 68, correctas: 19, total_preguntas: 35 },
                    'sociales y ciudadanas': { puntaje: 65, correctas: 23, total_preguntas: 35 },
                    'ciencias naturales': { puntaje: 70, correctas: 22, total_preguntas: 35 },
                    'inglés': { puntaje: 58, correctas: 28, total_preguntas: 55 },
                },
                secciones_completadas: ['S1', 'S2'],
            };
            setEstudiante(demoStudent);
            // ✅ FIXED: Realistic ranking position based on 345 score (above average)
            setRankingInfo({ puesto: 45, total: 151, avgGlobal: 310, top5: [] });
            setSubjectTops([
                { materia: 'lectura crítica', label: 'L. Crítica', color: sgAreaHex('lectura crítica'), icon: 'book', top1Nombre: 'Ana G.', top1Puntaje: 95, miPuesto: 38, miPuntaje: 72, total: 151 },
                { materia: 'matemáticas', label: 'Matemáticas', color: sgAreaHex('matemáticas'), icon: 'calculator', top1Nombre: 'Carlos L.', top1Puntaje: 92, miPuesto: 52, miPuntaje: 68, total: 151 },
                { materia: 'sociales y ciudadanas', label: 'Sociales', color: sgAreaHex('sociales y ciudadanas'), icon: 'globe', top1Nombre: 'María R.', top1Puntaje: 88, miPuesto: 67, miPuntaje: 65, total: 151 },
                { materia: 'ciencias naturales', label: 'Ciencias', color: sgAreaHex('ciencias naturales'), icon: 'beaker', top1Nombre: 'Pedro M.', top1Puntaje: 91, miPuesto: 48, miPuntaje: 70, total: 151 },
                { materia: 'inglés', label: 'Inglés', color: sgAreaHex('inglés'), icon: 'chat', top1Nombre: 'Laura H.', top1Puntaje: 90, miPuesto: 89, miPuntaje: 58, total: 151 },
            ]);
            setSimulacrosDelEstudiante(['SG11-17', 'SG11-18']);
            setSimulacroActual('SG11-18');
            setHistoricalData({
                'SG11-17': {
                    puntaje_global: 320,
                    puntajes: {
                        'lectura crítica': { puntaje: 68, correctas: 26, total_preguntas: 41 },
                        'matemáticas': { puntaje: 62, correctas: 17, total_preguntas: 35 },
                        'sociales y ciudadanas': { puntaje: 60, correctas: 21, total_preguntas: 35 },
                        'ciencias naturales': { puntaje: 64, correctas: 20, total_preguntas: 35 },
                        'inglés': { puntaje: 52, correctas: 25, total_preguntas: 55 },
                    },
                },
                'SG11-18': {
                    puntaje_global: 345,
                    puntajes: demoStudent.puntajes,
                },
            });
            setLoading(false);
            return;
        }

        if (!background) {
            setLoading(true);
            setErrorMsg('');
            setLoadStatusMessage('');
        }

        // 1. Cargar Ranking del Simulacro Actual (pre-computado)
        const fetchRanking = async () => {
            if (disableRankingForDemo) {
                addLog('⏭️ Ranking deshabilitado en demo estudiante');
                setRankingInfo({ puesto: 0, total: 0, avgGlobal: 0, top5: [] });
                setSubjectTops([]);
                return;
            }
            try {
                addLog('⏳ getRanking...');
                const rankingEntries = await getRanking(currentSim || undefined);
                addLog(`✅ getRanking: ${rankingEntries.length} estudiantes`);

                if (rankingEntries.length === 0) {
                    addLog('⚠️ No ranking data found');
                    return;
                }

                const myIndex = rankingEntries.findIndex((e) => String(e.numero_identificacion).trim() === String(id).trim());

                // Compute real group average from ALL entries
                const allGlobals = rankingEntries.map(e => e.puntaje_global || 0).filter(p => p > 0);
                const avgGlobal = allGlobals.length > 0 ? Math.round(allGlobals.reduce((a, b) => a + b, 0) / allGlobals.length) : 0;

                setRankingInfo({
                    puesto: myIndex >= 0 ? myIndex + 1 : 0,
                    total: rankingEntries.length,
                    avgGlobal,
                    top5: rankingEntries.slice(0, 5).map(e => ({
                        informacion_personal: {
                            nombres: e.nombre,
                            apellidos: e.apellidos || '',
                            numero_identificacion: e.numero_identificacion,
                            institucion: e.institucion || '',
                        },
                        puntaje_global: e.puntaje_global,
                    }))
                });

                // Calcular top por materia
                const materiasConfig: Record<string, { label: string; color: string; icon: string }> = {
                    'matemáticas': { label: 'Matemáticas', color: sgAreaHex('matemáticas'), icon: 'calculator' },
                    'lectura crítica': { label: 'L. Crítica', color: sgAreaHex('lectura crítica'), icon: 'book' },
                    'sociales y ciudadanas': { label: 'Sociales', color: sgAreaHex('sociales y ciudadanas'), icon: 'globe' },
                    'ciencias naturales': { label: 'Ciencias', color: sgAreaHex('ciencias naturales'), icon: 'beaker' },
                    'inglés': { label: 'Inglés', color: sgAreaHex('inglés'), icon: 'chat' },
                };
                const hasPuntajes = rankingEntries.some(e => e.puntajes && Object.keys(e.puntajes).length > 0);
                if (hasPuntajes) {
                    const tops = Object.entries(materiasConfig).map(([key, conf]) => {
                        const sorted = [...rankingEntries]
                            .sort((a, b) => {
                                const bv = a.puntajes?.[key];
                                const av = b.puntajes?.[key];
                                const bScore = typeof bv === 'object' && bv !== null ? (bv as any).puntaje || 0 : Number(bv) || 0;
                                const aScore = typeof av === 'object' && av !== null ? (av as any).puntaje || 0 : Number(av) || 0;
                                return aScore - bScore;
                            });
                        const mySubjectIdx = sorted.findIndex(e => String(e.numero_identificacion).trim() === String(id).trim());
                        const top1 = sorted[0];
                        const getScore = (entry: any, k: string) => {
                            const v = entry?.puntajes?.[k];
                            return typeof v === 'object' && v !== null ? (v as any).puntaje || 0 : Number(v) || 0;
                        };
                        return {
                            materia: key,
                            label: conf.label,
                            color: conf.color,
                            icon: conf.icon,
                            top1Nombre: top1 ? `${top1.nombre.split(' ')[0]} ${(top1.apellidos || '').split(' ')[0]?.charAt(0) || ''}.` : '—',
                            top1Puntaje: getScore(top1, key),
                            miPuesto: mySubjectIdx >= 0 ? mySubjectIdx + 1 : 0,
                            miPuntaje: mySubjectIdx >= 0 ? getScore(sorted[mySubjectIdx], key) : 0,
                            total: sorted.length,
                        };
                    });
                    setSubjectTops(tops);
                }
            } catch (e: any) {
                addLog(`❌ Ranking error: ${e.message}`);
                console.error("Error loading ranking", e);
            }
        };

        // 2. Cargar Datos Estudiante (Firestore)
        const fetchEstudiante = async () => {
            // Try to load from cache first for instant display
            const cachedData = localStorage.getItem('student_data');
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    // Validar que el caché tenga la estructura correcta
                    if (parsed && 
                        parsed.informacion_personal && 
                        parsed.informacion_personal.numero_identificacion &&
                        String(parsed.informacion_personal.numero_identificacion).trim() === String(id).trim()) {
                        setEstudiante(parsed);
                    } else {
                        // Caché inválido o corrupto
                        localStorage.removeItem('student_data');
                    }
                } catch (e) {
                    console.error("Error parsing cached student data", e);
                    localStorage.removeItem('student_data');
                }
            }

            try {
                const targetId = String(id).trim();

                const fetchStudentResultsWithRetry = async () => {
                    for (let attempt = 1; attempt <= STUDENT_RESULTS_MAX_RETRIES; attempt++) {
                        try {
                            addLog(`⏳ getStudentResults(${targetId}, ${currentSim}) [${attempt}/${STUDENT_RESULTS_MAX_RETRIES}]...`);
                            const found = await getStudentResults(targetId, currentSim || undefined);
                            if (!found && isReadBudgetPaused()) {
                                addLog('⚠️ Presupuesto pausado — deteniendo reintentos');
                                return null;
                            }
                            const hasValidData = found && found.informacion_personal && found.informacion_personal.numero_identificacion;
                            if (hasValidData) {
                                return found;
                            }
                            if (attempt < STUDENT_RESULTS_MAX_RETRIES) {
                                addLog(`⚠️ Datos no listos (intento ${attempt}), reintentando...`);
                                setLoadStatusMessage(`Reintentando carga (${attempt}/${STUDENT_RESULTS_MAX_RETRIES})…`);
                                await sleep(STUDENT_RESULTS_RETRY_DELAY_MS * attempt);
                            } else {
                                return found;
                            }
                        } catch (retryErr: unknown) {
                            if (isReadBudgetPaused()) {
                                addLog('⚠️ Presupuesto pausado — deteniendo reintentos');
                                return null;
                            }
                            throw retryErr;
                        }
                    }
                    return null;
                };

                const tryResultsAcrossSimulacros = async () => {
                    const ordered = [
                        currentSim,
                        ...[...simsList].reverse().filter((s) => s !== currentSim),
                    ].filter(Boolean) as string[];

                    for (const sim of ordered) {
                        if (sim === currentSim) continue;
                        if (isReadBudgetPaused()) {
                            addLog('⚠️ Presupuesto pausado — omitiendo fallback de simulacros');
                            break;
                        }
                        addLog(`⏳ Fallback getStudentResults(${targetId}, ${sim})...`);
                        const alt = await getStudentResults(targetId, sim);
                        if (alt && alt.informacion_personal?.numero_identificacion) {
                            addLog(`✅ Resultados en ${sim} (fallback)`);
                            setSimulacroActual(sim);
                            localStorage.setItem('simulacro_selected', sim);
                            broadcastStudentSimulation(sim);
                            return alt;
                        }
                    }
                    return null;
                };

                let found = await fetchStudentResultsWithRetry();

                // 🛡️ DEFENSIVE VALIDATION: Check if data is valid
                const isEmptyObject = found && Object.keys(found).length === 0;
                const hasValidData = found && found.informacion_personal && found.informacion_personal.numero_identificacion;

                if (hasValidData) {
                    addLog('✅ Student data loaded');
                    setEstudiante(found as any);
                    setNeedsGoogleForResults(false);
                    try { localStorage.setItem('student_data', JSON.stringify(found)); } catch (e) { }
                    writeStudentDocumentoCache(found.informacion_personal?.numero_identificacion);
                } else if (isEmptyObject) {
                    // 🔥 CRITICAL FIX: Empty object returned - force cache clear and retry
                    addLog(`⚠️ Objeto vacío recibido - limpiando caché y reintentando...`);
                    console.warn('Empty object received from getStudentResults:', found);
                    
                    // Clear all caches
                    localStorage.removeItem('student_data');
                    localStorage.removeItem(`results_${targetId}_${currentSim}`);
                    
                    // Force reload from Firestore by calling with requireDetalle=true
                    addLog(`🔄 Reintentando con requireDetalle=true...`);
                    const retryFound = await getStudentResults(targetId, currentSim || undefined, true);
                    
                    if (retryFound && retryFound.informacion_personal && retryFound.informacion_personal.numero_identificacion) {
                        addLog('✅ Student data loaded on retry');
                        setEstudiante(retryFound as any);
                        try { localStorage.setItem('student_data', JSON.stringify(retryFound)); } catch (e) { }
                        writeStudentDocumentoCache(retryFound.informacion_personal?.numero_identificacion);
                    } else {
                        addLog(`❌ Retry failed - data still empty`);
                        console.error('Retry failed, data:', retryFound);
                        setErrorMsg(STUDENT_ERRORS.emptyResults);
                    }
                } else if (found) {
                    // Datos existen pero están corruptos (sin informacion_personal)
                    addLog(`⚠️ Datos corruptos en ${currentSim} (sin informacion_personal)`);
                    console.error('Datos corruptos:', found);
                    
                    // Try to display partial data if available
                    if (found.puntaje_global || found.puntajes) {
                        addLog(`📊 Mostrando datos parciales disponibles`);
                        setEstudiante(found as any);
                        setErrorMsg(STUDENT_ERRORS.partialUpdate);
                    } else {
                        setErrorMsg(STUDENT_ERRORS.incompleteData);
                    }
                } else {
                    // Sin resultados en el sim actual — probar otros simulacros de la lista
                    addLog(`⚠️ Sin resultados en ${currentSim}`);
                    if (isReadBudgetPaused() && !localStorage.getItem('student_data')) {
                        setErrorMsg(STUDENT_ERRORS.tooManyRequests);
                    } else {
                    const fallback = simsList.length > 1 ? await tryResultsAcrossSimulacros() : null;
                    if (fallback && fallback.informacion_personal?.numero_identificacion) {
                        setEstudiante(fallback as any);
                        try { localStorage.setItem('student_data', JSON.stringify(fallback)); } catch (e) { }
                        writeStudentDocumentoCache(fallback.informacion_personal?.numero_identificacion);
                        setNeedsGoogleForResults(false);
                    } else if (await needsGoogleLoginForResults()) {
                        addLog('⚠️ Direct login sin sesión Firebase para results');
                        setNeedsGoogleForResults(true);
                        setErrorMsg(STUDENT_ERRORS.resultsNeedGoogle);
                    } else if (simsList.length > 1) {
                        addLog('📋 Mostrando selector de simulacros (tiene múltiples opciones)');
                        setShowSimulacroModal(true);
                        setErrorMsg('');
                    } else {
                        const hasCachedDisplay = localStorage.getItem('student_data');
                        if (!hasCachedDisplay) {
                            setErrorMsg(STUDENT_ERRORS.simNotFound);
                        }
                    }
                    }
                }
            } catch (err: unknown) {
                addLog(`❌ Student error: ${(err as Error)?.message ?? String(err)}`);
                if (!isReadBudgetPaused()) {
                    console.error(err);
                }

                // ── Budget pausado: usar caché si existe ──
                if (isReadBudgetPaused()) {
                    const cachedData = localStorage.getItem('student_data');
                    if (cachedData) {
                        addLog('⚠️ Budget agotado — usando datos cacheados sin mostrar error');
                        return;
                    }
                    setErrorMsg(STUDENT_ERRORS.tooManyRequests);
                    return;
                }

                // Ocultar mensajes técnicos internos al estudiante
                setErrorMsg(studentFacingErrorFromUnknown(err));
            }

        };

        await Promise.all([fetchEstudiante(), fetchRanking()]);
        if (!background) {
            setLoadStatusMessage('');
            setLoading(false);
        }

    }, [simulacroActual, simulacrosDelEstudiante, disableRankingForDemo]); // Reload when simulation changes

    const loadDataRef = useRef(loadData);
    useEffect(() => {
        loadDataRef.current = loadData;
    }, [loadData]);

    // Detectar simulacros + cargar datos en secuencia (evita race en primera carga)
    const bootstrapInitial = useCallback(async () => {
        ensureEstudianteSessionBootstrap(pathname);

        setErrorMsg('');
        setLoadStatusMessage('');

        const id = localStorage.getItem('student_id');
        if (!id) {
            setLoading(false);
            setErrorMsg(STUDENT_ERRORS.sessionExpired);
            return;
        }

        if (id === 'demo') {
            setLoading(true);
            setSimulacroActual('DEMO');
            setSimulacrosDelEstudiante(['DEMO']);
            try {
                await loadDataRef.current('DEMO', ['DEMO']);
            } finally {
                setLoading(false);
            }
            return;
        }

        const restored = tryRestoreDashboardFromSession(id);
        if (restored) {
            setEstudiante(restored.estudiante);
            setSimulacroActual(restored.simId);
            setSimulacrosDelEstudiante(restored.sims);
            setNeedsGoogleForResults(false);
            setLoading(false);
            void (async () => {
                try {
                    const { getStudentSimulations } = await resolveEstudianteDataModule();
                    const freshSims = await getStudentSimulations(id);
                    const simList = freshSims.length > 0 ? freshSims : restored.sims;
                    const selectedSim = simList.includes(restored.simId)
                        ? restored.simId
                        : (simList[simList.length - 1] ?? restored.simId);
                    if (freshSims.length > 0) {
                        setSimulacrosDelEstudiante(freshSims);
                    }
                    if (selectedSim !== restored.simId) {
                        setSimulacroActual(selectedSim);
                        localStorage.setItem('simulacro_selected', selectedSim);
                        broadcastStudentSimulation(selectedSim);
                    }
                    await loadDataRef.current(selectedSim, simList, { background: true });
                } catch {
                    await loadDataRef.current(restored.simId, restored.sims, { background: true });
                }
            })();
            return;
        }

        setLoading(true);
        try {
            try {
                await waitForAuth();
            } catch {
                if (getStoredLoginMethod() !== 'direct') {
                    throw new Error('auth-timeout');
                }
                addLog('⚠️ Firebase Auth no listo — continuando con doc+fecha');
            }
            const loginMethod = getStoredLoginMethod();
            const storedEmail = getStoredStudentEmail();
            if (loginMethod === 'google' || (storedEmail && loginMethod !== 'direct')) {
                try {
                    await waitForRealUser(8000);
                    addLog('✅ Sesión Firebase lista');
                } catch {
                    addLog('⚠️ Sesión Firebase aún no lista');
                }
            } else if (loginMethod === 'direct') {
                addLog('✅ Login doc+fecha (legacy)');
            }

            const { getStudentSimulations, getAppConfig } = await resolveEstudianteDataModule();
            addLog('⏳ getStudentSimulations...');
            const simulacrosConDatos = await getStudentSimulations(id);
            addLog(`✅ Simulations: ${simulacrosConDatos.join(', ') || 'none'}`);

            if (simulacrosConDatos.length === 0) {
                if (isDemoEstudianteRoute(pathname)) {
                    addLog('⚠️ Demo estudiante sin simulacros en Firebase.');
                    setLoading(false);
                    setErrorMsg(STUDENT_ERRORS.demoUnavailable);
                    return;
                }
                addLog('⚠️ Sin simulacros — verificando acceso al curso…');
                const panel = await applyStudentPanelMode(id, undefined, simulacrosConDatos);
                if (panel.mode === 'curso' && panel.courseCount > 0) {
                    hardNavigate('/estudiante/curso');
                    setLoading(false);
                    return;
                }
                addLog('⚠️ Sin simulacros ni curso para este estudiante.');
                setLoading(false);
                setErrorMsg(STUDENT_ERRORS.noSimulations);
                return;
            }

            setSimulacrosDelEstudiante(simulacrosConDatos);
            await applyStudentPanelMode(id, undefined, simulacrosConDatos);

            const config = await getAppConfig();

            const saved = localStorage.getItem('simulacro_selected');
            const savedIsValid = saved && simulacrosConDatos.includes(saved);

            if (!savedIsValid && saved) {
                addLog(`⚠️ Simulacro guardado "${saved}" no encontrado en datos del estudiante. Auto-seleccionando el más reciente.`);
                localStorage.removeItem('simulacro_selected');
                localStorage.removeItem('student_data');
            }

            let selectedSim: string;

            const isDemoStudent =
                isDemoEstudianteRoute(pathname) &&
                [DEMO_STUDENT_ID, PREVIEW_STUDENT_ID].includes(String(id).trim());

            if (isDemoStudent) {
                selectedSim = simulacrosConDatos.includes(DEMO_STUDENT_DEFAULT_SIM)
                    ? DEMO_STUDENT_DEFAULT_SIM
                    : (simulacrosConDatos[0] ?? config.activeSimulation);
            } else if (savedIsValid) {
                selectedSim = saved!;
            } else if (simulacrosConDatos.length > 0) {
                selectedSim = simulacrosConDatos[simulacrosConDatos.length - 1];
            } else {
                selectedSim = config.activeSimulation;
            }

            setSimulacroActual(selectedSim);
            setIsPartialGrading((config.partialSimulations || []).includes(selectedSim));
            localStorage.setItem('simulacro_selected', selectedSim);
            broadcastStudentSimulation(selectedSim);

            if (simulacrosConDatos.length > 1 && !savedIsValid) {
                addLog(`📋 Estudiante tiene ${simulacrosConDatos.length} simulacros disponibles`);
            } else if (!sessionStorage.getItem('welcome_shown')) {
                setTimeout(() => {
                    if (sessionStorage.getItem('student_score_modal_open')) return;
                    setWelcomeModal(true);
                    sessionStorage.setItem('welcome_shown', 'true');
                }, 2000);
            }

            await loadDataRef.current(selectedSim, simulacrosConDatos);
        } catch (err: any) {
            console.error('Error detectando simulacros:', err);
            addLog(`❌ Error: ${err.message}`);

            if (err.message?.includes('permission') || err.message?.includes('PERMISSION_DENIED') || err.code === 'permission-denied') {
                setErrorMsg(STUDENT_ERRORS.accessDenied);
                return;
            }

            setErrorMsg(STUDENT_ERRORS.bootstrapFailed);
        } finally {
            setLoading(false);
        }
    }, [pathname]);

    const retryBootstrap = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        setLoadStatusMessage('');
        if (simulacroActual) {
            await loadData(simulacroActual, simulacrosDelEstudiante);
            return;
        }
        await bootstrapInitial();
    }, [bootstrapInitial, loadData, simulacroActual, simulacrosDelEstudiante]);

    useEffect(() => {
        void bootstrapInitial();
    }, [bootstrapInitial]);

    // Detectar si el usuario tiene múltiples perfiles vinculados (0 Firestore reads)
    useEffect(() => {
        try {
            const raw = localStorage.getItem('linked_profiles');
            if (raw) {
                const parsed = JSON.parse(raw);
                setHasMultipleProfiles(Array.isArray(parsed) && parsed.length > 1);
            }
        } catch { /* ignore */ }
    }, []);

    // Load historical data for trend between simulations (solo si hay 2+ simulacros)
    useEffect(() => {
        const loadHistory = async () => {
            const id = localStorage.getItem('student_id');
            if (!id || simulacrosDelEstudiante.length < 2) return;
            const { getStudentResults } = await resolveEstudianteDataModule();
            const history: Record<string, any> = {};
            for (const sim of simulacrosDelEstudiante) {
                try {
                    const result = await getStudentResults(id, sim);
                    if (result) history[sim] = result;
                } catch (e) { /* cached or skip */ }
            }
            setHistoricalData((prev) => ({ ...prev, ...history }));
        };
        if (simulacrosDelEstudiante.length > 1) loadHistory();
    }, [simulacrosDelEstudiante]);

    // Semilla del sim activo en histórico (solo útil con 2+ simulacros)
    useEffect(() => {
        if (simulacrosDelEstudiante.length < 2) return;
        if (!estudiante || !simulacroActual || !(estudiante.puntaje_global > 0)) return;
        setHistoricalData((prev) => {
            const existing = prev[simulacroActual];
            if (existing?.puntaje_global && existing.puntaje_global > 0) return prev;
            return { ...prev, [simulacroActual]: estudiante };
        });
    }, [estudiante, simulacroActual, simulacrosDelEstudiante.length]);

    // Handler para seleccionar simulacro desde el modal
    const handleSelectSimulacro = async (sim: string) => {
        localStorage.setItem('simulacro_selected', sim);
        broadcastStudentSimulation(sim);
        setSimulacroActual(sim);
        setShowSimulacroModal(false);
        setErrorMsg(''); // Limpiar errores
        
        try {
            const { getAppConfig } = await resolveEstudianteDataModule();
            const config = await getAppConfig();
            setIsPartialGrading((config.partialSimulations || []).includes(sim));
        } catch { /* ignore */ }

        // 🔥 CRÍTICO: Recargar datos del nuevo simulacro
        await loadData(sim);

        // Mostrar bienvenida tras seleccionar el simulacro
        if (!sessionStorage.getItem('welcome_shown')) {
            setTimeout(() => setWelcomeModal(true), 1000);
            sessionStorage.setItem('welcome_shown', 'true');
        }
    };

    // Handler para cambiar de simulacro
    const handleSimulacroChange = async (newSim: string) => {
        localStorage.setItem('simulacro_selected', newSim);
        broadcastStudentSimulation(newSim);
        setSimulacroActual(newSim);
        setErrorMsg(''); // Limpiar errores
        
        try {
            const { getAppConfig } = await resolveEstudianteDataModule();
            const config = await getAppConfig();
            setIsPartialGrading((config.partialSimulations || []).includes(newSim));
        } catch { /* ignore */ }
        
        // 🔥 CRÍTICO: Recargar datos del nuevo simulacro
        await loadData(newSim);
    };

    const handleLogout = () => {
        if (isDemoMode) {
            exitDemoEstudianteSession(router);
            return;
        }
        localStorage.removeItem('student_id');
        localStorage.removeItem('student_name');
        localStorage.removeItem('student_email');
        localStorage.removeItem('student_data');
        localStorage.removeItem('simulacro_selected');
        localStorage.removeItem('linked_profiles');
        localStorage.removeItem('selected_profile_id');
        sessionStorage.removeItem('welcome_shown');
        router.replace('/login');
    };

    // Cambiar de perfil de estudiante (volver al selector)
    const handleSwitchProfile = () => {
        localStorage.removeItem('student_id');
        localStorage.removeItem('student_name');
        localStorage.removeItem('student_data');
        localStorage.removeItem('simulacro_selected');
        localStorage.removeItem('selected_profile_id');
        sessionStorage.removeItem('welcome_shown');
        // Mantener linked_profiles y student_email para que el selector funcione
        navigateTo('/estudiante/selector');
    };

    // === Handler: Ver Respuestas Correctas ===
    const handleVerClaves = async (simIdOverride?: string) => {
        const targetSim = simIdOverride || simulacroActual;
        if (!targetSim) return;
        
        // ✅ DEMO MODE: Show notification instead of loading from Firestore
        if (isDemoMode) {
            // Don't open modal, just show a notification that this is premium content
            return;
        }
        
        setClavesLoading(true);
        setClavesSimId(targetSim);
        setShowClavesModal(true);
        try {
            const { getStatistics } = await resolveEstudianteDataModule();
            const stats = await getStatistics(targetSim);
            const materiasObj = (stats as any)?.materias || {};
            const organized: Record<string, ClavePregunta[]> = {};
            for (const [materia, preguntas] of Object.entries(materiasObj)) {
                const items: ClavePregunta[] = [];
                for (const [, pregData] of Object.entries(preguntas as Record<string, any>)) {
                    items.push({
                        numero: pregData.numero,
                        respuesta_correcta: pregData.respuesta_correcta || '—',
                        porcentaje_acierto: pregData.porcentaje_acierto || 0,
                        sesion: typeof pregData.sesion === 'string' ? pregData.sesion : undefined,
                    });
                }
                items.sort((a, b) => a.numero - b.numero);
                organized[materia] = items;
            }
            setClavesData(organized);
        } catch (err) {
            console.error('Error loading claves:', err);
            setClavesData(null);
        } finally {
            setClavesLoading(false);
        }
    };

    // === COMPUTED: Promedios grupales (desde ranking completo) ===
    const promedios = useMemo(() => {
        if (rankingInfo.total === 0) return { global: 0, materias: {} as Record<string, { puntaje: number; porcentaje: number }> };
        return { global: rankingInfo.avgGlobal, materias: {} as Record<string, { puntaje: number; porcentaje: number }> };
    }, [rankingInfo]);

    // === COMPUTED: Trend data (must be before early returns) ===
    const trendData = useMemo(() => {
        if (Object.keys(historicalData).length < 2 || !simulacroActual) return null;
        const sims = simulacrosDelEstudiante.filter(s => historicalData[s]);
        if (sims.length < 2) return null;
        const prev = sims[sims.length - 2];
        const curr = sims[sims.length - 1];
        const prevData = historicalData[prev];
        const currData = historicalData[curr];
        if (!prevData || !currData) return null;
        const globalDelta = (currData.puntaje_global || 0) - (prevData.puntaje_global || 0);
        const perSubject = materias.map(m => ({
            key: m.key,
            label: m.label,
            color: m.color,
            prev: prevData.puntajes?.[m.key]?.puntaje || 0,
            curr: currData.puntajes?.[m.key]?.puntaje || 0,
            delta: (currData.puntajes?.[m.key]?.puntaje || 0) - (prevData.puntajes?.[m.key]?.puntaje || 0),
        }));
        return { prev, curr, globalPrev: prevData.puntaje_global || 0, globalCurr: currData.puntaje_global || 0, globalDelta, perSubject };
    }, [historicalData, simulacrosDelEstudiante, simulacroActual]);

    if (loading) {
        const skeletonMsg =
            loadStatusMessage || buildPersonalizedLoadingMessage(readStudentFirstName());
        return <DashboardSkeleton message={skeletonMsg} />;
    }

    if (errorMsg) {
        const isRetryable = isRetryableStudentError(errorMsg);
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">
                        {isRetryable ? 'Un momento…' : 'Algo no salió bien'}
                    </h2>
                    <p className="text-slate-500 mb-6 text-sm">{errorMsg}</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => { void retryBootstrap(); }}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                        >
                            {isRetryable ? 'Reintentar ahora' : 'Reintentar'}
                        </button>
                        {simulacrosDelEstudiante.length > 1 && (
                            <button
                                onClick={() => { setErrorMsg(''); setShowSimulacroModal(true); }}
                                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                            >
                                Cambiar Simulacro
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="w-full py-2 text-slate-400 text-sm hover:text-slate-600 transition-colors"
                        >
                            {isDemoMode ? 'Salir de demo' : 'Cerrar Sesión'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!estudiante?.informacion_personal) {
        return (
            <div
                className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
            >
                <div
                    className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-slate-200"
                >
                    <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Sin resultados disponibles</h2>
                    <p className="text-slate-500 mb-6 text-sm">
                        {needsGoogleForResults
                            ? STUDENT_ERRORS.resultsNeedGoogle
                            : simulacrosDelEstudiante.length > 1
                              ? `No hay resultados para "${simulacroActual}". Selecciona otro simulacro que hayas presentado.`
                              : `No se encontraron resultados para el simulacro "${simulacroActual}". Si ya presentaste el examen, contacta a tu coordinador.`}
                    </p>
                    <div className="flex flex-col gap-3">
                        {needsGoogleForResults && (
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                            >
                                Cerrar sesión e ingresar con Google
                            </button>
                        )}
                        {!needsGoogleForResults && simulacrosDelEstudiante.length > 1 && (
                            <button
                                onClick={() => { setShowSimulacroModal(true); }}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                            >
                                Seleccionar Simulacro
                            </button>
                        )}
                        <button onClick={() => { void retryBootstrap(); }} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                            Reintentar
                        </button>
                        <button onClick={handleLogout} className="w-full py-2 text-slate-400 text-sm hover:text-slate-600 transition-colors">
                            {isDemoMode ? 'Salir de demo' : 'Cerrar Sesión'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const puntajes = estudiante.puntajes && typeof estudiante.puntajes === 'object'
        ? estudiante.puntajes
        : null;

    if (!puntajes || Object.keys(puntajes).length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div
                    className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-slate-200"
                >
                    <div
                        className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Sin resultados disponibles</h2>
                    <p className="text-slate-500 mb-6 text-sm">
                        Tu perfil está registrado pero aún no hay puntajes para este simulacro.
                        Si ya presentaste el examen, contacta a tu coordinador.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => { void retryBootstrap(); }} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                            Reintentar
                        </button>
                        <button onClick={handleLogout} className="w-full py-2 text-slate-400 text-sm hover:text-slate-600 transition-colors">
                            {isDemoMode ? 'Salir de demo' : 'Cerrar Sesión'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const esPenalizado = estudiante.penalizado === true;
    const displayNombre = (estudiante.informacion_personal.nombres || 'Estudiante').split(' ')[0].toUpperCase();
    const displayApellido = (estudiante.informacion_personal.apellidos || '').split(' ')[0].toUpperCase();
    const totalCorrectas = Object.values(puntajes).reduce((acc, p) => acc + (p.correctas || 0), 0);
    const totalPreguntas = Object.values(puntajes).reduce((acc, p) => acc + (p.total_preguntas || 0), 0);
    const porcentajeGlobal = totalPreguntas > 0 ? Math.round((totalCorrectas / totalPreguntas) * 100) : 0;

    // === COMPUTED: Percentil ===
    const percentil = rankingInfo.total > 0
        ? Math.round(((rankingInfo.total - rankingInfo.puesto) / rankingInfo.total) * 100)
        : 0;

    // === HELPER: English ICFES Level (rangos oficiales ICFES Saber 11) ===
    // Pre A1: 0–36 | A1: 37–57 | A2: 58–70 | B1: 71–100
    const ENGLISH_LEVELS = [
        { level: 'Pre A1', min: 0,  max: 36,  color: 'text-red-600',     bg: 'bg-red-100',     bar: 'bg-red-400',     desc: 'Básico inicial' },
        { level: 'A1',     min: 37, max: 57,  color: 'text-orange-600',  bg: 'bg-orange-100',  bar: 'bg-orange-400',  desc: 'Principiante' },
        { level: 'A2',     min: 58, max: 70,  color: 'text-amber-600',   bg: 'bg-amber-100',   bar: 'bg-amber-400',   desc: 'Básico' },
        { level: 'B1',     min: 71, max: 100, color: 'text-emerald-600', bg: 'bg-emerald-100', bar: 'bg-emerald-500', desc: 'Pre-Intermedio' },
    ] as const;

    const getEnglishLevel = (puntaje: number) => {
        return ENGLISH_LEVELS.find(l => puntaje >= l.min && puntaje <= l.max) ?? ENGLISH_LEVELS[0];
    };

    const getScaleForMateria = (materiaKey: string) => {
        const cfg = NIVELES_DESEMPENO[materiaKey.toLowerCase()];
        return cfg?.niveles ?? null;
    };

    // === HELPER: Insight per subject (based on puntaje 0-100, NOT raw %) ===
    const getInsight = (puntaje: number) => {
        if (puntaje >= 75) return { text: 'Desempeño sobresaliente. Enfócate en los detalles avanzados para llegar al máximo.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>, bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-100' };
        if (puntaje >= 60) return { text: 'Buen nivel. Refuerza los temas donde tienes dudas para seguir subiendo.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, bg: 'bg-blue-50', color: 'text-blue-700', border: 'border-blue-100' };
        if (puntaje >= 45) return { text: 'Avance moderado. Practica más los fundamentos para mejorar tu puntaje.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, bg: 'bg-amber-50', color: 'text-amber-700', border: 'border-amber-100' };
        return { text: 'Necesita refuerzo. Dedica tiempo extra a estudiar esta área desde los conceptos básicos.', icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>, bg: 'bg-red-50', color: 'text-red-700', border: 'border-red-100' };
    };

    // === HELPER: Nivel de materia (Stitch-style) ===
    const getNivelMateriaMeta = (puntaje: number) => {
        if (puntaje >= 80) return { label: 'Nivel Sobresaliente', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (puntaje >= 68) return { label: 'Nivel Avanzado', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
        if (puntaje >= 55) return { label: 'Nivel Competente', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
        if (puntaje >= 40) return { label: 'Nivel Básico', badge: 'bg-orange-50 text-orange-700 border-orange-200' };
        return { label: 'Nivel Inicial', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
    };

    const getNivel = (puntaje: number) => {
        if (puntaje >= 400) return {
            text: 'SUPERIOR',
            color: 'bg-emerald-500',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>,
            bgSoft: 'bg-emerald-50',
            textCol: 'text-emerald-700'
        };
        if (puntaje >= 325) return {
            text: 'ALTO',
            color: 'bg-blue-500',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>,
            bgSoft: 'bg-blue-50',
            textCol: 'text-blue-700'
        };
        if (puntaje >= 250) return {
            text: 'MEDIO',
            color: 'bg-amber-500',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>,
            bgSoft: 'bg-amber-50',
            textCol: 'text-amber-700'
        };
        return {
            text: 'EN DESARROLLO',
            color: 'bg-red-500',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>,
            bgSoft: 'bg-red-50',
            textCol: 'text-red-700'
        };
    };
    const nivel = getNivel(estudiante.puntaje_global);
    const simModalOpen = showSimulacroModal && simulacrosDelEstudiante.length > 1;

    return (
        <div
            className="min-h-screen bg-slate-50 text-slate-900 font-sans relative pb-20 lg:pb-0"
        >

            {/* MODAL: Selector de Simulacro (Pantalla Completa) */}
            {simModalOpen && (
                <div
                    data-simulacro-modal="true"
                    className="fixed inset-0 z-[100] bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 overflow-y-auto"
                >
                    {/* Decorative elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10 max-w-2xl w-full text-center space-y-6 sm:space-y-8 mx-auto min-h-full flex flex-col items-center justify-center px-4 py-8 sm:py-12">
                        {/* Logo */}
                        <div className="flex justify-center">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-2xl sm:text-4xl font-black text-white shadow-2xl shadow-purple-500/30 animate-bounce">
                                SG
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-2 sm:mb-3">
                                ¡Hola de nuevo!
                            </h1>
                            <p className="text-base sm:text-xl text-purple-200/80">
                                Has participado en <span className="font-bold text-white">{simulacrosDelEstudiante.length} simulacros</span>
                            </p>
                        </div>

                        {/* Question */}
                        <p className="text-lg sm:text-2xl text-white/90 font-medium">
                            ¿Cuál deseas consultar?
                        </p>

                        {/* Simulation Options */}
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6 max-w-xl mx-auto w-full">
                            {simulacrosDelEstudiante.map((sim, index) => (
                                <button
                                    key={sim}
                                    type="button"
                                    onClick={() => handleSelectSimulacro(sim)}
                                    className={`group relative p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 
                                        ${index === simulacrosDelEstudiante.length - 1
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40'
                                            : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'
                                        }`}
                                >
                                    {/* Badge for latest */}
                                    {index === simulacrosDelEstudiante.length - 1 && (
                                        <span className="absolute -top-2.5 -right-2 sm:-top-3 sm:-right-3 bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg> Más reciente
                                        </span>
                                    )}

                                    <div className="text-xl sm:text-3xl font-black text-white mb-1 sm:mb-2">
                                        {sim}
                                    </div>
                                    <div className="text-xs sm:text-sm text-white/70">
                                        {({
                                        'SG11-08': 'Enero 2026',
                                        'SG11-09': 'Febrero 2026',
                                        'SG11-10': 'Febrero 2026',
                                        'SG11-11': 'Febrero 2026',
                                        'SG11-12X': 'Marzo 2026',
                                        'SG11-13': 'Marzo 2026',
                                    } as Record<string, string>)[sim] || 'Marzo 2026'}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Note */}
                        <p className="text-xs sm:text-sm text-purple-300/60">
                            Podrás cambiar de simulacro en cualquier momento desde el menú superior
                        </p>
                    </div>
                </div>
            )}


            {/* Watermark — subtle background texture, behind all content */}
            <img
                src={PRISMIC_FONDO_16_9}
                alt=""
                className="fixed inset-0 z-[1] w-full h-full object-cover opacity-[0.25] pointer-events-none select-none"
                draggable="false"
                loading="lazy"
                fetchPriority="low"
            />
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60">
                <div className="max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-5 py-3 lg:min-h-20 flex items-center gap-2 lg:gap-3 min-w-0">

                    {/* User Info & Logo */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0 max-w-[42%] sm:max-w-[200px] lg:max-w-[220px]">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/30 shrink-0">
                            SG
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-800 tracking-tight truncate student-name">
                                {displayNombre} {displayApellido}
                            </h1>
                            <p className="hidden xl:block text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-widest truncate">
                                {estudiante.informacion_personal.numero_identificacion}
                            </p>
                        </div>
                    </div>

                    {/* Sim selector — scroll horizontal (lg+), no empuja logout */}
                    {simulacrosDelEstudiante.length > 1 && simulacroActual && (
                        <div className="hidden lg:flex flex-1 min-w-0 overflow-hidden">
                            <div
                                className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full rounded-xl bg-slate-100 p-1"
                                role="tablist"
                                aria-label="Simulacro activo"
                            >
                                {simulacrosDelEstudiante.map((sim) => (
                                    <button
                                        key={sim}
                                        type="button"
                                        data-sim={sim}
                                        role="tab"
                                        aria-selected={simulacroActual === sim}
                                        onClick={() => handleSimulacroChange(sim)}
                                        className={`relative shrink-0 px-2.5 xl:px-3.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                            simulacroActual === sim
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                                                : 'text-slate-500 hover:text-indigo-600 hover:bg-white'
                                        }`}
                                    >
                                        {simulacroActual === sim && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-white shadow-sm animate-pulse" />
                                        )}
                                        {sim.replace('SG11-', '#')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Acciones — siempre visibles a la derecha */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
                        <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0">
                            {!isDemoMode ? (
                                <CourseHeaderButton
                                    href="/estudiante/curso"
                                    className="!px-3 !py-2 xl:!px-4 xl:!py-2.5 text-xs xl:text-sm shrink-0"
                                    identityHint={
                                        estudiante?.informacion_personal?.numero_identificacion
                                            ? {
                                                  documento: String(
                                                      estudiante.informacion_personal.numero_identificacion,
                                                  ),
                                              }
                                            : undefined
                                    }
                                />
                            ) : null}

                            <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
                                <button
                                    onClick={() => navigateTo('/estudiante/estadisticas')}
                                    className="px-2.5 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:bg-white hover:shadow-sm hover:text-indigo-600"
                                    title="Métricas"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    <span className="hidden xl:inline">Métricas</span>
                                </button>
                                <button
                                    onClick={() => navigateTo('/estudiante/analisis')}
                                    className="px-2.5 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:bg-white hover:shadow-sm hover:text-indigo-600"
                                    title="Respuestas"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                    <span className="hidden xl:inline">Respuestas</span>
                                </button>
                            </div>

                            {!isDemoMode ? (
                                <button
                                    onClick={() => navigateTo('/estudiante/perfil')}
                                    className="w-10 h-10 xl:w-11 xl:h-11 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl transition-colors hover:scale-105 active:scale-95 shrink-0"
                                    title="Mi Perfil"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </button>
                            ) : null}
                            {hasMultipleProfiles && (
                                <button
                                    onClick={handleSwitchProfile}
                                    className="w-10 h-10 xl:w-11 xl:h-11 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-2xl transition-colors hover:scale-105 active:scale-95 shrink-0"
                                    title="Cambiar Estudiante"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-10 h-10 xl:w-11 xl:h-11 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-colors hover:scale-105 active:scale-95 shrink-0"
                                title={isDemoMode ? 'Salir de demo' : 'Cerrar Sesión'}
                                aria-label={isDemoMode ? 'Salir de demo' : 'Cerrar sesión'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>

                        {/* Mobile / tablet (<lg) */}
                        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
                            {!isDemoMode ? (
                                <CourseHeaderButton
                                    href="/estudiante/curso"
                                    className="!px-3 !py-2 text-xs"
                                    identityHint={
                                        estudiante?.informacion_personal?.numero_identificacion
                                            ? {
                                                  documento: String(
                                                      estudiante.informacion_personal.numero_identificacion,
                                                  ),
                                              }
                                            : undefined
                                    }
                                />
                            ) : null}
                            {!isDemoMode ? (
                                <button
                                    onClick={() => navigateTo('/estudiante/perfil')}
                                    className="w-10 h-10 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-500 rounded-xl transition-colors shrink-0 cursor-pointer"
                                    title="Mi Perfil"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </button>
                            ) : null}
                            {hasMultipleProfiles && (
                                <button
                                    onClick={handleSwitchProfile}
                                    className="w-10 h-10 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-500 rounded-xl transition-colors shrink-0 cursor-pointer"
                                    title="Cambiar Estudiante"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors shrink-0 cursor-pointer"
                                title={isDemoMode ? 'Salir de demo' : 'Cerrar Sesión'}
                                aria-label={isDemoMode ? 'Salir de demo' : 'Cerrar sesión'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile only (<lg): simulacros en segunda fila */}
                {simulacrosDelEstudiante.length > 1 && simulacroActual && (
                    <div className="lg:hidden px-2.5 sm:px-4 pb-2 -mt-0.5">
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none bg-slate-100 rounded-xl p-1 w-full">
                            {simulacrosDelEstudiante.map((sim) => (
                                <button
                                    key={sim}
                                    type="button"
                                    data-sim={sim}
                                    onClick={() => handleSimulacroChange(sim)}
                                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-extrabold tracking-wide transition-all duration-200 cursor-pointer ${
                                        simulacroActual === sim
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-indigo-600 hover:bg-white/70'
                                    }`}
                                >
                                    {sim.replace('SG11-', '#')}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </header>
            <main className="max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-5 py-5 sm:py-8 space-y-5 sm:space-y-9">

                {/* Banner de Penalización por Sesión Incompleta */}
                {esPenalizado && (
                    <div className={`rounded-2xl p-5 sm:p-7 mb-2 shadow-sm border-2 relative overflow-hidden ${
                        isPartialGrading
                            ? 'bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 border-amber-300/60'
                            : 'bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 border-indigo-200/60'
                    }`}>
                        {/* Animated pulse indicator for partial grading */}
                        {isPartialGrading && (
                            <div className="absolute top-3 right-3 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider">En proceso</span>
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                                isPartialGrading ? 'bg-amber-100' : 'bg-indigo-100'
                            }`}>
                                {isPartialGrading ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1">
                                {isPartialGrading ? (
                                    <>
                                        <h3 className="text-lg md:text-xl font-extrabold text-amber-800 tracking-tight">
                                            ⏳ Calificación en curso
                                        </h3>
                                        <p className="text-slate-600 text-sm md:text-base mt-2 leading-relaxed">
                                            Estamos procesando las respuestas del simulacro <strong className="text-amber-700">{simulacroActual}</strong>.
                                            Aún no hemos recibido tus respuestas de ambas sesiones, pero <strong className="text-amber-700">las calificaciones se están actualizando constantemente</strong>.
                                            Si ya completaste las dos sesiones, tu puntaje aparecerá pronto.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">
                                            Simulacro incompleto
                                        </h3>
                                        <p className="text-slate-600 text-sm md:text-base mt-2 leading-relaxed">
                                            No se registró tu participación en ambas sesiones. La sesión faltante se califica como <strong className="text-indigo-700">N/A</strong>, por lo que cuenta como respuesta incorrecta en el puntaje.
                                            También puedes consultar las respuestas correctas y el análisis estadístico del simulacro para seguir preparándote.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className={`mt-5 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
                            isPartialGrading ? 'border-amber-200/40' : 'border-indigo-200/40'
                        }`}>
                            <p className="text-xs text-slate-400 font-medium text-center sm:text-left">
                                {isPartialGrading
                                    ? 'Las calificaciones se actualizan periódicamente. Vuelve a consultar más tarde.'
                                    : 'Si crees que esto es un error, comunícate con tu institución.'
                                }
                            </p>
                            {isDemoMode ? (
                                <div className="relative group">
                                    <button
                                        onClick={() => handleVerClaves()}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/30 whitespace-nowrap relative overflow-hidden"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Respuestas Correctas
                                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                        </span>
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
                                        🔒 Contenido Premium - Disponible en plan completo
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleVerClaves()}
                                    className={`inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap ${
                                        isPartialGrading
                                            ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30'
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                    Consultar Respuestas Correctas
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ⚠️ ALERTA: Sesiones Incompletas */}
                {(() => {
                    const sesiones = estudiante.secciones_completadas || estudiante.sesiones || [];
                    const tieneS1 = sesiones.includes('S1');
                    const tieneS2 = sesiones.includes('S2');
                    const sesionesIncompletas = !tieneS1 || !tieneS2;

                    if (sesionesIncompletas) {
                        return (
                            <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border-2 border-red-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden animate-pulse-slow">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>

                                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                                    {/* Icon */}
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-red-500/30">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 md:w-10 md:h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-3">
                                        <h3 className="text-xl md:text-2xl font-black text-red-600 tracking-tight">
                                            ¡Atención! Sesiones Incompletas
                                        </h3>
                                        <p className="text-slate-600 font-medium leading-relaxed">
                                            <strong className="text-red-600">Es tu responsabilidad</strong> completar las <strong>dos sesiones obligatorias</strong> del simulacro.
                                            {!tieneS1 && !tieneS2 && (
                                                <span className="block mt-2 text-red-500 font-bold flex items-center gap-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> No completaste ninguna sesión (S1 ni S2)
                                                </span>
                                            )}
                                            {!tieneS1 && tieneS2 && (
                                                <span className="block mt-2 text-orange-500 font-bold flex items-center gap-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Falta la Sesión 1 (S1) - Matemáticas, Sociales y Ciencias
                                                </span>
                                            )}
                                            {tieneS1 && !tieneS2 && (
                                                <span className="block mt-2 text-orange-500 font-bold flex items-center gap-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Falta la Sesión 2 (S2) - Lectura Crítica, Inglés y más
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex flex-wrap gap-3 pt-2">
                                            <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${tieneS1 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                                                {tieneS1 ? <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>} Sesión 1
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${tieneS2 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                                                {tieneS2 ? <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>} Sesión 2
                                            </div>
                                        </div>
                                    </div>

                                    {/* Impact indicator */}
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-red-200 text-center min-w-[140px]">
                                        <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold mb-1">Puntaje Actual</p>
                                        <p className="text-3xl font-black text-red-600">0</p>
                                        <p className="text-[10px] text-slate-500 font-medium mt-1">Penalización aplicada</p>
                                    </div>
                                </div>

                                {/* Footer message */}
                                <div className="mt-6 pt-4 border-t border-red-200/30">
                                    <p className="text-xs text-slate-400 text-center">
                                        Si crees que esto es un error, comunícate con tu institución.
                                    </p>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Dashboard Grid System v2 - More Robust */}
                <div className="flex flex-col gap-6">

                    {/* Top Row: Global Score (Big) + Key Stats (Right) */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Tarjeta Principal Puntaje Global + Datos Complementarios */}
                        <div
                            ref={leftScoreColumnRef}
                            className="flex h-full flex-col gap-4 max-md:contents"
                        >
                        <AnimateIn type="scaleUp" duration={0.8}>
                            <div className="max-md:flex max-md:justify-center max-md:w-full">
                            <div
                                ref={scoreCardRef}
                                className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-6 md:p-7 lg:p-8 relative overflow-hidden group shadow-2xl min-h-0 md:min-h-[260px] lg:min-h-[320px] transition-all hover:shadow-indigo-500/20 max-md:w-full max-md:max-w-[min(100%,24rem)] max-md:mx-auto"
                            >
                                {/* Blob decorativo animado */}
                                <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-400/40 transition-colors duration-500"></div>
                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                                <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-violet-500/10 rounded-full blur-[50px] pointer-events-none"></div>

                                <div className="relative z-10 flex flex-col md:flex-row md:items-stretch gap-5 md:gap-5 lg:gap-8 h-full max-md:items-center max-md:text-center">
                                    {/* Columna Izquierda - Puntaje (+ nivel en tablet/desktop) */}
                                    <div className="flex flex-col justify-between md:flex-shrink-0 md:min-w-[42%] lg:min-w-[200px] max-md:w-full max-md:items-center">
                                        {/* Contenido Superior */}
                                        <div className="max-md:flex max-md:flex-col max-md:items-center max-md:w-full">
                                            {/* Stitch-style: Simulacro badge */}
                                            {simulacroActual && (
                                                <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 mb-3 sm:mb-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>
                                                    <span className="text-xs font-semibold tracking-wide text-yellow-100">{simulacroActual} FINALIZADO</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mb-2 opacity-80 max-md:justify-center">
                                                <span className="w-1 h-4 bg-indigo-400 rounded-full"></span>
                                                <TextAnimation text="Puntaje Global" as="p" classname="text-sm font-bold uppercase tracking-widest text-indigo-200" delay={0.2} />
                                            </div>
                                            <div className="flex items-baseline gap-2 max-md:justify-center">
                                                <h2 className="text-[4.25rem] leading-[0.92] sm:text-[4.75rem] md:text-6xl lg:text-8xl xl:text-9xl font-black text-white tracking-tighter score-number max-md:[text-shadow:0_0_40px_rgba(167,139,250,0.45)]">
                                                    {estudiante.puntaje_global}
                                                </h2>
                                            </div>
                                            <TextAnimation text="de 500 posibles" as="p" classname="text-indigo-300 font-medium mt-1 text-lg sm:text-xl md:text-lg lg:text-xl" delay={0.6} />

                                            {/* Superaste a X Geniesitos */}
                                            {rankingInfo.puesto > 0 && rankingInfo.total > 0 && (rankingInfo.total - rankingInfo.puesto) > 0 && (
                                                <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 max-md:w-full max-md:justify-center">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744z" clipRule="evenodd" /></svg></div>
                                                    <span className="text-sm font-bold text-amber-300">
                                                        Superaste a {rankingInfo.total - rankingInfo.puesto} Geniesitos
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Contenido Inferior (Nivel) */}
                                        <div className="mt-4 sm:mt-5 md:mt-6 max-md:flex max-md:justify-center max-md:w-full">
                                            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 hover:bg-white/15 transition-colors max-md:w-full max-md:justify-center">
                                                <span className="text-2xl shadow-sm filter drop-shadow-lg">{nivel.icon}</span>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold leading-tight">Nivel de Desempeño</span>
                                                    <span className={`text-sm font-black tracking-wide ${nivel.color.replace('bg-', 'text-').replace('-500', '-300')}`}>
                                                        {nivel.text}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Separador vertical (solo tablet) */}
                                    <div className="hidden md:block lg:hidden w-px bg-gradient-to-b from-transparent via-white/20 to-transparent self-stretch"></div>

                                    {/* Columna Derecha - Datos Complementarios (solo tablet) */}
                                    <div className="hidden md:flex lg:hidden flex-1 flex-col justify-stretch gap-1.5 md:gap-2 min-w-0 w-full">
                                        <p className="hidden md:block text-[9px] md:text-[10px] uppercase tracking-widest text-indigo-300/70 font-bold shrink-0">Resumen de tu desempeño</p>

                                        <div className="grid grid-cols-2 gap-2 md:gap-2.5 flex-1 min-h-0 md:h-full auto-rows-fr w-full">
                                            {/* Mejor Materia */}
                                            {(() => {
                                                const materiasConDatos = Object.entries(puntajes)
                                                    .filter(([, p]) => p.total_preguntas > 0)
                                                    .sort((a, b) => b[1].puntaje - a[1].puntaje);
                                                const mejor = materiasConDatos[0];
                                                const mejorInfo = mejor ? materias.find(m => m.key === mejor[0]) : null;
                                                return (
                                                    <div className="bg-white/[0.07] backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 border border-white/[0.08] hover:bg-white/[0.12] transition-colors group/card min-h-0 h-full flex flex-col justify-between">
                                                        <div>
                                                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1 md:mb-1.5">
                                                            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: mejorInfo ? `${mejorInfo.color}30` : 'rgba(16,185,129,0.2)' }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-emerald-300" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744z" clipRule="evenodd" /></svg>
                                                            </div>
                                                            <span className="text-[7px] sm:text-[8px] md:text-[9px] uppercase tracking-wide sm:tracking-widest text-emerald-300/80 font-bold leading-tight">Tu mejor área</span>
                                                        </div>
                                                        <p className="hidden md:block text-[9px] md:text-[10px] text-white/30 font-medium mb-0.5 md:mb-1">Tu puntaje más alto</p>
                                                        <p className="text-[10px] sm:text-xs md:text-sm font-bold text-white/90 leading-tight line-clamp-2 md:truncate">{mejorInfo?.label || '—'}</p>
                                                        </div>
                                                        <p className="text-sm sm:text-base md:text-lg font-black mt-0.5" style={{ color: mejorInfo?.color || '#10b981' }}>
                                                            {mejor ? mejor[1].puntaje : '—'}<span className="text-[10px] text-white/40 font-medium"> de 100</span>
                                                        </p>
                                                    </div>
                                                );
                                            })()}

                                            {/* Materia a Reforzar */}
                                            {(() => {
                                                const materiasConDatos = Object.entries(puntajes)
                                                    .filter(([, p]) => p.total_preguntas > 0)
                                                    .sort((a, b) => a[1].puntaje - b[1].puntaje);
                                                const peor = materiasConDatos[0];
                                                const peorInfo = peor ? materias.find(m => m.key === peor[0]) : null;
                                                return (
                                                    <div className="bg-white/[0.07] backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 border border-white/[0.08] hover:bg-white/[0.12] transition-colors group/card min-h-0 h-full flex flex-col justify-between">
                                                        <div>
                                                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1 md:mb-1.5">
                                                            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: peorInfo ? `${peorInfo.color}30` : 'rgba(245,158,11,0.2)' }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                                            </div>
                                                            <span className="text-[7px] sm:text-[8px] md:text-[9px] uppercase tracking-wide sm:tracking-widest text-amber-300/80 font-bold leading-tight">Área a reforzar</span>
                                                        </div>
                                                        <p className="hidden md:block text-[9px] md:text-[10px] text-white/30 font-medium mb-0.5 md:mb-1">Tu puntaje más bajo</p>
                                                        <p className="text-[10px] sm:text-xs md:text-sm font-bold text-white/90 leading-tight line-clamp-2 md:truncate">{peorInfo?.label || '—'}</p>
                                                        </div>
                                                        <p className="text-sm sm:text-base md:text-lg font-black mt-0.5" style={{ color: peorInfo?.color || '#f59e0b' }}>
                                                            {peor ? peor[1].puntaje : '—'}<span className="text-[10px] text-white/40 font-medium"> de 100</span>
                                                        </p>
                                                    </div>
                                                );
                                            })()}

                                            {/* Promedio del Grupo */}
                                            <div className="bg-white/[0.07] backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 border border-white/[0.08] hover:bg-white/[0.12] transition-colors group/card min-h-0 h-full flex flex-col justify-between">
                                                <div>
                                                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1 md:mb-1.5">
                                                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                    </div>
                                                    <span className="text-[7px] sm:text-[8px] md:text-[9px] uppercase tracking-wide sm:tracking-widest text-blue-300/80 font-bold leading-tight">Promedio General</span>
                                                </div>
                                                <p className="hidden md:block text-[9px] md:text-[10px] text-white/30 font-medium mb-0.5 md:mb-1">De todos los estudiantes</p>
                                                <p className="text-sm sm:text-base md:text-lg font-black text-blue-300">{promedios.global > 0 ? promedios.global : '—'}<span className="text-[9px] sm:text-[10px] text-white/40 font-medium"> de 500</span></p>
                                                </div>
                                                {promedios.global > 0 && (
                                                    <div className={`inline-flex items-center gap-0.5 sm:gap-1 mt-1 md:mt-1.5 px-1 sm:px-1.5 md:px-2 py-0.5 rounded-md sm:rounded-lg text-[7px] sm:text-[8px] md:text-[10px] font-bold leading-tight max-md:max-w-full ${estudiante.puntaje_global >= promedios.global
                                                        ? 'bg-emerald-500/20 text-emerald-300'
                                                        : 'bg-red-500/20 text-red-300'
                                                        }`}>
                                                        {estudiante.puntaje_global >= promedios.global
                                                            ? <><span className="md:hidden">▲ +{Math.abs(estudiante.puntaje_global - promedios.global)} pts</span><span className="hidden md:inline">▲ Estás {Math.abs(estudiante.puntaje_global - promedios.global)} pts por encima</span></>
                                                            : <><span className="md:hidden">▼ -{Math.abs(estudiante.puntaje_global - promedios.global)} pts</span><span className="hidden md:inline">▼ Estás {Math.abs(estudiante.puntaje_global - promedios.global)} pts por debajo</span></>
                                                        }
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tendencia / Evolución */}
                                            <div className="bg-white/[0.07] backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 border border-white/[0.08] hover:bg-white/[0.12] transition-colors group/card min-h-0 h-full flex flex-col justify-between">
                                                <div>
                                                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1 md:mb-1.5">
                                                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                                                        {trendData ? (trendData.globalDelta >= 0 ? <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>) : <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                                                    </div>
                                                    <span className="text-[7px] sm:text-[8px] md:text-[9px] uppercase tracking-wide sm:tracking-widest text-violet-300/80 font-bold leading-tight">
                                                        {trendData ? 'Evolución' : 'Tu Percentil'}
                                                    </span>
                                                </div>
                                                {trendData ? (
                                                    <>
                                                        <p className="hidden md:block text-[9px] md:text-[10px] text-white/30 font-medium mb-0.5 md:mb-1">Cambio vs simulacro anterior</p>
                                                        <p className={`text-sm sm:text-base md:text-lg font-black ${trendData.globalDelta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                                            {trendData.globalDelta >= 0 ? '+' : ''}{trendData.globalDelta}<span className="text-[9px] sm:text-[10px] text-white/40 font-medium"> pts</span>
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="hidden md:block text-[9px] md:text-[10px] text-white/30 font-medium mb-0.5 md:mb-1">Posición relativa</p>
                                                        <p className="text-sm sm:text-base md:text-lg font-black text-violet-300">
                                                            {percentil > 0 ? `${percentil}%` : '—'}
                                                        </p>
                                                    </>
                                                )}
                                                </div>
                                                {trendData ? (
                                                    <p className="hidden md:block text-[9px] md:text-[10px] text-white/40 font-medium mt-0.5 leading-tight">
                                                        {trendData.globalDelta >= 0
                                                            ? `Mejoraste respecto a ${trendData.prev}`
                                                            : `Bajaste respecto a ${trendData.prev}`
                                                        }
                                                    </p>
                                                ) : percentil > 0 ? (
                                                    <p className="hidden md:block text-[10px] text-white/40 font-medium mt-0.5">
                                                        Superas al {percentil}% de estudiantes
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                        </AnimateIn>

                        {!isDemoMode && showCoursePromoInGap ? (
                            <div className="hidden lg:block flex-1 min-h-0">
                                <CoursePromoCard
                                    href="/estudiante/curso"
                                    variant="light"
                                    layout="embedded"
                                    className="h-full"
                                    identityHint={courseIdentityHint}
                                />
                            </div>
                        ) : null}
                        </div>

                        {/* Right Column: Key Stats Cards + Position Card */}
                        <div className="lg:col-span-2 flex flex-col gap-6 h-full">

                            {/* Grid de Stats (Aciertos + Efectividad) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Stat Card 1: Aciertos */}
                                <AnimateIn type="fadeRight" delay={0.2}>
                                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            {promedios.global > 0 && (() => {
                                                const diff = Math.round(((estudiante.puntaje_global - promedios.global) / promedios.global) * 100);
                                                return <span className={`${diff >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'} font-bold px-3 py-1 rounded-lg text-xs`}>{diff >= 0 ? '+' : ''}{diff}% vs promedio</span>;
                                            })()}
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-1">Aciertos Totales</p>
                                            <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">{totalCorrectas} <span className="text-lg md:text-xl text-slate-400 font-medium">/ {totalPreguntas}</span></p>
                                        </div>
                                    </div>
                                </AnimateIn>

                                {/* Stat Card 2: Efectividad */}
                                <AnimateIn type="fadeRight" delay={0.35}>
                                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col justify-between">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                            </div>
                                            <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg text-xs flex items-center gap-2 cursor-help" title="Porcentaje de respuestas correctas">
                                                Efectividad <span className="opacity-50">?</span>
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-1">Porcentaje</p>
                                            <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">{porcentajeGlobal}%</p>
                                        </div>
                                        {/* Mobile Tooltip Hint */}
                                        <div className="absolute top-2 right-2 md:hidden opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-20 pointer-events-none">
                                            % de respuestas correctas
                                        </div>
                                    </div>
                                </AnimateIn>
                            </div>

                            {/* My Position Card + Subject Tops — Compact */}
                            {!disableRankingForDemo && (
                            <AnimateIn type="flipUp" delay={0.5}>
                                <div
                                    className="bg-gradient-to-br from-purple-50 via-white to-indigo-50/30 rounded-[2rem] p-4 sm:p-6 border border-purple-100/80 shadow-sm hover:shadow-lg transition-all"
                                >
                                    <div className="flex flex-col xl:flex-row xl:items-center gap-3 sm:gap-4 xl:gap-6 min-w-0">
                                        {/* Left: Global Position */}
                                        <div
                                            onClick={() => navigateTo('/estudiante/ranking')}
                                            className="flex items-center gap-4 cursor-pointer group flex-shrink-0"
                                        >
                                            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Z" clipRule="evenodd" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-purple-500/70 font-bold uppercase tracking-widest mb-0.5">Posición Global</p>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-4xl font-black text-purple-900 tracking-tighter" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                                                        {rankingInfo.puesto > 0 ? `#${rankingInfo.puesto}` : '—'}
                                                    </span>
                                                    {rankingInfo.total > 0 && (
                                                        <span className="text-xs font-bold text-purple-300">/{rankingInfo.total}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {percentil > 0 && (
                                                <div className="hidden sm:flex items-center bg-purple-100/80 px-2.5 py-1 rounded-lg border border-purple-200/50">
                                                    <span className="text-[9px] text-purple-600 font-black">P{percentil}%</span>
                                                </div>
                                            )}
                                            <div className="hidden md:flex items-center text-purple-500 font-bold bg-white px-3 py-1.5 rounded-full text-[10px] shadow-sm border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors ml-auto xl:ml-0">
                                                Ver Ranking →
                                            </div>
                                        </div>

                                        {/* Separator */}
                                        {subjectTops.length > 0 && (
                                            <div className="hidden xl:block w-px bg-gradient-to-b from-transparent via-purple-200 to-transparent self-stretch"></div>
                                        )}

                                        {/* Right: Subject mini-cards (lg+) */}
                                        {subjectTops.length > 0 && (
                                            <div className="hidden xl:flex flex-1 items-stretch gap-2 min-w-0">
                                                {subjectTops.map((st) => (
                                                    <div
                                                        key={st.materia}
                                                        onClick={() => navigateTo('/estudiante/ranking')}
                                                        className="flex-1 min-w-0 relative bg-white rounded-xl p-3 border border-slate-100 hover:border-purple-200 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group/st overflow-hidden text-center"
                                                    >
                                                        <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60 group-hover/st:opacity-100 transition-opacity" style={{ backgroundColor: st.color }}></div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate">{st.label}</p>
                                                        <span className="text-lg font-black tracking-tight leading-none block" style={{ color: st.color }}>#{st.miPuesto || '—'}</span>
                                                        <span className="text-[8px] text-slate-300 font-medium">de {st.total}</span>
                                                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{st.miPuntaje} pts</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile: horizontal pills */}
                                    {subjectTops.length > 0 && (
                                        <div className="xl:hidden mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-purple-100/60">
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                {subjectTops.map((st) => (
                                                    <div
                                                        key={st.materia}
                                                        onClick={() => navigateTo('/estudiante/ranking')}
                                                        className="flex items-center gap-1.5 sm:gap-2 bg-white rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 border border-slate-100 cursor-pointer hover:border-purple-200 transition-colors"
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }}></div>
                                                        <span className="text-[10px] font-bold text-slate-500">{st.label}</span>
                                                        <span className="text-sm font-black tracking-tight" style={{ color: st.color, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>#{st.miPuesto || '—'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AnimateIn>
                            )}

                            {/* Quick link to Estadísticas — Desktop (inside right column) */}
                            <div className="hidden lg:block">
                                <AnimateIn type="blurIn" delay={0.6}>
                                    <section
                                        className="bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-800 rounded-[2rem] p-5 sm:p-6 border border-indigo-500/20 cursor-pointer hover:border-indigo-400/40 transition-all group shadow-sm"
                                        onClick={() => navigateTo('/estudiante/estadisticas')}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                                                <div>
                                                    <TextAnimation text="Perfil por Área & Evolución" as="h3" classname="font-bold text-white text-base" delay={0.1} />
                                                    <TextAnimation text="Radar de competencias, tendencia entre simulacros y análisis detallado" as="p" classname="text-xs text-slate-400" delay={0.3} staggerDelay={0.02} />
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-slate-400 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </section>
                                </AnimateIn>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Quick link to Estadísticas — Mobile only (full-width) */}
                <div className="lg:hidden">
                    <AnimateIn type="blurIn" delay={0.1}>
                        <section
                            className="bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-800 rounded-[2rem] p-5 sm:p-6 border border-indigo-500/20 cursor-pointer hover:border-indigo-400/40 transition-all group shadow-sm"
                            onClick={() => navigateTo('/estudiante/estadisticas')}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div>
                                    <div>
                                        <TextAnimation text="Perfil por Área & Evolución" as="h3" classname="font-bold text-white text-base" delay={0.1} />
                                        <TextAnimation text="Radar de competencias, tendencia entre simulacros y análisis detallado" as="p" classname="text-xs text-slate-400" delay={0.3} staggerDelay={0.02} />
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-slate-400 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </section>
                    </AnimateIn>
                </div>

                {simulacrosDelEstudiante.length > 1 ? (
                <StudentScoreHistoryPanel
                    historicalData={historicalData}
                    simulacrosDelEstudiante={simulacrosDelEstudiante}
                    simulacroActual={simulacroActual}
                    materias={materias}
                />
                ) : null}

                {/* Carrusel promocional (ImageKit) — tras métricas y CTA Perfil; antes de Resultados por Área */}
                <section className="space-y-1.5 -mx-0.5 sm:mx-0" aria-label="Promociones y beneficios Seamos Genios">
                    <div className="rounded-3xl sm:rounded-[1.875rem] overflow-hidden bg-slate-200/80 shadow-lg shadow-slate-200/60 border border-solid border-slate-200/90">
                        {/* Lienzo por ratio real de láminas (1600×686): las capas absolute ya tienen alto; antes min-h ~280px recortaba/achataba todo el arte. */}
                        <div
                            className="relative w-full bg-slate-100 aspect-[1600/686]"
                            role="region"
                            aria-roledescription="carrusel"
                            aria-label={`Banner ${marketingBannerIndex + 1} de ${SG_MARKETING_BANNERS.length}`}
                        >
                            {SG_MARKETING_BANNERS.map((banner, idx) => {
                                const active = idx === marketingBannerIndex;
                                const layer = `absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-out p-1.5 sm:p-3 ${
                                    active ? 'opacity-100 z-[2] pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                                }`;
                                const imgClass =
                                    'max-h-full max-w-full w-auto h-auto object-contain object-center select-none';

                                const imgEl = (
                                    <img
                                        src={banner.src}
                                        alt={banner.alt}
                                        width={1600}
                                        height={686}
                                        sizes="100vw"
                                        draggable={false}
                                        loading={idx === 0 ? 'eager' : 'lazy'}
                                        decoding="async"
                                        className={imgClass}
                                    />
                                );

                                if (active) {
                                    return (
                                        <button
                                            key={banner.src}
                                            type="button"
                                            className={`${layer} cursor-pointer bg-slate-100 border-0 rounded-none hover:bg-slate-50/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100`}
                                            onClick={() => setSocialFollowModalOpen(true)}
                                            aria-label={`${banner.alt}: abrir opciones para seguir a Seamos Genios en redes y WhatsApp`}
                                        >
                                            <span className="sr-only">Abrir redes y canal oficial</span>
                                            {imgEl}
                                        </button>
                                    );
                                }

                                return (
                                    <div key={banner.src} className={`${layer} bg-slate-100`} aria-hidden>
                                        {imgEl}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white border-t border-solid border-slate-100">
                            <p className="text-[10px] sm:text-[11px] text-slate-400 order-2 sm:order-1 sm:mr-auto text-center sm:text-left leading-snug">
                                Avance cada 5,5 s — Elige lámina con los indicadores —{' '}
                                <span className="text-slate-500 font-semibold">Toca la imagen → síguenos y canal oficial</span>
                            </p>
                            <div className="flex items-center justify-center gap-1.5 order-1 sm:order-2" role="tablist" aria-label="Seleccionar banner">
                                {SG_MARKETING_BANNERS.map((_, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        role="tab"
                                        aria-selected={idx === marketingBannerIndex}
                                        aria-label={`Mostrar banner ${idx + 1}`}
                                        onClick={() => setMarketingBannerIndex(idx)}
                                        className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                                            idx === marketingBannerIndex
                                                ? 'w-6 bg-indigo-600'
                                                : 'w-2 bg-slate-300 hover:bg-slate-400'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {simulacroActual && !isDemoMode ? (
                    <>
                    <RecordingsPrecacheBootstrap simulationId={simulacroActual} />
                    <RecordingsPromoCard
                        simulationId={simulacroActual}
                        href="/estudiante/clases"
                        variant="light"
                        documentId={estudiante?.informacion_personal?.numero_identificacion}
                        audience="estudiante"
                    />
                    </>
                ) : null}

                {/* Plan sugerido ICFES (temas con más errores) — solo si viene en results */}
                {Array.isArray(estudiante.plan_estudio_sugerido_icfes) &&
                    estudiante.plan_estudio_sugerido_icfes.length > 0 && (
                    <AnimateIn type="fadeUp" delay={0.08}>
                        <section
                            className="rounded-[1.75rem] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 shadow-md shadow-indigo-100/40 overflow-hidden"
                            aria-label="Plan de estudio sugerido según tus errores"
                        >
                            <div className="px-5 sm:px-7 py-5 sm:py-6 border-b border-indigo-100/80 bg-white/60 backdrop-blur-sm">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                                                Plan de estudio sugerido
                                            </h2>
                                            <p className="text-sm text-slate-600 mt-0.5 leading-snug max-w-2xl">
                                                Basado en tus respuestas y el marco de referencia ICFES: prioriza estos temas donde registraste más errores.
                                            </p>
                                            {estudiante.trazabilidad_marco?.taxonomy_version && (
                                                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                                                    Marco: {estudiante.trazabilidad_marco.taxonomy_version}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ul className="divide-y divide-indigo-100/70">
                                {estudiante.plan_estudio_sugerido_icfes.map((item, idx) => {
                                    const alta = item.prioridad === 'alta';
                                    return (
                                        <li key={`${item.competencia}-${item.afirmacion}-${item.tema}-${idx}`} className="px-5 sm:px-7 py-4 sm:py-5 bg-white/40 hover:bg-white/70 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                                                <span
                                                    className={`inline-flex self-start px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                                        alta
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                            : 'bg-amber-50 text-amber-800 border-amber-200'
                                                    }`}
                                                >
                                                    {alta ? 'Prioridad alta' : 'Prioridad media'}
                                                </span>
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <p className="font-semibold text-slate-900 text-[15px] leading-snug">
                                                        {item.tema}
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-slate-600">
                                                        <span className="font-medium text-slate-700">{item.competencia}</span>
                                                        {' · '}
                                                        <span>{item.afirmacion}</span>
                                                    </p>
                                                    <p className="text-xs text-slate-500 italic">{item.motivo}</p>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            {estudiante.analisis_temas_icfes &&
                                Object.keys(estudiante.analisis_temas_icfes).length > 0 && (
                                <details className="group border-t border-indigo-100/70 bg-slate-50/50">
                                    <summary className="cursor-pointer select-none px-5 sm:px-7 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50/50 list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
                                        <svg className="w-4 h-4 transition-transform group-open:rotate-90 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        Ver resumen por competencia y afirmación
                                    </summary>
                                    <div className="px-5 sm:px-7 pb-5 pt-1 space-y-4 max-h-[320px] overflow-y-auto">
                                        {Object.entries(estudiante.analisis_temas_icfes).map(([comp, byAf]) => (
                                            <div key={comp}>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{comp}</p>
                                                <div className="grid gap-2">
                                                    {Object.entries(byAf).map(([af, vals]) => (
                                                        <div
                                                            key={af}
                                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                                                        >
                                                            <span className="font-semibold text-slate-800">{af}</span>
                                                            <span className="text-slate-500">
                                                                {' — '}
                                                                {vals.aciertos}/{vals.total} aciertos ({vals.porcentaje}%)
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </section>
                    </AnimateIn>
                )}

                {/* Materias Grid */}
                <AnimateIn type="fadeUp" delay={0.15}>
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                                <TextAnimation text="Resultados por Área" as="h2" classname="text-xl font-bold text-slate-800" />
                            </div>
                        </div>

                        {/* Progress bar animation */}
                        <style jsx>{`
                            @keyframes progressFill {
                                from { transform: scaleX(0); }
                                to { transform: scaleX(1); }
                            }
                            @keyframes progressShine {
                                from { left: -40%; }
                                to { left: 140%; }
                            }
                            @keyframes floatBadge {
                                0%, 100% { transform: translateY(0); }
                                50% { transform: translateY(-3px); }
                            }
                            .progress-bar-fill {
                                transform-origin: left;
                                animation: progressFill 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                                position: relative;
                                overflow: hidden;
                            }
                            .progress-bar-fill::after {
                                content: '';
                                position: absolute;
                                top: 0;
                                left: -40%;
                                width: 30%;
                                height: 100%;
                                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
                                animation: progressShine 2s ease-in-out 1.5s;
                                border-radius: inherit;
                            }
                        `}</style>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {materias.map((materia, idx) => {
                                const data = puntajes[materia.key] || { puntaje: 0, correctas: 0, total_preguntas: 0 };
                                const porc = data.total_preguntas > 0 ? Math.round((data.correctas / data.total_preguntas) * 100) : 0;
                                const nivelMateria = data.total_preguntas > 0 ? getNivelMateriaMeta(data.puntaje) : null;
                                const promedioMateria = promedios.materias[materia.key]?.porcentaje ?? 0;
                                const deltaVsPromedio = promedioMateria > 0 ? porc - promedioMateria : null;

                                return (
                                    <AnimateIn key={materia.key} type="fadeUp" delay={idx * 0.1}>
                                        <StarBorder
                                            color={data.total_preguntas > 0 ? materia.color : '#94a3b8'}
                                            speed="6s"
                                            radius="1.25rem"
                                            className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => data.total_preguntas > 0 ? navigateTo(`/estudiante/analisis?materia=${encodeURIComponent(materia.key)}`) : undefined}
                                                disabled={data.total_preguntas === 0}
                                                aria-label={data.total_preguntas > 0 ? `Ver análisis de ${materia.label}` : `${materia.label} sin resultados disponibles`}
                                                className={`w-full text-left bg-white rounded-[1.25rem] group overflow-hidden transition-shadow ${data.total_preguntas > 0 ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2' : 'cursor-default'}`}
                                            >
                                                {/* Stitch-style: Colored gradient top stripe */}
                                                <div
                                                    className="h-1.5 w-full"
                                                    style={{
                                                        background: data.total_preguntas > 0
                                                            ? `linear-gradient(90deg, ${materia.color}, ${materia.color}99)`
                                                            : 'linear-gradient(90deg, #cbd5e1, #94a3b8)'
                                                    }}
                                                />
                                                {/* Premium Gradient Header */}
                                                <div
                                                    className="relative px-5 pt-4 pb-4"
                                                    style={{
                                                        background: data.total_preguntas > 0
                                                            ? `linear-gradient(135deg, ${materia.color}12 0%, ${materia.color}08 50%, transparent 100%)`
                                                            : `linear-gradient(135deg, #94a3b812 0%, #94a3b808 50%, transparent 100%)`
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                                                                style={data.total_preguntas > 0
                                                                    ? { background: `linear-gradient(135deg, ${materia.color}, ${materia.color}cc)`, boxShadow: `0 8px 20px ${materia.color}30` }
                                                                    : { background: `linear-gradient(135deg, #94a3b8, #94a3b8cc)`, boxShadow: `0 8px 20px #94a3b830` }
                                                                }
                                                            >
                                                                <span className="text-white">
                                                                    {materia.key === 'matemáticas' && <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                                                                    {materia.key === 'lectura crítica' && <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                                                    {materia.key === 'sociales y ciudadanas' && <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                                    {materia.key === 'ciencias naturales' && <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                                                                    {materia.key === 'inglés' && <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h3 className={`font-bold leading-tight group-hover:text-slate-950 transition-colors text-[15px] ${data.total_preguntas > 0 ? 'text-slate-800' : 'text-slate-400'}`}>{materia.label}</h3>
                                                                {data.total_preguntas > 0 && nivelMateria ? (
                                                                    <span className={`mt-1 inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold ${nivelMateria.badge}`}>
                                                                        {nivelMateria.label}
                                                                    </span>
                                                                ) : (
                                                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Sesión no presentada</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Score Badge */}
                                                        <div className="text-right" style={{ animation: data.total_preguntas > 0 ? 'floatBadge 3s ease-in-out infinite' : 'none' }}>
                                                            <div
                                                                className="inline-flex items-center justify-center min-w-[56px] px-3 py-2 rounded-2xl shadow-lg"
                                                                style={data.total_preguntas > 0
                                                                    ? { background: `linear-gradient(135deg, ${materia.color}, ${materia.color}dd)`, boxShadow: `0 4px 15px ${materia.color}40` }
                                                                    : { background: `linear-gradient(135deg, #cbd5e1, #94a3b8)`, boxShadow: `0 4px 15px #94a3b840` }
                                                                }
                                                            >
                                                                <span className="text-2xl font-black text-white leading-none tracking-tight">
                                                                    {data.total_preguntas > 0 ? data.puntaje : 'N/P'}
                                                                </span>
                                                            </div>
                                                            {materia.key === 'inglés' && data.puntaje > 0 && data.total_preguntas > 0 && (() => {
                                                                const eng = getEnglishLevel(data.puntaje);
                                                                return (
                                                                    <div className={`mt-1.5 inline-flex items-center gap-1 ${eng.bg} ${eng.color} px-2 py-0.5 rounded-lg text-[10px] font-black border ${eng.bg.replace('bg-', 'border-').replace('100', '200')}`}>
                                                                        Nivel {eng.level}
                                                                    </div>
                                                                );
                                                            })()}
                                                            {/* Escala ICFES Inglés (solo visible en la tarjeta expandida de Inglés) */}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="px-5 pb-5 space-y-4">
                                                    {data.total_preguntas === 0 ? (
                                                        /* No Presentada State */
                                                        <>
                                                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                                                                <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-600">No presentada</p>
                                                                    <p className="text-[11px] text-slate-400 leading-snug mt-1">
                                                                        No completaste la sesión que incluye esta materia. Completa ambas sesiones para obtener tu puntaje.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                                <div className="h-full rounded-full bg-slate-200" style={{ width: '0%' }}></div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        /* Normal State */
                                                        <>
                                                            {/* Progress Section */}
                                                            <div>
                                                                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                                    <span>Progreso</span>
                                                                    <span className="font-black" style={{ color: materia.color }}>{porc}%</span>
                                                                </div>
                                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-visible relative">
                                                                    <div
                                                                        className="h-full rounded-full progress-bar-fill"
                                                                        style={{
                                                                            width: `${porc}%`,
                                                                            background: `linear-gradient(90deg, ${materia.color}cc, ${materia.color})`,
                                                                            animationDelay: `${idx * 0.15}s`,
                                                                        }}
                                                                    ></div>
                                                                    {promedios.materias[materia.key]?.porcentaje > 0 && (
                                                                        <div
                                                                            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-400/60 rounded-full"
                                                                            style={{ left: `${Math.min(promedios.materias[materia.key].porcentaje, 100)}%` }}
                                                                            title={`Promedio: ${promedios.materias[materia.key].porcentaje}%`}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Stats Row */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                                                                    <span className="text-xs font-bold text-slate-600">{data.correctas}<span className="text-slate-400 font-medium"> / {data.total_preguntas}</span></span>
                                                                </div>
                                                                {promedios.materias[materia.key]?.porcentaje > 0 && (
                                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                                                                        <span className="w-3 h-[2px] bg-slate-400/60 rounded inline-block" /> Prom. {promedios.materias[materia.key].porcentaje}%
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {deltaVsPromedio !== null && (
                                                                <div className={`rounded-xl border px-3 py-2 text-[11px] font-semibold ${
                                                                    deltaVsPromedio >= 0
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                                                }`}>
                                                                    {deltaVsPromedio >= 0 ? 'Por encima' : 'Por debajo'} del promedio del grupo por {Math.abs(deltaVsPromedio)} pts
                                                                </div>
                                                            )}

                                                            {/* Insight */}
                                                            {(() => {
                                                                const insight = getInsight(data.puntaje);
                                                                return (
                                                                    <div className={`flex items-start gap-2.5 p-3 rounded-2xl ${insight.bg} border ${insight.border}`}>
                                                                        <span className="leading-none mt-0.5 flex-shrink-0">{insight.icon}</span>
                                                                        <p className={`text-[11px] font-medium leading-snug ${insight.color}`}>{insight.text}</p>
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Escala ICFES (todas las áreas) */}
                                                            {data.puntaje > 0 && data.total_preguntas > 0 && (() => {
                                                                const niveles = getScaleForMateria(materia.key);
                                                                if (!niveles) return null;
                                                                const actual = getNivelDesempeno(materia.key, data.puntaje);
                                                                const actualLabel = actual?.etiqueta ?? '';
                                                                return (
                                                                    <div className="p-3 rounded-2xl bg-slate-50 border border-solid border-slate-200/80 space-y-2">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                            Escala ICFES {materia.label}
                                                                        </p>
                                                                        <div className="flex gap-1.5">
                                                                            {niveles.map((lvl) => {
                                                                                const isActive = !!actual && lvl.etiqueta === actual.etiqueta;
                                                                                return (
                                                                                    <div key={lvl.etiqueta} className="flex-1 flex flex-col gap-1">
                                                                                        <div
                                                                                            className="h-2 rounded-full transition-all"
                                                                                            style={{
                                                                                                background: isActive ? materia.color : '#e2e8f0',
                                                                                                boxShadow: isActive ? `0 0 16px ${materia.color}55` : 'none',
                                                                                            }}
                                                                                        />
                                                                                        <p className={`text-[9px] font-black text-center leading-none ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                                                                                            {lvl.etiqueta}
                                                                                        </p>
                                                                                        <p className={`text-[8px] text-center leading-none ${isActive ? 'text-slate-600' : 'text-slate-300'}`}>
                                                                                            {lvl.puntajeMin}–{lvl.puntajeMax}
                                                                                        </p>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        <p className="text-[10px] font-semibold text-center text-slate-600">
                                                                            Tu puntaje ({data.puntaje}) corresponde al nivel <strong style={{ color: materia.color }}>{actualLabel}</strong>
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Posición en Ranking por Materia */}
                                                            {(() => {
                                                                const st = subjectTops.find(s => s.materia === materia.key);
                                                                if (!st || st.miPuesto === 0) return null;
                                                                const superados = st.total - st.miPuesto;
                                                                return (
                                                                    <div
                                                                        className="w-full p-2.5 rounded-2xl"
                                                                        style={{ backgroundColor: `${materia.color}10`, border: `1px solid ${materia.color}25` }}
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0 opacity-70" style={{ color: materia.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70" style={{ color: materia.color }}>Ranking</span>
                                                                            </div>
                                                                            <div className="flex items-baseline gap-1">
                                                                                <span className="text-sm font-black" style={{ color: materia.color }}>#{st.miPuesto}</span>
                                                                                <span className="text-[10px] font-medium text-slate-400">/ {st.total}</span>
                                                                            </div>
                                                                        </div>
                                                                        {superados > 0 && (
                                                                            <p className="text-[10px] font-semibold mt-1 pl-5" style={{ color: materia.color, opacity: 0.8 }}>
                                                                                Superaste a {superados} estudiante{superados !== 1 ? 's' : ''}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </>
                                                    )}
                                                </div>
                                            </button>
                                        </StarBorder>
                                    </AnimateIn>
                                );
                            })}

                            {/* CTA WhatsApp - In-Grid Card (6th slot) */}
                            <AnimateIn type="scaleUp" delay={0.6}>
                                <StarBorder color="#10b981" speed="8s" radius="1.25rem" className="hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 h-full">
                                    <a
                                        href="https://chat.whatsapp.com/G3zNDJvYVTX2hooRkIR7Ss"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group bg-gradient-to-br from-emerald-50 via-white to-green-50 rounded-[1.25rem] cursor-pointer overflow-hidden flex flex-col h-full"
                                    >
                                        {/* Header */}
                                        <div className="relative px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #10b98115 0%, #10b98108 50%, transparent 100%)' }}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                                                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 text-[15px]">Siguiente Simulacro</h3>
                                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Solicitar información →</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-sm" style={{ animation: 'floatBadge 2s ease-in-out infinite' }}>NUEVO</span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="px-5 pb-4 flex-1 flex flex-col justify-between">
                                            <div className="space-y-3">
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    Practica con más simulacros tipo ICFES Saber 11 y mejora tu puntaje. Únete a nuestro grupo de WhatsApp.
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-semibold">
                                                        <span className="w-1 h-1 rounded-full bg-emerald-400" /> Estándares ICFES
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-semibold">
                                                        <span className="w-1 h-1 rounded-full bg-emerald-400" /> Métricas avanzadas
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-semibold">
                                                        <span className="w-1 h-1 rounded-full bg-emerald-400" /> Evolución
                                                    </span>
                                                </div>
                                            </div>

                                            {/* CTA Button */}
                                            <div className="mt-4">
                                                <div className="relative cursor-pointer py-3 px-4 rounded-2xl overflow-hidden text-center font-semibold bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 group-hover:scale-[1.02] transition-all duration-300">
                                                    <span className="inline-flex items-center gap-2 text-white">
                                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                                        <span className="text-sm font-bold">Escríbenos por WhatsApp</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </StarBorder>
                            </AnimateIn>
                        </div>
                    </section>
                </AnimateIn>

                {/* Validation for Modal to avoid hydration issues */}
                {rankingModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRankingModal(null)}></div>
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className={`p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50`}>
                                <div>
                                    <h3 className={`text-xl font-bold ${rankingModal.color}`}>
                                        {rankingModal.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm font-medium">
                                        Superaste a {rankingModal.students.length} Geniesitos
                                    </p>
                                </div>
                                <button
                                    onClick={() => setRankingModal(null)}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="overflow-y-auto p-4 space-y-2">
                                {rankingModal.students.length > 0 ? (
                                    rankingModal.students.map((st, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${rankingModal.color.replace('text-', 'bg-').replace('600', '500')}`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-700 font-bold text-sm uppercase">
                                                        {st.informacion_personal.nombres.split(' ')[0]} {st.informacion_personal.apellidos.split(' ')[0]}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                                        {st.informacion_personal.institucion}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`text-lg font-black ${rankingModal.color}`}>
                                                {st.puntajes[rankingModal.subjectKey]?.puntaje || 0}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-400">
                                        <p>No hay datos disponibles.</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-400">
                                Seamos Genios Colombia
                            </div>
                        </div>
                    </div>
                )}

                {/* Welcome / Performance Modal */}
                {welcomeModal && estudiante && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setWelcomeModal(false)}></div>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden text-center p-8 sm:p-10 transform transition-all scale-100">
                            {estudiante.puntaje_global >= 320 ? (
                                <>
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"></div>
                                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 animate-bounce">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744z" clipRule="evenodd" /></svg>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
                                        ¡Increíble, {estudiante.informacion_personal.nombres.split(' ')[0].toUpperCase()}!
                                    </h3>
                                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                        Tu puntaje de <strong className="text-emerald-600 text-xl">{estudiante.puntaje_global}</strong> es sobresaliente. Estás demostrando que con esfuerzo todo es posible. ¡Sigue brillando!
                                    </p>
                                    <button
                                        onClick={() => setWelcomeModal(false)}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        ¡Gracias, vamos por más!
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600"></div>
                                    <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 animate-pulse">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
                                        ¡Tú puedes, {estudiante.informacion_personal.nombres.split(' ')[0].toUpperCase()}!
                                    </h3>
                                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                        Obtuviste <strong className="text-blue-600 text-xl">{estudiante.puntaje_global}</strong> puntos. Es un buen comienzo, pero sabemos que tu potencial es infinito. ¡Revisa tus fallos y vuelve más fuerte!
                                    </p>
                                    <button
                                        onClick={() => setWelcomeModal(false)}
                                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        ¡Voy a mejorar!
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Botón general Ver Respuestas Correctas - para TODOS */}
                <AnimateIn type="fadeUp" duration={0.6}>
                    <div className="bg-gradient-to-r from-indigo-50 via-violet-50 to-indigo-50 border border-indigo-200/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Respuestas Correctas del Simulacro</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Consulta todas las claves y el porcentaje de acierto por pregunta.</p>
                            </div>
                        </div>
                        {isDemoMode ? (
                            <div className="relative group">
                                <button
                                    onClick={() => handleVerClaves()}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/30 whitespace-nowrap relative overflow-hidden"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Ver Claves
                                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                    </span>
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/10 z-10">
                                    🔒 Contenido Premium - Disponible en plan completo
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleVerClaves()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30 whitespace-nowrap"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Ver Claves
                            </button>
                        )}
                    </div>
                </AnimateIn>

                {/* MODAL: Síguenos y canal oficial (banners ImageKit) */}
                {socialFollowModalOpen && (
                    <div
                        className="fixed inset-0 z-[115] flex items-end sm:items-center justify-center p-0 sm:p-3 md:p-4 animate-in fade-in duration-200"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sg-follow-modal-title"
                    >
                        <button
                            type="button"
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm border-0 cursor-default"
                            aria-label="Cerrar"
                            onClick={() => setSocialFollowModalOpen(false)}
                        />
                        <div
                            className="relative z-10 flex h-dvh max-h-dvh w-full flex-col overflow-y-auto rounded-none border border-solid border-slate-200/70 bg-white shadow-2xl shadow-slate-900/25 sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-[1.875rem] md:max-w-[920px]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2 shrink-0">
                                <h2 id="sg-follow-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight pr-2">
                                    Síguenos y canal oficial
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setSocialFollowModalOpen(false)}
                                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                    aria-label="Cerrar ventana"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="px-5 pb-5 space-y-4">
                                <p className="text-[13px] sm:text-sm leading-relaxed text-slate-700 text-center sm:text-left rounded-2xl px-4 py-3 bg-indigo-50/80 border border-solid border-indigo-100/80">
                                    Elige dónde quieres ver tips, novedades, el canal de WhatsApp y la comunidad Seamos Genios.
                                </p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 px-0.5">
                                    {SG_FOLLOW_OPTIONS.map((opt) => (
                                        <article
                                            key={opt.key}
                                            className="flex flex-col rounded-3xl border border-solid border-slate-200/90 bg-white p-3 sm:p-4 text-center shadow-sm"
                                        >
                                            <div
                                                className={`mx-auto mb-2.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${opt.circle}`}
                                                aria-hidden
                                            >
                                                <opt.Icon />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 leading-tight">{opt.title}</h3>
                                            <p className="mt-1 text-[11px] sm:text-xs text-slate-500 leading-snug flex-1">{opt.subtitle}</p>
                                            <a
                                                href={opt.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex items-center justify-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                            >
                                                Abrir
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                <span className="sr-only"> (se abre en una pestaña nueva)</span>
                                            </a>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <AnswerKeyModal
                    open={showClavesModal}
                    loading={clavesLoading}
                    simId={clavesSimId}
                    data={clavesData}
                    onClose={() => {
                        setShowClavesModal(false);
                        setClavesData(null);
                    }}
                />

                <StudentGlobalScoreHelpBubble
                    puntajes={puntajes}
                    puntajeGlobal={estudiante.puntaje_global}
                />

                {/* Footer */}
                <footer className="text-center py-8 border-t border-slate-200">
                    <p className="text-slate-400 text-sm font-medium">
                        © 2026 Seamos Genios Colombia &bull; Plataforma de Resultados Inteligentes
                    </p>
                </footer>
            </main>
        </div >
    );
}

