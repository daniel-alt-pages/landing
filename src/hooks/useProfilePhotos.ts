'use client';

import { useEffect, useState } from 'react';
import { getAllProfilePhotos } from '@/lib/profileService';

/** Índice centralizado config/profilePhotos (1 read, cache 7 días). */
export function useProfilePhotos(enabled = true) {
  const [photos, setPhotos] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void getAllProfilePhotos().then((map) => {
      if (!cancelled) {
        setPhotos(map);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { photos, loading };
}
