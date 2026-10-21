'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Children, useState, type KeyboardEvent, type ReactNode } from 'react';

export function Pestanas({
  label,
  tabs,
  children,
}: {
  label: string;
  tabs: readonly { id: string; label: string }[];
  children: ReactNode;
}) {
  const paneles = Children.toArray(children);
  const [activo, setActivo] = useState(0);
  const reducir = useReducedMotion();

  const mover = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const siguiente = (activo + delta + tabs.length) % tabs.length;
    setActivo(siguiente);
    document.getElementById(`b2b-tab-${tabs[siguiente].id}`)?.focus();
  };

  const tab = tabs[activo];
  return (
    <div className="ag-b2b-pestanas">
      <div className="ag-b2b-tabs" role="tablist" aria-label={label} onKeyDown={mover}>
        {tabs.map((item, index) => (
          <button
            key={item.id}
            id={`b2b-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={activo === index}
            aria-controls={`b2b-panel-${item.id}`}
            tabIndex={activo === index ? 0 : -1}
            onClick={() => setActivo(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <motion.div
        key={tab.id}
        id={`b2b-panel-${tab.id}`}
        role="tabpanel"
        aria-labelledby={`b2b-tab-${tab.id}`}
        className="ag-b2b-panel"
        initial={reducir ? false : { opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {paneles[activo]}
      </motion.div>
    </div>
  );
}
