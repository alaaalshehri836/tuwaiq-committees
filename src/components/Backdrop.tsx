interface Props {
  lamp?: boolean;
  variant?: 'entrance' | 'hall' | 'detail';
}

/** Atmospheric background: gradient glow, wall grid, hanging lamp & reflective grid floor. */
export function Backdrop({ lamp = false, variant = 'entrance' }: Props) {
  return (
    <div className={`backdrop backdrop--${variant}`} aria-hidden="true">
      <div className="backdrop__glow" />
      <div className="backdrop__wall" />
      {lamp && (
        <div data-a="lamp" className="lamp">
          <div className="lamp__cord" />
          <div className="lamp__head" />
          <div data-a="beam" className="lamp__cone" />
        </div>
      )}
      <div data-a="floor" className="floor">
        <div className="floor__grid" />
        <div className="floor__sheen" />
      </div>
      <div className="backdrop__vignette" />
    </div>
  );
}
