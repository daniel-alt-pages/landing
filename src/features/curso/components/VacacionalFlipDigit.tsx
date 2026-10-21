'use client';

import { useEffect, useState } from 'react';
import styles from './VacacionalCountdownFlip.module.css';

type VacacionalFlipDigitProps = {
  digit: string;
};

/**
 * Un dígito con animación flip (mitad superior cae → revela el nuevo valor).
 */
export default function VacacionalFlipDigit({ digit }: VacacionalFlipDigitProps) {
  const [current, setCurrent] = useState(digit);
  const [previous, setPrevious] = useState(digit);
  const [flipping, setFlipping] = useState(false);
  const [flipTarget, setFlipTarget] = useState(digit);

  useEffect(() => {
    if (digit === current) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setCurrent(digit);
      setPrevious(digit);
      setFlipTarget(digit);
      setFlipping(false);
      return;
    }
    setPrevious(current);
    setFlipTarget(digit);
    setFlipping(true);
  }, [digit, current]);

  const onFlipEnd = () => {
    setFlipping(false);
    setCurrent(flipTarget);
  };

  const bottomDisplay = flipping ? previous : current;

  return (
    <div
      className={styles.digit}
      data-flipping={flipping ? 'true' : 'false'}
      aria-hidden
    >
      <div className={styles.digitStatic}>
        <div className={`${styles.half} ${styles.halfTop}`}>
          <span className={styles.halfText}>{current}</span>
        </div>
        <div className={`${styles.half} ${styles.halfBottom}`}>
          <span className={styles.halfText}>{bottomDisplay}</span>
        </div>
      </div>

      {flipping ? (
        <div className={styles.flipper} onAnimationEnd={onFlipEnd}>
          <div className={`${styles.flipFace} ${styles.flipFaceFront}`}>
            <span className={styles.halfText}>{previous}</span>
          </div>
          <div className={`${styles.flipFace} ${styles.flipFaceBack}`}>
            <span className={styles.halfText}>{flipTarget}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
