"use client";

const SWATCHES = [
  "#2a1810",
  "#f4e8d0",
  "#c0392b",
  "#d4a84b",
  "#2d6b6b",
  "#5bbcb0",
  "#7a6b5a",
  "#e07060",
  "#000000",
  "#ffffff",
  "#3b2f2f",
  "#8b5a2b",
];

export default function Palette({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  return (
    <div
      className="p-3 flex flex-col gap-2"
      style={{
        backgroundColor: "#f4e8d0",
        border: "3px solid #2a1810",
        boxShadow: "3px 3px 0 #2a1810",
      }}
    >
      <span
        className="text-xs font-bold"
        style={{ fontFamily: "var(--font-display)", color: "#2a1810", letterSpacing: "0.05em" }}
      >
        Palette
      </span>
      <div className="grid grid-cols-6 gap-1">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`Color ${swatch}`}
            onClick={() => onChange(swatch)}
            className="w-6 h-6 cursor-pointer"
            style={{
              backgroundColor: swatch,
              border: color === swatch ? "2px solid #c0392b" : "1px solid #2a1810",
              boxSizing: "border-box",
            }}
          />
        ))}
      </div>
      <label className="flex items-center gap-2 mt-1">
        <span className="text-xs" style={{ color: "#2a1810" }}>
          Custom
        </span>
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-6 cursor-pointer"
          style={{ border: "1px solid #2a1810", padding: 0 }}
        />
      </label>
    </div>
  );
}
