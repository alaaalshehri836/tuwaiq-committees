import { PALETTE } from '../theme/palette';
import { VIDEO } from './script';

/** Values animated by the master timeline (so particles are part of the same clock). */
export interface ParticleState {
  alpha: number; // global visibility 0..1
  warp: number; // 0 = calm drift, 1 = hyperspace burst (camera flying through the door)
  tint: string; // accent color for ~35% of pixels ('' = brand purple)
}

const COLORS = [PALETTE.electric, PALETTE.lavender, PALETTE.purple, PALETTE.lavender, PALETTE.cyan];

/** Seeded PRNG — same pixels on every render. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic version of the site's PixelField: every pixel position is a
 * pure function of time `t`, so seeking to any frame always draws the same image.
 */
export function createParticles(canvas: HTMLCanvasElement, state: ParticleState) {
  const { width: W, height: H } = VIDEO;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const rand = mulberry32(1448);
  const pixels = Array.from({ length: 150 }, () => ({
    x0: rand() * W,
    y0: rand() * (H + 20),
    size: rand() < 0.15 ? 4 + rand() * 3 : 1.5 + rand() * 2.5,
    speed: 6 + rand() * 22, // px per second upward
    drift: 4 + rand() * 14,
    driftSpeed: 0.2 + rand() * 0.5,
    alpha: 0.25 + rand() * 0.65,
    phase: rand() * Math.PI * 2,
    depth: 0.3 + rand() * 0.7,
    color: COLORS[(rand() * COLORS.length) | 0],
    tinted: rand() < 0.35,
  }));
  const cx = W / 2;
  const cy = H * 0.55;
  const span = H + 20;

  return function draw(t: number) {
    ctx.clearRect(0, 0, W, H);
    if (state.alpha <= 0.001) return;
    const warp = state.warp * state.warp;
    for (const p of pixels) {
      let y = ((((p.y0 - p.speed * t) % span) + span) % span) - 10;
      let x = p.x0 + Math.sin(t * p.driftSpeed + p.phase) * p.drift;
      let size = p.size;
      if (warp > 0) {
        const f = 1 + warp * 7 * p.depth;
        x = cx + (x - cx) * f;
        y = cy + (y - cy) * f;
        size *= 1 + warp * 2.5 * p.depth;
      }
      ctx.globalAlpha = state.alpha * p.alpha * (0.55 + 0.45 * Math.sin(t * 1.3 + p.phase));
      ctx.fillStyle = p.tinted && state.tint ? state.tint : p.color;
      ctx.fillRect(Math.round(x), Math.round(y), size, size);
    }
    ctx.globalAlpha = 1;
  };
}
