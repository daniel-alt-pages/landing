import type { ReactNode } from 'react';

/** **palabra** se ve en negrita. El resto del texto sigue igual. */
export function Marks({ text }: { text: string }): ReactNode {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => (
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>
  ));
}
