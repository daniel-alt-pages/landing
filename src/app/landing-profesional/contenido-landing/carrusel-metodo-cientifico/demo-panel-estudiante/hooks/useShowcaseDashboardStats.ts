'use client';

import { useMemo } from 'react';
import { useShowcaseEmbed } from '../context/ShowcaseEmbedProvider';
import { buildShowcaseDashboardStats } from '../data/build-dashboard-stats';
import type { ShowcaseDashboardStats } from '../types/showcase.types';

export function useShowcaseDashboardStats(): ShowcaseDashboardStats | null {
  const { embedded, activeSim } = useShowcaseEmbed();

  return useMemo(() => {
    if (!embedded) return null;
    return buildShowcaseDashboardStats(embedded, activeSim);
  }, [embedded, activeSim]);
}

export type { ShowcaseDashboardStats };
