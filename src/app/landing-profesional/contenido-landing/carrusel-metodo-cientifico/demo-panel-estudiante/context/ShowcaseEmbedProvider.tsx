'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  demoEstudiantePath,
  demoNavIdFromShowcaseTab,
  isDemoEstudianteRoute,
} from '@/app/demo/_shared/demoRoutePaths';
import { SHOWCASE_DEFAULT_SIM } from '../constants/dom-ids';
import type { ShowcaseEmbeddedDashboard } from '../data/embedded-student';
import {
  parseShowcaseStudentPath,
  SHOWCASE_INITIAL_PATH,
  type ShowcaseNavEntry,
} from '../navigation/showcase-navigation';
import type {
  ShowcaseDashboardTab,
  ShowcaseModal,
  ShowcaseStudentScreen,
} from '../types/showcase.types';

export type ShowcaseNavigateOptions = {
  /** Reemplaza la entrada actual (p. ej. volver con `returnTo`). */
  replace?: boolean;
};

export type ShowcaseEmbedValue = {
  active: boolean;
  embedded: ShowcaseEmbeddedDashboard | null;
  activeScreen: ShowcaseStudentScreen;
  setActiveScreen: (screen: ShowcaseStudentScreen) => void;
  activeSim: string;
  setActiveSim: (sim: string) => void;
  activeTab: ShowcaseDashboardTab;
  setActiveTab: (tab: ShowcaseDashboardTab) => void;
  /** Materia activa en análisis (query `?materia=`). */
  activeMateria: string | null;
  activePath: string;
  selectedQuestionId: string | null;
  setSelectedQuestionId: (id: string | null) => void;
  analisisLogrosOpen: boolean;
  toggleAnalisisLogros: () => void;
  setAnalisisLogrosOpen: (open: boolean) => void;
  analisisRepasarOpen: boolean;
  toggleAnalisisRepasar: () => void;
  setAnalisisRepasarOpen: (open: boolean) => void;
  resetAnalisisAccordions: () => void;
  activeModal: ShowcaseModal | null;
  setActiveModal: (modal: ShowcaseModal | null) => void;
  selectSim: (simId: string) => void;
  /** Misma API que `navigateTo` en previews: rutas `/estudiante/...`. */
  navigateTo: (path: string, options?: ShowcaseNavigateOptions) => void;
  goBack: () => void;
  openDashboard: () => void;
  openMetricas: () => void;
  openRespuestas: (materia?: string | null) => void;
  openRanking: () => void;
  openPerfil: () => void;
  /** Capa de modales dentro del slot (no viewport). */
  overlayRootEl: HTMLElement | null;
  /** Viewport con scroll del panel escalado. */
  scrollViewportEl: HTMLElement | null;
  registerOverlayRoot: (el: HTMLElement | null) => void;
  registerScrollViewport: (el: HTMLElement | null) => void;
};

const noop = () => {};

export const ShowcaseEmbedContext = createContext<ShowcaseEmbedValue>({
  active: false,
  embedded: null,
  activeScreen: 'panel',
  setActiveScreen: noop,
  activeSim: SHOWCASE_DEFAULT_SIM,
  setActiveSim: noop,
  activeTab: 'dashboard',
  setActiveTab: noop,
  activeMateria: null,
  activePath: SHOWCASE_INITIAL_PATH,
  selectedQuestionId: null,
  setSelectedQuestionId: noop,
  analisisLogrosOpen: false,
  toggleAnalisisLogros: noop,
  setAnalisisLogrosOpen: noop,
  analisisRepasarOpen: false,
  toggleAnalisisRepasar: noop,
  setAnalisisRepasarOpen: noop,
  resetAnalisisAccordions: noop,
  activeModal: null,
  setActiveModal: noop,
  selectSim: noop,
  navigateTo: noop,
  goBack: noop,
  openDashboard: noop,
  openMetricas: noop,
  openRespuestas: noop,
  openRanking: noop,
  openPerfil: noop,
  overlayRootEl: null,
  scrollViewportEl: null,
  registerOverlayRoot: noop,
  registerScrollViewport: noop,
});

export function useShowcaseEmbed() {
  return useContext(ShowcaseEmbedContext);
}

type ShowcaseEmbedProviderProps = {
  children: ReactNode;
  embedded: ShowcaseEmbeddedDashboard;
};

export function ShowcaseEmbedProvider({ children, embedded }: ShowcaseEmbedProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState<ShowcaseStudentScreen>('panel');
  const [activeSim, setActiveSim] = useState(SHOWCASE_DEFAULT_SIM);
  const [activeTab, setActiveTab] = useState<ShowcaseDashboardTab>('dashboard');
  const [activeMateria, setActiveMateria] = useState<string | null>(null);
  const [activePath, setActivePath] = useState(SHOWCASE_INITIAL_PATH);
  const [navStack, setNavStack] = useState<ShowcaseNavEntry[]>([
    { path: SHOWCASE_INITIAL_PATH, materia: null },
  ]);
  const [selectedQuestionId, setSelectedQuestionIdState] = useState<string | null>(null);
  const [analisisLogrosOpen, setAnalisisLogrosOpen] = useState(false);
  const [analisisRepasarOpen, setAnalisisRepasarOpen] = useState(false);
  const [activeModal, setActiveModalState] = useState<ShowcaseModal | null>(null);
  const [overlayRootEl, setOverlayRootEl] = useState<HTMLElement | null>(null);
  const [scrollViewportEl, setScrollViewportEl] = useState<HTMLElement | null>(null);

  const registerOverlayRoot = useCallback((el: HTMLElement | null) => {
    setOverlayRootEl(el);
  }, []);

  const registerScrollViewport = useCallback((el: HTMLElement | null) => {
    setScrollViewportEl(el);
  }, []);

  const clearTourOverlays = () => {
    setSelectedQuestionIdState(null);
    setActiveModalState(null);
  };

  const resetAnalisisAccordions = () => {
    setAnalisisLogrosOpen(false);
    setAnalisisRepasarOpen(false);
  };

  const applyNavEntry = useCallback((entry: ShowcaseNavEntry) => {
    const parsed = parseShowcaseStudentPath(
      entry.materia ? `${entry.path}?materia=${encodeURIComponent(entry.materia)}` : entry.path,
    );
    setActiveScreen('panel');
    setActiveTab(parsed.tab);
    setActiveMateria(parsed.materia);
    setActivePath(parsed.path);
    clearTourOverlays();
    if (parsed.tab !== 'respuestas') resetAnalisisAccordions();
  }, []);

  const navigateTo = useCallback(
    (path: string, options?: ShowcaseNavigateOptions) => {
      const parsed = parseShowcaseStudentPath(path);
      if (parsed.tab === 'perfil') {
        const home: ShowcaseNavEntry = { path: SHOWCASE_INITIAL_PATH, materia: null };
        setNavStack((prev) => (options?.replace ? [...prev.slice(0, -1), home] : [...prev, home]));
        applyNavEntry(home);
        return;
      }
      const entry: ShowcaseNavEntry = { path: parsed.path, materia: parsed.materia };

      setNavStack((prev) => {
        if (options?.replace) {
          if (prev.length === 0) return [entry];
          return [...prev.slice(0, -1), entry];
        }
        const top = prev[prev.length - 1];
        if (top && top.path === entry.path && top.materia === entry.materia) return prev;
        return [...prev, entry];
      });

      applyNavEntry(entry);

      if (isDemoEstudianteRoute(pathname)) {
        router.replace(demoEstudiantePath(demoNavIdFromShowcaseTab(parsed.tab)));
      }
    },
    [applyNavEntry, pathname, router],
  );

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      const returnTo = sessionStorage.getItem('returnTo');
      if (returnTo) {
        sessionStorage.removeItem('returnTo');
        navigateTo(returnTo, { replace: true });
        return;
      }
    }

    setNavStack((prev) => {
      if (prev.length <= 1) {
        const home: ShowcaseNavEntry = { path: SHOWCASE_INITIAL_PATH, materia: null };
        applyNavEntry(home);
        return [home];
      }
      const next = prev.slice(0, -1);
      applyNavEntry(next[next.length - 1]!);
      return next;
    });
  }, [applyNavEntry, navigateTo]);

  const setSelectedQuestionId = (id: string | null) => {
    setSelectedQuestionIdState(id);
    if (id) {
      setActiveModalState({ kind: 'analisisQuestion', questionId: id });
      return;
    }
    setActiveModalState((prev) => (prev?.kind === 'analisisQuestion' ? null : prev));
  };

  const setActiveModal = (modal: ShowcaseModal | null) => {
    setActiveModalState(modal);
    if (modal?.kind === 'analisisQuestion') {
      setSelectedQuestionIdState(modal.questionId);
      return;
    }
    setSelectedQuestionIdState(null);
  };

  const selectSim = (simId: string) => {
    setActiveSim(simId);
    setNavStack([{ path: SHOWCASE_INITIAL_PATH, materia: null }]);
    resetAnalisisAccordions();
    applyNavEntry({ path: SHOWCASE_INITIAL_PATH, materia: null });
  };

  const openDashboard = () => navigateTo('/estudiante/dashboard');
  const openMetricas = () => navigateTo('/estudiante/estadisticas');
  const openRespuestas = (materia?: string | null) => {
    if (materia) {
      navigateTo(`/estudiante/analisis?materia=${encodeURIComponent(materia)}`);
      return;
    }
    navigateTo('/estudiante/analisis');
  };
  const openRanking = () => navigateTo('/estudiante/ranking');
  const openPerfil = () => navigateTo('/estudiante/perfil');
  const toggleAnalisisLogros = () => setAnalisisLogrosOpen((prev) => !prev);
  const toggleAnalisisRepasar = () => setAnalisisRepasarOpen((prev) => !prev);

  return (
    <ShowcaseEmbedContext.Provider
      value={{
        active: true,
        embedded,
        activeScreen,
        setActiveScreen,
        activeSim,
        setActiveSim,
        activeTab,
        setActiveTab,
        activeMateria,
        activePath,
        selectedQuestionId,
        setSelectedQuestionId,
        analisisLogrosOpen,
        toggleAnalisisLogros,
        setAnalisisLogrosOpen,
        analisisRepasarOpen,
        toggleAnalisisRepasar,
        setAnalisisRepasarOpen,
        resetAnalisisAccordions,
        activeModal,
        setActiveModal,
        selectSim,
        navigateTo,
        goBack,
        openDashboard,
        openMetricas,
        openRespuestas,
        openRanking,
        openPerfil,
        overlayRootEl,
        scrollViewportEl,
        registerOverlayRoot,
        registerScrollViewport,
      }}
    >
      {children}
    </ShowcaseEmbedContext.Provider>
  );
}
