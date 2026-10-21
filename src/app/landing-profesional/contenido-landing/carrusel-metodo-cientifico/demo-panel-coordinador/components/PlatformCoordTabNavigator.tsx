'use client';

import { useEffect, useRef } from 'react';
import type { CoordTab } from '../tour/tour-config';
import { useCoordEmbed } from '../context/CoordEmbedProvider';

export function PlatformCoordTabNavigator({ tab }: { tab: CoordTab }) {
  const { setActiveTab } = useCoordEmbed();
  const lastTabRef = useRef<CoordTab | null>(null);

  useEffect(() => {
    if (lastTabRef.current === tab) return;
    lastTabRef.current = tab;
    setActiveTab(tab);
  }, [tab, setActiveTab]);

  return null;
}
