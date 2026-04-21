"use client";
import { useEffect, useState } from "react";

export default function AnimationToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("filmAnimation");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // stored preference wins; otherwise default off if reduced-motion, on otherwise
    const initial = stored === null ? !prefersReduced : stored === "true";
    setEnabled(initial);
    applyState(initial);
  }, []);

  function applyState(on: boolean) {
    document.documentElement.classList.toggle("no-film", !on);
  }

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("filmAnimation", String(next));
    applyState(next);
  }

  return (
    <button
      onClick={toggle}
      title={enabled ? "Disable film effect" : "Enable film effect"}
      className="ml-auto flex items-center gap-1.5 px-2 py-0.5 border-2 text-xs font-bold transition-colors"
      style={{
        borderColor: "#f4e8d0",
        color: enabled ? "#2a1810" : "#f4e8d0",
        backgroundColor: enabled ? "#f4e8d0" : "transparent",
        fontFamily: "inherit",
        letterSpacing: "0.05em",
      }}
    >
      {/* Film strip icon */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="3.5" width="2" height="2" fill="currentColor"/>
        <rect x="1" y="7" width="2" height="2" fill="currentColor"/>
        <rect x="11" y="3.5" width="2" height="2" fill="currentColor"/>
        <rect x="11" y="7" width="2" height="2" fill="currentColor"/>
        <rect x="4" y="3" width="6" height="8" rx="0.5" fill="currentColor" opacity="0.4"/>
        {!enabled && (
          <line x1="1" y1="13" x2="13" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        )}
      </svg>
      {enabled ? "FX" : "FX"}
    </button>
  );
}
