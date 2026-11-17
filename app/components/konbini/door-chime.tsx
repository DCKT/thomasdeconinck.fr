"use client";

import { useEffect, useState } from "react";
import { currentSkin, playJingle, preloadJingle } from "app/lib/chime";
import { DOOR_SPOT } from "app/lib/skins";
import { ENTER_EVENT, PREFETCH_EVENT } from "./events";

/**
 * Floating "Click me" box pinned over the store's door: plays the skin's jingle and walks
 * you inside. Hovering / focusing it prefetches the walk-mode chunk.
 */
export function DoorChime({ index }: { index: number }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Warm the cache once the page is idle so the click plays instantly.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    idle(() => preloadJingle(currentSkin()));
  }, []);

  const ring = () => {
    void playJingle(currentSkin(), { force: true });
    window.dispatchEvent(new Event(ENTER_EVENT));
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), 1200);
  };

  return (
    <button
      type="button"
      className={`tag tag-door${playing ? " is-playing" : ""}`}
      data-spot={DOOR_SPOT.id}
      onClick={ring}
      onPointerEnter={() => window.dispatchEvent(new Event(PREFETCH_EVENT))}
      onFocus={() => window.dispatchEvent(new Event(PREFETCH_EVENT))}
      aria-label="Enter the store"
    >
      <span className="tag-body" style={{ "--i": index } as React.CSSProperties}>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
          <path d="M16 8.5a4.5 4.5 0 0 1 0 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Click me
      </span>
    </button>
  );
}
