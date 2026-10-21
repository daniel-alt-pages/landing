'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export type CoordStitchSelectOption = {
    value: string;
    label: string;
    /** Color de acento (área ICFES, severidad, etc.) */
    accentColor?: string;
    /** Contador opcional mostrado como badge */
    count?: number;
};

export type CoordStitchSelectProps = {
    id?: string;
    label: string;
    value: string;
    options: CoordStitchSelectOption[];
    onChange: (value: string) => void;
    /** Color de acento del trigger cuando hay selección activa (no «todas») */
    accentColor?: string;
    disabled?: boolean;
};

export default function CoordStitchSelect({
    id,
    label,
    value,
    options,
    onChange,
    accentColor,
    disabled = false,
}: CoordStitchSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
    const autoId = useId();
    const dropdownId = id ?? autoId;
    const shellRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value) ?? options[0];
    const triggerAccent = accentColor ?? selected?.accentColor;
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
            maxWidth: 'min(28rem, calc(100vw - 1rem))',
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

    const shellStyle = triggerAccent
        ? ({ '--select-accent': triggerAccent } as CSSProperties)
        : undefined;

    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <span
                id={`${dropdownId}-label`}
                className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--coord-text-secondary,rgba(255,255,255,0.82))]"
            >
                {label}
            </span>
            <div
                ref={shellRef}
                className={`coord-select-shell${isOpen ? ' is-open' : ''}${triggerAccent ? ' coord-select-shell--accent' : ''}`}
                style={shellStyle}
            >
                <button
                    type="button"
                    className="coord-input-native coord-select-trigger pr-10 w-full"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-labelledby={`${dropdownId}-label ${dropdownId}-value`}
                    disabled={disabled || !hasOptions}
                    onClick={() => hasOptions && setIsOpen((open) => !open)}
                >
                    <span id={`${dropdownId}-value`} className="coord-select-value flex items-center gap-2 min-w-0">
                        {triggerAccent && (
                            <span
                                className="coord-select-trigger-dot shrink-0"
                                style={{ background: triggerAccent, boxShadow: `0 0 10px ${triggerAccent}88` }}
                                aria-hidden
                            />
                        )}
                        <span className="truncate text-[var(--coord-text-primary,rgba(255,255,255,0.96))]">
                            {selected?.label ?? '—'}
                        </span>
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
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            const markColor = option.accentColor;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`coord-select-option ${isSelected ? 'is-selected' : ''}${markColor ? ' coord-select-option--accent' : ''}`}
                                    style={markColor ? ({ '--option-accent': markColor } as CSSProperties) : undefined}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="coord-select-option-mark" aria-hidden="true" />
                                    <span className="coord-select-option-text flex min-w-0 flex-1 items-center justify-between gap-2">
                                        <span className="truncate">{option.label}</span>
                                        {option.count != null && (
                                            <span className="coord-select-option-count shrink-0">{option.count}</span>
                                        )}
                                    </span>
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
