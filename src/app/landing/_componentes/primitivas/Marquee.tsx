import type { ReactNode } from 'react';

export function Marquee({
  children,
  dir = 'left',
  label,
  className,
}: {
  children: ReactNode;
  dir?: 'left' | 'right';
  label: string;
  className?: string;
}) {
  return (
    <div className={className ? `ag-marquee ${className}` : 'ag-marquee'} data-dir={dir} aria-label={label}>
      <div className="ag-marquee-track">
        <div className="ag-marquee-set">{children}</div>
        <div className="ag-marquee-set" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
