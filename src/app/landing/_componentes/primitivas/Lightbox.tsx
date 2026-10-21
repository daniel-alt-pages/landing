'use client';

import { useEffect, useRef } from 'react';

export type LightItem = { id: string; title: string; text: string };

export function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: LightItem[];
  index: number | null;
  onClose: () => void;
  onIndex: (index: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (index === null) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
  }, [index]);

  const item = index === null ? null : items[index];
  if (!item || index === null) return <dialog ref={ref} className="ag-dialog" />;

  return (
    <dialog ref={ref} className="ag-dialog" aria-labelledby="ag-light-title" onClose={onClose}>
      <div style={{ padding: 24 }}>
        <p id="ag-light-title" className="ag-h3">
          {item.title}
        </p>
        <p>{item.text}</p>
        <p>
          {index + 1} de {items.length}
        </p>
        <div className="ag-actions">
          <button type="button" className="ag-btn-ghost" onClick={() => onIndex((index - 1 + items.length) % items.length)}>
            Anterior
          </button>
          <button type="button" className="ag-btn-ghost" onClick={() => onIndex((index + 1) % items.length)}>
            Siguiente
          </button>
          <button type="button" className="ag-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  );
}
