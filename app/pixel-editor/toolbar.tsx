"use client";

import type { Tool } from "./pixel-editor";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "pencil", label: "Pen" },
  { id: "eraser", label: "Eraser" },
  { id: "fill", label: "Fill" },
  { id: "line", label: "Line" },
  { id: "rect", label: "Rect" },
  { id: "ellipse", label: "Oval" },
  { id: "eyedropper", label: "Pick" },
];

const GRID_SIZES = [16, 32, 64];

function Button({
  onClick,
  disabled,
  active,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-bold px-2 py-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        fontFamily: "var(--font-typewriter)",
        backgroundColor: active ? "#c0392b" : "#f4e8d0",
        color: active ? "#f4e8d0" : "#2a1810",
        border: "2px solid #2a1810",
      }}
    >
      {children}
    </button>
  );
}

export default function Toolbar({
  tool,
  onToolChange,
  zoom,
  onZoomChange,
  gridSize,
  onGridSizeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onExport,
}: {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
}) {
  return (
    <div
      className="p-3 flex flex-col gap-3"
      style={{
        backgroundColor: "#f4e8d0",
        border: "3px solid #2a1810",
        boxShadow: "3px 3px 0 #2a1810",
      }}
    >
      <div>
        <span
          className="text-xs font-bold"
          style={{ fontFamily: "var(--font-display)", color: "#2a1810", letterSpacing: "0.05em" }}
        >
          Tools
        </span>
        <div className="flex flex-wrap gap-1 mt-1">
          {TOOLS.map(({ id, label }) => (
            <Button key={id} onClick={() => onToolChange(id)} active={tool === id}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <Button onClick={onUndo} disabled={!canUndo}>
          Undo
        </Button>
        <Button onClick={onRedo} disabled={!canRedo}>
          Redo
        </Button>
        <Button onClick={onClear}>Clear</Button>
        <Button onClick={onExport}>Export PNG</Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "#2a1810" }}>
          Zoom
        </span>
        <Button onClick={() => onZoomChange(Math.max(4, zoom - 4))}>-</Button>
        <span className="text-xs w-8 text-center" style={{ color: "#2a1810" }}>
          {zoom}px
        </span>
        <Button onClick={() => onZoomChange(Math.min(32, zoom + 4))}>+</Button>
      </div>

      <div>
        <span className="text-xs" style={{ color: "#2a1810" }}>
          Canvas size
        </span>
        <div className="flex gap-1 mt-1">
          {GRID_SIZES.map((size) => (
            <Button key={size} onClick={() => onGridSizeChange(size)} active={gridSize === size}>
              {size}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
