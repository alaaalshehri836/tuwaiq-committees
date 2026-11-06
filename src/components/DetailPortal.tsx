import type { CSSProperties } from 'react';
import type { Committee } from '../data/committees';
import { PixelPattern } from './PixelPattern';

/** Floating pixel cubes: [top %, left %, size px]. */
const ORBIT: [number, number, number][] = [
  [12, 4, 10],
  [22, 88, 7],
  [44, -2, 6],
  [58, 94, 12],
  [78, 8, 8],
  [86, 82, 6],
  [4, 70, 6],
];

/** Large open doorway with the committee's floating 3D emblem. */
export function DetailPortal({ committee }: { committee: Committee }) {
  const Icon = committee.icon;
  return (
    <div className="dportal" aria-hidden="true">
      <div className="dportal__halo" />
      <div className="dportal__frame">
        <div className="dportal__opening">
          <div className="dportal__light" />
          <div className="dportal__rays" />
          <div data-a="dleaf" className="dportal__leaf">
            <PixelPattern pattern={committee.pattern} className="dportal__pattern" />
          </div>
        </div>
      </div>
      <div className="emblem3d">
        <div className="emblem3d__tile">
          <Icon strokeWidth={1.6} />
        </div>
      </div>
      <div className="orbit">
        {ORBIT.map(([top, left, size], i) => (
          <i key={i} style={{ top: `${top}%`, left: `${left}%`, width: size, '--i': i } as CSSProperties} />
        ))}
      </div>
      <div className="dportal__floor-glow" />
    </div>
  );
}
