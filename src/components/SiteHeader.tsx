import type { ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';

interface Props {
  onHome?: () => void;
  start?: ReactNode;
  anim?: string;
}

/** Top bar: Tuwaiq Club logo (right, RTL) + status / actions (left). */
export function SiteHeader({ onHome, start, anim = 'header' }: Props) {
  return (
    <header className="site-header">
      <div data-a={anim} className="flex items-center gap-3">
        <BrandLogo onClick={onHome} />
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
