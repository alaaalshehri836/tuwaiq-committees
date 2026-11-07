import type { ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';

interface Props {
  onHome?: () => void;
  start?: ReactNode;
  anim?: string;
}

/** Top bar: club wordmark (right, RTL) + status / actions (left). */
export function SiteHeader({ onHome, start, anim = 'header' }: Props) {
  return (
    <header className="site-header">
      <div data-a={anim} className="flex items-center gap-3">
        <BrandLogo onClick={onHome} />
        <span className="hidden h-7 w-px bg-white/15 sm:block" aria-hidden="true" />
        <span className="hidden text-xs leading-tight text-tq-lavender/80 sm:block">
          جامعة أم القرى
          <br />
          <span className="text-tq-snow/50">عمادة شؤون الطلاب</span>
        </span>
      </div>
      <div data-a={anim} className="flex items-center gap-3">
        {start ?? (
          <span className="status-pill">
            <span className="status-pill__dot" aria-hidden="true" />
            التسجيل مفتوح
          </span>
        )}
      </div>
    </header>
  );
}
