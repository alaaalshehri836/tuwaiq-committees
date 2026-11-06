/** Shown briefly while web fonts load so Arabic text never flashes unstyled. */
export function Loader() {
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="loader__grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} style={{ animationDelay: `${(i % 3) * 0.12 + Math.floor(i / 3) * 0.12}s` }} />
        ))}
      </div>
      <span className="loader__text">نادي طويق</span>
    </div>
  );
}
