'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { CatalogItem } from './catalogUi';
import { fichaOfItem } from './fichaLegacy';
import { ProductOffer } from './ProductOffer';

type Props = {
  item: CatalogItem;
  inCart: boolean;
  onClose: () => void;
  onAdd: (item: CatalogItem) => void;
};

export function ProgramDetail({ item, inCart, onClose, onAdd }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const wide = fichaOfItem(item).blocks.length > 0;

  useEffect(() => {
    const root = panelRef.current;
    if (!root) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusables = () => Array.from(
      root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    );
    const timer = window.setTimeout(() => focusables()[0]?.focus(), 0);
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      const outside = !root.contains(active);
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus();
    };
  }, []);

  return (
    <div className="ag-store-sheet">
      <button type="button" className="ag-store-sheet-back" tabIndex={-1} aria-label="Cerrar detalle" onClick={onClose} />
      <div
        ref={panelRef}
        className={wide ? 'ag-store-sheet-panel is-offer is-story' : 'ag-store-sheet-panel is-offer'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ag-store-sheet-title"
      >
        <ProductOffer
          item={item}
          inCart={inCart}
          onAdd={onAdd}
          close={(
            <button type="button" className="ag-store-close" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          )}
        />
      </div>
    </div>
  );
}
