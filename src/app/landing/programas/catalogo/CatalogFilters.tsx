'use client';

import { filterProgramas } from '@/bridge/catalogFilter';
import { KINDS, type CatalogItem, type CatalogNeed } from './catalogUi';

type Props = {
  all: CatalogItem[];
  kind: string;
  need: string;
  needs: CatalogNeed[];
  onKind: (value: string) => void;
  onNeed: (value: string) => void;
};

function count(all: CatalogItem[], query: { kind: string; need: string }) {
  return (filterProgramas(all, query) as CatalogItem[]).length;
}

export function CatalogFilters({ all, kind, need, needs, onKind, onNeed }: Props) {
  const kinds = KINDS.map((row) => ({ ...row, total: count(all, { kind: row.id, need }) }))
    .filter((row) => !row.id || row.total > 0 || row.id === kind);
  const needRows = needs.map((row) => ({ ...row, total: count(all, { kind, need: row.id }) }))
    .filter((row) => row.total > 0 || row.id === need);

  return (
    <nav className="ag-mk-filters" aria-label="Filtrar productos">
      <div className="ag-mk-filter">
        <h2>Tipo</h2>
        <ul>
          {kinds.map((row) => (
            <li key={row.id || 'todos'}>
              <button type="button" aria-pressed={kind === row.id} onClick={() => onKind(row.id)}>
                <span>{row.label}</span>
                <span className="ag-mk-count">{row.total}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {needRows.length ? (
        <div className="ag-mk-filter">
          <h2>Necesidad</h2>
          <ul>
            <li>
              <button type="button" aria-pressed={!need} onClick={() => onNeed('')}>
                <span>Todas</span>
                <span className="ag-mk-count">{count(all, { kind, need: '' })}</span>
              </button>
            </li>
            {needRows.map((row) => (
              <li key={row.id}>
                <button type="button" aria-pressed={need === row.id} onClick={() => onNeed(row.id)}>
                  <span>{row.label}</span>
                  <span className="ag-mk-count">{row.total}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}
