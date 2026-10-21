import type { showcaseGetNivel } from '../constants/performance';
import type { ShowcaseEmbeddedDashboard } from '../data/embedded-student';
import type { ShowcasePuntajeMateria } from '../data/sim-snapshots';
import type { ShowcaseTourSectionMeta } from '../tour/tour-config';

export type ShowcaseDashboardTab = 'dashboard' | 'metricas' | 'respuestas' | 'ranking' | 'perfil';
export type ShowcaseStudentScreen = 'login' | 'selector' | 'panel';

export type ShowcaseCursorState = 'idle' | 'hover' | 'click' | 'hidden';

export type ShowcaseCursor = {
  x: number;
  y: number;
  state: ShowcaseCursorState;
};

export type ShowcaseEmbedState = {
  active: boolean;
  embedded: ShowcaseEmbeddedDashboard | null;
  activeScreen: ShowcaseStudentScreen;
  activeSim: string;
  activeTab: ShowcaseDashboardTab;
  selectedQuestionId: string | null;
  cursor: ShowcaseCursor;
};

export type ShowcaseDashboardStats = {
  embedded: ShowcaseEmbeddedDashboard;
  nombre: string;
  nivel: ReturnType<typeof showcaseGetNivel>;
  totalCorrectas: number;
  totalPreguntas: number;
  porcentajeGlobal: number;
  superados: number;
  percentil: number;
  diffPromedio: number;
  activeSimScore: number;
  activeSimAciertos: number;
  activeSimPreguntas: number;
  activeSimPuesto: number;
  activeSimTotal: number;
  activeSimPercentil: number;
  activeSimDiff: number;
  activeSimPuntajes: Record<string, ShowcasePuntajeMateria>;
  activeSimSubjectRankings: Record<string, number>;
};

/** Modales que el tour puede abrir en previews embebidos. */
export type ShowcaseModal =
  | { kind: 'analisisQuestion'; questionId: string }
  | { kind: 'metricasRanking' }
  | { kind: 'metricasArea'; areaKey: string }
  | { kind: 'metricasGroup' }
  | { kind: 'rankingProfile' };

export type ShowcaseTourDispatch =
  | { type: 'setScreen'; screen: ShowcaseStudentScreen }
  | { type: 'setSim'; simId: string }
  | { type: 'setTab'; tab: ShowcaseDashboardTab }
  | { type: 'openRespuestas'; materia: string | null }
  | { type: 'toggleAnalisisLogros' }
  | { type: 'toggleAnalisisRepasar' }
  | { type: 'resetAnalisisAccordions' }
  | { type: 'setAnalisisLogrosOpen'; open: boolean }
  | { type: 'setAnalisisRepasarOpen'; open: boolean }
  | { type: 'setQuestion'; questionId: string | null }
  | { type: 'setModal'; modal: ShowcaseModal | null };

export type ShowcaseTourFrame = {
  panY: number;
  cursor: ShowcaseCursor;
  /** Elemento bajo el puntero (hover/click) para feedback visual. */
  highlightId: string | null;
  /** En este frame se dispara clic DOM en el target (nav, sim, cards, preguntas). */
  domClickTargetId: string | null;
  dispatches: ShowcaseTourDispatch[];
  /** Fase narrativa activa (título + descripción en caption). */
  tourPhase: ShowcaseTourSectionMeta;
};

export type ShowcaseTourRuntimeState = {
  activeScreen: ShowcaseStudentScreen;
  activeSim: string;
  activeTab: ShowcaseDashboardTab;
  selectedQuestionId: string | null;
  activeModal: ShowcaseModal | null;
};

export type ShowcaseTourComputeContext = {
  elapsed: number;
  /** Viewport visible (stage con scroll nativo en split landing). */
  viewportEl: HTMLElement | null;
  /** Raíz del panel para querySelector (contenido embebido). */
  rootEl: HTMLElement | null;
  /** Pan máximo (negativo) ≡ -maxScrollTop. */
  maxPan: number;
  /** Destino scroll completo (negativo) ≡ -scrollEndTop. */
  scrollEndPan: number;
  runtime: ShowcaseTourRuntimeState;
  /** Timeline con scroll más lento (layout compacto móvil). */
  compactTour?: boolean;
};
