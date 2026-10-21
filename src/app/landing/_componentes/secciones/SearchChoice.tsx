'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

function fold(value: string) {
  return value.toLocaleLowerCase('es-CO').normalize('NFD').replace(/\p{M}/gu, '');
}

function otherText(value: string) {
  const match = /^Otro:\s*(.*)$/.exec(value);
  return match ? match[1] : '';
}

export function SearchChoice({
  label,
  name,
  value,
  options,
  placeholder,
  error,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const writingOther = value === 'Otro' || value.startsWith('Otro:');
  const listed = options.filter((item) => item !== 'Otro');
  const needle = fold(query.trim());
  const visible = needle ? listed.filter((item) => fold(item).includes(needle)) : listed;
  const typed = query.trim();
  const exact = listed.some((item) => fold(item) === fold(typed));
  const described = error ? `${name}-error` : undefined;
  const shown = writingOther ? (otherText(value) ? `Otro: ${otherText(value)}` : 'Otro') : value;

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(next: string) {
    onChange(next);
    setQuery('');
    setOpen(next === 'Otro');
  }

  return (
    <div className="ag-field" ref={rootRef}>
      <span id={`${listId}-label`}>{label}</span>
      <button
        type="button"
        name={name}
        className="ag-choice-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={Boolean(error)}
        aria-describedby={described}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={shown ? undefined : 'ag-choice-placeholder'}>{shown || placeholder}</span>
        <ChevronDown size={18} strokeWidth={1.8} aria-hidden />
      </button>
      {open ? (
        <div className="ag-choice-panel">
          <input
            className="ag-choice-search"
            value={query}
            placeholder="Buscar o escribir otro"
            aria-label={`Buscar ${label}`}
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && typed && !exact) {
                event.preventDefault();
                choose(`Otro: ${typed}`);
              }
            }}
          />
          <ul id={listId} role="listbox" aria-labelledby={`${listId}-label`} className="ag-choice-list">
            {visible.map((item) => (
              <li key={item}>
                <button type="button" role="option" aria-selected={value === item} onClick={() => choose(item)}>
                  {item}
                </button>
              </li>
            ))}
            {typed && !exact ? (
              <li>
                <button type="button" role="option" aria-selected={value === `Otro: ${typed}`} onClick={() => choose(`Otro: ${typed}`)}>
                  {`Usar «${typed}»`}
                </button>
              </li>
            ) : null}
            <li>
              <button type="button" role="option" aria-selected={writingOther} onClick={() => choose('Otro')}>
                Otro
              </button>
            </li>
          </ul>
          {writingOther ? (
            <input
              className="ag-choice-other"
              value={otherText(value)}
              placeholder="Escribe otro"
              aria-label={`Escribe otro ${label}`}
              onChange={(event) => onChange(event.target.value.trim() ? `Otro: ${event.target.value}` : 'Otro')}
            />
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p className="ag-error" id={described}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
