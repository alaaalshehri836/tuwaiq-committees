/**
 * Official Tuwaiq Club logo, transparent version: extracted from the club's upload
 * (public/brand/tuwaiq-logo.png) by scripts/brand/make-transparent-logo.py —
 * "| UQU" and the purple plate removed, nothing redrawn.
 */
const LOGO_SRC = './brand/tuwaiq-logo-transparent.png';

interface Props {
  onClick?: () => void;
  className?: string;
}

export function BrandLogo({ onClick, className = '' }: Props) {
  const img = <img src={LOGO_SRC} alt="نادي طويق — Tuwaiq Club" className="brand-logo" width={331} height={232} />;
  if (!onClick) return <span className={className}>{img}</span>;
  return (
    <button type="button" onClick={onClick} className={`wordmark-btn ${className}`} aria-label="نادي طويق — العودة للبداية">
      {img}
    </button>
  );
}
