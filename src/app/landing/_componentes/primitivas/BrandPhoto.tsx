import Image from 'next/image';
import { MARCA_ALT, MARCA_IMAGEN } from '../../_contenido/marca';

export function BrandPhoto({
  alt = MARCA_ALT,
  priority = false,
  className,
}: {
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      className={className ? `ag-brand-photo ${className}` : 'ag-brand-photo'}
      src={MARCA_IMAGEN}
      alt={alt}
      width={1024}
      height={1024}
      priority={priority}
    />
  );
}
