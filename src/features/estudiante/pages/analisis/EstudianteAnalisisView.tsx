'use client';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';
import Modal from '@/components/ui/Modal';
import { AnimatePresence, motion } from 'framer-motion';
import AnimateIn from '@shared/components/animations/AnimateIn';
import { resolveEstudianteDataModule } from '@features/estudiante/hooks/estudianteDataOptions';
import { ensureEstudianteSessionBootstrap } from '@features/estudiante/hooks/ensureEstudianteSessionBootstrap';
import { STUDENT_ERRORS } from '@/lib/studentUserFacingErrors';
import { AsyncTimeoutError, withTimeout } from '@shared/lib/withTimeout';
import { useEstudianteSession } from '@features/estudiante/hooks/useEstudianteSession';
import {
    peekEstudianteAnalisisCache,
    writeEstudianteAnalisisCache,
} from '@features/estudiante/lib/estudianteAnalisisPanelCache';
import { generarRecomendacionDetallada } from '@features/estudiante/pages/analisis/lib/generarRecomendacionDetallada';
import { normalizeRespuestas } from '@features/estudiante/pages/analisis/lib/normalizeRespuestas';
import { isNoAnswerOption } from '@features/coordinador/lib/answerOptions';
import { classifyAnswer } from '@shared/lib/answerClassification';
import type { IntensidadPlan, RespuestaDetallada } from '@features/estudiante/pages/analisis/lib/types';
import type { EstadisticasGrupo } from '@shared/types';
import type { PlannerCustomizationPayload, PlannerSessionState } from '@features/simulacro/types/simulation';
import { SG_AREA_COLORS, SG_AREA_ORDER } from '@shared/lib/sgAreaColors';
import { SG_PUBLIC_LINKS } from '@features/estudiante/pages/dashboard/lib/sgFollowOptions';
import { AnalisisSkeleton } from '@/components/SkeletonLoader';
import PerformanceLevelReport from '@/components/PerformanceLevelReport';
import { PreguntaDetalleModal } from '@features/estudiante/pages/analisis/components/PreguntaDetalleModal';
import {
    BarChart,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Target,
    Zap,
    Award,
    AlertCircle,
    ChevronRight,
    Flame,
    Shield,
    BookOpen,
    Calculator,
    Globe2,
    Microscope,
    Languages,
    CalendarDays,
    ListChecks,
    Clock,
    Coffee,
    Sparkles,
    Repeat,
    SlidersHorizontal,
    Plus,
    Minus,
    Rocket
} from 'lucide-react';
import { Suspense } from 'react';

interface Puntaje {
    puntaje: number;
    correctas: number;
    total_preguntas: number;
}

interface Estudiante {
    informacion_personal: {
        nombres: string;
        apellidos: string;
        numero_identificacion: string;
    };
    puntaje_global?: number;
    puntajes: Record<string, Puntaje>;
    respuestas_detalladas: Record<string, RespuestaDetallada[]>;
    plan_estudio_sugerido?: Array<{
        materia: string;
        tema: string;
        prioridad?: string;
        motivo?: string;
        recomendacion?: string;
        bloque?: string;
    }>;
    plan_estudio_sugerido_icfes?: Array<{
        competencia?: string;
        afirmacion?: string;
        materia: string;
        tema: string;
        prioridad?: string;
        motivo?: string;
        recomendacion?: string;
        bloque?: string;
    }>;
}
type EstadoSesionPlan = PlannerSessionState;

const PLAN_CACHE_EXPIRY_MS = new Date('2026-07-24T23:59:59-05:00').getTime();
const PLAN_RESUMEN_MODAL_CACHE_KEY = 'sg-plan-resumen-diagnostico-v1';
const PLAN_CHECKLIST_CACHE_KEY = 'sg-plan-checklist-sesiones-v2';
const PLAN_PERSONALIZACION_CACHE_KEY = 'sg-plan-personalizacion-v1';
const PLAN_ONBOARDING_CACHE_KEY = 'sg-plan-onboarding-v1';
const DAY_KEYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
type DayKey = (typeof DAY_KEYS)[number];

function dayKeyFromDate(date: Date): DayKey {
    const dow = diaSemanaIndex(date);
    return DAY_KEYS[dow] || 'lunes';
}

function toMetaDate(metaFechaISO: string): Date {
    const iso = String(metaFechaISO || '').trim() || '2026-07-23';
    return new Date(`${iso}T23:59:59-05:00`);
}

function formatMetaDate(metaFechaISO: string): string {
    const d = toMetaDate(metaFechaISO);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
}

function isoDateAtOffset(daysFromToday: number): string {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + daysFromToday);
    return base.toISOString().slice(0, 10);
}

function minutosBloqueBasePorIntensidad(intensidad: IntensidadPlan): number {
    if (intensidad === 'ligero') return 35;
    if (intensidad === 'intensivo') return 55;
    return 45;
}

function clampEventosPorDia(v: number): number {
    return Math.max(1, Math.min(6, Math.round(v)));
}

function calcularEventosPorHoras(
    horasObjetivoDia: number,
    intensidad: IntensidadPlan
): number {
    const horas = Math.max(1, Math.min(8, Number(horasObjetivoDia) || 1));
    const bloqueBase = minutosBloqueBasePorIntensidad(intensidad);
    const minutosObjetivo = horas * 60;
    let eventos = Math.round(minutosObjetivo / bloqueBase);

    // Heurística de repetición espaciada:
    // más horas -> más "toques" diarios del contenido.
    if (horas >= 2.5) eventos = Math.max(eventos, 2);
    if (horas >= 4) eventos = Math.max(eventos, 3);
    if (horas >= 5.5) eventos = Math.max(eventos, 4);

    return clampEventosPorDia(eventos);
}

function calcularHorasPorEventos(
    eventosPorDia: number,
    intensidad: IntensidadPlan
): number {
    const eventos = clampEventosPorDia(eventosPorDia);
    const bloqueBase = minutosBloqueBasePorIntensidad(intensidad);
    // Horas sugeridas equivalentes para mantener bloques útiles.
    const horas = (eventos * bloqueBase) / 60;
    return Math.max(1, Math.min(8, Math.round(horas * 2) / 2));
}

function perfilIntensidad(nivel: IntensidadPlan): { horas: number; eventos: number } {
    if (nivel === 'ligero') return { horas: 10.5, eventos: 2 };
    if (nivel === 'intensivo') return { horas: 28, eventos: 5 };
    return { horas: 17.5, eventos: 3 };
}

function calcularHorasDiaDesdeSemana(
    horasSemana: number,
    disponibilidad: Record<DayKey, number>
): number {
    const diasActivos = Math.max(1, Object.values(disponibilidad).filter((h) => Number(h || 0) > 0).length);
    const base = Number(horasSemana || 0) / diasActivos;
    return Math.max(0.5, Math.min(8, Math.round(base * 10) / 10));
}

function sumDisponibilidadSemana(disponibilidad: Record<DayKey, number>): number {
    return DAY_KEYS.reduce((acc, day) => acc + Math.max(0, Number(disponibilidad[day] || 0)), 0);
}

function hashTexto(texto: string): number {
    let h = 0;
    for (let i = 0; i < texto.length; i += 1) {
        h = ((h << 5) - h) + texto.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

function generarAccionIA(materia: string, tema: string, prioridad: 'alta' | 'media' | 'baja'): string {
    const base = prioridad === 'alta'
        ? 'Prioridad alta: dedica 40-50 min (teoría + práctica guiada).'
        : prioridad === 'media'
            ? 'Prioridad media: dedica 25-35 min con enfoque en precisión.'
            : 'Prioridad baja: repaso corto de 15-20 min para consolidar.';

    if (materia === 'lectura crítica') return `${base} Lee 2 textos breves y justifica por qué cada distractor es incorrecto en ${tema}.`;
    if (materia === 'matemáticas') return `${base} Resume fórmulas clave y resuelve 8 ejercicios progresivos de ${tema}.`;
    if (materia === 'sociales y ciudadanas') return `${base} Haz mapa de argumentos (actor, postura, evidencia) y 6 ítems tipo ICFES sobre ${tema}.`;
    if (materia === 'ciencias naturales') return `${base} Repasa concepto + unidad/variable y resuelve 8 preguntas de análisis para ${tema}.`;
    if (materia === 'inglés') return `${base} Practica 12 ítems de gramática/lectura focalizados en ${tema}.`;
    return `${base} Practica 6-10 preguntas enfocadas en ${tema}.`;
}

function normalizarTemaConIA(materia: string, temaOriginal: string): string {
    const tema = String(temaOriginal || '').trim();
    if (!tema) return 'refuerzo estrategico';

    const temaLower = tema.toLowerCase();
    const temasGenericos = [
        'tema',
        'temas',
        'general',
        'generales',
        'varios',
        'varias',
        'otros',
        'otro',
        'sin tema',
        'sin clasificar',
        'pendiente',
        'na',
        'n/a',
        'undefined',
        'null',
        'basico',
        'básico',
        'fundamentos'
    ];
    const esGenerico = tema.length <= 4 || temasGenericos.some((g) => temaLower === g || temaLower.includes(g));
    if (!esGenerico) return tema;

    if (materia === 'lectura crítica') return 'comprension e inferencia en lectura critica';
    if (materia === 'matemáticas') return 'resolucion de problemas y modelacion matematica';
    if (materia === 'sociales y ciudadanas') return 'analisis de contexto y argumentacion ciudadana';
    if (materia === 'ciencias naturales') return 'interpretacion de fenomenos y analisis cientifico';
    if (materia === 'inglés') return 'comprension lectora y estructuras gramaticales';
    return 'refuerzo estrategico por competencias';
}

const materias = [
    ...SG_AREA_ORDER.map((key) => {
        const c = SG_AREA_COLORS[key];
        const icons: Record<string, typeof BookOpen> = {
            'lectura crítica': BookOpen,
            matemáticas: Calculator,
            'sociales y ciudadanas': Globe2,
            'ciencias naturales': Microscope,
            inglés: Languages,
        };
        return {
            key: c.key,
            label: c.key === 'sociales y ciudadanas' ? 'Sociales' : c.key === 'ciencias naturales' ? 'Ciencias' : c.label,
            color: c.hex,
            gradient: c.gradient,
            icon: icons[c.key] ?? BookOpen,
        };
    }),
    { key: 'plan', label: 'Plan', color: '#22d3ee', gradient: 'from-cyan-500 to-blue-600', icon: CalendarDays },
];

// Sistema visual por materia para el plan de estudio (paleta consistente con `materias`).
type MateriaVisual = {
    label: string;
    short: string;
    chip: string;
    stripe: string;
    dot: string;
    iconColor: string;
    softBg: string;
    Icon: typeof BookOpen;
};

const MATERIA_VISUAL: Record<string, MateriaVisual> = {
    'lectura crítica': {
        label: 'Lectura Crítica',
        short: 'LC',
        chip: 'border-red-400/30 bg-red-500/10 text-red-200',
        stripe: 'bg-gradient-to-b from-red-400 via-red-500 to-red-600',
        dot: 'bg-red-400',
        iconColor: 'text-red-300',
        softBg: 'bg-red-500/[0.06]',
        Icon: BookOpen,
    },
    'matemáticas': {
        label: 'Matemáticas',
        short: 'MA',
        chip: 'border-blue-400/30 bg-blue-500/10 text-blue-200',
        stripe: 'bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600',
        dot: 'bg-blue-400',
        iconColor: 'text-blue-300',
        softBg: 'bg-blue-500/[0.06]',
        Icon: Calculator,
    },
    'sociales y ciudadanas': {
        label: 'Sociales',
        short: 'SO',
        chip: 'border-orange-400/30 bg-orange-500/10 text-orange-200',
        stripe: 'bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600',
        dot: 'bg-orange-400',
        iconColor: 'text-orange-300',
        softBg: 'bg-orange-500/[0.06]',
        Icon: Globe2,
    },
    'ciencias naturales': {
        label: 'Ciencias',
        short: 'CN',
        chip: 'border-green-400/30 bg-green-500/10 text-green-200',
        stripe: 'bg-gradient-to-b from-green-400 via-green-500 to-green-600',
        dot: 'bg-green-400',
        iconColor: 'text-green-300',
        softBg: 'bg-green-500/[0.06]',
        Icon: Microscope,
    },
    'inglés': {
        label: 'Inglés',
        short: 'IN',
        chip: 'border-violet-400/30 bg-violet-500/10 text-violet-200',
        stripe: 'bg-gradient-to-b from-violet-400 via-purple-500 to-purple-600',
        dot: 'bg-violet-400',
        iconColor: 'text-violet-300',
        softBg: 'bg-violet-500/[0.06]',
        Icon: Languages,
    },
};

const MATERIA_FALLBACK: MateriaVisual = {
    label: 'General',
    short: '–',
    chip: 'border-white/15 bg-white/[0.06] text-white/80',
    stripe: 'bg-gradient-to-b from-slate-400 to-slate-600',
    dot: 'bg-slate-400',
    iconColor: 'text-slate-300',
    softBg: 'bg-white/[0.04]',
    Icon: Sparkles,
};

const DIA_NOMBRES_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Devuelve 0=Lunes, ..., 6=Domingo (a diferencia de Date.getDay() que es 0=Dom).
function diaSemanaIndex(date: Date) {
    const d = date.getDay();
    return d === 0 ? 6 : d - 1;
}

function prettyMarcoSlug(value: string): string {
    return String(value || '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function focoMarcoPorMateria(materia: string): string {
    if (materia === 'lectura crítica') return 'lectura crítica - comprensión, inferencia y evaluación';
    if (materia === 'matemáticas') return 'matemáticas - interpretación, formulación y argumentación';
    if (materia === 'sociales y ciudadanas') return 'sociales y ciudadanas - pensamiento social y análisis de perspectivas';
    if (materia === 'ciencias naturales') return 'ciencias naturales - explicación de fenómenos e indagación';
    if (materia === 'inglés') return 'inglés - comprensión lectora y componente léxico-gramatical';
    return 'competencias clave del marco ICFES';
}

function obtenerFocoMarcoRespuesta(materia: string, resp: RespuestaDetallada): string {
    const competencia = prettyMarcoSlug(resp.competencia || '');
    const afirmacion = prettyMarcoSlug(resp.afirmacion || '');
    if (competencia && afirmacion) return `${competencia} - ${afirmacion}`;
    if (competencia) return competencia;
    return focoMarcoPorMateria(materia);
}

// Prioriza el tema procesado principal para evitar duplicar una pregunta en varios temas.
function obtenerTemaProcesadoRespuesta(materia: string, resp: RespuestaDetallada, usarFallbackMarco = true): string {
    const temaPrincipal = typeof resp.tema_principal === 'string' ? resp.tema_principal.trim() : '';
    if (temaPrincipal) return normalizarTemaConIA(materia, temaPrincipal);

    const temaRaw = typeof resp.tema_raw === 'string' ? resp.tema_raw.trim() : '';
    if (temaRaw) return normalizarTemaConIA(materia, temaRaw);

    const primerTemaLista = Array.isArray(resp.temas)
        ? String(resp.temas.find((t) => typeof t === 'string' && t.trim()) || '').trim()
        : '';
    if (primerTemaLista) return normalizarTemaConIA(materia, primerTemaLista);

    // Fallback al marco de referencia únicamente cuando el simulacro trae señales ICFES.
    return usarFallbackMarco ? obtenerFocoMarcoRespuesta(materia, resp) : '';
}

export default function EstudianteAnalisisView() {
    return (
        <Suspense fallback={<AnalisisSkeleton />}>
            <AnalisisContentInternal />
        </Suspense>
    );
}

// Interface para invalidaciones
interface Invalidacion {
    simulacro: string;
    sesion: string;
    numero_pregunta: number;
    materia: string;
    motivo?: string;
}

function AnalisisContentInternal() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isDemo: isDemoEstudiante, navigateTo } = useEstudianteSession();
    const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
    const [groupStatistics, setGroupStatistics] = useState<EstadisticasGrupo | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [materiaSeleccionada, setMateriaSeleccionada] = useState('lectura crítica');
    const [invalidaciones, setInvalidaciones] = useState<Invalidacion[]>([]);
    const [preguntaSeleccionada, setPreguntaSeleccionada] = useState<RespuestaDetallada | null>(null);
    const [vistaHeatmap, setVistaHeatmap] = useState(true);
    const [mostrarLogros, setMostrarLogros] = useState(false);
    const [mostrarRepasar, setMostrarRepasar] = useState(false);
    const [intensidadPlan, setIntensidadPlan] = useState<IntensidadPlan>('normal');
    const [metaFechaISO, setMetaFechaISO] = useState('2026-07-23');
    const [horasObjetivoSemana, setHorasObjetivoSemana] = useState(17.5);
    const [horasObjetivoDia, setHorasObjetivoDia] = useState(2.5);
    const [eventosPorDia, setEventosPorDia] = useState(2);
    const [weeksAvailable, setWeeksAvailable] = useState(12);
    const [dailyAvailability, setDailyAvailability] = useState<Record<DayKey, number>>({
        lunes: 2.5,
        martes: 2.5,
        miercoles: 2.5,
        jueves: 2.5,
        viernes: 2.5,
        sabado: 1.5,
        domingo: 1
    });
    const [busyDates, setBusyDates] = useState<string[]>([]);
    const [busyDateInput, setBusyDateInput] = useState('');
    const [cloudQuota, setCloudQuota] = useState<{ remaining: number; used: number; limit: number; dateKey: string } | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingPlan, setUploadingPlan] = useState(false);
    const [showPrioridadesModal, setShowPrioridadesModal] = useState(false);
    const [filtroPrioridadesTexto, setFiltroPrioridadesTexto] = useState('');
    const [filtroPrioridadesMateria, setFiltroPrioridadesMateria] = useState<'todas' | string>('todas');
    const [filtroPrioridadesNivel, setFiltroPrioridadesNivel] = useState<'todas' | 'alta' | 'media' | 'baja'>('todas');
    const [pendingScrollSemanas, setPendingScrollSemanas] = useState(false);
    const [mostrarAjustesAvanzados, setMostrarAjustesAvanzados] = useState(false);
    const [mostrarOnboardingPlan, setMostrarOnboardingPlan] = useState(false);
    const [mostrarToastGuardado, setMostrarToastGuardado] = useState(false);
    const [prioridadesManual, setPrioridadesManual] = useState<string[]>([]);
    const [dragPrioridadKey, setDragPrioridadKey] = useState<string | null>(null);
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const plannerHydratedRef = useRef(false);
    const semanasSectionRef = useRef<HTMLDivElement | null>(null);
    // FIX: Persiste el simulacroId en estado para evitar race conditions al leer desde storage
    const [simulacroActivo, setSimulacroActivo] = useState<string>('');
    
    // Estados para el selector de vista y paginador de semanas
    const [vistaPlan, setVistaPlan] = useState<'lista' | 'semanas'>('semanas');
    const [semanaActual, setSemanaActual] = useState(0);
    
    // Estado para el modal de sesión
    const [sesionSeleccionada, setSesionSeleccionada] = useState<{
        key: string;
        materia: string;
        tema: string;
        minutos: number;
        prioridad: string;
        repaso: number;
        fecha: Date;
        estado: EstadoSesionPlan;
    } | null>(null);
    const [mostrarResumenDiagnosticoModal, setMostrarResumenDiagnosticoModal] = useState(false);
    const [sesionesEstado, setSesionesEstado] = useState<Record<string, EstadoSesionPlan>>({});
    const diasActivosConfigurados = useMemo(
        () => Math.max(1, Object.values(dailyAvailability).filter((h) => Number(h || 0) > 0).length),
        [dailyAvailability]
    );
    const horasSemanaMaxPermitidas = useMemo(
        () => Math.max(4, Math.min(56, Math.round(sumDisponibilidadSemana(dailyAvailability) * 10) / 10)),
        [dailyAvailability]
    );
    const aplicarIntensidadPlan = useCallback((nivel: IntensidadPlan) => {
        const perfil = perfilIntensidad(nivel);
        const horasSemanaCap = Math.min(perfil.horas, horasSemanaMaxPermitidas);
        const horasDia = calcularHorasDiaDesdeSemana(horasSemanaCap, dailyAvailability);
        setIntensidadPlan(nivel);
        setHorasObjetivoSemana(horasSemanaCap);
        setHorasObjetivoDia(horasDia);
        setEventosPorDia(clampEventosPorDia(perfil.eventos));
    }, [dailyAvailability, horasSemanaMaxPermitidas]);

    const ajustarHorasObjetivo = useCallback((horasSemana: number) => {
        const horasSemanaClamped = Math.max(4, Math.min(horasSemanaMaxPermitidas, Number(horasSemana) || 4));
        const horasDia = calcularHorasDiaDesdeSemana(horasSemanaClamped, dailyAvailability);
        setHorasObjetivoSemana(horasSemanaClamped);
        setHorasObjetivoDia(horasDia);
        setEventosPorDia(calcularEventosPorHoras(horasDia, intensidadPlan));
    }, [dailyAvailability, intensidadPlan, horasSemanaMaxPermitidas]);

    const ajustarEventosPorDia = useCallback((eventos: number) => {
        const eventosClamped = clampEventosPorDia(eventos);
        const horasDia = calcularHorasPorEventos(eventosClamped, intensidadPlan);
        setEventosPorDia(eventosClamped);
        setHorasObjetivoDia(horasDia);
        setHorasObjetivoSemana(Math.round((horasDia * diasActivosConfigurados) * 10) / 10);
    }, [intensidadPlan, diasActivosConfigurados]);

    const restablecerPlanRecomendado = useCallback(() => {
        const intensidadBase: IntensidadPlan = 'normal';
        const perfil = perfilIntensidad(intensidadBase);
        const dailyBase: Record<DayKey, number> = {
            lunes: 2.5,
            martes: 2.5,
            miercoles: 2.5,
            jueves: 2.5,
            viernes: 2.5,
            sabado: 1.5,
            domingo: 1
        };
        const horasSemanaCap = Math.min(perfil.horas, Math.max(4, Math.min(56, Math.round(sumDisponibilidadSemana(dailyBase) * 10) / 10)));
        const horasDia = calcularHorasDiaDesdeSemana(horasSemanaCap, dailyBase);
        setIntensidadPlan(intensidadBase);
        setHorasObjetivoSemana(horasSemanaCap);
        setHorasObjetivoDia(horasDia);
        setEventosPorDia(perfil.eventos);
        setWeeksAvailable(12);
        setDailyAvailability(dailyBase);
        setBusyDates([]);
        setMostrarAjustesAvanzados(false);
    }, []);

    const setHorasDia = useCallback((day: DayKey, value: number) => {
        const h = Math.max(0, Math.min(8, Number(value) || 0));
        setDailyAvailability((prev) => {
            const next = { ...prev, [day]: h };
            const capacidadSemana = Math.max(4, Math.min(56, Math.round(sumDisponibilidadSemana(next) * 10) / 10));
            const horasSemanaEfectiva = Math.min(horasObjetivoSemana, capacidadSemana);
            const horasDia = calcularHorasDiaDesdeSemana(horasSemanaEfectiva, next);
            setHorasObjetivoSemana(horasSemanaEfectiva);
            setHorasObjetivoDia(horasDia);
            setEventosPorDia(calcularEventosPorHoras(horasDia, intensidadPlan));
            return next;
        });
    }, [horasObjetivoSemana, intensidadPlan]);

    useEffect(() => {
        if (horasObjetivoSemana <= horasSemanaMaxPermitidas) return;
        const horasSemanaEfectiva = horasSemanaMaxPermitidas;
        const horasDia = calcularHorasDiaDesdeSemana(horasSemanaEfectiva, dailyAvailability);
        setHorasObjetivoSemana(horasSemanaEfectiva);
        setHorasObjetivoDia(horasDia);
        setEventosPorDia(calcularEventosPorHoras(horasDia, intensidadPlan));
    }, [horasObjetivoSemana, horasSemanaMaxPermitidas, dailyAvailability, intensidadPlan]);

    useEffect(() => {
        if (!pendingScrollSemanas || vistaPlan !== 'semanas') return;
        const t = setTimeout(() => {
            semanasSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setPendingScrollSemanas(false);
        }, 80);
        return () => clearTimeout(t);
    }, [pendingScrollSemanas, vistaPlan]);

    const agregarDiaOcupado = useCallback(() => {
        const date = busyDateInput.trim();
        if (!date) return;
        setBusyDates((prev) => Array.from(new Set([...prev, date])).sort());
        setBusyDateInput('');
    }, [busyDateInput]);

    const quitarDiaOcupado = useCallback((date: string) => {
        setBusyDates((prev) => prev.filter((d) => d !== date));
    }, []);
    const aplicarMetaRapida = useCallback((dias: number) => {
        setMetaFechaISO(isoDateAtOffset(dias));
    }, []);
    const aplicarBusyRapido = useCallback((dias: number) => {
        setBusyDateInput(isoDateAtOffset(dias));
    }, []);

    const usarFallbackMarco = useMemo(() => {
        const tienePlanIcfes = Array.isArray(estudiante?.plan_estudio_sugerido_icfes) && estudiante!.plan_estudio_sugerido_icfes!.length > 0;
        const materiasData = estudiante?.respuestas_detalladas || {};
        const hayCamposIcfes = Object.values(materiasData).some((raw: unknown) => {
            const respuestas = normalizeRespuestas(raw || []);
            return respuestas.some((r) => Boolean(r.competencia || r.afirmacion || r.fuente_marco));
        });
        return tienePlanIcfes || hayCamposIcfes;
    }, [estudiante]);

    const showPlanTab = useMemo(() => {
        const hasIcfesPlan =
            Array.isArray(estudiante?.plan_estudio_sugerido_icfes) &&
            estudiante.plan_estudio_sugerido_icfes.length > 0;
        const hasLegacyPlan =
            Array.isArray(estudiante?.plan_estudio_sugerido) &&
            estudiante.plan_estudio_sugerido.length > 0;
        return hasIcfesPlan || hasLegacyPlan;
    }, [estudiante]);

    const materiasVisibles = useMemo(
        () => materias.filter((m) => m.key !== 'plan' || showPlanTab),
        [showPlanTab],
    );

    useEffect(() => {
        if (materiaSeleccionada === 'plan' && !showPlanTab) {
            setMateriaSeleccionada('lectura crítica');
        }
    }, [materiaSeleccionada, showPlanTab]);

    useEffect(() => {
        const mat = searchParams.get('materia');
        if (mat) {
            setMateriaSeleccionada(decodeURIComponent(mat).toLowerCase());
        }
    }, [searchParams]);

    const loadData = useCallback(async () => {
        setLoadError(null);
        ensureEstudianteSessionBootstrap(pathname);
        const id = localStorage.getItem('student_id');
        if (!id) {
            setLoading(false);
            router.replace('/login');
            return;
        }

        const {
            getStudentResults,
            hasRespuestasDetalladas,
            enrichStudentWithDetailedAnswers,
            clearStudentSimulationCaches,
            getInvalidaciones,
            getAppConfig,
            getStatistics,
            getPlannerCustomization,
            savePlannerCustomizationLocal,
            getPlannerUploadQuota,
            uploadPlannerCustomization,
        } = await resolveEstudianteDataModule();

        // Demo mode: use mock data with detailed responses
        if (id === 'demo') {
            const generateMockResponses = (total: number, correctRate: number) => {
                const responses: RespuestaDetallada[] = [];
                const opciones = ['A', 'B', 'C', 'D'];
                for (let i = 1; i <= total; i++) {
                    const correcta = opciones[Math.floor(Math.random() * 4)];
                    const esCorrecta = Math.random() < correctRate;
                    responses.push({
                        numero: i,
                        respuesta_estudiante: esCorrecta ? correcta : opciones.filter(o => o !== correcta)[Math.floor(Math.random() * 3)],
                        respuesta_correcta: correcta,
                        es_correcta: esCorrecta,
                    });
                }
                return responses;
            };

            const demoStudent: Estudiante = {
                informacion_personal: { nombres: 'ESTUDIANTE', apellidos: 'DEMO', numero_identificacion: 'demo' },
                puntajes: {
                    'lectura crítica': { puntaje: 72, correctas: 28, total_preguntas: 41 },
                    'matemáticas': { puntaje: 68, correctas: 19, total_preguntas: 35 },
                    'sociales y ciudadanas': { puntaje: 65, correctas: 23, total_preguntas: 35 },
                    'ciencias naturales': { puntaje: 70, correctas: 22, total_preguntas: 35 },
                    'inglés': { puntaje: 58, correctas: 28, total_preguntas: 55 },
                },
                respuestas_detalladas: {
                    'lectura crítica': generateMockResponses(41, 0.68),
                    'matemáticas': generateMockResponses(35, 0.54),
                    'sociales y ciudadanas': generateMockResponses(35, 0.66),
                    'ciencias naturales': generateMockResponses(35, 0.63),
                    'inglés': generateMockResponses(55, 0.51),
                },
            };

            // Mock group statistics for demo
            const mockStats: EstadisticasGrupo = {
                metadata: { total_evaluados: 6, fecha_generacion: new Date().toISOString() },
                materias: {},
            };
            const mockMaterias = ['lectura crítica', 'matemáticas', 'sociales y ciudadanas', 'ciencias naturales', 'inglés'];
            const mockTotals = [41, 35, 35, 35, 55];
            mockMaterias.forEach((mat, idx) => {
                const stats: Record<string, any> = {};
                for (let i = 1; i <= mockTotals[idx]; i++) {
                    const total = 6;
                    const correctas = Math.floor(Math.random() * total);
                    stats[String(i)] = {
                        numero: i,
                        respuesta_correcta: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
                        distribucion: { A: Math.floor(Math.random() * total), B: Math.floor(Math.random() * total), C: Math.floor(Math.random() * total), D: Math.floor(Math.random() * total), NR: 0 },
                        porcentaje_acierto: Math.round((correctas / total) * 100),
                        total_evaluados: total,
                    };
                }
                mockStats.materias[mat] = stats as any;
            });

            setEstudiante(demoStudent);
            setGroupStatistics(mockStats);
            // FIX: Establecer simulacroActivo en modo demo
            setSimulacroActivo(localStorage.getItem('simulacro_selected') || 'SG11-14');
            setLoading(false);
            return;
        }

        try {
            await withTimeout(
                (async () => {
            const targetId = String(id).trim();
            const saved = localStorage.getItem('simulacro_selected');
            let currentSim = saved;
            if (!currentSim) {
                const config = await getAppConfig();
                currentSim = config.activeSimulation;
            }

            const cachedScreen = currentSim
                ? peekEstudianteAnalisisCache(targetId, currentSim)
                : null;
            if (cachedScreen?.estudiante) {
                setEstudiante(cachedScreen.estudiante as any);
                setGroupStatistics(cachedScreen.groupStatistics);
                setInvalidaciones(cachedScreen.invalidaciones || []);
                setSimulacroActivo(cachedScreen.simulacroActivo);
                setLoading(false);
            }

            // FIX: Persistir el simulacroId en estado React para mantener el valor correcto
            setSimulacroActivo(currentSim || 'SG11-14');

            // 1. Detalle por pregunta vive en answerDetails/{sim}, no en results/{sim}
            let studentData = await getStudentResults(targetId, currentSim, true);

            if (studentData && !hasRespuestasDetalladas(studentData as any)) {
                console.warn('[AnalisisPage] Sin respuestas_detalladas — limpiando caché y reintentando answerDetails');
                clearStudentSimulationCaches(targetId, currentSim);
                studentData = await getStudentResults(targetId, currentSim, true);
            }
            if (studentData && !hasRespuestasDetalladas(studentData as any)) {
                studentData = await enrichStudentWithDetailedAnswers(studentData, currentSim);
            }

            if (studentData) {
                setEstudiante(studentData as any);
                if (!hasRespuestasDetalladas(studentData as any)) {
                    setLoadError(STUDENT_ERRORS.analysisDetailFailed);
                }
            } else {
                setLoadError(STUDENT_ERRORS.analysisNotFound);
            }

            // 3. Cargar invalidaciones desde Firestore
            const invalidacionesData = await getInvalidaciones(currentSim).catch(() => null);
            if (invalidacionesData) {
                setInvalidaciones(invalidacionesData);
            }

            const stats = await getStatistics(currentSim ?? undefined).catch(() => null);
            if (stats) {
                setGroupStatistics(stats);
            }

            if (studentData && currentSim) {
                writeEstudianteAnalisisCache({
                    estudiante: studentData as import('@shared/types').Estudiante,
                    groupStatistics: stats,
                    invalidaciones: invalidacionesData || [],
                    simulacroActivo: currentSim,
                    updatedAt: Date.now(),
                });
            }
                })(),
                45_000,
                'La carga del análisis tardó demasiado.',
            );

        } catch (err) {
            console.error(err);
            setLoadError(
                err instanceof AsyncTimeoutError
                    ? STUDENT_ERRORS.analysisTimeout
                    : STUDENT_ERRORS.analysisLoadFailed,
            );
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Helper para verificar si una pregunta está invalidada
    const esPreguntaInvalidada = useCallback((numeroPregunta: number, materia: string): boolean => {
        // Verificar contra el archivo de invalidaciones
        const currentSim = sessionStorage.getItem('simulacro_selected') || 'SG11-09';
        // Normalizar ambos IDs removiendo espacios y guiones para comparar de forma flexible
        // "SG11 - 09" y "SG11-09" ambos se convierten a "SG1109"
        const normalize = (s: string) => s.replace(/[\s\-]/g, '').toLowerCase();
        const simNorm = normalize(currentSim);

        return invalidaciones.some(inv =>
            normalize(inv.simulacro) === simNorm &&
            inv.materia.toLowerCase() === materia.toLowerCase() &&
            inv.numero_pregunta === numeroPregunta
        );
    }, [invalidaciones]);

    // Helper combinado para verificar anulación por cualquier método
    const esAnuladaOInvalidada = useCallback((resp: RespuestaDetallada, materia: string): boolean => {
        // Método 1: Respuesta correcta es X, *, -
        if (['X', '*', '-'].includes(resp.respuesta_correcta)) return true;
        // Método 2: Está en el archivo de invalidaciones
        return esPreguntaInvalidada(resp.numero, materia);
    }, [esPreguntaInvalidada]);

    const esSinRespuesta = useCallback((resp: RespuestaDetallada): boolean => {
        return classifyAnswer(resp) === 'sin_respuesta';
    }, []);

    const esSesionNoPresentada = useCallback((resp: RespuestaDetallada): boolean => {
        return classifyAnswer(resp) === 'sesion_no_presentada';
    }, []);

    const respuestasMateria = useMemo(() => {
        if (!estudiante?.respuestas_detalladas) return [];
        return normalizeRespuestas(estudiante.respuestas_detalladas[materiaSeleccionada]);
    }, [estudiante, materiaSeleccionada]);

    // Sesión incompleta detection
    const sesionesRegistradas = useMemo(() => {
        if (!estudiante) return [] as string[];
        return (estudiante as any).secciones_completadas || (estudiante as any).sesiones || [];
    }, [estudiante]);
    const tieneSesionS1 = sesionesRegistradas.includes('S1');
    const tieneSesionS2 = sesionesRegistradas.includes('S2');
    const isSesionIncompleta = !tieneSesionS1 || !tieneSesionS2;

    // Estadísticas globales por pregunta desde datos pre-calculados (1 Firestore read)
    const metricasPreguntas = useMemo(() => {
        const stats: Record<number, { A: number, B: number, C: number, D: number, Total: number, correctas: number, correcta: string, distEsPorcentaje: boolean, [key: string]: any }> = {};
        if (!groupStatistics) return stats;

        const materiaStats = groupStatistics.materias?.[materiaSeleccionada];
        if (!materiaStats) return stats;

        Object.entries(materiaStats).forEach(([key, pregunta]) => {
            const num = pregunta.numero || parseInt(key, 10);
            if (isNaN(num)) return;
            const dist = pregunta.distribucion || {};

            // Soportar ambas convenciones de nombre de campo
            const totalEvaluados = pregunta.total_evaluados || pregunta.total_respuestas || 0;
            const pctAcierto = pregunta.porcentaje_acierto ?? pregunta.porcentaje_aciertos ?? 0;

            // Detectar si la distribución viene en porcentajes o conteos absolutos.
            // procesar_simulacro.py guarda porcentajes (suman ~100),
            // generar_estadisticas.py guarda conteos absolutos (suman ~totalEvaluados).
            const distSum = Object.values(dist).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
            // Si la suma está entre 90-110 y hay al menos 2 opciones, probablemente son porcentajes
            const distEsPorcentaje = distSum > 0 && distSum <= 110 && distSum >= 90 && Object.keys(dist).length >= 2;

            // Calcular total real de evaluados
            let total = totalEvaluados;
            if (!total && !distEsPorcentaje) {
                // Fallback: sumar conteos de la distribución
                total = distSum;
            }
            if (!total) total = totalEvaluados || 1; // último fallback

            // Calcular correctas desde porcentaje_acierto
            const correctas = total > 0 && !isNaN(pctAcierto)
                ? Math.round((pctAcierto / 100) * total)
                : (pregunta.aciertos || 0);

            // Guardar distribución: si es porcentaje, guardar como está (la UI lo usará directamente)
            // Si es conteo, guardar el conteo (la UI calculará el porcentaje)
            const entry: any = {
                A: dist.A || 0,
                B: dist.B || 0,
                C: dist.C || 0,
                D: dist.D || 0,
                Total: total,
                correctas,
                correcta: pregunta.respuesta_correcta || '',
                distEsPorcentaje,
                pctAcierto, // guardar para la barra de dificultad
            };
            // Preservar opciones extra (E, F, G, etc.) de Inglés
            for (const k of Object.keys(dist)) {
                if (!['A','B','C','D','NR'].includes(k)) {
                    entry[k] = dist[k] || 0;
                }
            }
            stats[num] = entry;
        });

        return stats;
    }, [groupStatistics, materiaSeleccionada]);

    // Estadísticas del estudiante
    const estadisticas = useMemo(() => {
        if (!respuestasMateria.length) return { correctas: 0, incorrectas: 0, total: 0, porcentaje: 0 };
        const correctas = respuestasMateria.filter(r => r.es_correcta).length;
        const total = respuestasMateria.length;
        return {
            correctas,
            incorrectas: total - correctas,
            total,
            porcentaje: Math.round((correctas / total) * 100)
        };
    }, [respuestasMateria]);

    // Promedio del grupo desde estadísticas pre-calculadas
    const promedioGrupo = useMemo(() => {
        if (!groupStatistics) return 0;
        const materiaStats = groupStatistics.materias?.[materiaSeleccionada];
        if (!materiaStats) return 0;

        const preguntas = Object.values(materiaStats);
        if (!preguntas.length) return 0;
        const sumaPorcentajes = preguntas.reduce((acc, p) => acc + (p.porcentaje_acierto || 0), 0);
        return Math.round(sumaPorcentajes / preguntas.length);
    }, [groupStatistics, materiaSeleccionada]);

    // Análisis de fortalezas y debilidades - con listas completas
    const analisisPersonal = useMemo(() => {
        if (!respuestasMateria.length || !Object.keys(metricasPreguntas).length) return null;

        const falladas = respuestasMateria.filter(r => !r.es_correcta && !['X', '*', '-'].includes(r.respuesta_correcta) && !esPreguntaInvalidada(r.numero, materiaSeleccionada));
        const acertadas = respuestasMateria.filter(r => r.es_correcta);

        // Lista completa de logros (acertadas difíciles) ordenadas por dificultad ascendente
        const logros = acertadas
            .map(r => {
                const stats = metricasPreguntas[r.numero];
                const pctGrupo = stats && stats.Total > 0 ? Math.round((stats.correctas / stats.Total) * 100) : 50;
                return { ...r, pctGrupo };
            })
            .filter(r => r.pctGrupo < 60) // Solo las que menos del 60% acertó
            .sort((a, b) => a.pctGrupo - b.pctGrupo); // Más difíciles primero

        // Lista completa para repasar (falladas fáciles) ordenadas por dificultad descendente
        const paraRepasar = falladas
            .map(r => {
                const stats = metricasPreguntas[r.numero];
                const pctGrupo = stats && stats.Total > 0 ? Math.round((stats.correctas / stats.Total) * 100) : 50;
                return { ...r, pctGrupo };
            })
            .sort((a, b) => b.pctGrupo - a.pctGrupo); // Más fáciles primero (las que más debiste acertar)

        return {
            logros,
            paraRepasar,
            totalFalladas: falladas.length,
            totalAcertadas: acertadas.length
        };
    }, [respuestasMateria, metricasPreguntas, esPreguntaInvalidada, materiaSeleccionada]);

    const analisisTemas = useMemo(() => {
        const fechaObjetivo = toMetaDate(metaFechaISO);
        const hoy = new Date();
        const msDia = 1000 * 60 * 60 * 24;
        const diasDisponibles = Math.max(0, Math.ceil((fechaObjetivo.getTime() - hoy.getTime()) / msDia));
        const respuestasValidas = respuestasMateria.filter((r) => !esAnuladaOInvalidada(r, materiaSeleccionada));
        const totalPreguntasValidas = respuestasValidas.length;
        const totalErrores = respuestasValidas.filter((r) => !r.es_correcta).length;
        const temasMap: Record<string, { total: number; aciertos: number; errores: number }> = {};
        for (const r of respuestasValidas) {
            // Para mantener consistencia con marcos ICFES, usamos un foco principal por pregunta.
            const temaProcesado = obtenerTemaProcesadoRespuesta(materiaSeleccionada, r);
            const temas = temaProcesado ? [temaProcesado] : [];
            if (!temas.length) continue;
            for (const tema of temas) {
                const temaNormalizado = normalizarTemaConIA(materiaSeleccionada, tema);
                if (!temasMap[temaNormalizado]) temasMap[temaNormalizado] = { total: 0, aciertos: 0, errores: 0 };
                temasMap[temaNormalizado].total += 1;
                if (r.es_correcta) temasMap[temaNormalizado].aciertos += 1;
                else temasMap[temaNormalizado].errores += 1;
            }
        }

        const temas = Object.entries(temasMap).map(([tema, v]) => {
            const porcentaje = v.total > 0 ? Math.round((v.aciertos / v.total) * 100) : 0;
            const score = (v.errores * 3) + Math.max(0, 2 - v.aciertos);
            const evidencia = v.total >= 3 ? 'fuerte' : v.total === 2 ? 'media' : 'baja';
            return { tema, ...v, porcentaje, score, evidencia };
        });

        temas.sort((a, b) => b.score - a.score || a.porcentaje - b.porcentaje);
        const aReforzar = temas.filter(t => t.errores > 0).slice(0, 4);
        const dominados = temas.filter(t => t.total >= 2 && t.porcentaje >= 70).slice(0, 4);
        const tasaError = totalPreguntasValidas > 0 ? totalErrores / totalPreguntasValidas : 0;

        const plan7Dias = aReforzar.slice(0, 7).map((t, idx) => ({
            dia: idx + 1,
            foco: t.tema,
            accion: generarAccionIA(
                materiaSeleccionada,
                t.tema,
                t.score >= 5 ? 'alta' : t.score >= 3 ? 'media' : 'baja'
            )
        }));

        const recomendacionesIA = aReforzar.slice(0, 3).map((t) => {
            const prioridad = t.score >= 5 ? 'alta' : t.score >= 3 ? 'media' : 'baja';
            return {
                tema: t.tema,
                prioridad,
                mensaje: generarAccionIA(materiaSeleccionada, t.tema, prioridad as 'alta' | 'media' | 'baja'),
                confianza: t.total >= 3 ? 'alta' : t.total === 2 ? 'media' : 'baja'
            };
        });

        const verboMateria = materiaSeleccionada === 'lectura crítica'
            ? 'justificar'
            : materiaSeleccionada === 'matemáticas'
                ? 'resolver'
                : materiaSeleccionada === 'sociales y ciudadanas'
                    ? 'argumentar'
                    : materiaSeleccionada === 'ciencias naturales'
                        ? 'explicar'
                        : materiaSeleccionada === 'inglés'
                            ? 'identificar'
                            : 'aplicar';

        const rubricas = aReforzar.slice(0, 3).map((t, idx) => {
            const precision = Math.max(0, Math.min(100, t.porcentaje));
            const estado = precision >= 70 ? 'En consolidación' : precision >= 40 ? 'Base parcial' : 'Requiere refuerzo';
            const metaAcierto = t.evidencia === 'baja' ? 80 : 75;
            return {
                id: `${idx + 1}-${t.tema}`,
                tema: t.tema,
                criterio: `Demostrar que puedes ${verboMateria} ${t.tema} en preguntas tipo ICFES.`,
                estado,
                estadoPct: precision,
                meta: `Alcanzar al menos ${metaAcierto}% en práctica corta del tema.`,
                evidencia: `${t.porcentaje}% de acierto en ${t.total} pregunta${t.total === 1 ? '' : 's'} (${t.evidencia}).`,
                checklist: [
                    'Explicar el concepto sin mirar apuntes.',
                    'Resolver una pregunta fácil y una media sin ayuda.',
                    'Escribir por qué la respuesta correcta vence a los distractores.'
                ]
            };
        });

        const prioridadOrden: Record<string, number> = { alta: 3, media: 2, baja: 1 };
        const planBackendRaw = (
            (estudiante?.plan_estudio_sugerido_icfes && estudiante.plan_estudio_sugerido_icfes.length > 0)
                ? estudiante.plan_estudio_sugerido_icfes
                : (estudiante?.plan_estudio_sugerido || [])
        );
        const planBackend = planBackendRaw
            .filter((p) => p.materia === materiaSeleccionada)
            .sort((a, b) => (prioridadOrden[b.prioridad || 'media'] || 0) - (prioridadOrden[a.prioridad || 'media'] || 0))
            .slice(0, 7)
            .map((p, idx) => ({
                dia: idx + 1,
                foco: p.tema,
                accion: `${p.recomendacion || generarAccionIA(materiaSeleccionada, p.tema, 'media')}${p.bloque ? ` (${p.bloque})` : ''}`
            }));

        const semanasDisponibles = Math.max(1, Math.ceil(diasDisponibles / 7));
        const factorIntensidad = intensidadPlan === 'ligero' ? 0.8 : intensidadPlan === 'intensivo' ? 1.25 : 1;
        const brechaPriorizada = aReforzar.reduce((acc, t) => {
            const deficit = (100 - t.porcentaje) / 100;
            const pesoEvidencia = t.total >= 3 ? 1 : t.total === 2 ? 0.8 : 0.6;
            return acc + (deficit * pesoEvidencia);
        }, 0);

        // Plan basado en datos reales del estudiante:
        // errores reales + brecha de dominio por tema + número de focos activos.
        const horasTotalesBase = (totalErrores * 0.9) + (brechaPriorizada * 3.2) + (aReforzar.length * 0.6);
        const minHorasTotales = Math.max(6, semanasDisponibles * 3.5);
        const maxHorasTotales = Math.max(10, semanasDisponibles * 14);
        const horasTotales = Math.round(
            Math.max(minHorasTotales, Math.min(maxHorasTotales, horasTotalesBase * factorIntensidad)) * 10
        ) / 10;
        const horasSemana = Math.round((horasTotales / semanasDisponibles) * 10) / 10;
        const diasEstudio = Math.max(1, Math.min(diasDisponibles || 1, Math.round(semanasDisponibles * 5.5)));
        const horasDiaRaw = diasEstudio > 0 ? (horasTotales / diasEstudio) : 0;
        const horasDia = Math.min(12, Math.round(horasDiaRaw * 10) / 10);

        return {
            disponible: temas.length > 0,
            temas,
            aReforzar,
            dominados,
            plan7Dias: planBackend.length ? planBackend : plan7Dias,
            recomendacionesIA,
            rubricas,
            resumenPlan: {
                fechaObjetivo: formatMetaDate(metaFechaISO),
                diasDisponibles,
                diasEstudio,
                semanasDisponibles,
                horasSemana,
                horasTotales,
                horasDia,
                tasaError: Math.round(tasaError * 100),
                totalErrores,
                intensidad: intensidadPlan
            }
        };
    }, [respuestasMateria, esAnuladaOInvalidada, materiaSeleccionada, estudiante, intensidadPlan, metaFechaISO]);

    const planGlobal = useMemo(() => {
        const hoy = new Date();
        const fechaObjetivo = toMetaDate(metaFechaISO);
        const msDia = 1000 * 60 * 60 * 24;
        const materiasBase = materias.map((m) => m.key).filter((k) => k !== 'plan');
        const factorIntensidad = intensidadPlan === 'ligero' ? 0.85 : intensidadPlan === 'intensivo' ? 1.2 : 1;

        type TemaGlobal = {
            materia: string;
            tema: string;
            total: number;
            aciertos: number;
            errores: number;
            porcentaje: number;
            prioridad: 'alta' | 'media' | 'baja';
            score: number;
        };

        const temasMap: Record<string, TemaGlobal> = {};
        for (const materia of materiasBase) {
            const raw = estudiante?.respuestas_detalladas?.[materia];
            const respuestas = normalizeRespuestas(raw || []);
            for (const r of respuestas) {
                if (esAnuladaOInvalidada(r, materia)) continue;
                const tema = obtenerTemaProcesadoRespuesta(materia, r, usarFallbackMarco);
                if (!tema) continue;

                const key = `${materia}__${tema.toLowerCase()}`;
                if (!temasMap[key]) {
                    temasMap[key] = {
                        materia,
                        tema,
                        total: 0,
                        aciertos: 0,
                        errores: 0,
                        porcentaje: 0,
                        prioridad: 'baja',
                        score: 0
                    };
                }
                temasMap[key].total += 1;
                if (r.es_correcta) temasMap[key].aciertos += 1;
                else temasMap[key].errores += 1;
            }
        }

        const temas = Object.values(temasMap).map((t) => {
            const porcentaje = t.total > 0 ? Math.round((t.aciertos / t.total) * 100) : 0;
            const brecha = 100 - porcentaje;
            const score = (t.errores * 3) + (brecha / 20) + Math.max(0, 2 - t.aciertos);
            const prioridad: 'alta' | 'media' | 'baja' = score >= 5 ? 'alta' : score >= 3 ? 'media' : 'baja';
            return { ...t, porcentaje, score, prioridad };
        });

        const focosBase = temas
            .filter((t) => t.errores > 0)
            .sort((a, b) => b.score - a.score || a.porcentaje - b.porcentaje);
        const indiceManual = new Map(prioridadesManual.map((key, idx) => [key, idx]));
        const focoKey = (f: { materia: string; tema: string }) => `${f.materia}__${f.tema}`.toLowerCase();
        const focos = focosBase.sort((a, b) => {
            const ai = indiceManual.get(focoKey(a));
            const bi = indiceManual.get(focoKey(b));
            if (ai !== undefined && bi !== undefined) return ai - bi;
            if (ai !== undefined) return -1;
            if (bi !== undefined) return 1;
            return b.score - a.score || a.porcentaje - b.porcentaje;
        });

        const diasUrgencia = Math.max(1, Math.ceil((fechaObjetivo.getTime() - hoy.getTime()) / msDia));
        const capacidadTemas = diasUrgencia <= 14 ? 3 : diasUrgencia <= 28 ? 5 : diasUrgencia <= 42 ? 7 : 10;
        const planBaseRaw = focos.length ? focos : temas.sort((a, b) => a.porcentaje - b.porcentaje).slice(0, 10);
        const planBase = planBaseRaw.slice(0, capacidadTemas);
        const weightedFocos = planBase.flatMap((foco) => {
            const pesoScore = Math.max(1, Math.min(6, Math.round(foco.score / 2)));
            const bonusPrioridad = foco.prioridad === 'alta' ? 2 : foco.prioridad === 'media' ? 1 : 0;
            const repeticiones = Math.max(1, Math.min(7, pesoScore + bonusPrioridad));
            return Array.from({ length: repeticiones }, () => foco);
        });
        const secuenciaFocos = weightedFocos.length ? weightedFocos : planBase;
        const diasHastaObjetivoReal = Math.max(
            1,
            Math.ceil((fechaObjetivo.getTime() - hoy.getTime()) / msDia)
        );
        const diasHastaObjetivo = Math.max(1, Math.min(diasHastaObjetivoReal, weeksAvailable * 7));
        const ciclosRepaso = 5;
        const sesiones: Array<{
            fecha: Date;
            key: string;
            materia: string;
            tema: string;
            repaso: number;
            prioridad: 'alta' | 'media' | 'baja';
            minutos: number;
        }> = [];

        if (planBase.length > 0) {
            // Plan realista: varios eventos por día con presupuesto de horas configurable.
            const maxEventosDiaBase = Math.max(1, Math.min(6, eventosPorDia));
            const idNumerico = Number(String(estudiante?.informacion_personal?.numero_identificacion || '0').slice(-2)) || 0;
            let cursor = secuenciaFocos.length > 0 ? (idNumerico % secuenciaFocos.length) : 0;
            let ultimoTemaKey = '';
            for (let dayIdx = 0; dayIdx < diasHastaObjetivo; dayIdx += 1) {
                const fecha = new Date(hoy.getTime() + dayIdx * msDia);
                if (fecha > fechaObjetivo) break;
                const dateKey = fecha.toISOString().slice(0, 10);
                if (busyDates.includes(dateKey)) continue;
                const dayKey = dayKeyFromDate(fecha);
                const horasDisponiblesDia = Math.max(0, Number(dailyAvailability[dayKey] || 0));
                if (horasDisponiblesDia <= 0) continue;
                // Sincronía fuerte:
                // el objetivo diario manda y la disponibilidad solo actúa como techo.
                const totalSemanalDisponible = Math.max(0.5, sumDisponibilidadSemana(dailyAvailability));
                const horasPlanDia = Math.max(
                    0.5,
                    Math.min(
                        horasDisponiblesDia,
                        (horasObjetivoSemana * (horasDisponiblesDia / totalSemanalDisponible))
                    )
                );
                const minutosObjetivoDia = Math.max(30, Math.min(10 * 60, Math.round(horasPlanDia * 60)));
                const eventosCompatiblesConHoras = calcularEventosPorHoras(horasPlanDia, intensidadPlan);
                const maxEventosDia = Math.max(
                    1,
                    Math.min(6, Math.min(maxEventosDiaBase, eventosCompatiblesConHoras))
                );
                let minutosRestantes = minutosObjetivoDia;
                for (let slot = 0; slot < maxEventosDia && minutosRestantes >= 20; slot += 1) {
                    if (!secuenciaFocos.length) break;
                    let foco = secuenciaFocos[cursor % secuenciaFocos.length];
                    let temaKey = `${foco.materia}__${foco.tema}`.toLowerCase();
                    if (temaKey === ultimoTemaKey && secuenciaFocos.length > 1) {
                        cursor += 1;
                        foco = secuenciaFocos[cursor % secuenciaFocos.length];
                        temaKey = `${foco.materia}__${foco.tema}`.toLowerCase();
                    }
                    const vuelta = Math.floor(cursor / secuenciaFocos.length);
                    const repaso = (vuelta % ciclosRepaso) + 1;
                    const minutosBase = foco.prioridad === 'alta' ? 55 : foco.prioridad === 'media' ? 40 : 30;
                    const factorRepaso = repaso === 1 ? 1 : 0.8;
                    const minutosPlan = Math.max(20, Math.round(minutosBase * factorIntensidad * factorRepaso));
                    const minutos = Math.max(20, Math.min(minutosPlan, minutosRestantes));
                    sesiones.push({
                        fecha,
                        key: `${foco.materia}-${foco.tema}-${dayIdx}-${slot}`,
                        materia: foco.materia,
                        tema: foco.tema,
                        repaso,
                        prioridad: foco.prioridad,
                        minutos
                    });
                    minutosRestantes -= minutos;
                    ultimoTemaKey = temaKey;
                    cursor += 1;
                }
            }
        }

        const diasPlanMap: Record<string, { key: string; fecha: Date; items: typeof sesiones; minutosTotales: number }> = {};
        for (const s of sesiones) {
            const key = s.fecha.toISOString().slice(0, 10);
            if (!diasPlanMap[key]) {
                diasPlanMap[key] = {
                    key,
                    fecha: new Date(`${key}T12:00:00`),
                    items: [],
                    minutosTotales: 0
                };
            }
            diasPlanMap[key].items.push(s);
            diasPlanMap[key].minutosTotales += s.minutos;
        }
        const diasPlan = Object.values(diasPlanMap)
            .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

        const semanas: Array<{ idx: number; desde: Date; hasta: Date; dias: typeof diasPlan }> = [];
        if (diasPlan.length > 0) {
            let i = 0;
            while (i < diasPlan.length) {
                const desde = diasPlan[i].fecha;
                const hasta = new Date(desde.getTime() + (6 * msDia));
                const diasSemana: typeof diasPlan = [];
                while (i < diasPlan.length && diasPlan[i].fecha <= hasta) {
                    diasSemana.push(diasPlan[i]);
                    i += 1;
                }
                semanas.push({ idx: semanas.length + 1, desde, hasta, dias: diasSemana });
            }
        }

        const horasTotales = Math.round((sesiones.reduce((acc, s) => acc + s.minutos, 0) / 60) * 10) / 10;
        const diasHastaMeta = diasHastaObjetivo;
        const diasProgramados = Math.max(1, diasPlan.length);
        const horasDiaPromedio = Math.round(((horasTotales / diasHastaMeta) * 10)) / 10;
        const horasDiaProgramado = Math.min(12, Math.round(((horasTotales / diasProgramados) * 10)) / 10);

        return {
            disponible: sesiones.length > 0,
            focos: planBase,
            sesiones,
            diasPlan,
            semanas,
            resumen: {
                fechaObjetivo: formatMetaDate(metaFechaISO),
                diasHastaMeta,
                diasConEstudio: diasPlan.length,
                sesionesTotales: sesiones.length,
                horasTotales,
                horasDiaPromedio,
                horasDiaProgramado,
                horasObjetivoDia: Math.round(horasObjetivoDia * 10) / 10,
                eventosPorDia: Math.max(1, Math.min(6, eventosPorDia))
            }
        };
    }, [estudiante, intensidadPlan, esAnuladaOInvalidada, usarFallbackMarco, horasObjetivoSemana, horasObjetivoDia, eventosPorDia, weeksAvailable, dailyAvailability, busyDates, metaFechaISO, prioridadesManual]);

    const planCacheScope = useMemo(() => {
        const studentId = estudiante?.informacion_personal?.numero_identificacion || 'anon';
        const simulationId = simulacroActivo || 'sin-simulacro';
        return `${simulationId}::${studentId}`;
    }, [estudiante, simulacroActivo]);
    const focoPriorityKey = useCallback((foco: { materia: string; tema: string }) => `${foco.materia}__${foco.tema}`.toLowerCase(), []);
    const focosOrdenados = useMemo(() => {
        if (!planGlobal.focos.length) return [];
        const indexByKey = new Map(prioridadesManual.map((key, idx) => [key, idx]));
        return [...planGlobal.focos].sort((a, b) => {
            const ai = indexByKey.get(focoPriorityKey(a));
            const bi = indexByKey.get(focoPriorityKey(b));
            if (ai !== undefined && bi !== undefined) return ai - bi;
            if (ai !== undefined) return -1;
            if (bi !== undefined) return 1;
            return b.score - a.score || a.porcentaje - b.porcentaje;
        });
    }, [planGlobal.focos, prioridadesManual, focoPriorityKey]);
    const cargaPorMateria = useMemo(() => {
        const total = planGlobal.sesiones.reduce((acc, s) => acc + s.minutos, 0);
        if (!total) return [];
        const mapa = new Map<string, number>();
        for (const s of planGlobal.sesiones) {
            mapa.set(s.materia, (mapa.get(s.materia) || 0) + s.minutos);
        }
        return Array.from(mapa.entries())
            .map(([materia, minutos]) => ({
                materia,
                minutos,
                horas: Math.round((minutos / 60) * 10) / 10,
                pct: Math.round((minutos / total) * 100)
            }))
            .sort((a, b) => b.minutos - a.minutos);
    }, [planGlobal.sesiones]);
    const prioridadesModalFiltradas = useMemo(() => {
        const q = filtroPrioridadesTexto.trim().toLowerCase();
        return focosOrdenados.filter((foco) => {
            if (filtroPrioridadesNivel !== 'todas' && foco.prioridad !== filtroPrioridadesNivel) return false;
            if (filtroPrioridadesMateria !== 'todas' && foco.materia !== filtroPrioridadesMateria) return false;
            if (!q) return true;
            const label = (MATERIA_VISUAL[foco.materia]?.label || foco.materia).toLowerCase();
            return foco.tema.toLowerCase().includes(q) || label.includes(q);
        });
    }, [focosOrdenados, filtroPrioridadesTexto, filtroPrioridadesMateria, filtroPrioridadesNivel]);
    const onboardingPlanStorageKey = `${PLAN_ONBOARDING_CACHE_KEY}:${planCacheScope}`;

    const plannerPayload = useMemo<PlannerCustomizationPayload>(() => ({
        targetDateISO: metaFechaISO,
        weeksAvailable,
        dailyAvailability,
        busyDates,
        customEventsPerDay: eventosPorDia,
        horasObjetivoSemana,
        horasObjetivoDia,
        sessionStates: sesionesEstado,
        updatedAt: Date.now(),
        source: 'local'
    }), [metaFechaISO, weeksAvailable, dailyAvailability, busyDates, eventosPorDia, horasObjetivoSemana, horasObjetivoDia, sesionesEstado]);

    useEffect(() => {
        const studentId = estudiante?.informacion_personal?.numero_identificacion;
        if (!studentId || !simulacroActivo) return;
        let cancel = false;
        (async () => {
            try {
                const { getPlannerCustomization, getPlannerUploadQuota } =
                    await resolveEstudianteDataModule();
                const merged = await getPlannerCustomization(studentId, simulacroActivo);
                if (!cancel && merged.merged) {
                    const cfg = merged.merged;
                    if (cfg.targetDateISO) setMetaFechaISO(cfg.targetDateISO);
                    setWeeksAvailable(Math.max(1, Math.min(24, Number(cfg.weeksAvailable || 12))));
                    const mergedDaily = ({ ...dailyAvailability, ...(cfg.dailyAvailability || {}) }) as Record<DayKey, number>;
                    setDailyAvailability(mergedDaily);
                    setBusyDates(Array.isArray(cfg.busyDates) ? cfg.busyDates.slice(0, 120) : []);
                    setEventosPorDia(clampEventosPorDia(Number(cfg.customEventsPerDay || 2)));
                    const horasDiaCfg = Math.max(0.5, Math.min(8, Number(cfg.horasObjetivoDia || 2.5)));
                    const diasActivos = Math.max(1, Object.values(mergedDaily).filter((h) => Number(h || 0) > 0).length);
                    const capacidadSemanalCfg = Math.max(4, Math.min(56, Math.round(sumDisponibilidadSemana(mergedDaily) * 10) / 10));
                    const horasSemanaCfg = Math.max(
                        4,
                        Math.min(capacidadSemanalCfg, Number(cfg.horasObjetivoSemana || (horasDiaCfg * diasActivos)))
                    );
                    setHorasObjetivoSemana(Math.round(horasSemanaCfg * 10) / 10);
                    setHorasObjetivoDia(horasDiaCfg);
                    setSesionesEstado((cfg.sessionStates || {}) as Record<string, EstadoSesionPlan>);
                }
                const quota = await getPlannerUploadQuota(studentId);
                if (!cancel) {
                    setCloudQuota({
                        remaining: quota.remaining,
                        used: quota.uploadsUsed,
                        limit: quota.uploadsLimit,
                        dateKey: quota.dateKey
                    });
                }
            } catch (err) {
                console.warn('[Planner] merge load failed:', err);
            }
        })();
        return () => { cancel = true; };
    }, [estudiante?.informacion_personal?.numero_identificacion, simulacroActivo]);

    useEffect(() => {
        const studentId = estudiante?.informacion_personal?.numero_identificacion;
        if (!studentId || !simulacroActivo) return;
        void (async () => {
            const { savePlannerCustomizationLocal } = await resolveEstudianteDataModule();
            savePlannerCustomizationLocal(studentId, simulacroActivo, plannerPayload, 'simulation');
        })();
        const localKey = `${PLAN_PERSONALIZACION_CACHE_KEY}:${planCacheScope}`;
        localStorage.setItem(localKey, JSON.stringify({
            expiresAt: PLAN_CACHE_EXPIRY_MS,
            payload: plannerPayload
        }));
        if (!plannerHydratedRef.current) {
            plannerHydratedRef.current = true;
            return;
        }
        setMostrarToastGuardado(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setMostrarToastGuardado(false), 1700);
    }, [plannerPayload, estudiante?.informacion_personal?.numero_identificacion, simulacroActivo, planCacheScope]);

    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || !planCacheScope) return;
        const raw = localStorage.getItem(onboardingPlanStorageKey);
        if (!raw) {
            setMostrarOnboardingPlan(true);
            return;
        }
        try {
            const parsed = JSON.parse(raw) as { seen?: boolean; expiresAt?: number };
            const vigente = typeof parsed?.expiresAt === 'number' ? parsed.expiresAt > Date.now() : true;
            setMostrarOnboardingPlan(!(parsed?.seen && vigente));
        } catch {
            setMostrarOnboardingPlan(true);
        }
    }, [onboardingPlanStorageKey, planCacheScope]);

    const resumenModalStorageKey = `${PLAN_RESUMEN_MODAL_CACHE_KEY}:${planCacheScope}`;
    const checklistStorageKey = `${PLAN_CHECKLIST_CACHE_KEY}:${planCacheScope}`;

    const persistChecklistState = useCallback((next: Record<string, EstadoSesionPlan>) => {
        if (typeof window === 'undefined') return;
        const now = Date.now();
        if (now >= PLAN_CACHE_EXPIRY_MS) {
            localStorage.removeItem(checklistStorageKey);
            return;
        }
        localStorage.setItem(checklistStorageKey, JSON.stringify({
            expiresAt: PLAN_CACHE_EXPIRY_MS,
            checked: next
        }));
    }, [checklistStorageKey]);

    const obtenerEstadoSesion = useCallback((key: string): EstadoSesionPlan => {
        return sesionesEstado[key] || 'pendiente';
    }, [sesionesEstado]);

    const marcarSesionComoHecha = useCallback((key: string) => {
        setSesionesEstado((prev) => {
            const estadoActual = prev[key] || 'pendiente';
            const estadoSiguiente: EstadoSesionPlan = estadoActual === 'estudiado' ? 'pendiente' : 'estudiado';
            const next = { ...prev, [key]: estadoSiguiente };
            persistChecklistState(next);
            return next;
        });
    }, [persistChecklistState]);

    const setSesionEstado = useCallback((key: string, estado: EstadoSesionPlan) => {
        setSesionesEstado((prev) => {
            const actual = prev[key] || 'pendiente';
            if (actual === estado) return prev;
            const next = { ...prev, [key]: estado };
            persistChecklistState(next);
            return next;
        });
    }, [persistChecklistState]);
    useEffect(() => {
        const validas = new Set(planGlobal.focos.map(focoPriorityKey));
        setPrioridadesManual((prev) => {
            const filtered = prev.filter((k) => validas.has(k));
            if (filtered.length === prev.length && filtered.every((k, idx) => k === prev[idx])) {
                return prev;
            }
            return filtered;
        });
    }, [planGlobal.focos, focoPriorityKey]);

    const moverPrioridad = useCallback((fromKey: string, toKey: string) => {
        if (!fromKey || !toKey || fromKey === toKey) return;
        const clavesActuales = planGlobal.focos.map(focoPriorityKey);
        setPrioridadesManual((prev) => {
            const base = Array.from(new Set([
                ...prev.filter((k) => clavesActuales.includes(k)),
                ...clavesActuales.filter((k) => !prev.includes(k))
            ]));
            const fromIdx = base.indexOf(fromKey);
            const toIdx = base.indexOf(toKey);
            if (fromIdx < 0 || toIdx < 0) return base;
            const next = [...base];
            const [dragged] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, dragged);
            return next;
        });
    }, [planGlobal.focos, focoPriorityKey]);

    const abrirModalSubida = useCallback(async () => {
        const studentId = estudiante?.informacion_personal?.numero_identificacion;
        if (!studentId) return;
        const { getPlannerUploadQuota } = await resolveEstudianteDataModule();
        const quota = await getPlannerUploadQuota(studentId);
        setCloudQuota({
            remaining: quota.remaining,
            used: quota.uploadsUsed,
            limit: quota.uploadsLimit,
            dateKey: quota.dateKey
        });
        setShowUploadModal(true);
    }, [estudiante?.informacion_personal?.numero_identificacion]);

    const confirmarSubidaNube = useCallback(async (scope: 'global' | 'simulation') => {
        const studentId = estudiante?.informacion_personal?.numero_identificacion;
        if (!studentId || !simulacroActivo) return;
        setUploadingPlan(true);
        try {
            const { uploadPlannerCustomization } = await resolveEstudianteDataModule();
            const result = await uploadPlannerCustomization(studentId, simulacroActivo, plannerPayload, scope);
            setCloudQuota({
                remaining: result.quota.remaining,
                used: result.quota.uploadsUsed,
                limit: result.quota.uploadsLimit,
                dateKey: result.quota.dateKey
            });
            if (result.ok) setShowUploadModal(false);
        } finally {
            setUploadingPlan(false);
        }
    }, [estudiante?.informacion_personal?.numero_identificacion, simulacroActivo, plannerPayload]);

    const cerrarOnboardingPlan = useCallback(() => {
        setMostrarOnboardingPlan(false);
        if (typeof window === 'undefined') return;
        localStorage.setItem(onboardingPlanStorageKey, JSON.stringify({
            seen: true,
            expiresAt: PLAN_CACHE_EXPIRY_MS
        }));
    }, [onboardingPlanStorageKey]);

    const cerrarResumenDiagnosticoModal = useCallback(() => {
        setMostrarResumenDiagnosticoModal(false);
        if (typeof window === 'undefined') return;
        const now = Date.now();
        if (now >= PLAN_CACHE_EXPIRY_MS) {
            localStorage.removeItem(resumenModalStorageKey);
            return;
        }
        localStorage.setItem(resumenModalStorageKey, JSON.stringify({
            seen: true,
            expiresAt: PLAN_CACHE_EXPIRY_MS
        }));
    }, [resumenModalStorageKey]);

    useEffect(() => {
        if (typeof window === 'undefined' || !planGlobal.disponible) return;
        const now = Date.now();

        const modalRaw = localStorage.getItem(resumenModalStorageKey);
        let debeMostrarResumen = true;
        if (modalRaw) {
            try {
                const modalData = JSON.parse(modalRaw) as { seen?: boolean; expiresAt?: number };
                const vigente = typeof modalData?.expiresAt === 'number' && modalData.expiresAt > now;
                if (vigente && modalData?.seen) {
                    debeMostrarResumen = false;
                } else if (!vigente) {
                    localStorage.removeItem(resumenModalStorageKey);
                }
            } catch {
                localStorage.removeItem(resumenModalStorageKey);
            }
        }
        setMostrarResumenDiagnosticoModal(debeMostrarResumen);

        const validSessionKeys = new Set(planGlobal.sesiones.map((s) => s.key));
        const checklistRaw = localStorage.getItem(checklistStorageKey);
        if (!checklistRaw) {
            setSesionesEstado({});
            return;
        }
        try {
            const checklistData = JSON.parse(checklistRaw) as { expiresAt?: number; checked?: Record<string, boolean | EstadoSesionPlan> };
            const vigente = typeof checklistData?.expiresAt === 'number' && checklistData.expiresAt > now;
            if (!vigente) {
                localStorage.removeItem(checklistStorageKey);
                setSesionesEstado({});
                return;
            }
            const checkedRaw = checklistData?.checked || {};
            const filtered = Object.entries(checkedRaw).reduce<Record<string, EstadoSesionPlan>>((acc, [key, value]) => {
                if (!validSessionKeys.has(key)) return acc;
                if (value === true) {
                    acc[key] = 'estudiado';
                    return acc;
                }
                if (value === 'pendiente' || value === 'estudiado' || value === 'repasar') {
                    acc[key] = value;
                }
                return acc;
            }, {});
            setSesionesEstado(filtered);
        } catch {
            localStorage.removeItem(checklistStorageKey);
            setSesionesEstado({});
        }
    }, [planGlobal.disponible, planGlobal.sesiones, resumenModalStorageKey, checklistStorageKey]);

    const progresoJugador = useMemo(() => {
        const total = planGlobal.sesiones.length;
        const estudiado = Object.values(sesionesEstado).filter((v) => v === 'estudiado').length;
        const repasar = Object.values(sesionesEstado).filter((v) => v === 'repasar').length;
        const pendiente = Math.max(0, total - estudiado - repasar);
        const avance = total > 0 ? (estudiado / total) : 0;

        let titulo = 'explorador disciplinado';
        let descripcion = 'vas construyendo una base consistente.';
        if (avance >= 0.85 && repasar <= Math.max(1, total * 0.15)) {
            titulo = 'maestro de repetición espaciada';
            descripcion = 'consolidas temas críticos con alta precisión.';
        } else if (avance >= 0.65) {
            titulo = 'dominador de foco académico';
            descripcion = 'mantienes ritmo alto y control de debilidades.';
        } else if (avance >= 0.4) {
            titulo = 'estratega en progreso';
            descripcion = 'ya activaste un ciclo de mejora real.';
        }

        return {
            total,
            estudiado,
            repasar,
            pendiente,
            avancePct: Math.round(avance * 100),
            titulo,
            descripcion
        };
    }, [planGlobal.sesiones.length, sesionesEstado]);

    const resumenPlanGlobal = useMemo(() => {
        const materiasBase = materias.map((m) => m.key).filter((k) => k !== 'plan');
        const basePorMateria = materiasBase.map((materia) => {
            const respuestas = normalizeRespuestas(estudiante?.respuestas_detalladas?.[materia] || []);
            const validas = respuestas.filter((resp) => !esAnuladaOInvalidada(resp, materia));
            const errores = validas.reduce((acc, resp) => acc + (resp.es_correcta ? 0 : 1), 0);
            return { materia, validas: validas.length, errores };
        });
        // Contar errores reales por pregunta (sin duplicar por múltiples temas).
        const erroresPorArea = basePorMateria
            .map(({ materia, errores }) => ({ materia, errores }))
            .filter((item) => item.errores > 0)
            .sort((a, b) => b.errores - a.errores);

        const temasNoDominados = planGlobal.focos
            .filter((foco) => foco.total >= 2 && (foco.errores > 0 || foco.porcentaje < 65))
            .slice(0, 5);

        // Solo usar recomendaciones validadas que vienen del dato procesado/subido.
        const focosWeakSet = new Set(
            temasNoDominados.map((foco) => `${foco.materia}__${foco.tema}`.toLowerCase())
        );
        const prioridadOrden: Record<string, number> = { alta: 3, media: 2, baja: 1 };
        const tutorialesSugeridos = (estudiante?.plan_estudio_sugerido || [])
            .slice()
            .sort((a, b) => (prioridadOrden[b.prioridad || 'media'] || 0) - (prioridadOrden[a.prioridad || 'media'] || 0))
            .filter((item) => {
                const temaNormalizado = normalizarTemaConIA(item.materia, item.tema);
                return focosWeakSet.has(`${item.materia}__${temaNormalizado}`.toLowerCase());
            })
            .filter((item) => typeof item.recomendacion === 'string' && item.recomendacion.trim().length > 0)
            .slice(0, 4)
            .map((item) => ({
                materia: item.materia,
                tema: item.tema,
                recomendacion: item.recomendacion as string,
                bloque: item.bloque
            }));
        const preguntasValidas = basePorMateria.reduce((acc, item) => acc + item.validas, 0);
        const erroresReales = basePorMateria.reduce((acc, item) => acc + item.errores, 0);

        return {
            erroresPorArea,
            temasNoDominados,
            tutorialesSugeridos,
            transparencia: {
                preguntasValidas,
                erroresReales,
                recomendacionesValidadas: tutorialesSugeridos.length
            }
        };
    }, [planGlobal.focos, estudiante, esAnuladaOInvalidada]);

    const resolveHeatmapStripColor = useCallback((resp: RespuestaDetallada) => {
        const esAnulada = esAnuladaOInvalidada(resp, materiaSeleccionada);
        const sesionNa = !esAnulada && esSesionNoPresentada(resp);
        const sinRespuesta = !esAnulada && esSinRespuesta(resp);
        const stats = metricasPreguntas[resp.numero];
        const dificultad = stats ? Math.round((stats.correctas / stats.Total) * 100) : 50;

        if (esAnulada) return 'bg-slate-500 border-slate-400/30';
        if (sesionNa) return 'bg-amber-500 border-amber-400/40';
        if (sinRespuesta) return 'bg-violet-500 border-violet-400/40';
        if (resp.es_correcta) return 'bg-emerald-500 border-emerald-400/30';
        if (dificultad < 40) return 'bg-amber-500 border-amber-400/30';
        return 'bg-rose-500 border-rose-400/30';
    }, [esAnuladaOInvalidada, esSesionNoPresentada, esSinRespuesta, materiaSeleccionada, metricasPreguntas]);

    const abrirPregunta = useCallback((resp: RespuestaDetallada) => {
        setPreguntaSeleccionada(resp);
        try {
            sessionStorage.setItem(`estudiante-analisis-last-q:${materiaSeleccionada}`, String(resp.numero));
        } catch { /* quota */ }
    }, [materiaSeleccionada]);

    const cerrarPregunta = useCallback(() => {
        setPreguntaSeleccionada(null);
    }, []);

    if (loading) {
        return <AnalisisSkeleton />;
    }

    if (!estudiante) {
        return (
            <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-4">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(127, 19, 236, 0.2) 0%, rgba(2, 6, 23, 0) 70%)' }}></div>
                <div className="relative z-10 w-full max-w-md">
                    <div className="rounded-3xl p-8 flex flex-col items-center text-center" style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div className="relative mb-5">
                            <div className="absolute inset-0 bg-rose-600 blur-2xl opacity-30 animate-pulse"></div>
                            <div className="relative w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                                <AlertCircle size={32} className="text-rose-400" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold mb-2">No se pudieron cargar los datos</h2>
                        <p className="text-white/50 text-sm mb-6 leading-relaxed">
                            {loadError || STUDENT_ERRORS.analysisNotFound}
                        </p>
                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={() => { setLoading(true); setLoadError(null); loadData(); }}
                                className="w-full py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20"
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={() =>
                                    navigateTo(
                                        isDemoEstudiante ? '/estudiante/dashboard' : '/estudiante/perfil',
                                    )
                                }
                                className="w-full py-3 bg-white/10 hover:bg-white/15 text-white/70 font-medium rounded-xl transition-all border border-white/10"
                            >
                                {isDemoEstudiante ? 'Volver al inicio' : 'Volver al perfil'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isDemo = typeof window !== 'undefined' && localStorage.getItem('student_id') === 'demo';

    // Demo lock screen
    if (isDemo) {
        return (
            <div className="min-h-screen bg-slate-950 text-white font-sans relative overflow-hidden flex items-center justify-center p-4">
                {/* Ambient Background Glow */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(127, 19, 236, 0.35) 0%, rgba(2, 6, 23, 0) 70%)' }}></div>

                {/* Blurred Background Content (Simulating locked dashboard) */}
                <div className="absolute inset-0 opacity-40 blur-sm pointer-events-none flex flex-col p-6 gap-4 overflow-hidden">
                    {/* Header Placeholder */}
                    <div className="flex justify-between items-center mb-4 opacity-50">
                        <div className="h-8 w-32 bg-slate-700 rounded-lg"></div>
                        <div className="h-10 w-10 bg-slate-700 rounded-full"></div>
                    </div>
                    {/* Subject tabs Placeholder */}
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-slate-800 rounded-xl px-6 py-3 border border-slate-700 flex-1"></div>
                        ))}
                    </div>
                    {/* Heatmap Placeholder */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-1 relative overflow-hidden">
                        <div className="flex justify-between mb-4">
                            <div className="h-5 w-48 bg-slate-600 rounded"></div>
                        </div>
                        <div className="flex flex-wrap gap-2 opacity-50">
                            {Array.from({ length: 30 }, (_, i) => (
                                <div key={i} className={`w-10 h-10 rounded-lg ${i % 3 === 0 ? 'bg-rose-500/30' : i % 2 === 0 ? 'bg-emerald-500/30' : 'bg-amber-500/30'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content: Premium Lock Modal */}
                <div className="relative z-10 w-full max-w-sm">
                    <div
                        className="rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden"
                        style={{
                            background: 'rgba(30, 41, 59, 0.7)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        {/* Top shine effect */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                        {/* Lock Icon */}
                        <div className="relative mb-6">
                            {/* Glow behind icon */}
                            <div className="absolute inset-0 bg-violet-600 blur-2xl opacity-40 animate-pulse"></div>
                            <div
                                className="relative w-20 h-20 rounded-2xl border border-white/10 flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, rgba(127, 19, 236, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)' }}
                            >
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="url(#lockGradientAnalisis)" strokeWidth={1.5}>
                                    <defs>
                                        <linearGradient id="lockGradientAnalisis" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#7f13ec" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Material Privado</h2>
                        <p className="text-slate-400 text-sm mb-8 font-light leading-relaxed">
                            El <span className="text-cyan-400 font-semibold">Análisis Detallado de Respuestas</span> es contenido exclusivo para estudiantes inscritos en el plan Premium.
                        </p>

                        {/* Premium features list */}
                        <div className="w-full space-y-3 mb-8 text-left pl-2">
                            {[
                                { text: 'Heatmap pregunta por pregunta' },
                                { text: 'Fortalezas y debilidades personalizadas' },
                                { text: 'Comparación vs el grupo por pregunta' },
                                { text: 'Preguntas prioritarias para repasar' },
                                { text: 'Logros en preguntas difíciles' },
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    </div>
                                    <span className="text-slate-200 text-sm font-medium">{f.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Premium CTA Section */}
                        <div className="w-full space-y-4">
                            {/* Crown badge */}
                            <div className="flex justify-center">
                                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                                    <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Plan Premium</span>
                                </div>
                            </div>

                            {/* WhatsApp CTA Button with shimmer */}
                            <a
                                href={SG_PUBLIC_LINKS.whatsappGrupo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full group"
                            >
                                <div
                                    className="relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #059669 100%)',
                                        boxShadow: '0 0 30px rgba(16, 185, 129, 0.3), 0 10px 40px -10px rgba(5, 150, 105, 0.5)',
                                    }}
                                >
                                    {/* Shimmer effect */}
                                    <div
                                        className="absolute inset-0 opacity-30"
                                        style={{
                                            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                                            backgroundSize: '200% 100%',
                                            animation: 'shimmerBtn 3s ease-in-out infinite',
                                        }}
                                    />
                                    {/* Glow ring */}
                                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: 'inset 0 0 20px rgba(255,255,255,0.15)' }} />

                                    <svg className="w-6 h-6 text-white fill-current relative z-10 flex-shrink-0" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    <div className="relative z-10 text-left">
                                        <span className="block font-extrabold text-white text-base tracking-wide">Obtener Acceso Premium</span>
                                        <span className="block text-[10px] text-emerald-100/80 font-medium">Respuesta inmediata por WhatsApp</span>
                                    </div>
                                </div>
                            </a>

                            {/* Social proof */}
                            <div className="flex items-center justify-center gap-2">
                                <div className="flex -space-x-1.5">
                                    {[
                                        'https://ui-avatars.com/api/?name=S+G&size=32&background=7c3aed&color=fff&bold=true&font-size=0.4',
                                        'https://ui-avatars.com/api/?name=M+R&size=32&background=06b6d4&color=fff&bold=true&font-size=0.4',
                                        'https://ui-avatars.com/api/?name=C+L&size=32&background=3b82f6&color=fff&bold=true&font-size=0.4',
                                    ].map((src, i) => (
                                        <img key={i} src={src} alt="" className="w-6 h-6 rounded-full border-2 border-slate-900" />
                                    ))}
                                </div>
                                <span className="text-[11px] text-slate-400 font-medium">+300 estudiantes ya se unieron</span>
                            </div>
                        </div>

                        {/* Secondary - back */}
                        <button
                            onClick={() => navigateTo('/estudiante/dashboard')}
                            className="text-sm text-slate-500 hover:text-white transition-colors py-2 px-4 rounded-lg font-medium mt-2"
                        >
                            ← Volver al Dashboard
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-4 mt-6">
                        <div className="flex items-center gap-1.5 opacity-50">
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                            <span className="text-[10px] text-slate-400 font-medium">Acceso inmediato</span>
                        </div>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5 opacity-50">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-[10px] text-slate-400 font-medium">Soporte 24/7</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const materiaActual = materias.find(m => m.key === materiaSeleccionada);
    const statsSelected = preguntaSeleccionada ? metricasPreguntas[preguntaSeleccionada.numero] : null;
    const diferencia = estadisticas.porcentaje - promedioGrupo;

    return (
        <div className="student-premium-page-dark pb-20 font-sans relative min-h-full">
            {/* Efectos de fondo */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-40 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Header */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 border-b border-white/10"
            >
                <div className="max-w-[1500px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${materiaActual?.gradient} flex items-center justify-center shadow-lg text-white`}>
                            {materiaActual && <materiaActual.icon className="w-5 h-5" />}
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white leading-none mb-0.5">Análisis de Respuestas</h1>
                            <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">{materiaActual?.label}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigateTo('/estudiante/dashboard')}
                        className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>
            </motion.nav>

            <main className="max-w-[1500px] mx-auto px-4 py-6 relative z-10">

                {/* Selector de Materias */}
                <AnimateIn type="fadeUp" duration={0.6}>
                    <div className="flex flex-wrap gap-2 mb-6 justify-center">
                        {materiasVisibles.map((materia) => (
                            <motion.button
                                key={materia.key}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setMateriaSeleccionada(materia.key)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border flex items-center gap-2.5 ${materiaSeleccionada === materia.key
                                    ? `bg-gradient-to-r ${materia.gradient} text-white border-transparent shadow-lg`
                                    : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                                    }`}
                            >
                                <materia.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{materia.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </AnimateIn>

                {/* Sesión incompleta — puntaje parcial visible */}
                {isSesionIncompleta && (
                    <AnimateIn type="fadeUp" duration={0.4}>
                        <div className="mb-6 rounded-2xl p-6 text-center space-y-3" style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.1), rgba(239,68,68,0.04))', border: '1px solid rgba(251,146,60,0.25)' }}>
                            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.3)' }}>
                                <AlertTriangle className="w-7 h-7 text-orange-400" />
                            </div>
                            <h3 className="text-lg font-black text-orange-300">Sesión incompleta — puntaje parcial</h3>
                            <p className="text-sm text-white/50 max-w-lg mx-auto leading-relaxed">
                                No completaste las 2 sesiones obligatorias del simulacro.
                                {!tieneSesionS1 && tieneSesionS2 && (
                                    <span className="block mt-1 text-orange-300/90 font-semibold">Falta la Sesión 1 (S1).</span>
                                )}
                                {tieneSesionS1 && !tieneSesionS2 && (
                                    <span className="block mt-1 text-orange-300/90 font-semibold">Falta la Sesión 2 (S2).</span>
                                )}
                                {!tieneSesionS1 && !tieneSesionS2 && (
                                    <span className="block mt-1 text-red-300/90 font-semibold">No registramos S1 ni S2.</span>
                                )}
                                <span className="block mt-2">
                                    Aun así, <strong className="text-orange-200">este análisis refleja lo que sí respondiste</strong> en cada materia.
                                </span>
                            </p>
                            <div className="inline-flex flex-col items-center rounded-xl border border-orange-400/25 bg-orange-500/10 px-5 py-3">
                                <span className="text-[10px] uppercase tracking-widest text-orange-300/80 font-bold">Puntaje global parcial</span>
                                <span className="text-3xl font-black text-orange-200">{estudiante?.puntaje_global ?? 0}</span>
                                <span className="text-[10px] text-white/35 mt-0.5">de 500 posibles</span>
                            </div>
                        </div>
                    </AnimateIn>
                )}

                {materiaSeleccionada === 'plan' && (
                    <AnimateIn type="fadeUp" delay={0.1} duration={0.6}>
                        <div className="mb-6 overflow-hidden rounded-3xl border border-cyan-300/20 bg-[linear-gradient(160deg,rgba(2,6,23,0.95),rgba(15,23,42,0.92)_45%,rgba(30,41,59,0.78))] shadow-[0_22px_55px_-32px_rgba(34,211,238,0.55),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
                            <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_45%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.72))] p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-5 w-5 text-cyan-200" />
                                        <h3 className="bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-lg font-black text-transparent">plan realista por repetición espaciada</h3>
                                        <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-200">beta</span>
                                    </div>
                                    <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
                                        basado en marcos icfes
                                    </span>
                                    <span className="rounded-full border border-emerald-300/35 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black text-emerald-100">
                                        layout compacto v3
                                    </span>
                                    
                                    {/* Selector de vista: Lista / Semanas */}
                                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/65 p-1 shadow-inner shadow-black/30">
                                        <button
                                            type="button"
                                            onClick={() => setVistaPlan('lista')}
                                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                                vistaPlan === 'lista'
                                                    ? 'bg-gradient-to-r from-cyan-400/20 to-violet-400/20 text-cyan-100 border border-cyan-300/35 shadow-[0_8px_18px_-12px_rgba(34,211,238,0.8)]'
                                                    : 'text-white/60 hover:text-white/90'
                                            }`}
                                        >
                                            <ListChecks className="h-3.5 w-3.5" />
                                            lista
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVistaPlan('semanas')}
                                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                                vistaPlan === 'semanas'
                                                    ? 'bg-gradient-to-r from-cyan-400/20 to-violet-400/20 text-cyan-100 border border-cyan-300/35 shadow-[0_8px_18px_-12px_rgba(34,211,238,0.8)]'
                                                    : 'text-white/60 hover:text-white/90'
                                            }`}
                                        >
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            semanas
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 rounded-2xl border border-violet-300/25 bg-[radial-gradient(circle_at_left,rgba(139,92,246,0.18),transparent_55%),rgba(15,23,42,0.72)] p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-[11px] font-black text-violet-100/90">{progresoJugador.titulo}</p>
                                            <p className="text-[11px] text-white/65">{progresoJugador.descripcion}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                                            <span className="rounded-md border border-emerald-300/35 bg-emerald-400/10 px-2 py-0.5 text-emerald-100">
                                                estudiado: {progresoJugador.estudiado}
                                            </span>
                                            <span className="rounded-md border border-amber-300/35 bg-amber-400/10 px-2 py-0.5 text-amber-100">
                                                repasar: {progresoJugador.repasar}
                                            </span>
                                            <span className="rounded-md border border-white/20 bg-white/[0.05] px-2 py-0.5 text-white/80">
                                                avance: {progresoJugador.avancePct}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence initial={false}>
                                    {mostrarOnboardingPlan && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: -8, height: 0 }}
                                            transition={{ duration: 0.22 }}
                                            className="mt-3 overflow-hidden rounded-2xl border border-cyan-300/25 bg-cyan-400/[0.08] p-3"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-[11px] font-black text-cyan-100">inicio rápido (2 pasos)</p>
                                                    <p className="mt-1 text-[11px] text-white/80">1) ajusta fecha meta y horas por día. 2) si quieres más control, abre “personalizar más”.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={cerrarOnboardingPlan}
                                                    className="rounded-md border border-cyan-300/35 bg-cyan-400/15 px-2.5 py-1 text-[10px] font-bold text-cyan-100 hover:bg-cyan-400/25"
                                                >
                                                    entendido
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">
                                    <div className="rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                        <p className="text-xs text-white/55">Meta</p>
                                        <p className="text-base font-black text-white">{planGlobal.resumen.fechaObjetivo}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                        <p className="text-xs text-white/55">Días hasta meta</p>
                                        <p className="text-base font-black text-white">{planGlobal.resumen.diasHastaMeta}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                        <p className="text-xs text-white/55">Días programados</p>
                                        <p className="text-base font-black text-white">{planGlobal.resumen.diasConEstudio}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                        <p className="text-xs text-white/55">Horas totales</p>
                                        <p className="text-base font-black text-white">{planGlobal.resumen.horasTotales}h</p>
                                    </div>
                                    <div className="rounded-xl border border-cyan-300/30 bg-[linear-gradient(165deg,rgba(34,211,238,0.20),rgba(34,211,238,0.08))] p-2.5 shadow-[0_12px_24px_-16px_rgba(34,211,238,0.9)]">
                                        <p className="text-xs text-cyan-200/90">Promedio diario real</p>
                                        <p className="text-base font-black text-cyan-100">{planGlobal.resumen.horasDiaPromedio}h</p>
                                        <p className="text-[10px] text-cyan-200/80">En días con sesión: {planGlobal.resumen.horasDiaProgramado}h</p>
                                    </div>
                                    <div className="rounded-xl border border-fuchsia-300/30 bg-[linear-gradient(165deg,rgba(217,70,239,0.20),rgba(217,70,239,0.08))] p-2.5 shadow-[0_12px_24px_-16px_rgba(217,70,239,0.85)]">
                                        <p className="text-xs text-fuchsia-200/90">Carga diaria</p>
                                        <p className="text-base font-black text-fuchsia-100">{planGlobal.resumen.eventosPorDia} eventos</p>
                                        <p className="text-[10px] text-fuchsia-200/80">Meta semanal: {horasObjetivoSemana.toFixed(1)}h</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_45%),linear-gradient(165deg,rgba(15,23,42,0.82),rgba(15,23,42,0.52))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-white/70">
                                            <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-300" />
                                            configura tu ritmo ideal
                                        </p>
                                        <span className="inline-flex items-center gap-1 text-xs text-cyan-200/90">
                                            <Rocket className="h-3.5 w-3.5" />
                                            modo {intensidadPlan}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['ligero', 'normal', 'intensivo'] as IntensidadPlan[]).map((nivel) => {
                                            const activo = intensidadPlan === nivel;
                                            const subt = nivel === 'ligero'
                                                ? '~10.5h/sem'
                                                : nivel === 'intensivo'
                                                    ? '~28h/sem'
                                                    : '~17.5h/sem';
                                            return (
                                                <motion.button
                                                    key={nivel}
                                                    type="button"
                                                    aria-pressed={activo}
                                                    onClick={() => aplicarIntensidadPlan(nivel)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    className={`relative overflow-hidden rounded-xl border px-2.5 py-2.5 text-xs font-bold transition-all ${
                                                        activo
                                                            ? 'border-cyan-300/55 bg-[linear-gradient(165deg,rgba(34,211,238,0.22),rgba(139,92,246,0.18))] text-cyan-50 shadow-[0_10px_22px_-14px_rgba(34,211,238,0.85)]'
                                                            : 'border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25 hover:bg-white/[0.06]'
                                                    }`}
                                                >
                                                    {activo && (
                                                        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
                                                    )}
                                                    <span className="block">{nivel}</span>
                                                    <span className={`mt-0.5 block text-[9px] font-semibold ${activo ? 'text-cyan-100/90' : 'text-white/40'}`}>{subt}</span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(15,23,42,0.85),rgba(15,23,42,0.55))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                            <div className="mb-1.5 flex items-center justify-between">
                                                <p className="text-[11px] font-bold text-white/65">horas objetivo por semana</p>
                                                <span className="rounded-md border border-cyan-300/30 bg-cyan-400/10 px-1.5 py-[1px] text-[10px] font-black text-cyan-100">{horasObjetivoSemana.toFixed(1)}h</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={4}
                                                max={horasSemanaMaxPermitidas}
                                                step={0.5}
                                                value={horasObjetivoSemana}
                                                onChange={(e) => ajustarHorasObjetivo(Number(e.target.value))}
                                                className="w-full accent-cyan-400"
                                            />
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {[8, 10.5, 14, 17.5, 21, 28, 35, 42].map((h) => (
                                                    <button
                                                        key={h}
                                                        type="button"
                                                        onClick={() => ajustarHorasObjetivo(h)}
                                                        disabled={h > horasSemanaMaxPermitidas}
                                                        className={`rounded-md border px-1.5 py-[1px] text-[10px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-35 ${
                                                            Math.abs(horasObjetivoSemana - h) < 0.05
                                                                ? 'border-cyan-300/50 bg-cyan-400/20 text-cyan-50'
                                                                : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white/90'
                                                        }`}
                                                    >
                                                        {h}h/sem
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="mt-1 text-[10px] text-white/45">
                                                tope actual por disponibilidad: {horasSemanaMaxPermitidas.toFixed(1)}h/sem
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(15,23,42,0.85),rgba(15,23,42,0.55))] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                            <div className="mb-1.5 flex items-center justify-between">
                                                <p className="text-[11px] font-bold text-white/65">fecha meta del plan</p>
                                                <span className="rounded-md border border-violet-300/30 bg-violet-400/10 px-1.5 py-[1px] text-[10px] font-black text-violet-100">{formatMetaDate(metaFechaISO)}</span>
                                            </div>
                                            <input
                                                type="date"
                                                value={metaFechaISO}
                                                min={new Date().toISOString().slice(0, 10)}
                                                onChange={(e) => setMetaFechaISO(e.target.value || '2026-07-23')}
                                                className="w-full rounded-md border border-white/15 bg-slate-900/85 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-300/50"
                                            />
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {[
                                                    { lbl: '+1 sem', d: 7 },
                                                    { lbl: '+2 sem', d: 14 },
                                                    { lbl: '+1 mes', d: 30 },
                                                    { lbl: '+2 mes', d: 60 },
                                                    { lbl: '+3 mes', d: 90 }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.lbl}
                                                        type="button"
                                                        onClick={() => aplicarMetaRapida(opt.d)}
                                                        className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-[1px] text-[10px] font-semibold text-white/65 transition-all hover:border-violet-300/40 hover:bg-violet-400/15 hover:text-violet-100"
                                                    >
                                                        {opt.lbl}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid gap-2 lg:grid-cols-[1.4fr_1fr_1fr]">
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setVistaPlan('semanas');
                                                setSemanaActual(0);
                                            }}
                                            className="relative overflow-hidden rounded-xl border border-cyan-300/45 bg-[linear-gradient(165deg,rgba(34,211,238,0.28),rgba(139,92,246,0.22))] px-4 py-2.5 text-left text-cyan-50 shadow-[0_14px_30px_-16px_rgba(34,211,238,0.75)] transition-all hover:shadow-[0_20px_40px_-16px_rgba(34,211,238,0.95)]"
                                        >
                                            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="inline-flex items-center gap-2 text-xs font-black">
                                                    <Rocket className="h-4 w-4" />
                                                    crear mi plan
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-cyan-100/80" />
                                            </span>
                                            <span className="mt-0.5 block text-[10px] font-semibold text-cyan-100/85">
                                                vista semanal con tus prioridades activas.
                                            </span>
                                        </motion.button>
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setMostrarAjustesAvanzados((prev) => !prev)}
                                            aria-expanded={mostrarAjustesAvanzados}
                                            className="group relative overflow-hidden rounded-xl border border-violet-300/35 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_58%),rgba(15,23,42,0.88)] px-3 py-2.5 text-left text-white shadow-[0_10px_24px_-16px_rgba(167,139,250,0.65)] transition-all hover:border-violet-200/55 hover:shadow-[0_18px_36px_-16px_rgba(167,139,250,0.85)]"
                                        >
                                            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/60 to-transparent" />
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-violet-100">
                                                    <Sparkles className="h-3.5 w-3.5 text-violet-200" />
                                                    personalizar más
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-100/85">
                                                    {mostrarAjustesAvanzados ? 'abierto' : 'cerrado'}
                                                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${mostrarAjustesAvanzados ? 'rotate-90' : ''}`} />
                                                </span>
                                            </span>
                                            <span className="mt-0.5 block text-[10px] text-white/65">
                                                eventos, disponibilidad y sincronización.
                                            </span>
                                        </motion.button>
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={restablecerPlanRecomendado}
                                            className="rounded-xl border border-emerald-300/35 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_60%),rgba(15,23,42,0.85)] px-3 py-2.5 text-left text-emerald-50 transition-all hover:border-emerald-200/50 hover:shadow-[0_14px_28px_-16px_rgba(16,185,129,0.7)]"
                                        >
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-100">
                                                <Shield className="h-3.5 w-3.5 text-emerald-200" />
                                                usar recomendado
                                            </span>
                                            <span className="mt-0.5 block text-[10px] text-white/65">
                                                regresa a la configuración óptima sugerida.
                                            </span>
                                        </motion.button>
                                    </div>

                                    <AnimatePresence initial={false}>
                                    {mostrarAjustesAvanzados && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: -6, height: 0 }}
                                            transition={{ duration: 0.22 }}
                                            className="overflow-hidden"
                                        >
                                        <div className="mt-3 rounded-2xl border border-violet-300/20 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.10),transparent_55%),linear-gradient(165deg,rgba(15,23,42,0.78),rgba(15,23,42,0.45))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-violet-100/90">
                                                    <Sparkles className="h-3.5 w-3.5 text-violet-200" />
                                                    ajustes avanzados
                                                </p>
                                                <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-2 py-0.5 text-[9px] font-bold text-violet-100">3 bloques · interactivos</span>
                                            </div>

                                            <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                                                <div className="rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(15,23,42,0.85),rgba(15,23,42,0.55))] p-2.5">
                                                    <div className="mb-1.5 flex items-center justify-between">
                                                        <p className="text-[11px] font-bold text-white/65">eventos por día</p>
                                                        <span className="rounded-md border border-fuchsia-300/30 bg-fuchsia-400/10 px-1.5 py-[1px] text-[10px] font-black text-fuchsia-100">{eventosPorDia}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            type="button"
                                                            onClick={() => ajustarEventosPorDia(eventosPorDia - 1)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-slate-900/80 text-white/80 transition-all hover:border-fuchsia-300/50 hover:text-fuchsia-100"
                                                            aria-label="Reducir eventos por día"
                                                        >
                                                            <Minus className="h-3.5 w-3.5" />
                                                        </motion.button>
                                                        <div className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-center text-xs font-bold text-white/85">
                                                            {eventosPorDia} bloques · ~{Math.round((eventosPorDia * minutosBloqueBasePorIntensidad(intensidadPlan)) / 6) / 10}h
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            type="button"
                                                            onClick={() => ajustarEventosPorDia(eventosPorDia + 1)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-slate-900/80 text-white/80 transition-all hover:border-fuchsia-300/50 hover:text-fuchsia-100"
                                                            aria-label="Aumentar eventos por día"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </motion.button>
                                                    </div>
                                                    <p className="mt-1.5 text-[10px] text-white/45">repetición espaciada: más bloques = mayor consolidación.</p>
                                                </div>

                                                <div className="rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(15,23,42,0.85),rgba(15,23,42,0.55))] p-2.5">
                                                    <div className="mb-1.5 flex items-center justify-between">
                                                        <p className="text-[11px] font-bold text-white/65">semanas disponibles</p>
                                                        <span className="rounded-md border border-cyan-300/30 bg-cyan-400/10 px-1.5 py-[1px] text-[10px] font-black text-cyan-100">{weeksAvailable} sem</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={1}
                                                        max={24}
                                                        step={1}
                                                        value={weeksAvailable}
                                                        onChange={(e) => setWeeksAvailable(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
                                                        className="w-full accent-cyan-400"
                                                    />
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {[2, 4, 6, 8, 12, 16, 20, 24].map((w) => (
                                                            <button
                                                                key={w}
                                                                type="button"
                                                                onClick={() => setWeeksAvailable(w)}
                                                                className={`rounded-md border px-1.5 py-[1px] text-[10px] font-semibold transition-all ${
                                                                    weeksAvailable === w
                                                                        ? 'border-cyan-300/50 bg-cyan-400/20 text-cyan-50'
                                                                        : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white/90'
                                                                }`}
                                                            >
                                                                {w}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(15,23,42,0.85),rgba(15,23,42,0.55))] p-2.5">
                                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                    <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/65">
                                                        <Clock className="h-3.5 w-3.5 text-cyan-300" />
                                                        horas disponibles por día
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {[
                                                            { lbl: 'semana intensa', cfg: { lunes: 3, martes: 3, miercoles: 3, jueves: 3, viernes: 3, sabado: 2, domingo: 1 } },
                                                            { lbl: 'fin de semana', cfg: { lunes: 0, martes: 0, miercoles: 0, jueves: 0, viernes: 0, sabado: 4, domingo: 4 } },
                                                            { lbl: 'balanceado', cfg: { lunes: 2.5, martes: 2.5, miercoles: 2.5, jueves: 2.5, viernes: 2.5, sabado: 1.5, domingo: 1 } }
                                                        ].map((preset) => (
                                                            <button
                                                                key={preset.lbl}
                                                                type="button"
                                                                onClick={() => setDailyAvailability(preset.cfg as Record<DayKey, number>)}
                                                                className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-[1px] text-[10px] font-semibold text-white/65 transition-all hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-cyan-100"
                                                            >
                                                                {preset.lbl}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
                                                    {DAY_KEYS.map((day) => {
                                                        const valor = dailyAvailability[day];
                                                        const activo = valor > 0;
                                                        return (
                                                            <div key={day} className={`rounded-lg border p-2 transition-all ${activo ? 'border-cyan-300/25 bg-cyan-400/[0.05]' : 'border-white/10 bg-black/20'}`}>
                                                                <div className="mb-1 flex items-center justify-between">
                                                                    <p className="text-[10px] font-bold text-white/70">{day.slice(0, 3)}</p>
                                                                    <span className={`text-[10px] font-black ${activo ? 'text-cyan-100' : 'text-white/40'}`}>{valor}h</span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    min={0}
                                                                    max={8}
                                                                    step={0.5}
                                                                    value={valor}
                                                                    onChange={(e) => setHorasDia(day, Number(e.target.value))}
                                                                    className="w-full accent-cyan-400"
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="mt-3 rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(15,23,42,0.85),rgba(15,23,42,0.55))] p-2.5">
                                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                    <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/65">
                                                        <CalendarDays className="h-3.5 w-3.5 text-rose-300" />
                                                        días ocupados (sin eventos)
                                                    </p>
                                                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold text-white/60">{busyDates.length} marcados</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <input
                                                        type="date"
                                                        value={busyDateInput}
                                                        min={new Date().toISOString().slice(0, 10)}
                                                        onChange={(e) => setBusyDateInput(e.target.value)}
                                                        className="flex-1 min-w-[140px] rounded-md border border-white/15 bg-slate-900/85 px-2 py-1.5 text-xs text-white outline-none focus:border-rose-300/50"
                                                    />
                                                    <motion.button
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        type="button"
                                                        onClick={agregarDiaOcupado}
                                                        disabled={!busyDateInput}
                                                        className="rounded-md border border-rose-300/35 bg-rose-400/15 px-3 py-1.5 text-[11px] font-bold text-rose-100 transition-all hover:bg-rose-400/25 disabled:opacity-40"
                                                    >
                                                        agregar
                                                    </motion.button>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {[
                                                        { lbl: 'hoy', d: 0 },
                                                        { lbl: 'mañana', d: 1 },
                                                        { lbl: 'sábado', d: (6 - new Date().getDay() + 7) % 7 || 7 },
                                                        { lbl: 'domingo', d: (7 - new Date().getDay() + 7) % 7 || 7 }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.lbl}
                                                            type="button"
                                                            onClick={() => aplicarBusyRapido(opt.d)}
                                                            className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-[1px] text-[10px] font-semibold text-white/65 transition-all hover:border-rose-300/40 hover:bg-rose-400/15 hover:text-rose-100"
                                                        >
                                                            {opt.lbl}
                                                        </button>
                                                    ))}
                                                </div>
                                                {busyDates.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {busyDates.slice(0, 20).map((d) => (
                                                            <motion.button
                                                                key={d}
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                whileHover={{ scale: 1.05 }}
                                                                type="button"
                                                                onClick={() => quitarDiaOcupado(d)}
                                                                className="rounded-md border border-rose-300/35 bg-rose-400/15 px-2 py-0.5 text-[10px] font-bold text-rose-100 transition-all hover:bg-rose-400/30"
                                                                title="quitar día ocupado"
                                                            >
                                                                {d} ×
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-300/25 bg-[radial-gradient(circle_at_left,rgba(34,211,238,0.10),transparent_55%),rgba(15,23,42,0.65)] p-2.5">
                                                <div>
                                                    <p className="text-[11px] font-bold text-cyan-100">guardado local activo</p>
                                                    <p className="text-[10px] text-white/55">tus cambios persisten en este dispositivo. sincroniza cuando quieras.</p>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    type="button"
                                                    onClick={abrirModalSubida}
                                                    className="inline-flex items-center gap-1.5 rounded-md border border-cyan-300/40 bg-[linear-gradient(165deg,rgba(34,211,238,0.25),rgba(139,92,246,0.18))] px-3 py-1.5 text-[11px] font-bold text-cyan-50 shadow-[0_8px_18px_-12px_rgba(34,211,238,0.85)] transition-all hover:shadow-[0_12px_28px_-12px_rgba(34,211,238,0.95)]"
                                                >
                                                    <Sparkles className="h-3 w-3" />
                                                    sincronizar con nube
                                                </motion.button>
                                            </div>
                                        </div>
                                        </motion.div>
                                    )}
                                    </AnimatePresence>

                                    <div className="mt-3 grid gap-2.5 lg:grid-cols-[1.15fr_1fr_1fr]">
                                        <div className="rounded-xl border border-emerald-300/25 bg-[linear-gradient(165deg,rgba(16,185,129,0.14),rgba(16,185,129,0.05))] p-3 h-full">
                                            <p className="text-[11px] font-bold text-emerald-100">resumen ejecutivo del plan</p>
                                            <p className="mt-1 text-[11px] text-white/85">
                                                {planGlobal.resumen.horasTotales}h totales · {planGlobal.sesiones.length} sesiones · {planGlobal.focos.length} prioridades activas.
                                            </p>
                                            <p className="mt-1 text-[10px] text-emerald-100/90">
                                                {planGlobal.resumen.diasHastaMeta <= 14
                                                    ? 'meta cercana: ya recortamos el alcance y concentramos el esfuerzo en focos críticos.'
                                                    : 'ruta estable: puedes mantener este ritmo o refinarlo en personalizar más.'}
                                            </p>
                                            <div className="mt-2 grid grid-cols-3 gap-1.5">
                                                <div className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
                                                    <p className="text-[9px] text-white/45">días meta</p>
                                                    <p className="text-[11px] font-black text-emerald-100">{planGlobal.resumen.diasHastaMeta}</p>
                                                </div>
                                                <div className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
                                                    <p className="text-[9px] text-white/45">eventos/día</p>
                                                    <p className="text-[11px] font-black text-cyan-100">{planGlobal.resumen.eventosPorDia}</p>
                                                </div>
                                                <div className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
                                                    <p className="text-[9px] text-white/45">horas/día</p>
                                                    <p className="text-[11px] font-black text-violet-100">{planGlobal.resumen.horasObjetivoDia}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2.5 rounded-md border border-white/10 bg-black/20 p-2">
                                                <div className="mb-1.5 flex items-center justify-between text-[10px]">
                                                    <span className="text-white/60">uso de capacidad semanal</span>
                                                    <span className="font-black text-cyan-100">
                                                        {Math.round((horasObjetivoSemana / Math.max(1, horasSemanaMaxPermitidas)) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.max(5, Math.min(100, Math.round((horasObjetivoSemana / Math.max(1, horasSemanaMaxPermitidas)) * 100)))}%` }}
                                                        transition={{ duration: 0.35 }}
                                                        className="h-full rounded-full bg-gradient-to-r from-cyan-400/90 to-emerald-400/90"
                                                    />
                                                </div>
                                                <p className="mt-1 text-[10px] text-white/55">
                                                    objetivo: {horasObjetivoSemana.toFixed(1)}h/sem · tope: {horasSemanaMaxPermitidas.toFixed(1)}h/sem
                                                </p>
                                            </div>
                                            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                                                <div className="rounded-md border border-white/10 bg-black/20 px-2 py-1.5">
                                                    <p className="text-[9px] text-white/45">sesiones por día</p>
                                                    <p className="text-[11px] font-black text-white/90">
                                                        {(planGlobal.resumen.sesionesTotales / Math.max(1, planGlobal.resumen.diasConEstudio)).toFixed(1)}
                                                    </p>
                                                </div>
                                                <div className="rounded-md border border-white/10 bg-black/20 px-2 py-1.5">
                                                    <p className="text-[9px] text-white/45">semanas activas</p>
                                                    <p className="text-[11px] font-black text-white/90">{Math.max(1, planGlobal.semanas.length)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2.5 rounded-md border border-white/10 bg-black/20 p-2">
                                                <p className="mb-1.5 text-[10px] font-bold text-white/60">materias con mayor carga</p>
                                                <div className="space-y-1">
                                                    {cargaPorMateria.slice(0, 3).map((item) => {
                                                        const visual = MATERIA_VISUAL[item.materia] || MATERIA_FALLBACK;
                                                        return (
                                                            <div key={`summary-${item.materia}`} className="flex items-center justify-between text-[10px]">
                                                                <span className="text-white/80">{visual.label}</span>
                                                                <span className="font-bold text-cyan-100">{item.horas}h</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {cargaPorMateria.length === 0 && (
                                                        <p className="text-[10px] text-white/45">sin carga calculada aún.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-slate-900/55 p-3">
                                            <div className="mb-2 flex items-center justify-between">
                                                <p className="text-[11px] font-bold text-white/70">prioridades clave</p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setVistaPlan('semanas');
                                                        setSemanaActual(0);
                                                        setPendingScrollSemanas(true);
                                                    }}
                                                    className="rounded-md border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-100 hover:bg-cyan-400/20"
                                                >
                                                    ver plan semanal
                                                </button>
                                            </div>
                                            <p className="mb-2 text-[10px] text-white/45">arrastra para subir o bajar prioridad según tu preferencia.</p>
                                            <div className="space-y-1.5">
                                                {focosOrdenados.slice(0, 4).map((foco) => {
                                                    const key = focoPriorityKey(foco);
                                                    const isDragging = dragPrioridadKey === key;
                                                    return (
                                                        <div
                                                            key={`${foco.materia}-${foco.tema}`}
                                                            draggable
                                                            onDragStart={() => setDragPrioridadKey(key)}
                                                            onDragEnd={() => setDragPrioridadKey(null)}
                                                            onDragOver={(e) => e.preventDefault()}
                                                            onDrop={() => {
                                                                if (dragPrioridadKey) moverPrioridad(dragPrioridadKey, key);
                                                                setDragPrioridadKey(null);
                                                            }}
                                                            className={`flex cursor-grab items-center justify-between rounded-lg border px-2 py-1.5 transition-all active:cursor-grabbing ${isDragging ? 'border-violet-300/45 bg-violet-400/15' : 'border-white/10 bg-black/20 hover:border-violet-300/35'}`}
                                                        >
                                                            <p className="text-[11px] text-white/85">
                                                                {foco.tema} · {MATERIA_VISUAL[foco.materia]?.label || foco.materia}
                                                            </p>
                                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                                                foco.prioridad === 'alta'
                                                                    ? 'border-rose-300/35 bg-rose-400/15 text-rose-100'
                                                                    : foco.prioridad === 'media'
                                                                        ? 'border-amber-300/35 bg-amber-400/15 text-amber-100'
                                                                        : 'border-emerald-300/35 bg-emerald-400/15 text-emerald-100'
                                                            }`}>
                                                                {foco.prioridad}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {focosOrdenados.length === 0 && (
                                                    <p className="text-[10px] text-white/45">sin focos críticos ahora, puedes mantener el ritmo actual.</p>
                                                )}
                                            </div>
                                            {focosOrdenados.length > 4 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPrioridadesModal(true)}
                                                    className="mt-2 inline-flex items-center gap-1 rounded-md border border-violet-300/35 bg-violet-400/10 px-2 py-1 text-[10px] font-bold text-violet-100 hover:bg-violet-400/20"
                                                >
                                                    ver más prioridades
                                                    <ChevronRight className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-slate-900/55 p-3">
                                            <div className="mb-2 flex items-center justify-between">
                                                <p className="text-[11px] font-bold text-white/70">distribución por materia</p>
                                                <span className="text-[10px] text-white/45">tiempo real</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {cargaPorMateria.map((item) => {
                                                    const visual = MATERIA_VISUAL[item.materia] || MATERIA_FALLBACK;
                                                    const Icon = visual.Icon;
                                                    return (
                                                        <div key={item.materia} className="rounded-lg border border-white/10 bg-black/20 p-1.5">
                                                            <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
                                                                <span className="inline-flex items-center gap-1.5 text-white/85">
                                                                    <Icon className="h-3.5 w-3.5 text-cyan-200" />
                                                                    {visual.label}
                                                                </span>
                                                                <span className="font-bold text-cyan-100">{item.horas}h · {item.pct}%</span>
                                                            </div>
                                                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${item.pct}%` }}
                                                                    transition={{ duration: 0.35 }}
                                                                    className="h-full rounded-full bg-gradient-to-r from-cyan-400/85 to-violet-400/85"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {cargaPorMateria.length === 0 && (
                                                    <p className="text-[10px] text-white/45">aún no hay sesiones suficientes para mostrar distribución.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!planGlobal.disponible ? (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                                        Aún no hay respuestas válidas suficientes para construir el plan personalizado.
                                        Cuando no hay temarios explícitos, usamos focos por competencia/afirmación del marco ICFES.
                                    </div>
                                ) : (
                                    <>
                                    {/* Vista de Semanas */}
                                    {vistaPlan === 'semanas' && (
                                    <div ref={semanasSectionRef} className="space-y-5">
                                        {/* Leyenda de materias */}
                                        {(() => {
                                            const materiasUsadas = Array.from(new Set(planGlobal.sesiones.map((s) => s.materia)));
                                            return (
                                                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                                                    <span className="text-[10px] font-black text-white/45">
                                                        Materias
                                                    </span>
                                                    <span className="h-3 w-px bg-white/10" />
                                                    {materiasUsadas.map((m) => {
                                                        const v = MATERIA_VISUAL[m] || MATERIA_FALLBACK;
                                                        const Icon = v.Icon;
                                                        return (
                                                            <span
                                                                key={m}
                                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${v.chip}`}
                                                            >
                                                                <Icon className="h-3 w-3" />
                                                                {v.label}
                                                            </span>
                                                        );
                                                    })}
                                                    <span className="h-3 w-px bg-white/10" />
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/55">
                                                        <Repeat className="h-3 w-3 text-cyan-300" />
                                                        Repaso espaciado · 5 ciclos
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/[0.06] p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-[11px] font-black text-cyan-200/90">
                                                        resumen diagnóstico
                                                    </p>
                                                    <p className="mt-1 text-xs text-white/70">
                                                        Se muestra como modal la primera vez. Puedes volver a abrirlo cuando quieras.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setMostrarResumenDiagnosticoModal(true)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/35 bg-cyan-400/15 px-3 py-2 text-[11px] font-black text-cyan-100 transition-colors hover:bg-cyan-400/25"
                                                >
                                                    <Sparkles className="h-3.5 w-3.5" />
                                                    Ver resumen
                                                </button>
                                            </div>
                                        </div>

                                        {/* Paginador de semanas */}
                                        {planGlobal.semanas.length > 1 && (
                                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setSemanaActual(Math.max(0, semanaActual - 1))}
                                                    disabled={semanaActual === 0}
                                                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-white/85 transition-all hover:border-cyan-300/30 hover:bg-cyan-400/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-white/[0.05]"
                                                >
                                                    <ChevronRight className="h-4 w-4 rotate-180" />
                                                    anterior
                                                </button>
                                                
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white/60">semana</span>
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-400/10 text-sm font-black text-cyan-100">
                                                        {semanaActual + 1}
                                                    </span>
                                                    <span className="text-sm font-bold text-white/40">de {planGlobal.semanas.length}</span>
                                                </div>
                                                
                                                <button
                                                    type="button"
                                                    onClick={() => setSemanaActual(Math.min(planGlobal.semanas.length - 1, semanaActual + 1))}
                                                    disabled={semanaActual >= planGlobal.semanas.length - 1}
                                                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-white/85 transition-all hover:border-cyan-300/30 hover:bg-cyan-400/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-white/[0.05]"
                                                >
                                                    siguiente
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Renderizar solo la semana actual */}
                                        {(() => {
                                            const semana = planGlobal.semanas[semanaActual];
                                            if (!semana) return null;
                                            
                                            const totalMinSemana = semana.dias.reduce((acc, d) => acc + d.minutosTotales, 0);
                                            const totalSesionesSemana = semana.dias.reduce((acc, d) => acc + d.items.length, 0);
                                            const altaPrioridadSemana = semana.dias.reduce(
                                                (acc, d) => acc + d.items.filter((i) => i.prioridad === 'alta').length,
                                                0
                                            );
                                            const horasSemana = Math.round((totalMinSemana / 60) * 10) / 10;
                                            const hoyKey = new Date().toISOString().slice(0, 10);

                                            return (
                                                <div
                                                    key={semana.idx}
                                                    className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-950/50 to-slate-900/70"
                                                >
                                                    {/* Header de semana */}
                                                    <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_60%)] px-4 py-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200 shadow-inner shadow-cyan-500/10">
                                                                    <span className="text-[8px] font-black uppercase leading-none tracking-widest text-cyan-300/80">Sem</span>
                                                                    <span className="text-sm font-black leading-none">{semana.idx}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-white">
                                                                        Semana {semana.idx}
                                                                    </p>
                                                                    <p className="text-[11px] capitalize text-white/55">
                                                                        {semana.desde.toLocaleDateString('es-CO', { day: '2-digit', month: 'long' })}
                                                                        {' '}–{' '}
                                                                        {semana.hasta.toLocaleDateString('es-CO', { day: '2-digit', month: 'long' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] font-bold text-white/85">
                                                                    <Clock className="h-3 w-3 text-cyan-300" />
                                                                    {horasSemana}h
                                                                </span>
                                                                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] font-bold text-white/85">
                                                                    <ListChecks className="h-3 w-3 text-cyan-300" />
                                                                    {totalSesionesSemana} sesiones
                                                                </span>
                                                                {altaPrioridadSemana > 0 && (
                                                                    <span className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] font-bold text-rose-200">
                                                                        <Flame className="h-3 w-3" />
                                                                        {altaPrioridadSemana} alta
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Grilla de días */}
                                                    <div className="grid gap-2 p-2.5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                                                        {Array.from({ length: 7 }, (_, offset) => {
                                                            const currentDate = new Date(semana.desde.getTime() + (offset * 24 * 60 * 60 * 1000));
                                                            const key = currentDate.toISOString().slice(0, 10);
                                                            const dia = semana.dias.find((d) => d.key === key);
                                                            const dow = diaSemanaIndex(currentDate);
                                                            const esHoy = key === hoyKey;
                                                            const esFinde = dow >= 5;
                                                            const horasDia = dia ? Math.round((dia.minutosTotales / 60) * 10) / 10 : 0;

                                                            return (
                                                                <div
                                                                    key={`${semana.idx}-${key}`}
                                                                    className={`relative flex min-h-[124px] flex-col overflow-hidden rounded-xl border transition-all ${
                                                                        esHoy
                                                                            ? 'border-cyan-300/60 bg-cyan-400/[0.05] shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)]'
                                                                            : dia
                                                                                ? 'border-white/10 bg-slate-950/55 hover:border-white/20'
                                                                                : 'border-dashed border-white/10 bg-slate-950/25'
                                                                    }`}
                                                                >
                                                                    {/* Header del día */}
                                                                    <div
                                                                        className={`flex items-center justify-between gap-2 border-b px-2.5 py-1.5 ${
                                                                            esHoy
                                                                                ? 'border-cyan-300/40 bg-cyan-400/[0.10]'
                                                                                : 'border-white/10 bg-white/[0.025]'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-baseline gap-1.5 min-w-0">
                                                                            <span
                                                                                className={`text-[9px] font-black ${
                                                                                    esHoy
                                                                                        ? 'text-cyan-200'
                                                                                        : esFinde
                                                                                            ? 'text-amber-300/70'
                                                                                            : 'text-white/55'
                                                                                }`}
                                                                            >
                                                                                {DIA_NOMBRES_CORTOS[dow]}
                                                                            </span>
                                                                            <span
                                                                                className={`text-base font-black leading-none ${
                                                                                    esHoy
                                                                                        ? 'text-cyan-100'
                                                                                        : dia
                                                                                            ? 'text-white'
                                                                                            : 'text-white/40'
                                                                                }`}
                                                                            >
                                                                                {currentDate.getDate()}
                                                                            </span>
                                                                            <span
                                                                                className={`text-[9px] font-medium ${
                                                                                    dia ? 'text-white/40' : 'text-white/25'
                                                                                }`}
                                                                            >
                                                                                {currentDate.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}
                                                                            </span>
                                                                        </div>
                                                                        {esHoy ? (
                                                                            <span className="rounded-full bg-cyan-400/25 px-1.5 py-[1px] text-[8px] font-black text-cyan-100 ring-1 ring-cyan-300/40">
                                                                                hoy
                                                                            </span>
                                                                        ) : dia ? (
                                                                            <span className="inline-flex items-center gap-0.5 rounded-md bg-white/[0.08] px-1.5 py-[1px] text-[10px] font-bold text-white/85">
                                                                                <Clock className="h-2.5 w-2.5 text-cyan-300" />
                                                                                {horasDia}h
                                                                            </span>
                                                                        ) : null}
                                                                    </div>

                                                                    {/* Lista de sesiones */}
                                                                    <div className="flex-1 space-y-1 p-1.5">
                                                                        {dia ? (
                                                                            dia.items.map((item) => {
                                                                                const v = MATERIA_VISUAL[item.materia] || MATERIA_FALLBACK;
                                                                                const Icon = v.Icon;
                                                                                const estadoSesion = obtenerEstadoSesion(item.key);
                                                                                const completada = estadoSesion === 'estudiado';
                                                                                const enRepaso = estadoSesion === 'repasar';
                                                                                return (
                                                                                    <div
                                                                                        key={item.key}
                                                                                        onClick={() => setSesionSeleccionada({
                                                                                            key: item.key,
                                                                                            materia: item.materia,
                                                                                            tema: item.tema,
                                                                                            minutos: item.minutos,
                                                                                            prioridad: item.prioridad,
                                                                                            repaso: item.repaso,
                                                                                            fecha: currentDate,
                                                                                            estado: estadoSesion
                                                                                        })}
                                                                                        className={`group relative overflow-hidden rounded-lg border transition-all hover:-translate-y-px cursor-pointer ${
                                                                                            completada
                                                                                                ? 'border-emerald-400/35 bg-emerald-500/[0.10] hover:border-emerald-300/55'
                                                                                                : enRepaso
                                                                                                    ? 'border-amber-400/40 bg-amber-500/[0.10] hover:border-amber-300/60'
                                                                                                    : 'border-white/10 bg-slate-900/60 hover:border-white/25 hover:bg-slate-900/85'
                                                                                        }`}
                                                                                    >
                                                                                        <div className={`absolute inset-y-0 left-0 w-[3px] ${v.stripe}`} />
                                                                                        <div className="space-y-1 pl-2.5 pr-1.5 py-1.5">
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-[1px] text-[9px] font-black ${v.chip}`}>
                                                                                                    <Icon className="h-2.5 w-2.5" />
                                                                                                    {v.short}
                                                                                                </span>
                                                                                                {item.prioridad === 'alta' && (
                                                                                                    <Flame
                                                                                                        className="h-2.5 w-2.5 text-rose-400"
                                                                                                        aria-label="Prioridad alta"
                                                                                                    />
                                                                                                )}
                                                                                                <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-bold text-white/55">
                                                                                                    <Clock className="h-2.5 w-2.5" />
                                                                                                    {item.minutos}m
                                                                                                </span>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={(event) => {
                                                                                                        event.stopPropagation();
                                                                                                        marcarSesionComoHecha(item.key);
                                                                                                    }}
                                                                                                    className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-[1px] text-[9px] font-black transition-colors ${
                                                                                                        completada
                                                                                                            ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
                                                                                                            : enRepaso
                                                                                                                ? 'border-amber-300/40 bg-amber-400/15 text-amber-100'
                                                                                                            : 'border-white/15 bg-white/[0.04] text-white/65 hover:border-cyan-300/35 hover:text-cyan-100'
                                                                                                    }`}
                                                                                                    aria-label={completada ? 'Marcar sesión como pendiente' : 'Marcar sesión como hecha'}
                                                                                                    title={completada ? 'Quitar de hechas' : 'Marcar como hecha'}
                                                                                                >
                                                                                                    <CheckCircle2 className={`h-2.5 w-2.5 ${completada ? 'text-emerald-300' : 'text-white/40'}`} />
                                                                                                    <span className="hidden xl:inline">{completada ? 'estudiado' : 'pendiente'}</span>
                                                                                                </button>
                                                                                            </div>
                                                                                            <p
                                                                                                className={`line-clamp-2 text-[11px] font-semibold capitalize leading-tight ${
                                                                                                    completada ? 'text-emerald-100 line-through decoration-emerald-300/70' : 'text-white/90'
                                                                                                }`}
                                                                                                title={item.tema}
                                                                                            >
                                                                                                {item.tema}
                                                                                            </p>
                                                                                            <div className="flex items-center gap-1.5 pt-0.5">
                                                                                                <span className="text-[8px] font-black text-white/40">
                                                                                                    R{item.repaso}/5
                                                                                                </span>
                                                                                                <div className="flex flex-1 gap-[2px]">
                                                                                                    {[1, 2, 3, 4, 5].map((n) => (
                                                                                                        <div
                                                                                                            key={n}
                                                                                                            className={`h-[3px] flex-1 rounded-full ${
                                                                                                                n <= item.repaso ? v.dot : 'bg-white/10'
                                                                                                            }`}
                                                                                                        />
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <div className="flex h-full min-h-[80px] flex-col items-center justify-center gap-1 px-2 py-3 text-center">
                                                                                <Coffee className="h-4 w-4 text-white/25" />
                                                                                <p className="text-[10px] font-bold text-white/45">Día libre</p>
                                                                                <p className="text-[9px] leading-tight text-white/30">
                                                                                    Repaso ligero opcional
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    )}
                                    
                                    {/* Vista de Lista */}
                                    {vistaPlan === 'lista' && (
                                    <div className="space-y-2.5">
                                        {planGlobal.diasPlan.map((dia) => {
                                            const hoyKey = new Date().toISOString().slice(0, 10);
                                            const esHoy = dia.key === hoyKey;
                                            const dow = diaSemanaIndex(dia.fecha);
                                            const horas = Math.round((dia.minutosTotales / 60) * 10) / 10;
                                            const altaCount = dia.items.filter((i) => i.prioridad === 'alta').length;
                                            return (
                                                <div
                                                    key={dia.key}
                                                    className={`overflow-hidden rounded-xl border ${
                                                        esHoy
                                                            ? 'border-cyan-300/50 bg-cyan-400/[0.05]'
                                                            : 'border-white/10 bg-white/[0.03]'
                                                    }`}
                                                >
                                                    <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${
                                                        esHoy ? 'border-cyan-300/30 bg-cyan-400/[0.08]' : 'border-white/10 bg-white/[0.02]'
                                                    }`}>
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="flex h-9 w-11 flex-col items-center justify-center rounded-lg border border-white/10 bg-slate-950/60">
                                                                <span className="text-[8px] font-black leading-none text-white/55">
                                                                    {DIA_NOMBRES_CORTOS[dow]}
                                                                </span>
                                                                <span className="text-sm font-black leading-none text-white">
                                                                    {dia.fecha.getDate()}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold capitalize text-white">
                                                                    {dia.fecha.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long' })}
                                                                </p>
                                                                <p className="text-[11px] text-white/50">
                                                                    {dia.items.length} sesion{dia.items.length === 1 ? '' : 'es'}
                                                                </p>
                                                            </div>
                                                            {esHoy && (
                                                                <span className="rounded-full bg-cyan-400/25 px-2 py-0.5 text-[9px] font-black text-cyan-100 ring-1 ring-cyan-300/40">
                                                                    hoy
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {altaCount > 0 && (
                                                                <span className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-200">
                                                                    <Flame className="h-3 w-3" />
                                                                    {altaCount}
                                                                </span>
                                                            )}
                                                            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-bold text-white/85">
                                                                <Clock className="h-3 w-3 text-cyan-300" />
                                                                {horas}h
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5 p-2">
                                                        {dia.items.map((item) => {
                                                            const v = MATERIA_VISUAL[item.materia] || MATERIA_FALLBACK;
                                                            const Icon = v.Icon;
                                                            const estadoSesion = obtenerEstadoSesion(item.key);
                                                            const completada = estadoSesion === 'estudiado';
                                                            const enRepaso = estadoSesion === 'repasar';
                                                            return (
                                                                <div
                                                                    key={item.key}
                                                                    onClick={() => setSesionSeleccionada({
                                                                    key: item.key,
                                                                        materia: item.materia,
                                                                        tema: item.tema,
                                                                        minutos: item.minutos,
                                                                        prioridad: item.prioridad,
                                                                        repaso: item.repaso,
                                                                    fecha: dia.fecha,
                                                                    estado: estadoSesion
                                                                    })}
                                                                    className={`relative overflow-hidden rounded-lg border transition-all cursor-pointer ${
                                                                        completada
                                                                            ? 'border-emerald-400/35 bg-emerald-500/[0.10] hover:border-emerald-300/55'
                                                                            : enRepaso
                                                                                ? 'border-amber-400/40 bg-amber-500/[0.10] hover:border-amber-300/60'
                                                                                : 'border-white/10 bg-slate-950/45 hover:border-white/20 hover:bg-slate-950/65'
                                                                    }`}
                                                                >
                                                                    <div className={`absolute inset-y-0 left-0 w-[3px] ${v.stripe}`} />
                                                                    <div className="flex flex-wrap items-center gap-2 pl-3 pr-2 py-1.5">
                                                                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-[1px] text-[9px] font-black ${v.chip}`}>
                                                                            <Icon className="h-2.5 w-2.5" />
                                                                            {v.short}
                                                                        </span>
                                                                        <p className={`flex-1 min-w-[140px] text-xs font-medium capitalize ${
                                                                            completada ? 'text-emerald-100 line-through decoration-emerald-300/70' : 'text-white/90'
                                                                        }`}>
                                                                            {item.tema}
                                                                        </p>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                marcarSesionComoHecha(item.key);
                                                                            }}
                                                                            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-[1px] text-[9px] font-black transition-colors ${
                                                                                completada
                                                                                    ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
                                                                                    : enRepaso
                                                                                        ? 'border-amber-300/40 bg-amber-400/15 text-amber-100'
                                                                                    : 'border-white/15 bg-white/[0.04] text-white/65 hover:border-cyan-300/35 hover:text-cyan-100'
                                                                            }`}
                                                                            aria-label={completada ? 'Marcar sesión como pendiente' : 'Marcar sesión como hecha'}
                                                                            title={completada ? 'Quitar de hechas' : 'Marcar como hecha'}
                                                                        >
                                                                            <CheckCircle2 className={`h-2.5 w-2.5 ${completada ? 'text-emerald-300' : 'text-white/40'}`} />
                                                                            {completada ? 'estudiado' : 'pendiente'}
                                                                        </button>
                                                                        {item.prioridad === 'alta' && (
                                                                            <span className="inline-flex items-center gap-1 rounded-md border border-rose-400/25 bg-rose-500/10 px-1.5 py-[1px] text-[9px] font-black text-rose-200">
                                                                                <Flame className="h-2.5 w-2.5" />
                                                                                alta
                                                                            </span>
                                                                        )}
                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/55">
                                                                            <span className="text-[8px] font-black text-white/40">R{item.repaso}/5</span>
                                                                            <span className="flex gap-[2px]">
                                                                                {[1, 2, 3, 4, 5].map((n) => (
                                                                                    <span
                                                                                        key={n}
                                                                                        className={`h-[3px] w-2 rounded-full ${
                                                                                            n <= item.repaso ? v.dot : 'bg-white/10'
                                                                                        }`}
                                                                                    />
                                                                                ))}
                                                                            </span>
                                                                        </span>
                                                                        <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-[1px] text-[10px] font-bold text-white/80">
                                                                            <Clock className="h-2.5 w-2.5 text-cyan-300" />
                                                                            {item.minutos}m
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    )}
                            </>
                                )}
                        </div>
                        </div>
                    </AnimateIn>
                )}

                {materiaSeleccionada !== 'plan' && (
                <>
                {/* KPI Cards Premium */}
                <AnimateIn type="scaleUp" delay={0.1} duration={0.6}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        {/* Tu Efectividad */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-500/10 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-4 group"
                        >
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl"></div>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Tu Efectividad</span>
                            <p className="text-3xl font-black text-white mt-1">{estadisticas.porcentaje}%</p>
                            <p className="text-[10px] text-white/40 mt-1">{estadisticas.correctas}/{estadisticas.total} correctas</p>
                            <CheckCircle2 className="absolute right-3 top-3 w-5 h-5 text-emerald-400/30" />
                        </motion.div>

                        {/* Promedio Grupo */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-indigo-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-4 group"
                        >
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-400/20 rounded-full blur-xl"></div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Promedio Grupo</span>
                            <p className="text-3xl font-black text-white mt-1">{promedioGrupo}%</p>
                            <p className="text-[10px] text-white/40 mt-1">{groupStatistics?.metadata?.total_evaluados || 0} estudiantes</p>
                            <Target className="absolute right-3 top-3 w-5 h-5 text-blue-400/30" />
                        </motion.div>

                        {/* vs Promedio */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className={`relative overflow-hidden backdrop-blur-xl rounded-2xl border p-4 group ${diferencia >= 0
                                ? 'bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border-cyan-500/30'
                                : 'bg-gradient-to-br from-rose-500/20 to-orange-500/10 border-rose-500/30'
                                }`}
                        >
                            <div className={`absolute -right-4 -top-4 w-16 h-16 ${diferencia >= 0 ? 'bg-cyan-400/20' : 'bg-rose-400/20'} rounded-full blur-xl`}></div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${diferencia >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>vs Promedio</span>
                            <p className={`text-3xl font-black mt-1 ${diferencia >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                                {diferencia >= 0 ? '+' : ''}{diferencia}%
                            </p>
                            <p className="text-[10px] text-white/40 mt-1">{diferencia >= 0 ? 'Por encima' : 'Por debajo'}</p>
                            {diferencia >= 0 ? <TrendingUp className="absolute right-3 top-3 w-5 h-5 text-cyan-400/30" /> : <TrendingDown className="absolute right-3 top-3 w-5 h-5 text-rose-400/30" />}
                        </motion.div>

                        {/* Puntaje */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className={`relative overflow-hidden bg-gradient-to-br ${materiaActual?.gradient.replace('from-', 'from-').replace('to-', 'to-')}/20 backdrop-blur-xl rounded-2xl border border-white/20 p-4 group`}
                        >
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Puntaje ICFES</span>
                            <p className="text-3xl font-black text-white mt-1">{estudiante.puntajes[materiaSeleccionada]?.puntaje || 0}</p>
                            <p className="text-[10px] text-white/40 mt-1">de 100 puntos</p>
                            <Award className="absolute right-3 top-3 w-5 h-5 text-white/20" />
                        </motion.div>
                    </div>
                </AnimateIn>

                {/* Insights Personalizados */}
                <AnimateIn type="fadeRight" delay={0.2} duration={0.6}>
                    {analisisPersonal && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-3 mb-6"
                        >
                            {/* Lista de Mejores Logros - Expandible */}
                            {analisisPersonal.logros.length > 0 && (
                                <div className="bg-gradient-to-r from-emerald-500/10 to-transparent backdrop-blur-xl rounded-2xl border border-emerald-500/20 overflow-hidden">
                                    <button
                                        onClick={() => setMostrarLogros(!mostrarLogros)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-emerald-500/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                <Zap className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="currentColor" /></svg> Tus Mejores Logros</p>
                                                <p className="text-white font-bold">{analisisPersonal.logros.length} preguntas difíciles que acertaste</p>
                                            </div>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 transition-transform ${mostrarLogros ? 'rotate-180' : ''}`}>
                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </button>

                                    {/* Lista expandida mejorada */}
                                    {mostrarLogros && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="border-t border-emerald-500/10"
                                        >
                                            {/* Resumen superior */}
                                            <div className="px-4 py-3 bg-emerald-500/5 border-b border-emerald-500/10">
                                                <div className="flex flex-wrap gap-3 text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                                                        <span className="text-white/60">Muy difíciles (&lt;30%):</span>
                                                        <span className="text-purple-400 font-bold">{analisisPersonal.logros.filter(q => q.pctGrupo < 30).length}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
                                                        <span className="text-white/60">Difíciles (30-50%):</span>
                                                        <span className="text-cyan-400 font-bold">{analisisPersonal.logros.filter(q => q.pctGrupo >= 30 && q.pctGrupo < 50).length}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                                        <span className="text-white/60">Moderadas:</span>
                                                        <span className="text-emerald-400 font-bold">{analisisPersonal.logros.filter(q => q.pctGrupo >= 50).length}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                                                {analisisPersonal.logros.map((q, idx) => {
                                                    const esMuyDificil = q.pctGrupo < 30;
                                                    const esDificil = q.pctGrupo >= 30 && q.pctGrupo < 50;

                                                    return (
                                                        <motion.button
                                                            key={q.numero}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.03 }}
                                                            onClick={() => abrirPregunta(q)}
                                                            className={`w-full rounded-xl overflow-hidden border transition-all group ${esMuyDificil
                                                                ? 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10'
                                                                : esDificil
                                                                    ? 'bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10'
                                                                    : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10'
                                                                }`}
                                                        >
                                                            <div className="p-3">
                                                                <div className="flex items-start gap-3">
                                                                    {/* Número de pregunta */}
                                                                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${esMuyDificil ? 'bg-purple-500' : esDificil ? 'bg-cyan-500' : 'bg-emerald-500'
                                                                        }`}>
                                                                        <span className="text-white font-bold text-sm">{q.numero}</span>
                                                                    </div>

                                                                    {/* Info principal */}
                                                                    <div className="flex-1 min-w-0 text-left">
                                                                        <div className="flex items-center gap-2 mb-1.5">
                                                                            {/* Tag de dificultad */}
                                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${esMuyDificil
                                                                                ? 'bg-purple-500/20 text-purple-400'
                                                                                : esDificil
                                                                                    ? 'bg-cyan-500/20 text-cyan-400'
                                                                                    : 'bg-emerald-500/20 text-emerald-400'
                                                                                }`}>
                                                                                {esMuyDificil ? <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 9l10 13L22 9 12 2zm0 3.2L5.5 9 12 18.3 18.5 9 12 5.2z" /></svg> Difícil</> : esDificil ? <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="currentColor" /></svg> Difícil</> : <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg> Logro</>}
                                                                            </span>
                                                                            <span className="text-emerald-400 text-[9px] font-bold flex items-center gap-0.5"><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744z" clipRule="evenodd" /></svg> ¡Acertaste!</span>
                                                                        </div>

                                                                        {/* Barra de porcentaje invertida */}
                                                                        <div className="mb-2">
                                                                            <div className="flex items-center justify-between text-[10px] mb-1">
                                                                                <span className="text-white/50">% del grupo que acertó</span>
                                                                                <span className={`font-bold ${esMuyDificil ? 'text-purple-400' : esDificil ? 'text-cyan-400' : 'text-emerald-400'}`}>{q.pctGrupo}%</span>
                                                                            </div>
                                                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all ${esMuyDificil ? 'bg-purple-500' : esDificil ? 'bg-cyan-500' : 'bg-emerald-500'
                                                                                        }`}
                                                                                    style={{ width: `${q.pctGrupo}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Respuesta */}
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            <span className="text-white/40">Tu respuesta correcta:</span>
                                                                            <span className="w-6 h-6 rounded bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold">{q.respuesta_correcta}</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Chevron */}
                                                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0 mt-3" />
                                                                </div>
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>

                                            {/* Footer con tip */}
                                            <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-transparent border-t border-emerald-500/10">
                                                <p className="text-[10px] text-emerald-400/70 flex items-center gap-1.5">
                                                    <Award className="w-3 h-3" />
                                                    <span>¡Excelente! Acertaste preguntas que la mayoría falló - muestra <strong className="text-emerald-400">dominio del tema</strong></span>
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* Lista de Preguntas para Repasar - Expandible */}
                            {analisisPersonal.paraRepasar.length > 0 && (
                                <div className="bg-gradient-to-r from-amber-500/10 to-transparent backdrop-blur-xl rounded-2xl border border-amber-500/20 overflow-hidden">
                                    <button
                                        onClick={() => setMostrarRepasar(!mostrarRepasar)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-amber-500/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Para Repasar</p>
                                                <p className="text-white font-bold">{analisisPersonal.paraRepasar.length} preguntas que deberías revisar</p>
                                            </div>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 transition-transform ${mostrarRepasar ? 'rotate-180' : ''}`}>
                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </button>

                                    {/* Lista expandida mejorada */}
                                    {mostrarRepasar && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="border-t border-amber-500/10"
                                        >
                                            {/* Resumen superior */}
                                            <div className="px-4 py-3 bg-amber-500/5 border-b border-amber-500/10">
                                                <div className="flex flex-wrap gap-3 text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                                                        <span className="text-white/60">Fáciles falladas:</span>
                                                        <span className="text-rose-400 font-bold">{analisisPersonal.paraRepasar.filter(q => q.pctGrupo >= 60).length}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                                        <span className="text-white/60">Medias falladas:</span>
                                                        <span className="text-amber-400 font-bold">{analisisPersonal.paraRepasar.filter(q => q.pctGrupo >= 40 && q.pctGrupo < 60).length}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                                                        <span className="text-white/60">Difíciles:</span>
                                                        <span className="text-purple-400 font-bold">{analisisPersonal.paraRepasar.filter(q => q.pctGrupo < 40).length}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                                                {analisisPersonal.paraRepasar.map((q, idx) => {
                                                    const esFacil = q.pctGrupo >= 60;
                                                    const esMedia = q.pctGrupo >= 40 && q.pctGrupo < 60;
                                                    const esDificil = q.pctGrupo < 40;

                                                    return (
                                                        <motion.button
                                                            key={q.numero}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.03 }}
                                                            onClick={() => abrirPregunta(q)}
                                                            className={`w-full rounded-xl overflow-hidden border transition-all group ${esFacil
                                                                ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/10'
                                                                : esMedia
                                                                    ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10'
                                                                    : 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10'
                                                                }`}
                                                        >
                                                            <div className="p-3">
                                                                <div className="flex items-start gap-3">
                                                                    {/* Número de pregunta */}
                                                                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${esFacil ? 'bg-rose-500' : esMedia ? 'bg-amber-500' : 'bg-purple-600'
                                                                        }`}>
                                                                        <span className="text-white font-bold text-sm">{q.numero}</span>
                                                                    </div>

                                                                    {/* Info principal */}
                                                                    <div className="flex-1 min-w-0 text-left">
                                                                        <div className="flex items-center gap-2 mb-1.5">
                                                                            {/* Tag de prioridad */}
                                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${esFacil
                                                                                ? 'bg-rose-500/20 text-rose-400'
                                                                                : esMedia
                                                                                    ? 'bg-amber-500/20 text-amber-400'
                                                                                    : 'bg-purple-500/20 text-purple-400'
                                                                                }`}>
                                                                                {esFacil ? <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" /></svg> Prioritaria</> : esMedia ? <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Media</> : <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> Difícil</>}
                                                                            </span>
                                                                        </div>

                                                                        {/* Barra de porcentaje */}
                                                                        <div className="mb-2">
                                                                            <div className="flex items-center justify-between text-[10px] mb-1">
                                                                                <span className="text-white/50">% del grupo que acertó</span>
                                                                                <span className={`font-bold ${esFacil ? 'text-rose-400' : esMedia ? 'text-amber-400' : 'text-purple-400'}`}>{q.pctGrupo}%</span>
                                                                            </div>
                                                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all ${esFacil ? 'bg-rose-500' : esMedia ? 'bg-amber-500' : 'bg-purple-500'
                                                                                        }`}
                                                                                    style={{ width: `${q.pctGrupo}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Respuestas */}
                                                                        <div className="flex items-center gap-3 text-xs">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="text-white/40">Tu respuesta:</span>
                                                                                <span className="w-6 h-6 rounded bg-rose-500/30 text-rose-300 flex items-center justify-center font-bold">{q.respuesta_estudiante}</span>
                                                                            </div>
                                                                            <div className="text-white/20">→</div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="text-white/40">Correcta:</span>
                                                                                <span className="w-6 h-6 rounded bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold">{q.respuesta_correcta}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Chevron */}
                                                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0 mt-3" />
                                                                </div>
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>

                                            {/* Footer con tip */}
                                            <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-transparent border-t border-amber-500/10">
                                                <p className="text-[10px] text-amber-400/70 flex items-center gap-1.5">
                                                    <Zap className="w-3 h-3" />
                                                    <span>Prioriza las preguntas <strong className="text-amber-400">fáciles</strong> que fallaste - son puntos recuperables rápidamente</span>
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimateIn>

                {/* Toggle Vista */}
                <AnimateIn type="fadeUp" delay={0.3} duration={0.6}>
                    {false && analisisTemas.disponible && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-5 overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-950/70 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl"
                        >
                            <div className="relative p-4 sm:p-5 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.20),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.72))]">
                                <div className="absolute right-4 top-4 hidden sm:block rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-amber-200">
                                    BETA
                                </div>
                                <div className="max-w-3xl">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">
                                            <Target className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-white">Plan de estudio inteligente</h3>
                                            <p className="text-xs text-white/45">Edición especial para este simulacro. Úsalo como guía beta, no como diagnóstico definitivo.</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {[
                                            { label: 'Meta', value: analisisTemas.resumenPlan.fechaObjetivo },
                                            { label: 'Días disponibles', value: `${analisisTemas.resumenPlan.diasDisponibles}` },
                                            { label: 'Horas/semana', value: `${analisisTemas.resumenPlan.horasSemana}h` },
                                            { label: 'Total estimado', value: `${analisisTemas.resumenPlan.horasTotales}h` },
                                        ].map((item) => (
                                            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                                                <p className="text-[10px] uppercase tracking-wider text-white/35">{item.label}</p>
                                                <p className="mt-1 text-lg font-black text-white">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                                <div className="space-y-4 lg:w-[42%] xl:w-[40%]">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Intensidad</p>
                                            <span className="text-[10px] text-cyan-200">{analisisTemas.resumenPlan.horasDia}h por día de estudio</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {([
                                                { id: 'ligero' as IntensidadPlan, label: 'Ligero', desc: 'Sostener' },
                                                { id: 'normal' as IntensidadPlan, label: 'Normal', desc: 'Balance' },
                                                { id: 'intensivo' as IntensidadPlan, label: 'Intensivo', desc: 'Sprint' },
                                            ]).map((nivel) => (
                                                <button
                                                    key={nivel.id}
                                                    onClick={() => aplicarIntensidadPlan(nivel.id)}
                                                    className={`rounded-2xl border p-3 text-left transition-all ${
                                                        intensidadPlan === nivel.id
                                                            ? 'border-cyan-300/50 bg-cyan-400/15 shadow-lg shadow-cyan-950/30'
                                                            : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                                                    }`}
                                                >
                                                    <p className={`text-xs font-black ${intensidadPlan === nivel.id ? 'text-cyan-200' : 'text-white/70'}`}>{nivel.label}</p>
                                                    <p className="mt-1 text-[10px] text-white/35">{nivel.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                                        <div className="mb-3 flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-amber-300" />
                                            <p className="text-xs font-black text-white">Ruta de 7 días</p>
                                        </div>
                                        <div className="space-y-3">
                                            {analisisTemas.plan7Dias.length ? analisisTemas.plan7Dias.map((p, idx) => (
                                                <div key={`${p.dia}-${p.foco}`} className="relative pl-8">
                                                    <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/15 text-[10px] font-black text-cyan-200 ring-1 ring-cyan-300/20">
                                                        {idx + 1}
                                                    </div>
                                                    <p className="text-xs font-bold text-white">{p.foco}</p>
                                                    <p className="mt-0.5 text-[11px] leading-relaxed text-white/45">{p.accion}</p>
                                                </div>
                                            )) : (
                                                <p className="text-xs text-white/50">No hay plan sugerido para esta materia.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 lg:w-[58%] xl:w-[60%]">
                                    <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-3">
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="text-xs font-black text-rose-100">Focos prioritarios</p>
                                            <span className="rounded-full bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold text-rose-200">fallos recuperables</span>
                                        </div>
                                        <div className="space-y-3">
                                            {analisisTemas.aReforzar.length ? analisisTemas.aReforzar.map((t, idx) => {
                                                const precision = Math.max(0, Math.min(100, t.porcentaje));
                                                return (
                                                    <div key={t.tema} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-xs font-bold text-white">{idx + 1}. {t.tema}</p>
                                                                <p className="mt-1 text-[11px] text-white/40">{t.errores} error{t.errores === 1 ? '' : 'es'} en {t.total} pregunta{t.total === 1 ? '' : 's'} · evidencia {t.evidencia}</p>
                                                            </div>
                                                            <span className="rounded-full bg-rose-400/15 px-2 py-1 text-[10px] font-black text-rose-200">{100 - precision}% riesgo</span>
                                                        </div>
                                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                                                            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${100 - precision}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <p className="text-xs text-white/50">Sin focos críticos en esta materia.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid items-start gap-4 md:grid-cols-2">
                                        <div className="self-start rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-3">
                                            <div className="mb-3 flex items-center gap-2">
                                                <Award className="h-4 w-4 text-emerald-300" />
                                                <p className="text-xs font-black text-emerald-100">Fortalezas</p>
                                            </div>
                                            <div className="space-y-2">
                                                {analisisTemas.dominados.length ? analisisTemas.dominados.map((t) => (
                                                    <div key={t.tema} className="rounded-xl bg-white/[0.04] p-2 text-xs">
                                                        <p className="font-semibold text-white/85">{t.tema}</p>
                                                        <p className="text-[10px] text-white/40">{t.aciertos} acierto{t.aciertos === 1 ? '' : 's'} en {t.total} pregunta{t.total === 1 ? '' : 's'} · {t.porcentaje}%</p>
                                                    </div>
                                                )) : (
                                                    <div className="rounded-xl border border-emerald-300/15 bg-white/[0.03] p-3">
                                                        <p className="text-xs text-white/55">Aún no hay evidencia fuerte de dominio.</p>
                                                        <p className="mt-1 text-[10px] text-white/35">Cuando aciertes 2+ preguntas del mismo tema, aparecerá aquí.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="self-start rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.05] p-3">
                                            <div className="mb-3 flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-cyan-300" />
                                                <p className="text-xs font-black text-cyan-100">Recomendación IA</p>
                                            </div>
                                            <div className="space-y-2">
                                                {analisisTemas.recomendacionesIA.length ? analisisTemas.recomendacionesIA.map((r) => (
                                                    <div key={r.tema} className="rounded-xl bg-white/[0.04] p-2 text-xs">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="font-semibold text-white/85">{r.tema}</p>
                                                            <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-200">{r.prioridad}</span>
                                                        </div>
                                                        <p className="mt-1 text-[10px] leading-relaxed text-white/45">{r.mensaje}</p>
                                                    </div>
                                                )) : <p className="text-xs text-white/50">Sin recomendaciones críticas por ahora.</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {analisisTemas.rubricas.length > 0 && (
                                        <div className="self-start rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-3">
                                            <div className="mb-3 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-violet-300" />
                                                    <p className="text-xs font-black text-violet-100">Rúbricas por cumplir</p>
                                                </div>
                                                <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] font-bold text-violet-200">
                                                    personalizado
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                {analisisTemas.rubricas.map((r) => (
                                                    <div key={r.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                            <div>
                                                                <p className="text-xs font-bold text-white">{r.tema}</p>
                                                                <p className="mt-1 text-[11px] leading-relaxed text-white/45">{r.criterio}</p>
                                                            </div>
                                                            <div className="shrink-0 rounded-xl bg-white/[0.05] px-3 py-2 text-right">
                                                                <p className="text-[10px] text-white/35">Estado actual</p>
                                                                <p className="text-xs font-black text-violet-200">{r.estado}</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                            <div className="rounded-xl bg-white/[0.04] p-2">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Meta</p>
                                                                <p className="mt-1 text-[11px] text-white/65">{r.meta}</p>
                                                            </div>
                                                            <div className="rounded-xl bg-white/[0.04] p-2">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Evidencia usada</p>
                                                                <p className="mt-1 text-[11px] text-white/65">{r.evidencia}</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3">
                                                            <div className="mb-2 flex items-center justify-between text-[10px]">
                                                                <span className="text-white/35">Cumplimiento observado</span>
                                                                <span className="font-bold text-violet-200">{r.estadoPct}%</span>
                                                            </div>
                                                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                                                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${r.estadoPct}%` }} />
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
                                                            {r.checklist.map((item) => (
                                                                <div key={item} className="flex items-start gap-1.5 rounded-xl bg-white/[0.03] p-2 text-[10px] text-white/55">
                                                                    <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full border border-violet-300/40" />
                                                                    <span>{item}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            </div>
                        </motion.div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <BarChart className="w-4 h-4 text-white/40" />
                            {vistaHeatmap ? 'Mapa de Respuestas' : 'Lista Detallada'}
                        </h3>
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                            <button
                                onClick={() => setVistaHeatmap(true)}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${vistaHeatmap ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                Heatmap
                            </button>
                            <button
                                onClick={() => setVistaHeatmap(false)}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${!vistaHeatmap ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                Lista
                            </button>
                        </div>
                    </div>
                </AnimateIn>

                {/* Vista Heatmap - Segmentado por Sesiones ICFES */}
                {vistaHeatmap ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4 mb-6"
                    >
                        {/* Segmentar por sesiones usando campo 'sesion' del pipeline, con fallback inteligente */}
                        {(() => {
                            // Lectura Crítica e Inglés son siempre sesión única
                            const esSesionUnica = materiaSeleccionada === 'lectura crítica' || materiaSeleccionada === 'inglés';

                            let sesion1: RespuestaDetallada[] = [];
                            let sesion2: RespuestaDetallada[] = [];

                            if (esSesionUnica) {
                                sesion1 = [...respuestasMateria].sort((a, b) => a.numero - b.numero);
                            } else {
                                // Matemáticas, Sociales, Ciencias: siempre 2 sesiones
                                // Prioridad 1: usar campo 'sesion' guardado por el pipeline (datos nuevos)
                                const tieneTagSesion = respuestasMateria.some(r => (r as any).sesion);
                                if (tieneTagSesion) {
                                    sesion1 = [...respuestasMateria]
                                        .filter(r => (r as any).sesion === 'S1')
                                        .sort((a, b) => a.numero - b.numero);
                                    sesion2 = [...respuestasMateria]
                                        .filter(r => (r as any).sesion === 'S2')
                                        .sort((a, b) => a.numero - b.numero);
                                } else {
                                    // Fallback para datos viejos sin campo 'sesion'
                                    // IMPORTANTE: Matemáticas NO reinicia numeración (S1: 1-25, S2: 26-50)
                                    //             Sociales y Ciencias SÍ reinician (S1: 1-25, S2: 1-25)
                                    const sorted = [...respuestasMateria].sort((a, b) => a.numero - b.numero);
                                    
                                    // Detectar salto hacia atrás (Sociales/Ciencias)
                                    let splitIdx = -1;
                                    for (let i = 1; i < sorted.length; i++) {
                                        if (sorted[i].numero < sorted[i - 1].numero) {
                                            splitIdx = i;
                                            break;
                                        }
                                    }
                                    
                                    if (splitIdx > 0) {
                                        // Hay salto hacia atrás: dividir ahí
                                        sesion1 = sorted.slice(0, splitIdx);
                                        sesion2 = sorted.slice(splitIdx);
                                    } else {
                                        // Sin salto: dividir por mitad (caso Matemáticas con numeración continua)
                                        const mitad = Math.ceil(sorted.length / 2);
                                        sesion1 = sorted.slice(0, mitad);
                                        sesion2 = sorted.slice(mitad);
                                    }
                                }
                            }

                            // Función para renderizar cada celda
                            const renderCell = (resp: RespuestaDetallada) => {
                                const esAnulada = esAnuladaOInvalidada(resp, materiaSeleccionada);
                                const sesionNa = !esAnulada && esSesionNoPresentada(resp);
                                const sinRespuesta = !esAnulada && esSinRespuesta(resp);
                                const stats = metricasPreguntas[resp.numero];
                                const dificultad = stats ? Math.round((stats.correctas / stats.Total) * 100) : 50;

                                let bgColor = 'bg-emerald-500';
                                let borderColor = 'border-emerald-400/30';
                                let shadowColor = 'shadow-emerald-500/20';

                                if (esAnulada) {
                                    bgColor = 'bg-slate-500';
                                    borderColor = 'border-slate-400/30';
                                    shadowColor = 'shadow-slate-500/20';
                                } else if (sesionNa) {
                                    bgColor = 'bg-amber-500';
                                    borderColor = 'border-amber-400/40';
                                    shadowColor = 'shadow-amber-500/25';
                                } else if (sinRespuesta) {
                                    bgColor = 'bg-violet-500';
                                    borderColor = 'border-violet-400/40';
                                    shadowColor = 'shadow-violet-500/25';
                                } else if (!resp.es_correcta) {
                                    if (dificultad < 40) {
                                        bgColor = 'bg-amber-500';
                                        borderColor = 'border-amber-400/30';
                                        shadowColor = 'shadow-amber-500/20';
                                    } else {
                                        bgColor = 'bg-rose-500';
                                        borderColor = 'border-rose-400/30';
                                        shadowColor = 'shadow-rose-500/20';
                                    }
                                }

                                return (
                                    <motion.button
                                        key={resp.numero}
                                        whileHover={{ scale: 1.15, zIndex: 10 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => abrirPregunta(resp)}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${bgColor} ${borderColor} border flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-md ${shadowColor} hover:shadow-lg transition-all cursor-pointer relative group`}
                                    >
                                        {resp.numero}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10">
                                            {esAnulada ? <><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Anulada</> : sesionNa ? <><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> N/A · sesión no presentada</> : sinRespuesta ? <><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Sin respuesta</> : resp.es_correcta ? <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Correcta</> : <><svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Incorrecta ({dificultad}% acertó)</>}
                                        </div>
                                    </motion.button>
                                );
                            };

                            // Función para renderizar sesión
                            const renderSession = (respuestas: RespuestaDetallada[], sesionLabel: string, sesionDesc: string, colorAccent: string) => {
                                if (respuestas.length === 0) return null;

                                const correctas = respuestas.filter(r => r.es_correcta).length;
                                const anuladas = respuestas.filter(r => esAnuladaOInvalidada(r, materiaSeleccionada)).length;
                                const total = respuestas.length - anuladas;
                                const pct = total > 0 ? Math.round((correctas / total) * 100) : 0;

                                const first = respuestas[0]?.numero || 0;
                                const last = respuestas[respuestas.length - 1]?.numero || 0;

                                return (
                                    <div key={sesionLabel} className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden`}>
                                        {/* Header de sesión */}
                                        <div className={`px-4 py-2.5 border-b border-white/10 bg-gradient-to-r ${colorAccent} to-transparent`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                                                        {sesionLabel}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm">{sesionDesc}</h4>
                                                        <p className="text-white/40 text-[10px]">Preguntas {first} - {last}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${pct >= 70 ? 'bg-emerald-500/20 text-emerald-400' : pct >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                    {correctas}/{total} ({pct}%)
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grid de respuestas */}
                                        <div className="p-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {respuestas.map(renderCell)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            };

                            // Determinar etiquetas según la materia
                            const esUnicaSesion = esSesionUnica;
                            const esIngles = materiaSeleccionada === 'inglés';

                            if (respuestasMateria.length === 0) {
                                return (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center"
                                    >
                                        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-400" />
                                        <p className="text-sm font-bold text-white">
                                            No hay preguntas cargadas para esta materia
                                        </p>
                                        <p className="mt-2 text-xs text-white/50">
                                            Los puntajes sí están en Firebase; el detalle por ítem no llegó al navegador
                                            (caché vieja o límite de lecturas). Prueba recargar sin caché.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const sid = localStorage.getItem('student_id');
                                                const sim =
                                                    localStorage.getItem('simulacro_selected') || simulacroActivo;
                                                if (sid && sim) {
                                                    const { clearStudentSimulationCaches } =
                                                        await resolveEstudianteDataModule();
                                                    clearStudentSimulationCaches(sid, sim);
                                                }
                                                setLoading(true);
                                                void loadData();
                                            }}
                                            className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
                                        >
                                            Reintentar carga
                                        </button>
                                    </motion.div>
                                );
                            }

                            return (
                                <>
                                    {sesion1.length > 0 && renderSession(
                                        sesion1,
                                        esUnicaSesion ? 'S1' : 'S1',
                                        esUnicaSesion ? 'Sesión Única' : 'Primera Jornada',
                                        'from-blue-500/20'
                                    )}
                                    {sesion2.length > 0 && renderSession(
                                        sesion2,
                                        esIngles && esUnicaSesion ? 'S2' : 'S2',
                                        esIngles && esUnicaSesion ? 'Sesión Única' : 'Segunda Jornada',
                                        'from-purple-500/20'
                                    )}
                                </>
                            );
                        })()}

                        {/* Leyenda compacta */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 px-4 py-3">
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <div className="w-4 h-4 rounded bg-emerald-500 shadow-sm"></div>
                                    <span>Correcta</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <div className="w-4 h-4 rounded bg-rose-500 shadow-sm"></div>
                                    <span>Incorrecta (fácil)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <div className="w-4 h-4 rounded bg-amber-500 shadow-sm"></div>
                                    <span>Incorrecta (difícil)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <div className="w-4 h-4 rounded bg-slate-500 shadow-sm"></div>
                                    <span>Anulada</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <div className="w-4 h-4 rounded bg-violet-500 shadow-sm ring-1 ring-violet-300/40"></div>
                                    <span>N/A</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* Vista Lista */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4 mb-6"
                    >
                        {/* Misma lógica de detección de sesiones que el heatmap */}
                        {(() => {
                            const esSesionUnica = materiaSeleccionada === 'lectura crítica' || materiaSeleccionada === 'inglés';

                            let sesion1: RespuestaDetallada[] = [];
                            let sesion2: RespuestaDetallada[] = [];

                            if (esSesionUnica) {
                                sesion1 = [...respuestasMateria].sort((a, b) => a.numero - b.numero);
                            } else {
                                const tieneTagSesion = respuestasMateria.some(r => (r as any).sesion);
                                if (tieneTagSesion) {
                                    sesion1 = [...respuestasMateria].filter(r => (r as any).sesion === 'S1').sort((a, b) => a.numero - b.numero);
                                    sesion2 = [...respuestasMateria].filter(r => (r as any).sesion === 'S2').sort((a, b) => a.numero - b.numero);
                                } else {
                                    // Fallback: mismo que en vista heatmap
                                    const sorted = [...respuestasMateria].sort((a, b) => a.numero - b.numero);
                                    let splitIdx = -1;
                                    for (let i = 1; i < sorted.length; i++) {
                                        if (sorted[i].numero < sorted[i - 1].numero) { splitIdx = i; break; }
                                    }
                                    if (splitIdx > 0) {
                                        sesion1 = sorted.slice(0, splitIdx);
                                        sesion2 = sorted.slice(splitIdx);
                                    } else {
                                        sesion1 = sorted;
                                    }
                                }
                            }

                            const renderListSession = (respuestas: RespuestaDetallada[], sesionLabel: string, sesionDesc: string, colorAccent: string) => {
                                if (respuestas.length === 0) return null;

                                const correctas = respuestas.filter(r => r.es_correcta).length;
                                const anuladas = respuestas.filter(r => esAnuladaOInvalidada(r, materiaSeleccionada)).length;
                                const total = respuestas.length - anuladas;
                                const pct = total > 0 ? Math.round((correctas / total) * 100) : 0;
                                const first = respuestas[0]?.numero || 0;
                                const last = respuestas[respuestas.length - 1]?.numero || 0;

                                return (
                                    <div key={sesionLabel} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                                        {/* Header de sesión */}
                                        <div className={`px-4 py-3 border-b border-white/10 bg-gradient-to-r ${colorAccent} to-transparent`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                                                        {sesionLabel}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm">{sesionDesc}</h4>
                                                        <p className="text-white/40 text-[10px]">Preguntas {first} - {last}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${pct >= 70 ? 'bg-emerald-500/20 text-emerald-400' : pct >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                    {correctas}/{total} ({pct}%)
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tabla de respuestas */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-white/5 text-white/40 text-[10px] uppercase font-bold tracking-wider border-b border-white/10">
                                                        <th className="py-2.5 px-4 text-left w-16">#</th>
                                                        <th className="py-2.5 px-4 text-center">Tu Resp.</th>
                                                        <th className="py-2.5 px-4 text-center">Correcta</th>
                                                        <th className="py-2.5 px-4 text-center">Estado</th>
                                                        <th className="py-2.5 px-4 text-center hidden sm:table-cell">% Grupo</th>
                                                        <th className="py-2.5 px-4 text-right"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {respuestas.map((resp, idx) => {
                                                        const esAnulada = esAnuladaOInvalidada(resp, materiaSeleccionada);
                                                        const sesionNa = !esAnulada && esSesionNoPresentada(resp);
                                                        const sinRespuesta = !esAnulada && esSinRespuesta(resp);
                                                        const stats = metricasPreguntas[resp.numero];
                                                        const pctGrupo = stats ? Math.round((stats.correctas / stats.Total) * 100) : 0;

                                                        return (
                                                            <motion.tr
                                                                key={resp.numero}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                transition={{ delay: idx * 0.02 }}
                                                                onClick={() => abrirPregunta(resp)}
                                                                className="group hover:bg-white/5 cursor-pointer transition-colors"
                                                            >
                                                                <td className="py-2.5 px-4 font-bold text-white/40 group-hover:text-white">{resp.numero}</td>
                                                                <td className="py-2.5 px-4 text-center">
                                                                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-lg font-bold text-xs ${esAnulada ? 'bg-slate-500/50 text-white/50' : sesionNa ? 'bg-amber-500/90 text-white ring-1 ring-amber-300/40' : sinRespuesta ? 'bg-violet-500/90 text-white ring-1 ring-violet-300/40' : resp.es_correcta ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                                        {sesionNa ? 'N/A' : sinRespuesta ? '—' : (resp.respuesta_estudiante || '-')}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 px-4 text-center">
                                                                    {esAnulada ? (
                                                                        <span className="text-white/30">-</span>
                                                                    ) : (
                                                                        <span className="font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded text-xs">{resp.respuesta_correcta}</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2.5 px-4 text-center">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${esAnulada ? 'bg-slate-500/20 text-slate-400' : sesionNa ? 'bg-amber-500/20 text-amber-300' : sinRespuesta ? 'bg-violet-500/20 text-violet-300' : resp.es_correcta ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                                        {esAnulada ? 'ANUL' : sesionNa ? 'N/A sesión' : sinRespuesta ? 'Sin resp.' : resp.es_correcta ? 'OK' : 'FAIL'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2.5 px-4 text-center hidden sm:table-cell">
                                                                    {!esAnulada && (
                                                                        <span className={`text-xs font-bold ${pctGrupo >= 60 ? 'text-emerald-400' : pctGrupo >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                                            {pctGrupo}%
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2.5 px-4 text-right">
                                                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                                                                </td>
                                                            </motion.tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            };

                            const esUnicaSesion = esSesionUnica;
                            const esIngles = materiaSeleccionada === 'inglés';

                            return (
                                <>
                                    {sesion1.length > 0 && renderListSession(
                                        sesion1,
                                        'S1',
                                        esUnicaSesion ? 'Sesión Única' : 'Primera Jornada',
                                        'from-blue-500/20'
                                    )}
                                    {sesion2.length > 0 && renderListSession(
                                        sesion2,
                                        'S2',
                                        esIngles ? 'Sesión Única' : 'Segunda Jornada',
                                        'from-purple-500/20'
                                    )}
                                </>
                            );
                        })()}
                    </motion.div>
                )}

                {/* Plan de estudio (debajo de la lista/mapa de preguntas) */}
                {false && analisisTemas.disponible && (
                    <AnimateIn type="fadeUp" delay={0.35} duration={0.6}>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-950/70 backdrop-blur-xl"
                        >
                            <div className="p-4 sm:p-5 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.20),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.72))]">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-cyan-200" />
                                        <h3 className="text-base sm:text-lg font-black text-white">Plan de estudio inteligente</h3>
                                        <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-200">BETA</span>
                                    </div>
                                    <span className="text-xs text-white/60">Solo para este simulacro</span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">
                                    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-2.5">
                                        <p className="text-xs text-white/50">Meta</p>
                                        <p className="text-base font-black text-white">{analisisTemas.resumenPlan.fechaObjetivo}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-2.5">
                                        <p className="text-xs text-white/50">Días</p>
                                        <p className="text-base font-black text-white">{analisisTemas.resumenPlan.diasDisponibles}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-2.5">
                                        <p className="text-xs text-white/50">Horas/semana</p>
                                        <p className="text-base font-black text-white">{analisisTemas.resumenPlan.horasSemana}h</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-2.5">
                                        <p className="text-xs text-white/50">Total</p>
                                        <p className="text-base font-black text-white">{analisisTemas.resumenPlan.horasTotales}h</p>
                                    </div>
                                    <div className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-2.5">
                                        <p className="text-xs text-rose-200/90">Errores reales</p>
                                        <p className="text-base font-black text-rose-100">{analisisTemas.resumenPlan.totalErrores}</p>
                                    </div>
                                    <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-2.5">
                                        <p className="text-xs text-cyan-200/90">Diario sugerido</p>
                                        <p className="text-base font-black text-cyan-100">{analisisTemas.resumenPlan.horasDia}h</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 grid gap-4 xl:grid-cols-12">
                                <div className="xl:col-span-4 space-y-4">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <p className="text-xs font-bold uppercase tracking-wider text-white/55">Intensidad</p>
                                            <span className="text-xs text-cyan-200/95">
                                                {intensidadPlan === 'ligero' ? 'Ligero' : intensidadPlan === 'intensivo' ? 'Intensivo' : 'Normal'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {([
                                                { id: 'ligero' as IntensidadPlan, label: 'Ligero' },
                                                { id: 'normal' as IntensidadPlan, label: 'Normal' },
                                                { id: 'intensivo' as IntensidadPlan, label: 'Intensivo' },
                                            ]).map((nivel) => (
                                                <button
                                                    key={nivel.id}
                                                    type="button"
                                                    aria-pressed={intensidadPlan === nivel.id}
                                                    onClick={() => aplicarIntensidadPlan(nivel.id)}
                                                    className={`rounded-xl border px-2.5 py-2.5 text-xs font-bold transition-all ${
                                                        intensidadPlan === nivel.id
                                                            ? 'border-cyan-300/50 bg-cyan-400/15 text-cyan-100'
                                                            : 'border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25'
                                                    }`}
                                                >
                                                    {nivel.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                                        <p className="mb-2 text-sm font-black text-white">Ruta de 7 días</p>
                                        <div className="space-y-2">
                                            {analisisTemas.plan7Dias.slice(0, 3).map((p, idx) => (
                                                <div key={`${p.dia}-${p.foco}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                                                    <p className="text-sm font-bold text-white">Día {idx + 1}: {p.foco}</p>
                                                    <p className="text-xs text-white/60">{p.accion}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="xl:col-span-8 space-y-4">
                                    <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-3">
                                        <p className="mb-2 text-sm font-black text-rose-100">Focos prioritarios</p>
                                        <div className="space-y-2.5">
                                            {analisisTemas.aReforzar.length ? analisisTemas.aReforzar.map((t, idx) => {
                                                const precision = Math.max(0, Math.min(100, t.porcentaje));
                                                return (
                                                    <div key={t.tema} className="rounded-xl border border-white/10 bg-slate-950/35 p-2.5">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-sm font-bold text-white">{idx + 1}. {t.tema}</p>
                                                            <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[10px] font-bold text-rose-200">{100 - precision}% riesgo</span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-white/60">{t.errores} error{t.errores === 1 ? '' : 'es'} en {t.total} pregunta{t.total === 1 ? '' : 's'} · evidencia {t.evidencia}</p>
                                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                                                            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${100 - precision}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            }) : <p className="text-xs text-white/50">Sin focos críticos en esta materia.</p>}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.05] p-3">
                                            <p className="mb-2 text-sm font-black text-cyan-100">Recomendación IA</p>
                                            <div className="space-y-2">
                                                {analisisTemas.recomendacionesIA.map((r) => (
                                                    <div key={r.tema} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-sm font-semibold text-white/90">{r.tema}</p>
                                                            <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-200">{r.prioridad}</span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-white/60">{r.mensaje}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-3">
                                            <p className="mb-2 text-sm font-black text-violet-100">Rúbricas por cumplir</p>
                                            <div className="space-y-2">
                                                {analisisTemas.rubricas.map((r) => (
                                                    <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                                                        <p className="text-sm font-semibold text-white/90">{r.tema}</p>
                                                        <p className="mt-1 text-xs text-white/60">{r.criterio}</p>
                                                        <p className="mt-1 text-xs text-violet-200">Meta: {r.meta}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimateIn>
                )}

                {/* ========== Informe de Nivel de Desempeño ICFES ========== */}
                {estudiante && materiaSeleccionada !== 'plan' && (
                    <PerformanceLevelReport
                        materia={materiaSeleccionada}
                        puntaje={estudiante.puntajes[materiaSeleccionada]?.puntaje || 0}
                    />
                )}
                </>
                )}

            </main>

            <AnimatePresence>
                {mostrarToastGuardado && materiaSeleccionada === 'plan' && (
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.18 }}
                        className="fixed bottom-5 right-4 z-50 rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-100 shadow-lg backdrop-blur-md"
                    >
                        cambios guardados en este dispositivo
                    </motion.div>
                )}
            </AnimatePresence>

            {preguntaSeleccionada && (
                <PreguntaDetalleModal
                    pregunta={preguntaSeleccionada}
                    materia={materiaSeleccionada}
                    preguntas={respuestasMateria}
                    stats={statsSelected}
                    esInvalidada={esAnuladaOInvalidada(preguntaSeleccionada, materiaSeleccionada)}
                    onClose={cerrarPregunta}
                    onSelect={abrirPregunta}
                    resolveStripColor={resolveHeatmapStripColor}
                />
            )}

            <Modal isOpen={mostrarResumenDiagnosticoModal} onClose={cerrarResumenDiagnosticoModal} maxWidth="5xl">
                <div className="space-y-4 rounded-2xl border border-fuchsia-300/20 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.16),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-4">
                    <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/[0.08] p-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200/90">
                            Resumen real de tu diagnostico
                        </p>
                        <p className="mt-1 text-xs text-white/70">
                            Estos focos salen de tus errores por area, temas con menor dominio y acciones sugeridas para estudiar.
                        </p>
                        <p className="mt-2 text-[11px] font-semibold text-cyan-100/90">
                            Basado en {resumenPlanGlobal.transparencia.preguntasValidas} preguntas validas y {resumenPlanGlobal.transparencia.erroresReales} errores reales (sin contar anuladas).
                        </p>
                        <p className="mt-1 text-[10px] text-cyan-100/75">
                            Recomendaciones validadas desde datos procesados: {resumenPlanGlobal.transparencia.recomendacionesValidadas}.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/55">Errores por area (total materia)</p>
                            <div className="mt-2 space-y-1.5">
                                {resumenPlanGlobal.erroresPorArea.length > 0 ? (
                                    resumenPlanGlobal.erroresPorArea.slice(0, 4).map((item) => {
                                        const v = MATERIA_VISUAL[item.materia] || MATERIA_FALLBACK;
                                        return (
                                            <div key={item.materia} className="flex items-center justify-between gap-2 text-xs">
                                                <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-[1px] ${v.chip}`}>
                                                    {v.label}
                                                </span>
                                                <span className="font-bold text-rose-200">{item.errores} error{item.errores === 1 ? '' : 'es'}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-white/50">Sin errores detectados en las areas evaluadas.</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/55">Temas no dominados (subconjunto del area)</p>
                            <div className="mt-2 space-y-1.5">
                                {resumenPlanGlobal.temasNoDominados.length > 0 ? (
                                    resumenPlanGlobal.temasNoDominados.map((tema) => {
                                        const v = MATERIA_VISUAL[tema.materia] || MATERIA_FALLBACK;
                                        return (
                                            <div key={`${tema.materia}-${tema.tema}`} className="rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1.5">
                                                <p className="text-[11px] font-semibold capitalize text-white/90">{tema.tema}</p>
                                                <p className="mt-0.5 text-[10px] text-white/60">
                                                    {v.label} · {tema.porcentaje}% acierto · {tema.errores} error{tema.errores === 1 ? '' : 'es'} en {tema.total} pregunta{tema.total === 1 ? '' : 's'} del tema
                                                </p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-white/50">No hay temas criticos pendientes en este momento.</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/55">Tutoriales y acciones</p>
                            <div className="mt-2 space-y-1.5">
                                {resumenPlanGlobal.tutorialesSugeridos.length > 0 ? (
                                    resumenPlanGlobal.tutorialesSugeridos.map((item) => (
                                        <div key={`${item.materia}-${item.tema}`} className="rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1.5">
                                            <p className="text-[11px] font-semibold capitalize text-white/90">{item.tema}</p>
                                            <p className="mt-0.5 text-[10px] text-white/60">{item.materia}{item.bloque ? ` · ${item.bloque}` : ''}</p>
                                            <p className="mt-1 text-[10px] leading-tight text-cyan-100/85">{item.recomendacion}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-white/50">Sin recomendaciones validadas en los datos procesados para tus focos actuales.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={cerrarResumenDiagnosticoModal}
                            className="rounded-lg border border-cyan-300/35 bg-cyan-400/15 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-cyan-100 transition-colors hover:bg-cyan-400/25"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Sesión Detallada */}
            <Modal isOpen={!!sesionSeleccionada} onClose={() => setSesionSeleccionada(null)} maxWidth="5xl">
                {(() => {
                    if (!sesionSeleccionada) return null;
                    
                    const v = MATERIA_VISUAL[sesionSeleccionada.materia] || MATERIA_FALLBACK;
                    const Icon = v.Icon;
                    const recomendacion = generarRecomendacionDetallada(
                        sesionSeleccionada.materia,
                        sesionSeleccionada.tema,
                        sesionSeleccionada.prioridad,
                        sesionSeleccionada.repaso,
                        sesionSeleccionada.minutos
                    );
                    
                    const prioridadColor = sesionSeleccionada.prioridad === 'alta'
                        ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
                        : sesionSeleccionada.prioridad === 'media'
                            ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                            : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
                    const repasoPct = Math.max(0, Math.min(100, Math.round((sesionSeleccionada.repaso / 5) * 100)));
                    const contextoRepasoLimpio = recomendacion.contextoRepaso.replace(/^[^\p{L}\p{N}]+/u, '');
                    const estadoSesion = sesionSeleccionada.estado;
                    const textoCta = estadoSesion === 'estudiado' ? 'marcar como pendiente' : 'marcar como estudiado';
                    const variantes = [
                        {
                            id: 'quantum',
                            shell: 'border-cyan-300/25 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_50%),linear-gradient(180deg,rgba(2,6,23,0.95),rgba(15,23,42,0.90))]',
                            badge: 'border-cyan-300/30 bg-cyan-500/10 text-cyan-100',
                            panel: 'border-cyan-300/25 bg-cyan-500/[0.07]',
                            nombre: 'modo quantum',
                            enfoque: 'sesión de precisión analítica'
                        },
                        {
                            id: 'hologram',
                            shell: 'border-fuchsia-300/25 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.18),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.90))]',
                            badge: 'border-fuchsia-300/30 bg-fuchsia-500/10 text-fuchsia-100',
                            panel: 'border-fuchsia-300/25 bg-fuchsia-500/[0.07]',
                            nombre: 'modo holográfico',
                            enfoque: 'sesión de conexión conceptual'
                        },
                        {
                            id: 'neon',
                            shell: 'border-violet-300/25 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.20),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.90))]',
                            badge: 'border-violet-300/30 bg-violet-500/10 text-violet-100',
                            panel: 'border-violet-300/25 bg-violet-500/[0.07]',
                            nombre: 'modo neon',
                            enfoque: 'sesión de automatización práctica'
                        }
                    ] as const;
                    const idxVariante = hashTexto(`${sesionSeleccionada.key}-${sesionSeleccionada.tema}-${sesionSeleccionada.materia}`) % variantes.length;
                    const variante = variantes[idxVariante];
                    const microReto = sesionSeleccionada.prioridad === 'alta'
                        ? `resuelve un mini simulacro de ${sesionSeleccionada.tema} en ${Math.max(12, Math.round(sesionSeleccionada.minutos * 0.35))} minutos.`
                        : `prepara un resumen de ${sesionSeleccionada.tema} y valida comprensión con 3 preguntas propias.`;
                    const evidenciaEsperada = sesionSeleccionada.repaso >= 3
                        ? 'explicar el procedimiento sin apoyo y justificar cada decisión.'
                        : 'resolver un ejercicio guiado y otro independiente con retroalimentación.';

                    return (
                        <div className={`space-y-6 max-h-[90vh] overflow-y-auto rounded-2xl border p-4 pr-2 ${variante.shell}`}>
                            <div className="flex items-center justify-end">
                                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${variante.badge}`}>
                                    {variante.nombre} ·
                                </span>
                                <span className="ml-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-300">
                                    REPASO {sesionSeleccionada.repaso}/5
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${v.chip}`}>
                                        <Icon className="h-3.5 w-3.5" />
                                        {v.label}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${prioridadColor}`}>
                                        <Flame className="h-3.5 w-3.5" />
                                        Prioridad {sesionSeleccionada.prioridad}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-300">
                                        <Clock className="h-3.5 w-3.5" />
                                        {sesionSeleccionada.minutos} min
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black leading-tight text-transparent bg-gradient-to-r from-blue-300 via-cyan-300 to-violet-300 bg-clip-text capitalize">
                                    {sesionSeleccionada.tema}
                                </h3>
                                <p className="flex items-center gap-1.5 text-sm text-slate-400">
                                    <CalendarDays className="h-4 w-4" />
                                    {sesionSeleccionada.fecha.toLocaleDateString('es-CO', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>

                            <div className="rounded-xl border border-blue-400/30 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_50%),rgba(30,58,138,0.25)] p-3">
                                <p className="text-sm text-blue-100">
                                    <span className="font-bold">Tip del día:</span> {contextoRepasoLimpio}
                                </p>
                            </div>

                            <div className={`rounded-xl border p-3 ${variante.panel}`}>
                                <p className="text-[11px] font-black text-white/90">{variante.enfoque}</p>
                                <p className="mt-1 text-xs text-white/70">
                                    reto profesional: {microReto}
                                </p>
                                <p className="mt-1 text-xs text-white/60">
                                    evidencia esperada: {evidenciaEsperada}
                                </p>
                            </div>

                            <div className="rounded-xl border border-fuchsia-400/30 bg-[radial-gradient(circle_at_left,rgba(217,70,239,0.18),transparent_60%),rgba(30,41,59,0.72)] p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-[11px] font-black text-fuchsia-100/85">estado de la sesión</p>
                                    <div className="inline-flex rounded-lg border border-white/15 bg-black/20 p-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSesionEstado(sesionSeleccionada.key, 'pendiente');
                                                setSesionSeleccionada((prev) => prev ? { ...prev, estado: 'pendiente' } : prev);
                                            }}
                                            className={`rounded-md px-2.5 py-1 text-[10px] font-black transition-colors ${
                                                estadoSesion === 'pendiente'
                                                    ? 'bg-white text-slate-900'
                                                    : 'text-white/70 hover:text-white'
                                            }`}
                                        >
                                            pendiente
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSesionEstado(sesionSeleccionada.key, 'estudiado');
                                                setSesionSeleccionada((prev) => prev ? { ...prev, estado: 'estudiado' } : prev);
                                            }}
                                            className={`rounded-md px-2.5 py-1 text-[10px] font-black transition-colors ${
                                                estadoSesion === 'estudiado'
                                                    ? 'bg-emerald-300 text-emerald-950'
                                                    : 'text-white/70 hover:text-white'
                                            }`}
                                        >
                                            estudiado
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSesionEstado(sesionSeleccionada.key, 'repasar');
                                                setSesionSeleccionada((prev) => prev ? { ...prev, estado: 'repasar' } : prev);
                                            }}
                                            className={`rounded-md px-2.5 py-1 text-[10px] font-black transition-colors ${
                                                estadoSesion === 'repasar'
                                                    ? 'bg-amber-300 text-amber-950'
                                                    : 'text-white/70 hover:text-white'
                                            }`}
                                        >
                                            repasar más
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                                <div className="space-y-5 md:col-span-5">
                                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                                        <div className="mb-3 flex items-center gap-2 text-violet-300">
                                            <Target className="h-4 w-4" />
                                            <h4 className="text-xs font-black uppercase tracking-wide text-white">Objetivo de Aprendizaje</h4>
                                        </div>
                                        <p className="text-sm leading-relaxed text-slate-300">{recomendacion.objetivo}</p>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                                        <div className="mb-3 flex items-center gap-2 text-blue-300">
                                            <ListChecks className="h-4 w-4" />
                                            <h4 className="text-xs font-black uppercase tracking-wide text-white">Temas Clave</h4>
                                        </div>
                                        <ul className="space-y-2.5">
                                            {recomendacion.queEstudiar.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5">
                                                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-700 text-[10px] font-bold text-white">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm text-slate-300">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                                        <div className="mb-3 flex items-center gap-2 text-emerald-300">
                                            <Shield className="h-4 w-4" />
                                            <h4 className="text-xs font-black uppercase tracking-wide text-white">Recursos</h4>
                                        </div>
                                        <ul className="space-y-2">
                                            {recomendacion.recursos.map((item, idx) => (
                                                <li key={idx} className="rounded-lg bg-slate-800/70 px-2.5 py-2 text-sm text-slate-300">
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="space-y-5 md:col-span-7">
                                    <div className="rounded-2xl border border-orange-400/20 bg-slate-900/70 p-5">
                                        <div className="mb-4 flex items-center gap-2 text-orange-300">
                                            <Zap className="h-4 w-4" />
                                            <h4 className="text-xs font-black uppercase tracking-wide text-white">Estrategia de Estudio</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {recomendacion.comoEstudiar.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5">
                                                    <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/70 bg-slate-900 text-cyan-300">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    </span>
                                                    <span className="text-sm leading-relaxed text-slate-300">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-emerald-950/90 to-teal-950/90 p-5">
                                        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:16px_16px]" />
                                        <div className="relative flex flex-col gap-4 md:flex-row md:items-center">
                                            <div className="rounded-full bg-emerald-500/25 p-2.5">
                                                <Award className="h-6 w-6 text-emerald-200" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-white">Evaluación Final</h4>
                                                <p className="mt-1 text-sm text-emerald-100">{recomendacion.evaluacion}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    marcarSesionComoHecha(sesionSeleccionada.key);
                                                    setSesionSeleccionada(null);
                                                }}
                                                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
                                                    estadoSesion === 'estudiado'
                                                        ? 'bg-emerald-200/20 text-emerald-100 hover:bg-emerald-200/30'
                                                        : 'bg-white text-emerald-900 hover:bg-emerald-50'
                                                }`}
                                            >
                                                {textoCta}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-black text-white">
                                                    {sesionSeleccionada.repaso}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400">Progreso General</p>
                                                    <p className="text-sm font-bold text-white">Módulo {sesionSeleccionada.repaso} de 5</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-300">{repasoPct}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                                                style={{ width: `${repasoPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            <Modal isOpen={showPrioridadesModal} onClose={() => setShowPrioridadesModal(false)} maxWidth="4xl">
                <div className="space-y-4 rounded-2xl border border-violet-300/20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_45%),linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.88))] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-black text-white">prioridades clave completas</h3>
                            <p className="text-xs text-white/60">ordenadas por impacto. arrastra desde el panel principal para cambiar prioridad.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setVistaPlan('semanas');
                                setSemanaActual(0);
                                setPendingScrollSemanas(true);
                                setShowPrioridadesModal(false);
                            }}
                            className="rounded-md border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1.5 text-[11px] font-bold text-cyan-100 hover:bg-cyan-400/20"
                        >
                            ir al plan semanal
                        </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_1fr]">
                        <input
                            type="text"
                            value={filtroPrioridadesTexto}
                            onChange={(e) => setFiltroPrioridadesTexto(e.target.value)}
                            placeholder="buscar tema o materia..."
                            className="rounded-md border border-white/15 bg-slate-900/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-300/40"
                        />
                        <select
                            value={filtroPrioridadesMateria}
                            onChange={(e) => setFiltroPrioridadesMateria(e.target.value)}
                            className="rounded-md border border-white/15 bg-slate-900/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-300/40"
                        >
                            <option value="todas">todas las materias</option>
                            {Array.from(new Set(focosOrdenados.map((f) => f.materia))).map((mat) => (
                                <option key={`mat-filter-${mat}`} value={mat}>
                                    {MATERIA_VISUAL[mat]?.label || mat}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filtroPrioridadesNivel}
                            onChange={(e) => setFiltroPrioridadesNivel(e.target.value as 'todas' | 'alta' | 'media' | 'baja')}
                            className="rounded-md border border-white/15 bg-slate-900/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-300/40"
                        >
                            <option value="todas">todas las prioridades</option>
                            <option value="alta">alta</option>
                            <option value="media">media</option>
                            <option value="baja">baja</option>
                        </select>
                    </div>
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        {prioridadesModalFiltradas.map((foco, idx) => {
                            const visual = MATERIA_VISUAL[foco.materia] || MATERIA_FALLBACK;
                            const Icon = visual.Icon;
                            return (
                                <div key={`modal-prio-${foco.materia}-${foco.tema}`} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-black text-violet-100">#{idx + 1}</p>
                                            <p className="mt-0.5 text-sm font-semibold text-white">{foco.tema}</p>
                                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/65">
                                                <Icon className="h-3.5 w-3.5 text-cyan-200" />
                                                {visual.label}
                                            </p>
                                        </div>
                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                            foco.prioridad === 'alta'
                                                ? 'border-rose-300/35 bg-rose-400/15 text-rose-100'
                                                : foco.prioridad === 'media'
                                                    ? 'border-amber-300/35 bg-amber-400/15 text-amber-100'
                                                    : 'border-emerald-300/35 bg-emerald-400/15 text-emerald-100'
                                        }`}>
                                            {foco.prioridad}
                                        </span>
                                    </div>
                                    <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
                                        <div className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
                                            <p className="text-white/45">score</p>
                                            <p className="font-black text-white/90">{foco.score.toFixed(1)}</p>
                                        </div>
                                        <div className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
                                            <p className="text-white/45">acierto</p>
                                            <p className="font-black text-white/90">{foco.porcentaje}%</p>
                                        </div>
                                        <div className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
                                            <p className="text-white/45">errores</p>
                                            <p className="font-black text-white/90">{foco.errores}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {prioridadesModalFiltradas.length === 0 && (
                            <p className="text-sm text-white/60">sin prioridades críticas por ahora.</p>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} maxWidth="2xl">
                <div className="space-y-6 rounded-2xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_45%),linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.88))] p-6">
                    {/* Header */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 ring-1 ring-cyan-300/30">
                                <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Sincronizar Personalización</h3>
                                <p className="text-sm text-white/60">Guarda tus cambios en la nube</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Message */}
                    <div className="rounded-xl border border-blue-300/20 bg-blue-400/10 p-4">
                        <div className="flex gap-3">
                            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-blue-100">Plan guardado localmente</p>
                                <p className="text-xs text-blue-200/70">
                                    Tu configuración está segura en este dispositivo. Súbela a la nube para acceder desde otros dispositivos.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4 transition-all hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04]">
                            <div className="absolute right-2 top-2 opacity-10 transition-opacity group-hover:opacity-20">
                                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-xs font-medium uppercase tracking-wider text-white/50">Semanas</p>
                            <p className="mt-1 text-2xl font-black text-white">{weeksAvailable}</p>
                        </div>
                        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4 transition-all hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04]">
                            <div className="absolute right-2 top-2 opacity-10 transition-opacity group-hover:opacity-20">
                                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-xs font-medium uppercase tracking-wider text-white/50">Eventos/Día</p>
                            <p className="mt-1 text-2xl font-black text-white">{eventosPorDia}</p>
                        </div>
                        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4 transition-all hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04]">
                            <div className="absolute right-2 top-2 opacity-10 transition-opacity group-hover:opacity-20">
                                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                            <p className="text-xs font-medium uppercase tracking-wider text-white/50">Días Ocupados</p>
                            <p className="mt-1 text-2xl font-black text-white">{busyDates.length}</p>
                        </div>
                    </div>

                    {/* Quota Info */}
                    <div className="rounded-xl border border-amber-300/30 bg-gradient-to-r from-amber-400/15 to-orange-400/10 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20">
                                    <svg className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-amber-200/70">Cuota Diaria (UTC-5)</p>
                                    <p className="text-sm font-bold text-amber-100">
                                        {cloudQuota?.used ?? 0}/{cloudQuota?.limit ?? 3} usadas · {cloudQuota?.remaining ?? 3} restantes
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: cloudQuota?.limit ?? 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 w-2 rounded-full ${
                                            i < (cloudQuota?.used ?? 0)
                                                ? 'bg-amber-400'
                                                : 'bg-amber-400/20'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setShowUploadModal(false)}
                            className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/80 transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                        >
                            <span className="relative z-10">Mantener Solo Local</span>
                        </button>
                        <button
                            type="button"
                            disabled={uploadingPlan || (cloudQuota?.remaining ?? 1) <= 0}
                            onClick={() => confirmarSubidaNube('simulation')}
                            className="group relative overflow-hidden rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-400/20 to-blue-400/15 px-5 py-3 text-sm font-bold text-cyan-100 transition-all hover:border-cyan-300/60 hover:from-cyan-400/30 hover:to-blue-400/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-cyan-300/40 disabled:hover:from-cyan-400/20"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {uploadingPlan ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Subir Este Simulacro
                                    </>
                                )}
                            </span>
                        </button>
                        <button
                            type="button"
                            disabled={uploadingPlan || (cloudQuota?.remaining ?? 1) <= 0}
                            onClick={() => confirmarSubidaNube('global')}
                            className="group relative overflow-hidden rounded-xl border border-violet-300/40 bg-gradient-to-r from-violet-400/20 to-purple-400/15 px-5 py-3 text-sm font-bold text-violet-100 transition-all hover:border-violet-300/60 hover:from-violet-400/30 hover:to-purple-400/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-violet-300/40 disabled:hover:from-violet-400/20"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {uploadingPlan ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Subir Como Base Global
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

