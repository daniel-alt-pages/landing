'use client';

import { DriveRecordingBrowseDemo } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-drive/DriveRecordingBrowseDemo';
import { StudentPanelBrowseDemo } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/StudentPanelBrowseDemo';
import type { MethodShowcaseItem } from '@/app/landing-profesional/contenido-landing/content';

type MethodShowcaseSlideProps = {
  item: MethodShowcaseItem;
  isLightLanding: boolean;
  /** featured = ancho completo; carousel = tarjeta; card = interior del carrusel 3D */
  layout?: 'featured' | 'carousel' | 'card';
};

function slideShell(isLightLanding: boolean, className = '') {
  return `flex w-full flex-col overflow-hidden rounded-2xl border shadow-lg ${className} ${
    isLightLanding
      ? 'border-slate-200/90 bg-white/95 text-slate-800 shadow-slate-900/8'
      : 'border-white/[0.12] bg-white/[0.04] text-white/85 shadow-black/25'
  }`;
}

function buildYoutubeEmbedSrc(videoId: string) {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });
  if (typeof window !== 'undefined') {
    params.set('origin', window.location.origin);
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId.trim())}?${params.toString()}`;
}

function VideoCaption({
  label,
  isLightLanding,
  overlay,
}: {
  label: string;
  isLightLanding: boolean;
  overlay: boolean;
}) {
  if (overlay) {
    return (
      <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pb-3 pt-8 text-center text-sm font-semibold text-white">
        {label}
      </p>
    );
  }

  return (
    <p
      className={`border-t px-3 py-2.5 text-center text-sm font-semibold sm:px-4 sm:py-3 ${
        isLightLanding ? 'border-slate-200/80 text-slate-800' : 'border-white/10 text-white/90'
      }`}
    >
      {label}
    </p>
  );
}

export function MethodShowcaseSlide({ item, isLightLanding, layout = 'carousel' }: MethodShowcaseSlideProps) {
  const isFeatured = layout === 'featured';
  const isCard = layout === 'card';
  const videoFrameClass = isFeatured
    ? 'relative aspect-video min-h-[14rem] w-full bg-black sm:min-h-[18rem] lg:min-h-[22rem]'
    : isCard
      ? 'relative h-full min-h-0 w-full bg-slate-100'
      : 'relative aspect-video min-h-[10rem] w-full bg-black sm:min-h-[12rem]';

  if (item.type === 'label' && isCard && item.panelDemo) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-0.5 sm:p-1" data-no-carousel-drag>
        <StudentPanelBrowseDemo className="h-full min-h-0 w-full" />
      </div>
    );
  }

  if (item.type === 'label' && isCard) {
    return null;
  }

  if (item.type === 'label') {
    return (
      <div
        className={`${slideShell(isLightLanding)} min-h-[6.5rem] items-center justify-center px-4 py-5 text-center sm:min-h-[7rem] sm:px-5`}
      >
        <p className="text-sm font-semibold leading-snug sm:text-base">{item.label}</p>
        {item.hint ? (
          <p className={`mt-1.5 text-[11px] sm:text-xs ${isLightLanding ? 'text-slate-500' : 'text-white/45'}`}>
            {item.hint}
          </p>
        ) : null}
      </div>
    );
  }

  const captionOverlay = isFeatured;

  if (isCard && item.type === 'drive-embed' && item.browseDemo) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col p-2 sm:p-3">
        <DriveRecordingBrowseDemo
          driveFileId={item.driveFileId}
          recordingLabel={item.recordingFileName ?? item.label}
          className="h-full min-h-0 w-full"
        />
      </div>
    );
  }

  if (isCard && item.type === 'drive-embed') {
    const embedSrc = `https://drive.google.com/file/d/${item.driveFileId}/preview`;
    return (
      <div className="cotiz-drive-embed-shell flex h-full min-h-0 w-full flex-col p-2 sm:p-3">
        <div className="relative h-full min-h-0 flex-1 overflow-hidden rounded-xl bg-[#202124]">
          <iframe
            className="absolute inset-0 h-full w-full border-0"
            src={embedSrc}
            title={item.label}
            allow="autoplay; encrypted-media"
            loading="lazy"
          />
          <div
            className="cotiz-drive-embed-chrome-mask pointer-events-none absolute right-0 top-0 z-10 h-12 w-14 bg-[#202124]"
            aria-hidden
          />
        </div>
      </div>
    );
  }

  if (item.type === 'hosted-video') {
    if (item.prismicVideoUrl) {
      return (
        <article className={slideShell(isLightLanding)}>
          <div className={videoFrameClass}>
            <video
              className="absolute inset-0 h-full w-full object-contain"
              src={item.prismicVideoUrl}
              controls
              playsInline
              preload="metadata"
              aria-label={item.label}
            />
            {captionOverlay ? <VideoCaption label={item.label} isLightLanding={isLightLanding} overlay /> : null}
          </div>
          {!captionOverlay ? <VideoCaption label={item.label} isLightLanding={isLightLanding} overlay={false} /> : null}
        </article>
      );
    }

    if (item.youtubeId?.trim()) {
      return (
        <article className={slideShell(isLightLanding)}>
          <div className={videoFrameClass}>
            <iframe
              className="absolute inset-0 h-full w-full border-0"
              src={buildYoutubeEmbedSrc(item.youtubeId)}
              title={item.label}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen={!isFeatured}
              loading="lazy"
            />
            {captionOverlay ? <VideoCaption label={item.label} isLightLanding={isLightLanding} overlay /> : null}
          </div>
          {!captionOverlay ? <VideoCaption label={item.label} isLightLanding={isLightLanding} overlay={false} /> : null}
        </article>
      );
    }

    return null;
  }

  const embedSrc = `https://drive.google.com/file/d/${item.driveFileId}/preview`;

  return (
    <article className={slideShell(isLightLanding)}>
      <div className={`cotiz-drive-embed-shell overflow-hidden bg-[#202124] ${videoFrameClass}`}>
        <iframe
          className="absolute inset-0 h-full w-full border-0"
          src={embedSrc}
          title={item.label}
          allow="autoplay; encrypted-media"
          loading="lazy"
        />
        <div
          className="cotiz-drive-embed-chrome-mask pointer-events-auto absolute right-0 top-0 z-10 h-12 w-14 bg-[#202124]"
          aria-hidden
        />
        {captionOverlay ? <VideoCaption label={item.label} isLightLanding={isLightLanding} overlay /> : null}
      </div>
      {!captionOverlay ? <VideoCaption label={item.label} isLightLanding={isLightLanding} overlay={false} /> : null}
    </article>
  );
}
