import CotizacionSimulacroPdfLimitedPreview from '../ui-componentes/CotizacionSimulacroPdfLimitedPreview';
import { Pill } from '../ui-componentes/LandingPrimitives';
import { displaySerif } from '../content';
import type { LandingTone } from '../tipos';

const INSTITUTIONAL_PDF_URL =
  'https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/agGEs6YofJOwHDUZ_SESI%C3%93N1SIMULACROSG11-17GRATIS.pdf';

const INSTITUTIONAL_PDF_PAGES = [1, 2, 3, 11, 21, 30, 40, 41] as const;

type InstitutionalPdfPreviewSectionProps = {
  isLightLanding: boolean;
  bodyTitleClass: string;
  bodyMutedClass: string;
  bodySubtleClass: string;
  bodyCardClass: string;
  bodyPillSurface: 'light' | 'dark';
  landingTone: LandingTone;
  sectionClassName: string;
  onContactClick: () => void;
};

export function InstitutionalPdfPreviewSection({
  isLightLanding,
  bodyTitleClass,
  bodyMutedClass,
  bodySubtleClass,
  bodyCardClass,
  bodyPillSurface,
  landingTone,
  sectionClassName,
  onContactClick,
}: InstitutionalPdfPreviewSectionProps) {
  return (
    <section id="pdf-institucional" className={sectionClassName}>
      <div className="mx-auto w-full max-w-[min(80rem,100%)]">
        <div className="grid gap-7 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] xl:items-start xl:gap-10">
          <div className="max-w-3xl xl:max-w-none">
            <Pill surface={bodyPillSurface}>Entrega institucional</Pill>
            <h2 className={`${displaySerif} mt-5 text-pretty text-4xl font-medium tracking-tight ${bodyTitleClass} sm:text-5xl`}>
              Reporte listo para socializar.
            </h2>
            <p className={`mt-5 text-sm leading-relaxed sm:text-base ${bodyMutedClass}`}>
              Vista previa de las páginas clave que recibe una institución después del simulacro.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {INSTITUTIONAL_PDF_PAGES.map((page) => (
                <span
                  key={page}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    isLightLanding
                      ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
                      : 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100'
                  }`}
                >
                  Página {page}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={onContactClick}
              className={`mt-7 inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 ${
                isLightLanding
                  ? 'bg-slate-950 text-white hover:bg-black focus:ring-slate-400/40'
                  : 'bg-white text-slate-950 hover:bg-zinc-100 focus:ring-white/50'
              }`}
            >
              Cotizar entrega institucional
            </button>
            <p className={`mt-3 text-xs leading-relaxed ${bodySubtleClass}`}>
              Páginas seleccionadas: {INSTITUTIONAL_PDF_PAGES.join(', ')}.
            </p>
          </div>

          <div className={`min-w-0 overflow-hidden rounded-[1.75rem] p-2 sm:p-3 ${bodyCardClass}`}>
            <CotizacionSimulacroPdfLimitedPreview
              pdfUrl={INSTITUTIONAL_PDF_URL}
              pageNumbers={INSTITUTIONAL_PDF_PAGES}
              variant={landingTone}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
