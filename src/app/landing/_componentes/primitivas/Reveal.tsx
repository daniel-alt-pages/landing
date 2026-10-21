import type { ReactNode } from 'react';

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <div className="ag-reveal" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
