'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BarChart,
  BookOpen,
  Calculator,
  CheckCircle2,
  Globe2,
  Languages,
  Microscope,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import AnimateIn from '@shared/components/animations/AnimateIn';
import { showcaseDomIds } from '../../constants/dom-ids';
import { SHOWCASE_MATERIAS } from '../../constants/materias';
import { useShowcaseEmbed } from '../../context/ShowcaseEmbedProvider';
import { useShowcaseTourHighlight } from '../../context/ShowcaseTourHighlightContext';
import { showcaseTourHighlightClass } from '../../context/showcaseTourHighlightClass';
import type { ShowcaseDashboardStats } from '../../types/showcase.types';
import { ShowcaseRespuestasDetailModal } from './ShowcaseRespuestasDetailModal';
import {
  splitShowcaseRespuestasSessions,
  type ShowcaseRespuestaCell,
  type ShowcaseRespuestaRaw,
} from './showcase-respuestas-sessions';

type Props = {
  stats: ShowcaseDashboardStats;
};

const MATERIA_ICONS = {
  'lectura crítica': BookOpen,
  matemáticas: Calculator,
  'sociales y ciudadanas': Globe2,
  'ciencias naturales': Microscope,
  inglés: Languages,
} as const;

const MATERIA_GRADIENTS: Record<string, string> = {
  'lectura crítica': 'from-pink-500 to-rose-600',
  matemáticas: 'from-blue-500 to-indigo-600',
  'sociales y ciudadanas': 'from-amber-500 to-orange-600',
  'ciencias naturales': 'from-emerald-500 to-teal-600',
  inglés: 'from-purple-500 to-violet-600',
};

function cellDifficultyPct(numero: string) {
  const num = Number(numero) || 1;
  return ((num * 17 + 23) % 45) + 35;
}

export function ShowcaseRespuestasPanel({ stats }: Props) {
  const { activeTab, activeMateria, selectedQuestionId, setSelectedQuestionId } = useShowcaseEmbed();
  const tourHighlightId = useShowcaseTourHighlight();
  const { embedded } = stats;
  const { estudiante } = embedded;

  const [activeMateriaKey, setActiveMateriaKey] = useState<string>('matemáticas');

  useEffect(() => {
    if (activeTab !== 'respuestas') return;
    if (activeMateria) setActiveMateriaKey(activeMateria);
  }, [activeTab, activeMateria]);

  const materiaActual = SHOWCASE_MATERIAS.find((m) => m.key === activeMateriaKey) || SHOWCASE_MATERIAS[0];
  const materiaGradient = MATERIA_GRADIENTS[materiaActual.key] ?? 'from-indigo-500 to-violet-600';

  const respuestasMateria =
    (estudiante.respuestas_detalladas as Record<string, Record<string, ShowcaseRespuestaRaw>>)?.[
      activeMateriaKey
    ] ?? {};

  const { sesion1, sesion2 } = useMemo(
    () => splitShowcaseRespuestasSessions(activeMateriaKey, respuestasMateria),
    [activeMateriaKey, respuestasMateria],
  );

  const puntajeMateria = estudiante.puntajes[activeMateriaKey];
  const correctas = puntajeMateria?.correctas ?? 0;
  const total = puntajeMateria?.total_preguntas ?? 0;
  const porcentaje = total > 0 ? Math.round((correctas / total) * 100) : 0;
  const promedioGrupo =
    embedded.groupStats.promediosPorMateria[activeMateriaKey] ??
    embedded.promedios.materias[activeMateriaKey]?.porcentaje ??
    68;
  const diferencia = porcentaje - promedioGrupo;
  const puntajeIcfes = puntajeMateria?.puntaje ?? 0;

  const selectedQuestion: ShowcaseRespuestaCell | null =
    selectedQuestionId && respuestasMateria[selectedQuestionId]
      ? { ...respuestasMateria[selectedQuestionId], numero: selectedQuestionId }
      : null;

  const renderCell = (resp: ShowcaseRespuestaCell) => {
    const esAnulada = resp.invalidada;
    const dificultad = cellDifficultyPct(resp.numero);
    const isSelected = selectedQuestionId === resp.numero;
    const qBoxId = showcaseDomIds.questionBox(resp.numero);

    let bgColor = 'bg-emerald-500';
    let borderColor = 'border-emerald-400/30';
    let shadowColor = 'shadow-emerald-500/20';

    if (esAnulada) {
      bgColor = 'bg-slate-500';
      borderColor = 'border-slate-400/30';
      shadowColor = 'shadow-slate-500/20';
    } else if (!resp.es_correcta) {
      if (dificultad < 40) {
        bgColor = 'bg-amber-500';
        borderColor = 'border-amber-400/30';
        shadowColor = 'shadow-amber-500/20';
      } else {
        bgColor = 'bg-rose-500';
        borderColor = 'border-rose-400/30';
        shadowColor = 'shadow-rose-500/20';
      }
    }

    return (
      <motion.button
        key={resp.numero}
        type="button"
        whileHover={{ scale: 1.12, zIndex: 10 }}
        whileTap={{ scale: 0.95 }}
        id={qBoxId}
        onClick={() => setSelectedQuestionId(isSelected ? null : resp.numero)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg border text-[10px] font-bold text-white shadow-md transition-all sm:h-10 sm:w-10 sm:text-xs ${bgColor} ${borderColor} ${shadowColor} hover:shadow-lg ${showcaseTourHighlightClass(qBoxId, tourHighlightId)} ${
          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 z-20' : ''
        }`}
      >
        {resp.numero}
      </motion.button>
    );
  };

  const renderSession = (
    respuestas: ShowcaseRespuestaCell[],
    sesionLabel: string,
    sesionDesc: string,
    colorAccent: string,
  ) => {
    if (respuestas.length === 0) return null;

    const correctasSesion = respuestas.filter((r) => r.es_correcta && !r.invalidada).length;
    const anuladas = respuestas.filter((r) => r.invalidada).length;
    const totalSesion = respuestas.length - anuladas;
    const pctSesion = totalSesion > 0 ? Math.round((correctasSesion / totalSesion) * 100) : 0;
    const first = respuestas[0]?.numero ?? '0';
    const last = respuestas[respuestas.length - 1]?.numero ?? '0';

    return (
      <motion.div
        key={sesionLabel}
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
      >
        <div className={`border-b border-white/10 bg-gradient-to-r px-4 py-2.5 ${colorAccent} to-transparent`}>
          <motion.div className="flex items-center justify-between">
            <motion.div className="flex items-center gap-3">
              <motion.div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-xs font-bold text-white">
                {sesionLabel}
              </motion.div>
              <motion.div>
                <h4 className="text-sm font-bold text-white">{sesionDesc}</h4>
                <p className="text-[10px] text-white/40">
                  Preguntas {first} - {last}
                </p>
              </motion.div>
            </motion.div>
            <motion.div
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                pctSesion >= 70
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : pctSesion >= 50
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {correctasSesion}/{totalSesion} ({pctSesion}%)
            </motion.div>
          </motion.div>
        </div>
        <motion.div className="p-3">
          <motion.div className="flex flex-wrap gap-1.5">{respuestas.map(renderCell)}</motion.div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <AnimateIn type="fadeUp" duration={0.6}>
      <motion.div
        id={showcaseDomIds.sectionRespuestas}
        className="relative space-y-6"
      >
        {/* Selector de materias — como analisis */}
        <motion.div className="flex flex-wrap justify-center gap-2">
          {SHOWCASE_MATERIAS.map((m) => {
            const Icon = MATERIA_ICONS[m.key as keyof typeof MATERIA_ICONS] ?? BookOpen;
            const isActive = activeMateriaKey === m.key;
            const gradient = MATERIA_GRADIENTS[m.key] ?? 'from-indigo-500 to-violet-600';
            return (
              <motion.button
                key={m.key}
                type="button"
                id={showcaseDomIds.materiaTab(m.key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveMateriaKey(m.key);
                  setSelectedQuestionId(null);
                }}
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${gradient} border-transparent text-white shadow-lg`
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{m.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* KPI cards */}
        <AnimateIn type="scaleUp" delay={0.1} duration={0.6}>
          <motion.div
            id={showcaseDomIds.sectionRespuestasKpi}
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            <span id={showcaseDomIds.sectionResultadosArea} className="sr-only">
              Resultados por área
            </span>
            <motion.div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-4 backdrop-blur-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Tu Efectividad
              </span>
              <p className="mt-1 text-3xl font-black text-white">{porcentaje}%</p>
              <p className="mt-1 text-[10px] text-white/40">
                {correctas}/{total} correctas
              </p>
              <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-emerald-400/30" />
            </motion.div>

            <motion.div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-indigo-500/10 p-4 backdrop-blur-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Promedio Grupo
              </span>
              <p className="mt-1 text-3xl font-black text-white">{promedioGrupo}%</p>
              <p className="mt-1 text-[10px] text-white/40">
                {embedded.groupStats.total} estudiantes
              </p>
              <Target className="absolute right-3 top-3 h-5 w-5 text-blue-400/30" />
            </motion.div>

            <motion.div
              className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl ${
                diferencia >= 0
                  ? 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-emerald-500/10'
                  : 'border-rose-500/30 bg-gradient-to-br from-rose-500/20 to-orange-500/10'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  diferencia >= 0 ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                vs Promedio
              </span>
              <p
                className={`mt-1 text-3xl font-black ${diferencia >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}
              >
                {diferencia >= 0 ? '+' : ''}
                {diferencia}%
              </p>
              <p className="mt-1 text-[10px] text-white/40">
                {diferencia >= 0 ? 'Por encima' : 'Por debajo'}
              </p>
              {diferencia >= 0 ? (
                <TrendingUp className="absolute right-3 top-3 h-5 w-5 text-cyan-400/30" />
              ) : (
                <TrendingDown className="absolute right-3 top-3 h-5 w-5 text-rose-400/30" />
              )}
            </motion.div>

            <motion.div
              className={`relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br ${materiaGradient} p-4 backdrop-blur-xl`}
              style={{ opacity: 0.95 }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                Puntaje ICFES
              </span>
              <p className="mt-1 text-3xl font-black text-white">{puntajeIcfes}</p>
              <p className="mt-1 text-[10px] text-white/40">de 100 puntos</p>
              <Award className="absolute right-3 top-3 h-5 w-5 text-white/20" />
            </motion.div>
          </motion.div>
        </AnimateIn>

        {/* Mapa de respuestas */}
        <AnimateIn type="fadeUp" delay={0.15} duration={0.5}>
          <motion.div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-white">
              <BarChart className="h-4 w-4 text-white/40" />
              Mapa de Respuestas
            </h3>
            <motion.div className="rounded-lg border border-white/10 bg-white/5 p-1">
              <span className="rounded bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                Heatmap
              </span>
            </motion.div>
          </motion.div>

          <motion.div id={showcaseDomIds.sectionHeatmap} className="mb-6 space-y-4">
            {renderSession(sesion1, 'S1', 'Primera Jornada', 'from-blue-500/20')}
            {renderSession(sesion2, 'S2', 'Segunda Jornada', 'from-purple-500/20')}

            <motion.div
              id={showcaseDomIds.sectionRespuestasLegend}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl"
            >
              <motion.div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <motion.div className="flex items-center gap-2 text-xs text-white/70">
                  <motion.div className="h-4 w-4 rounded bg-emerald-500 shadow-sm" />
                  <span>Correcta</span>
                </motion.div>
                <motion.div className="flex items-center gap-2 text-xs text-white/70">
                  <motion.div className="h-4 w-4 rounded bg-rose-500 shadow-sm" />
                  <span>Incorrecta (fácil)</span>
                </motion.div>
                <motion.div className="flex items-center gap-2 text-xs text-white/70">
                  <motion.div className="h-4 w-4 rounded bg-amber-500 shadow-sm" />
                  <span>Incorrecta (difícil)</span>
                </motion.div>
                <motion.div className="flex items-center gap-2 text-xs text-white/70">
                  <motion.div className="h-4 w-4 rounded bg-slate-500 shadow-sm" />
                  <span>Anulada</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimateIn>

        {selectedQuestion && (
          <ShowcaseRespuestasDetailModal
            question={selectedQuestion}
            tourHighlightId={tourHighlightId}
            onClose={() => setSelectedQuestionId(null)}
          />
        )}
      </motion.div>
    </AnimateIn>
  );
}
