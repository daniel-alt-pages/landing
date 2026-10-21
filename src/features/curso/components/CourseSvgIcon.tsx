'use client';

type CourseSvgIconProps = {
  src: string;
  className?: string;
  size?: number;
};

/** Icono métrica (WebP/SVG en `/public/curso/icons`). */
export default function CourseSvgIcon({ src, className = '', size = 16 }: CourseSvgIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- assets raster/SVG externos
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain drop-shadow-sm ${className}`}
      style={{ maxWidth: '100%', maxHeight: '100%' }}
      aria-hidden
    />
  );
}
