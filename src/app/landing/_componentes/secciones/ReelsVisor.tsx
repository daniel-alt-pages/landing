'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Volume2, VolumeX, X } from 'lucide-react';
import type { VideoItem } from '../../_contenido/videos';

const SESSION_KEY = 'sg-reels-visto';
const EASE = [0.16, 1, 0.3, 1] as const;

/** Estado global: el usuario ya interactuó con la página, el navegador permite audio. */
let audioUnlocked = false;
function markUnlocked() {
  audioUnlocked = true;
}

type Props = { items: VideoItem[]; children: ReactNode };

/** Visor a pantalla completa tipo Reels. Se abre solo una vez por visita al llegar a la sección. */
export function ReelsVisor({ items, children }: Props) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [exitUp, setExitUp] = useState(false);
  const scrollYRef = useRef(0);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const finishedRef = useRef(false);

  // Registrar la primera interacción del usuario con la página (habilita audio directo).
  useEffect(() => {
    const opts = { capture: true, passive: true } as const;
    document.addEventListener('pointerdown', markUnlocked, opts);
    document.addEventListener('keydown', markUnlocked, opts);
    return () => {
      document.removeEventListener('pointerdown', markUnlocked, opts);
      document.removeEventListener('keydown', markUnlocked, opts);
    };
  }, []);

  const [startIndex, setStartIndex] = useState(0);
  const doOpen = useCallback((index = 0) => {
    setStartIndex(index);
    scrollYRef.current = window.scrollY;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    finishedRef.current = false;
    setExitUp(false);
    setOpen(true);
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* sin almacenamiento */ }
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || items.length === 0) return;
    // Con prefers-reduced-motion no se abre solo: solo al tocar una tarjeta de video.
    if (reduce) return;
    let seen = false;
    try { seen = sessionStorage.getItem(SESSION_KEY) === '1'; } catch { /* sin almacenamiento */ }
    if (seen) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        doOpen(0);
      }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, doOpen, reduce]);

  // Bloqueo del scroll del body manteniendo la posición exacta.
  useEffect(() => {
    if (!open) return;
    const y = scrollYRef.current;
    const body = document.body;
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      Object.assign(body.style, prev);
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, y);
      html.style.scrollBehavior = prevBehavior;
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    returnFocusRef.current?.focus?.({ preventScroll: true });
  }, []);

  const finish = useCallback(() => {
    finishedRef.current = true;
    setExitUp(true);
    setOpen(false);
  }, []);

  const onExitComplete = useCallback(() => {
    if (!finishedRef.current) return;
    const section = wrapRef.current?.closest('section');
    const next = section?.nextElementSibling as HTMLElement | null;
    if (next) {
      next.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      const heading = next.querySelector<HTMLElement>('h1, h2, h3') ?? next;
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.classList.add('ag-reels-focus-target');
      heading.focus({ preventScroll: true });
    }
  }, [reduce]);

  /** Con reduced-motion, tocar una tarjeta abre el visor en ese video (muted). */
  const onCardClick = (e: React.MouseEvent) => {
    if (!reduce || open) return;
    const video = (e.target as HTMLElement).closest('.ag-video-card')?.querySelector('video');
    if (!video) return;
    const src = video.querySelector('source')?.getAttribute('src') ?? '';
    const idx = items.findIndex((it) => src.endsWith(`/${it.id}.mp4`));
    if (idx < 0) return;
    e.preventDefault();
    video.pause();
    doOpen(idx);
  };

  return (
    <div ref={wrapRef} className="ag-reels-host" onClickCapture={onCardClick}>
      {children}
      <AnimatePresence onExitComplete={onExitComplete}>
        {open ? (
          <ReelsOverlay key="reels" items={items} startIndex={startIndex} reduce={!!reduce} exitUp={exitUp} onClose={close} onFinish={finish} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type OverlayProps = { items: VideoItem[]; startIndex: number; reduce: boolean; exitUp: boolean; onClose: () => void; onFinish: () => void };

function ReelsOverlay({ items, startIndex, reduce, exitUp, onClose, onFinish }: OverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(startIndex);
  // Con reduced-motion arranca en silencio hasta que el usuario active el sonido.
  const [muted, setMuted] = useState(reduce);
  const [blocked, setBlocked] = useState(false);
  const mutedRef = useRef(reduce);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const goTo = useCallback((i: number) => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    sc.scrollTo({ top: clamped * sc.clientHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [items.length, reduce]);

  // Reproducir el video activo; pausar los demás. Audio por defecto, con respaldo silenciado.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i !== active) { v.pause(); return; }
      v.currentTime = 0;
      const wantSound = !mutedRef.current;
      if (rootRef.current) rootRef.current.dataset.audioUnlocked = String(audioUnlocked);
      v.muted = !wantSound;
      v.play().then(() => { if (wantSound) setBlocked(false); }).catch((err: unknown) => {
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' && !v.muted) {
          v.muted = true;
          setBlocked(true);
          v.play().catch(() => { /* sin reproducción */ });
        }
      });
    });
  }, [active]);

  // Slide activa según scroll-snap.
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      });
    }, { root: sc, threshold: 0.6 });
    sc.querySelectorAll('[data-index]').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const sc = scrollerRef.current;
    if (sc && startIndex > 0) sc.scrollTo({ top: startIndex * sc.clientHeight, behavior: 'auto' });
    closeBtnRef.current?.focus({ preventScroll: true });
  }, [startIndex]);

  const unlockSound = useCallback(() => {
    if (!blocked) return;
    markUnlocked();
    setBlocked(false);
    setMuted(false);
    const v = videoRefs.current[active];
    if (v) { v.muted = false; v.play().catch(() => { /* sin reproducción */ }); }
  }, [blocked, active]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setBlocked(false);
    if (!next) markUnlocked();
    const v = videoRefs.current[active];
    if (v) { v.muted = next; if (!next) v.play().catch(() => { /* sin reproducción */ }); }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(active + 1); return; }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goTo(active - 1); return; }
    if (e.key === 'Tab') {
      const nodes = rootRef.current?.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!rootRef.current?.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  const keyRef = useRef(onKeyDown);
  useEffect(() => { keyRef.current = onKeyDown; });
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const onEnded = (i: number) => {
    if (i < items.length - 1) goTo(i + 1);
    else onFinish();
  };

  const t = reduce ? { duration: 0 } : { duration: 0.45, ease: EASE };
  return (
    <motion.div
      ref={rootRef}
      className="ag-reels"
      role="dialog"
      aria-modal="true"
      aria-label="Resultados en video"
      onPointerDownCapture={unlockSound}
      onKeyDownCapture={unlockSound}
      initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : exitUp ? { y: '-100%' } : { opacity: 0, scale: 0.98 }}
      transition={t}
    >
      <div ref={scrollerRef} className="ag-reels-scroller">
        {items.map((item, i) => (
          <div key={item.id} className="ag-reels-slide" data-index={i}>
            <video
              ref={(n) => { videoRefs.current[i] = n; }}
              className="ag-reels-video"
              playsInline
              muted={muted}
              preload={Math.abs(i - active) <= 1 ? 'auto' : 'none'}
              poster={`/landing/videos/${item.id}.jpg`}
              aria-label={item.aria}
              onEnded={() => onEnded(i)}
            >
              <source src={`/landing/videos/${item.id}.mp4`} type="video/mp4" />
              {item.captions ? <track kind="captions" srcLang="es" label="Español" src={item.captions} default /> : null}
            </video>
            <div className="ag-reels-caption">
              <p className="ag-reels-title">{item.title}</p>
              <p className="ag-reels-text">{item.caption}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="ag-reels-bar">
        <span className="ag-reels-count" aria-live="polite">Video {active + 1} de {items.length}</span>
        <div className="ag-reels-actions">
          <button type="button" className="ag-reels-btn" onClick={toggleMute} aria-label={muted || blocked ? 'Activar el sonido' : 'Silenciar el video'} aria-pressed={!(muted || blocked)}>
            {muted || blocked ? <VolumeX aria-hidden size={24} /> : <Volume2 aria-hidden size={24} />}
          </button>
          <button ref={closeBtnRef} type="button" className="ag-reels-btn" onClick={onClose} aria-label="Cerrar los videos">
            <X aria-hidden size={24} />
          </button>
        </div>
      </div>
      <div className="ag-reels-live" role="status" aria-live="assertive">
        {blocked ? (
          <button type="button" className="ag-reels-unmute" onClick={unlockSound}>
            <Volume2 aria-hidden size={28} /> Toque para activar el sonido
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
