"use client";

import { SKIN_EVENT, SKIN_IDS, SKINS, type SkinId } from "app/lib/skins";

function setSkin(id: SkinId) {
  document.documentElement.dataset.skin = id;
  try {
    localStorage.setItem("skin", id);
  } catch {}
  window.dispatchEvent(new CustomEvent(SKIN_EVENT, { detail: id }));
}

/** The active swatch is styled from html[data-skin] in CSS, so no state / hydration mismatch. */
export function SkinSwitcher() {
  return (
    <div className="skins" role="group" aria-label="Store skin">
      {SKIN_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className="skin-swatch"
          data-skin-option={id}
          title={`Skin: ${SKINS[id].label}`}
          aria-label={`Switch skin: ${SKINS[id].label}`}
          onClick={() => setSkin(id)}
        />
      ))}
    </div>
  );
}
