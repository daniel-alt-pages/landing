'use client';

import { useState } from 'react';
import type { ProductSheet } from './catalogUi';
import { Marks } from './marks';

type Props = { sheet?: ProductSheet };

function linesOf(body?: string) {
  return String(body || '').split('\n').map((line) => line.trim()).filter(Boolean);
}

export function ProductFacts({ sheet }: Props) {
  const sections = (sheet?.sections || []).filter((section) => section.title || section.body);
  const columns = (sheet?.columns || []).filter((column) => column.label || (column.rows || []).some((row) => row.label || row.hours));
  const duration = String(sheet?.duration || '').trim();
  const headline = String(sheet?.headline || '').trim();
  const hasHours = Boolean(duration || columns.length);
  const [openId, setOpenId] = useState(sections[0]?.id || '');
  if (!sections.length && !hasHours) return null;

  return (
    <div className="ag-facts">
      {sections.length ? (
        <div className="ag-facts-list">
          {sections.map((section) => {
            const lines = linesOf(section.body);
            const open = openId === section.id;
            return (
              <section key={section.id} className="ag-facts-section">
                <button
                  type="button"
                  className="ag-facts-toggle"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? '' : section.id)}
                >
                  <span>{section.title || 'Sección'}</span>
                  <span aria-hidden="true">{open ? '×' : '+'}</span>
                </button>
                {open && lines.length ? (
                  lines.length > 1 ? (
                    <ul className="ag-facts-body">{lines.map((line, index) => <li key={`${section.id}-${index}`}><Marks text={line} /></li>)}</ul>
                  ) : (
                    <p className="ag-facts-body"><Marks text={lines[0]} /></p>
                  )
                ) : null}
              </section>
            );
          })}
        </div>
      ) : null}
      {hasHours ? (
        <div className="ag-hours">
          {headline ? <h3>{headline}</h3> : null}
          <div className="ag-hours-grid">
            {duration ? (
              <div className="ag-hours-col">
                <strong className="ag-hours-name">Duración</strong>
                <p>{duration}</p>
              </div>
            ) : null}
            {columns.map((column) => (
              <div key={column.id} className="ag-hours-col">
                {column.label ? <strong className="ag-hours-name">{column.label}</strong> : null}
                {(column.rows || []).filter((row) => row.label || row.hours).map((row, index) => (
                  <p key={`${column.id}-${index}`} className="ag-hours-line">
                    {row.label ? <b>{row.label}</b> : null}
                    {row.hours ? <span>{row.hours}</span> : null}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
