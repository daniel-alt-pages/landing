'use client';

import type { RefObject } from 'react';

/** Cursor del tour; posición vía DOM imperativo (sin re-render por frame). */
export function ShowcaseVirtualCursor({
  cursorRef,
}: {
  cursorRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={cursorRef}
      className="showcase-system-cursor pointer-events-none absolute left-0 top-0 z-[10000]"
      style={{ display: 'none' }}
      aria-hidden
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block drop-shadow-[0_1px_1px_rgba(0,0,0,0.55)]"
      >
        <path
          d="M3 2L3 15.5L7.2 11.8L10.2 17.5L12.5 16.3L9.5 10.6L14.5 10.6L3 2Z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
