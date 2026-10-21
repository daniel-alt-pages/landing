'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import {
  rankingHoverLift,
  rankingPillVariants,
  rankingExpandedCardVariants,
  rankingTapScale,
  SEGUIMIENTO_APPLE_SPRING_SNAPPY,
  SEGUIMIENTO_APPLE_SPRING_SOFT,
} from '../lib/seguimientoMotion';

type RankingUserPositionFooterProps = {
  userRank: number;
  label: string;
  score: number;
  scoreSuffix?: string;
  children: ReactNode;
};

const RankingRevealContext = createContext(true);

/** Tarjeta al final del ranking; pill delgada fija con transición tipo Apple. */
export function useRankingReveal(): boolean {
  return useContext(RankingRevealContext);
}

export default function RankingUserPositionFooter({
  userRank,
  label,
  score,
  scoreSuffix = 'pts',
  children,
}: RankingUserPositionFooterProps) {
  const reduceMotion = useReducedMotion();
  const endRef = useRef<HTMLDivElement>(null);
  const [expandedVisible, setExpandedVisible] = useState(false);

  useEffect(() => {
    const target = endRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setExpandedVisible(entry.isIntersecting),
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const scrollToExpanded = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const pillTransition = reduceMotion
    ? { duration: 0.01 }
    : SEGUIMIENTO_APPLE_SPRING_SNAPPY;
  const cardTransition = reduceMotion
    ? { duration: 0.01 }
    : SEGUIMIENTO_APPLE_SPRING_SOFT;

  return (
    <RankingRevealContext.Provider value={expandedVisible}>
      <AnimatePresence mode="popLayout">
        {!expandedVisible ? (
          <motion.div
            key="ranking-user-pill"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4"
            variants={rankingPillVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={pillTransition}
          >
            <motion.button
              type="button"
              onClick={scrollToExpanded}
              whileTap={rankingTapScale(reduceMotion)}
              whileHover={rankingHoverLift(reduceMotion)}
              className="pointer-events-auto mx-auto flex w-full max-w-lg items-center gap-2 rounded-xl border border-[var(--course-accent)]/25 bg-[var(--course-bg)]/90 px-3 py-2 text-left shadow-[0_8px_32px_-8px_rgba(15,23,42,0.28)] backdrop-blur-xl backdrop-saturate-150"
              aria-label={`Tu posición: #${userRank}. Ver detalle al final del ranking.`}
            >
              <motion.span
                className="shrink-0 rounded-lg bg-[var(--course-accent)]/12 px-2 py-0.5 text-xs font-black tabular-nums text-[var(--course-accent)]"
                layoutId="ranking-user-rank-badge"
              >
                #{userRank}
              </motion.span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--course-text)]">
                {label}
                <span className="ml-1 text-[10px] font-bold uppercase text-[var(--course-accent)]">
                  Tú
                </span>
              </span>
              <span className="shrink-0 text-right tabular-nums">
                <span className="text-sm font-black text-[var(--course-text)]">{score}</span>
                <span className="ml-0.5 text-[10px] font-semibold text-[var(--course-text-muted)]">
                  {scoreSuffix}
                </span>
              </span>
              <motion.span
                animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
                transition={
                  reduceMotion
                    ? undefined
                    : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                }
                className="inline-flex shrink-0"
              >
                <ChevronUp className="h-4 w-4 text-[var(--course-text-muted)]" aria-hidden />
              </motion.span>
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        ref={endRef}
        className="mt-6 scroll-mt-4"
        variants={rankingExpandedCardVariants}
        initial="hidden"
        animate={expandedVisible ? 'visible' : 'partial'}
        transition={cardTransition}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {!expandedVisible ? (
          <motion.div
            key="ranking-user-spacer"
            className="h-12 w-full shrink-0"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 48 }}
            exit={{ opacity: 0, height: 0 }}
            transition={pillTransition}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>
    </RankingRevealContext.Provider>
  );
}
