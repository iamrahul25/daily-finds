"use client";

import { useState } from "react";

/** Big photo with thumbnails underneath. Shows `emoji` instead when there are no photos. */
export default function Gallery({
  photos,
  emoji,
  name,
  bg,
  tag,
}: {
  photos: string[];
  emoji?: string;
  name: string;
  bg: string;
  tag?: string;
}) {
  const [active, setActive] = useState(0);
  const count = photos.length;
  const step = (by: number) => setActive((i) => (i + by + count) % count);

  return (
    <div className="gallery">
      <div
        className="big"
        style={{ background: bg }}
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
      >
        {count ? <img src={photos[active]} alt={`${name}, photo ${active + 1} of ${count}`} /> : emoji}
        {tag && <span className="tag">{tag}</span>}
        {count > 1 && (
          <>
            <button className="nav prev" onClick={() => step(-1)} aria-label="Previous photo">
              ‹
            </button>
            <button className="nav next" onClick={() => step(1)} aria-label="Next photo">
              ›
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="thumbs">
          {photos.map((src, i) => (
            <button
              key={src}
              className={i === active ? "th on" : "th"}
              style={{ background: bg }}
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active || undefined}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
