'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import type { VideoItem } from '../../_contenido/videos';
import { ReelsSocialColumn } from './ReelsSocial';

/*
 * Visor a pantalla completa tipo Reels («Resultados en video»).
 * - Apertura automática: solo al entrar al contenedor desde arriba bajando (no con prefers-reduced-motion).
 *   Cualquier cierre la desarma hasta que la sección salga del todo del viewport (margen 200px) y se vuelva desde arriba.
 * - Tocar una tarjeta abre SIEMPRE el visor en ese video, con play() síncrono dentro del gesto (requisito de iOS/Android).
 * - Nunca se cierra solo: al terminar un video pasa al siguiente; en el último queda en pausa al final (sin bucle).
 * - Navegación: flechas, J (siguiente) / K (anterior), rueda y swipe; un paso por gesto con bloqueo de ~600ms.
 *   Más allá del último cierra y la página sigue hacia abajo; antes del primero cierra y la página queda arriba.
 * - X, Esc y Atrás del navegador cierran y dejan la página en la tarjeta del video activo, con foco.
 * - Historial: al abrir pushState(#video=slug); al cambiar de video replaceState; al cerrar con X/Esc/borde, history.back().
 * - Rendimiento: un pool de 3 <video> (anterior/actual/siguiente) que se reasignan cambiando src.
 * - Sonido: se intenta con sonido; si el navegador lo bloquea, silenciado + aviso. La preferencia se guarda en localStorage.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.3;
const STEP_LOCK_MS = 600;
const SWIPE_MIN = 60;
const POOL = 3;
const SOUND_KEY = 'sg-reels-sonido';

let audioUnlocked = false;
function markUnlocked() {
  audioUnlocked = true;
}

function readSoundPref(): 'on' | 'off' | null {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    return v === 'on' || v === 'off' ? v : null;
  } catch { return null; }
}
function saveSoundPref(on: boolean) {
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch { /* sin almacenamiento */ }
}

export function slugOf(item: VideoItem) {
  return item.slug || item.id;
}

function headerOffset() {
  const h = document.querySelector('header');
  const r = h?.getBoundingClientRect();
  return r && r.top <= 0 && r.bottom > 0 ? r.bottom : 0;
}

/** Reproduce con el silencio pedido; si el navegador bloquea el sonido, reintenta en silencio. Devuelve si quedó bloqueado. */
function playWithFallback(v: HTMLVideoElement, mute: boolean, onBlocked: () => void, onPlaying?: () => void) {
  v.muted = mute;
  const pr = v.play();
  if (!pr) return;
  pr.then(() => onPlaying?.()).catch((err: unknown) => {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'NotAllowedError' && !v.muted) {
      v.muted = true;
      onBlocked();
      v.play().catch(() => { /* sin reproducción */ });
    }
  });
}

function rewind(v: HTMLVideoElement) {
  if (v.ended) v.currentTime = 0;
}

export type CloseReason = 'x' | 'esc' | 'back' | 'edge-top' | 'edge-bottom';
type VideoRefs = MutableRefObject<(HTMLVideoElement | null)[]>;
type Props = { items: VideoItem[]; children: ReactNode };

export function ReelsVisor({ items, children }: Props) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const poolRefs: VideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [gestureStart, setGestureStart] = useState(false);
  const openRef = useRef(false);
  const armedRef = useRef(true);
  const scrollYRef = useRef(0);
  const lastActiveRef = useRef(0);
  const closeReasonRef = useRef<CloseReason>('x');
  const pushedRef = useRef(false);
  const ignorePopRef = useRef(false);
  const pendingPlaceRef = useRef(0);

  useEffect(() => {
    const opts = { capture: true, passive: true } as const;
    document.addEventListener('pointerdown', markUnlocked, opts);
    document.addEventListener('keydown', markUnlocked, opts);
    return () => {
      document.removeEventListener('pointerdown', markUnlocked, opts);
      document.removeEventListener('keydown', markUnlocked, opts);
    };
  }, []);

  const prepareOpen = useCallback((index: number, byGesture: boolean, historyMode: 'push' | 'replace' = 'push') => {
    scrollYRef.current = window.scrollY;
    armedRef.current = false;
    openRef.current = true;
    lastActiveRef.current = index;
    const hash = `#video=${slugOf(items[index])}`;
    try {
      if (historyMode === 'push') { history.pushState({ reels: true }, '', hash); pushedRef.current = true; }
      else { history.replaceState(history.state, '', hash); pushedRef.current = false; }
    } catch { pushedRef.current = false; }
    setStartIndex(index);
    setGestureStart(byGesture);
    setOpen(true);
  }, [items]);

  // Apertura automática al entrar desde arriba bajando; re-armado al salir del todo (margen 200px).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || items.length === 0 || reduce) return;
    let lastY = window.scrollY;
    let goingDown = false;
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) goingDown = y > lastY;
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const enter = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (!e || !e.isIntersecting || openRef.current || !armedRef.current) return;
      if (!goingDown || e.boundingClientRect.top <= 0) return;
      prepareOpen(lastActiveRef.current, false);
    }, { rootMargin: '0px 0px -40% 0px', threshold: 0 });
    const leave = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e && !e.isIntersecting && !openRef.current) armedRef.current = true;
    }, { rootMargin: '200px 0px 200px 0px', threshold: 0 });
    enter.observe(el);
    leave.observe(el);
    return () => {
      window.removeEventListener('scroll', onScroll);
      enter.disconnect();
      leave.disconnect();
    };
  }, [items.length, reduce, prepareOpen]);

  /** Después de restaurar el body: ubicar la página según la vía de cierre. */
  const placeAfterClose = (reason: CloseReason) => {
    const host = wrapRef.current;
    if (!host) return;
    // Salto instantáneo: un scroll suave aquí lo cancelan la restauración del body y el history.back().
    const jump = (top: number) => {
      const html = document.documentElement;
      const pb = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, Math.max(0, top));
      html.style.scrollBehavior = pb;
    };
    if (reason === 'edge-bottom') {
      const section = host.closest('section');
      const target = (section?.nextElementSibling as HTMLElement | null) ?? section;
      if (target) jump(target.getBoundingClientRect().top + window.scrollY - headerOffset());
      return;
    }
    if (reason === 'edge-top') {
      const top = host.getBoundingClientRect().top + window.scrollY;
      jump(top - window.innerHeight - 1);
      return;
    }
    const id = items[lastActiveRef.current]?.id;
    const card = id ? host.querySelector<HTMLElement>(`button[data-video-id="${id}"]`) : null;
    const target = card ?? host.querySelector<HTMLElement>('button[data-video-id]');
    if (!target) return;
    const r = target.getBoundingClientRect();
    if (r.top < headerOffset() || r.bottom > window.innerHeight) target.scrollIntoView({ block: 'center', behavior: 'auto' });
    target.focus({ preventScroll: true });
  };
  const placeRef = useRef(placeAfterClose);
  useEffect(() => { placeRef.current = placeAfterClose; });

  // Bloqueo del scroll del body; al cerrar SIEMPRE se restaura (cualquier vía).
  useEffect(() => {
    if (!open) return;
    const y = scrollYRef.current;
    const body = document.body;
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
    const prevRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
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
      // Si hay un history.back() en curso, la ubicación final se hace tras el popstate (evita que el navegador la pise).
      if (!ignorePopRef.current) placeRef.current(closeReasonRef.current);
      else pendingPlaceRef.current = window.setTimeout(() => { pendingPlaceRef.current = 0; ignorePopRef.current = false; placeRef.current(closeReasonRef.current); }, 500);
      window.setTimeout(() => { history.scrollRestoration = prevRestoration; }, 400);
    };
  }, [open]);

  const close = useCallback((reason: CloseReason) => {
    if (!openRef.current) return;
    openRef.current = false;
    armedRef.current = false;
    closeReasonRef.current = reason;
    const goBack = reason !== 'back' && pushedRef.current;
    if (goBack) ignorePopRef.current = true;
    flushSync(() => setOpen(false));
    if (goBack) history.back();
    else if (reason !== 'back') {
      {
        try { history.replaceState(history.state, '', `${location.pathname}${location.search}`); } catch { /* sin historial */ }
      }
    }
    pushedRef.current = false;
  }, []);

  // Atrás del navegador cierra el visor (como X).
  useEffect(() => {
    const onPop = () => {
      if (ignorePopRef.current) {
        ignorePopRef.current = false;
        if (pendingPlaceRef.current) {
          window.clearTimeout(pendingPlaceRef.current);
          pendingPlaceRef.current = 0;
          // El navegador restaura el scroll de la entrada tras el popstate: ubicar después.
          const reason = closeReasonRef.current;
          window.setTimeout(() => requestAnimationFrame(() => placeRef.current(reason)), 30);
        }
        return;
      }
      if (openRef.current) { pushedRef.current = false; close('back'); }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [close]);

  // Enlace profundo #video=slug (al cargar y en hashchange): ir a la sección y abrir ahí (cuenta como apertura por toque).
  useEffect(() => {
    const fromHash = () => {
      const m = /^#video=([a-z0-9-]+)$/.exec(window.location.hash);
      if (!m || openRef.current) return;
      const idx = items.findIndex((it) => slugOf(it) === m[1]);
      if (idx < 0) return;
      const host = wrapRef.current;
      if (host) {
        const html = document.documentElement;
        const pb = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';
        window.scrollTo(0, Math.max(0, host.getBoundingClientRect().top + window.scrollY - headerOffset()));
        html.style.scrollBehavior = pb;
      }
      prepareOpen(idx, false, 'replace');
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [items, prepareOpen]);

  const onActive = useCallback((i: number) => {
    lastActiveRef.current = i;
    try { history.replaceState(history.state, '', `#video=${slugOf(items[i])}`); } catch { /* sin historial */ }
  }, [items]);

  /** Tocar una tarjeta: abrir en ese video y reproducir dentro del mismo gesto (móvil). */
  const onCardClick = (e: React.MouseEvent) => {
    if (openRef.current) return;
    const card = (e.target as HTMLElement).closest('.ag-video-card');
    const inline = card?.querySelector<HTMLVideoElement>('video[data-video-id]');
    if (!inline) return;
    const idx = items.findIndex((it) => it.id === inline.dataset.videoId);
    if (idx < 0) return;
    e.preventDefault();
    e.stopPropagation();
    inline.pause();
    markUnlocked();
    flushSync(() => prepareOpen(idx, true));
    const v = poolRefs.current[idx % POOL];
    if (v) {
      const pref = readSoundPref();
      const mute = reduce ? pref !== 'on' : pref === 'off';
      playWithFallback(v, mute, () => { /* el overlay muestra el aviso al detectar muted */ });
    }
  };

  return (
    <div ref={wrapRef} className="ag-reels-host" onClickCapture={onCardClick}>
      {children}
      <AnimatePresence>
        {open ? (
          <ReelsOverlay key="reels" items={items} startIndex={startIndex} gestureStart={gestureStart} poolRefs={poolRefs} reduce={!!reduce} onActive={onActive} onClose={close} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type OverlayProps = {
  items: VideoItem[];
  startIndex: number;
  gestureStart: boolean;
  poolRefs: VideoRefs;
  reduce: boolean;
  onActive: (i: number) => void;
  onClose: (reason: CloseReason) => void;
};

function ReelsOverlay({ items, startIndex, gestureStart, poolRefs, reduce, onActive, onClose }: OverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(startIndex);
  const [muted, setMuted] = useState(() => {
    const pref = readSoundPref();
    return reduce ? pref !== 'on' : pref === 'off';
  });
  const [blocked, setBlocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const mutedRef = useRef(muted);
  const skipFirstPlayRef = useRef(gestureStart);
  const lockUntilRef = useRef(0);
  const activeRef = useRef(startIndex);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Pool: slot k muestra el índice i (i % 3 === k) entre anterior/actual/siguiente.
  const slotIndex = (k: number) => {
    for (const i of [active - 1, active, active + 1]) if (i >= 0 && i < items.length && i % POOL === k) return i;
    return -1;
  };

  useLayoutEffect(() => {
    const sc = scrollerRef.current;
    if (sc) sc.scrollTop = startIndex * sc.clientHeight;
  }, [startIndex]);

  useEffect(() => {
    activeRef.current = active;
    onActive(active);
    lockUntilRef.current = Date.now() + STEP_LOCK_MS;
  }, [active, onActive]);

  // Reproducir el activo; pausar los demás.
  useEffect(() => {
    const cur = poolRefs.current[active % POOL];
    poolRefs.current.forEach((v) => { if (v && v !== cur) v.pause(); });
    if (!cur) return;
    if (skipFirstPlayRef.current) {
      skipFirstPlayRef.current = false;
      // El play() ya se lanzó en el gesto; reflejar si quedó en silencio forzado.
      window.setTimeout(() => { if (cur.muted && !mutedRef.current) setBlocked(true); setPaused(cur.paused); }, 300);
      return;
    }
    rewind(cur);
    if (rootRef.current) rootRef.current.dataset.audioUnlocked = String(audioUnlocked);
    playWithFallback(cur, mutedRef.current, () => setBlocked(true), () => { if (!cur.muted) setBlocked(false); });
  }, [active, poolRefs]);

  // Slide activa según scroll-snap.
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index)); });
    }, { root: sc, threshold: 0.6 });
    sc.querySelectorAll('.ag-reels-slide').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  useEffect(() => { closeBtnRef.current?.focus({ preventScroll: true }); }, []);

  const step = useCallback((dir: 1 | -1) => {
    const sc = scrollerRef.current;
    if (!sc || Date.now() < lockUntilRef.current) return;
    const target = activeRef.current + dir;
    if (target < 0) { onClose('edge-top'); return; }
    if (target > items.length - 1) { onClose('edge-bottom'); return; }
    lockUntilRef.current = Date.now() + STEP_LOCK_MS;
    sc.scrollTo({ top: target * sc.clientHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [items.length, reduce, onClose]);

  const goTo = useCallback((i: number) => {
    const sc = scrollerRef.current;
    if (sc) sc.scrollTo({ top: Math.max(0, Math.min(items.length - 1, i)) * sc.clientHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [items.length, reduce]);

  // Rueda y swipe: un paso por gesto. El scroll nativo se controla para poder cerrar en los bordes.
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    let acc = 0;
    let accTimer = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      acc += e.deltaY;
      window.clearTimeout(accTimer);
      accTimer = window.setTimeout(() => { acc = 0; }, 200);
      if (Math.abs(acc) < 40) return;
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      step(dir);
    };
    let startY: number | null = null;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0]?.clientY ?? null; };
    const onTouchMove = (e: TouchEvent) => { if (e.cancelable) e.preventDefault(); };
    const onTouchEnd = (e: TouchEvent) => {
      if (startY == null) return;
      const dy = startY - (e.changedTouches[0]?.clientY ?? startY);
      startY = null;
      if (Math.abs(dy) >= SWIPE_MIN) step(dy > 0 ? 1 : -1);
    };
    sc.addEventListener('wheel', onWheel, { passive: false });
    sc.addEventListener('touchstart', onTouchStart, { passive: true });
    sc.addEventListener('touchmove', onTouchMove, { passive: false });
    sc.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.clearTimeout(accTimer);
      sc.removeEventListener('wheel', onWheel);
      sc.removeEventListener('touchstart', onTouchStart);
      sc.removeEventListener('touchmove', onTouchMove);
      sc.removeEventListener('touchend', onTouchEnd);
    };
  }, [step]);

  const current = () => poolRefs.current[activeRef.current % POOL];

  const setSound = (on: boolean) => {
    markUnlocked();
    saveSoundPref(on);
    setMuted(!on);
    setBlocked(false);
    const v = current();
    if (!v) return;
    v.muted = !on;
    if (on && v.paused && !v.ended) v.play().catch(() => { /* sin reproducción */ });
  };
  const unlockSound = () => { if (blocked) setSound(true); };
  const togglePlay = () => {
    const v = current();
    if (!v) return;
    if (v.paused) { if (v.ended) v.currentTime = 0; v.play().catch(() => { /* sin reproducción */ }); }
    else v.pause();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key;
    // El panel de comentarios maneja su propio teclado (Esc, Tab).
    if (e.defaultPrevented || (e.target as HTMLElement | null)?.closest?.('.ag-reels-sheet')) return;
    if (k === 'Escape') { e.preventDefault(); onClose('esc'); return; }
    if (k === 'ArrowDown' || k === 'PageDown' || k === 'j' || k === 'J') { e.preventDefault(); step(1); return; }
    if (k === 'ArrowUp' || k === 'PageUp' || k === 'k' || k === 'K') { e.preventDefault(); step(-1); return; }
    if (k === ' ' && (e.target as HTMLElement)?.tagName !== 'BUTTON') { e.preventDefault(); togglePlay(); return; }
    if (k === 'Tab') {
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
    if (i !== activeRef.current) return;
    if (i < items.length - 1) goTo(i + 1);
    else setPaused(true);
  };

  const t = reduce ? { duration: 0 } : { duration: DURATION, ease: EASE };
  const soundOff = muted || blocked;
  return (
    <motion.div
      ref={rootRef}
      className="ag-reels"
      role="dialog"
      aria-modal="true"
      aria-label="Resultados en video"
      onPointerDownCapture={unlockSound}
      initial={reduce ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.97 }}
      transition={t}
    >
      <div ref={scrollerRef} className="ag-reels-scroller">
        {items.map((item, i) => (
          <div key={item.id} className="ag-reels-slide" data-index={i}>
            {/* Poster siempre cargado; el <video> del pool se superpone en su slide. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- export estático, poster nativo 720×1280 */}
            <img className="ag-reels-poster" src={`/landing/videos/${item.id}.jpg`} alt="" aria-hidden="true" decoding="async" />
            <motion.div
              className="ag-reels-caption"
              initial={false}
              animate={i === active ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 12 }}
              transition={t}
            >
              {item.badge ? <span className="ag-badge ag-badge-dark">{item.badge}</span> : null}
              <p className="ag-reels-title">{item.title}</p>
              <p className="ag-reels-text">{item.caption}</p>
            </motion.div>
          </div>
        ))}
        {Array.from({ length: Math.min(POOL, items.length) }, (_, k) => {
          const i = slotIndex(k);
          const item = i >= 0 ? items[i] : null;
          return (
            <video
              key={`slot-${k}`}
              ref={(n) => { poolRefs.current[k] = n; }}
              className="ag-reels-video"
              style={{ top: `${Math.max(0, i) * 100}%`, visibility: item ? 'visible' : 'hidden' }}
              src={item ? `/landing/videos/${item.id}.mp4` : undefined}
              poster={item ? `/landing/videos/${item.id}.jpg` : undefined}
              playsInline
              muted={soundOff}
              preload={i === active || i === active + 1 ? 'auto' : 'none'}
              aria-label={item?.aria}
              data-index={i}
              onClick={() => { if (!blocked) togglePlay(); }}
              onPlay={() => { if (i === activeRef.current) setPaused(false); }}
              onPause={() => { if (i === activeRef.current) setPaused(true); }}
              onEnded={() => onEnded(i)}
            >
              {item?.captions ? <track kind="captions" srcLang="es" label="Español" src={item.captions} default /> : null}
            </video>
          );
        })}
      </div>
      <div className="ag-reels-bar">
        <div className="ag-reels-actions">
          <button type="button" className="ag-reels-btn" onClick={togglePlay} aria-label={paused ? 'Reproducir el video' : 'Pausar el video'}>
            {paused ? <Play aria-hidden size={24} /> : <Pause aria-hidden size={24} />}
          </button>
          <button type="button" className="ag-reels-btn" onClick={() => setSound(soundOff)} aria-label={soundOff ? 'Activar el sonido' : 'Silenciar el video'} aria-pressed={!soundOff}>
            {soundOff ? <VolumeX aria-hidden size={24} /> : <Volume2 aria-hidden size={24} />}
          </button>
          <button ref={closeBtnRef} type="button" className="ag-reels-btn" onClick={() => onClose('x')} aria-label="Cerrar los videos">
            <X aria-hidden size={24} />
          </button>
        </div>
      </div>
      <ReelsSocialColumn key={slugOf(items[active])} slug={slugOf(items[active])} title={items[active]?.title ?? ''} onSheet={() => undefined} />
      <div className="ag-reels-live" role="status" aria-live="assertive">
        <AnimatePresence>
          {blocked ? (
            <motion.button
              key="unmute"
              type="button"
              className="ag-reels-unmute"
              onClick={unlockSound}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 8 }}
              transition={t}
            >
              <Volume2 aria-hidden size={28} /> Toque para activar el sonido
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
