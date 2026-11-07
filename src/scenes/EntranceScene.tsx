import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft } from 'lucide-react';
import { Backdrop } from '../components/Backdrop';
import { MainDoor } from '../components/MainDoor';
import { SiteHeader } from '../components/SiteHeader';
import { entranceIntro, entranceOpen } from '../animations/timelines';

interface Props {
  reduced: boolean;
  onEnter: () => void;
}

const HEADLINE = ['فتح', 'التسجيل', 'في', 'اللجان', 'الإدارية'];

/** Scene 1 & 2 — the glowing door and its opening. */
export function EntranceScene({ reduced, onEnter }: Props) {
  const root = useRef<HTMLElement>(null);
  const busy = useRef(false);
  const action = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => entranceIntro(root.current!, reduced), root);
    return () => {
      ctx.revert();
      action.current?.kill();
    };
  }, [reduced]);

  const open = () => {
    if (busy.current) return;
    busy.current = true;
    action.current = entranceOpen(root.current!, reduced, onEnter);
  };

  return (
    <section ref={root} className="scene scene--locked" aria-labelledby="entrance-title">
      <div data-a="world" className="world">
        <Backdrop lamp variant="entrance" />

        <div className="relative z-10 flex h-full flex-col">
          <SiteHeader />

          <div className="entrance-copy">
            <p data-a="kicker" className="kicker">
              <span className="kicker__pix" aria-hidden="true" />
              نادي طويق
            </p>
            <h1 id="entrance-title" className="title-3d entrance-title">
              {HEADLINE.map((w, i) => (
                <span key={i}>
                  <span data-a="word" className="inline-block">
                    {w}
                  </span>
                  {i < HEADLINE.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>
            <p data-a="sub" className="entrance-sub">
              خمسة أبواب تنتظرك خلف هذا الباب.. أيّها بابك؟
            </p>
          </div>

          <div className="door-area">
            <MainDoor onActivate={open} />
          </div>

          <div className="entrance-cta">
            <button data-a="cta" type="button" className="btn-primary btn-primary--xl" onClick={open}>
              <span>اكتشف اللجان</span>
              <ArrowLeft className="btn-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
