'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import classNames from 'classnames';
import SgBrandedLoadingExperience from '@/components/SgBrandedLoadingExperience';
import type { Estudiante } from '@shared/types';
import CoordinatorPerformanceAreaNav, {
    materiasFromPuntajes,
} from '@features/coordinador/components/CoordinatorPerformanceAreaNav';

const PerformanceLevelReport = dynamic(
    () => import('@/components/PerformanceLevelReport'),
    {
        loading: () => (
            <SgBrandedLoadingExperience
                variant="compact"
                message="Cargando niveles de desempeño"
                personalize={false}
                showPercent={false}
            />
        ),
    },
);

type StudentNivelesDesempenoPanelProps = {
    puntajes?: Estudiante['puntajes'] | null;
    className?: string;
    /** Nav inline dentro del panel (false si el padre lo pone en cabecera) */
    showNav?: boolean;
    activeMateria?: string;
    onMateriaChange?: (key: string) => void;
};

export default function StudentNivelesDesempenoPanel({
    puntajes,
    className,
    showNav = true,
    activeMateria: activeMateriaProp,
    onMateriaChange,
}: StudentNivelesDesempenoPanelProps) {
    const materias = useMemo(() => materiasFromPuntajes(puntajes), [puntajes]);
    const materiaKeys = useMemo(() => materias.map((m) => m.key), [materias]);

    const [internalMateria, setInternalMateria] = useState('');

    const materiaActiva =
        activeMateriaProp && materiaKeys.includes(activeMateriaProp)
            ? activeMateriaProp
            : internalMateria && materiaKeys.includes(internalMateria)
                ? internalMateria
                : materiaKeys[0] || '';

    const setMateriaActiva = onMateriaChange ?? setInternalMateria;

    if (materias.length === 0) {
        return (
            <p className={classNames('text-sm text-white/40', className)}>
                Sin puntajes por materia para este estudiante.
            </p>
        );
    }

    const puntaje = puntajes?.[materiaActiva]?.puntaje ?? 0;

    return (
        <div className={classNames('mx-auto max-w-5xl space-y-5', className)}>
            {showNav && (
                <CoordinatorPerformanceAreaNav
                    items={materias}
                    activeKey={materiaActiva}
                    onSelect={setMateriaActiva}
                    layout="header"
                    label="Área de desempeño"
                />
            )}
            <PerformanceLevelReport materia={materiaActiva} puntaje={puntaje} />
        </div>
    );
}
