'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { filterProgramas } from '@/bridge/catalogFilter';
import { programasUrl, tiendaLandingUrl } from '../../_contenido/contacto';
import { readConsent, readVista, writeVista } from '../../_lib/cookies';
import { storeFromCommerce, type TiendaConfig, type TiendaProduct } from '../../_lib/tienda';
import { type CatalogItem, type CatalogNeed } from './catalogUi';
import { fuenteTienda, tiendaEjemploActiva } from '../../_datos/tienda';

/** Tiempo máximo de espera a la API de Comercio antes de usar el respaldo. */
const API_TIMEOUT_MS = 3000;

const KIND_IDS = new Set(['', 'programa', 'simulacro', 'curso']);

type Payload = { items?: CatalogItem[]; needs?: CatalogNeed[] };

export function useCatalogQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const rawKind = params.get('tipo') || '';
  const kind = KIND_IDS.has(rawKind) ? rawKind : '';
  const need = params.get('necesidad') || '';
  const programId = params.get('programa') || '';
  const openedHere = useRef(false);
  const vistaBoot = useRef(false);
  const vistaTouched = useRef(false);
  const [resumeId, setResumeId] = useState('');
  const [payload, setPayload] = useState<Payload | null>(null);
  const [products, setProducts] = useState<TiendaProduct[] | null>(null);
  const [config, setConfig] = useState<TiendaConfig | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const write = useCallback((patch: Record<string, string>, mode: 'push' | 'replace') => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    if (mode === 'push') router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  }, [params, pathname, router]);

  useEffect(() => {
    const controller = new AbortController();
    let settled = false;
    // Respaldo: productos de ejemplo (misma bandera que ProductRail) o estado vacío/error.
    const fallback = (failed: boolean) => {
      if (settled) return;
      settled = true;
      controller.abort();
      if (tiendaEjemploActiva()) {
        const ejemplo = fuenteTienda().catalogo();
        setConfig(ejemplo.config);
        setProducts(ejemplo.products);
        setPayload({ items: [], needs: [] });
        setError(false);
        return;
      }
      setPayload((prev) => prev || { items: [], needs: [] });
      setProducts((prev) => prev || []);
      setError(failed);
    };
    const url = programasUrl();
    const shopUrl = tiendaLandingUrl();
    if (!url || !shopUrl) {
      const frame = window.requestAnimationFrame(() => fallback(false));
      return () => { window.cancelAnimationFrame(frame); controller.abort(); };
    }
    const timer = window.setTimeout(() => fallback(true), API_TIMEOUT_MS);
    const load = (target: string) => fetch(target, { signal: controller.signal }).then((res) => {
      if (!res.ok) throw new Error('api');
      return res.json();
    });
    Promise.all([load(url), load(shopUrl)])
      .then(([body, shop]: [Payload, { config?: TiendaConfig; products?: TiendaProduct[] }]) => {
        if (settled) return;
        const list = Array.isArray(shop?.products) ? shop.products : [];
        if (!list.length) { fallback(false); return; }
        settled = true;
        setPayload(body || { items: [], needs: [] });
        setConfig(shop?.config || null);
        setProducts(list);
      })
      .catch(() => fallback(true))
      .finally(() => window.clearTimeout(timer));
    return () => {
      settled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);

  useEffect(() => {
    if (!programId) openedHere.current = false;
  }, [programId]);

  useEffect(() => {
    if (vistaBoot.current) return;
    vistaBoot.current = true;
    const hasQuery = Boolean(params.get('tipo') || params.get('necesidad') || params.get('programa'));
    if (hasQuery) {
      vistaTouched.current = true;
      return;
    }
    const consent = readConsent();
    const saved = readVista();
    if (!consent?.personalization || !saved) return;
    if (!saved.tipo && !saved.necesidad) return;
    write({ tipo: saved.tipo, necesidad: saved.necesidad }, 'replace');
  }, [params, write]);

  useEffect(() => {
    const consent = readConsent();
    if (!consent?.personalization) return;
    setResumeId(readVista()?.programa || '');
  }, []);

  useEffect(() => {
    if (!vistaTouched.current) return;
    if (!readConsent()?.personalization) return;
    writeVista({
      tipo: kind,
      necesidad: need,
      programa: programId || readVista()?.programa || '',
    });
  }, [kind, need, programId]);

  const catalog = useMemo(
    () => storeFromCommerce(products || [], (payload?.items || []) as CatalogItem[]),
    [payload, products],
  );
  const items = useMemo(
    () => filterProgramas(catalog, { need, kind }) as CatalogItem[],
    [catalog, need, kind],
  );

  const setKind = useCallback((value: string) => {
    vistaTouched.current = true;
    write({ tipo: value }, 'replace');
  }, [write]);
  const setNeed = useCallback((value: string) => {
    vistaTouched.current = true;
    write({ necesidad: value }, 'replace');
  }, [write]);
  const clearFilters = useCallback(() => {
    vistaTouched.current = true;
    write({ tipo: '', necesidad: '' }, 'replace');
  }, [write]);
  const openProgram = useCallback((id: string) => {
    if (id.startsWith('ejemplo-')) {
      router.push(`/landing/programas/ficha/${encodeURIComponent(id)}`);
      return;
    }
    openedHere.current = true;
    vistaTouched.current = true;
    setResumeId(id);
    write({ programa: id }, 'push');
  }, [router, write]);
  const closeProgram = useCallback(() => {
    if (openedHere.current) {
      openedHere.current = false;
      router.back();
      return;
    }
    write({ programa: '' }, 'replace');
  }, [router, write]);
  const retry = useCallback(() => {
    setPayload(null);
    setProducts(null);
    setError(false);
    setAttempt((value) => value + 1);
  }, []);

  return {
    kind,
    need,
    needs: payload?.needs || [],
    items,
    all: catalog,
    config,
    loading: (!payload || !products) && !error,
    error,
    filtered: Boolean(kind || need),
    open: catalog.find((item) => item.id === programId) || null,
    resume: programId || !resumeId
      ? null
      : catalog.find((item) => item.id === resumeId) || null,
    setKind,
    setNeed,
    clearFilters,
    openProgram,
    closeProgram,
    retry,
  };
}
