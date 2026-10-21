'use client';

import { useEffect, useRef } from 'react';
import { useShowcaseEmbed } from '../context/ShowcaseEmbedProvider';
import {
  PLATFORM_STUDENT_STORY_TARGETS,
  type PlatformStudentDemoTarget,
} from '@/app/landing-profesional/contenido-landing/utilidades/platformDemoNavigation';

function applyTarget(embed: ReturnType<typeof useShowcaseEmbed>, target: PlatformStudentDemoTarget) {
  switch (target.action) {
    case 'openDashboard':
      embed.openDashboard();
      break;
    case 'openMetricas':
      embed.openMetricas();
      break;
    case 'openRanking':
      embed.openRanking();
      break;
    case 'openPerfil':
      embed.openPerfil();
      break;
    case 'openRespuestas':
      embed.openRespuestas(target.materia ?? null);
      break;
    default:
      break;
  }
}

export function PlatformStoryNavigator({ storyIndex }: { storyIndex: number }) {
  const embed = useShowcaseEmbed();
  const lastIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (storyIndex < 0 || storyIndex >= PLATFORM_STUDENT_STORY_TARGETS.length) return;
    if (lastIndexRef.current === storyIndex) return;
    lastIndexRef.current = storyIndex;
    const target = PLATFORM_STUDENT_STORY_TARGETS[storyIndex]!;
    applyTarget(embed, target);
  }, [storyIndex, embed]);

  return null;
}
