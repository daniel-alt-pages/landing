'use client';

import { useState, useEffect, useMemo } from 'react';
import { Estudiante, EstadisticasGrupo, MATERIAS_NOMBRES, COLORES_MATERIAS } from '@shared/types';
import { getInvalidaciones, getStudentResults, type InvalidacionItem } from '@features/simulacro/lib/firestoreService';
import classNames from 'classnames';
import SimulationSourceBadge from '@features/coordinador/components/ui/SimulationSourceBadge';
import { studentDocumentId, tagStudentForSimulation } from '@shared/lib/studentDisplay';
import StudentNivelesDesempenoPanel from '@features/coordinador/components/StudentNivelesDesempenoPanel';
import { CoordIcon, CoordIcons, MateriaIcon } from '@features/coordinador/components/ui/CoordinatorIcons';
import CoordinatorPerformanceAreaNav, {
    materiasFromPuntajes,
    PERFORMANCE_AREA_NAV_EMBED_PAD,
    usePerformanceAreaSelection,
} from '@features/coordinador/components/CoordinatorPerformanceAreaNav';
import { questionLabel } from '@/lib/questionLabel';

interface StudentDetailModalProps {
    estudiante: Estudiante | null;
    estadisticas: EstadisticasGrupo | null;
    isOpen: boolean;
    onClose: () => void;
    simId?: string;
}

export default function StudentDetailModal({ estudiante, estadisticas, isOpen, onClose, simId }: StudentDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'resumen' | 'plan_icfes' | 'auditoria'>('resumen');
    const [selectedPregunta, setSelectedPregunta] = useState<number | null>(null);
    const [invalidaciones, setInvalidaciones] = useState<InvalidacionItem[]>([]);
    // Estado para datos enriquecidos (respuestas_detalladas cargadas bajo demanda)
    const [enrichedEstudiante, setEnrichedEstudiante] = useState<Estudiante | null>(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [noPresento, setNoPresento] = useState(false);
    const [budgetError, setBudgetError] = useState(false);
    const [resolvedStudent, setResolvedStudent] = useState<Estudiante | null>(null);
    const [resolvingStudent, setResolvingStudent] = useState(false);

    const viewStudent = resolvedStudent ?? estudiante;

    const nivelesAreas = useMemo(
        () => materiasFromPuntajes(viewStudent?.puntajes),
        [viewStudent?.puntajes],
    );
    const { activeKey: nivelesMateria, setActiveKey: setNivelesMateria } = usePerformanceAreaSelection(nivelesAreas);

    // El objeto activo de auditoría: datos enriquecidos si ya cargaron, sino el original
    const estudianteAudit = enrichedEstudiante ?? viewStudent;
    const tieneRespuestas = Object.keys(estudianteAudit?.respuestas_detalladas || {}).some(
        mat => (estudianteAudit?.respuestas_detalladas?.[mat] as any)?.length > 0 ||
               Object.keys(estudianteAudit?.respuestas_detalladas?.[mat] || {}).length > 0
    );

    // Inicializar materia de auditoría desde datos enriquecidos o fallback
    const primeraMateria = Object.keys(estudianteAudit?.respuestas_detalladas || {})[0] || 'matemáticas';
    const [auditMateria, setAuditMateria] = useState<string>(primeraMateria);

    // Sincronizar auditMateria cuando lleguen los datos enriquecidos
    useEffect(() => {
        if (enrichedEstudiante) {
            const primera = Object.keys(enrichedEstudiante.respuestas_detalladas || {})[0];
            if (primera) setAuditMateria(primera);
        }
    }, [enrichedEstudiante]);

    // Resetear estado al cambiar de estudiante o simulacro
    useEffect(() => {
        setEnrichedEstudiante(null);
        setResolvedStudent(null);
        setLoadingDetalle(false);
        setSelectedPregunta(null);
        setNoPresento(false);
        setBudgetError(false);
        setActiveTab('resumen');
    }, [estudiante?.informacion_personal?.numero_identificacion, simId, estudiante?.puntajes]);

    useEffect(() => {
        if (!isOpen || !estudiante || !simId) {
            setResolvedStudent(null);
            return;
        }

        let cancelled = false;
        setResolvingStudent(true);
        setResolvedStudent(tagStudentForSimulation(estudiante, simId));

        (async () => {
            try {
                const id = studentDocumentId(estudiante);
                if (!id) return;
                const fresh = await getStudentResults(id, simId);
                if (!cancelled && fresh) {
                    setResolvedStudent(tagStudentForSimulation(fresh, simId));
                }
            } catch {
                // Mantener datos del listado del simulacro activo
            } finally {
                if (!cancelled) setResolvingStudent(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOpen, estudiante, simId]);

    useEffect(() => {
        if (isOpen) {
            getInvalidaciones(simId).then(setInvalidaciones).catch(() => { });
        }
    }, [isOpen, simId]);

    // Cargar respuestas_detalladas bajo demanda cuando se abre la pestaña de auditoría
    const handleAuditoriaTab = async () => {
        // Si ya hay datos o ya está cargando, solo cambiar tab
        if (tieneRespuestas || enrichedEstudiante || loadingDetalle) {
            setActiveTab('auditoria');
            return;
        }
        // Si ya confirmamos que no presentó, solo cambiar tab
        if (noPresento || budgetError) {
            setActiveTab('auditoria');
            return;
        }
        if (!viewStudent?.informacion_personal?.numero_identificacion) {
            setActiveTab('auditoria');
            return;
        }
        // ⚡ Setear loading=true ANTES de cambiar tab para evitar render vacío
        setLoadingDetalle(true);
        setNoPresento(false);
        setBudgetError(false);
        setActiveTab('auditoria');
        try {
            const studentId = String(viewStudent.informacion_personal.numero_identificacion).trim();
            
            // Primero intentar cargar con requireDetalle (documento individual completo)
            let full = await getStudentResults(studentId, simId, true /* requireDetalle */);
            
            // Si el documento individual no tiene respuestas_detalladas (optimizado),
            // enriquecer desde chunks del admin
            if (full && !Object.keys(full.respuestas_detalladas || {}).length) {
                console.log('[StudentDetailModal] Documento optimizado detectado, enriqueciendo desde chunks...');
                const { enrichStudentWithDetailedAnswers } = await import('@features/simulacro/lib/firestoreService');
                full = await enrichStudentWithDetailedAnswers(full, simId);
            }
            
            if (full) {
                setEnrichedEstudiante(tagStudentForSimulation(full, simId || ''));
            } else {
                // null real = el documento no existe en Firestore → el estudiante realmente no presentó
                setNoPresento(true);
            }
        } catch (err: any) {
            if (err?.code === 'BUDGET_EXHAUSTED') {
                // Presupuesto agotado — no sabemos si presentó o no; mostrar error temporal
                console.warn('[StudentDetailModal] Presupuesto de lecturas agotado, no se pudo verificar participación.');
                setBudgetError(true);
            } else {
                console.warn('[StudentDetailModal] Error cargando respuestas_detalladas:', err);
                setNoPresento(true);
            }
        } finally {
            setLoadingDetalle(false);
        }
    };

    if (!isOpen || !viewStudent) return null;

    // Helper: check if a question is invalidated
    const isInvalidada = (materia: string, numPregunta: number, sesionNum: number) => {
        const sesionStr = `S${sesionNum}`;
        return invalidaciones.some(inv => {
            const matMatch = inv.materia?.toLowerCase().trim() === materia.toLowerCase().trim();
            return matMatch && inv.sesion === sesionStr && inv.numero_pregunta === numPregunta;
        });
    };

    const materiasDisponibles = Object.keys(estudianteAudit?.respuestas_detalladas || {});

    // Helper function to convert object format to array format
    const toArrayFormat = (respuestasObj: any) => {
        if (!respuestasObj) return [];
        if (Array.isArray(respuestasObj)) return respuestasObj;
        return Object.entries(respuestasObj).map(([num, data]: [string, any]) => ({
            numero: parseInt(num),
            respuesta_estudiante: data.respuesta || '',
            respuesta_correcta: data.correcta || '',
            es_correcta: data.es_correcta || false,
            sesion: typeof data.sesion === 'string' ? data.sesion : undefined
        })).sort((a, b) => a.numero - b.numero);
    };

    const detectarPatron = (respuestas: any[], index: number) => {
        if (index < 3) return false;
        const current = respuestas[index].respuesta_estudiante;
        return (
            respuestas[index - 1].respuesta_estudiante === current &&
            respuestas[index - 2].respuesta_estudiante === current &&
            respuestas[index - 3].respuesta_estudiante === current
        );
    };

    const respuestasActuales = toArrayFormat(estudianteAudit?.respuestas_detalladas?.[auditMateria]);
    const tasaAciertoMateria = respuestasActuales.length > 0
        ? (respuestasActuales.filter((r: any) => r.es_correcta).length / respuestasActuales.length) * 100
        : 0;

    return (
        <div
            data-sg-modal-overlay
            className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
        >
            <button
                type="button"
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                aria-label="Cerrar"
                onClick={onClose}
            />

            <div
                data-sg-modal-panel
                className="relative z-[1] flex min-h-0 w-full max-w-7xl max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)))] sm:max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-t-2xl sm:rounded-3xl border border-white/10 bg-[#0f111a] shadow-2xl"
            >
                <div className="flex shrink-0 justify-center pt-2 pb-1 sm:hidden" aria-hidden>
                    <div className="h-1 w-9 rounded-full bg-white/20" />
                </div>
                <div className="flex shrink-0 flex-col gap-4 border-b border-white/5 bg-[#14161f] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
                    <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 ring-1 ring-white/10">
                                <CoordIcon icon={CoordIcons.GraduationCap} size={28} className="text-white" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#14161f] flex items-center justify-center text-[10px] font-bold ${viewStudent.puntaje_global >= 325 ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'}`}>
                                {viewStudent.puntaje_global >= 325 ? 'A' : 'B'}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h2 className="truncate text-xl font-bold text-white tracking-tight leading-none mb-1 sm:text-2xl">
                                {viewStudent.informacion_personal.nombres} {viewStudent.informacion_personal.apellidos}
                            </h2>
                            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/40 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-white/40" />
                                    {viewStudent.informacion_personal.numero_identificacion}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-white/40" />
                                    {viewStudent.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)'}
                                </span>
                                <SimulationSourceBadge simId={simId} compact />
                                {resolvingStudent && (
                                    <span className="text-[10px] text-white/30">Sincronizando simulacro…</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end sm:gap-8">
                        <div className="text-right">
                            <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-0.5">Global Score</div>
                            <div className="text-4xl font-black text-white tabular-nums tracking-tight">
                                {viewStudent.puntaje_global}
                                <span className="text-lg text-white/20 font-medium ml-1">/500</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl p-3 transition-all"
                        >
                            <CoordIcon icon={CoordIcons.X} size={18} className="text-current" />
                        </button>
                    </div>
                </div>

                <div className="flex shrink-0 gap-4 overflow-x-auto border-b border-white/5 bg-[#14161f] px-4 sm:gap-8 sm:px-8">
                    <button
                        onClick={() => setActiveTab('resumen')}
                        className={`py-4 text-sm font-bold tracking-wide transition-all relative ${activeTab === 'resumen' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                    >
                        <span className="inline-flex items-center gap-2">
                            <CoordIcon icon={CoordIcons.BarChart3} size={16} />
                            Resumen General
                        </span>
                        {activeTab === 'resumen' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('plan_icfes')}
                        className={`py-4 text-sm font-bold tracking-wide transition-all relative shrink-0 ${activeTab === 'plan_icfes' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                    >
                        Niveles de desempeño
                        {activeTab === 'plan_icfes' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                    </button>
                    <button
                        onClick={handleAuditoriaTab}
                        className={`py-4 text-sm font-bold tracking-wide transition-all relative shrink-0 ${activeTab === 'auditoria' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                    >
                        Auditoría de Respuestas
                        {loadingDetalle && <span className="ml-2 inline-block w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin align-middle" />}
                        {activeTab === 'auditoria' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                    </button>
                </div>

                {activeTab === 'plan_icfes' && (
                    <div
                        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-[#0f111a] p-4 sm:p-6 lg:p-8"
                        style={{ paddingBottom: PERFORMANCE_AREA_NAV_EMBED_PAD }}
                    >
                        <div className="animate-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none">
                            <StudentNivelesDesempenoPanel
                                puntajes={viewStudent.puntajes}
                                showNav={false}
                                activeMateria={nivelesMateria}
                                onMateriaChange={setNivelesMateria}
                            />
                        </div>
                    </div>
                )}

                {activeTab !== 'plan_icfes' && (
                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-[#0f111a] p-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))] sm:p-6 lg:p-8">
                    {activeTab === 'resumen' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            {Object.entries(viewStudent.puntajes || {}).map(([materia, data], idx) => (
                                <div key={materia} className="bg-[#14161f] border border-white/5 rounded-2xl p-6 relative group overflow-hidden hover:border-white/10 transition-all hover:-translate-y-1 hover:shadow-xl">
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                                        style={{ background: `radial-gradient(circle at top right, ${COLORES_MATERIAS[materia] || '#fff'}, transparent 70%)` }}
                                    />
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div>
                                            <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                                                <MateriaIcon materia={materia} size={18} className="text-white/80" />
                                                {MATERIAS_NOMBRES[materia] || materia}
                                            </h3>
                                            <p className="text-xs text-white/40 mt-1 font-medium">Puntaje Estandarizado</p>
                                        </div>
                                        <div className="text-4xl font-black text-white">{data.puntaje}</div>
                                    </div>
                                    <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-4">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${(data.correctas / data.total_preguntas) * 100}%`,
                                                backgroundColor: COLORES_MATERIAS[materia] || '#fff'
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div>
                                            <div className="text-2xl font-bold text-white tabular-nums">
                                                {data.correctas}<span className="text-sm text-white/30 font-medium mx-1">/</span><span className="text-sm text-white/30">{data.total_preguntas}</span>
                                            </div>
                                            <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Aciertos</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${data.correctas / data.total_preguntas > 0.6 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {Math.round((data.correctas / data.total_preguntas) * 100)}%
                                            </div>
                                            <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Efectividad</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'auditoria' && (
                        <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">
                            {/* Loading skeleton mientras carga respuestas_detalladas */}
                            {loadingDetalle && (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-white/40 text-sm">Cargando respuestas detalladas...</p>
                                </div>
                            )}

                            {/* Estado: estudiante no presentó este simulacro */}
                            {!loadingDetalle && noPresento && (
                                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 h-full">
                                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center shadow-xl ring-1 ring-white/10">
                                        <CoordIcon icon={CoordIcons.Ban} size={36} className="text-white/40" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg mb-1">Sin participación registrada</h3>
                                        <p className="text-white/40 text-sm max-w-xs leading-relaxed">
                                            Este estudiante no presentó el simulacro <span className="text-white/60 font-semibold">{simId || 'activo'}</span> o sus resultados aún no han sido cargados en el sistema.
                                        </p>
                                    </div>
                                    <div className="mt-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/30">
                                        Solo se muestran datos de simulacros presentados
                                    </div>
                                </div>
                            )}

                            {/* Estado: presupuesto de lecturas agotado (error temporal) */}
                            {!loadingDetalle && budgetError && (
                                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 h-full">
                                    <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 flex items-center justify-center shadow-xl ring-1 ring-yellow-500/20">
                                        <CoordIcon icon={CoordIcons.Zap} size={36} className="text-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-yellow-300 font-bold text-lg mb-1">Carga temporalmente bloqueada</h3>
                                        <p className="text-white/40 text-sm max-w-xs leading-relaxed">
                                            El sistema alcanzó el límite de lecturas por sesión. Los datos del simulacro <span className="text-white/60 font-semibold">{simId || 'activo'}</span> existen pero no se pueden cargar en este momento.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setBudgetError(false); handleAuditoriaTab(); }}
                                        className="mt-2 px-5 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm font-semibold hover:bg-yellow-500/30 transition-all"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <CoordIcon icon={CoordIcons.RefreshCw} size={14} />
                                            Reintentar
                                        </span>
                                    </button>
                                    <div className="mt-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/30">
                                        El presupuesto se reinicia automáticamente en unos segundos
                                    </div>
                                </div>
                            )}

                            {/* Solo mostrar alerta si HAY datos reales y la tasa es baja */}
                            {!loadingDetalle && respuestasActuales.length > 0 && tasaAciertoMateria < 40 && (
                                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <CoordIcon icon={CoordIcons.TrendingDown} size={20} className="text-red-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-red-400 font-bold">Rendimiento Crítico Detectado</h4>
                                        <p className="text-sm text-red-300/60">El estudiante tiene menos del 40% de aciertos en {auditMateria}. Revisa las preguntas en rojo.</p>
                                    </div>
                                </div>
                            )}

                            {!loadingDetalle && !noPresento && !budgetError && (<>
                            <div className="flex flex-wrap gap-2 mb-8 select-none">
                                {materiasDisponibles.map(mat => (
                                    <button
                                        key={mat}
                                        onClick={() => {
                                            setAuditMateria(mat);
                                            setSelectedPregunta(null);
                                        }}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${auditMateria === mat
                                            ? 'bg-white text-black border-white shadow-lg shadow-white/20 scale-105'
                                            : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {MATERIAS_NOMBRES[mat] || mat}
                                    </button>
                                ))}
                            </div>

                            {(() => {
                                const respuestas = toArrayFormat(estudianteAudit?.respuestas_detalladas?.[auditMateria]);

                                const getSesionFallback = (mat: string, num: number) => {
                                    const m = mat.toLowerCase();
                                    if (m.includes('matemáticas') || m.includes('matematicas')) return num <= 25 ? 1 : 2;
                                    if (m.includes('lectura')) return 1;
                                    if (m.includes('sociales') || m.includes('ciudadanas')) return num <= 25 ? 2 : 1;
                                    if (m.includes('naturales') || m.includes('ciencias')) return num >= 92 ? 1 : 2;
                                    if (m.includes('inglés') || m.includes('ingles')) return 2;
                                    return 1;
                                };

                                const porSesion = respuestas.reduce((acc, resp) => {
                                    const sesionMatch = typeof resp.sesion === 'string' ? resp.sesion.match(/S([12])/) : null;
                                    const sesion = sesionMatch ? Number(sesionMatch[1]) : getSesionFallback(auditMateria, resp.numero);
                                    if (!acc[sesion]) acc[sesion] = [];
                                    acc[sesion].push(resp);
                                    return acc;
                                }, {} as Record<number, typeof respuestas>);

                                const sesionesDisponibles = Object.keys(porSesion).map(Number).sort();

                                return (
                                    <div className="flex min-h-0 flex-col gap-6 lg:flex-row lg:gap-8">
                                        <div className="min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar lg:pr-4">
                                            {sesionesDisponibles.map(numSesion => {
                                                const respuestasSesion = porSesion[numSesion];
                                                if (!respuestasSesion || respuestasSesion.length === 0) return null;
                                                const respuestasOrdenadas = [...respuestasSesion].sort((a, b) => a.numero - b.numero);

                                                return (
                                                    <div key={numSesion} className="mb-8 animate-in slide-in-from-left-4 duration-500 stagger-100">
                                                        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-[#0f111a]/95 backdrop-blur z-20 py-2 border-b border-white/5">
                                                            <div className={`w-2 h-8 rounded-full ${numSesion === 1 ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                                            <h3 className="text-white font-bold text-lg">Sesión {numSesion}</h3>
                                                            <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                                                {respuestasOrdenadas.length} preguntas
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-[repeat(auto-fill,minmax(45px,1fr))] gap-2.5">
                                                            {respuestasOrdenadas.map((resp, idx, arr) => {
                                                                const esPatron = detectarPatron(arr, idx);
                                                                const isSelected = selectedPregunta === resp.numero;
                                                                const anulada = isInvalidada(auditMateria, resp.numero, numSesion);
                                                                return (
                                                                    <button
                                                                        key={resp.numero}
                                                                        onClick={() => setSelectedPregunta(isSelected ? null : resp.numero)}
                                                                        className={classNames(
                                                                            "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f111a]",
                                                                            isSelected
                                                                                ? "bg-white text-black shadow-lg scale-110 z-10 ring-white"
                                                                                : anulada
                                                                                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 border-dashed hover:bg-amber-500/30"
                                                                                    : resp.es_correcta
                                                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black hover:border-transparent"
                                                                                        : resp.respuesta_estudiante === 'NR'
                                                                                            ? "bg-gray-800/50 text-gray-500 border border-gray-700/50 hover:bg-gray-700 hover:text-white"
                                                                                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white hover:border-transparent",
                                                                            { "ring-2 ring-yellow-500 z-10 shadow-yellow-500/20": esPatron && !isSelected }
                                                                        )}
                                                                    >
                                                                        {resp.numero}
                                                                        {anulada && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border border-[#0f111a]" />}
                                                                        {esPatron && !anulada && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-lg" />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="min-h-0 shrink-0 overflow-y-auto custom-scrollbar border-white/5 pb-6 lg:w-96 lg:border-l lg:pl-4">
                                            <div className="lg:sticky lg:top-0 lg:max-h-full">
                                                {selectedPregunta ? (
                                                    (() => {
                                                        const respuestasArr = toArrayFormat(estudianteAudit?.respuestas_detalladas?.[auditMateria]);
                                                        const resp = respuestasArr.find((r: any) => r.numero === selectedPregunta);
                                                        const statsPregunta = estadisticas?.materias[auditMateria]?.[`pregunta_${selectedPregunta}`];
                                                        const sesionMatch = typeof resp?.sesion === 'string' ? resp.sesion.match(/S([12])/) : null;
                                                        const numSesion = sesionMatch ? Number(sesionMatch[1]) : getSesionFallback(auditMateria, selectedPregunta);

                                                        if (!resp) return null;

                                                        return (
                                                            <div className="relative flex max-h-[calc(100dvh_-_13rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f111a]/90 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-4 fade-in duration-300 sm:p-6 lg:max-h-[calc(100dvh_-_14rem)]">
                                                                {/* Background Glow Effect */}
                                                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
                                                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                                                                {/* --- HEADER --- */}
                                                                <div className="relative flex justify-between items-start mb-6 pb-6 border-b border-white/5 shrink-0">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                                                                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50">Sesión {numSesion}</span>
                                                                        </div>
                                                                        <div className="flex items-baseline gap-3 flex-wrap">
                                                                            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{questionLabel(selectedPregunta)}</h3>
                                                                            {isInvalidada(auditMateria, selectedPregunta, numSesion) ? (
                                                                                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-500/15 text-amber-400 border-amber-500/30">
                                                                                    ANULADA
                                                                                </span>
                                                                            ) : (
                                                                                <span className={classNames("text-xs font-bold tracking-wide px-2 py-0.5 rounded border",
                                                                                    resp.es_correcta ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                                                )}>
                                                                                    {resp.es_correcta ? "Acierto" : "Falló"}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                                                    {/* Comparativa Cards (Solo Tú vs Correcta) */}
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        {/* Tu Respuesta */}
                                                                        <div className="group relative overflow-hidden rounded-xl bg-[#1a1b26] border border-white/5 p-4 flex flex-col items-center justify-center min-h-[110px]">
                                                                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">Tu Respuesta</div>
                                                                            <div className={classNames("font-black transition-all",
                                                                                (resp.respuesta_estudiante || 'NR').length > 2 ? "text-lg text-center" : "text-4xl",
                                                                                resp.es_correcta ? "text-white" : "text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                                                                            )}>
                                                                                {resp.respuesta_estudiante || 'NR'}
                                                                            </div>
                                                                        </div>

                                                                        {/* Correcta */}
                                                                        <div className="group relative overflow-hidden rounded-xl bg-[#1a1b26] border border-white/5 p-4 flex flex-col items-center justify-center min-h-[110px]">
                                                                            <div className="absolute inset-0 bg-emerald-500/5" />
                                                                            <div className="text-[10px] text-emerald-500/60 uppercase font-bold tracking-wider mb-2 relative z-10">Correcta</div>
                                                                            <div className={classNames("font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] relative z-10 text-center",
                                                                                resp.respuesta_correcta.length > 2 ? "text-lg break-words leading-tight" : "text-4xl"
                                                                            )}>
                                                                                {resp.respuesta_correcta}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Dificultad Gauge (Neon Minimalista - High Contrast) */}
                                                                    {statsPregunta && (
                                                                        <div className="bg-[#0f1016] rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                                                                            <div className="flex justify-between items-center mb-4">
                                                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tasa de Acierto</span>
                                                                                <div className={classNames("px-3 py-1 rounded-lg flex items-center shadow-lg transition-all",
                                                                                    statsPregunta.porcentaje_acierto < 30 ? "bg-rose-500 shadow-rose-500/30" :
                                                                                        statsPregunta.porcentaje_acierto < 70 ? "bg-amber-500 shadow-amber-500/30" : "bg-emerald-500 shadow-emerald-500/30"
                                                                                )}>
                                                                                    <span className="text-[10px] font-black uppercase text-white tracking-wider">
                                                                                        Dificultad {statsPregunta.porcentaje_acierto < 30 ? "Alta" : statsPregunta.porcentaje_acierto < 70 ? "Media" : "Baja"}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-end gap-3 mb-2">
                                                                                <span className={classNames("text-5xl font-black tabular-nums tracking-tighter leading-none shadow-current drop-shadow-lg",
                                                                                    statsPregunta.porcentaje_acierto < 30 ? "text-rose-500" :
                                                                                        statsPregunta.porcentaje_acierto < 70 ? "text-amber-500" : "text-emerald-500"
                                                                                )}>
                                                                                    {statsPregunta.porcentaje_acierto}
                                                                                </span>
                                                                                <span className="text-sm font-bold text-white/30 mb-1">%</span>
                                                                            </div>

                                                                            {/* Neon Progress Bar */}
                                                                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                                                                                <div
                                                                                    className={classNames("h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_currentColor]",
                                                                                        statsPregunta.porcentaje_acierto < 30 ? "bg-rose-500 text-rose-500" :
                                                                                            statsPregunta.porcentaje_acierto < 70 ? "bg-amber-500 text-amber-500" : "bg-emerald-500 text-emerald-500"
                                                                                    )}
                                                                                    style={{ width: `${statsPregunta.porcentaje_acierto}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Insights Text (Dynamic) */}
                                                                    {statsPregunta && (
                                                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3 items-start">
                                                                            <CoordIcon icon={CoordIcons.Lightbulb} size={20} className="text-amber-300" />
                                                                            <p className="text-xs text-blue-200/80 leading-relaxed">
                                                                                {statsPregunta.porcentaje_acierto > 80
                                                                                    ? <>Pregunta <span className="text-emerald-300 font-bold">muy fácil</span>. La mayoría del grupo la acertó.</>
                                                                                    : statsPregunta.porcentaje_acierto < 20
                                                                                        ? <>Pregunta <span className="text-red-300 font-bold">extremadamente difícil</span>. Casi nadie pudo responderla correctamente.</>
                                                                                        : <>Esta pregunta tiene una dificultad <span className="text-white font-bold">media</span>. Revisa si caíste en algún distractor común.</>
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {/* Global Stats (Bars) */}
                                                                    {statsPregunta ? (
                                                                        <div className="relative space-y-4 pt-2">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="text-xs text-white/40 uppercase font-bold tracking-wider">Distribución</div>
                                                                            </div>

                                                                            <div className="space-y-2">
                                                                                {(() => {
                                                                                    const baseOpts = ['A', 'B', 'C', 'D'];
                                                                                    const extraOpts = Object.keys(statsPregunta.distribucion || {})
                                                                                        .filter(k => /^[E-Z]$/.test(k))
                                                                                        .sort();
                                                                                    return [...baseOpts, ...extraOpts];
                                                                                })().map(opcion => {
                                                                                    const pct = statsPregunta.distribucion[opcion as keyof typeof statsPregunta.distribucion] || 0;
                                                                                    const isCorrect = opcion === resp.respuesta_correcta;
                                                                                    const isSelected = opcion === resp.respuesta_estudiante;

                                                                                    const barColor = isCorrect
                                                                                        ? "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgb(52,211,153)]"
                                                                                        : isSelected
                                                                                            ? "bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgb(244,63,94)]"
                                                                                            : "bg-white/10";

                                                                                    const textColor = isCorrect ? "text-emerald-400 font-bold" : "text-white/30";

                                                                                    return (
                                                                                        <div key={opcion} className="flex items-center gap-3 group">
                                                                                            <div className={classNames("w-4 text-xs font-black text-center transition-colors", textColor)}>{opcion}</div>
                                                                                            <div className="flex-1 h-3 bg-[#0f111a] rounded-full overflow-hidden relative border border-white/5">
                                                                                                <div
                                                                                                    className={classNames("h-full rounded-full transition-all duration-700 ease-out", barColor)}
                                                                                                    style={{ width: `${pct}%` }}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="w-8 text-right text-[10px] font-mono font-medium text-white/60">{pct}%</div>
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 px-6 py-12 text-center lg:min-h-[360px]">
                                                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 shadow-xl ring-1 ring-white/10 grayscale opacity-40">
                                                            <CoordIcon icon={CoordIcons.MousePointerClick} size={36} className="text-white/40" />
                                                        </div>
                                                        <h3 className="text-white font-bold text-lg mb-2">Selecciona una pregunta</h3>
                                                        <p className="text-white/40 text-sm max-w-[200px] leading-relaxed">Haz clic en cualquier número de la izquierda para ver el análisis detallado de la respuesta.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {materiasDisponibles.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                                    <CoordIcon icon={CoordIcons.BarChart3} size={48} className="mb-4 opacity-20 grayscale" />
                                    <p>No hay respuestas registradas para este estudiante en este simulacro.</p>
                                    <p className="text-xs mt-2 text-white/10">El documento puede estar incompleto en Firestore.</p>
                                </div>
                            )}
                            </>)}
                        </div>
                    )}
                </div>
                )}

                {activeTab === 'plan_icfes' && (
                    <CoordinatorPerformanceAreaNav
                        items={nivelesAreas}
                        activeKey={nivelesMateria}
                        onSelect={setNivelesMateria}
                        layout="bottom"
                        anchor="embed"
                        label="Área de desempeño"
                    />
                )}
            </div>
        </div>
    );
}
