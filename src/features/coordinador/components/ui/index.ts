/**
 * Primitivas UI del panel coordinador.
 * Importa siempre desde aquí para mantener consistencia transversal.
 *
 * Ejemplo:
 *   import { CoordCard, SectionHeader, KpiTile, EmptyState, LoadingState, ErrorState, TabBar } from '@features/coordinador/components/ui';
 */
export { default as CoordCard } from './CoordCard';
export type { CoordCardProps, CoordCardAccent } from './CoordCard';

export { default as SectionHeader } from './SectionHeader';
export type { SectionHeaderProps } from './SectionHeader';

export { default as KpiTile } from './KpiTile';
export type { KpiTileProps, KpiTone } from './KpiTile';

export { default as EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { default as PrioritiesClearPanel } from './PrioritiesClearPanel';

export { default as LoadingState } from './LoadingState';
export { default as ErrorState } from './ErrorState';

export { default as TabBar } from './TabBar';
export type { TabBarProps, TabOption } from './TabBar';

export { default as CoordStitchSelect } from './CoordStitchSelect';
export type { CoordStitchSelectOption, CoordStitchSelectProps } from './CoordStitchSelect';
