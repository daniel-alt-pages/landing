import type { ReactNode } from 'react';

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

export function Pending({ note, children, block = false }: { note?: string; children: ReactNode; block?: boolean }) {
  if (!note || process.env.NODE_ENV === 'production') return children;
  const Tag = block ? 'div' : 'span';
  return (
    <Tag className="ag-pending" title={note}>
      {children}
    </Tag>
  );
}
