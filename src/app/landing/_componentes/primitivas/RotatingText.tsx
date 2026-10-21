'use client';

import { useEffect, useState } from 'react';

/** Rota frases cada 5,2 s. Con movimiento reducido se queda en la primera. */
export function RotatingText({ words }: { words: readonly string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % words.length), 5200);
    return () => window.clearInterval(timer);
  }, [words.length]);

  return (
    <span className="ag-rotating" aria-live="off">
      <span key={words[index]} className="ag-rotating-word">
        {words[index]}
      </span>
      <span className="ag-sr">{words.join(', ')}</span>
    </span>
  );
}
