'use client';
import { ReactNode, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, FileSpreadsheet, GraduationCap } from 'lucide-react';
import { resolveInstitutionBannerUrl } from '@features/coordinador/lib/institutionBannerImages';
import { InstitutionBannerImage } from '@features/coordinador/components/InstitutionBannerImage';
import {
    gradoFromPifaOption,
    PIFA_CURSO_TODOS,
    PIFA_SIN_DATO,
} from '@shared/lib/pifaCurso';

/**
 * Cabecera del panel coordinador: banner institucional + filtros + export.
 */

export interface CoordinadorContextHeaderProps {
    title: string;
    subtitle?: string;
    institutionName: string;
    simulationId: string;
    availableSimulations: string[];
    availableInstitutions: string[];
    currentInstitution: string;
    onChangeSimulation: (s: string) => void;
    onChangeInstitution: (i: string) => void;
    /** Filtro PIFA unificado: grado/curso (9, 11-1, 10-A, …). */
    availableCursos?: string[];
    currentCurso?: string;
    onChangeCurso?: (c: string) => void;
    onExport?: () => void;
    exporting?: boolean;
    children?: ReactNode;
}

export default function CoordinadorContextHeader({
    title,
    subtitle,
    institutionName,
    simulationId,
    availableSimulations,
    availableInstitutions,
    currentInstitution,
    onChangeSimulation,
    onChangeInstitution,
    availableCursos = [],
    currentCurso = 'TODOS',
    onChangeCurso,
    onExport,
    exporting = false,
    children,
}: CoordinadorContextHeaderProps) {
    const showInstitutionSelector = availableInstitutions.length > 1;
    const showCursoSelector = Boolean(onChangeCurso) && availableCursos.length > 1;
    const institutionValue = currentInstitution || availableInstitutions[0] || '';
    const bannerUrl = useMemo(
        () => resolveInstitutionBannerUrl(institutionValue || institutionName),
        [institutionValue, institutionName],
    );
    const contextLine = [institutionName, subtitle, simulationId].filter(Boolean).join(' · ');

    return (
        <div data-coordinator-theme data-coord-tour="coord-report-toolbar">
            <div
                className="rounded-2xl relative overflow-hidden"
                style={{
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,12,22,0.98))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 18px 55px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
            >
                {/* Banner institucional o fallback compacto */}
                <div
                    className="relative w-full overflow-hidden border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.07)' }}
                >
                    {bannerUrl ? (
                        <InstitutionBannerImage src={bannerUrl} />
                    ) : (
                        <div
                            className="flex min-h-[72px] items-center px-4 py-3 sm:px-5 sm:py-4"
                            style={{
                                background:
                                    'linear-gradient(90deg, rgba(15,23,42,0.98) 0%, rgba(30,27,75,0.85) 100%)',
                            }}
                        >
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/60">
                                    Seamos Genios · Coordinador
                                </p>
                                <p className="mt-0.5 truncate text-sm font-bold text-white sm:text-base">
                                    {title}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-3 sm:p-4 md:p-5">
                    <div className="grid gap-3">
                        <div className="min-w-0">
                            {bannerUrl ? (
                                <p
                                    className="truncate text-[11px] leading-snug sm:text-xs"
                                    style={{ color: 'var(--coord-text-tertiary)' }}
                                    title={contextLine}
                                >
                                    {contextLine}
                                </p>
                            ) : (
                                <>
                                    <h2
                                        className="text-sm font-black tracking-tight sm:text-base md:text-lg"
                                        style={{ color: 'var(--coord-text-primary)' }}
                                    >
                                        {title}
                                    </h2>
                                    <p
                                        className="mt-0.5 truncate text-[11px] leading-snug sm:text-xs"
                                        style={{ color: 'var(--coord-text-tertiary)' }}
                                        title={contextLine}
                                    >
                                        {contextLine}
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="grid w-full grid-cols-1 items-end gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1.4fr)_minmax(120px,160px)_minmax(120px,180px)_auto]">
                            {showInstitutionSelector && (
                                <div className="coord-select-resizable-shell min-w-[200px] max-w-full sm:col-span-2 lg:col-span-1">
                                    <SelectControl
                                        label="Institución"
                                        value={institutionValue}
                                        options={availableInstitutions}
                                        onChange={onChangeInstitution}
                                        className="min-w-0 w-full"
                                    />
                                </div>
                            )}

                            <SelectControl
                                label="Simulacro"
                                value={simulationId}
                                options={availableSimulations}
                                onChange={onChangeSimulation}
                                className="min-w-0"
                            />

                            {showCursoSelector && onChangeCurso && (
                                <SelectControl
                                    label="Grado / Curso"
                                    value={currentCurso}
                                    options={availableCursos}
                                    onChange={onChangeCurso}
                                    className="min-w-0"
                                    groupedCourses
                                />
                            )}

                            {onExport && (
                                <button
                                    type="button"
                                    onClick={onExport}
                                    disabled={exporting}
                                    className="coord-btn-primary w-full shrink-0 justify-center sm:col-span-2 lg:col-span-1 lg:w-auto"
                                    title="Exportar reporte detallado en Excel"
                                >
                                    <FileSpreadsheet className="h-4 w-4 shrink-0" />
                                    <span>{exporting ? 'Generando…' : 'Exportar Excel'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                    {children && (
                        <div
                            className="mt-3 border-t pt-3"
                            style={{ borderColor: 'var(--coord-border)' }}
                        >
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SelectControl({
    label,
    value,
    options,
    onChange,
    className = '',
    groupedCourses = false,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
    className?: string;
    groupedCourses?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
    const dropdownId = useId();
    const shellRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const uniqueOptions = useMemo(() => {
        const seen = new Set<string>();
        return options.filter((opt) => {
            if (seen.has(opt)) return false;
            seen.add(opt);
            return true;
        });
    }, [options]);
    const selectedOption = uniqueOptions.includes(value) ? value : uniqueOptions[0] || '—';
    const selectedLabel = groupedCourses ? formatCourseOption(selectedOption) : selectedOption;
    const hasOptions = uniqueOptions.length > 0;

    const updateMenuPosition = () => {
        const shell = shellRef.current;
        if (!shell) return;

        const rect = shell.getBoundingClientRect();
        setMenuStyle({
            position: 'fixed',
            top: rect.bottom + 8,
            left: rect.left,
            minWidth: rect.width,
            maxWidth: 'min(34rem, calc(100vw - 1rem))',
        });
    };

    useLayoutEffect(() => {
        if (!isOpen) return;
        updateMenuPosition();

        window.addEventListener('resize', updateMenuPosition);
        window.addEventListener('scroll', updateMenuPosition, true);

        return () => {
            window.removeEventListener('resize', updateMenuPosition);
            window.removeEventListener('scroll', updateMenuPosition, true);
        };
    }, [isOpen, uniqueOptions.length]);

    useEffect(() => {
        if (!isOpen) return;

        function handlePointerDown(event: PointerEvent) {
            const target = event.target as Node;
            if (!shellRef.current?.contains(target) && !menuRef.current?.contains(target)) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setIsOpen(false);
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className={`flex min-w-0 flex-col gap-1 ${className}`.trim()}>
            <span
                id={`${dropdownId}-label`}
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--coord-text-tertiary)' }}
            >
                {label}
            </span>
            <div ref={shellRef} className={`coord-select-shell relative min-w-0${isOpen ? ' is-open' : ''}`}>
                <button
                    type="button"
                    className="coord-input-native coord-select-trigger w-full pr-10"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-labelledby={`${dropdownId}-label ${dropdownId}-value`}
                    disabled={!hasOptions}
                    onClick={() => hasOptions && setIsOpen((open) => !open)}
                >
                    <span id={`${dropdownId}-value`} className="coord-select-value">
                        {selectedLabel}
                    </span>
                </button>
                <span className={`coord-select-chevron ${isOpen ? 'is-open' : ''}`} aria-hidden="true">
                    <ChevronDown className="h-3.5 w-3.5" />
                </span>

                {isOpen && typeof document !== 'undefined' && createPortal(
                    <div
                        ref={menuRef}
                        className="coord-select-menu coord-select-menu--portaled"
                        style={menuStyle}
                        role="listbox"
                        aria-labelledby={`${dropdownId}-label`}
                    >
                        {uniqueOptions.map((option, index) => {
                            const isSelected = option === value;
                            const grade = groupedCourses ? gradoFromPifaOption(option) : null;
                            const previous = uniqueOptions[index - 1] || '';
                            const previousGrade = groupedCourses
                                ? gradoFromPifaOption(previous) || inferCourseGrade(previous)
                                : null;
                            const optionGrade = grade || (groupedCourses ? inferCourseGrade(option) : null);
                            const showGradeHeading =
                                groupedCourses &&
                                Boolean(optionGrade) &&
                                optionGrade !== previousGrade;

                            return (
                                <div key={`${dropdownId}-${index}-${option}`}>
                                    {showGradeHeading && optionGrade && (
                                        <div className="coord-select-group-label">
                                            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                                            <span>{gradeName(optionGrade)}</span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        className={`coord-select-option ${
                                            isSelected ? 'is-selected' : ''
                                        } ${groupedCourses && !grade ? 'is-course' : ''} ${
                                            groupedCourses ? 'has-check' : 'is-plain'
                                        }`}
                                        onClick={() => {
                                            onChange(option);
                                            setIsOpen(false);
                                        }}
                                    >
                                        {groupedCourses && (
                                            <span className="coord-select-option-check" aria-hidden="true">
                                                {isSelected && <Check className="h-3 w-3" />}
                                            </span>
                                        )}
                                        <span className="coord-select-option-text">
                                            {groupedCourses ? formatCourseOption(option) : option}
                                        </span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>,
                    document.body,
                )}
            </div>
        </div>
    );
}

function inferCourseGrade(option: string): string | null {
    return option.match(/^(9|10|11)(?:\D|$)/)?.[1] || null;
}

function gradeName(grade: string): string {
    return grade === '9' ? 'Noveno' : grade === '10' ? 'Décimo' : grade === '11' ? 'Once' : `Grado ${grade}`;
}

function formatCourseOption(option: string): string {
    if (option === PIFA_CURSO_TODOS) return 'Todos los grados y cursos';
    if (option === PIFA_SIN_DATO) return 'Sin curso asignado';
    const grade = gradoFromPifaOption(option);
    if (grade) return `Todo ${gradeName(grade).toLowerCase()}`;
    return `Curso ${option}`;
}
