import type { ReactNode } from 'react';

export function Section({
  id,
  tone,
  label,
  children,
  className = '',
}: {
  id?: string;
  tone: 'black' | 'grey' | 'white' | 'paper' | 'charcoal';
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`ag-section ag-tone-${tone} ${className}`} aria-labelledby={label}>
      <div className="ag-wrap">{children}</div>
    </section>
  );
}
