interface Props {
  onActivate: () => void;
}

function Leaf({ side }: { side: 'l' | 'r' }) {
  return (
    <div data-a={`leaf-${side}`} className={`portal__leaf portal__leaf--${side}`}>
      <span className="leaf-panel leaf-panel--top">
        <span className="leaf-pixels">
          <i /> <i /> <i /> <i />
        </span>
      </span>
      <span className="leaf-panel leaf-panel--bottom" />
      <span className="leaf-handle" />
    </div>
  );
}

/**
 * The entrance portal. Purely decorative for assistive tech — the
 * «اكتشف اللجان» button is the accessible control; clicking the door
 * is a mouse/touch shortcut for the same action.
 */
export function MainDoor({ onActivate }: Props) {
  return (
    <div data-a="door" className="portal-wrap" onClick={onActivate} aria-hidden="true">
      <div className="portal">
        <div data-a="halo" className="portal__halo" />
        <div className="portal__keystone">
          <i /> <i /> <i />
        </div>
        <div className="portal__frame">
          <div className="portal__opening">
            <div data-a="door-light" className="portal__light" />
            <Leaf side="l" />
            <Leaf side="r" />
            <div data-a="seam" className="portal__seam" />
          </div>
        </div>
        <span className="pix pix--tl" />
        <span className="pix pix--tr" />
        <span className="pix pix--bl" />
        <span className="pix pix--br" />
        <div className="portal__floor-glow" />
      </div>
    </div>
  );
}
