# Tuwaiq Club | UQU — Administrative Committees Recruitment

This project contains **two independent versions** built on the same design system:

| | Version A — Interactive website | Version B — Cinematic video |
|---|---|---|
| Entry | `index.html` → `src/App.tsx` | `video.html` → `src/video/VideoApp.tsx` |
| Behavior | Visitors open doors and pick a committee | Plays a ~40 s story automatically, no interaction |
| Output | Static website (`dist/`) | MP4 files in `video/` |

Version B reuses Version A's components, styles, palette and committee data without modifying them. The interactive site is also backed up as git tag `v1-interactive` and branch `interactive-website`.

---

## Version B — Cinematic video

### Files
- `video/tuwaiq-committees-1080p.mp4` — master: 1920×1080, 30 fps, H.264 High, yuv420p, 40.3 s, no audio.
- `video/tuwaiq-committees-web-720p.mp4` — lighter version for websites, with fast start for streaming.
- `video/poster.jpg` — poster frame.
- `video/embed-example.html` — ready-to-copy `<video>` embed.

### Sound (original score + sound design)
- `video/tuwaiq-committees-1080p-audio.mp4`: **final film with sound** (H.264 + AAC 256 kb/s, 48 kHz stereo).
- `video/tuwaiq-committees-web-720p-audio.mp4`: web version with sound (AAC 160 kb/s).
- `video/audio/tuwaiq-soundtrack.wav`: the mastered soundtrack on its own (24-bit, 48 kHz).
- The silent `*-1080p.mp4` / `*-720p.mp4` files are kept unchanged. The audio versions copy their video stream bit-for-bit.

**Licensing.** All music and effects are synthesized from scratch by `scripts/sound/compose.py`, with no samples and no third-party music. The soundtrack is therefore original and royalty-free.

**How it stays in sync.** The master timeline contains `cue:*` labels at the exact visual moments: logo, latch, door leaves, camera flight, each committee reveal, registration message and end card. `scripts/export-cues.mjs` reads those times from the running timeline, and every sound is placed on them. The bar length of the music equals one committee highlight, so the beat locks to the picture. If you change the video timing, re-run the audio step and it follows automatically.

```bash
npm run render:audio     # after render:video — rebuilds soundtrack + muxes the *-audio.mp4 files
```
Mix levels (`LEVEL`) and loudness targets (`TARGET_LUFS` = -14, `TRUE_PEAK` = -1.5 dBTP) are at the top of `scripts/sound/compose.py`. It needs Python 3 with `numpy` and `scipy`.

### Preview & render
```bash
npm run dev:video        # live preview at http://localhost:5173/video.html
                         #   ?t=20  start at 20 s   ·   ?loop  loop forever
                         #   Space = pause, R = restart (preview only)
npm run render:video     # build + render every frame → video/*.mp4 + poster
npm run render:video -- --from 17 --to 26 --out video/test.mp4   # render a section only
```
Rendering requires **FFmpeg** on your PATH and **Playwright's Chromium**. To install Playwright:
```bash
npm i -D playwright && npx playwright install chromium
```

**How rendering works.** The video is one paused GSAP master timeline. For each frame, the render script calls `window.__seek(t)`, which sets four things to exactly time `t`:
- the GSAP timeline
- the seeded particle canvas
- every CSS keyframe animation
- (CSS transitions are disabled in the video)

It then takes a lossless screenshot and pipes it into FFmpeg (x264, CRF 16). Because nothing depends on real time, the output has no dropped or missing frames and is identical on every run.

### Edit the video
| What | Where |
|---|---|
| All on-screen texts | `src/video/script.ts` → `TEXT` |
| Length of each scene (total length = sum) | `src/video/script.ts` → `DURATIONS` |
| Committee taglines (video only) | `src/video/script.ts` → `TAGLINES` |
| Logo | `public/brand/tuwaiq-logo.png` is the official upload (source, unchanged). `tuwaiq-logo-transparent.png` is extracted from it by `python3 scripts/brand/make-transparent-logo.py` ("\| UQU" and the purple plate removed into a real alpha channel, nothing redrawn) and is used by both the website and the video. |
| Committee names, taglines, colors, icons | `src/data/committees.ts` and `src/theme/palette.ts`. These are shared with the website. |
| Camera moves, effects, offsets inside scenes | `src/video/masterTimeline.ts` (one section per scene) |
| Video layout & type sizes | `src/video/video.css` |
| Particles | `src/video/particles.ts` |
| Music & sound effects | `scripts/sound/compose.py` (one section per scene) |

After editing, run `npm run render:video` again.

### Storyboard (default timing)
| Time | Scene |
|---|---|
| 0–1.8 s | Entrance: official logo, «فتح التسجيل في اللجان الإدارية», «اكتشف الفرص التي تنتظرك في طويق» (all within ~1 s), door glows |
| 1.8–5.3 s | Door opens (from ~2 s), camera flies through the light |
| 5.3–9.1 s | The hall: five doors rise |
| 9.1–23.6 s | Each committee in turn: camera close-up, accent light, name + tagline |
| 23.6–34.4 s | Pull back · «خمسة مسارات، وفرص متعددة للمساهمة» · «كن جزءًا من طويق» · «التسجيل مفتوح الآن» |
| 34.4–40.3 s | End card: official logo, UQU branding, «اختر لجنتك وابدأ رحلتك معنا», fade out |

### Embed on a website
```html
<video src="tuwaiq-committees-web-720p.mp4" poster="poster.jpg"
       autoplay muted playsinline loop controls preload="metadata"
       style="width:100%;aspect-ratio:16/9"></video>
```

---

## Version A — Interactive website

An Arabic-first (RTL) interactive site: a glowing door opens onto a hall with five committee doors. Each door leads to a committee page with a «انضم إلى اللجنة» button.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · GSAP · Lucide React. The 3D effects use CSS and GSAP, with no Three.js or WebGL.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the build locally
```

`dist/` is a static site that works on any host (Netlify, Vercel, GitHub Pages, a sub-folder, etc.). Routing uses the URL hash, so the host needs no server config.

Deep links:
- `#/` — the entrance door
- `#/committees` — the hall
- `#/committees/<id>` — a committee page, for example `#/committees/media`

## Where to edit things

| What | File |
|---|---|
| **Registration form URLs** | `src/config/registration.ts` |
| Committee names, taglines, descriptions, responsibilities, icons, door pixel glyphs, order | `src/data/committees.ts` |
| Committee accent colors | `src/theme/palette.ts` (`ACCENTS`) |
| Global palette (Tailwind tokens + CSS) | `src/styles/index.css` (`@theme`) and the `:root` variables at the top of `src/styles/components.css` |
| Particle colors (canvas) | `src/theme/palette.ts` (`PALETTE`) |
| Animation durations, eases, camera zoom, hall curve | `src/animations/timelines.ts` (`MOTION`) |
| Entrance headline and copy | `src/scenes/EntranceScene.tsx` |
| Hall headline and copy | `src/scenes/HallScene.tsx` |

### Registration URLs
Every URL is currently a placeholder containing `REPLACE-ME`. While a placeholder remains:
- the browser console prints a warning
- in dev mode, an orange "رابط تجريبي" note appears under the button

Production builds never show that note. The button opens the form in a new tab.

### Committee ids
The ids are `media`, `hr`, `quality-of-life`, `sports` and `relations`. If you add or rename one, update `src/types.ts` too.

## Structure

```
src/
  config/registration.ts   registration links (edit me)
  data/committees.ts       committee content (edit me)
  theme/palette.ts         JS colors (accents + particles)
  animations/timelines.ts  every GSAP timeline + MOTION tuning
  hooks/useMediaQuery.ts   reduced-motion & breakpoint hooks
  components/              MainDoor, CommitteeDoor, DetailPortal, PixelField, Backdrop, ...
  scenes/                  EntranceScene, HallScene, CommitteeDetail
  styles/                  Tailwind tokens + cinematic component CSS
  App.tsx                  hash router, scene switching, transition veil
```

## Accessibility & behavior
- **Reduced motion:** `prefers-reduced-motion` turns every transition into a short fade, stops idle animations and draws the particles as a single static frame.
- **Keyboard:**
  - Tab and Enter work everywhere.
  - In the hall, the arrow keys, Home and End move between doors, following the RTL order.
  - Esc on a committee page returns to the hall.
  - Focus moves to each new scene's heading.
- **Mobile (< 900px):**
  - The hall becomes a swipe carousel with dots and arrow buttons.
  - Tapping a side door centers it; tapping the centered door opens it.
- **Back button:** the browser back button works between scenes.
