import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export function Plegable({ titulo, cuenta, children }: { titulo: string; cuenta: string; children: ReactNode }) {
  return (
    <details className="ag-b2b-fold">
      <summary>
        <span>{titulo}</span>
        <em>{cuenta}</em>
        <ChevronDown size={20} strokeWidth={1.75} aria-hidden="true" />
      </summary>
      <div className="ag-b2b-fold-body">{children}</div>
    </details>
  );
}
