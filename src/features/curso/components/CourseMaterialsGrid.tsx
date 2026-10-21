'use client';

import { useMemo, useState } from 'react';
import { Calendar, FileText, Filter, FolderOpen, Search } from 'lucide-react';
import { expandSimulacroMaterials } from '../lib/courseSimulacroMaterials';
import CourseSimulacroNoticeModal from './CourseSimulacroNoticeModal';
import SgEmptyState from '@shared/components/SgEmptyState';
import { SgSkeletonCard } from '@shared/components/SgSkeleton';
import type { CourseMaterial, CourseMaterialKind } from '../types/courseTypes';
import { useCourseFavorites } from '../hooks/useCourseFavorites';
import { useCourseTheme } from '../hooks/useCourseTheme';
import { useCourseVacacionalCalendar } from '../context/CourseVacacionalCalendarContext';
import CourseGoogleAccessHint from './CourseGoogleAccessHint';
import CoursePanelFilterModal from './CoursePanelFilterModal';
import CoursePanelSelect from './CoursePanelSelect';
import CourseMaterialBrowserCard, {
  materialKindToPreview,
  type MaterialBrowserPreview,
} from './CourseMaterialBrowserCard';
import type { VacacionalMaterialCategory } from '../lib/courseVacacionalAttachmentPolicy';
import {
  buildVacacionalClassMaterials,
  buildVacacionalMaterialDateOptions,
  buildVacacionalMaterialTypeOptions,
  filterVacacionalClassMaterials,
} from '../lib/courseVacacionalMaterials';
import { formatWeekHeading } from '../lib/courseVacacionalWeek';

const STATIC_KIND_LABEL: Record<CourseMaterialKind, string> = {
  drive_folder: 'Carpeta',
  pdf: 'PDF',
  doc: 'Documento',
  link: 'Enlace',
};

const MATERIALS_GRID_CLASS =
  'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4';

type CourseMaterialsGridProps = {
  courseId: string;
  materials: CourseMaterial[];
  showVacacionalCalendar?: boolean;
  onOpenClasesTab?: () => void;
};

function vacacionalCategoryToPreview(category: VacacionalMaterialCategory): MaterialBrowserPreview {
  switch (category) {
    case 'gemini':
      return 'gemini';
    case 'documento':
      return 'doc';
    case 'presentacion':
      return 'presentation';
    case 'hoja':
      return 'sheet';
    default:
      return 'other';
  }
}

function isCurrentSimulationMaterial(material: CourseMaterial): boolean {
  return material.materialGroup === 'simulacro_actual';
}

export default function CourseMaterialsGrid({
  courseId,
  materials,
  showVacacionalCalendar = false,
  onOpenClasesTab,
}: CourseMaterialsGridProps) {
  const { toggleMaterialFavorite, isMaterialFavorite } = useCourseFavorites(courseId);
  const { dark } = useCourseTheme();
  const { enabled, events, loading, error, week } = useCourseVacacionalCalendar();
  const allClassMaterials = useMemo(
    () => (showVacacionalCalendar && enabled ? buildVacacionalClassMaterials(events, dark) : []),
    [showVacacionalCalendar, enabled, events, dark],
  );

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<VacacionalMaterialCategory | 'all'>('all');
  const [materialQuery, setMaterialQuery] = useState('');
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState({
    dateKey: 'all',
    category: 'all' as VacacionalMaterialCategory | 'all',
  });
  const [staticKindFilter, setStaticKindFilter] = useState<CourseMaterialKind | 'all'>('all');
  const [noticeMaterial, setNoticeMaterial] = useState<CourseMaterial | null>(null);

  const dateOptions = useMemo(
    () => [{ value: 'all', label: 'Todas las fechas' }, ...buildVacacionalMaterialDateOptions(allClassMaterials)],
    [allClassMaterials],
  );
  const typeOptions = useMemo(
    () => buildVacacionalMaterialTypeOptions(allClassMaterials),
    [allClassMaterials],
  );

  const classMaterials = useMemo(() => {
    const filtered = filterVacacionalClassMaterials(allClassMaterials, {
      dateKey: dateFilter,
      category: typeFilter,
    });
    const q = materialQuery.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(
      (item) =>
        item.sessionTitle.toLowerCase().includes(q) ||
        item.attachmentLabel.toLowerCase().includes(q) ||
        item.materialCategoryLabel.toLowerCase().includes(q),
    );
  }, [allClassMaterials, dateFilter, typeFilter, materialQuery]);

  const activeMaterialFilters =
    (dateFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (materialQuery.trim() ? 1 : 0);

  const displayMaterials = useMemo(() => expandSimulacroMaterials(materials), [materials]);

  const currentSimulationMaterials = useMemo(
    () => displayMaterials.filter((m) => m.visible !== false && isCurrentSimulationMaterial(m)),
    [displayMaterials],
  );

  const baseStaticMaterials = useMemo(
    () => displayMaterials.filter((m) => m.visible !== false && !isCurrentSimulationMaterial(m)),
    [displayMaterials],
  );

  const staticMaterials = useMemo(() => {
    if (staticKindFilter === 'all') return baseStaticMaterials;
    return baseStaticMaterials.filter((m) => m.kind === staticKindFilter);
  }, [baseStaticMaterials, staticKindFilter]);

  const staticKindOptions = useMemo(() => {
    const kinds = [...new Set(baseStaticMaterials.map((m) => m.kind))];
    return [
      { value: 'all' as const, label: 'Todos los compilados' },
      ...kinds.map((kind) => ({ value: kind, label: STATIC_KIND_LABEL[kind] ?? kind })),
    ];
  }, [baseStaticMaterials]);

  const weekHeading = week.start && week.end ? formatWeekHeading(week.start, week.end) : '';
  const hasStatic = baseStaticMaterials.length > 0;
  const hasCurrentSimulation = currentSimulationMaterials.length > 0;
  const hasCalendar = allClassMaterials.length > 0;
  const hasFilteredCalendar = classMaterials.length > 0;
  const notice = noticeMaterial?.openNotice;
  const simulacroSubtitle = useMemo(() => {
    const withNotice = currentSimulationMaterials.find((m) => m.openNotice?.deadlineLabel);
    return (
      withNotice?.openNotice?.deadlineLabel?.replace(/^El acceso cierra el /i, 'Acceso hasta el ') ??
      currentSimulationMaterials.find((m) => m.description)?.description ??
      'Simulacro vigente del curso'
    );
  }, [currentSimulationMaterials]);
  const openNoticeTarget = () => {
    if (!noticeMaterial?.url) return;
    window.open(noticeMaterial.url, '_blank', 'noopener,noreferrer');
    setNoticeMaterial(null);
  };

  if (!hasStatic && !hasCurrentSimulation && !hasCalendar && !loading && !error) {
    return (
      <SgEmptyState
        icon={FolderOpen}
        title="Aún no hay compilados"
        message="Cuando el equipo publique materiales, aparecerán aquí."
      />
    );
  }

  return (
    <div className="space-y-8">
      {hasStatic || hasCurrentSimulation || hasCalendar ? <CourseGoogleAccessHint /> : null}

      {hasCurrentSimulation ? (
        <section aria-labelledby="current-simulation-materials-heading">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--course-accent-soft)]">
              <FileText className="h-4 w-4 text-[var(--course-accent)]" aria-hidden />
            </span>
            <div>
              <h2 id="current-simulation-materials-heading" className="text-lg font-bold text-[var(--course-text)]">
                Simulacro vigente
              </h2>
              <p className="text-xs text-[var(--course-text-muted)]">{simulacroSubtitle}</p>
            </div>
          </div>
          <ul className={MATERIALS_GRID_CLASS}>
            {currentSimulationMaterials.map((item) => (
              <li key={item.id}>
                <CourseMaterialBrowserCard
                  title={item.label}
                  url={item.url}
                  preview={materialKindToPreview(item.kind)}
                  badgeLabel="Vigente"
                  subtitle={item.description}
                  dark={dark}
                  isFavorite={isMaterialFavorite(item.id)}
                  onToggleFavorite={() => toggleMaterialFavorite(item.id)}
                  onOpen={item.openNotice ? () => setNoticeMaterial(item) : undefined}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showVacacionalCalendar && enabled ? (
        <section aria-labelledby="vacacional-class-materials-heading">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="vacacional-class-materials-heading" className="text-lg font-bold text-[var(--course-text)]">
                Materiales de clase
              </h2>
              <p className="mt-0.5 text-sm text-[var(--course-text-muted)]">
                Notas de Gemini y materiales compartidos · semana actual
              </p>
              {weekHeading ? (
                <p className="mt-1 text-xs font-medium capitalize text-[var(--course-accent)]">{weekHeading}</p>
              ) : null}
            </div>
            {onOpenClasesTab ? (
              <button
                type="button"
                onClick={onOpenClasesTab}
                className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[var(--course-accent)]/35 bg-[var(--course-accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--course-accent)] hover:border-[var(--course-accent)]"
              >
                <Calendar className="h-4 w-4" aria-hidden />
                Ver horario de clases
              </button>
            ) : null}
          </div>

          {hasCalendar ? (
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Buscar material</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--course-text-muted)]"
                  aria-hidden
                />
                <input
                  type="search"
                  value={materialQuery}
                  onChange={(e) => setMaterialQuery(e.target.value)}
                  placeholder="Buscar notas o materiales…"
                  className="min-h-10 w-full rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)] py-2 pl-9 pr-3 text-sm text-[var(--course-text)] placeholder:text-[var(--course-text-muted)]"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setFilterDraft({ dateKey: dateFilter, category: typeFilter });
                  setFiltersModalOpen(true);
                }}
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-[var(--course-accent)]/35 bg-[var(--course-accent-soft)] px-3 text-sm font-semibold text-[var(--course-accent)] hover:border-[var(--course-accent)]"
              >
                <Filter className="h-4 w-4" aria-hidden />
                Filtros
                {activeMaterialFilters > 0 ? (
                  <span className="rounded-full bg-[var(--course-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {activeMaterialFilters}
                  </span>
                ) : null}
              </button>
            </div>
          ) : null}

          <CoursePanelFilterModal
            open={filtersModalOpen}
            title="Filtrar materiales"
            description="Solo notas Gemini y materiales públicos"
            onClose={() => setFiltersModalOpen(false)}
            onClear={() => setFilterDraft({ dateKey: 'all', category: 'all' })}
            onApply={() => {
              setDateFilter(filterDraft.dateKey);
              setTypeFilter(filterDraft.category);
            }}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--course-text-muted)]">Fecha</span>
              <CoursePanelSelect
                value={filterDraft.dateKey}
                onChange={(dateKey) => setFilterDraft((d) => ({ ...d, dateKey }))}
                options={dateOptions}
                aria-label="Filtrar por fecha"
                variant="field"
                className="w-full"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--course-text-muted)]">Tipo de material</span>
              <CoursePanelSelect
                value={filterDraft.category}
                onChange={(category) =>
                  setFilterDraft((d) => ({
                    ...d,
                    category: category as VacacionalMaterialCategory | 'all',
                  }))
                }
                options={typeOptions}
                aria-label="Filtrar por tipo de material"
                variant="field"
                className="w-full"
              />
            </label>
          </CoursePanelFilterModal>

          {loading && !allClassMaterials.length ? <SgSkeletonCard lines={4} /> : null}

          {error ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {error}. Ejecuta <code className="rounded bg-amber-100 px-1">npm run dev</code> con
              calendar-api activo.
            </p>
          ) : null}

          {hasFilteredCalendar ? (
            <ul className={MATERIALS_GRID_CLASS}>
              {classMaterials.map((item) => (
                <li key={item.id}>
                  <CourseMaterialBrowserCard
                    title={item.attachmentLabel}
                    url={item.attachment.url}
                    preview={vacacionalCategoryToPreview(item.materialCategory)}
                    badgeLabel={item.materialCategoryLabel}
                    subtitle={`${item.sessionTitle} · ${item.sessionWhen}`}
                    dark={dark}
                    isFavorite={isMaterialFavorite(item.id)}
                    onToggleFavorite={() => toggleMaterialFavorite(item.id)}
                  />
                </li>
              ))}
            </ul>
          ) : hasCalendar && !loading && !error ? (
            <p className="rounded-2xl border border-dashed border-[var(--course-border)] bg-[var(--course-surface-muted)] px-5 py-8 text-center text-sm text-[var(--course-text-muted)]">
              No hay materiales con los filtros seleccionados.
            </p>
          ) : !loading && !error && !hasCalendar ? (
            <p className="rounded-2xl border border-dashed border-[var(--course-border)] bg-[var(--course-surface-muted)] px-5 py-8 text-center text-sm text-[var(--course-text-muted)]">
              No hay notas ni materiales compartidos esta semana.
            </p>
          ) : null}
        </section>
      ) : null}

      {hasStatic ? (
        <section aria-labelledby="course-materials-heading">
          {showVacacionalCalendar && enabled ? (
            <h2 id="course-materials-heading" className="mb-4 text-lg font-bold text-[var(--course-text)]">
              Compilados del curso
            </h2>
          ) : null}
          {staticKindOptions.length > 2 ? (
            <label className="mb-4 flex max-w-xs flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--course-text-muted)]">Tipo de compilado</span>
              <CoursePanelSelect
                value={staticKindFilter}
                onChange={(kind) => setStaticKindFilter(kind as CourseMaterialKind | 'all')}
                options={staticKindOptions}
                aria-label="Tipo de compilado"
                variant="field"
                className="w-full"
              />
            </label>
          ) : null}
          {staticMaterials.length ? (
            <ul className={MATERIALS_GRID_CLASS}>
              {staticMaterials.map((item) => (
                <li key={item.id}>
                  <CourseMaterialBrowserCard
                    title={item.label}
                    url={item.url}
                    preview={materialKindToPreview(item.kind)}
                    badgeLabel={STATIC_KIND_LABEL[item.kind]}
                    subtitle={item.description}
                    dark={dark}
                    isFavorite={isMaterialFavorite(item.id)}
                    onToggleFavorite={() => toggleMaterialFavorite(item.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--course-border)] bg-[var(--course-surface-muted)] px-5 py-8 text-center text-sm text-[var(--course-text-muted)]">
              No hay compilados con el filtro seleccionado.
            </p>
          )}
        </section>
      ) : null}

      {noticeMaterial && notice ? (
        <CourseSimulacroNoticeModal
          material={noticeMaterial}
          notice={notice}
          onClose={() => setNoticeMaterial(null)}
          onOpenFolder={openNoticeTarget}
        />
      ) : null}
    </div>
  );
}
