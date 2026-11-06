import { useEffect, useLayoutEffect, useRef, type CSSProperties, type MouseEvent } from 'react';
import gsap from 'gsap';
import { ArrowRight, ArrowUpLeft } from 'lucide-react';
import { COMMITTEES, type Committee } from '../data/committees';
import type { CommitteeId } from '../types';
import { getRegistrationUrl, isPlaceholderUrl } from '../config/registration';
import { Backdrop } from '../components/Backdrop';
import { DetailPortal } from '../components/DetailPortal';
import { SiteHeader } from '../components/SiteHeader';
import { detailExit, detailIntro, floodVeil } from '../animations/timelines';

interface Props {
  committee: Committee;
  reduced: boolean;
  onBack: () => void;
  onSwitch: (id: CommitteeId) => void;
  onHome: () => void;
}

/** Scene 4 — the committee information screen. */
export function CommitteeDetail({ committee, reduced, onBack, onSwitch, onHome }: Props) {
  const root = useRef<HTMLElement>(null);
  const busy = useRef(false);
  const action = useRef<gsap.core.Timeline | null>(null);
  const url = getRegistrationUrl(committee.id);
  const total = String(COMMITTEES.length).padStart(2, '0');

  useLayoutEffect(() => {
    const ctx = gsap.context(() => detailIntro(root.current!, reduced), root);
    root.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    return () => {
      ctx.revert();
      action.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const back = () => {
    if (busy.current) return;
    busy.current = true;
    action.current = detailExit(root.current!, reduced, onBack);
  };

  const switchTo = (c: Committee, e: MouseEvent<HTMLButtonElement>) => {
    if (busy.current) return;
    busy.current = true;
    const r = e.currentTarget.getBoundingClientRect();
    action.current = floodVeil(c.accent, r.left + r.width / 2, r.top + r.height / 2, reduced, () => onSwitch(c.id));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && back();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const others = COMMITTEES.filter((c) => c.id !== committee.id);

  return (
    <section
      ref={root}
      className="scene scene--detail"
      style={{ '--accent': committee.accent } as CSSProperties}
      aria-labelledby="committee-title"
    >
      <Backdrop variant="detail" />
      <div className="relative z-10 flex min-h-svh flex-col">
        <SiteHeader
          onHome={onHome}
          anim="chrome"
          start={
            <button type="button" className="btn-ghost" onClick={back}>
              <ArrowRight className="size-4" aria-hidden="true" />
              العودة إلى الأبواب
            </button>
          }
        />

        <div className="detail-grid">
          <div className="detail-content">
            <p data-a="item" className="detail-kicker" dir="rtl">
              <span className="detail-kicker__num" dir="ltr">
                {String(committee.order).padStart(2, '0')} / {total}
              </span>
              اللجان الإدارية · نادي طويق
            </p>
            <h1 id="committee-title" data-a="item" className="detail-title" tabIndex={-1}>
              {committee.name}
            </h1>
            <p data-a="item" className="detail-tagline">
              {committee.tagline}
            </p>
            <p data-a="item" className="detail-desc">
              {committee.description}
            </p>

            <h2 data-a="item" className="detail-subhead">
              أبرز المهام
            </h2>
            <ul className="resp-list">
              {committee.responsibilities.map((r) => (
                <li key={r} data-a="item" className="resp-item">
                  <span className="resp-bullet" aria-hidden="true" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>

            <div data-a="item" className="detail-actions">
              <a className="btn-primary btn-primary--accent btn-primary--xl" href={url} target="_blank" rel="noopener noreferrer">
                <span>انضم إلى اللجنة</span>
                <ArrowUpLeft className="btn-icon" aria-hidden="true" />
                <span className="sr-only">(يفتح نموذج التسجيل في نافذة جديدة)</span>
              </a>
              <button type="button" className="btn-ghost btn-ghost--lg" onClick={back}>
                استكشف باقي الأبواب
              </button>
            </div>
            {import.meta.env.DEV && isPlaceholderUrl(url) && (
              <p data-a="item" className="dev-note" dir="rtl">
                ⚠️ رابط تجريبي — ضع رابط النموذج الفعلي في <code dir="ltr">src/config/registration.ts</code>
              </p>
            )}
          </div>

          <div data-a="visual" className="detail-visual">
            <DetailPortal committee={committee} />
          </div>
        </div>

        <nav data-a="chrome" className="detail-switcher" aria-label="لجان أخرى">
          <span className="detail-switcher__label">لجان أخرى</span>
          <div className="detail-switcher__list">
            {others.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  className="chip"
                  style={{ '--accent': c.accent } as CSSProperties}
                  onClick={(e) => switchTo(c, e)}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {c.name}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </section>
  );
}
