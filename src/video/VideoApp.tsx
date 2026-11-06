import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { COMMITTEES as SITE_COMMITTEES } from '../data/committees';
import { Backdrop } from '../components/Backdrop';
import { MainDoor } from '../components/MainDoor';
import { CommitteeDoor } from '../components/CommitteeDoor';
import { Wordmark } from '../components/Wordmark';
import { BRAND, TAGLINES, TEXT, VIDEO } from './script';
import { createParticles, type ParticleState } from './particles';
import { buildMasterTimeline } from './masterTimeline';

declare global {
  interface Window {
    __videoReady?: boolean;
    __videoDuration?: number;
    __seek?: (t: number) => void;
  }
}

const noop = () => {};
/** Same committees as the website, with the video-specific taglines. */
const COMMITTEES = SITE_COMMITTEES.map((c) => ({ ...c, tagline: TAGLINES[c.id] }));
const words = (text: string, key = 'm-word') =>
  text.split(' ').map((w, i, arr) => (
    <span key={i}>
      <span data-v={key} className="inline-block">
        {w}
      </span>
      {i < arr.length - 1 ? ' ' : ''}
    </span>
  ));

const params = new URLSearchParams(window.location.search);
/** ?render — paused, frame-by-frame mode used by scripts/render-video.mjs */
const RENDER = params.has('render');
/** ?t=20 — start the preview at second 20 (handy while editing) */
const START = Number(params.get('t') ?? 0) || 0;
/** ?loop — replay forever in preview */
const LOOP = params.has('loop');

/**
 * Version B — the cinematic video. No interaction: one master timeline
 * plays the whole story on a fixed 1920×1080 stage.
 */
export default function VideoApp() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);

  // Preview: fit the 1920×1080 stage into the window. Render: always 1:1.
  useLayoutEffect(() => {
    if (RENDER) return;
    const fit = () => setScale(Math.min(window.innerWidth / VIDEO.width, window.innerHeight / VIDEO.height));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let tl: ReturnType<typeof buildMasterTimeline> | undefined;
    const state: ParticleState = { alpha: 0, warp: 0, tint: '' };

    (async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(stage.current!.querySelectorAll('img')).map((img) => img.decode().catch(() => {})));
      if (cancelled) return;
      const draw = createParticles(canvas.current!, state);
      tl = buildMasterTimeline(stage.current!, state);
      window.__videoDuration = tl.duration();

      if (RENDER) {
        document.documentElement.classList.add('is-rendering');
        // Deterministic seek: GSAP timeline + particles + every CSS keyframe animation.
        window.__seek = (t: number) => {
          tl!.seek(t, false);
          draw(t);
          for (const anim of document.getAnimations()) {
            anim.pause();
            anim.currentTime = t * 1000;
          }
        };
        window.__seek(0);
      } else {
        if (LOOP) tl.repeat(-1);
        tl.seek(START).play();
        const loop = () => {
          draw(tl!.time());
          raf = requestAnimationFrame(loop);
        };
        loop();
        // Operator shortcuts for previewing only (not part of the video): Space = pause, R = restart.
        window.addEventListener('keydown', (e) => {
          if (e.code === 'Space') tl!.paused(!tl!.paused());
          if (e.key === 'r' || e.key === 'R') tl!.restart();
        });
      }
      window.__videoReady = true;
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      tl?.kill();
    };
  }, []);

  return (
    <div className="v-viewport">
      <div
        ref={stage}
        className="v-stage"
        style={{ width: VIDEO.width, height: VIDEO.height, transform: `scale(${scale})` }}
        aria-label={`${TEXT.club} — ${TEXT.headline}`}
      >
        {/* ---------- World 1: entrance ---------- */}
        <div data-v="entrance" className="v-world">
          <Backdrop lamp variant="entrance" />
          <div className="v-entrance-copy">
            <div data-v="e-logo" className="v-entrance-logo">
              {BRAND.tuwaiqLogo ? <img src={BRAND.tuwaiqLogo} alt={TEXT.club} /> : <Wordmark className="v-wordmark-md" />}
            </div>
            <p data-v="e-kicker" className="kicker v-kicker">
              <span className="kicker__pix" aria-hidden="true" />
              {TEXT.kicker}
            </p>
            <h1 className="title-3d v-entrance-title">{words(TEXT.headline, 'e-word')}</h1>
            <p data-v="e-sub" className="v-entrance-sub">
              {TEXT.subline}
            </p>
          </div>
          <div className="v-door-area">
            <MainDoor onActivate={noop} />
          </div>
        </div>

        {/* ---------- World 2: the hall of five doors ---------- */}
        <div data-v="hall" className="v-world">
          <Backdrop variant="hall" />
          <div className="v-hall-copy">
            <p data-v="h-text" className="kicker v-kicker">
              <span className="kicker__pix" aria-hidden="true" />
              {TEXT.hallKicker}
            </p>
            <h2 data-v="h-text" className="title-3d v-hall-title">
              {TEXT.hallTitle}
            </h2>
          </div>
          <div className="v-track">
            {COMMITTEES.map((c) => (
              <CommitteeDoor key={c.id} committee={c} onSelect={noop} tabIndex={-1} />
            ))}
          </div>
        </div>

        {/* ---------- overlays ---------- */}
        <canvas ref={canvas} className="v-particles" aria-hidden="true" />

        {COMMITTEES.map((c) => (
          <div key={c.id} data-v="wash" className="v-wash" style={{ '--accent': c.accent } as CSSProperties} />
        ))}
        <div data-v="shade" className="v-shade" />

        {COMMITTEES.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.id} data-v="caption" className="v-caption" style={{ '--accent': c.accent } as CSSProperties}>
              <div className="v-caption__icon">
                <div className="emblem3d__tile">
                  <Icon strokeWidth={1.6} />
                </div>
              </div>
              <p data-v="cap-line" className="v-caption__num">
                <span dir="ltr">
                  {String(c.order).padStart(2, '0')} / {String(COMMITTEES.length).padStart(2, '0')}
                </span>
              </p>
              <h3 data-v="cap-line" className="v-caption__name">
                {c.name}
              </h3>
              <p data-v="cap-line" className="v-caption__tag">
                {c.tagline}
              </p>
              <span className="v-caption__bar" />
            </div>
          );
        })}

        <div data-v="paths" className="v-message">
          <h2 className="title-3d v-message__md">{words(TEXT.paths)}</h2>
        </div>
        <div data-v="join" className="v-message">
          <h2 className="title-3d v-message__xl">{words(TEXT.join)}</h2>
        </div>
        <div data-v="open" className="v-message">
          <h2 className="title-3d v-message__lg">
            <span className="v-open__pix" aria-hidden="true" />
            {words(TEXT.open)}
            <span className="v-open__pix v-open__pix--cyan" aria-hidden="true" />
          </h2>
        </div>

        <div data-v="end" className="v-end">
          <div data-v="end-item" className="v-end__logo">
            {BRAND.tuwaiqLogo ? <img src={BRAND.tuwaiqLogo} alt={TEXT.club} /> : <Wordmark className="v-wordmark-xl" />}
          </div>
          <p data-v="end-item" className="v-end__uni">
            {BRAND.uquLogo && <img src={BRAND.uquLogo} alt={TEXT.university} />}
            <span>{TEXT.club}</span>
            <span className="v-dot" />
            <span>{TEXT.university}</span>
          </p>
          <p data-v="end-item" className="v-end__open">
            <span className="status-pill__dot" aria-hidden="true" />
            {TEXT.open}
          </p>
          <p data-v="end-item" className="v-end__cta">
            {TEXT.cta}
          </p>
        </div>

        <header data-v="header" className="v-header">
          <div className="v-header__brand">
            {BRAND.tuwaiqLogo ? <img src={BRAND.tuwaiqLogo} alt="" className="v-header__logo" /> : <Wordmark />}
            <span className="v-header__sep" />
            <span className="v-header__uni">
              {TEXT.university}
              <br />
              <span>{TEXT.deanship}</span>
            </span>
          </div>
          {BRAND.uquLogo && <img src={BRAND.uquLogo} alt="" className="v-header__logo" />}
        </header>

        <div data-v="veil" className="v-veil" />
        <div data-v="black" className="v-black" />
      </div>
    </div>
  );
}
