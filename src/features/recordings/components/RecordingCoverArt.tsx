'use client';

import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image';
import { Clapperboard, Crown, Play } from 'lucide-react';
import {
  formatRecordingDate,
  recordingAreaLabel,
  recordingCoverBadge,
  recordingCoverFooterLine,
  recordingDisplayTitle,
  type RecordingsCatalogMode,
} from '@features/recordings/lib/recordingsCatalog';
import {
  COVER_CANVAS_H,
  COVER_CANVAS_W,
  COVER_PATTERN_STYLES,
  type CoverFloater,
  recordingCoverFloaters,
  recordingCoverPattern,
  recordingCoverWatermarkIcon,
} from '@features/recordings/lib/recordingCoverDecor';
import { recordingCoverTags } from '@features/recordings/lib/recordingCoverTags';
import { recordingMascotSrc } from '@features/recordings/lib/recordingMascots';
import { sgAreaColor } from '@shared/lib/sgAreaColors';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';

export type RecordingCoverVariant = 'thumb' | 'banner' | 'hero';

type RecordingCoverArtProps = {
  recording: SimRecording;
  variant?: RecordingCoverVariant;
  simulationId?: string;
  showPlay?: boolean;
  catalogMode?: RecordingsCatalogMode;
  className?: string;
};

const DOT_GRID =
  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.11) 1px, transparent 0)';

const DOT_GRID_SOFT =
  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)';

const CANVAS_SCALE = `scale(calc(100cqw / ${COVER_CANVAS_W}px))`;

/** Tipografía y panel — px fijos sobre lienzo 640×360 (sin variantes). */
const COPY_PANEL = {
  left: 28,
  top: 22,
  width: 352,
  padX: 18,
  padY: 16,
  badge: 50,
  badgeFont: 26,
  head: 50,
  sub: 19,
  lineW: 200,
  lineH: 3,
} as const;

function coverShellStyle(hex: string): CSSProperties {
  return {
    background: `linear-gradient(165deg, #12121a 0%, #060608 42%, #08060c 100%)`,
    boxShadow: [
      `inset 0 1px 0 rgba(255,255,255,0.14)`,
      `inset 0 -1px 0 ${hex}33`,
      `0 0 0 1px rgba(255,255,255,0.07)`,
      `0 18px 48px -12px ${hex}44`,
      `0 8px 28px rgba(0,0,0,0.55)`,
    ].join(', '),
  };
}

function coverFrameClass(): string {
  return 'aspect-video w-full max-w-full min-h-0 shrink-0 [container-type:inline-size]';
}

function CoverTitleCopy({
  areaLabel,
  dateLine,
  sessionBadge,
  hex,
  titleStyle = 'default',
}: {
  areaLabel: string;
  dateLine: string;
  sessionBadge: string;
  hex: string;
  titleStyle?: 'default' | 'black-gradient';
}) {
  const areaUpper = areaLabel.toUpperCase();
  const dateUpper = dateLine.toUpperCase();
  const p = COPY_PANEL;
  const blackGradientTitle: CSSProperties =
    titleStyle === 'black-gradient'
      ? {
          background: 'linear-gradient(180deg, #ffffff 0%, #a3a3a3 38%, #262626 72%, #000000 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))',
        }
      : {
          textShadow: '0 4px 24px rgba(0,0,0,0.85)',
        };

  return (
    <div
      className="absolute z-[3] overflow-hidden rounded-xl border border-white/[0.18]"
      style={{
        left: p.left,
        top: p.top,
        width: p.width,
        padding: `${p.padY}px ${p.padX}px`,
        backgroundColor: 'rgba(0,0,0,0.24)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 24px rgba(0,0,0,0.28)`,
      }}
    >
      <span
        className="mb-3 flex items-center justify-center rounded-full border border-white/15 font-black text-white"
        style={{
          width: p.badge,
          height: p.badge,
          fontSize: p.badgeFont,
          backgroundColor: 'rgba(0,0,0,0.55)',
          boxShadow: `0 0 18px ${hex}55`,
        }}
        aria-hidden
      >
        {sessionBadge}
      </span>

      <h3
        className="font-black uppercase leading-[0.88] tracking-tight text-white"
        style={{
          fontSize: p.head,
          ...blackGradientTitle,
        }}
      >
        <span className="block">Grabación</span>
        <span className="block">de la clase</span>
      </h3>

      <div
        className="rounded-full"
        style={{
          marginTop: 12,
          marginBottom: 12,
          width: p.lineW,
          height: p.lineH,
          background: `linear-gradient(90deg, ${hex}, ${hex}99, transparent)`,
          boxShadow: `0 0 14px ${hex}88`,
        }}
        aria-hidden
      />

      <p
        className="font-bold uppercase leading-tight tracking-wide text-white"
        style={{ fontSize: p.sub, textShadow: '0 2px 14px rgba(0,0,0,0.8)' }}
      >
        <span className="block">{areaUpper}</span>
        {dateUpper ? <span className="mt-1 block text-white/90">{dateUpper}</span> : null}
      </p>
    </div>
  );
}

function tagPositionsPx(variant: RecordingCoverVariant): Array<{ x: number; y: number; rotate: number }> {
  if (variant === 'thumb') {
    return [
      { x: 458, y: 28, rotate: -6 },
      { x: 478, y: 108, rotate: 4 },
    ];
  }
  return [
    { x: 332, y: 38, rotate: -8 },
    { x: 296, y: 88, rotate: 5 },
    { x: 436, y: 62, rotate: -3 },
  ];
}

function CoverCanvas({ children }: { children: ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-[2] origin-top-left"
      style={{
        width: COVER_CANVAS_W,
        height: COVER_CANVAS_H,
        transform: CANVAS_SCALE,
      }}
    >
      {children}
    </div>
  );
}

function FloaterNode({ item, hex }: { item: CoverFloater; hex: string }) {
  const baseStyle: CSSProperties = {
    left: item.x,
    top: item.y,
    transform: `rotate(${item.rotate}deg)`,
    opacity: item.opacity,
  };

  if (item.kind === 'icon') {
    const { Icon, size } = item;
    return (
      <span className="absolute z-[2]" style={baseStyle} aria-hidden>
        <Icon
          width={size}
          height={size}
          strokeWidth={1.75}
          style={{ color: hex, filter: `drop-shadow(0 0 8px ${hex}bb)` }}
        />
      </span>
    );
  }

  const iconSize = item.iconSize ?? Math.round(item.size * 0.42);
  return (
    <span
      className="absolute z-[2] flex items-center justify-center rounded-full border font-mono font-bold text-white/90 backdrop-blur-md"
      style={{
        ...baseStyle,
        width: item.size,
        height: item.size,
        borderColor: `${hex}66`,
        backgroundColor: `${hex}28`,
        boxShadow: `0 6px 20px ${hex}44, inset 0 1px 0 rgba(255,255,255,0.18)`,
        fontSize: item.label && item.label.length <= 3 ? 11 : 9,
        letterSpacing: '-0.02em',
      }}
      aria-hidden
    >
      {item.label ? (
        item.label
      ) : item.Icon ? (
        <item.Icon width={iconSize} height={iconSize} strokeWidth={2} style={{ color: hex }} />
      ) : null}
    </span>
  );
}

export default function RecordingCoverArt({
  recording,
  variant = 'banner',
  simulationId,
  showPlay = false,
  catalogMode = 'simulation',
  className = '',
}: RecordingCoverArtProps) {
  const area =
    recording.area === 'plataforma'
      ? { ...sgAreaColor('inglés'), hex: '#64748b' }
      : sgAreaColor(recording.area);
  const WatermarkIcon = recordingCoverWatermarkIcon(recording.area);
  const patternKind = recordingCoverPattern(recording.area);
  const patternStyle = COVER_PATTERN_STYLES[patternKind];
  const floaters = recordingCoverFloaters(recording.area, variant === 'thumb');
  const hideMascot = Boolean(recording.coverHideMascot);
  const titleStyle = recording.coverTitleStyle ?? 'default';
  const mascotSrc = recordingMascotSrc(recording.area);
  const title = recordingDisplayTitle(recording);
  const areaLabel = recordingAreaLabel(recording.area);
  const footerLine = recordingCoverFooterLine(recording, catalogMode);
  const tags = recordingCoverTags(recording.area).slice(0, variant === 'thumb' ? 2 : 3);
  const positions = tagPositionsPx(variant);
  const isThumb = variant === 'thumb';
  const isHero = variant === 'hero';
  const dateLine = recording.recordedAt ? formatRecordingDate(recording.recordedAt) : '';
  const sessionBadge = recordingCoverBadge(recording, catalogMode);

  return (
    <div
      className={`group/cover relative overflow-hidden rounded-2xl border border-white/[0.06] ${coverFrameClass()} ${className}`}
      style={coverShellStyle(area.hex)}
      aria-label={title}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{ backgroundImage: DOT_GRID, backgroundSize: '12px 12px' }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay"
        style={{ backgroundImage: DOT_GRID_SOFT, backgroundSize: '24px 24px' }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-soft-light" style={patternStyle} />

      <div
        className="pointer-events-none absolute inset-x-[-20%] bottom-[-45%] z-[0] h-[85%] rounded-[50%] blur-[48px]"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 100%, ${area.hex} 0%, ${area.hex}bb 28%, ${area.hex}66 48%, transparent 72%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[0] h-[62%]"
        style={{
          background: `linear-gradient(to top, ${area.hex}88 0%, ${area.hex}55 22%, ${area.hex}28 45%, transparent 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[28%]"
        style={{
          background: `linear-gradient(to top, ${area.hex}aa 0%, ${area.hex}44 55%, transparent 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[-15%] right-[-8%] z-[0] h-[75%] w-[55%] rounded-full blur-[40px]"
        style={{
          background: `radial-gradient(circle, ${area.hex}77 0%, ${area.hex}33 45%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute left-[-5%] top-[18%] z-[0] h-[55%] w-[50%] rounded-full blur-[36px]"
        style={{
          background: `radial-gradient(circle, ${area.hex}44 0%, transparent 68%)`,
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/10 to-black/20" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-tr from-white/[0.07] via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_80%_20%,rgba(255,255,255,0.06),transparent_50%)]" />

      <CoverCanvas>
        <div className="relative h-full w-full">
          <div className="pointer-events-none absolute z-[1]" style={{ left: -4, top: 0 }} aria-hidden>
            <WatermarkIcon
              width={88}
              height={88}
              strokeWidth={1.25}
              style={{ color: area.hex, opacity: 0.18 }}
            />
          </div>

          {floaters.map((item, i) => (
            <FloaterNode key={`${recording.area}-floater-${i}`} item={item} hex={area.hex} />
          ))}

          {!isThumb ? (
            <div className="absolute right-2.5 top-2.5 z-[4] flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200 backdrop-blur-md">
                <Crown width={12} height={12} aria-hidden />
                Premium
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md"
                style={{
                  borderColor: `${area.hex}44`,
                  backgroundColor: `${area.hex}18`,
                  color: `${area.hex}ee`,
                }}
              >
                <Clapperboard width={10} height={10} aria-hidden />
                Retro en vivo
              </span>
            </div>
          ) : null}

          <CoverTitleCopy
            areaLabel={areaLabel}
            dateLine={dateLine}
            sessionBadge={sessionBadge}
            hex={area.hex}
            titleStyle={titleStyle}
          />

          {tags.map((tag, i) => {
            const pos = positions[i];
            if (!pos) return null;
            return (
              <span
                key={tag}
                className="pointer-events-none absolute z-[2] rounded-lg border px-2 py-1 font-mono text-[10px] text-white/90 backdrop-blur-md shadow-lg"
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: `rotate(${pos.rotate}deg)`,
                  borderColor: `${area.hex}55`,
                  backgroundColor: `${area.hex}22`,
                  boxShadow: `0 4px 16px ${area.hex}33, inset 0 1px 0 rgba(255,255,255,0.12)`,
                }}
              >
                {tag}
              </span>
            );
          })}

          {!hideMascot ? (
            <div
              className="pointer-events-none absolute z-[2]"
              style={{ right: -16, bottom: -8, width: 284, height: 318 }}
            >
              <Image
                src={mascotSrc}
                alt=""
                fill
                sizes="284px"
                className="object-contain object-bottom transition-transform duration-500 group-hover/cover:scale-[1.04]"
                style={{
                  filter: `drop-shadow(0 16px 32px ${area.hex}55) drop-shadow(0 8px 24px rgba(0,0,0,0.65))`,
                }}
                priority={isHero}
              />
            </div>
          ) : null}

          <div
            className="absolute inset-x-0 bottom-0 z-[4] border-t border-white/10 bg-gradient-to-t from-black/90 via-black/60 to-black/20 px-4 py-2.5 backdrop-blur-md"
            style={{
              borderTopColor: `${area.hex}44`,
              boxShadow: `inset 0 1px 0 ${area.hex}33`,
            }}
          >
            <p
              className="truncate font-bold leading-snug text-white"
              style={{ fontSize: 13 }}
            >
              {footerLine}
            </p>
            {(simulationId || dateLine) ? (
              <p
                className="mt-0.5 truncate font-medium text-white/50"
                style={{ fontSize: 10 }}
              >
                {simulationId ?? ''}
                {simulationId && dateLine ? ' · ' : ''}
                {dateLine}
              </p>
            ) : null}
          </div>
        </div>
      </CoverCanvas>

      {showPlay && !isThumb ? (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center opacity-0 transition duration-300 group-hover/cover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/95 text-slate-900 shadow-2xl">
            <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden />
          </span>
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-px"
        style={{ background: `linear-gradient(90deg, transparent 5%, ${area.hex}cc 50%, transparent 95%)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${area.hex}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[4] rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/cover:opacity-100"
        style={{ boxShadow: `inset 0 0 40px ${area.hex}33` }}
      />
    </div>
  );
}
