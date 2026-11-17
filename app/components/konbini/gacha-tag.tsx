"use client";

import { GACHA_SPOT } from "app/lib/skins";
import { GACHA_EVENT, GACHA_PREFETCH_EVENT } from "./events";

/**
 * "Gacha !" tag pinned over the capsule machines: takes the camera to them.
 * Hovering / focusing it prefetches the gacha chunk.
 */
export function GachaTag({ index }: { index: number }) {
  const prefetch = () => window.dispatchEvent(new Event(GACHA_PREFETCH_EVENT));
  return (
    <button
      type="button"
      className="tag tag-gacha"
      data-spot={GACHA_SPOT.id}
      title={GACHA_SPOT.hint}
      onClick={() => window.dispatchEvent(new Event(GACHA_EVENT))}
      onPointerEnter={prefetch}
      onFocus={prefetch}
    >
      <span className="tag-body" style={{ "--i": index } as React.CSSProperties}>
        <small>ガチャポン</small>
        Gacha !
      </span>
    </button>
  );
}
