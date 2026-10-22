'use client';

import { ProgramCard } from './ProgramCard';
import type { CatalogItem } from './catalogUi';

type Props = {
  items: CatalogItem[];
  cartIds: string[];
  onOpen: (id: string) => void;
  onAdd: (item: CatalogItem) => void;
};

export function ProgramShelf({ items, cartIds, onOpen, onAdd }: Props) {
  if (!items.length) return null;
  return (
    <ul className="ag-mk-grid">
      {items.map((item) => (
        <li key={item.id}>
          <ProgramCard item={item} inCart={cartIds.includes(item.id)} onOpen={onOpen} onAdd={onAdd} href={item.id.startsWith('ejemplo-') ? `/landing/programas/ficha/${encodeURIComponent(item.id)}` : undefined} />
        </li>
      ))}
    </ul>
  );
}
