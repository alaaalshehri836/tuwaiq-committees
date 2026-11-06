import { useEffect, useRef } from 'react';
import { PALETTE } from '../theme/palette';

interface Props {
  /** Optional accent color — about a third of the pixels take this tint. */
  tint?: string;
  reduced: boolean;
}

interface Pixel {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
  color: string;
  tinted: boolean;
}

const COLORS = [PALETTE.electric, PALETTE.lavender, PALETTE.purple, PALETTE.lavender, PALETTE.cyan];

/**
 * Lightweight canvas of floating square "pixels" (no WebGL).
 * Density scales with viewport area, DPR is capped, and the loop pauses
 * when the tab is hidden. With reduced motion it renders a single static frame.
 */
export function PixelField({ tint, reduced }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const tintRef = useRef(tint);

  useEffect(() => {
    tintRef.current = tint;
  }, [tint]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let pixels: Pixel[] = [];
    let raf = 0;

    const make = (anywhere = true): Pixel => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      size: Math.random() < 0.15 ? 4 + Math.random() * 2 : 1.5 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.1,
      vy: -(0.08 + Math.random() * 0.32),
      alpha: 0.25 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      tinted: Math.random() < 0.35,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(110, Math.max(36, (w * h) / 13000)));
      pixels = Array.from({ length: count }, () => make());
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pixels) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) Object.assign(p, make(false));
        }
        const twinkle = reduced ? 1 : 0.55 + 0.45 * Math.sin(t * 0.0012 + p.phase);
        ctx.globalAlpha = p.alpha * twinkle;
        ctx.fillStyle = p.tinted && tintRef.current ? tintRef.current : p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (reduced) draw(0);
      else raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : start());
    const onResize = () => {
      resize();
      if (reduced) draw(0);
    };

    resize();
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // Static mode also re-renders when the tint changes.
  }, [reduced, reduced ? tint : undefined]);

  return <canvas ref={ref} className="pixel-field" aria-hidden="true" />;
}
