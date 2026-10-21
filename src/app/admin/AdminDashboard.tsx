'use client';
import StudentDetailModal from '@features/coordinador/components/cohort/StudentDetailModal';
import { EstadisticasGrupo } from '@shared/types';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Estudiante, ResultadosFinales, InstitucionData } from '@shared/types';
// 🔥 Firestore Service — única fuente de verdad para datos de simulacros
import { getAppConfig, getAllStudents, getStatistics, clearCache } from '@features/simulacro/lib/firestoreService';
// 🚀 Dynamic import: Three.js (~580KB) solo se carga cuando admin abre esta página
const LiquidEther = dynamic(() => import('@shared/components/animations/LiquidEther'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black" />,
});
import SlidingPillNav from '@shared/components/animations/SlidingPillNav';
import AnalisisArea from '@features/coordinador/components/cohort/AnalisisArea';
import CorrelationMatrix from '@features/estudiante/components/CorrelationMatrix';
import ProfileByLevel from '@features/estudiante/components/ProfileByLevel';
import ExportMenu from '@features/admin/components/ExportMenu';
import ExportPreviewModal from '@features/admin/components/ExportPreviewModal';
import InvalidacionesManager from '@features/admin/components/InvalidacionesManager';
import FloatingActionBar from '@shared/components/animations/FloatingActionBar';
import StudentComparisonView from '@features/estudiante/components/StudentComparisonView';

import DashboardOverview from '@features/coordinador/components/cohort/DashboardOverview';
import InstitucionesPanel from '@features/admin/components/InstitucionesPanel';

// 🛡️ Admin Panel — Monitoreo, Moderación, Cuotas
const AccessMonitor = dynamic(() => import('../admin-panel/components/AccessMonitor'), {
    ssr: false,
    loading: () => <div className="flex justify-center py-16"><div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>,
});
const DepartamentosPanel = dynamic(() => import('../admin-panel/components/DepartamentosPanel'), {
    ssr: false,
    loading: () => <div className="flex justify-center py-16"><div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>,
});
const StorageMonitor = dynamic(() => import('../admin-panel/components/StorageMonitor'), {
    ssr: false,
    loading: () => <div className="flex justify-center py-16"><div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>,
});
const CourseAttendanceMonitor = dynamic(() => import('../admin-panel/components/CourseAttendanceMonitor'), {
    ssr: false,
    loading: () => <div className="flex justify-center py-16"><div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>,
});

// Función para clasificar nivel
function clasificarNivel(puntaje: number): { nivel: string; color: string; badgeClass: string } {
    if (puntaje >= 400) return { nivel: 'Superior', color: 'bg-green-500', badgeClass: 'badge-superior' };
    if (puntaje >= 325) return { nivel: 'Alto', color: 'bg-blue-500', badgeClass: 'badge-alto' };
    if (puntaje >= 250) return { nivel: 'Medio', color: 'bg-yellow-500', badgeClass: 'badge-medio' };
    return { nivel: 'Bajo', color: 'bg-red-500', badgeClass: 'badge-bajo' };
}

// Constantes
const NAV_ITEMS = [
    { id: 'estadisticas', label: 'Dashboard', icon: '📊' },
    { id: 'analisis', label: 'Análisis', icon: '🧠' },
    { id: 'correlacion', label: 'Correlación', icon: '🔗' },
    { id: 'perfiles', label: 'Perfiles', icon: '👤' },
    { id: 'tabla', label: 'Estudiantes', icon: '👥' },
    { id: 'seguimiento', label: 'Seguimiento', icon: '📈' },
    { id: 'instituciones', label: 'Instituciones', icon: '🏫' },
    { id: 'departamentos', label: 'Departamentos', icon: '🗺️' },
    { id: 'alertas', label: 'Alertas', icon: '⚠️' },
    { id: 'accesos', label: 'Accesos', icon: '🔑' },
    { id: 'storage', label: 'Storage', icon: '🗄️' },
];

export default function AdminPage() {
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [estadisticas, setEstadisticas] = useState<EstadisticasGrupo | null>(null); // State for statistics
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    // Estados
    const [busqueda, setBusqueda] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('todos');
    const [filtroInstitucion, setFiltroInstitucion] = useState('todas');
    const [ordenarPor, setOrdenarPor] = useState<'nombre' | 'puntaje' | 'institucion'>('puntaje');
    const [ordenAsc, setOrdenAsc] = useState(false);
    const [vistaActual, setVistaActual] = useState<
        | 'tabla'
        | 'instituciones'
        | 'departamentos'
        | 'alertas'
        | 'estadisticas'
        | 'analisis'
        | 'correlacion'
        | 'perfiles'
        | 'seguimiento'
        | 'accesos'
        | 'storage'
    >('estadisticas');
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null);
    const [simulacroActual, setSimulacroActual] = useState('');
    const [simulacrosDisponibles, setSimulacrosDisponibles] = useState<string[]>([]);

    // Estado para Previsualización de Exportación
    const [previewData, setPreviewData] = useState<Estudiante[]>([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Modales y Herramientas
    const [showExportModal, setShowExportModal] = useState(false);
    const [showInvalidacionesModal, setShowInvalidacionesModal] = useState(false);
    const [showComparisonView, setShowComparisonView] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Configuración de exportación
    const [exportConfig, setExportConfig] = useState({
        format: 'xlsx', // xlsx, csv
        institucion: 'todas',
        departamento: 'todos',
        nivel: 'todos',
        soloCompletos: false,
        puntajeMin: 0,
        puntajeMax: 500
    });

    // Función auxiliar para calcular aciertos por sesión
    const calcularAciertosSesion = useCallback((puntajes: Estudiante['puntajes']) => {
        if (!puntajes) return { s1_aciertos: 0, s1_total: 0, s2_aciertos: 0, s2_total: 0 };

        const matemáticas = puntajes['matemáticas'] || { correctas: 0, total_preguntas: 0 };
        const lectura = puntajes['lectura crítica'] || { correctas: 0, total_preguntas: 0 };
        const inglés = puntajes['inglés'] || { correctas: 0, total_preguntas: 0 };
        const sociales = puntajes['sociales y ciudadanas'] || { correctas: 0, total_preguntas: 0 };
        const ciencias = puntajes['ciencias naturales'] || { correctas: 0, total_preguntas: 0 };

        const s1_total = (matemáticas.total_preguntas || 0) +
            Math.floor((sociales.total_preguntas || 0) / 2) +
            Math.floor((ciencias.total_preguntas || 0) * 0.78);

        const s2_total = (lectura.total_preguntas || 0) +
            (inglés.total_preguntas || 0) +
            Math.ceil((sociales.total_preguntas || 0) / 2) +
            Math.ceil((ciencias.total_preguntas || 0) * 0.22);

        const s1_aciertos = (matemáticas.correctas || 0) +
            Math.floor((sociales.correctas || 0) / 2) +
            Math.floor((ciencias.correctas || 0) * 0.78);

        const s2_aciertos = (lectura.correctas || 0) +
            (inglés.correctas || 0) +
            Math.ceil((sociales.correctas || 0) / 2) +
            Math.ceil((ciencias.correctas || 0) * 0.22);

        return { s1_aciertos, s1_total, s2_aciertos, s2_total };
    }, []);

    // Procesador de estudiantes (normalización + penalización por inasistencia)
    const procesarEstudiantes = useCallback((estudiantesData: Estudiante[]): Estudiante[] => {
        return estudiantesData.map(est => {
            // Normalizar textos a mayúsculas para uniformidad
            est.informacion_personal.nombres = (est.informacion_personal.nombres || '').toUpperCase().trim();
            est.informacion_personal.apellidos = (est.informacion_personal.apellidos || '').toUpperCase().trim();
            if (est.informacion_personal.institucion) {
                est.informacion_personal.institucion = est.informacion_personal.institucion.toUpperCase().trim();
            }
            if (est.informacion_personal.municipio) {
                est.informacion_personal.municipio = est.informacion_personal.municipio.toUpperCase().trim();
            }

            const sesiones = est.secciones_completadas || est.sesiones || [];
            const tieneS1 = sesiones.includes('S1');
            const tieneS2 = sesiones.includes('S2');

            let s1_aciertos = est.s1_aciertos;
            let s1_total = est.s1_total;
            let s2_aciertos = est.s2_aciertos;
            let s2_total = est.s2_total;

            if (s1_aciertos === undefined || s2_aciertos === undefined) {
                const calculados = calcularAciertosSesion(est.puntajes);
                s1_aciertos = calculados.s1_aciertos;
                s1_total = calculados.s1_total;
                s2_aciertos = calculados.s2_aciertos;
                s2_total = calculados.s2_total;
            }

            if (!tieneS1 || !tieneS2) {
                const puntajesPenalizados = { ...est.puntajes };
                if (puntajesPenalizados) {
                    Object.keys(puntajesPenalizados).forEach(materia => {
                        if (puntajesPenalizados[materia]) {
                            puntajesPenalizados[materia] = {
                                ...puntajesPenalizados[materia],
                                puntaje: 0,
                                correctas: 0
                            };
                        }
                    });
                }
                return {
                    ...est,
                    puntaje_global: 0,
                    nivel_desempeno: 'Bajo',
                    puntajes: puntajesPenalizados,
                    s1_aciertos: 0,
                    s1_total,
                    s2_aciertos: 0,
                    s2_total,
                };
            }

            return { ...est, s1_aciertos, s1_total, s2_aciertos, s2_total };
        });
    }, [calcularAciertosSesion]);

    // 🔥 Cargar configuración y simulacros desde Firestore (via firestoreService)
    useEffect(() => {
        const cargarSimulacros = async () => {
            try {
                const config = await getAppConfig();
                setSimulacrosDisponibles(config.availableSimulations || ['SG11-08', 'SG11-09']);
                if (config.activeSimulation) {
                    setSimulacroActual(config.activeSimulation);
                }
            } catch (error) {
                console.error('[Admin] Error cargando configuración:', error);
            }
        };
        cargarSimulacros();
    }, []);

    // 🔥 Cargar datos cuando cambia el simulacro (desde Firestore via firestoreService)
    useEffect(() => {
        if (!simulacroActual) return;
        let cancelled = false;

        const cargarDatos = async () => {
            setLoading(true);
            setError(null);
            try {
                // Cargar estudiantes y estadísticas en paralelo desde Firestore
                const [estudiantesRaw, statsData] = await Promise.allSettled([
                    getAllStudents(simulacroActual),
                    getStatistics(simulacroActual),
                ]);

                if (cancelled) return;

                // Procesar estudiantes
                if (estudiantesRaw.status === 'fulfilled' && estudiantesRaw.value.length > 0) {
                    const procesados = procesarEstudiantes(estudiantesRaw.value);
                    setEstudiantes(procesados);
                    setError(null);
                } else {
                    setEstudiantes([]);
                    if (estudiantesRaw.status === 'rejected') {
                        console.warn('[Admin] Error cargando estudiantes:', estudiantesRaw.reason);
                        setError(`Error al cargar datos de ${simulacroActual}: ${estudiantesRaw.reason?.message || 'Error desconocido'}`);
                    } else {
                        // Array vacío no es un error — puede que el sim no tenga datos aún
                        console.warn(`[Admin] Sin datos para ${simulacroActual} (array vacío)`); 
                        setError(`Sin datos de estudiantes para ${simulacroActual}. Verifica que el simulacro esté cargado en Firestore.`);
                    }
                }

                // Procesar estadísticas
                if (statsData.status === 'fulfilled') {
                    setEstadisticas(statsData.value);
                } else {
                    console.warn('[Admin] Estadísticas no disponibles:', statsData.reason);
                    setEstadisticas(null);
                }

            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Error desconocido cargando datos');
                    console.error('[Admin] Error cargando datos:', err);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        cargarDatos();
        return () => { cancelled = true; };
    }, [simulacroActual, procesarEstudiantes]);

    // Obtener instituciones únicas
    const instituciones = useMemo(() => {
        const set = new Set(estudiantes.map(e => e.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)'));
        return Array.from(set).sort();
    }, [estudiantes]);

    // Filtrar y ordenar estudiantes
    const estudiantesFiltrados = useMemo(() => {
        let result = estudiantes.filter(e => {
            const nombre = `${e.informacion_personal.nombres} ${e.informacion_personal.apellidos}`.toLowerCase();
            const doc = e.informacion_personal.numero_identificacion || '';
            const matchBusqueda = nombre.includes(busqueda.toLowerCase()) || doc.includes(busqueda);

            const p = typeof e.puntaje_global === 'number' ? e.puntaje_global : 0;
            const nivel = clasificarNivel(p).nivel.toLowerCase();
            const matchNivel = filtroNivel === 'todos' || nivel === filtroNivel.toLowerCase();

            const inst = e.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)';
            const matchInst = filtroInstitucion === 'todas' || inst === filtroInstitucion;

            return matchBusqueda && matchNivel && matchInst;
        });

        result.sort((a, b) => {
            let cmp = 0;
            if (ordenarPor === 'nombre') {
                cmp = `${a.informacion_personal.nombres}`.localeCompare(`${b.informacion_personal.nombres}`);
            } else if (ordenarPor === 'puntaje') {
                cmp = (b.puntaje_global || 0) - (a.puntaje_global || 0);
            } else {
                cmp = (a.informacion_personal.institucion || '').localeCompare(b.informacion_personal.institucion || '');
            }
            return ordenAsc ? -cmp : cmp;
        });

        return result;
    }, [estudiantes, busqueda, filtroNivel, filtroInstitucion, ordenarPor, ordenAsc]);

    // Estadísticas completas
    const stats = useMemo(() => {
        if (estudiantes.length === 0) return null;

        const puntajes = estudiantes.map(e => e.puntaje_global || 0).filter(p => p > 0);
        const n = puntajes.length;
        if (n === 0) return null;

        const promedio = puntajes.reduce((a, b) => a + b, 0) / n;
        const maximo = Math.max(...puntajes);
        const minimo = Math.min(...puntajes);

        // Estadísticas avanzadas
        const puntajesOrdenados = [...puntajes].sort((a, b) => a - b);

        // Mediana
        const mediana = n % 2 === 0
            ? (puntajesOrdenados[n / 2 - 1] + puntajesOrdenados[n / 2]) / 2
            : puntajesOrdenados[Math.floor(n / 2)];

        // Función para calcular percentiles
        const calcPercentil = (p: number) => {
            const idx = Math.floor((p / 100) * n);
            return puntajesOrdenados[Math.min(idx, n - 1)];
        };
        const percentil25 = calcPercentil(25);
        const percentil75 = calcPercentil(75);
        const percentil90 = calcPercentil(90);
        const rangoIntercuartilico = percentil75 - percentil25;

        // Desviación estándar
        const desviacionEstandar = Math.sqrt(
            puntajes.reduce((sum, p) => sum + Math.pow(p - promedio, 2), 0) / n
        );
        const coeficienteVariacion = promedio > 0 ? (desviacionEstandar / promedio) * 100 : 0;

        // Tasa de aprobación (>= 300 puntos)
        const tasaAprobacion = (puntajes.filter(p => p >= 300).length / n) * 100;

        // Brecha
        const brechaMaxMin = maximo - minimo;

        const niveles = { superior: 0, alto: 0, medio: 0, bajo: 0 };
        estudiantes.forEach(e => {
            const p = typeof e.puntaje_global === 'number' ? e.puntaje_global : 0;
            const nivel = clasificarNivel(p).nivel.toLowerCase();
            niveles[nivel as keyof typeof niveles]++;
        });

        // Distribución de puntajes en rangos
        const distribucion = {
            '0-199': 0, '200-249': 0, '250-299': 0, '300-324': 0,
            '325-349': 0, '350-374': 0, '375-399': 0, '400-449': 0, '450-500': 0
        };
        puntajes.forEach(p => {
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

        // Estadísticas por materia
        const materias: Record<string, { total: number; correctas: number; estudiantes: number }> = {};
        estudiantes.forEach(e => {
            if (e.puntajes) {
                Object.entries(e.puntajes).forEach(([materia, data]) => {
                    if (!materias[materia]) {
                        materias[materia] = { total: 0, correctas: 0, estudiantes: 0 };
                    }
                    if (data.puntaje > 0) {
                        materias[materia].total += data.puntaje;
                        materias[materia].correctas += data.correctas || 0;
                        materias[materia].estudiantes++;
                    }
                });
            }
        });

        const promediosPorMateria = Object.entries(materias).map(([nombre, data]) => ({
            nombre,
            promedio: data.estudiantes > 0 ? Math.round(data.total / data.estudiantes) : 0,
            correctas: data.correctas,
            estudiantes: data.estudiantes
        })).sort((a, b) => b.promedio - a.promedio);

        // Materia más fuerte y más débil
        const materiaMasFuerte = promediosPorMateria.length > 0
            ? { nombre: promediosPorMateria[0].nombre, promedio: promediosPorMateria[0].promedio }
            : null;
        const materiaMasDebil = promediosPorMateria.length > 0
            ? { nombre: promediosPorMateria[promediosPorMateria.length - 1].nombre, promedio: promediosPorMateria[promediosPorMateria.length - 1].promedio }
            : null;

        // Top 5 estudiantes
        const top5 = [...estudiantes]
            .filter(e => (e.puntaje_global || 0) > 0)
            .sort((a, b) => (b.puntaje_global || 0) - (a.puntaje_global || 0))
            .slice(0, 5);

        // Estudiantes en riesgo (puntaje bajo)
        const enRiesgo = [...estudiantes]
            .filter(e => (e.puntaje_global || 0) > 0 && (e.puntaje_global || 0) < 300)
            .sort((a, b) => (a.puntaje_global || 0) - (b.puntaje_global || 0))
            .slice(0, 5);

        // Sesiones completadas
        const conAmbas = estudiantes.filter(e => {
            const sesiones = e.sesiones || e.secciones_completadas || [];
            return sesiones.includes('S1') && sesiones.includes('S2');
        }).length;

        return {
            // Métricas básicas
            promedio: Math.round(promedio),
            maximo,
            minimo,
            niveles,
            distribucion,
            promediosPorMateria,
            top5,
            enRiesgo,
            conAmbas,
            total: estudiantes.length,
            // Estadísticas avanzadas
            mediana: Math.round(mediana),
            desviacionEstandar: Math.round(desviacionEstandar * 10) / 10,
            coeficienteVariacion: Math.round(coeficienteVariacion * 10) / 10,
            percentil90,
            percentil25,
            percentil75,
            rangoIntercuartilico,
            tasaAprobacion: Math.round(tasaAprobacion * 10) / 10,
            brechaMaxMin,
            materiaMasFuerte,
            materiaMasDebil
        };
    }, [estudiantes]);

    // Estudiantes por institución
    const porInstitucion = useMemo(() => {
        const map = new Map<string, InstitucionData>();

        estudiantes.forEach(e => {
            const inst = e.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)';
            if (!map.has(inst)) {
                map.set(inst, { estudiantes: [], promedio: 0, niveles: { superior: 0, alto: 0, medio: 0, bajo: 0 } });
            }
            const data = map.get(inst)!;
            data.estudiantes.push(e);

            const p = typeof e.puntaje_global === 'number' ? e.puntaje_global : 0;
            const nivel = clasificarNivel(p).nivel.toLowerCase();
            // Cast seguro ya que sabemos que las claves coinciden
            if (nivel in data.niveles) {
                data.niveles[nivel as keyof typeof data.niveles]++;
            }
        });

        map.forEach((data) => {
            const puntajes = data.estudiantes.map(e => e.puntaje_global || 0).filter(p => p > 0);
            data.promedio = puntajes.length > 0 ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length) : 0;
        });

        return Array.from(map.entries()).sort((a, b) => b[1].promedio - a[1].promedio);
    }, [estudiantes]);

    // Estudiantes por departamento
    const porDepartamento = useMemo(() => {
        const map = new Map<string, { estudiantes: Estudiante[]; promedio: number; niveles: Record<string, number> }>();

        estudiantes.forEach(e => {
            // departamento es el campo real; municipio como fallback por datos legacy
            const depto = e.informacion_personal.departamento || e.informacion_personal.municipio || 'No aplica';
            if (!map.has(depto)) {
                map.set(depto, { estudiantes: [], promedio: 0, niveles: { superior: 0, alto: 0, medio: 0, bajo: 0 } });
            }
            const data = map.get(depto)!;
            data.estudiantes.push(e);

            const p = typeof e.puntaje_global === 'number' ? e.puntaje_global : 0;
            const nivel = clasificarNivel(p).nivel.toLowerCase();
            // Asegurar que el nivel existe en el objeto niveles
            if (nivel in data.niveles) data.niveles[nivel as keyof typeof data.niveles]++;
        });

        map.forEach((data) => {
            const puntajes = data.estudiantes.map(e => e.puntaje_global || 0).filter(p => p > 0);
            data.promedio = puntajes.length > 0 ? Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length) : 0;
        });

        return Array.from(map.entries()).sort((a, b) => b[1].promedio - a[1].promedio);
    }, [estudiantes]);

    // Alertas - helper para verificar sesiones
    const tieneSesion = (e: Estudiante, sesion: string): boolean => {
        const sesiones = e.sesiones || e.secciones_completadas || [];
        return sesiones.some(s => s.toLowerCase().includes(sesion.toLowerCase()));
    };

    const alertas = useMemo(() => {
        return {
            sinSesion1: estudiantes.filter(e => !tieneSesion(e, 's1') && !tieneSesion(e, 'seccion1')),
            sinSesion2: estudiantes.filter(e => !tieneSesion(e, 's2') && !tieneSesion(e, 'seccion2')),
            puntajeBajo: estudiantes.filter(e => (e.puntaje_global || 0) < 250 && (e.puntaje_global || 0) > 0),
        };
    }, [estudiantes]);

    const handleSelectAll = () => {
        if (selectedIds.size === estudiantesFiltrados.length && estudiantesFiltrados.length > 0) {
            setSelectedIds(new Set());
        } else {
            const newSet = new Set(estudiantesFiltrados.map(e => e.informacion_personal.numero_identificacion));
            setSelectedIds(newSet);
        }
    };

    const handleSelectOne = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    // 🚀 Dynamic import: xlsx (~200KB) solo se carga cuando el admin exporta
    const handleExport = async () => {
        const XLSX = await import('xlsx');
        let data: Estudiante[] = [];

        // 1. Prioridad: Selección manual
        if (selectedIds.size > 0) {
            data = estudiantes.filter(e => selectedIds.has(e.informacion_personal.numero_identificacion));
        } else {
            // 2. Filtrar datos según configuración
            data = estudiantes.filter(e => {
                // Institución
                const inst = e.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)';
                if (exportConfig.institucion !== 'todas' && inst !== exportConfig.institucion) return false;

                // Departamento
                const depto = e.informacion_personal.departamento || e.informacion_personal.municipio || 'No aplica';
                if (exportConfig.departamento !== 'todos' && depto !== exportConfig.departamento) return false;

                // Nivel
                const pg = typeof e.puntaje_global === 'number' ? e.puntaje_global : 0;
                if (exportConfig.nivel !== 'todos' && clasificarNivel(pg).nivel !== exportConfig.nivel) return false;

                // Sesiones completas
                if (exportConfig.soloCompletos) {
                    const s = e.sesiones || [];
                    if (!s.includes('S1') || !s.includes('S2')) return false;
                }

                // Puntaje
                if (pg < exportConfig.puntajeMin || pg > exportConfig.puntajeMax) return false;

                return true;
            });
        }

        // 2. Mapear a formato plano para Excel
        const rows = data.map(e => ({
            'Tipo Doc': e.informacion_personal.tipo_identificacion,
            'Documento': e.informacion_personal.numero_identificacion,
            'Nombres': e.informacion_personal.nombres,
            'Apellidos': e.informacion_personal.apellidos,
            'Correo': e.informacion_personal.correo_electronico || '',
            'Teléfono': e.informacion_personal.telefono || '',
            'Institución': e.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)',
            'Departamento': e.informacion_personal.municipio || 'No aplica',
            'Puntaje Global': e.puntaje_global || 0,
            'Nivel': clasificarNivel(typeof e.puntaje_global === 'number' ? e.puntaje_global : 0).nivel,
            'Lectura Crítica': e.puntajes?.['lectura crítica']?.puntaje || 0,
            'Matemáticas': e.puntajes?.['matemáticas']?.puntaje || 0,
            'Sociales': e.puntajes?.['sociales y ciudadanas']?.puntaje || 0,
            'Ciencias': e.puntajes?.['ciencias naturales']?.puntaje || 0,
            'Inglés': e.puntajes?.['inglés']?.puntaje || 0,
            'Sesiones': (e.sesiones || []).join(', ')
        }));

        if (rows.length === 0) {
            alert('No hay datos que coincidan con los filtros seleccionados.');
            return;
        }

        // 3. Generar archivo
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte");

        const fecha = new Date().toISOString().split('T')[0];
        const extension = exportConfig.format === 'csv' ? 'csv' : 'xlsx';

        // Ajustar nombre si hay filtro específico
        let nombreArchivo = `Reporte_General_${fecha}`;
        if (exportConfig.institucion !== 'todas') nombreArchivo += `_${exportConfig.institucion.replace(/\s+/g, '_').substring(0, 20)}`;

        XLSX.writeFile(wb, `${nombreArchivo}.${extension}`);

        setShowExportModal(false);
    };


    // ⚠️ loading/error ya NO son pantallas completas — son inline dentro del main
    // para que el selector de simulacro siempre permanezca accesible.

    return (
        <div className="min-h-screen relative font-sans text-white overflow-hidden selection:bg-purple-500/30">
            {/* Fondo Animado */}
            <div className="fixed inset-0 z-0 bg-black">
                <LiquidEther
                    mouseForce={20}
                    cursorSize={80}
                    isViscous={false}
                    viscous={30}
                    iterationsPoisson={16}
                    iterationsViscous={8}
                    colors={["#0033ff", "#8273f2", "#a697d8"]}
                    autoDemo
                    autoSpeed={0.4}
                    autoIntensity={1.8}
                    isBounce={false}
                    resolution={0.3}
                    maxFps={30}
                />
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            </div>

            {/* Header */}
            {/* Header Responsive Rediseñado */}
            <header className="relative z-10 bg-[#0f111a]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 shadow-2xl transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
                        {/* Logo y Título */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/10">
                                <span className="text-xl sm:text-2xl">🎓</span>
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Panel Administrativo</h1>
                                <p className="text-purple-300/80 text-xs sm:text-sm font-medium">Seamos Genios - ICFES</p>
                            </div>
                        </div>

                        {/* Navegación Scrollable Premium */}
                        <div className="w-full md:w-auto overflow-hidden">
                            <SlidingPillNav
                                items={NAV_ITEMS}
                                activeId={vistaActual}
                                onSelect={(id) => setVistaActual(id as any)}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Barra de Control */}
            {vistaActual !== 'accesos' && vistaActual !== 'seguimiento' && vistaActual !== 'storage' && (
                <div className="relative z-10 bg-black/20 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-6 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Acciones principales */}
                            <div className="flex flex-wrap gap-2">
                                {/* Menú de Exportación Central */}
                                <div className="w-40 bg-gray-900 rounded-lg z-50 relative">
                                    <ExportMenu
                                        estudiantes={estudiantes}
                                        disabled={loading || estudiantes.length === 0}
                                        onOpenPreview={() => {
                                            setPreviewData(estudiantes);
                                            setShowPreviewModal(true);
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => setShowInvalidacionesModal(true)}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-2 transition-all text-sm font-medium shadow-lg hover:shadow-amber-500/20"
                                >
                                    ⚠️ Invalidaciones
                                </button>
                            </div>

                            {/* Info rápida */}
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                                    <span className="text-white/50">📅 Última actualización:</span>
                                    <span className="text-white font-medium">{new Date().toLocaleDateString('es-CO')}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-4 py-2 rounded-xl border-2 border-purple-500/40 shadow-lg shadow-purple-500/10">
                                    <span className="text-purple-300 font-medium">📝 Simulacro:</span>
                                    <select
                                        value={simulacroActual}
                                        onChange={(e) => setSimulacroActual(e.target.value)}
                                        className="bg-purple-900/50 text-white font-bold px-3 py-1 rounded-lg border border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer text-base min-w-[120px]"
                                    >
                                        {simulacrosDisponibles.map(sim => (
                                            <option key={sim} value={sim} className="bg-slate-800 text-white py-2">
                                                {sim}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="text-xs text-purple-400/70 hidden sm:inline">↕️ Cambiar</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* ── Banner de Loading inline (no bloquea header ni selector) ── */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-white/70 text-sm font-medium">Cargando {simulacroActual}…</p>
                    </div>
                )}

                {/* ── Banner de Error inline (no bloquea header ni selector) ── */}
                {!loading && error && vistaActual !== 'accesos' && vistaActual !== 'seguimiento' && vistaActual !== 'storage' && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="bg-red-900/30 border border-red-500/40 backdrop-blur-lg rounded-2xl p-8 text-center max-w-lg w-full">
                            <div className="text-5xl mb-3">⚠️</div>
                            <h2 className="text-xl font-bold text-white mb-2">Sin datos para {simulacroActual}</h2>
                            <p className="text-red-300/90 text-sm">{error}</p>
                            <p className="text-white/40 text-xs mt-3">Puedes cambiar de simulacro en la barra superior ↑</p>
                        </div>
                    </div>
                )}

                {/* ── Contenido principal (solo visible si no está cargando ni error) ── */}
                {!loading && !error && (<>

                {/* Vista: Dashboard Estadísticas */}
                {vistaActual === 'estadisticas' && stats && (
                    <DashboardOverview stats={stats} rankingInstitucional={porInstitucion} />
                )}

                {/* Vista: Análisis por Área */}
                {vistaActual === 'analisis' && (
                    <AnalisisArea
                        estudiantes={estudiantes}
                        filtroInstitucion={filtroInstitucion} // Pasamos el filtro activo
                        onClose={() => setVistaActual('estadisticas')}
                    />
                )}

                {/* Vista: Correlación entre Áreas */}
                {vistaActual === 'correlacion' && (
                    <CorrelationMatrix estudiantes={estudiantes} />
                )}

                {/* Vista: Perfil por Nivel */}
                {vistaActual === 'perfiles' && (
                    <ProfileByLevel estudiantes={estudiantes} />
                )}

                {/* Vista: Tabla de Estudiantes */}
                {vistaActual === 'tabla' && (
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                        {/* Filtros */}
                        <div className="p-4 border-b border-white/10 space-y-4">
                            <div className="flex flex-wrap gap-4 items-center">
                                {/* Buscador */}
                                <div className="flex-1 min-w-0 sm:min-w-[300px] relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o documento..."
                                        value={busqueda}
                                        onChange={e => setBusqueda(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                                    />
                                </div>

                                {/* Filtro de nivel */}
                                <select
                                    value={filtroNivel}
                                    onChange={e => setFiltroNivel(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-w-[160px]"
                                >
                                    <option value="todos">📊 Todos los niveles</option>
                                    <option value="superior">⭐ Superior</option>
                                    <option value="alto">🔵 Alto</option>
                                    <option value="medio">🟡 Medio</option>
                                    <option value="bajo">🔴 Bajo</option>
                                </select>

                                {/* Filtro de institución */}
                                <select
                                    value={filtroInstitucion}
                                    onChange={e => setFiltroInstitucion(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 max-w-[250px]"
                                >
                                    <option value="todas">🏫 Todas las instituciones</option>
                                    {instituciones.map(inst => (
                                        <option key={inst} value={inst}>{inst}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Contador de resultados */}
                            <div className="flex items-center justify-between">
                                <p className="text-white/50 text-sm">
                                    Mostrando <span className="text-purple-400 font-semibold">{estudiantesFiltrados.length}</span> de <span className="text-white/70">{estudiantes.length}</span> estudiantes
                                </p>
                                <div className="flex gap-2">
                                    <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded">S1 = verde</span>
                                    <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded">S2 = azul</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead className="bg-black/20 border-b border-white/10 text-[10px] uppercase tracking-wider text-white/40 font-bold sticky top-0 backdrop-blur-md z-10">
                                    <tr>
                                        <th className="py-3 pl-6 w-[5%] text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                                                onChange={handleSelectAll}
                                                checked={estudiantesFiltrados.length > 0 && selectedIds.size === estudiantesFiltrados.length}
                                            />
                                        </th>
                                        <th className="py-3 pl-2 w-[35%] text-left cursor-pointer hover:text-white transition-colors" onClick={() => { setOrdenarPor('nombre'); setOrdenAsc(!ordenAsc); }}>
                                            Estudiante {ordenarPor === 'nombre' && (ordenAsc ? '↑' : '↓')}
                                        </th>
                                        <th className="py-3 px-2 w-[20%] text-center cursor-pointer hover:text-white transition-colors" onClick={() => { setOrdenarPor('institucion'); setOrdenAsc(!ordenAsc); }}>
                                            Institución {ordenarPor === 'institucion' && (ordenAsc ? '↑' : '↓')}
                                        </th>
                                        <th className="py-3 px-2 w-[10%] text-center">S1</th>
                                        <th className="py-3 px-2 w-[10%] text-center">S2</th>
                                        <th className="py-3 px-2 w-[10%] text-center cursor-pointer hover:text-white transition-colors" onClick={() => { setOrdenarPor('puntaje'); setOrdenAsc(!ordenAsc); }}>
                                            Global {ordenarPor === 'puntaje' && (ordenAsc ? '↑' : '↓')}
                                        </th>
                                        <th className="py-3 pr-6 w-[15%] text-right">Nivel</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {estudiantesFiltrados.slice(0, 50).map((est, idx) => {
                                        const p = typeof est.puntaje_global === 'number' ? est.puntaje_global : 0;
                                        const { nivel } = clasificarNivel(p);
                                        const iniciales = `${(est.informacion_personal.nombres || '')[0]}${(est.informacion_personal.apellidos || '')[0]}`;
                                        const avatarColor = ['from-pink-500 to-rose-500', 'from-purple-500 to-indigo-500', 'from-blue-500 to-cyan-500', 'from-teal-500 to-emerald-500', 'from-amber-500 to-orange-500'][idx % 5];

                                        return (
                                            <tr
                                                key={idx}
                                                onClick={() => setEstudianteSeleccionado(est)}
                                                className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                                            >
                                                <td className="py-3 pl-6 text-center" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                                                        checked={selectedIds.has(est.informacion_personal.numero_identificacion)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectOne(est.informacion_personal.numero_identificacion);
                                                        }}
                                                    />
                                                </td>
                                                <td className="py-3 pl-2 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${avatarColor} flex items-center justify-center text-xs font-bold text-white shadow-lg ring-1 ring-white/10 group-hover:scale-105 transition-transform`}>
                                                            {iniciales}
                                                        </div>
                                                        <div className="min-w-0 flex flex-col">
                                                            <span className="text-white font-bold text-sm leading-none group-hover:text-purple-300 transition-colors whitespace-nowrap student-name">
                                                                {est.informacion_personal.nombres} {est.informacion_personal.apellidos}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] text-white/40 font-mono bg-white/5 px-1 rounded border border-white/5">{est.informacion_personal.numero_identificacion}</span>
                                                                {est.informacion_personal.correo_electronico && (
                                                                    <span className="text-[10px] text-white/30 truncate max-w-[150px] sm:max-w-[200px]" title={est.informacion_personal.correo_electronico}>
                                                                        {est.informacion_personal.correo_electronico}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <span className="text-[10px] text-white/60 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full inline-block" title={est.informacion_personal.institucion}>
                                                        {est.informacion_personal.institucion || 'INDIVIDUAL (PROYECTO SECUNDARIO)'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className={`text-sm font-bold tabular-nums ${est.s1_aciertos ? 'text-green-400' : 'text-white/20'}`}>
                                                            {est.s1_aciertos || '-'}
                                                        </span>
                                                        <span className="text-[9px] text-white/20">/ {est.s1_total || 120}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className={`text-sm font-bold tabular-nums ${est.s2_aciertos ? 'text-blue-400' : 'text-white/20'}`}>
                                                            {est.s2_aciertos || '-'}
                                                        </span>
                                                        <span className="text-[9px] text-white/20">/ {est.s2_total || 134}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <span className={`text-lg font-black tabular-nums tracking-tight ${est.puntaje_global ? 'text-white' : 'text-white/20'} group-hover:scale-110 transition-transform inline-block`}>
                                                        {est.puntaje_global || 0}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-6 text-right">
                                                    <span className={`
                                                        inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide
                                                        ${nivel === 'Superior' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                                            nivel === 'Alto' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                                nivel === 'Medio' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                                                    'bg-red-500/10 border-red-500/20 text-red-400'}
                                                    `}>
                                                        {nivel === 'Superior' ? '⭐' : <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
                                                        {nivel}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Vista: Instituciones */}
                {vistaActual === 'instituciones' && (
                    <InstitucionesPanel 
                        porInstitucion={porInstitucion} 
                        onOpenPreview={(est) => {
                            setPreviewData(est);
                            setShowPreviewModal(true);
                        }} 
                    />
                )}

                {/* Vista: Departamentos */}
                {vistaActual === 'departamentos' && (
                    <DepartamentosPanel
                        porDepartamento={porDepartamento}
                        totalEstudiantes={estudiantes.length}
                        simulacroId={simulacroActual}
                        onOpenPreview={(data) => {
                            setPreviewData(data);
                            setShowPreviewModal(true);
                        }}
                    />
                )}

                {/* Vista: Alertas */}
                {vistaActual === 'alertas' && (
                    <div className="space-y-6">
                        {/* Resumen de Alertas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-lg rounded-2xl border border-red-500/30 p-6 text-center">
                                <div className="text-5xl font-black text-red-400 mb-2">
                                    {alertas.sinSesion1.filter(e => !tieneSesion(e, 's2') && !tieneSesion(e, 'seccion2')).length}
                                </div>
                                <p className="text-red-300 font-bold">Sin ninguna sesión</p>
                                <p className="text-red-200/60 text-sm mt-1">No presentaron S1 ni S2</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur-lg rounded-2xl border border-orange-500/30 p-6 text-center">
                                <div className="text-5xl font-black text-orange-400 mb-2">
                                    {alertas.sinSesion1.length + alertas.sinSesion2.length - alertas.sinSesion1.filter(e => !tieneSesion(e, 's2') && !tieneSesion(e, 'seccion2')).length}
                                </div>
                                <p className="text-orange-300 font-bold">Sesión incompleta</p>
                                <p className="text-orange-200/60 text-sm mt-1">Falta S1 o S2</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-lg rounded-2xl border border-emerald-500/30 p-6 text-center">
                                <div className="text-5xl font-black text-emerald-400 mb-2">
                                    {estudiantes.filter(e => tieneSesion(e, 's1') && tieneSesion(e, 's2')).length}
                                </div>
                                <p className="text-emerald-300 font-bold">Completos ✓</p>
                                <p className="text-emerald-200/60 text-sm mt-1">Ambas sesiones</p>
                            </div>
                        </div>

                        {/* Sin ninguna sesión - CRÍTICO */}
                        {alertas.sinSesion1.filter(e => !tieneSesion(e, 's2') && !tieneSesion(e, 'seccion2')).length > 0 && (
                            <div className="bg-gradient-to-r from-red-500/20 via-red-600/10 to-red-500/20 backdrop-blur-lg rounded-2xl border-2 border-red-500/50 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-red-400 font-bold text-xl flex items-center gap-3">
                                        <span className="text-3xl">🚨</span>
                                        Sin Ninguna Sesión
                                        <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full ml-2">
                                            {alertas.sinSesion1.filter(e => !tieneSesion(e, 's2') && !tieneSesion(e, 'seccion2')).length}
                                        </span>
                                    </h3>
                                    <span className="text-red-300 text-sm bg-red-500/20 px-3 py-1 rounded-lg">CRÍTICO</span>
                                </div>
                                <p className="text-red-200/80 mb-4 text-sm">
                                    Estos estudiantes <strong>no presentaron ninguna sesión</strong>. Deben completar ambas sesiones obligatorias.
                                </p>
                                <div className="grid gap-2 max-h-80 overflow-y-auto">
                                    {alertas.sinSesion1.filter(e => !tieneSesion(e, 's2') && !tieneSesion(e, 'seccion2')).map((est, idx) => (
                                        <div key={idx} className="bg-red-500/10 hover:bg-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors cursor-pointer border border-red-500/20"
                                            onClick={() => setEstudianteSeleccionado(est)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-500/30 rounded-xl flex items-center justify-center text-red-300 font-bold">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <span className="text-white font-semibold block">{est.informacion_personal.nombres} {est.informacion_personal.apellidos}</span>
                                                    <span className="text-white/50 text-sm">{est.informacion_personal.institucion}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-white/40 text-sm font-mono">{est.informacion_personal.numero_identificacion}</span>
                                                <div className="flex gap-1">
                                                    <span className="bg-red-500/50 text-red-200 text-xs px-2 py-1 rounded">❌ S1</span>
                                                    <span className="bg-red-500/50 text-red-200 text-xs px-2 py-1 rounded">❌ S2</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sesión 1 faltante (pero tienen S2) */}
                        <div className="bg-orange-500/10 backdrop-blur-lg rounded-2xl border border-orange-500/30 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-orange-400 font-bold text-lg flex items-center gap-3">
                                    <span className="text-2xl">⚠️</span>
                                    Solo Falta Sesión 1
                                    <span className="bg-orange-500/50 text-orange-100 text-sm px-3 py-1 rounded-full">
                                        {alertas.sinSesion1.filter(e => tieneSesion(e, 's2') || tieneSesion(e, 'seccion2')).length}
                                    </span>
                                </h3>
                            </div>
                            {alertas.sinSesion1.filter(e => tieneSesion(e, 's2') || tieneSesion(e, 'seccion2')).length === 0 ? (
                                <p className="text-white/60">✓ Todos los que tienen S2 también tienen S1</p>
                            ) : (
                                <div className="grid gap-2 max-h-60 overflow-y-auto">
                                    {alertas.sinSesion1.filter(e => tieneSesion(e, 's2') || tieneSesion(e, 'seccion2')).map((est, idx) => (
                                        <div key={idx} className="bg-white/5 hover:bg-orange-500/10 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors cursor-pointer"
                                            onClick={() => setEstudianteSeleccionado(est)}
                                        >
                                            <div>
                                                <span className="text-white font-medium">{est.informacion_personal.nombres} {est.informacion_personal.apellidos}</span>
                                                <span className="text-white/40 text-xs ml-2">({est.informacion_personal.institucion})</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/50 text-sm font-mono">{est.informacion_personal.numero_identificacion}</span>
                                                <span className="bg-red-500/30 text-red-300 text-xs px-2 py-1 rounded">❌ S1</span>
                                                <span className="bg-green-500/30 text-green-300 text-xs px-2 py-1 rounded">✓ S2</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sesión 2 faltante (pero tienen S1) */}
                        <div className="bg-orange-500/10 backdrop-blur-lg rounded-2xl border border-orange-500/30 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-orange-400 font-bold text-lg flex items-center gap-3">
                                    <span className="text-2xl">⚠️</span>
                                    Solo Falta Sesión 2
                                    <span className="bg-orange-500/50 text-orange-100 text-sm px-3 py-1 rounded-full">
                                        {alertas.sinSesion2.filter(e => tieneSesion(e, 's1') || tieneSesion(e, 'seccion1')).length}
                                    </span>
                                </h3>
                            </div>
                            {alertas.sinSesion2.filter(e => tieneSesion(e, 's1') || tieneSesion(e, 'seccion1')).length === 0 ? (
                                <p className="text-white/60">✓ Todos los que tienen S1 también tienen S2</p>
                            ) : (
                                <div className="grid gap-2 max-h-60 overflow-y-auto">
                                    {alertas.sinSesion2.filter(e => tieneSesion(e, 's1') || tieneSesion(e, 'seccion1')).map((est, idx) => (
                                        <div key={idx} className="bg-white/5 hover:bg-orange-500/10 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors cursor-pointer"
                                            onClick={() => setEstudianteSeleccionado(est)}
                                        >
                                            <div>
                                                <span className="text-white font-medium">{est.informacion_personal.nombres} {est.informacion_personal.apellidos}</span>
                                                <span className="text-white/40 text-xs ml-2">({est.informacion_personal.institucion})</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/50 text-sm font-mono">{est.informacion_personal.numero_identificacion}</span>
                                                <span className="bg-green-500/30 text-green-300 text-xs px-2 py-1 rounded">✓ S1</span>
                                                <span className="bg-red-500/30 text-red-300 text-xs px-2 py-1 rounded">❌ S2</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Puntaje bajo */}
                        <div className="bg-purple-500/10 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-6">
                            <h3 className="text-purple-400 font-bold text-lg flex items-center gap-3 mb-4">
                                <span className="text-2xl">📉</span>
                                Puntaje Bajo (menos de 250)
                                <span className="bg-purple-500/50 text-purple-100 text-sm px-3 py-1 rounded-full">
                                    {alertas.puntajeBajo.length}
                                </span>
                            </h3>
                            {alertas.puntajeBajo.length === 0 ? (
                                <p className="text-white/60">✓ No hay estudiantes con puntaje bajo</p>
                            ) : (
                                <div className="grid gap-2 max-h-60 overflow-y-auto">
                                    {alertas.puntajeBajo.sort((a, b) => (a.puntaje_global || 0) - (b.puntaje_global || 0)).map((est, idx) => (
                                        <div key={idx} className="bg-white/5 hover:bg-purple-500/10 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors cursor-pointer"
                                            onClick={() => setEstudianteSeleccionado(est)}
                                        >
                                            <div>
                                                <span className="text-white font-medium">{est.informacion_personal.nombres} {est.informacion_personal.apellidos}</span>
                                                <span className="text-white/40 text-xs ml-2">({est.informacion_personal.institucion})</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/50 text-sm">{est.informacion_personal.numero_identificacion}</span>
                                                <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-lg font-bold">{est.puntaje_global}/500</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Fin del bloque condicional de datos de estudiantes ── */}
                </>)}

                {/* Vista: Seguimiento curso vacacional */}
                {vistaActual === 'seguimiento' && (
                    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-4 sm:p-6">
                        <CourseAttendanceMonitor />
                    </div>
                )}

                {/* Vista: Monitor de Accesos */}
                {vistaActual === 'accesos' && <AccessMonitor />}

                {/* Vista: Monitor de Almacenamiento (localStorage) */}
                {vistaActual === 'storage' && <StorageMonitor />}
            </main>


            {/* Modal de Detalle de Estudiante - Nuevo con Auditoría */}
            <StudentDetailModal
                estudiante={estudianteSeleccionado}
                estadisticas={estadisticas}
                isOpen={!!estudianteSeleccionado}
                onClose={() => setEstudianteSeleccionado(null)}
                simId={simulacroActual}
            />

            {/* Modal de Exportación */}
            {
                showExportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowExportModal(false)} />
                        <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold mb-4">Configurar Exportación</h2>

                            <div className="space-y-4">
                                {/* Formato */}
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Formato</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setExportConfig({ ...exportConfig, format: 'xlsx' })}
                                            className={`flex-1 py-2 rounded-lg border ${exportConfig.format === 'xlsx' ? 'bg-green-600 border-green-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                        >
                                            Excel (.xlsx)
                                        </button>
                                        <button
                                            onClick={() => setExportConfig({ ...exportConfig, format: 'csv' })}
                                            className={`flex-1 py-2 rounded-lg border ${exportConfig.format === 'csv' ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                        >
                                            CSV (.csv)
                                        </button>
                                    </div>
                                </div>

                                {/* Institución */}
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Institución</label>
                                    <select
                                        value={exportConfig.institucion}
                                        onChange={(e) => setExportConfig({ ...exportConfig, institucion: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-purple-500 [&>option]:bg-slate-900"
                                    >
                                        <option value="todas">Todas las instituciones</option>
                                        {porInstitucion.map(([nombre]) => (
                                            <option key={nombre} value={nombre}>{nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Departamento */}
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Departamento</label>
                                    <select
                                        value={exportConfig.departamento}
                                        onChange={(e) => setExportConfig({ ...exportConfig, departamento: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-purple-500 [&>option]:bg-slate-900"
                                    >
                                        <option value="todos">Todos los departamentos</option>
                                        {porDepartamento.map(([nombre]) => (
                                            <option key={nombre} value={nombre}>{nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Nivel */}
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Nivel de Desempeño</label>
                                    <select
                                        value={exportConfig.nivel}
                                        onChange={(e) => setExportConfig({ ...exportConfig, nivel: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-purple-500 [&>option]:bg-slate-900"
                                    >
                                        <option value="todos">Todos los niveles</option>
                                        <option value="Superior">⭐⭐ Superior</option>
                                        <option value="Alto">🔵 Alto</option>
                                        <option value="Medio">🟡 Medio</option>
                                        <option value="Bajo">🔴 Bajo</option>
                                    </select>
                                </div>

                                {/* Filtros extra */}
                                <div className="pt-2 border-t border-white/10">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={exportConfig.soloCompletos}
                                            onChange={(e) => setExportConfig({ ...exportConfig, soloCompletos: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm">Solo estudiantes con Sesión 1 y 2 completas</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="px-4 py-2 hover:bg-white/10 rounded-lg text-white/70"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg shadow-purple-500/20"
                                >
                                    Descargar Reporte
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }



            {/* Modal de Previsualización y Edición */}
            <ExportPreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                estudiantesOriginales={previewData}
                onUpdateEstudiantes={(nuevos) => {
                    console.log("Datos para exportar actualizados:", nuevos.length);
                }}
            />

            {/* Modal de Gestión de Invalidaciones */}
            <InvalidacionesManager
                isOpen={showInvalidacionesModal}
                onClose={() => setShowInvalidacionesModal(false)}
            />

            {/* Barra Flotante */}
            <FloatingActionBar
                selectedCount={selectedIds.size}
                onClear={() => setSelectedIds(new Set())}
                onExport={() => setShowExportModal(true)}
                onCompare={() => setShowComparisonView(true)}
            />

            {/* Modal de Comparación (Versus Mode) */}
            {showComparisonView && (
                <StudentComparisonView
                    estudiantes={estudiantes}
                    initialEstudiante1={selectedIds.size > 0 ? estudiantes.find(e => e.informacion_personal.numero_identificacion === Array.from(selectedIds)[0]) : undefined}
                    initialEstudiante2={selectedIds.size > 1 ? estudiantes.find(e => e.informacion_personal.numero_identificacion === Array.from(selectedIds)[1]) : undefined}
                    onClose={() => setShowComparisonView(false)}
                />
            )}
        </div >
    );
}
