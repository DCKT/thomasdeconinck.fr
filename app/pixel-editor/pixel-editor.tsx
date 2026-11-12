"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Toolbar from "./toolbar";
import Palette from "./palette";

export type Tool = "pencil" | "eraser" | "fill" | "line" | "rect" | "ellipse" | "eyedropper";

type Grid = string[][];

const DEFAULT_SIZE = 32;
const DEFAULT_ZOOM = 16;
const HISTORY_LIMIT = 50;

function createEmptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function lineCells(r0: number, c0: number, r1: number, c1: number): [number, number][] {
  const cells: [number, number][] = [];
  let x0 = c0;
  let y0 = r0;
  const dx = Math.abs(c1 - c0);
  const dy = -Math.abs(r1 - r0);
  const sx = c0 < c1 ? 1 : -1;
  const sy = r0 < r1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    cells.push([y0, x0]);
    if (x0 === c1 && y0 === r1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
  return cells;
}

function rectCells(r0: number, c0: number, r1: number, c1: number): [number, number][] {
  const top = Math.min(r0, r1);
  const bottom = Math.max(r0, r1);
  const left = Math.min(c0, c1);
  const right = Math.max(c0, c1);
  const cells: [number, number][] = [];
  for (let c = left; c <= right; c++) {
    cells.push([top, c], [bottom, c]);
  }
  for (let r = top; r <= bottom; r++) {
    cells.push([r, left], [r, right]);
  }
  return cells;
}

function ellipseCells(r0: number, c0: number, r1: number, c1: number): [number, number][] {
  const top = Math.min(r0, r1);
  const bottom = Math.max(r0, r1);
  const left = Math.min(c0, c1);
  const right = Math.max(c0, c1);
  const cx = (left + right + 1) / 2;
  const cy = (top + bottom + 1) / 2;
  const rx = (right - left + 1) / 2;
  const ry = (bottom - top + 1) / 2;

  const inside = (r: number, c: number) => {
    const nx = (c + 0.5 - cx) / rx;
    const ny = (r + 0.5 - cy) / ry;
    return nx * nx + ny * ny <= 1;
  };

  const seen = new Set<string>();
  const cells: [number, number][] = [];
  const add = (r: number, c: number) => {
    const key = `${r},${c}`;
    if (!seen.has(key)) {
      seen.add(key);
      cells.push([r, c]);
    }
  };

  for (let r = top; r <= bottom; r++) {
    let cMin: number | null = null;
    let cMax: number | null = null;
    for (let c = left; c <= right; c++) {
      if (inside(r, c)) {
        if (cMin === null) cMin = c;
        cMax = c;
      }
    }
    if (cMin !== null && cMax !== null) {
      add(r, cMin);
      add(r, cMax);
    }
  }
  for (let c = left; c <= right; c++) {
    let rMin: number | null = null;
    let rMax: number | null = null;
    for (let r = top; r <= bottom; r++) {
      if (inside(r, c)) {
        if (rMin === null) rMin = r;
        rMax = r;
      }
    }
    if (rMin !== null && rMax !== null) {
      add(rMin, c);
      add(rMax, c);
    }
  }
  return cells;
}

function gridsEqual(a: Grid, b: Grid): boolean {
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    if (a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function isGridEmpty(grid: Grid): boolean {
  return grid.every((row) => row.every((cell) => !cell));
}

function maxZoomFor(size: number): number {
  return Math.max(4, Math.floor(1024 / size));
}

interface EditorState {
  grid: Grid;
  past: Grid[];
  future: Grid[];
}

type EditorAction =
  | { type: "setGrid"; grid: Grid }
  | { type: "commit"; grid: Grid; before: Grid }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; grid: Grid };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "setGrid":
      return { ...state, grid: action.grid };
    case "commit": {
      if (gridsEqual(action.grid, action.before)) return { ...state, grid: action.grid };
      return {
        grid: action.grid,
        past: [...state.past, action.before].slice(-HISTORY_LIMIT),
        future: [],
      };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        grid: previous,
        past: state.past.slice(0, -1),
        future: [state.grid, ...state.future],
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        grid: next,
        past: [...state.past, state.grid],
        future: state.future.slice(1),
      };
    }
    case "reset":
      return { grid: action.grid, past: [], future: [] };
    default:
      return state;
  }
}

function floodFill(grid: Grid, row: number, col: number, color: string): Grid {
  const size = grid.length;
  const target = grid[row][col];
  if (target === color) return grid;
  const next = cloneGrid(grid);
  const stack: [number, number][] = [[row, col]];
  while (stack.length) {
    const [r, c] = stack.pop()!;
    if (r < 0 || c < 0 || r >= size || c >= size) continue;
    if (next[r][c] !== target) continue;
    next[r][c] = color;
    stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
  }
  return next;
}

export default function PixelEditor() {
  const [gridSize, setGridSize] = useState(DEFAULT_SIZE);
  const [state, dispatch] = useReducer(editorReducer, DEFAULT_SIZE, (size) => ({
    grid: createEmptyGrid(size),
    past: [],
    future: [],
  }));
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#2a1810");
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const baseGridRef = useRef<Grid | null>(null);
  const startCellRef = useRef<[number, number] | null>(null);
  const lastCellRef = useRef<[number, number] | null>(null);

  const { grid } = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = gridSize * zoom;
    canvas.height = gridSize * zoom;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cellColor = grid[r][c];
        if (!cellColor) {
          ctx.fillStyle = (r + c) % 2 === 0 ? "#e8e0cc" : "#d8cfb5";
        } else {
          ctx.fillStyle = cellColor;
        }
        ctx.fillRect(c * zoom, r * zoom, zoom, zoom);
      }
    }

    if (zoom >= 8) {
      ctx.strokeStyle = "rgba(42, 24, 16, 0.15)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * zoom + 0.5, 0);
        ctx.lineTo(i * zoom + 0.5, gridSize * zoom);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * zoom + 0.5);
        ctx.lineTo(gridSize * zoom, i * zoom + 0.5);
        ctx.stroke();
      }
    }
  }, [grid, gridSize, zoom]);

  function getCell(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.min(gridSize - 1, Math.max(0, Math.floor(x / zoom)));
    const row = Math.min(gridSize - 1, Math.max(0, Math.floor(y / zoom)));
    return [row, col];
  }

  function isInsideCanvas(e: React.PointerEvent<HTMLCanvasElement>): boolean {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return x >= 0 && y >= 0 && x < rect.width && y < rect.height;
  }

  function undo() {
    dispatch({ type: "undo" });
  }

  function redo() {
    dispatch({ type: "redo" });
  }

  function endStroke() {
    isDrawingRef.current = false;
    baseGridRef.current = null;
    startCellRef.current = null;
    lastCellRef.current = null;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0) return;
    const [row, col] = getCell(e);
    canvasRef.current?.setPointerCapture(e.pointerId);

    if (tool === "eyedropper") {
      if (grid[row][col]) setColor(grid[row][col]);
      return;
    }

    if (tool === "fill") {
      const filled = floodFill(grid, row, col, color);
      if (filled !== grid) dispatch({ type: "commit", grid: filled, before: grid });
      return;
    }

    isDrawingRef.current = true;
    baseGridRef.current = cloneGrid(grid);
    startCellRef.current = [row, col];
    lastCellRef.current = [row, col];

    if (tool === "pencil" || tool === "eraser") {
      const next = cloneGrid(grid);
      next[row][col] = tool === "pencil" ? color : "";
      dispatch({ type: "setGrid", grid: next });
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (isDrawingRef.current && e.buttons === 0) {
      handlePointerUp();
      return;
    }
    if (!isDrawingRef.current || !baseGridRef.current || !startCellRef.current) return;

    if (tool === "pencil" || tool === "eraser") {
      if (!isInsideCanvas(e)) return;
      const [row, col] = getCell(e);
      const [lastRow, lastCol] = lastCellRef.current ?? [row, col];
      const value = tool === "pencil" ? color : "";
      const cellsToPaint = lineCells(lastRow, lastCol, row, col);
      lastCellRef.current = [row, col];
      let changed = false;
      const next = cloneGrid(grid);
      for (const [r, c] of cellsToPaint) {
        if (next[r][c] !== value) {
          next[r][c] = value;
          changed = true;
        }
      }
      if (changed) dispatch({ type: "setGrid", grid: next });
      return;
    }

    if (tool === "line" || tool === "rect" || tool === "ellipse") {
      const [row, col] = getCell(e);
      const [startRow, startCol] = startCellRef.current;
      const cells =
        tool === "line"
          ? lineCells(startRow, startCol, row, col)
          : tool === "rect"
            ? rectCells(startRow, startCol, row, col)
            : ellipseCells(startRow, startCol, row, col);
      const preview = cloneGrid(baseGridRef.current);
      for (const [r, c] of cells) preview[r][c] = color;
      dispatch({ type: "setGrid", grid: preview });
    }
  }

  function handlePointerUp() {
    if (!isDrawingRef.current || !baseGridRef.current) return;
    const before = baseGridRef.current;
    endStroke();
    dispatch({ type: "commit", grid, before });
  }

  function handleGridSizeChange(size: number) {
    setGridSize(size);
    setZoom((z) => Math.min(z, maxZoomFor(size)));
    endStroke();
    dispatch({ type: "reset", grid: createEmptyGrid(size) });
  }

  function handleZoomChange(nextZoom: number) {
    setZoom(Math.min(maxZoomFor(gridSize), Math.max(4, nextZoom)));
  }

  function handleClear() {
    if (isGridEmpty(grid)) return;
    dispatch({ type: "commit", grid: createEmptyGrid(gridSize), before: grid });
  }

  function handleExport() {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = gridSize;
    exportCanvas.height = gridSize;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c]) {
          ctx.fillStyle = grid[r][c];
          ctx.fillRect(c, r, 1, 1);
        }
      }
    }
    const link = document.createElement("a");
    link.download = "pixel-art.png";
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start min-h-[80vh]">
      <div className="flex flex-col gap-4 shrink-0 w-full md:w-56">
        <Toolbar
          tool={tool}
          onToolChange={setTool}
          zoom={zoom}
          onZoomChange={handleZoomChange}
          gridSize={gridSize}
          onGridSizeChange={handleGridSizeChange}
          canUndo={state.past.length > 0}
          canRedo={state.future.length > 0}
          onUndo={undo}
          onRedo={redo}
          onClear={handleClear}
          onExport={handleExport}
        />
        <Palette color={color} onChange={setColor} />
      </div>
      <div
        className="flex-1 w-full overflow-auto p-3 flex items-center justify-center"
        style={{
          backgroundColor: "#f4e8d0",
          border: "3px solid #2a1810",
          boxShadow: "3px 3px 0 #2a1810",
          maxHeight: "80vh",
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          style={{ imageRendering: "pixelated", cursor: "crosshair", touchAction: "none" }}
        />
      </div>
    </div>
  );
}
