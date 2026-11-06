# Tuwaiq Club | UQU — Administrative Committees Recruitment

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
