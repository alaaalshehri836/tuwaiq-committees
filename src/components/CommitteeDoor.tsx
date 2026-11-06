import { forwardRef, type CSSProperties, type KeyboardEvent } from 'react';
import type { Committee } from '../data/committees';
import { PixelPattern } from './PixelPattern';

interface Props {
  committee: Committee;
  active?: boolean;
  onSelect: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
  tabIndex?: number;
}

/** One of the five committee doors in the hall. */
export const CommitteeDoor = forwardRef<HTMLButtonElement, Props>(function CommitteeDoor(
  { committee, active = false, onSelect, onKeyDown, tabIndex },
  ref,
) {
  const Icon = committee.icon;
  return (
    <div data-a="slot" data-id={committee.id} className={`slot${active ? ' is-active' : ''}`} style={{ '--accent': committee.accent } as CSSProperties}>
      <span className="slot__beam" aria-hidden="true" />
      <button
        ref={ref}
        type="button"
        className="cdoor"
        onClick={onSelect}
        onKeyDown={onKeyDown}
        tabIndex={tabIndex}
        aria-label={`${committee.name} — ${committee.tagline}. افتح الباب`}
      >
        <span className="cdoor__num" dir="ltr" aria-hidden="true">
          0{committee.order}
        </span>
        <span className="cdoor__body" aria-hidden="true">
          <span className="cdoor__frame">
            <span className="cdoor__inner">
              <span data-a="light" className="cdoor__light" />
              <span data-a="leaf" className="cdoor__leaf">
                <PixelPattern pattern={committee.pattern} className="cdoor__pattern" />
                <span className="cdoor__emblem">
                  <Icon strokeWidth={1.75} />
                </span>
                <span className="cdoor__handle" />
              </span>
            </span>
          </span>
        </span>
        <span className="cdoor__plaque" aria-hidden="true">
          <span className="cdoor__name">{committee.name}</span>
          <span className="cdoor__tag">{committee.tagline}</span>
        </span>
      </button>
    </div>
  );
});
