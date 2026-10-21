import type { LucideIcon } from 'lucide-react';

export function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="ag-icon-badge">
      <Icon size={22} color="#ffffff" aria-hidden />
    </span>
  );
}
