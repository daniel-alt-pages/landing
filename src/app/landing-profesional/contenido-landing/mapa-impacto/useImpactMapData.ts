'use client';

import { useEffect, useState } from 'react';
import type { LandingImpactSummary } from '../tipos/landingReference';
import { clearLandingGeoCache } from '../utilidades/landingAssetCache';
import { readLandingMapGeo } from '../utilidades/landingReference';
import type { ColombiaLatLonFeature } from './impactData';
import { isValidWgs84Geo } from './impactData';
import {
  buildImpactDepartmentFeatureCollection,
  buildImpactMapPoints,
  getColombiaMapFeatures,
} from './impactMapBuilder';

export type ImpactMapData = {
  featureCollection: GeoJSON.FeatureCollection;
  mapPoints: ReturnType<typeof buildImpactMapPoints>;
};

export function useImpactMapData(enabled: boolean, impactSummary: LandingImpactSummary | null | undefined) {
  const [data, setData] = useState<ImpactMapData | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    if (!enabled) return;

    if (!impactSummary) {
      setData(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus((current) => (current === 'ready' ? 'ready' : 'loading'));

    const applyGeo = (geo: Awaited<ReturnType<typeof readLandingMapGeo>>) => {
      if (cancelled || !geo?.features?.length || !isValidWgs84Geo(geo)) {
        if (!cancelled) setStatus('error');
        return;
      }
      const features = getColombiaMapFeatures(geo as { features: ColombiaLatLonFeature[] });
      setData({
        featureCollection: buildImpactDepartmentFeatureCollection(features, impactSummary),
        mapPoints: buildImpactMapPoints(features, impactSummary),
      });
      setStatus('ready');
    };

    (async () => {
      try {
        let geo = await readLandingMapGeo();
        if (!geo?.features?.length) {
          clearLandingGeoCache();
          geo = await readLandingMapGeo();
        }
        applyGeo(geo);
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, impactSummary]);

  return { impactMapData: data, impactMapStatus: status };
}
