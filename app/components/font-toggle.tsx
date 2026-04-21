"use client";
import { useEffect, useState } from "react";

type FontMode = "sans" | "typewriter";

export default function FontToggle() {
  const [mode, setMode] = useState<FontMode>("sans");

  useEffect(() => {
    const stored = localStorage.getItem("fontMode") as FontMode | null;
    const initial: FontMode = stored ?? "sans";
    setMode(initial);
    applyMode(initial);
  }, []);

  function applyMode(m: FontMode) {
    document.documentElement.classList.toggle("body-typewriter", m === "typewriter");
  }

  function toggle() {
    const next: FontMode = mode === "sans" ? "typewriter" : "sans";
    setMode(next);
    localStorage.setItem("fontMode", next);
    applyMode(next);
  }

  return (
    <button
      onClick={toggle}
      title={mode === "sans" ? "Switch to typewriter font" : "Switch to sans-serif font"}
      className="ml-auto flex items-center gap-1 px-2 py-0.5 border-2 border-cream text-cream text-xs font-bold hover:bg-cream hover:text-ink transition-colors"
      style={{ fontFamily: "inherit", letterSpacing: "0.05em" }}
    >
      <span style={{ fontFamily: mode === "typewriter" ? "var(--font-typewriter)" : "inherit" }}>
        Aa
      </span>
    </button>
  );
}
