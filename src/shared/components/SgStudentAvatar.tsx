'use client';

import { useState } from 'react';

type SgStudentAvatarProps = {
  name: string;
  photoUrl?: string | null;
  sizeClass?: string;
  textClass?: string;
  className?: string;
  roundedClass?: string;
  /** Clases del bloque de iniciales cuando no hay foto. */
  fallbackClassName?: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? parts.at(-1)?.[0] ?? ''}`.toUpperCase();
}

/**
 * Avatar con foto (Google / ImgBB) o iniciales si no hay URL o falla la carga.
 */
export default function SgStudentAvatar({
  name,
  photoUrl,
  sizeClass = 'h-9 w-9',
  textClass = 'text-xs',
  className = '',
  roundedClass = 'rounded-lg',
  fallbackClassName = 'bg-[var(--course-surface-muted)] text-[var(--course-text)]',
}: SgStudentAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showPhoto = photoUrl && !failed;

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${sizeClass} ${roundedClass} ${className}`}
      aria-hidden
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- URLs externas (Google CDN, ImgBB)
        <img
          src={photoUrl}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-black ${textClass} ${fallbackClassName}`}
        >
          {initialsFromName(name)}
        </div>
      )}
    </div>
  );
}
