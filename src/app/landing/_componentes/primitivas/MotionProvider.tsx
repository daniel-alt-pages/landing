'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/** Respeta prefers-reduced-motion en todos los componentes `motion` de la landing. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
