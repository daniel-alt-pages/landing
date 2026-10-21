'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/** Nunca reducir por debajo del ajuste natural. */
const BANNER_MIN_ZOOM = 1;
/** Tope de ampliación para evitar recortes excesivos o rotura del layout. */
const BANNER_MAX_ZOOM = 1.32;
const BANNER_MIN_HEIGHT_PX = 112;
const BANNER_MAX_HEIGHT_PX = 236;

type BannerLayout =
    | { mode: 'width-fit'; height: number }
    | { mode: 'zoom'; height: number; zoom: number };

type Props = {
    src: string;
};

/**
 * Banner institucional sin bandas laterales.
 * 1) Si la altura natural (ancho 100 %) cabe en min/max → imagen a ancho completo, sin recorte.
 * 2) Si la altura queda limitada → zoom acotado [MIN_ZOOM, MAX_ZOOM] para llenar el ancho.
 */
export function InstitutionBannerImage({ src }: Props) {
    const shellRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [layout, setLayout] = useState<BannerLayout>({
        mode: 'width-fit',
        height: BANNER_MIN_HEIGHT_PX,
    });

    const recompute = useCallback(() => {
        const shell = shellRef.current;
        const img = imgRef.current;
        if (!shell || !img?.naturalWidth || !img.naturalHeight) return;

        const cw = shell.clientWidth;
        if (cw <= 0) return;

        const aspect = img.naturalWidth / img.naturalHeight;
        const idealHeight = cw / aspect;

        if (idealHeight >= BANNER_MIN_HEIGHT_PX && idealHeight <= BANNER_MAX_HEIGHT_PX) {
            setLayout({ mode: 'width-fit', height: idealHeight });
            return;
        }

        const shellHeight =
            idealHeight > BANNER_MAX_HEIGHT_PX ? BANNER_MAX_HEIGHT_PX : BANNER_MIN_HEIGHT_PX;

        const containScale = Math.min(cw / img.naturalWidth, shellHeight / img.naturalHeight);
        const renderedW = img.naturalWidth * containScale;
        const widthFill = renderedW > 0 ? cw / renderedW : BANNER_MIN_ZOOM;
        const zoom = Math.min(BANNER_MAX_ZOOM, Math.max(BANNER_MIN_ZOOM, widthFill));

        setLayout({ mode: 'zoom', height: shellHeight, zoom });
    }, []);

    useLayoutEffect(() => {
        const shell = shellRef.current;
        if (!shell) return;

        const observer = new ResizeObserver(recompute);
        observer.observe(shell);
        recompute();

        return () => observer.disconnect();
    }, [recompute, src]);

    return (
        <div
            ref={shellRef}
            className="relative flex w-full items-center justify-center overflow-hidden bg-[#0a0e1a]"
            style={{ height: `${layout.height}px` }}
        >
            <img
                ref={imgRef}
                src={src}
                alt=""
                aria-hidden="true"
                onLoad={recompute}
                decoding="async"
                fetchPriority="high"
                draggable={false}
                className={
                    layout.mode === 'width-fit'
                        ? 'block h-auto w-full select-none'
                        : 'h-full w-full select-none object-contain object-center'
                }
                style={
                    layout.mode === 'zoom'
                        ? {
                              transform: layout.zoom > BANNER_MIN_ZOOM ? `scale(${layout.zoom})` : undefined,
                              transformOrigin: 'center center',
                          }
                        : undefined
                }
            />
        </div>
    );
}
