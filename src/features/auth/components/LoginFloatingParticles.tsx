'use client';

import { useEffect, useRef, useState } from 'react';

export type LoginVisualTier = 'off' | 'standard' | 'rich';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
};

const COLORS = ['59,130,246', '139,92,246', '6,182,212', '168,85,247'];
const CONNECT_DIST_SQ = 180 * 180;
const MOUSE_RADIUS = 200;

function resolveLoginVisualTier(): LoginVisualTier {
  if (typeof window === 'undefined') return 'standard';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'off';
  const w = window.innerWidth;
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches || w < 768) return 'off';
  if (w >= 1024 && window.matchMedia('(hover: hover) and (pointer: fine)').matches) return 'rich';
  return 'standard';
}

export function useLoginVisualTier(): LoginVisualTier {
  const [tier, setTier] = useState<LoginVisualTier>('standard');

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const mqCoarse = window.matchMedia('(hover: none) and (pointer: coarse)');

    const update = () => setTier(resolveLoginVisualTier());

    update();
    mqMotion.addEventListener('change', update);
    mqFine.addEventListener('change', update);
    mqCoarse.addEventListener('change', update);
    window.addEventListener('resize', update, { passive: true });
    return () => {
      mqMotion.removeEventListener('change', update);
      mqFine.removeEventListener('change', update);
      mqCoarse.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return tier;
}

function tierConfig(tier: LoginVisualTier, width: number) {
  if (tier === 'rich') {
    return {
      count: Math.min(32, Math.max(22, Math.floor(width / 55))),
      connections: true,
      mouse: true,
      glow: true,
    };
  }
  return {
    count: Math.min(16, Math.max(8, Math.floor(width / 90))),
    connections: false,
    mouse: false,
    glow: false,
  };
}

type LoginFloatingParticlesProps = {
  tier: LoginVisualTier;
};

export default function LoginFloatingParticles({ tier }: LoginFloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (tier === 'off') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    let animationId = 0;
    let running = document.visibilityState === 'visible';
    let paused = false;
    let skipConnections = false;
    let lastFrame = performance.now();

    const dpr = Math.min(window.devicePixelRatio || 1, tier === 'rich' ? 1.5 : 1.25);
    const cfg = tierConfig(tier, window.innerWidth);
    const particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000 };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    for (let i = 0; i < cfg.count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: 1.1 + Math.random() * (tier === 'rich' ? 2.2 : 1.4),
        opacity: 0.1 + Math.random() * 0.28,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    const onResize = () => resize();
    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running) animationId = requestAnimationFrame(tick);
    };

    let mouseRaf = 0;
    const onMouseMove = (e: MouseEvent) => {
      if (!cfg.mouse || mouseRaf) return;
      mouseRaf = requestAnimationFrame(() => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouseRaf = 0;
      });
    };

    const root = canvas.closest('.login-page-root');
    const onFocusIn = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.matches('input, textarea, select, [contenteditable="true"]')) paused = true;
    };
    const onFocusOut = (e: Event) => {
      const next = (e as FocusEvent).relatedTarget as Node | null;
      if (next && root?.contains(next)) return;
      paused = false;
    };

    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    if (cfg.mouse) window.addEventListener('mousemove', onMouseMove, { passive: true });
    root?.addEventListener('focusin', onFocusIn);
    root?.addEventListener('focusout', onFocusOut);

    const tick = (now: number) => {
      if (!running) return;

      const frameDelta = now - lastFrame;
      lastFrame = now;
      skipConnections = frameDelta > 28;

      if (!paused) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);

        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;

          if (cfg.mouse) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const distSq = dx * dx + dy * dy;
            const maxSq = MOUSE_RADIUS * MOUSE_RADIUS;
            if (distSq < maxSq && distSq > 1) {
              const dist = Math.sqrt(distSq);
              const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
              p.x += (dx / dist) * force * 1.6;
              p.y += (dy / dist) * force * 1.6;
            }
          }

          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;

          if (cfg.glow) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${p.opacity * 0.22})`;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
          ctx.fill();
        }

        if (cfg.connections && !skipConnections) {
          ctx.lineWidth = 0.55;
          for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
              const dx = particles[i].x - particles[j].x;
              const dy = particles[i].y - particles[j].y;
              const distSq = dx * dx + dy * dy;
              if (distSq < CONNECT_DIST_SQ) {
                const alpha = 0.07 * (1 - distSq / CONNECT_DIST_SQ);
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
                ctx.stroke();
              }
            }
          }
        }
      }

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(animationId);
      if (mouseRaf) cancelAnimationFrame(mouseRaf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (cfg.mouse) window.removeEventListener('mousemove', onMouseMove);
      root?.removeEventListener('focusin', onFocusIn);
      root?.removeEventListener('focusout', onFocusOut);
    };
  }, [tier]);

  if (tier === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      className="login-particles-canvas fixed inset-0 pointer-events-none"
      aria-hidden
    />
  );
}
