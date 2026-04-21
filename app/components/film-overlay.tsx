"use client";

export default function FilmOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        animation: "flicker 2.5s infinite",
      }}
    >
      {/* Grain */}
      <div
        style={{
          position: "absolute",
          inset: "-50%",
          width: "200%",
          height: "200%",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "300px 300px",
          opacity: 0.18,
          mixBlendMode: "multiply",
          animation: "grain 0.5s steps(6) infinite",
        }}
      />

      {/* Scratch 1 */}
      <div
        style={{
          position: "absolute",
          left: "23%",
          width: "1.5px",
          height: "120%",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(244,232,208,0.7) 20%, rgba(244,232,208,0.4) 50%, rgba(244,232,208,0.7) 80%, transparent 100%)",
          animation: "scratch1 5s linear infinite",
          opacity: 0,
        }}
      />
      {/* Scratch 2 */}
      <div
        style={{
          position: "absolute",
          left: "68%",
          width: "1px",
          height: "120%",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(244,232,208,0.6) 30%, rgba(244,232,208,0.3) 60%, transparent 100%)",
          animation: "scratch2 7s linear infinite",
          opacity: 0,
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(42,24,16,0.55) 100%)",
        }}
      />
    </div>
  );
}
