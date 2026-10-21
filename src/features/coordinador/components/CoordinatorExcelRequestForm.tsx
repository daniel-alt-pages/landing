'use client';

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CheckCircle2,
    ClipboardList,
    FileSpreadsheet,
    MessageCircle,
    UserRound,
    X,
} from 'lucide-react';
import { buildCoordinatorExcelRequestUrl } from '@/lib/supportWhatsApp';
import { formatSimulationDisplayLabel } from '@/lib/simulationDisplayLabel';

const STEPS = ['name', 'institution', 'simulation', 'reportScope', 'notes', 'review'] as const;
type StepId = (typeof STEPS)[number];

const REPORT_SCOPE_OPTIONS = [
    { value: 'completo', label: 'Reporte completo', desc: 'Todas las hojas institucionales' },
    { value: 'resumen', label: 'Resumen ejecutivo', desc: 'KPIs y panorama general' },
    { value: 'ranking', label: 'Ranking y cohortes', desc: 'Posiciones y comparativos' },
    { value: 'pensum', label: 'Pensum y nivelación', desc: 'Ruta curricular sugerida' },
    { value: 'preguntas', label: 'Análisis por pregunta', desc: 'Ítems críticos y desempeño' },
    { value: 'alertas', label: 'Alertas y riesgo', desc: 'Estudiantes que requieren seguimiento' },
    { value: 'fichas', label: 'Fichas individuales', desc: 'Detalle por estudiante' },
    { value: 'otro', label: 'Alcance personalizado', desc: 'Lo especificas en el siguiente paso' },
] as const;

const STEP_META: Record<StepId, { label: string; title: string; hint: string }> = {
    name: {
        label: 'Identidad',
        title: '¿Quién solicita el reporte?',
        hint: 'Usa el nombre con el que coordinas la institución.',
    },
    institution: {
        label: 'Nodo',
        title: '¿Para qué institución?',
        hint: 'Confirma el nodo o sede del reporte.',
    },
    simulation: {
        label: 'Simulacro',
        title: '¿De qué simulacro?',
        hint: 'Selecciona la versión de resultados que necesitas.',
    },
    reportScope: {
        label: 'Alcance',
        title: '¿Qué debe incluir el Excel?',
        hint: 'Elige el tipo de reporte que te enviaremos por WhatsApp.',
    },
    notes: {
        label: 'Detalle',
        title: '¿Algún requisito adicional?',
        hint: 'Opcional, salvo que hayas elegido alcance personalizado.',
    },
    review: {
        label: 'Confirmar',
        title: 'Revisa tu solicitud',
        hint: 'Verifica los datos antes de abrir WhatsApp.',
    },
};

function CoordField({
    id,
    label,
    icon,
    children,
}: {
    id: string;
    label: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="coord-excel-field">
            <label htmlFor={id} className="coord-excel-field__label">
                <span className="coord-excel-field__icon" aria-hidden>
                    {icon}
                </span>
                {label}
            </label>
            {children}
        </div>
    );
}

export type CoordinatorExcelRequestFormProps = {
    defaultInstitution?: string;
    defaultSimulation?: string;
    availableInstitutions?: string[];
    availableSimulations?: string[];
    sourcePanel?: string;
    onStepChange?: (index: number) => void;
};

export default function CoordinatorExcelRequestForm({
    defaultInstitution = '',
    defaultSimulation = '',
    availableInstitutions = [],
    availableSimulations = [],
    sourcePanel = 'Panel coordinador',
    onStepChange,
}: CoordinatorExcelRequestFormProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [fullName, setFullName] = useState('');
    const [institution, setInstitution] = useState(defaultInstitution);
    const [simulation, setSimulation] = useState(defaultSimulation);
    const [reportScope, setReportScope] = useState('');
    const [extraNotes, setExtraNotes] = useState('');

    const step = STEPS[stepIndex];
    const totalSteps = STEPS.length;
    const meta = STEP_META[step];

    useEffect(() => {
        onStepChange?.(stepIndex);
    }, [onStepChange, stepIndex]);

    const institutionOptions = useMemo(
        () => availableInstitutions.map((inst) => ({ value: inst, label: inst })),
        [availableInstitutions],
    );

    const simulationOptions = useMemo(() => {
        const ids =
            availableSimulations.length > 0
                ? availableSimulations
                : defaultSimulation
                  ? [defaultSimulation]
                  : [];
        return ids.map((simId) => ({
            value: simId,
            label: formatSimulationDisplayLabel(simId),
        }));
    }, [availableSimulations, defaultSimulation]);

    const reportScopeLabel =
        REPORT_SCOPE_OPTIONS.find((opt) => opt.value === reportScope)?.label ?? reportScope;

    const simulationDisplay = formatSimulationDisplayLabel(simulation);

    const canAdvance = useMemo(() => {
        switch (step) {
            case 'name':
                return fullName.trim().length >= 3;
            case 'institution':
                return institution.trim().length >= 2;
            case 'simulation':
                return simulation.trim().length >= 2;
            case 'reportScope':
                return reportScope.trim().length >= 2;
            case 'notes':
                return reportScope !== 'otro' || extraNotes.trim().length >= 10;
            case 'review':
                return true;
            default:
                return false;
        }
    }, [extraNotes, fullName, institution, reportScope, simulation, step]);

    const handleNext = useCallback(() => {
        if (!canAdvance || stepIndex >= totalSteps - 1) return;
        setStepIndex((i) => i + 1);
    }, [canAdvance, stepIndex, totalSteps]);

    const handleBack = useCallback(() => {
        if (stepIndex > 0) setStepIndex((i) => i - 1);
    }, [stepIndex]);

    const handleOpenWhatsApp = useCallback(() => {
        const url = buildCoordinatorExcelRequestUrl({
            fullName: fullName.trim(),
            institution: institution.trim(),
            simulation: simulationDisplay,
            reportScope,
            reportScopeLabel,
            extraNotes: extraNotes.trim(),
            sourcePanel,
        });
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }, [extraNotes, fullName, institution, reportScope, reportScopeLabel, simulationDisplay, sourcePanel]);

    const handleStepKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Enter' && canAdvance && step !== 'review' && step !== 'reportScope') {
                e.preventDefault();
                handleNext();
            }
        },
        [canAdvance, handleNext, step],
    );

    const inputClass =
        'coord-excel-input w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition-all';

    return (
        <div className="coord-excel-form" onKeyDown={handleStepKeyDown}>
            <div className="coord-excel-form__progress" aria-hidden>
                {STEPS.map((id, index) => {
                    const done = index < stepIndex;
                    const active = index === stepIndex;
                    return (
                        <div
                            key={id}
                            className={`coord-excel-form__dot ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}
                        />
                    );
                })}
            </div>

            <div className="coord-excel-form__step-meta">
                <p className="coord-excel-form__step-label">{meta.label}</p>
                <h3 className="coord-excel-form__step-title">{meta.title}</h3>
                <p className="coord-excel-form__step-hint">{meta.hint}</p>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="coord-excel-form__body"
                >
                    {step === 'name' && (
                        <CoordField id="excel-request-full-name" label="Nombres y apellidos" icon={<UserRound className="w-4 h-4" />}>
                            <input
                                id="excel-request-full-name"
                                type="text"
                                className={inputClass}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Ej: María Fernanda López"
                                maxLength={120}
                                autoFocus
                                autoComplete="name"
                            />
                        </CoordField>
                    )}

                    {step === 'institution' && (
                        <CoordField id="excel-request-institution" label="Institución / nodo" icon={<Building2 className="w-4 h-4" />}>
                            {institutionOptions.length > 0 ? (
                                <select
                                    id="excel-request-institution"
                                    className={`${inputClass} coord-excel-select`}
                                    value={institution}
                                    onChange={(e) => setInstitution(e.target.value)}
                                >
                                    <option value="">Selecciona la institución</option>
                                    {institutionOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    id="excel-request-institution"
                                    type="text"
                                    className={inputClass}
                                    value={institution}
                                    onChange={(e) => setInstitution(e.target.value)}
                                    placeholder="Ej: IE Soacha Centro"
                                    maxLength={120}
                                    autoFocus
                                />
                            )}
                        </CoordField>
                    )}

                    {step === 'simulation' && (
                        <CoordField id="excel-request-simulation" label="Simulacro" icon={<ClipboardList className="w-4 h-4" />}>
                            <select
                                id="excel-request-simulation"
                                className={`${inputClass} coord-excel-select`}
                                value={simulation}
                                onChange={(e) => setSimulation(e.target.value)}
                            >
                                <option value="">Selecciona el simulacro</option>
                                {simulationOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </CoordField>
                    )}

                    {step === 'reportScope' && (
                        <div className="coord-excel-scope-grid" role="radiogroup" aria-label="Alcance del reporte">
                            {REPORT_SCOPE_OPTIONS.map((opt) => {
                                const selected = reportScope === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => setReportScope(opt.value)}
                                        className={`coord-excel-scope-card ${selected ? 'is-selected' : ''}`}
                                    >
                                        <span className="coord-excel-scope-card__title">{opt.label}</span>
                                        <span className="coord-excel-scope-card__desc">{opt.desc}</span>
                                        {selected && <CheckCircle2 className="coord-excel-scope-card__check" aria-hidden />}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {step === 'notes' && (
                        <CoordField
                            id="excel-request-notes"
                            label={reportScope === 'otro' ? 'Detalle del alcance' : 'Detalle adicional (opcional)'}
                            icon={<ClipboardList className="w-4 h-4" />}
                        >
                            <textarea
                                id="excel-request-notes"
                                className={`${inputClass} coord-excel-textarea min-h-[120px] resize-y`}
                                rows={4}
                                value={extraNotes}
                                onChange={(e) => setExtraNotes(e.target.value)}
                                placeholder={
                                    reportScope === 'otro'
                                        ? 'Ej: Solo ranking del grado 11° del nodo X, con fichas de los 15 primeros…'
                                        : 'Ej: Incluir solo estudiantes con alerta crítica…'
                                }
                                maxLength={500}
                                autoFocus
                            />
                        </CoordField>
                    )}

                    {step === 'review' && (
                        <dl className="coord-excel-review">
                            {[
                                ['Solicitante', fullName.trim()],
                                ['Nodo', institution.trim()],
                                ['Simulacro', simulationDisplay],
                                ['Alcance', reportScopeLabel],
                            ].map(([label, value]) => (
                                <div key={label} className="coord-excel-review__row">
                                    <dt>{label}</dt>
                                    <dd>{value}</dd>
                                </div>
                            ))}
                            {extraNotes.trim() && (
                                <div className="coord-excel-review__notes">
                                    <dt>Detalle</dt>
                                    <dd>{extraNotes.trim()}</dd>
                                </div>
                            )}
                        </dl>
                    )}
                </motion.div>
            </AnimatePresence>

            <div className="coord-excel-form__actions">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={stepIndex === 0}
                    className="coord-excel-btn coord-excel-btn--ghost"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden />
                    Atrás
                </button>

                {step === 'review' ? (
                    <button type="button" onClick={handleOpenWhatsApp} className="coord-excel-btn coord-excel-btn--whatsapp">
                        <MessageCircle className="w-4 h-4" aria-hidden />
                        Abrir WhatsApp
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canAdvance}
                        className="coord-excel-btn coord-excel-btn--primary"
                    >
                        Continuar
                        <ArrowRight className="w-4 h-4" aria-hidden />
                    </button>
                )}
            </div>
        </div>
    );
}

export function CoordinatorExcelRequestShell({
    open,
    onClose,
    institutionName,
    simulationId,
    availableInstitutions,
    availableSimulations,
    sourcePanel,
}: {
    open: boolean;
    onClose: () => void;
    institutionName: string;
    simulationId: string;
    availableInstitutions: string[];
    availableSimulations: string[];
    sourcePanel?: string;
}) {
    const [stepIndex, setStepIndex] = useState(0);
    const hasPhone = Boolean(buildCoordinatorExcelRequestUrl({}));

    useEffect(() => {
        if (!open) setStepIndex(0);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (typeof document === 'undefined' || !open) return null;

    return createPortal(
        <div className="coord-excel-modal" role="presentation">
            <button
                type="button"
                className="coord-excel-modal__backdrop"
                aria-label="Cerrar solicitud de reporte"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="coord-excel-modal-title"
                data-coordinator-theme
                className="coord-excel-modal__panel"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="coord-excel-modal__accent" aria-hidden />
                <header className="coord-excel-modal__header">
                    <div className="coord-excel-modal__badge" aria-hidden>
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 pr-8">
                        <p className="coord-excel-modal__eyebrow">Reporte institucional</p>
                        <h2 id="coord-excel-modal-title" className="coord-excel-modal__title">
                            Solicitar Excel
                        </h2>
                        <p className="coord-excel-modal__subtitle">
                            Paso {stepIndex + 1} de 6 · Te atendemos por WhatsApp con el nodo y alcance que indiques.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="coord-excel-modal__close" aria-label="Cerrar">
                        <X className="w-5 h-5" />
                    </button>
                </header>

                <div className="coord-excel-modal__notice">
                    <p>
                        La descarga automática está pausada para proteger el rendimiento del sistema.
                        Completa la solicitud y nuestro equipo te envía el reporte personalizado.
                    </p>
                </div>

                <div className="coord-excel-modal__content">
                    {hasPhone ? (
                        <CoordinatorExcelRequestForm
                            defaultInstitution={institutionName}
                            defaultSimulation={simulationId}
                            availableInstitutions={availableInstitutions}
                            availableSimulations={availableSimulations}
                            sourcePanel={sourcePanel}
                            onStepChange={setStepIndex}
                        />
                    ) : (
                        <p className="text-sm" style={{ color: 'var(--coord-text-secondary)' }}>
                            No hay un canal de WhatsApp configurado para solicitudes de reporte.
                        </p>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
