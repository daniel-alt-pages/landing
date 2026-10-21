'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './login-birth-date.css';

const SECURE_INPUT_PROPS = {
  'data-sg-secure-input': '1',
  autoComplete: 'off' as const,
  autoCorrect: 'off' as const,
  autoCapitalize: 'off' as const,
  spellCheck: false,
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
};

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS_ES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MIN_YEAR = 1990;
const DEFAULT_YEAR = 2000;

export function formatBirthDateDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function birthDisplayToIso(display: string): string | null {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

export function isoToBirthDisplay(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseViewFromValue(value: string): { month: number; year: number } {
  const iso = birthDisplayToIso(value);
  if (iso) {
    const [y, m] = iso.split('-').map(Number);
    return { month: m - 1, year: y };
  }
  return { month: 0, year: DEFAULT_YEAR };
}

function isDayDisabled(year: number, month: number, day: number): boolean {
  const candidate = new Date(year, month, day);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (candidate > today) return true;
  if (year < MIN_YEAR || year > today.getFullYear()) return true;
  return false;
}

type BirthSelectProps = {
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  ariaLabel: string;
};

function BirthSelect({ value, options, isOpen, onToggle, onSelect, ariaLabel }: BirthSelectProps) {
  return (
    <div className="login-birth-select-wrap flex-1 min-w-0">
      <button
        type="button"
        className={`login-birth-select-trigger w-full ${isOpen ? 'is-open' : ''}`}
        onClick={onToggle}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {value}
      </button>
      {isOpen && (
        <ul className="login-birth-select-menu" role="listbox">
          {options.map((opt) => (
            <li key={opt} role="none">
              <button
                type="button"
                role="option"
                aria-selected={opt === value}
                className={`login-birth-select-option w-full text-left ${opt === value ? 'is-active' : ''}`}
                onClick={() => onSelect(opt)}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type LoginBirthDatePickerProps = {
  id?: string;
  value: string;
  onChange: (display: string, iso: string | null) => void;
  disabled?: boolean;
  /** Abrir calendario al focus/click del input (login). En perfil usar false. */
  openOnFocus?: boolean;
};

export default function LoginBirthDatePicker({
  id = 'login-birth-input',
  value,
  onChange,
  disabled = false,
  openOnFocus = true,
}: LoginBirthDatePickerProps) {
  const hintId = useId();
  const fieldRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(0);
  const [viewYear, setViewYear] = useState(DEFAULT_YEAR);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  const maxYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: maxYear - MIN_YEAR + 1 }, (_, i) =>
    String(maxYear - i),
  );

  const selectedIso = birthDisplayToIso(value);
  const selectedParts = selectedIso
    ? {
        day: Number(selectedIso.slice(8, 10)),
        month: Number(selectedIso.slice(5, 7)) - 1,
        year: Number(selectedIso.slice(0, 4)),
      }
    : null;

  const updatePopoverPos = useCallback(() => {
    const el = fieldRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const openCalendar = useCallback(() => {
    if (disabled) return;
    const view = parseViewFromValue(value);
    setViewMonth(view.month);
    setViewYear(view.year);
    setMonthMenuOpen(false);
    setYearMenuOpen(false);
    setOpen(true);
  }, [disabled, value]);

  const closeCalendar = useCallback(() => {
    setOpen(false);
    setMonthMenuOpen(false);
    setYearMenuOpen(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePopoverPos();
    const onScrollOrResize = () => updatePopoverPos();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updatePopoverPos, viewMonth, viewYear]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (fieldRef.current?.contains(target)) return;
      const popover = document.getElementById(`${id}-calendar-popover`);
      if (popover?.contains(target)) return;
      closeCalendar();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCalendar();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, closeCalendar, id]);

  const goMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    if (y < MIN_YEAR) {
      y = MIN_YEAR;
      m = 0;
    }
    if (y > maxYear) {
      y = maxYear;
      m = 11;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const selectDay = (day: number) => {
    if (isDayDisabled(viewYear, viewMonth, day)) return;
    const display = `${pad2(day)}/${pad2(viewMonth + 1)}/${viewYear}`;
    onChange(display, `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`);
    closeCalendar();
  };

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const calendarPopover =
    open && popoverPos && mounted
      ? createPortal(
          <div
            id={`${id}-calendar-popover`}
            role="dialog"
            aria-modal="false"
            aria-label="Calendario de fecha de nacimiento"
            className="login-birth-calendar"
            style={{
              position: 'fixed',
              top: popoverPos.top,
              left: popoverPos.left,
              width: popoverPos.width,
              zIndex: 100001,
            }}
          >
            <div className="login-birth-calendar-inner">
              <div className="login-birth-calendar-header">
                <button
                  type="button"
                  className="login-birth-nav"
                  aria-label="Mes anterior"
                  onClick={() => goMonth(-1)}
                  disabled={viewYear === MIN_YEAR && viewMonth === 0}
                >
                  ‹
                </button>
                <BirthSelect
                  value={MONTHS_ES[viewMonth]}
                  options={MONTHS_ES}
                  isOpen={monthMenuOpen}
                  onToggle={() => {
                    setMonthMenuOpen((v) => !v);
                    setYearMenuOpen(false);
                  }}
                  onSelect={(label) => {
                    const idx = MONTHS_ES.indexOf(label);
                    if (idx >= 0) setViewMonth(idx);
                    setMonthMenuOpen(false);
                  }}
                  ariaLabel="Seleccionar mes"
                />
                <BirthSelect
                  value={String(viewYear)}
                  options={yearOptions}
                  isOpen={yearMenuOpen}
                  onToggle={() => {
                    setYearMenuOpen((v) => !v);
                    setMonthMenuOpen(false);
                  }}
                  onSelect={(y) => {
                    setViewYear(Number(y));
                    setYearMenuOpen(false);
                  }}
                  ariaLabel="Seleccionar año"
                />
                <button
                  type="button"
                  className="login-birth-nav"
                  aria-label="Mes siguiente"
                  onClick={() => goMonth(1)}
                  disabled={viewYear === maxYear && viewMonth === 11}
                >
                  ›
                </button>
              </div>

              <div className="login-birth-weekdays">
                {WEEKDAYS_ES.map((d) => (
                  <span key={d} className="login-birth-weekday">
                    {d}
                  </span>
                ))}
              </div>

              <div className="login-birth-days">
                {calendarCells.map((day, idx) => {
                  if (day === null) {
                    return <span key={`empty-${idx}`} className="login-birth-day login-birth-day--empty" />;
                  }
                  const isSelected =
                    selectedParts !== null &&
                    selectedParts.day === day &&
                    selectedParts.month === viewMonth &&
                    selectedParts.year === viewYear;
                  const disabledDay = isDayDisabled(viewYear, viewMonth, day);
                  return (
                    <button
                      key={`day-${day}-${idx}`}
                      type="button"
                      disabled={disabledDay}
                      className={`login-birth-day ${isSelected ? 'login-birth-day--selected' : ''}`}
                      onClick={() => selectDay(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={fieldRef} className="relative w-full login-birth-field">
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/AAAA"
          maxLength={10}
          value={value}
          disabled={disabled}
          aria-label="Fecha de nacimiento"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-describedby={hintId}
          className={`login-birth-input login-field-input w-full h-10 rounded-lg pl-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${open ? 'hasDatepicker' : ''} cursor-pointer`}
          style={{
            height: 40,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: 'none',
          }}
          {...SECURE_INPUT_PROPS}
          onChange={(e) => {
            const display = formatBirthDateDisplay(e.target.value);
            onChange(display, birthDisplayToIso(display));
          }}
          onFocus={openOnFocus ? openCalendar : undefined}
          onClick={openOnFocus ? openCalendar : undefined}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              openCalendar();
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Abrir calendario"
          disabled={disabled}
          onClick={openCalendar}
          className="absolute right-0 top-0 z-[2] flex h-10 w-10 items-center justify-center text-violet-300/90 transition-opacity disabled:opacity-40"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
        </button>
      </div>
      <p id={hintId} className="mt-1.5 text-center text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
        DD/MM/AAAA — escribe o elige en el calendario
      </p>
      {calendarPopover}
    </div>
  );
}
