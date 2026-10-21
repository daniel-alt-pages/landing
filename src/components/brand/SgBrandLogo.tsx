'use client';

import Image from 'next/image';
import './sg-brand-logo.css';
import { SG_BRAND_LOGO_MASK_SRC, SG_BRAND_LOGO_SRC } from '@/lib/prismicAssets';

export { SG_BRAND_LOGO_SRC as SG_LOGO_URL };

export type SgBrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

export type SgBrandLogoProps = {
  size?: SgBrandLogoSize;
  float?: boolean;
  /** Halo rojo muy suave; solo en pantallas de carga hero. */
  ambientGlow?: boolean;
  /** Brillo rojo más visible (carga fullscreen, login). */
  prominentShine?: boolean;
  /** Animación de brillo más lenta — pantallas de carga y modales. */
  relaxed?: boolean;
  className?: string;
};

export default function SgBrandLogo({
  size = 'md',
  float = true,
  ambientGlow = false,
  prominentShine = false,
  relaxed = false,
  className = '',
}: SgBrandLogoProps) {
  return (
    <div
      className={`sg-brand-logo-wrap sg-brand-logo-wrap--${size}${float ? ' sg-brand-logo-wrap--float' : ''}${ambientGlow ? ' sg-brand-logo-wrap--shine-soft' : ''}${prominentShine ? ' sg-brand-logo-wrap--prominent' : ''}${relaxed ? ' sg-brand-logo-wrap--relaxed' : ''}${className ? ` ${className}` : ''}`}
      style={{ ['--sg-brand-logo-mask' as string]: `url("${SG_BRAND_LOGO_MASK_SRC}")` }}
    >
      <Image
        src={SG_BRAND_LOGO_SRC}
        alt="Logo Seamos Genios"
        width={160}
        height={160}
        className="sg-brand-logo-img"
        priority={size === 'lg' || size === 'xl' || size === 'hero'}
      />
      <span aria-hidden className="sg-brand-logo-shine sg-brand-logo-shine--base" />
      <span aria-hidden className="sg-brand-logo-shine sg-brand-logo-shine--a" />
      <span aria-hidden className="sg-brand-logo-shine sg-brand-logo-shine--b" />
      <span aria-hidden className="sg-brand-logo-shine sg-brand-logo-shine--c" />
      <span aria-hidden className="sg-brand-logo-shine sg-brand-logo-shine--d" />
    </div>
  );
}
