/**
 * Official Tuwaiq Club logo (public/brand/tuwaiq-logo.png, uploaded by the club).
 * The badge file is a pixel-exact crop of it — never redrawn or recolored.
 */
const LOGO_SRC = './brand/tuwaiq-logo-badge.png';

interface Props {
  onClick?: () => void;
  className?: string;
}

export function BrandLogo({ onClick, className = '' }: Props) {
  const img = <img src={LOGO_SRC} alt="نادي طويق — Tuwaiq Club" className="brand-logo" width={465} height={365} />;
  if (!onClick) return <span className={className}>{img}</span>;
  return (
    <button type="button" onClick={onClick} className={`wordmark-btn ${className}`} aria-label="نادي طويق — العودة للبداية">
      {img}
    </button>
  );
}
