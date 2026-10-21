/** Íconos de línea (24×24) por actor, en SVG en línea. */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export type Actor = 'estudiante' | 'sg' | 'docentes' | 'familias' | 'directivos';

export function IconoActor({ actor }: { actor: Actor }) {
  return (
    <svg className="sg-ico" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" {...P}>
      {actor === 'estudiante' && (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>)}
      {actor === 'sg' && (<><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /><path d="M22 10v6" /></>)}
      {actor === 'docentes' && (<><rect x="2" y="3" width="20" height="13" rx="2" /><path d="M12 16v5M8 21h8M7 12l3-3 2 2 4-4" /></>)}
      {actor === 'familias' && (<><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0 1 14 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-4-6.3" /></>)}
      {actor === 'directivos' && (<><path d="M3 21h18M5 21V10l7-5 7 5v11" /><path d="M10 21v-5h4v5M12 5V2l3 1.5L12 5" /></>)}
    </svg>
  );
}
