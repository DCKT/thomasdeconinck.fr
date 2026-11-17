"use client";

import { useEffect } from "react";
import { currentSkin, isMuted, playJingle, stopJingle } from "app/lib/chime";
import { SKIN_EVENT, type SkinId } from "app/lib/skins";

function setSound(on: boolean) {
  document.documentElement.dataset.sound = on ? "on" : "off";
  try {
    localStorage.setItem("sound", on ? "on" : "off");
  } catch {}
}

/**
 * Mute button. Also replays the jingle when the skin changes (that's a click, so it's allowed).
 * The welcome jingle itself is played by the "Click me" box over the store's door.
 * The icon is driven by html[data-sound] in CSS, so there is no hydration mismatch.
 */
export function SoundToggle() {
  useEffect(() => {
    const onSkin = (e: Event) => void playJingle((e as CustomEvent<SkinId>).detail);
    window.addEventListener(SKIN_EVENT, onSkin);
    return () => window.removeEventListener(SKIN_EVENT, onSkin);
  }, []);

  const toggle = () => {
    const on = isMuted();
    setSound(on);
    if (on) void playJingle(currentSkin());
    else stopJingle();
  };

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label="Toggle store jingle" title="Store jingle">
      <svg className="sound-on" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <svg className="sound-off" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
