export type StudentNavSection =
  | 'dashboard'
  | 'estadisticas'
  | 'analisis'
  | 'ranking'
  | 'perfil'
  | 'clases'
  | 'curso';

export type StudentMobileNavTheme = {
  section: StudentNavSection;
  shellBg: string;
  shellBorder: string;
  shellShadow: string;
  inactive: string;
  active: string;
  pillBg: string;
  pillBorder: string;
  pillShadow: string;
};

const DARK_INSIGHT: Omit<StudentMobileNavTheme, 'section'> = {
  shellBg: 'rgba(7, 17, 31, 0.72)',
  shellBorder: 'rgba(255, 255, 255, 0.1)',
  shellShadow: '0 10px 32px rgba(0, 0, 0, 0.28)',
  inactive: 'rgba(255, 255, 255, 0.42)',
  active: '#a5f3fc',
  pillBg: 'rgba(103, 232, 249, 0.14)',
  pillBorder: 'rgba(103, 232, 249, 0.28)',
  pillShadow: '0 0 18px rgba(34, 211, 238, 0.12)',
};

const THEMES: Record<StudentNavSection, StudentMobileNavTheme> = {
  dashboard: {
    section: 'dashboard',
    shellBg: 'rgba(255, 255, 255, 0.92)',
    shellBorder: 'rgba(226, 232, 240, 0.95)',
    shellShadow: '0 10px 28px rgba(15, 23, 42, 0.1)',
    inactive: '#64748b',
    active: '#6366f1',
    pillBg: 'rgba(99, 102, 241, 0.12)',
    pillBorder: 'rgba(99, 102, 241, 0.24)',
    pillShadow: '0 0 16px rgba(99, 102, 241, 0.14)',
  },
  clases: {
    section: 'clases',
    shellBg: 'rgba(255, 255, 255, 0.94)',
    shellBorder: 'rgba(199, 210, 254, 0.85)',
    shellShadow: '0 10px 28px rgba(99, 102, 241, 0.1)',
    inactive: '#64748b',
    active: '#7c3aed',
    pillBg: 'rgba(124, 58, 237, 0.1)',
    pillBorder: 'rgba(124, 58, 237, 0.24)',
    pillShadow: '0 0 16px rgba(124, 58, 237, 0.12)',
  },
  curso: {
    section: 'curso',
    shellBg: 'rgba(255, 255, 255, 0.94)',
    shellBorder: 'rgba(196, 181, 253, 0.85)',
    shellShadow: '0 10px 28px rgba(124, 58, 237, 0.1)',
    inactive: '#64748b',
    active: '#6d28d9',
    pillBg: 'rgba(109, 40, 217, 0.1)',
    pillBorder: 'rgba(109, 40, 217, 0.24)',
    pillShadow: '0 0 16px rgba(109, 40, 217, 0.12)',
  },
  estadisticas: { section: 'estadisticas', ...DARK_INSIGHT },
  analisis: {
    section: 'analisis',
    ...DARK_INSIGHT,
    active: '#c4b5fd',
    pillBg: 'rgba(167, 139, 250, 0.14)',
    pillBorder: 'rgba(167, 139, 250, 0.3)',
    pillShadow: '0 0 18px rgba(139, 92, 246, 0.14)',
  },
  ranking: {
    section: 'ranking',
    shellBg: 'rgba(15, 23, 42, 0.78)',
    shellBorder: 'rgba(251, 191, 36, 0.18)',
    shellShadow: '0 10px 32px rgba(0, 0, 0, 0.3)',
    inactive: 'rgba(255, 255, 255, 0.42)',
    active: '#fcd34d',
    pillBg: 'rgba(251, 191, 36, 0.14)',
    pillBorder: 'rgba(251, 191, 36, 0.32)',
    pillShadow: '0 0 18px rgba(245, 158, 11, 0.14)',
  },
  perfil: {
    section: 'perfil',
    shellBg: 'rgba(12, 18, 34, 0.82)',
    shellBorder: 'rgba(129, 140, 248, 0.22)',
    shellShadow: '0 10px 32px rgba(26, 17, 69, 0.35)',
    inactive: 'rgba(148, 163, 184, 0.85)',
    active: '#a5b4fc',
    pillBg: 'rgba(99, 102, 241, 0.16)',
    pillBorder: 'rgba(129, 140, 248, 0.32)',
    pillShadow: '0 0 18px rgba(99, 102, 241, 0.16)',
  },
};

/** Sección activa según ruta — alinea fondo del nav al panel actual. */
export function resolveStudentNavSection(pathname: string | null): StudentNavSection {
  const path = pathname ?? '';
  if (path.includes('/curso')) return 'curso';
  if (path.includes('/clases')) return 'clases';
  if (path.includes('/perfil')) return 'perfil';
  if (path.includes('/ranking')) return 'ranking';
  if (path.includes('/analisis')) return 'analisis';
  if (path.includes('/estadisticas')) return 'estadisticas';
  return 'dashboard';
}

export function studentMobileNavTheme(pathname: string | null): StudentMobileNavTheme {
  return THEMES[resolveStudentNavSection(pathname)];
}

export function studentMobileNavThemeVars(
  theme: StudentMobileNavTheme,
): Record<string, string> {
  return {
    '--stn-shell-bg': theme.shellBg,
    '--stn-shell-border': theme.shellBorder,
    '--stn-shell-shadow': theme.shellShadow,
    '--stn-inactive': theme.inactive,
    '--stn-active': theme.active,
    '--stn-pill-bg': theme.pillBg,
    '--stn-pill-border': theme.pillBorder,
    '--stn-pill-shadow': theme.pillShadow,
  };
}
