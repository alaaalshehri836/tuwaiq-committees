import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { COMMITTEES } from '../data/committees';
import type { CommitteeId } from '../types';
import { Backdrop } from '../components/Backdrop';
import { CommitteeDoor } from '../components/CommitteeDoor';
import { SiteHeader } from '../components/SiteHeader';
import { hallIntro, hallSelect, layoutHallArc } from '../animations/timelines';
import { useCompactLayout } from '../hooks/useMediaQuery';

interface Props {
  reduced: boolean;
  onSelect: (id: CommitteeId) => void;
  onHome: () => void;
  /** Door to bring into focus first (e.g. when returning from a committee). */
  initialId?: CommitteeId;
}

/** Scene 3 — the hall of five doors (curved row on desktop, carousel on mobile). */
export function HallScene({ reduced, onSelect, onHome, initialId }: Props) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const doors = useRef<(HTMLButtonElement | null)[]>([]);
  const busy = useRef(false);
  const action = useRef<gsap.core.Timeline | null>(null);
  const compact = useCompactLayout();
  const initialIndex = Math.max(0, COMMITTEES.findIndex((c) => c.id === initialId));
  const [active, setActive] = useState(initialIndex);

  // Curved arrangement on desktop, flat on mobile.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => layoutHallArc(root.current!, compact), root);
    return () => ctx.revert();
  }, [compact]);

  // Intro (once) — runs after the arc layout so it never snapshots a mid-animation state.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => hallIntro(root.current!, reduced), root);
    doors.current[initialIndex]?.focus({ preventScroll: true });
    return () => {
      ctx.revert();
      action.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToIndex = useCallback(
    (i: number, smooth = true) => {
      const slot = track.current?.children[i] as HTMLElement | undefined;
      slot?.scrollIntoView({ behavior: smooth && !reduced ? 'smooth' : 'auto', inline: 'center', block: 'nearest' });
    },
    [reduced],
  );

  // Mobile: start centered on the initial door and track the centered door while swiping.
  useEffect(() => {
    if (!compact) return;
    scrollToIndex(initialIndex, false);
    const el = track.current!;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = el.getBoundingClientRect().left + el.clientWidth / 2;
        let best = 0;
        let dist = Infinity;
        Array.from(el.children).forEach((child, i) => {
          const r = child.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - mid);
          if (d < dist) {
            dist = d;
            best = i;
          }
        });
        setActive(best);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [compact, initialIndex, scrollToIndex]);

  const select = (index: number) => {
    if (busy.current) return;
    // On the carousel, tapping a side door first brings it to the center.
    if (compact && index !== active) {
      scrollToIndex(index);
      return;
    }
    busy.current = true;
    const c = COMMITTEES[index];
    const slot = track.current!.children[index] as HTMLElement;
    action.current = hallSelect(root.current!, slot, c.accent, compact, reduced, () => onSelect(c.id));
  };

  const go = (index: number) => {
    const i = (index + COMMITTEES.length) % COMMITTEES.length;
    setActive(i);
    doors.current[i]?.focus({ preventScroll: compact });
    if (compact) scrollToIndex(i);
  };

  // Roving focus — arrows follow the visual RTL order.
  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const map: Record<string, number> = { ArrowLeft: i + 1, ArrowRight: i - 1, Home: 0, End: COMMITTEES.length - 1 };
    if (e.key in map) {
      e.preventDefault();
      go(map[e.key]);
    }
  };

  const current = COMMITTEES[active];

  return (
    <section ref={root} className="scene scene--locked scene--hall" aria-labelledby="hall-title">
      <Backdrop variant="hall" />
      <div className="relative z-10 flex h-full flex-col">
        <SiteHeader onHome={onHome} anim="hall-ui" />

        <div className="hall-copy">
          <p data-a="hall-copy" className="kicker">
            <span className="kicker__pix" aria-hidden="true" />
            اللجان الإدارية
          </p>
          <h1 id="hall-title" data-a="hall-copy" className="title-3d hall-title" tabIndex={-1}>
            خمسة أبواب.. واحدٌ منها لك
          </h1>
          <p data-a="hall-copy" className="hall-sub">
            {compact ? 'اسحب بين الأبواب واضغط على الباب لتكتشف اللجنة' : 'تجوّل بين الأبواب، واختر الباب الذي يشبهك لتكتشف ما خلفه'}
          </p>
        </div>

        <div className="hall-stage">
          <div ref={track} className="hall-track" role="group" aria-label="أبواب اللجان الإدارية">
            {COMMITTEES.map((c, i) => (
              <CommitteeDoor
                key={c.id}
                ref={(el) => {
                  doors.current[i] = el;
                }}
                committee={c}
                active={compact && i === active}
                onSelect={() => select(i)}
                onKeyDown={onKeyDown(i)}
                tabIndex={i === active ? 0 : -1}
              />
            ))}
          </div>
        </div>

        {compact && (
          <div data-a="hall-ui" className="carousel-ui">
            <button type="button" className="icon-btn" onClick={() => go(active - 1)} aria-label="الباب السابق">
              <ChevronRight aria-hidden="true" />
            </button>
            <div className="carousel-dots" role="tablist" aria-label="اختيار الباب">
              {COMMITTEES.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={c.name}
                  className="carousel-dot"
                  style={{ '--accent': c.accent } as CSSProperties}
                  onClick={() => go(i)}
                />
              ))}
            </div>
            <button type="button" className="icon-btn" onClick={() => go(active + 1)} aria-label="الباب التالي">
              <ChevronLeft aria-hidden="true" />
            </button>
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {compact ? `${current.name}: ${current.tagline}` : ''}
        </p>
      </div>
    </section>
  );
}
