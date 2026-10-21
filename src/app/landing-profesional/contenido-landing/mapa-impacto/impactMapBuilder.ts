import type { LandingImpactSummary } from '../tipos/landingReference';
import {
  buildImpactDepartmentByKey,
  buildImpactDepartmentRows,
  buildImpactFeatureByDepartmentKey,
  buildImpactMaxUsers,
  type ColombiaImpactFeature,
  type ColombiaLatLonFeature,
  featureCenter,
  normalizeDepartmentKey,
  normalizeDisplayDepartment,
} from './impactData';

export function getColombiaMapFeatures(geo: { features: ColombiaLatLonFeature[] }) {
  return geo.features.filter((feature) => feature.properties.NOMBRE_DPT);
}

export function buildImpactDepartmentFeatureCollection(
  colombiaMapFeatures: ColombiaLatLonFeature[],
  impactSummary: LandingImpactSummary,
): GeoJSON.FeatureCollection {
  const impactDepartmentByKey = buildImpactDepartmentByKey(impactSummary);
  const impactMaxUsers = buildImpactMaxUsers(buildImpactDepartmentRows(impactSummary));

  const features = colombiaMapFeatures.map((feature): ColombiaImpactFeature => {
    const rawDepartmentName = feature.properties.NOMBRE_DPT || 'Departamento';
    const departmentName = normalizeDisplayDepartment(rawDepartmentName);
    const stats = impactDepartmentByKey.get(normalizeDepartmentKey(rawDepartmentName));
    const intensity = stats ? Math.max(0.18, stats.uniqueUsers / impactMaxUsers) : 0;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        departmentName,
        uniqueUsers: stats?.uniqueUsers ?? 0,
        averageScore: stats?.averageScore ?? null,
        intensity,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: features as GeoJSON.Feature[],
  };
}

export function buildImpactMapPoints(
  colombiaMapFeatures: ColombiaLatLonFeature[],
  impactSummary: LandingImpactSummary,
) {
  const impactDepartmentRows = buildImpactDepartmentRows(impactSummary);
  const featureByDepartmentKey = buildImpactFeatureByDepartmentKey(colombiaMapFeatures);

  return impactDepartmentRows
    .map((row) => {
      const feature = featureByDepartmentKey.get(normalizeDepartmentKey(row.department));
      return feature ? { ...row, center: featureCenter(feature) } : null;
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}
