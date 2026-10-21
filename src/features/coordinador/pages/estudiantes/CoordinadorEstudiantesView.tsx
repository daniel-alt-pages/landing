'use client';
import { useCoordinadorData as useCoordinadorDataHook } from '@features/coordinador/hooks/useCoordinadorData';

export type UseCoordinadorDataFn = typeof useCoordinadorDataHook;
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Estudiante } from '@shared/types';
import { useUrlQueryState } from '@shared/hooks/useUrlQueryState';
import { LoadingState, ErrorState } from '@features/coordinador/components/ui';
import CoordinadorContextHeader from '@features/coordinador/components/CoordinadorContextHeader';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { useCoordinadorPanelLayout } from '@features/coordinador/hooks/useCoordinadorPanelLayout';
import {
    matchesStudentSearch,
    getStudentPerformanceLevel,
    getStudentSubjectScore,
} from '@shared/lib/studentDisplay';
import {
    CoordinatorStudentListTable,
    StudentLevelFilterPills,
} from '@features/coordinador/components/CoordinatorStudentListTable';
import CoordinatorStudentProfileModal from '@features/coordinador/components/cohort/CoordinatorStudentProfileModal';
import { useCoordEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/context/CoordEmbedProvider';

export function CoordinadorEstudiantesView({
    useCoordinadorData,
    embedDemo = false,
}: {
    useCoordinadorData: UseCoordinadorDataFn;
    embedDemo?: boolean;
}) {
    const layout = useCoordinadorPanelLayout(embedDemo);
    const { maskDocumentIds } = useCoordEmbed();
    const {
        myInstitution: inst,
        questionAnalysis,
        currentSimulation,
        availableSimulations,
        availableInstitutions,
        currentInstitution,
        availableCursos,
        currentCurso,
        setSimulation,
        setInstitution,
        setCurso,
        loading,
        error,
        loadFullStudents,
    } = useCoordinadorData();
    const urlPersist = !embedDemo;
    const [search, setSearch] = useUrlQueryState('q', '', { persist: urlPersist });
    const [sortKey, setSortKey] = useUrlQueryState('sort', 'global', { persist: urlPersist });
    const [sortAscRaw, setSortAscRaw] = useUrlQueryState('asc', '0', { persist: urlPersist });
    const sortAsc = sortAscRaw === '1';
    const setSortAsc = (v: boolean) => setSortAscRaw(v ? '1' : '0');
    const [levelFilter, setLevelFilter] = useUrlQueryState('nivel', 'all', { persist: urlPersist });
    const [studentId, setStudentId] = useUrlQueryState('student', '', { persist: urlPersist });
    const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null);
    const [autoPickLoading, setAutoPickLoading] = useState(false);
    const [autoPickMsg, setAutoPickMsg] = useState<string>('');

    useEffect(() => {
        loadFullStudents();
    }, [currentSimulation]); // eslint-disable-line react-hooks/exhaustive-deps

    const openStudent = useCallback(
        (s: Estudiante) => {
            setSelectedStudent(s);
            setStudentId(s.informacion_personal?.numero_identificacion || '');
        },
        [setStudentId],
    );
    const closeStudent = useCallback(() => {
        setSelectedStudent(null);
        setStudentId('');
    }, [setStudentId]);

    useEffect(() => {
        if (!studentId) {
            setSelectedStudent(null);
            return;
        }
        if (loading || !inst) return;
        const found = (inst.students || []).find(
            (s) => String(s.informacion_personal?.numero_identificacion || '') === studentId,
        );
        if (found) {
            setSelectedStudent(found);
            return;
        }
        setSelectedStudent(null);
        setStudentId('');
    }, [studentId, loading, inst, setStudentId]);

    const students = inst?.students || [];
    const instAvg = inst ? Object.fromEntries(inst.subjectStats.map(s => [s.key, s.avg])) : {};

    const filtered = useMemo(() => {
        let list = [...students];

        if (search.trim()) {
            list = list.filter(s => matchesStudentSearch(s, search));
        }

        if (levelFilter !== 'all') {
            list = list.filter(s => getStudentPerformanceLevel(s.puntaje_global || 0).key === levelFilter);
        }

        list.sort((a, b) => {
            let va: number, vb: number;
            if (sortKey === 'global') {
                va = a.puntaje_global || 0;
                vb = b.puntaje_global || 0;
            } else if (sortKey === 'name') {
                const na = `${a.informacion_personal?.nombres} ${a.informacion_personal?.apellidos}`;
                const nb = `${b.informacion_personal?.nombres} ${b.informacion_personal?.apellidos}`;
                return sortAsc ? na.localeCompare(nb) : nb.localeCompare(na);
            } else {
                va = getStudentSubjectScore(a, sortKey);
                vb = getStudentSubjectScore(b, sortKey);
            }
            return sortAsc ? va - vb : vb - va;
        });

        return list;
    }, [students, search, sortKey, sortAsc, levelFilter]);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(false);
        }
    };

    const autoPickStudentForComparison = useCallback(async () => {
        if (autoPickLoading) return;
        setAutoPickLoading(true);
        setAutoPickMsg('');
        try {
            const { getStudentResults } = await import('@features/simulacro/lib/firestoreService');
            const targetSim = 'SG11-17';
            const otherSims = availableSimulations.filter(s => s !== targetSim);

            const candidates = [...students]
                .filter(s => (s.puntaje_global || 0) > 0 && String(s.informacion_personal?.numero_identificacion || '').trim())
                .slice(0, 120);

            for (const s of candidates) {
                const id = String(s.informacion_personal?.numero_identificacion || '').trim();
                if (!id) continue;

                try {
                    const sg = await getStudentResults(id, targetSim);
                    if (!sg || (sg.puntaje_global || 0) <= 0) continue;
                } catch {
                    continue;
                }

                let foundOther = '';
                for (const simId of otherSims) {
                    try {
                        const d = await getStudentResults(id, simId);
                        if (d && (d.puntaje_global || 0) > 0) {
                            foundOther = simId;
                            break;
                        }
                    } catch {
                        // skip
                    }
                }
                if (!foundOther) continue;

                setSelectedStudent(s);
                setStudentId(id);
                setSearch(id);
                setAutoPickMsg(`Listo: ${id} (tiene ${targetSim} y ${foundOther}).`);
                try { await navigator.clipboard.writeText(id); } catch { /* ignore */ }
                setAutoPickLoading(false);
                return;
            }

            setAutoPickMsg('No encontré en este listado un estudiante con SG11-17 y otro simulacro. Prueba cambiar simulacro o institución y vuelve a intentar.');
        } catch {
            setAutoPickMsg('Error buscando estudiante para comparación. Intenta de nuevo.');
        } finally {
            setAutoPickLoading(false);
        }
    }, [autoPickLoading, availableSimulations, students]);

    if (loading) {
        return <LoadingState message="Cargando estudiantes…" fullScreen />;
    }

    if (error || !inst) {
        return (
            <ErrorState
                message="No fue posible cargar los estudiantes"
                detail={error || 'Sin datos disponibles para tu institución.'}
            />
        );
    }

    return (
        <>
            {selectedStudent && (
                <CoordinatorStudentProfileModal
                    student={selectedStudent}
                    onClose={closeStudent}
                    institutionAvg={instAvg}
                    allStudents={students}
                    questionAnalysis={questionAnalysis}
                    currentSimulation={currentSimulation}
                    availableSimulations={availableSimulations}
                    maskDocumentIds={maskDocumentIds}
                    embedDemo={embedDemo}
                />
            )}

            <div
                data-coordinator-theme
                className={`${layout.estudiantesRootClass ?? ''} ${layout.pagePaddingClass} max-w-7xl mx-auto space-y-5 min-w-0`.trim()}
            >
                <div data-coord-tour={TourAnchors.estudiantesHeader}>
                    <CoordinadorContextHeader
                        title="Estudiantes"
                        subtitle={`${filtered.length} de ${students.length} en listado`}
                        institutionName={inst.name}
                        simulationId={currentSimulation}
                        availableSimulations={availableSimulations}
                        availableInstitutions={availableInstitutions}
                        currentInstitution={currentInstitution}
                        onChangeSimulation={setSimulation}
                        onChangeInstitution={setInstitution}
                        availableCursos={availableCursos}
                        currentCurso={currentCurso}
                        onChangeCurso={setCurso}
                    />
                </div>

                <div
                    className="flex flex-col gap-2.5"
                    data-coord-tour={TourAnchors.estudiantesControls}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="relative flex-1 min-w-0">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o documento..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                aria-label="Buscar estudiantes"
                                className="coord-input-native w-full"
                                style={{ paddingLeft: '2.25rem' }}
                            />
                        </div>

                        <button
                            onClick={autoPickStudentForComparison}
                            disabled={autoPickLoading || students.length === 0}
                            className="shrink-0 text-xs font-black px-3 py-2 rounded-lg transition-all"
                            style={{
                                background: autoPickLoading ? 'rgba(255,255,255,0.06)' : 'rgba(139,92,246,0.18)',
                                color: autoPickLoading ? 'rgba(255,255,255,0.35)' : '#c4b5fd',
                                border: '1px solid rgba(139,92,246,0.25)',
                            }}
                            aria-label="Encontrar estudiante con SG11-17 y otros simulacros"
                        >
                            {autoPickLoading ? 'Buscando…' : 'Sugerir para comparación'}
                        </button>
                    </div>

                    <StudentLevelFilterPills value={levelFilter} onChange={setLevelFilter} />

                    {autoPickMsg && (
                        <span className="text-[11px] font-semibold text-white/40 truncate" title={autoPickMsg}>
                            {autoPickMsg}
                        </span>
                    )}
                </div>

                <CoordinatorStudentListTable
                    students={filtered}
                    onRowClick={openStudent}
                    maskDocumentIds={maskDocumentIds}
                    sortKey={sortKey}
                    sortAsc={sortAsc}
                    onSort={handleSort}
                    showAnalyzeHint
                    maxHeight="none"
                    tourAnchor={TourAnchors.estudiantesTable}
                />
            </div>
        </>
    );
}
