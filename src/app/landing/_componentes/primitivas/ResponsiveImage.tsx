export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}) {
  const avif = src.replace(/\.svg$/, '.avif');
  const webp = src.replace(/\.svg$/, '.webp');
  const raster = src.endsWith('.svg') ? null : src;
  return (
    <picture>
      {raster ? <source srcSet={avif} type="image/avif" /> : null}
      {raster ? <source srcSet={webp} type="image/webp" /> : null}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    </picture>
  );
}
