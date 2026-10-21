'use client';

import { useEffect, useState, type ReactNode } from 'react';

export type TabItem = { id: string; label: string; panel: ReactNode };

export function Tabs({ tabs, label, onChange, initial }: { tabs: TabItem[]; label: string; onChange?: (id: string) => void; initial?: string }) {
  const fallback = tabs.find((tab) => tab.id === initial)?.id ?? tabs[0]?.id ?? '';
  const [active, setActive] = useState(fallback);
  useEffect(() => {
    if (initial && tabs.some((tab) => tab.id === initial)) setActive(initial);
    // Solo cuando cambia la pestaña pedida desde fuera. `tabs` se recrea en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);
  return (
    <div>
      <div className="ag-tabs" role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            className="ag-btn-ghost"
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => {
              setActive(tab.id);
              onChange?.(tab.id);
            }}
            onKeyDown={(event) => {
              const index = tabs.findIndex((item) => item.id === active);
              if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
                setActive(tabs[next].id);
                onChange?.(tabs[next].id);
              }
              if (event.key === 'Home') {
                setActive(tabs[0].id);
                onChange?.(tabs[0].id);
              }
              if (event.key === 'End') {
                setActive(tabs[tabs.length - 1].id);
                onChange?.(tabs[tabs.length - 1].id);
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`} hidden={active !== tab.id}>
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
