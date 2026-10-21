'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export interface CoordinatorFilterSelectorsProps {
    simulationId: string;
    availableSimulations: string[];
    availableInstitutions: string[];
    currentInstitution: string;
    onChangeSimulation: (s: string) => void;
    onChangeInstitution: (i: string) => void;
    className?: string;
    compact?: boolean;
}

export default function CoordinatorFilterSelectors({
    simulationId,
    availableSimulations,
    availableInstitutions,
    currentInstitution,
    onChangeSimulation,
    onChangeInstitution,
    className = '',
    compact = false,
}: CoordinatorFilterSelectorsProps) {
    const showInstitutionSelector = availableInstitutions.length > 1;
    const institutionValue = currentInstitution || availableInstitutions[0] || '';

    return (
        <div className={`flex flex-wrap items-end gap-2.5 ${className}`.trim()}>
            {showInstitutionSelector && (
                <SelectControl
                    label="Institución"
                    value={institutionValue}
                    options={availableInstitutions}
                    onChange={onChangeInstitution}
                    minWidth={compact ? 174 : 160}
                    compact={compact}
                />
            )}
            <SelectControl
                label="Simulacro"
                value={simulationId}
                options={availableSimulations}
                onChange={onChangeSimulation}
                minWidth={compact ? 100 : 140}
                compact={compact}
            />
        </div>
    );
}

function SelectControl({
    label,
    value,
    options,
    onChange,
    minWidth = 150,
    compact = false,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
    minWidth?: number;
    compact?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
    const dropdownId = useId();
    const shellRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.includes(value) ? value : options[0] || '—';
    const hasOptions = options.length > 0;

    const updateMenuPosition = () => {
        const shell = shellRef.current;
        if (!shell) return;

        const rect = shell.getBoundingClientRect();
        setMenuStyle({
            position: 'fixed',
            top: rect.bottom + 8,
            left: rect.left,
            minWidth: rect.width,
            maxWidth: 'min(24rem, calc(100vw - 1rem))',
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
    }, [isOpen, options.length]);

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
        <div className="flex flex-col gap-1 min-w-0" style={{ minWidth }}>
            <span
                id={`${dropdownId}-label`}
                className={compact ? 'text-[9px] font-black uppercase tracking-widest shrink-0' : 'text-[10px] font-bold uppercase tracking-widest'}
                style={{ color: 'var(--coord-text-tertiary)' }}
            >
                {label}
            </span>
            <div ref={shellRef} className={`coord-select-shell relative${isOpen ? ' is-open' : ''}`}>
                <button
                    type="button"
                    className={compact ? 'coord-input-native coord-select-trigger pr-10 w-full !py-1.5 !text-[11px]' : 'coord-input-native coord-select-trigger pr-10 w-full'}
                    style={{ minHeight: compact ? 32 : undefined }}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-labelledby={`${dropdownId}-label ${dropdownId}-value`}
                    disabled={!hasOptions}
                    onClick={() => hasOptions && setIsOpen((open) => !open)}
                >
                    <span id={`${dropdownId}-value`} className="coord-select-value">
                        {selectedOption}
                    </span>
                </button>
                <span className={`coord-select-chevron ${isOpen ? 'is-open' : ''}`} aria-hidden="true">
                    <ChevronDown className="w-3.5 h-3.5" />
                </span>

                {isOpen && typeof document !== 'undefined' && createPortal(
                    <div
                        ref={menuRef}
                        className="coord-select-menu coord-select-menu--portaled"
                        style={menuStyle}
                        role="listbox"
                        aria-labelledby={`${dropdownId}-label`}
                    >
                        {options.map((option) => {
                            const isSelected = option === value;

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`coord-select-option ${isSelected ? 'is-selected' : ''}`}
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="coord-select-option-mark" aria-hidden="true" />
                                    <span className="coord-select-option-text">{option}</span>
                                </button>
                            );
                        })}
                    </div>,
                    document.body,
                )}
            </div>
        </div>
    );
}
