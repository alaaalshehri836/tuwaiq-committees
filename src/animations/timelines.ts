import gsap from 'gsap';

/**
 * ============================================================
 *  Animation tuning — every duration / scale / ease in one place.
 *  Increase durations for a slower, more cinematic feel.
 * ============================================================
 */
export const MOTION = {
  ease: {
    enter: 'power3.out',
    exit: 'power2.in',
    cinematic: 'power3.inOut',
    push: 'power3.in',
  },
  entrance: {
    textOut: 0.45,
    doorOpen: 1.25,
    leafAngle: 104, // degrees each leaf swings
    cameraPush: 1.45,
    cameraScale: 7, // how far the "camera" flies into the door
  },
  hall: {
    intro: 1,
    stagger: 0.09,
    arcAngle: 9, // rotation (deg) per door away from the center → curved hall
    arcDepth: 46, // px pushed back per door away from the center
    focusMove: 0.85,
    focusScale: 1.3,
    doorOpen: 0.85,
    flood: 0.75,
  },
  detail: {
    intro: 0.8,
    stagger: 0.06,
    leafAngle: -72,
    exit: 0.4,
  },
} as const;

type Root = Element;
const all = (root: Root, key: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(`[data-a="${key}"]`));
const one = (root: Root, key: string) => root.querySelector<HTMLElement>(`[data-a="${key}"]`);

/** Full-screen light layer shared by every scene transition (rendered in App). */
export const getVeil = () => document.getElementById('scene-veil') as HTMLElement;

const fullCircle = (x: number, y: number) =>
  `circle(${Math.hypot(window.innerWidth, window.innerHeight) * 1.1}px at ${x}px ${y}px)`;

/** Fade the veil out — every scene's intro starts with this. */
function liftVeil(tl: gsap.core.Timeline, reduced: boolean) {
  tl.to(getVeil(), { autoAlpha: 0, duration: reduced ? 0.25 : 0.9, ease: 'power2.out' }, 0);
}

/** Flood the screen with accent light from a point, then call onComplete. */
export function floodVeil(
  color: string,
  x: number,
  y: number,
  reduced: boolean,
  onComplete: () => void,
  duration: number = MOTION.hall.flood,
) {
  const veil = getVeil();
  gsap.set(veil, { '--veil-color': color });
  if (reduced) {
    return gsap
      .timeline({ onComplete })
      .set(veil, { clipPath: fullCircle(x, y) })
      .to(veil, { autoAlpha: 1, duration: 0.25 });
  }
  return gsap.timeline({ onComplete }).fromTo(
    veil,
    { autoAlpha: 1, clipPath: `circle(0px at ${x}px ${y}px)` },
    { clipPath: fullCircle(x, y), duration, ease: 'power2.in' },
  );
}

/* ---------------------------------------------------------------- */
/*  Scene 1 — Entrance                                              */
/* ---------------------------------------------------------------- */

export function entranceIntro(root: Root, reduced: boolean) {
  const tl = gsap.timeline({ defaults: { ease: MOTION.ease.enter } });
  liftVeil(tl, reduced);
  if (reduced) return tl;
  tl.from(all(root, 'floor'), { autoAlpha: 0, duration: 1.4 }, 0)
    .from(all(root, 'lamp'), { y: -90, autoAlpha: 0, duration: 1.3 }, 0)
    .from(one(root, 'door'), { y: 70, scale: 0.9, autoAlpha: 0, duration: 1.5 }, 0.15)
    .from(all(root, 'header'), { y: -20, autoAlpha: 0, duration: 0.8 }, 0.3)
    .from(all(root, 'kicker'), { y: 16, autoAlpha: 0, duration: 0.7 }, 0.45)
    .from(
      all(root, 'word'),
      {
        y: 36,
        autoAlpha: 0,
        rotationX: -60,
        transformPerspective: 600,
        transformOrigin: '50% 100%',
        duration: 0.9,
        stagger: 0.08,
      },
      0.55,
    )
    .from(all(root, 'sub'), { y: 16, autoAlpha: 0, duration: 0.7 }, 0.95)
    .from(all(root, 'cta'), { y: 24, autoAlpha: 0, scale: 0.94, duration: 0.8 }, 1.1);
  return tl;
}

/** Scene 2 — the door opens, light pours out, the camera flies through. */
export function entranceOpen(root: Root, reduced: boolean, onComplete: () => void) {
  const veil = getVeil();
  const { entrance: m, ease } = MOTION;
  gsap.set(veil, { '--veil-color': '#9B5CFF', clipPath: fullCircle(innerWidth / 2, innerHeight / 2) });

  const tl = gsap.timeline({ onComplete });
  if (reduced) return tl.to(veil, { autoAlpha: 1, duration: 0.25 });

  const world = one(root, 'world')!;
  const door = one(root, 'door')!;
  const wr = world.getBoundingClientRect();
  const dr = door.getBoundingClientRect();
  const origin = `${dr.left + dr.width / 2 - wr.left}px ${dr.top + dr.height * 0.48 - wr.top}px`;

  const copy = ['header', 'kicker', 'word', 'sub', 'cta'].flatMap((k) => all(root, k));

  tl.to(copy, { autoAlpha: 0, y: -14, duration: m.textOut, stagger: 0.02, ease: ease.exit })
    // seam of light flares before the leaves move
    .to(one(root, 'seam'), { scaleX: 4, duration: 0.35, ease: 'power2.out' }, '-=0.15')
    .to(one(root, 'door-light'), { opacity: 1, duration: 0.5 }, '<')
    .to(one(root, 'leaf-l'), { rotationY: m.leafAngle, duration: m.doorOpen, ease: ease.cinematic }, '-=0.1')
    .to(one(root, 'leaf-r'), { rotationY: -m.leafAngle, duration: m.doorOpen, ease: ease.cinematic }, '<')
    .to(one(root, 'seam'), { autoAlpha: 0, duration: 0.3 }, '<0.1')
    .to(one(root, 'halo'), { scale: 1.6, opacity: 1, duration: m.doorOpen }, '<')
    .to(all(root, 'beam'), { opacity: 1, scaleY: 1.2, duration: m.doorOpen }, '<')
    // camera push through the doorway
    .set(world, { transformOrigin: origin }, '-=0.6')
    .to(world, { scale: m.cameraScale, duration: m.cameraPush, ease: ease.push }, '<')
    .to(veil, { autoAlpha: 1, duration: 0.6, ease: 'power1.in' }, '-=0.55');
  return tl;
}

/* ---------------------------------------------------------------- */
/*  Scene 3 — Committee hall                                        */
/* ---------------------------------------------------------------- */

/** Arrange the doors on a gentle curve (desktop) or flat (mobile carousel). */
export function layoutHallArc(root: Root, flat: boolean) {
  const slots = all(root, 'slot');
  const mid = (slots.length - 1) / 2;
  slots.forEach((slot, i) => {
    // RTL: index 0 is the right-most door.
    const offset = slots.length - 1 - i - mid;
    gsap.set(
      slot,
      flat
        ? { rotationY: 0, z: 0 }
        : { rotationY: -offset * MOTION.hall.arcAngle, z: -Math.abs(offset) * MOTION.hall.arcDepth },
    );
  });
}

export function hallIntro(root: Root, reduced: boolean) {
  const tl = gsap.timeline({ defaults: { ease: MOTION.ease.enter } });
  liftVeil(tl, reduced);
  if (reduced) return tl;
  tl.from(all(root, 'floor'), { autoAlpha: 0, duration: 1.2 }, 0)
    .from(all(root, 'hall-copy'), { y: 22, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.2)
    // fromTo (not from) so the end state is always explicit, never a captured mid-tween value
    .fromTo(
      all(root, 'slot'),
      { y: 90, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: MOTION.hall.intro, stagger: MOTION.hall.stagger },
      0.3,
    )
    .from(all(root, 'hall-ui'), { y: 12, autoAlpha: 0, duration: 0.6 }, 0.9);
  return tl;
}

/** Scene 4 transition — focus the chosen door, open it, flood with its accent. */
export function hallSelect(
  root: Root,
  slot: HTMLElement,
  accent: string,
  flat: boolean,
  reduced: boolean,
  onComplete: () => void,
) {
  const body = slot.querySelector<HTMLElement>('.cdoor__body')!;
  const r = body.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  if (reduced) return floodVeil(accent, cx, cy, true, onComplete);

  const { hall: m, ease } = MOTION;
  const leaf = slot.querySelector<HTMLElement>('[data-a="leaf"]');
  const light = slot.querySelector<HTMLElement>('[data-a="light"]');
  gsap.set([leaf, light, body], { transition: 'none' });

  const tx = flat ? cx : innerWidth / 2;
  const ty = flat ? cy : innerHeight / 2;
  const others = all(root, 'slot').filter((s) => s !== slot);
  const veil = getVeil();
  gsap.set(veil, { '--veil-color': accent });

  return gsap
    .timeline({ onComplete })
    .to(others, { autoAlpha: 0, y: 40, scale: 0.88, duration: 0.55, stagger: 0.04, ease: ease.exit })
    .to([...all(root, 'hall-copy'), ...all(root, 'hall-ui')], { autoAlpha: 0, y: -16, duration: 0.45, ease: ease.exit }, '<')
    .to(
      slot,
      {
        x: `+=${tx - cx}`,
        y: `+=${ty - cy}`,
        rotationY: 0,
        z: 0,
        scale: flat ? 1.08 : m.focusScale,
        duration: m.focusMove,
        ease: ease.cinematic,
      },
      '-=0.3',
    )
    .to(leaf, { rotationY: -112, duration: m.doorOpen, ease: ease.cinematic }, '-=0.3')
    .to(light, { opacity: 1, duration: 0.5 }, '<')
    .fromTo(
      veil,
      { autoAlpha: 1, clipPath: `circle(0px at ${tx}px ${ty}px)` },
      { clipPath: fullCircle(tx, ty), duration: m.flood, ease: 'power2.in' },
      '-=0.4',
    );
}

/* ---------------------------------------------------------------- */
/*  Scene 4 — Committee details                                     */
/* ---------------------------------------------------------------- */

export function detailIntro(root: Root, reduced: boolean) {
  const tl = gsap.timeline({ defaults: { ease: MOTION.ease.enter } });
  const leaf = one(root, 'dleaf');
  liftVeil(tl, reduced);
  if (reduced) {
    gsap.set(leaf, { rotationY: MOTION.detail.leafAngle });
    return tl;
  }
  tl.from(one(root, 'visual'), { scale: 0.82, autoAlpha: 0, duration: 1.1 }, 0.05)
    .fromTo(leaf, { rotationY: 0 }, { rotationY: MOTION.detail.leafAngle, duration: 1.5, ease: MOTION.ease.cinematic }, 0.15)
    .from(all(root, 'item'), { y: 26, autoAlpha: 0, duration: MOTION.detail.intro, stagger: MOTION.detail.stagger }, 0.25)
    .from(all(root, 'chrome'), { y: -10, autoAlpha: 0, duration: 0.6, stagger: 0.05 }, 0.4);
  return tl;
}

export function detailExit(root: Root, reduced: boolean, onComplete: () => void) {
  const tl = gsap.timeline({ onComplete, defaults: { ease: MOTION.ease.exit } });
  const d = reduced ? 0.15 : MOTION.detail.exit;
  tl.to(all(root, 'item'), { autoAlpha: 0, y: reduced ? 0 : -12, duration: d, stagger: reduced ? 0 : 0.02 })
    .to(one(root, 'visual'), { autoAlpha: 0, scale: reduced ? 1 : 0.9, duration: d }, '<')
    .to(all(root, 'chrome'), { autoAlpha: 0, duration: d }, '<');
  return tl;
}
