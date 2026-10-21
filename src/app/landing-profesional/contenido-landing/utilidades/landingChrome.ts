export function landingChrome(isLight: boolean) {
  return {
    section: `scroll-mt-[var(--cotiz-mhdr-offset,4.5rem)] border-t px-[clamp(1rem,3vw,2.5rem)] py-[clamp(2.5rem,6vw,4.5rem)] sm:scroll-mt-28 ${
      isLight ? 'border-[rgba(130,96,75,0.16)]' : 'border-white/16'
    }`,
    title: isLight ? 'text-slate-950' : 'text-white',
    muted: isLight ? 'text-slate-600' : 'text-white/55',
    subtle: isLight ? 'text-slate-500' : 'text-white/45',
    card: isLight
      ? 'border border-[rgba(130,96,75,0.16)] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]'
      : 'border border-white/16 bg-white/[0.035] shadow-[0_8px_30px_rgba(0,0,0,0.35)]',
    eyebrow: isLight ? 'text-slate-500' : 'text-white/45',
    pill: isLight ? 'light' : 'dark',
  } as const;
}
