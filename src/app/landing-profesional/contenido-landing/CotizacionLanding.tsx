'use client';

import '@/app/landing-profesional/landing-profesional.css';
import { COMPANY } from '@/bridge/legal/company';
import { LEGAL_FOOTER_LINKS } from '@/bridge/legal/documents';
import dynamic from 'next/dynamic';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import ChromaGrid from '@/app/landing-profesional/contenido-landing/ui-componentes/ChromaGrid';
import { LandingMobileBottomNav } from '@/app/landing-profesional/contenido-landing/ui-componentes/LandingMobileBottomNav';
import { LandingNavActions } from '@/app/landing-profesional/contenido-landing/ui-componentes/LandingNavActions';
import PillNav from '@/app/landing-profesional/contenido-landing/ui-componentes/PillNav';
import pillNavLogo from '@/app/landing-profesional/contenido-landing/pillNavLogo';
import {
  applyCotizLandingDocumentChrome,
  COTIZ_LANDING_THEME_LS_KEY,
  resetCotizLandingDocumentChrome,
} from '@/app/landing-profesional/contenido-landing/utilidades/cotizLandingDocChrome';
import {
  AGUAZUL_EVIDENCE_GROUP,
  AGUAZUL_EVIDENCE_ITEMS,
  AGUAZUL_FACEBOOK_POST_URL,
} from '@/app/landing-profesional/contenido-landing/datos-marketing/aguazulEvidence';
import { COTIZ_INSTITUTION_GALLERY_ITEMS } from '@/app/landing-profesional/contenido-landing/datos-marketing/institutionGalleryItems';
import { SmartQuoteCalculator, type SmartQuoteSalesOpen } from '@/app/landing-profesional/contenido-landing/ui-componentes/SmartQuoteCalculator';
import { SalesCoordinationModal } from '@/app/landing-profesional/contenido-landing/ventas-coordinacion/SalesCoordinationModal';
import {
  APA_LAST_CHECKED_LABEL,
  COTIZ_LANDING_NAV_LINKS,
  danielMediaMentions,
  displaySerif,
} from '@/app/landing-profesional/contenido-landing/content';
import type { LandingTone, SalesLeadKind } from '@/app/landing-profesional/contenido-landing/tipos';
import { logLandingReferenceModeOnce } from '@/app/landing-profesional/contenido-landing/utilidades/landingReferenceMode';
import { landingChrome } from '@/app/landing-profesional/contenido-landing/utilidades/landingChrome';
import { HeroInicioSection } from '@/app/landing-profesional/contenido-landing/secciones/HeroInicioSection';
import { FounderCompactSection } from '@/app/landing-profesional/contenido-landing/secciones/FounderCompactSection';
import { HowItWorksStrip } from '@/app/landing-profesional/contenido-landing/secciones/HowItWorksStrip';
import { CapabilityCards } from '@/app/landing-profesional/contenido-landing/secciones/CapabilityCards';
import { ProductVideoMosaic } from '@/app/landing-profesional/contenido-landing/secciones/ProductVideoMosaic';
import { FinalCtaSection } from '@/app/landing-profesional/contenido-landing/secciones/FinalCtaSection';

const ChapterSectionFallback = () => (
  <div className="mx-auto w-full max-w-[min(80rem,100%)] px-4 py-16">
    <div className="h-48 animate-pulse rounded-[32px] bg-slate-200/60 dark:bg-white/5" aria-hidden />
  </div>
);

const CircularGallery = dynamic(
  () => import('@/app/landing-profesional/contenido-landing/ui-componentes/CircularGallery'),
  { ssr: false, loading: ChapterSectionFallback },
);
const CasesSection = dynamic(
  () => import('@/app/landing-profesional/contenido-landing/secciones/CasesSection').then((m) => ({ default: m.CasesSection })),
  { loading: ChapterSectionFallback },
);
const ImpactSection = dynamic(
  () => import('@/app/landing-profesional/contenido-landing/secciones/ImpactSection').then((m) => ({ default: m.ImpactSection })),
  { ssr: false, loading: ChapterSectionFallback },
);
const InstitutionalPdfPreviewSection = dynamic(
  () => import('@/app/landing-profesional/contenido-landing/secciones/InstitutionalPdfPreviewSection').then((m) => ({ default: m.InstitutionalPdfPreviewSection })),
  { ssr: false, loading: ChapterSectionFallback },
);
const ScientificMethodSection = dynamic(
  () => import('@/app/landing-profesional/contenido-landing/secciones/ScientificMethodSection').then((m) => ({ default: m.ScientificMethodSection })),
  { loading: ChapterSectionFallback },
);
const PlatformTechStackSection = dynamic(
  () => import('@/app/landing-profesional/contenido-landing/secciones/PlatformTechStackSection').then((m) => ({ default: m.PlatformTechStackSection })),
  { loading: ChapterSectionFallback },
);
const FaqSection = dynamic(
  () => import('@/app/landing-profesional/contenido-landing/secciones/FaqSection').then((m) => ({ default: m.FaqSection })),
  { loading: ChapterSectionFallback },
);

const LANDING_CHAPTER_IDS = [
  'inicio',
  'metodo-pdf',
  'impacto-acumulado',
  'producto',
  'cotizacion',
  'recursos',
  'faq',
] as const;

type LandingChapterId = (typeof LANDING_CHAPTER_IDS)[number];

const DEFAULT_LANDING_CHAPTER: LandingChapterId = 'inicio';

const LANDING_CHAPTER_ALIASES: Record<string, LandingChapterId> = {
  'metodo-cientifico': 'metodo-pdf',
  'pdf-institucional': 'metodo-pdf',
  'casos-ejemplo': 'producto',
  acceso: 'producto',
  plataforma: 'producto',
  'coordinador-institucion': 'producto',
  precios: 'cotizacion',
  calculadora: 'cotizacion',
  'instituciones-aliadas': 'impacto-acumulado',
  'preguntas-frecuentes': 'faq',
  desarrollador: 'inicio',
};

function getLandingChapterFromHash(hash: string): LandingChapterId {
  const normalized = hash.replace(/^#/, '');
  const alias = LANDING_CHAPTER_ALIASES[normalized];
  if (alias) return alias;
  return LANDING_CHAPTER_IDS.includes(normalized as LandingChapterId)
    ? (normalized as LandingChapterId)
    : DEFAULT_LANDING_CHAPTER;
}

export default function CotizacionLanding() {
  const [salesModalPresetKind, setSalesModalPresetKind] = useState<SalesLeadKind | null>(null);
  const [salesModalVolumePreset, setSalesModalVolumePreset] = useState<{
    gradeCount: number;
    studentCount: number;
  } | null>(null);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState<LandingChapterId>(DEFAULT_LANDING_CHAPTER);
  const [landingTone, setLandingTone] = useState<LandingTone>('light');

  const openSalesModal = (preset?: SalesLeadKind | SmartQuoteSalesOpen) => {
    if (!preset) {
      setSalesModalPresetKind(null);
      setSalesModalVolumePreset(null);
    } else if (typeof preset === 'string') {
      setSalesModalPresetKind(preset);
      setSalesModalVolumePreset(null);
    } else {
      setSalesModalPresetKind(preset.kind);
      setSalesModalVolumePreset(
        preset.gradeCount != null && preset.studentCount != null
          ? { gradeCount: preset.gradeCount, studentCount: preset.studentCount }
          : null,
      );
    }
    setSalesModalOpen(true);
  };

  const scrollLandingToHash = (hash: string) => {
    if (typeof window === 'undefined') return;
    const targetId = hash.replace(/^#/, '');
    const tryScroll = (attempt = 0) => {
      const el = targetId ? document.getElementById(targetId) : null;
      if (el) {
        el.scrollIntoView({ behavior: attempt === 0 ? 'smooth' : 'auto', block: 'start' });
        return;
      }
      if (attempt < 12) {
        requestAnimationFrame(() => tryScroll(attempt + 1));
        return;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    tryScroll();
  };

  const navigateToChapter = (href: string) => {
    const raw = href.replace(/^#/, '');
    const nextChapter = getLandingChapterFromHash(href);
    const nextHash = raw ? `#${raw}` : `#${nextChapter}`;
    setActiveChapter(nextChapter);
    if (typeof window === 'undefined') return;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', nextHash);
    }
    scrollLandingToHash(nextHash);
  };

  const persistTone = (next: LandingTone) => {
    setLandingTone(next);
    try {
      window.localStorage.setItem(COTIZ_LANDING_THEME_LS_KEY, next);
    } catch {
      //
    }
  };

  useLayoutEffect(() => {
    applyCotizLandingDocumentChrome(landingTone);
  }, [landingTone]);

  useLayoutEffect(() => {
    return () => resetCotizLandingDocumentChrome();
  }, []);

  useEffect(() => {
    logLandingReferenceModeOnce();
    try {
      const savedTone = window.localStorage.getItem(COTIZ_LANDING_THEME_LS_KEY);
      if (savedTone === 'light' || savedTone === 'dark') {
        setLandingTone(savedTone);
      }
    } catch {
      /* ignore */
    }

    const syncChapterFromLocation = () => {
      setActiveChapter(getLandingChapterFromHash(window.location.hash));
    };
    syncChapterFromLocation();
    window.addEventListener('hashchange', syncChapterFromLocation);
    window.addEventListener('popstate', syncChapterFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncChapterFromLocation);
      window.removeEventListener('popstate', syncChapterFromLocation);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.id;
        if (id && LANDING_CHAPTER_IDS.includes(id as LandingChapterId)) {
          setActiveChapter(id as LandingChapterId);
        }
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: [0.12, 0.28] },
    );
    LANDING_CHAPTER_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const isLightLanding = landingTone === 'light';
  const chrome = landingChrome(isLightLanding);
  const bodyTitleClass = chrome.title;
  const bodyMutedClass = chrome.muted;
  const bodySubtleClass = chrome.subtle;
  const bodyCardClass = chrome.card;
  const bodyPillSurface = chrome.pill;
  const footerLinkClass = isLightLanding ? 'transition hover:text-slate-950' : 'transition hover:text-white';

  return (
    <main
      data-cotiz-landing-theme={landingTone}
      className={`cotiz-landing-scope relative isolate min-h-dvh overflow-x-hidden pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] font-[family-name:var(--font-cotiz-sans),Montserrat,ui-sans-serif,sans-serif] antialiased xl:pb-[env(safe-area-inset-bottom,0px)] ${
        isLightLanding ? 'selection:bg-[#CC0000]/15' : 'selection:bg-white/20'
      }`}
    >
      <div className="cotiz-landing-nav-chrome pointer-events-none sticky top-0 z-[60] w-full overflow-visible [&>*]:pointer-events-auto">
        <div className="cotiz-landing-nav-chrome__inner relative mx-auto w-full max-w-[min(80rem,100%)] px-[clamp(0.75rem,3vw,1.25rem)]">
          <PillNav
            logo={pillNavLogo}
            logoAlt="Seamos Genios"
            ease="power2.easeOut"
            activeHref={`#${activeChapter}`}
            items={COTIZ_LANDING_NAV_LINKS.map(({ href, label }) => ({
              href,
              label,
              onClick: (event) => {
                event.preventDefault();
                navigateToChapter(href);
              },
            }))}
            onLogoClick={(event) => {
              event.preventDefault();
              navigateToChapter('#inicio');
            }}
            className={
              isLightLanding
                ? 'border-[rgba(130,96,75,0.16)] bg-white/90 text-slate-950 shadow-[0_8px_30px_rgba(15,23,42,0.06)]'
                : 'border-white/10 bg-[#1A1A1A]/70 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl'
            }
            baseColor={isLightLanding ? '#ffffff' : '#1A1A1A'}
            pillColor="#CC0000"
            pillTextColor="#ffffff"
            hoveredPillTextColor={isLightLanding ? '#0f172a' : '#ffffff'}
            desktopActionSlot={
              <LandingNavActions
                variant="desktop"
                tone={isLightLanding ? 'light' : 'dark'}
                onToggleTone={() => persistTone(isLightLanding ? 'dark' : 'light')}
                onContactSales={() => openSalesModal()}
              />
            }
            mobileToolbarSlot={
              <LandingNavActions
                variant="toolbar"
                tone={isLightLanding ? 'light' : 'dark'}
                onToggleTone={() => persistTone(isLightLanding ? 'dark' : 'light')}
                onContactSales={() => openSalesModal()}
              />
            }
          />
        </div>
      </div>

      <HeroInicioSection
        isLightLanding={isLightLanding}
        onQuote={() => navigateToChapter('#cotizacion')}
      />
      <FounderCompactSection isLightLanding={isLightLanding} onContact={() => openSalesModal('institution')} />

      <div id="metodo-pdf" className={chrome.section}>
        <HowItWorksStrip isLightLanding={isLightLanding} />
        <ScientificMethodSection
          isLightLanding={isLightLanding}
          bodyPillSurface={bodyPillSurface}
          bodyTitleClass={bodyTitleClass}
          bodyMutedClass={bodyMutedClass}
          bodySubtleClass={bodySubtleClass}
          landingTone={landingTone}
        />
        <InstitutionalPdfPreviewSection
          isLightLanding={isLightLanding}
          bodyTitleClass={bodyTitleClass}
          bodyMutedClass={bodyMutedClass}
          bodySubtleClass={bodySubtleClass}
          bodyCardClass={bodyCardClass}
          bodyPillSurface={bodyPillSurface}
          landingTone={landingTone}
          sectionClassName="mt-12"
          onContactClick={() => openSalesModal('institution')}
        />
      </div>

      <ImpactSection
        isLightLanding={isLightLanding}
        bodyTitleClass={bodyTitleClass}
        bodyMutedClass={bodyMutedClass}
        bodySubtleClass={bodySubtleClass}
        landingTone={landingTone}
      />

      <section
        className={`${chrome.section} mx-auto w-full`}
        id="instituciones-aliadas"
        aria-labelledby="instituciones-aliadas-title"
      >
        <div className="mx-auto mb-6 w-full max-w-[min(80rem,100%)]">
          <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>Instituciones aliadas</p>
          <h2
            id="instituciones-aliadas-title"
            className={`${displaySerif} mt-3 max-w-3xl text-[clamp(1.5rem,3vw,2.1rem)] font-bold tracking-[-0.03em] ${chrome.title}`}
          >
            Colegios que ya están en la cobertura.
          </h2>
        </div>
        <div
          className={`cotiz-institution-gallery-host relative mx-auto h-[clamp(16rem,52vw,28rem)] w-full max-w-[min(75rem,calc(100%-2rem))] overflow-hidden ${chrome.card}`}
          style={{ borderRadius: 32 }}
        >
          <CircularGallery
            items={COTIZ_INSTITUTION_GALLERY_ITEMS}
            bend={1.45}
            borderRadius={0.05}
            scrollEase={0.08}
            scrollSpeed={3.2}
            textColor={isLightLanding ? '#0f172a' : '#ffffff'}
          />
        </div>
        <div className={`eg-card mx-auto mt-8 w-full max-w-[min(75rem,100%)] p-[clamp(1rem,3vw,1.5rem)] ${chrome.card}`}>
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <div className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[16px] border bg-white p-3 sm:h-24 sm:w-24`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={AGUAZUL_EVIDENCE_GROUP.logo}
                  alt={`Logo ${AGUAZUL_EVIDENCE_GROUP.institution}`}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="min-w-0">
                <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>Caso documentado</p>
                <h3 className={`${displaySerif} mt-2 text-[clamp(1.35rem,2.4vw,1.85rem)] font-bold ${chrome.title}`}>
                  {AGUAZUL_EVIDENCE_GROUP.institution}
                </h3>
                <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${chrome.muted}`}>
                  Evidencia pública agrupada por institución y simulacro.
                </p>
              </div>
            </div>
            <a
              href={AGUAZUL_FACEBOOK_POST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="eg-cta inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#CC0000] px-5 text-sm font-semibold text-white"
            >
              Ver más
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <div className="relative min-h-[clamp(28rem,52vw,36rem)]">
            <ChromaGrid items={AGUAZUL_EVIDENCE_ITEMS} radius={300} damping={0.45} fadeOut={0.6} ease="power3.out" />
          </div>
        </div>
      </section>

      <div id="producto" className={chrome.section}>
        <CapabilityCards isLightLanding={isLightLanding} />
        <CasesSection isLightLanding={isLightLanding} />
        <ProductVideoMosaic isLightLanding={isLightLanding} />
      </div>

      <div id="cotizacion">
        <SmartQuoteCalculator isLightLanding={isLightLanding} onCoordinate={openSalesModal} />
      </div>

      <section id="recursos" className={`${chrome.section} mx-auto w-full max-w-[min(80rem,100%)]`}>
        <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>Documentación</p>
        <h2 className={`${displaySerif} mt-3 max-w-2xl text-[clamp(1.6rem,3vw,2.25rem)] font-bold tracking-[-0.03em] ${chrome.title}`}>
          Recursos y evidencia pública.
        </h2>
        <div className="mt-8 max-w-[760px]">
          <PlatformTechStackSection isLightLanding={isLightLanding} />
          <details className={`group mt-8 p-5 sm:p-6 ${chrome.card}`} style={{ borderRadius: 16 }}>
            <summary className={`flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden ${chrome.title}`}>
              <span>
                <span className={`block text-[11px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>APA 7</span>
                <span className={`${displaySerif} mt-1 block text-xl font-bold`}>Lista de referencias</span>
              </span>
              <span className={`text-xs ${chrome.subtle}`}>Verificado {APA_LAST_CHECKED_LABEL}</span>
            </summary>
            <ol className={`mt-5 space-y-4 text-sm leading-relaxed ${chrome.muted}`}>
              {danielMediaMentions.map((mention) => (
                <li key={mention.href} className="pl-6 -indent-6">
                  <span>{mention.apaReference} </span>
                  <a
                    href={mention.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`break-all underline decoration-1 underline-offset-4 ${isLightLanding ? 'text-slate-950' : 'text-white'}`}
                  >
                    {mention.href}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        </div>
      </section>

      <FaqSection
        isLightLanding={isLightLanding}
        bodyTitleClass={bodyTitleClass}
        bodyMutedClass={bodyMutedClass}
        bodySubtleClass={bodySubtleClass}
        bodyCardClass={bodyCardClass}
        bodyPillSurface={bodyPillSurface}
        landingTone={landingTone}
        sectionClassName={chrome.section}
        onContactClick={() => openSalesModal()}
      />

      <FinalCtaSection isLightLanding={isLightLanding} onQuote={() => navigateToChapter('#cotizacion')} />

      <footer className={`${chrome.section} mx-auto w-full max-w-[min(80rem,100%)]`}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-8">
          <div>
            <span className={`text-sm font-semibold tracking-tight ${chrome.title}`}>SEAMOSGENIOS</span>
            <p className={`mt-4 text-sm leading-relaxed ${chrome.subtle}`}>
              Simulacros tipo ICFES con retro en vivo y paneles de lectura.
            </p>
          </div>
          <div>
            <h3 className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>Propuesta</h3>
            <ul className={`mt-4 space-y-2 text-sm ${chrome.muted}`}>
              {COTIZ_LANDING_NAV_LINKS.map(({ href, label }) => (
                <li key={`footer-${href}`}>
                  <a
                    href={href}
                    className={footerLinkClass}
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToChapter(href);
                    }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>Plataforma</h3>
            <ul className={`mt-4 space-y-2 text-sm ${chrome.muted}`}>
              <li>
                <a href="/login" className={footerLinkClass}>
                  Ingresar
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>Contacto</h3>
            <ul className={`mt-4 space-y-2 text-sm ${chrome.muted}`}>
              <li>
                <button type="button" onClick={() => openSalesModal('institution')} className={`text-left ${footerLinkClass}`}>
                  WhatsApp instituciones
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openSalesModal('individual')} className={`text-left ${footerLinkClass}`}>
                  WhatsApp individual
                </button>
              </li>
            </ul>
          </div>
        </div>
        <nav className="mt-10 border-t pt-6 text-sm" aria-label="Documentos legales">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGAL_FOOTER_LINKS.map((link) => (
              <li key={link.slug}>
                <a href={link.path} className={footerLinkClass}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <p className={`mt-4 text-sm ${isLightLanding ? 'text-slate-700' : 'text-white'}`}>© {new Date().getFullYear()} {COMPANY.legalName} · NIT {COMPANY.nit} · {COMPANY.city}</p>
      </footer>

      <LandingMobileBottomNav
        activeChapter={activeChapter}
        tone={isLightLanding ? 'light' : 'dark'}
        onNavigate={navigateToChapter}
      />

      {salesModalOpen ? (
        <SalesCoordinationModal
          key={`${salesModalPresetKind ?? 'chooser'}-${salesModalVolumePreset?.gradeCount ?? ''}-${salesModalVolumePreset?.studentCount ?? ''}`}
          presetKind={salesModalPresetKind}
          presetVolume={salesModalVolumePreset}
          onClose={() => setSalesModalOpen(false)}
        />
      ) : null}
    </main>
  );
}
