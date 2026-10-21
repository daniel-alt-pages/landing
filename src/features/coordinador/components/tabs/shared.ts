// Shared design tokens and utilities for coordinator tabs

export const T = {
    surface: 'bg-[#111827]',
    surfaceEl: 'bg-[#1e293b]',
    border: 'border-white/[0.08]',
    card: 'bg-[#111827] border border-white/[0.08] rounded-2xl',
    cardHover: 'hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300',
};

export const clasificarNivel = (p: number) => {
    if (p >= 400) return { nivel: 'Superior', color: '#10b981', badge: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20' };
    if (p >= 325) return { nivel: 'Alto', color: '#3b82f6', badge: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20' };
    if (p >= 250) return { nivel: 'Medio', color: '#f59e0b', badge: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20' };
    return { nivel: 'Bajo', color: '#ef4444', badge: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20' };
};
