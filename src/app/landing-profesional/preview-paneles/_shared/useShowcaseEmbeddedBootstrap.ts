'use client';

import { useEffect, useRef } from 'react';
import { SHOWCASE_EMBEDDED } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/data/embedded-student';
import { useShowcaseEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/context/ShowcaseEmbedProvider';
import { getAllStudents, getStudentResults } from '@/app/landing-profesional/preview-paneles/_data/firestoreMock';
import { PREVIEW_STUDENT_ID } from '@/app/landing-profesional/preview-paneles/_data/seeds/constants';

type SubjectTop = {
  materia: string;
  label: string;
  color: string;
  icon: string;
  top1Nombre: string;
  top1Puntaje: number;
  miPuesto: number;
  miPuntaje: number;
  total: number;
};

type RankingInfo = {
  puesto: number;
  total: number;
  avgGlobal: number;
  top5: any[];
};

/** Hidrata previews del tour con datos ricos del JSON embebido (sin depender de caché local). */
export function useShowcaseEmbeddedBootstrap<TStudent = unknown, TGroup = TStudent>(options: {
  simulacroActual: string | null;
  setEstudiante: (value: TStudent) => void;
  setSimulacroActual: (sim: string) => void;
  setSimulacrosDelEstudiante: (sims: string[]) => void;
  setRankingInfo?: (info: RankingInfo) => void;
  setSubjectTops?: (tops: SubjectTop[]) => void;
  /** Lista del grupo (métricas, ranking comparativo). */
  setGroupStudents?: (students: TGroup[]) => void;
  setLoading: (loading: boolean) => void;
  setErrorMsg?: (msg: string) => void;
}) {
  const embed = useShowcaseEmbed();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const lastSimRef = useRef<string | null>(null);

  useEffect(() => {
    if (!embed.active) {
      lastSimRef.current = null;
      return;
    }

    const sim = embed.activeSim || SHOWCASE_EMBEDDED.simulacroActual;
    if (lastSimRef.current === sim) return;
    lastSimRef.current = sim;

    const opts = optionsRef.current;

    const applyEmbedded = async () => {
      opts.setEstudiante(SHOWCASE_EMBEDDED.estudiante as TStudent);
      opts.setSimulacroActual(sim);
      opts.setSimulacrosDelEstudiante([...SHOWCASE_EMBEDDED.simulacros] as string[]);
      opts.setRankingInfo?.({
        ...SHOWCASE_EMBEDDED.rankingInfo,
        top5: [...SHOWCASE_EMBEDDED.rankingInfo.top5],
      });
      opts.setSubjectTops?.([...SHOWCASE_EMBEDDED.subjectTops]);
      if (opts.setGroupStudents) {
        try {
          opts.setGroupStudents((await getAllStudents(sim)) as TGroup[]);
        } catch {
          opts.setGroupStudents([SHOWCASE_EMBEDDED.estudiante as TGroup]);
        }
      }
      opts.setLoading(false);
      opts.setErrorMsg?.('');
    };

    if (sim === SHOWCASE_EMBEDDED.simulacroActual) {
      void applyEmbedded();
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [found, group] = await Promise.all([
          getStudentResults(PREVIEW_STUDENT_ID, sim),
          opts.setGroupStudents ? getAllStudents(sim) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        if (found) {
          opts.setEstudiante(found as TStudent);
        } else {
          opts.setEstudiante(SHOWCASE_EMBEDDED.estudiante as TStudent);
        }
        opts.setSimulacroActual(sim);
        opts.setSimulacrosDelEstudiante([...SHOWCASE_EMBEDDED.simulacros] as string[]);
        if (group && opts.setGroupStudents) {
          opts.setGroupStudents(group as TGroup[]);
        }
        opts.setLoading(false);
        opts.setErrorMsg?.('');
      } catch {
        if (!cancelled) void applyEmbedded();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [embed.active, embed.activeSim]);
}
