interface Props {
  onClick?: () => void;
  className?: string;
}

/** Text wordmark inspired by the club's pixel logo. */
export function Wordmark({ onClick, className = '' }: Props) {
  const content = (
    <span className="wordmark" dir="ltr">
      <span className="wordmark__top">Tuwaiq</span>
      <span className="wordmark__bottom">
        CLUB
        <span className="wordmark__pix" aria-hidden="true">
          <i /> <i /> <i /> <i />
        </span>
      </span>
    </span>
  );
  if (!onClick) {
    return (
      <span className={className} aria-label="نادي طويق">
        {content}
      </span>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`wordmark-btn ${className}`} aria-label="نادي طويق — العودة للبداية">
      {content}
    </button>
  );
}
