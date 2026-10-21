'use client';

import { usePathname, useRouter } from 'next/navigation';
import CoordinadorMobileNav from '@features/coordinador/components/CoordinadorMobileNav';
import {
  demoCoordinadorPath,
  isDemoCoordinadorRoute,
} from '@/app/demo/_shared/demoRoutePaths';
import { useCoordEmbed } from '../context/CoordEmbedProvider';
import { coordNavIdFromTab, coordTabFromNavId } from '../coord-embed-navigation';

/** Barra inferior de producción (`ctn-bar`) en el panel coordinador embebido. */
export function ShowcaseCoordMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeTab, setActiveTab } = useCoordEmbed();

  return (
    <CoordinadorMobileNav
      embed={{
        activeNavId: coordNavIdFromTab(activeTab),
        onNavigate: (navId) => {
          const tab = coordTabFromNavId(navId);
          setActiveTab(tab);
          if (isDemoCoordinadorRoute(pathname)) {
            router.replace(demoCoordinadorPath(tab));
          }
        },
        anchored: true,
      }}
    />
  );
}
