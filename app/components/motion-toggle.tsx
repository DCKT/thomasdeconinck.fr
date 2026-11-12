"use client";

import { MOTION_EVENT } from "app/lib/skins";

/** Pause / play every animation. The icon is driven by html[data-motion] in CSS. */
export function MotionToggle() {
  const toggle = () => {
    const on = document.documentElement.dataset.motion === "off";
    document.documentElement.dataset.motion = on ? "on" : "off";
    try {
      localStorage.setItem("motion", on ? "on" : "off");
    } catch {}
    window.dispatchEvent(new CustomEvent(MOTION_EVENT, { detail: on }));
  };

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label="Pause or play animations" title="Animations">
      <svg className="motion-pause" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
      </svg>
      <svg className="motion-play" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M8 5v14l11-7z" fill="currentColor" />
      </svg>
    </button>
  );
}
