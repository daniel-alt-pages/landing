const ROLES = [
  { id: 'estudiante', label: 'Estudiante', path: 'M160 160 L160 46' },
  { id: 'familia', label: 'Familia', path: 'M160 160 L46 160' },
  { id: 'docente', label: 'Docente', path: 'M160 160 L274 160' },
  { id: 'directivo', label: 'Rectoría', path: 'M160 160 L160 274' },
] as const;

export function MapaActores({
  activo,
  onChange,
}: {
  activo: (typeof ROLES)[number]['id'];
  onChange: (id: (typeof ROLES)[number]['id']) => void;
}) {
  return (
    <div className={`ag-b2b-mapa is-${activo}`}>
      <svg viewBox="0 0 320 320" aria-hidden="true">
        <line x1="160" y1="160" x2="160" y2="46" />
        <line x1="160" y1="160" x2="46" y2="160" />
        <line x1="160" y1="160" x2="274" y2="160" />
        <line x1="160" y1="160" x2="160" y2="274" />
        {ROLES.map((rol) =>
          [0, 0.45, 0.9].map((inicio) => (
            <circle key={`${rol.id}-${inicio}`} className={`ag-b2b-viaje is-${rol.id}`} r="3.5" fill="#fff">
              <animateMotion dur="1.6s" repeatCount="indefinite" path={rol.path} begin={`${inicio}s`} />
            </circle>
          )),
        )}
      </svg>
      <p className="ag-b2b-mapa-centro">Plataforma</p>
      {ROLES.map((rol) => (
        <button
          key={rol.id}
          type="button"
          className={activo === rol.id ? `is-${rol.id} is-on` : `is-${rol.id}`}
          aria-pressed={activo === rol.id}
          onClick={() => onChange(rol.id)}
        >
          {rol.label}
        </button>
      ))}
    </div>
  );
}
