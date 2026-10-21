'use client';

import type maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Gauge, MapPin, Users } from 'lucide-react';
import { Map as MapCanvas, MapControls, MapMarker, MarkerContent, MarkerPopup, MarkerTooltip, useMap } from '@/components/ui/map';
import { cn } from '@shared/lib/utils';
import type { LandingTone } from '../tipos';
import type { LandingImpactSummary } from '../tipos/landingReference';
import {
  buildImpactDepartmentRows,
  buildImpactMaxUsers,
  COLOMBIA_MAP_VIEW,
  colombiaImpactMapStyles,
  getScorePerformance,
  getScorePerformanceClass,
  impactMarkerSizes,
  numberFormatter,
} from './impactData';
import { ImpactSubjectAveragesStrip } from './ImpactDepartmentSubjects';
import type { buildImpactMapPoints } from './impactMapBuilder';
import { ImpactTerritorialTable } from './ImpactTerritorialTable';
import { useImpactMapData } from './useImpactMapData';

type ImpactMapPoint = ReturnType<typeof buildImpactMapPoints>[number];

function useMapZoom(fallback = COLOMBIA_MAP_VIEW.zoom) {
  const { map, isLoaded } = useMap();
  const [zoom, setZoom] = useState<number>(fallback);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const sync = () => setZoom(map.getZoom());
    sync();
    map.on('zoom', sync);
    map.on('moveend', sync);
    return () => {
      map.off('zoom', sync);
      map.off('moveend', sync);
    };
  }, [isLoaded, map]);

  return zoom;
}

function MapResizeWhenReady() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const resize = () => {
      try {
        map.resize();
        map.triggerRepaint();
      } catch {
        // map removed
      }
    };
    resize();
    const frame = requestAnimationFrame(resize);
    map.once('idle', resize);
    window.addEventListener('resize', resize);
    document.addEventListener('fullscreenchange', resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('fullscreenchange', resize);
    };
  }, [isLoaded, map]);

  return null;
}

function ColombiaProfessionalLayer({
  tone,
  featureCollection,
}: {
  tone: LandingTone;
  featureCollection: GeoJSON.FeatureCollection;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const isLight = tone === 'light';
    const sourceId = 'colombia-impact-departments';
    const glowLayerId = 'colombia-impact-glow';
    const fillLayerId = 'colombia-impact-fill';
    const outlineLayerId = 'colombia-impact-outline';
    const lineLayerId = 'colombia-impact-line';
    const labelLayerId = 'colombia-impact-labels';
    let cancelled = false;

    const syncLayers = () => {
      if (cancelled || !map.isStyleLoaded()) return;

      try {
        const existingSource = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
        if (existingSource) {
          existingSource.setData(featureCollection);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: featureCollection,
          });
        }

        if (!map.getLayer(fillLayerId)) {
          map.addLayer({
            id: fillLayerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': [
                'case',
                ['>', ['coalesce', ['get', 'uniqueUsers'], 0], 0],
                isLight ? '#0ea5e9' : '#0891b2',
                isLight ? '#bae6fd' : '#0f172a',
              ],
              'fill-opacity': [
                'case',
                ['>', ['coalesce', ['get', 'uniqueUsers'], 0], 0],
                ['interpolate', ['linear'], ['coalesce', ['get', 'intensity'], 0], 0.18, 0.42, 1, 0.88],
                isLight ? 0.5 : 0.68,
              ],
            },
          });
        }

        if (!map.getLayer(glowLayerId)) {
          map.addLayer({
            id: glowLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': isLight ? 'rgba(14, 165, 233, 0.18)' : 'rgba(103, 232, 249, 0.14)',
              'line-width': ['interpolate', ['linear'], ['zoom'], 4, 4, 7, 10],
              'line-blur': ['interpolate', ['linear'], ['zoom'], 4, 3, 7, 6],
            },
          });
        }

        if (!map.getLayer(outlineLayerId)) {
          map.addLayer({
            id: outlineLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': isLight ? '#0f172a' : '#f8fafc',
              'line-width': ['interpolate', ['linear'], ['zoom'], 3.5, 1.6, 5.5, 2.2, 7.5, 3],
              'line-opacity': isLight ? 0.72 : 0.58,
            },
          });
        }

        if (!map.getLayer(lineLayerId)) {
          map.addLayer({
            id: lineLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': isLight ? '#1e3a5f' : '#e0f2fe',
              'line-width': ['interpolate', ['linear'], ['zoom'], 3.5, 0.95, 5.5, 1.35, 7.5, 2.1],
              'line-opacity': 1,
            },
          });
        }

        if (!map.getLayer(labelLayerId)) {
          map.addLayer({
            id: labelLayerId,
            type: 'symbol',
            source: sourceId,
            layout: {
              'text-field': ['get', 'departmentName'],
              'text-font': ['Noto Sans Regular'],
              'text-size': ['interpolate', ['linear'], ['zoom'], 4.2, 0, 4.8, 8, 5.8, 10, 7, 12, 8.5, 13],
              'text-anchor': 'center',
              'text-max-width': 9,
              'text-line-height': 1.15,
              'text-allow-overlap': false,
              'text-padding': 2,
            },
            paint: {
              'text-color': isLight ? '#0f172a' : '#f1f5f9',
              'text-halo-color': isLight ? '#ffffff' : '#020617',
              'text-halo-width': ['interpolate', ['linear'], ['zoom'], 5, 1.1, 7.5, 1.6],
              'text-opacity': ['interpolate', ['linear'], ['zoom'], 4.2, 0, 4.65, 0.55, 5, 0.92, 8.5, 1],
            },
          });
        }

        map.resize();
        map.triggerRepaint();
      } catch {
        // Style swap / unmount race — next styledata will retry.
      }
    };

    syncLayers();

    const onStyleData = () => {
      if (!map.getLayer(fillLayerId)) syncLayers();
    };
    map.on('styledata', onStyleData);
    map.on('load', syncLayers);

    return () => {
      cancelled = true;
      map.off('styledata', onStyleData);
      map.off('load', syncLayers);
      try {
        if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getLayer(glowLayerId)) map.removeLayer(glowLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // Style can be removed before child cleanup during theme changes.
      }
    };
  }, [featureCollection, isLoaded, map, tone]);

  return null;
}

function ImpactMapMarkers({
  mapPoints,
  impactMaxUsers,
  tone,
  markerColor,
}: {
  mapPoints: ImpactMapPoint[];
  impactMaxUsers: number;
  tone: LandingTone;
  markerColor: string;
}) {
  const zoom = useMapZoom();
  const isLight = tone === 'light';

  return (
    <>
      {mapPoints.map((row) => {
        const { size, haloSize } = impactMarkerSizes(row.uniqueUsers, impactMaxUsers, zoom);
        const scorePerformance = getScorePerformance(row.averageScore ?? 0);

        return (
          <MapMarker key={`point-${row.department}`} longitude={row.center.longitude} latitude={row.center.latitude} anchor="center">
            <MarkerContent>
              <div className="relative flex items-center justify-center" style={{ width: haloSize, height: haloSize }}>
                <span
                  className="cotiz-impact-heartbeat absolute rounded-full"
                  style={{
                    width: haloSize,
                    height: haloSize,
                    backgroundColor: markerColor,
                    opacity: isLight ? 0.16 : 0.2,
                  }}
                />
                <span
                  className="relative rounded-full border-2 shadow-lg"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: markerColor,
                    borderColor: isLight ? '#f8fafc' : '#082f49',
                    boxShadow: isLight
                      ? '0 14px 30px rgba(2, 132, 199, 0.24)'
                      : '0 14px 30px rgba(103, 232, 249, 0.24)',
                  }}
                />
              </div>
            </MarkerContent>
            <MarkerTooltip>
              {row.department}: {numberFormatter.format(row.uniqueUsers)} usuarios
            </MarkerTooltip>
            <MarkerPopup
              closeButton
              offset={[0, 22]}
              anchor="bottom"
              maxWidth="320px"
              className={cn(
                'cotiz-impact-marker-popup w-[min(20rem,calc(100vw-2rem))] overflow-hidden border-0 p-0 shadow-none ring-1 motion-reduce:animate-none',
                isLight
                  ? 'bg-white/95 text-slate-900 ring-slate-200/90'
                  : 'bg-slate-950/95 text-white ring-cyan-300/20',
              )}
            >
              <header
                className={cn(
                  'flex items-start gap-2.5 border-b px-3 py-2.5 pr-9',
                  isLight ? 'border-slate-100/90 bg-slate-50/80' : 'border-white/[0.08] bg-white/[0.04]',
                )}
              >
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-lg ring-1',
                    isLight ? 'bg-white text-sky-700 ring-sky-100' : 'bg-cyan-400/10 text-cyan-200 ring-cyan-300/25',
                  )}
                  aria-hidden
                >
                  <MapPin className="size-3.5" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-[9px] font-bold uppercase tracking-[0.22em]', isLight ? 'text-slate-500' : 'text-cyan-200/70')}>
                    Departamento
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold leading-tight">{row.department}</p>
                </div>
              </header>

              <div className="cotiz-impact-marker-popup__body max-h-[min(11.5rem,42dvh)] space-y-2.5 overflow-y-auto overscroll-contain p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={cn(
                      'rounded-xl p-2 ring-1',
                      isLight ? 'bg-white ring-slate-200/80' : 'bg-white/[0.04] ring-white/[0.1]',
                    )}
                  >
                    <div className={cn('flex items-center gap-1 text-[10px] font-medium', isLight ? 'text-slate-600' : 'text-white/55')}>
                      <Users className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                      Usuarios
                    </div>
                    <p className="mt-1 font-mono text-base font-bold tabular-nums leading-none">
                      {numberFormatter.format(row.uniqueUsers)}
                    </p>
                    <div className={cn('mt-1.5 h-1 overflow-hidden rounded-full', isLight ? 'bg-slate-200' : 'bg-white/10')}>
                      <span
                        className={cn('block h-full rounded-full', isLight ? 'bg-sky-600' : 'bg-cyan-400')}
                        style={{ width: `${Math.min(100, (row.uniqueUsers / impactMaxUsers) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div
                    className={cn(
                      'rounded-xl p-2 ring-1',
                      isLight ? 'bg-white ring-slate-200/80' : 'bg-white/[0.04] ring-white/[0.1]',
                    )}
                  >
                    <div className={cn('flex items-center gap-1 text-[10px] font-medium', isLight ? 'text-slate-600' : 'text-white/55')}>
                      <Gauge className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                      Promedio
                    </div>
                    <p className="mt-1 font-mono text-base font-bold tabular-nums leading-none">
                      {row.averageScore}
                      <span className={cn('ml-0.5 text-[10px] font-semibold', isLight ? 'text-slate-500' : 'text-white/40')}>/500</span>
                    </p>
                    <span
                      className={cn(
                        'mt-1.5 inline-flex max-w-full truncate rounded-md px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wide ring-1',
                        getScorePerformanceClass(scorePerformance.id, tone),
                      )}
                      title={scorePerformance.description}
                    >
                      {scorePerformance.label}
                    </span>
                  </div>
                </div>

                <div>
                  <p className={cn('mb-1 text-[9px] font-semibold uppercase tracking-[0.14em]', isLight ? 'text-slate-500' : 'text-white/40')}>
                    Áreas /100
                  </p>
                  <ImpactSubjectAveragesStrip subjectAverages={row.subjectAverages} tone={tone} />
                </div>
              </div>

              <footer
                className={cn(
                  'flex items-center justify-between gap-2 border-t px-3 py-2 text-[10px]',
                  isLight ? 'border-slate-100 bg-slate-50/90 text-slate-600' : 'border-white/[0.06] bg-black/25 text-white/50',
                )}
              >
                <span>
                  Éxito{' '}
                  <strong className={cn('font-mono tabular-nums', isLight ? 'text-slate-950' : 'text-cyan-100')}>
                    {row.successRate}%
                  </strong>
                </span>
                <span className="truncate font-mono tabular-nums text-[9px]">
                  {numberFormatter.format(row.validEvaluations)} vál. · {numberFormatter.format(row.evaluations)} tot.
                </span>
              </footer>
            </MarkerPopup>
          </MapMarker>
        );
      })}
    </>
  );
}

export function ColombiaImpactMap({
  tone,
  loadMap,
  impactSummary,
}: {
  tone: LandingTone;
  loadMap: boolean;
  impactSummary: LandingImpactSummary | null;
}) {
  const { impactMapData, impactMapStatus } = useImpactMapData(loadMap, impactSummary);
  const impactDepartmentRows = useMemo(
    () => (impactSummary ? buildImpactDepartmentRows(impactSummary) : []),
    [impactSummary],
  );
  const impactMaxUsers = useMemo(() => buildImpactMaxUsers(impactDepartmentRows), [impactDepartmentRows]);
  const isLight = tone === 'light';
  const markerColor = isLight ? '#0284c7' : '#67e8f9';
  const mapHostRef = useRef<HTMLDivElement>(null);

  return (
    <article
      className={`cotiz-impact-map-article min-w-0 overflow-hidden rounded-[1.75rem] p-[clamp(1rem,3vw,1.5rem)] ${
        isLight
          ? 'border border-slate-200 bg-white shadow-xl shadow-slate-900/5'
          : 'border border-white/[0.08] bg-white/[0.025] shadow-2xl shadow-black/25'
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-950' : 'text-white'}`}>
            Mapa real de usuarios por departamento
          </h3>
          <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/55'}`}>
            Marcadores proporcionales a usuarios únicos con detalle acumulado por departamento.
          </p>
        </div>
        <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
          Colombia / GeoJSON
        </span>
      </div>

      <div
        role="img"
        aria-label={
          impactSummary
            ? `Mapa interactivo de Colombia con cobertura acumulada en ${impactSummary.totals.departments} departamentos y ${numberFormatter.format(
                impactSummary.totals.uniqueUsers,
              )} usuarios únicos.`
            : 'Mapa interactivo de Colombia con cobertura acumulada por departamento.'
        }
        className={`cotiz-impact-map-host relative mt-5 h-[clamp(22rem,58dvh,34rem)] rounded-[1.4rem] border ${
          isLight
            ? 'border-slate-200 bg-slate-100'
            : 'border-white/[0.06] bg-slate-950'
        }`}
        data-cotiz-map-tone={isLight ? 'light' : 'dark'}
        ref={mapHostRef}
      >
        <div
          className={`cotiz-impact-map-host__viewport h-full rounded-[inherit] ${
            isLight ? 'bg-slate-100' : 'bg-slate-950'
          }`}
        >
        {!impactMapData ? (
          <div
            className={`flex h-full flex-col items-center justify-center gap-2 px-6 text-center ${
              isLight ? 'text-slate-500' : 'text-white/50'
            }`}
            aria-busy={impactMapStatus === 'loading'}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
              {impactMapStatus === 'error'
                ? 'Mapa no disponible'
                : !impactSummary && loadMap
                  ? 'Esperando métricas…'
                  : 'Cargando mapa…'}
            </span>
            {impactMapStatus === 'loading' ? (
              <span className="inline-block size-8 animate-pulse rounded-full bg-current/20" />
            ) : null}
          </div>
        ) : (
          <>
        <MapCanvas
          key={`colombia-professional-map-${tone}`}
          theme={isLight ? 'light' : 'dark'}
          styles={colombiaImpactMapStyles}
          showLoader={false}
          center={COLOMBIA_MAP_VIEW.center}
          zoom={COLOMBIA_MAP_VIEW.zoom}
          minZoom={COLOMBIA_MAP_VIEW.minZoom}
          maxZoom={COLOMBIA_MAP_VIEW.maxZoom}
          maxBounds={COLOMBIA_MAP_VIEW.maxBounds}
          cooperativeGestures
          scrollZoom
          dragRotate={false}
          touchPitch={false}
          className="h-full w-full"
        >
          <MapControls
            position="top-right"
            showZoom
            showFullscreen
            getFullscreenElement={() => mapHostRef.current}
            className={
              isLight
                ? '[&>div]:border-slate-200 [&>div]:bg-white/95 [&_*]:text-slate-900'
                : '[&>div]:border-white/15 [&>div]:bg-slate-950/85 [&_*]:text-white'
            }
          />
          <MapResizeWhenReady />
          <ColombiaProfessionalLayer tone={tone} featureCollection={impactMapData.featureCollection} />
          <ImpactMapMarkers
            mapPoints={impactMapData.mapPoints}
            impactMaxUsers={impactMaxUsers}
            tone={tone}
            markerColor={markerColor}
          />
        </MapCanvas>
          </>
        )}
        </div>
      </div>

      <ImpactTerritorialTable rows={impactDepartmentRows} tone={tone} />
    </article>
  );
}
