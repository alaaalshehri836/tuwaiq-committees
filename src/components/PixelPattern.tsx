interface Props {
  pattern: string[];
  className?: string;
}

/** Renders a 5×5 pixel glyph from rows of "0"/"1". */
export function PixelPattern({ pattern, className = '' }: Props) {
  return (
    <span className={`pixel-pattern ${className}`} aria-hidden="true">
      {pattern.join('').split('').map((bit, i) => (
        <i key={i} className={bit === '1' ? 'on' : undefined} />
      ))}
    </span>
  );
}
