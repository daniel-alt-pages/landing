'use client';

import { Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type PlatformVideoEmbedProps = {
  title: string;
  prismicVideoUrl?: string;
  youtubeId?: string;
};

function buildYoutubeCinemaEmbedSrc(videoId: string) {
  const id = videoId.trim();
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: id,
    controls: '0',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    cc_load_policy: '0',
    vq: 'hd720',
  });

  if (typeof window !== 'undefined') {
    params.set('origin', window.location.origin);
  }

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
}

function youtubePosterUrl(videoId: string, quality: 'maxresdefault' | 'hqdefault') {
  const id = videoId.trim();
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${quality}.jpg`;
}

export function PlatformVideoEmbed({ title, prismicVideoUrl, youtubeId }: PlatformVideoEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userActivated, setUserActivated] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  if (prismicVideoUrl) {
    if (!userActivated) {
      return (
        <button
          type="button"
          className="relative flex h-full w-full items-center justify-center bg-black"
          onClick={() => setUserActivated(true)}
          aria-label={`Reproducir ${title}`}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900">
            <Play className="h-4 w-4" aria-hidden />
            Reproducir
          </span>
        </button>
      );
    }

    return (
      <video
        className="h-full w-full object-cover"
        src={prismicVideoUrl}
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        controls={false}
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        preload="metadata"
        aria-label={title}
      />
    );
  }

  if (!youtubeId?.trim()) return null;

  const id = youtubeId.trim();
  const showIframe = userActivated;

  return (
    <div ref={containerRef} className="cotiz-platform-video-shell relative h-full w-full overflow-hidden bg-black">
      {!showIframe ? (
        <button
          type="button"
          className="group relative h-full w-full"
          onClick={() => setUserActivated(true)}
          aria-label={`Reproducir video: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={youtubePosterUrl(id, 'maxresdefault')}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              const image = event.currentTarget;
              if (!image.src.includes('hqdefault')) {
                image.src = youtubePosterUrl(id, 'hqdefault');
              }
            }}
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg">
              <Play className="h-6 w-6" aria-hidden />
            </span>
          </span>
        </button>
      ) : (
        <iframe
          className="absolute inset-0 h-full w-full border-0"
          src={buildYoutubeCinemaEmbedSrc(id)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      )}
    </div>
  );
}
