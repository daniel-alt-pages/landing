'use client';

import SgAreaIconBottomNav from '@shared/components/SgAreaIconBottomNav';
import type { RecordingGroup } from '@features/recordings/lib/recordingsTypes';

type RecordingsAreaNavProps = {
  groups: RecordingGroup[];
  activeAreaKey: string;
  onAreaChange: (areaKey: string) => void;
  homeHref: string;
  onNavigateHome?: () => void;
  variant?: 'light' | 'dark';
  className?: string;
};

/** Nav inferior único en móvil: inicio + áreas. Oculto en xl+ (lista lateral). */
export default function RecordingsAreaNav({
  groups,
  activeAreaKey,
  onAreaChange,
  homeHref,
  onNavigateHome,
  variant = 'light',
  className = '',
}: RecordingsAreaNavProps) {
  const items = groups.map((g) => ({ key: g.key, label: g.label }));

  return (
    <SgAreaIconBottomNav
      items={items}
      activeKey={activeAreaKey}
      onSelect={onAreaChange}
      variant={variant}
      position="fixed"
      publishLift
      leadingAction={{
        href: homeHref,
        onNavigate: onNavigateHome,
        label: 'Inicio',
        ariaLabel: 'Volver al inicio',
      }}
      className={`xl:hidden ${className}`}
      ariaLabel="Navegación de clases grabadas"
    />
  );
}
