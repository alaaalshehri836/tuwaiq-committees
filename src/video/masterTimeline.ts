import gsap from 'gsap';
import { COMMITTEES } from '../data/committees';
import { layoutHallArc, MOTION } from '../animations/timelines';
import { DURATIONS as D, VIDEO } from './script';
import type { ParticleState } from './particles';

/**
 * ============================================================
 *  MASTER TIMELINE — the whole video is ONE paused GSAP timeline.
 *  Camera, doors, lights, particles, typography, highlights and
 *  branding are all tweens on it, so seeking to any time `t`
 *  always produces the same frame (needed for frame-exact export).
 *
 *  Block lengths: DURATIONS in script.ts.
 *  Offsets below (e.g. `at + 0.4`) are seconds inside a block.
 * ============================================================
 */

const EASE = MOTION.ease;

export function buildMasterTimeline(stage: HTMLElement, particles: ParticleState) {
  const v = (k: string) => stage.querySelector<HTMLElement>(`[data-v="${k}"]`)!;
  const vAll = (k: string) => Array.from(stage.querySelectorAll<HTMLElement>(`[data-v="${k}"]`));
  const a = (root: Element, k: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-a="${k}"]`));
  const a1 = (root: Element, k: string) => root.querySelector<HTMLElement>(`[data-a="${k}"]`)!;

  const entrance = v('entrance');
  const hall = v('hall');
  const veil = v('veil');
  const black = v('black');
  const header = v('header');

  const door = a1(entrance, 'door');
  const slots = a(hall, 'slot');
  const bodies = slots.map((s) => s.querySelector<HTMLElement>('.cdoor__body')!);
  const leaves = slots.map((s) => a1(s, 'leaf'));
  const lights = slots.map((s) => a1(s, 'light'));
  const beams = slots.map((s) => s.querySelector<HTMLElement>('.slot__beam')!);
  const tags = slots.map((s) => s.querySelector<HTMLElement>('.cdoor__tag')!);
  const captions = vAll('caption');
  const washes = vAll('wash');

  /* ---------- measure the layout (stage may be scaled in preview) ---------- */
  layoutHallArc(hall, false);
  const k = stage.getBoundingClientRect().width / VIDEO.width;
  const center = (el: Element, root: Element) => {
    const r = el.getBoundingClientRect();
    const o = root.getBoundingClientRect();
    return { x: (r.left - o.left + r.width / 2) / k, y: (r.top - o.top + r.height / 2) / k };
  };
  const doorC = center(door, entrance);
  const doorCenters = bodies.map((b) => center(b, hall));

  /** Camera: scale `s`, putting local point (fx,fy) at screen point (tx,ty). */
  const cam = (s: number, fx: number, fy: number, tx = fx, ty = fy) => ({ scale: s, x: tx - fx * s, y: ty - fy * s });
  const W = VIDEO.width;
  const H = VIDEO.height;

  /* ---------- initial state (frame 0) ---------- */
  gsap.set(black, { autoAlpha: 1 });
  gsap.set(veil, { autoAlpha: 0 });
  gsap.set(entrance, { autoAlpha: 1, scale: 1, transformOrigin: `${doorC.x}px ${doorC.y}px` });
  gsap.set(hall, { autoAlpha: 0, transformOrigin: '0 0', ...cam(1.35, W / 2, H * 0.55) });
  gsap.set([header, ...captions, ...washes, v('shade'), v('paths'), v('join'), v('open'), v('end')], { autoAlpha: 0 });
  gsap.set(a(entrance, 'floor'), { autoAlpha: 0 });
  gsap.set(a(entrance, 'lamp'), { autoAlpha: 0, y: -90 });
  gsap.set(a(entrance, 'beam'), { opacity: 0, scaleY: 0.6 });
  gsap.set(door, { autoAlpha: 0, y: 90, scale: 0.9 });
  gsap.set(a1(entrance, 'halo'), { opacity: 0, scale: 0.7 });
  gsap.set(a1(entrance, 'door-light'), { opacity: 0.15 });
  gsap.set([v('e-kicker'), v('e-sub')], { autoAlpha: 0, y: 24 });
  gsap.set(v('e-logo'), { autoAlpha: 0, y: 16, scale: 0.92 });
  gsap.set(vAll('e-word'), { autoAlpha: 0, y: 44, rotationX: -70, transformPerspective: 700, transformOrigin: '50% 100%' });
  gsap.set(slots, { autoAlpha: 0, y: 140 });
  gsap.set(vAll('h-text'), { autoAlpha: 0, y: 24 });
  gsap.set(tags, { opacity: 0, y: -4 });
  gsap.set([...bodies, ...leaves, ...lights, ...beams], { transition: 'none' });
  gsap.set(lights, { opacity: 0.45 });
  gsap.set(beams, { opacity: 0.18 });
  Object.assign(particles, { alpha: 0, warp: 0, tint: '' });

  const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.enter } });
  /** Sound-design markers (labels only — no visual effect). Read by scripts/export-cues.mjs. */
  const cue = (name: string, time: number) => tl.addLabel(`cue:${name}`, time);

  /* ================= Scene 1 — Entrance ================= */
  let at = 0;
  tl.addLabel('entrance', at)
    .to(black, { autoAlpha: 0, duration: 0.6, ease: 'power1.out' }, at)
    .to(particles, { alpha: 1, duration: 1.5, ease: 'none' }, at)
    .to(a(entrance, 'floor'), { autoAlpha: 1, duration: 1.0 }, at)
    .to(a(entrance, 'lamp'), { autoAlpha: 1, y: 0, duration: 1.0 }, at)
    .to(a(entrance, 'beam'), { opacity: 0.75, scaleY: 1, duration: 1.0 }, at + 0.3)
    .to(door, { autoAlpha: 1, y: 0, scale: 1, duration: 1.1 }, at + 0.1)
    .to(a1(entrance, 'halo'), { opacity: 0.85, scale: 1, duration: 1.0 }, at + 0.2)
    // logo + headline: on screen within the first second
    .to(v('e-logo'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.7 }, at + 0.15)
    .to(v('e-kicker'), { autoAlpha: 1, y: 0, duration: 0.6 }, at + 0.25)
    .to(vAll('e-word'), { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.75, stagger: 0.07 }, at + 0.35)
    .to(v('e-sub'), { autoAlpha: 1, y: 0, duration: 0.7 }, at + 0.75)
    // slow cinematic push-in toward the door until the camera flight
    .to(entrance, { scale: 1.045, duration: D.entrance + D.doorOpen, ease: 'none' }, at)
    // short anticipation: the door begins to glow
    .to(a1(entrance, 'seam'), { scaleX: 2.4, duration: 0.8, ease: 'power2.inOut' }, at + 0.9)
    .to(a1(entrance, 'door-light'), { opacity: 0.65, duration: 0.9, ease: 'power1.inOut' }, at + 0.9)
    .to(a1(entrance, 'halo'), { opacity: 1, scale: 1.25, duration: 0.9, ease: 'power1.inOut' }, at + 0.9);

  /* ================= Scene 2a — Door opens ================= */
  at += D.entrance;
  cue('logo', 0.15);
  cue('headline', 0.35);
  cue('glow', 0.9);
  cue('seam', at + 0.15);
  cue('leaves', at + 0.2);
  tl.addLabel('doorOpen', at)
    .to(a1(entrance, 'seam'), { scaleX: 5, duration: 0.4, ease: 'power2.out' }, at + 0.15)
    .to(a1(entrance, 'door-light'), { opacity: 1, duration: 0.6 }, at + 0.2)
    .to(a1(entrance, 'leaf-l'), { rotationY: MOTION.entrance.leafAngle, duration: 1.7, ease: EASE.cinematic }, at + 0.2)
    .to(a1(entrance, 'leaf-r'), { rotationY: -MOTION.entrance.leafAngle, duration: 1.7, ease: EASE.cinematic }, at + 0.2)
    .to(a1(entrance, 'seam'), { autoAlpha: 0, duration: 0.4 }, at + 0.5)
    .to(a1(entrance, 'halo'), { scale: 1.7, duration: 1.6 }, at + 0.35)
    .to(a(entrance, 'beam'), { opacity: 1, scaleY: 1.2, duration: 1.6 }, at + 0.35);

  /* ================= Scene 2b — Camera flies through ================= */
  at += D.doorOpen;
  cue('push', at);
  cue('veil', at + D.cameraPush - 1.05);
  tl.addLabel('cameraPush', at)
    .to([v('e-logo'), v('e-kicker'), ...vAll('e-word'), v('e-sub')], { autoAlpha: 0, y: -20, duration: 0.5, stagger: 0.02, ease: EASE.exit }, at)
    .to(header, { autoAlpha: 0, duration: 0.5 }, at)
    .to(entrance, { scale: MOTION.entrance.cameraScale, duration: D.cameraPush - 0.1, ease: EASE.push }, at)
    .to(a(entrance, 'floor'), { autoAlpha: 0, duration: 1.4, ease: EASE.exit }, at + 0.2)
    .to(particles, { warp: 1, duration: D.cameraPush, ease: 'power3.in' }, at)
    .to(veil, { autoAlpha: 1, duration: 1.0, ease: 'power1.in' }, at + D.cameraPush - 1.05);

  /* ================= Scene 2c — Inside: the hall appears ================= */
  at += D.cameraPush;
  COMMITTEES.forEach((_, i) => cue(`doorRise-${i}`, at + 0.5 + i * 0.15));
  tl.addLabel('hall', at)
    .set(entrance, { autoAlpha: 0 }, at)
    .set(hall, { autoAlpha: 1 }, at)
    .to(veil, { autoAlpha: 0, duration: 1.5, ease: 'power2.out' }, at)
    .to(particles, { warp: 0, duration: 1.8, ease: 'power3.out' }, at)
    .to(hall, { ...cam(1, 0, 0), duration: 3.4, ease: 'power2.out' }, at)
    .to(slots, { autoAlpha: 1, y: 0, duration: 1.5, stagger: 0.15 }, at + 0.5)
    .to(header, { autoAlpha: 1, duration: 1 }, at + 1)
    // title keeps its original entrance moment (it used to follow the removed kicker line by 0.12 s)
    .to(vAll('h-text'), { autoAlpha: 1, y: 0, duration: 1 }, at + 1.22);

  /* ================= Scene 3 — The five committees ================= */
  at += D.hallReveal;
  const P = D.perCommittee;
  tl.addLabel('committees', at)
    .to(vAll('h-text'), { autoAlpha: 0, y: -20, duration: 0.6, ease: EASE.exit }, at)
    .to(v('shade'), { autoAlpha: 1, duration: 1 }, at + 0.2);

  COMMITTEES.forEach((c, i) => {
    const t = at + i * P;
    const prev = i - 1;
    const cap = captions[i];
    const others = slots.filter((_, j) => j !== i);
    cue(`move-${i}`, t);
    cue(`reveal-${i}`, t + 0.45);
    tl.addLabel(`committee-${c.id}`, t)
      // camera glides to the door (door on the right third, caption on the left)
      .to(hall, { ...cam(1.55, doorCenters[i].x, doorCenters[i].y, 1310, 520), duration: 1.15, ease: EASE.cinematic }, t)
      .to(others, { opacity: 0.28, duration: 0.8 }, t)
      .to(slots[i], { opacity: 1, duration: 0.6 }, t)
      .set(particles, { tint: c.accent }, t + 0.3)
      .to(washes[i], { autoAlpha: 1, duration: 1 }, t)
      .to(washes[i], { autoAlpha: 0, duration: 1 }, t + P)
      // the door lights up and opens slightly
      .to(bodies[i], { y: -16, duration: 0.9 }, t + 0.4)
      .to(leaves[i], { rotationY: -32, duration: 1.1, ease: EASE.cinematic }, t + 0.4)
      .to(lights[i], { opacity: 1, duration: 0.8 }, t + 0.4)
      .to(beams[i], { opacity: 0.8, duration: 0.9 }, t + 0.4)
      // caption
      .set(cap, { autoAlpha: 1 }, t + 0.45)
      .fromTo(cap.querySelector('.v-caption__icon'), { autoAlpha: 0, scale: 0.6, rotationY: -70 }, { autoAlpha: 1, scale: 1, rotationY: 0, duration: 1, ease: 'back.out(1.6)' }, t + 0.45)
      .fromTo(cap.querySelectorAll('[data-v="cap-line"]'), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.1 }, t + 0.55)
      .fromTo(cap.querySelector('.v-caption__bar'), { scaleX: 0 }, { scaleX: 1, duration: 1, ease: EASE.cinematic }, t + 0.7)
      .to(cap, { autoAlpha: 0, x: -40, duration: 0.45, ease: EASE.exit }, t + P - 0.4);
    if (prev >= 0) {
      tl.to(bodies[prev], { y: 0, duration: 0.7 }, t)
        .to(leaves[prev], { rotationY: 0, duration: 0.8, ease: EASE.cinematic }, t)
        .to(lights[prev], { opacity: 0.45, duration: 0.7 }, t)
        .to(beams[prev], { opacity: 0.18, duration: 0.7 }, t);
    }
  });

  /* ================= Scene 4a — Pull back: all five doors ================= */
  at += COMMITTEES.length * P;
  cue('pullBack', at);
  cue('leavesAll', at + 0.5);
  const last = COMMITTEES.length - 1;
  tl.addLabel('finale', at)
    .to(v('shade'), { autoAlpha: 0, duration: 0.8 }, at)
    .set(particles, { tint: '' }, at + 0.4)
    .to(hall, { ...cam(1, 0, 0), duration: D.pullBack + 0.2, ease: EASE.cinematic }, at)
    .to(slots, { opacity: 1, duration: 0.8 }, at + 0.2)
    .to(bodies[last], { y: 0, duration: 0.7 }, at)
    .to(leaves, { rotationY: -18, duration: 1.1, stagger: 0.08, ease: EASE.cinematic }, at + 0.5)
    .to(lights, { opacity: 0.85, duration: 0.8, stagger: 0.08 }, at + 0.5)
    .to(beams, { opacity: 0.45, duration: 0.8, stagger: 0.08 }, at + 0.5)
    .to(tags, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06 }, at + 0.9);

  /* ================= Scene 4b — Messages ================= */
  at += D.pullBack;
  const message = (key: string, start: number, length: number) => {
    const el = v(key);
    tl.set(el, { autoAlpha: 1 }, start)
      .fromTo(el.querySelectorAll('[data-v="m-word"]'), { autoAlpha: 0, y: 40, rotationX: -60, transformPerspective: 700, transformOrigin: '50% 100%' }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.95, stagger: 0.09 }, start)
      .to(el, { autoAlpha: 0, y: -24, duration: 0.45, ease: EASE.exit }, start + length - 0.45);
  };
  tl.addLabel('paths', at);
  cue('paths', at);
  message('paths', at, D.paths);

  at += D.paths;
  tl.addLabel('join', at);
  cue('join', at);
  cue('lightsFlash', at + 0.3);
  message('join', at, D.join);
  tl.to(lights, { opacity: 1, duration: 0.6, stagger: 0.08 }, at + 0.3).to(beams, { opacity: 0.75, duration: 0.6, stagger: 0.08 }, at + 0.3);

  at += D.join;
  tl.addLabel('open', at);
  cue('registration', at);
  message('open', at, D.open);
  tl.to(leaves, { rotationY: -42, duration: 1.2, stagger: 0.08, ease: EASE.cinematic }, at + 0.2)
    .fromTo(v('open').querySelectorAll('.v-open__pix'), { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.7, stagger: 0.1, ease: 'back.out(2)' }, at + 0.4);

  /* ================= Scene 4c — End card ================= */
  at += D.open;
  tl.addLabel('endCard', at)
    .to(header, { autoAlpha: 0, duration: 0.5 }, at)
    .to(hall, { ...cam(0.8, W / 2, H, W / 2, H + 70), autoAlpha: 0.32, duration: 1.5, ease: EASE.cinematic }, at)
    .set(v('end'), { autoAlpha: 1 }, at + 0.3)
    .fromTo(vAll('end-item'), { autoAlpha: 0, y: 34, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1, stagger: 0.16 }, at + 0.4)
    .to(black, { autoAlpha: 1, duration: 0.7, ease: 'power1.in' }, at + D.endCard - 0.7);

  cue('endCard', at);
  cue('endItems', at + 0.4);
  cue('fadeOut', at + D.endCard - 0.7);
  // Pin the exact total length (the last tween already ends here).
  tl.set({}, {}, at + D.endCard);
  return tl;
}
