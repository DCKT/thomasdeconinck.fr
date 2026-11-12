/**
 * Walk mode: first-person konbini. This module (plus the HUD) is only downloaded
 * when the visitor hovers / clicks the "Click me" box, so the home page stays light.
 */
import type { SKINS, SkinId } from "app/lib/skins";
import { FONT, rectUv } from "./atlas";
import type { ShelfGame } from "app/lib/steam";
import { PRINTS, type InteractionId } from "./interactions";
import { drawIcon, drawPixelated, loadCover } from "./pixel-icons";
import type { CameraPose, SceneExtra, SceneHandle } from "./scene";
import { ANIM, Bag, mulberry32 } from "./world";

type Skin = (typeof SKINS)[SkinId];
type Vec3 = [number, number, number];
type Rect = [x0: number, z0: number, x1: number, z1: number];

/**
 * Stand in a zone, look the right way (`facing` = direction you look along), press E.
 * The first match wins, so specific spots come before broad ones.
 */
const INTERACTIONS: { id: InteractionId; zone: Rect; facing: [number, number] }[] = [
  { id: "blog", zone: [-5.6, -2.15, -1.15, -0.85], facing: [0, 1] },
  { id: "editor", zone: [1.5, -1.75, 2.62, -1.03], facing: [0, 1] },
  { id: "games", zone: [2.85, -1.75, 3.62, -1.03], facing: [0, 1] },
  { id: "fried", zone: [2.6, -2.45, 3.62, -1.5], facing: [1, 0] },
  { id: "about", zone: [2.6, -3.1, 3.62, -2.45], facing: [1, 0] },
  { id: "oden", zone: [2.6, -4.2, 3.62, -3.1], facing: [1, 0] },
  { id: "coffee", zone: [2.6, -5.45, 3.62, -4.6], facing: [1, 0] },
  { id: "pixel-art", zone: [-1.25, -3.98, 1.95, -3.02], facing: [0, 1] },
  { id: "favorites", zone: [-4.35, -3.98, 1.95, -3.02], facing: [0, -1] },
  { id: "drinks", zone: [-5.05, -6.2, -4.35, -1.35], facing: [-1, 0] },
  { id: "onigiri", zone: [-5.05, -6.2, 3.8, -4.82], facing: [0, -1] },
  { id: "snacks", zone: [-4.35, -6.2, 1.95, -4.82], facing: [0, 1] },
  { id: "snacks", zone: [-4.35, -2.18, 1.95, -0.85], facing: [0, -1] },
];

/** Solid furniture and walls, in the XZ plane. Mirrors world.ts. */
const SOLIDS: Rect[] = [
  [-7, -8, -5.95, 1], [5.95, -8, 7, 1], [-7, -8, 7, -6.95], // walls
  [-7, -0.06, -1.1, 1], [1.1, -0.06, 7, 1], [-1.1, 0.02, 1.1, 1], // storefront, doors
  [-5.85, -0.85, -1.25, -0.4], [-2.55, -1.5, -2.05, -1.2], // magazine rack + reader
  [1.62, -1.03, 2.58, -0.37], [2.92, -1.03, 3.68, -0.37], // copy machine, ATM
  [3.85, -5.45, 5.95, -1.45], [3.7, -6.95, 5.95, -5.45], // counter + clerk, staff corner
  [-5.95, -6.95, -5.25, -1.35], // drink fridges
  [-5.25, -6.95, 3.8, -6.18], // chilled cases
  [-4.35, -3.02, 1.95, -2.18], [-4.35, -4.82, 1.95, -3.98], // gondolas
  [1.93, -3.0, 2.32, -2.2], [1.93, -4.8, 2.32, -4.0], // end caps
  [-1.85, -1.1, -1.35, -0.7], // baskets
];

const RADIUS = 0.25;
const EYE = 1.6;
const WALK_FOV = (70 * Math.PI) / 180;
const START: Vec3 = [0, EYE, -1.4];

// ── Interior extras (lazy geometry + atlas art, painted below y = 720) ──────
const SIGN_TEXTS = [
  ["雑誌", "BLOG"],
  ["ドリンク", "DRINKS"],
  ["おにぎり・弁当", "ONIGIRI"],
  ["お菓子", "SNACKS"],
  ["ドット絵", "PIXEL ART"],
  ["ゲーム", "GAMES I LOVE"],
  ["スイーツ", "SWEETS"],
  ["レジ", "REGISTER"],
  ["コピー・ATM", "EDITOR · GAMES"],
] as const;
const signRect = (i: number) => [(i % 5) * 408, 720 + Math.floor(i / 5) * 88, 400, 80] as const;
const cartRect = (i: number) => [i * 100, 896, 96, 96] as const;
const printRect = (i: number) => [800 + i * 100, 896, 96, 96] as const;
const MAX_CARTS = 8;

/** Hanging signs: `axis` = the direction their faces point; `a` / `b` = text on the + / - side. */
const SIGNS: { x: number; z: number; axis: "x" | "z"; a: number; b: number }[] = [
  { x: -3.5, z: -1.3, axis: "z", a: 0, b: 0 },
  { x: -4.85, z: -3.9, axis: "x", a: 1, b: 1 },
  { x: -0.75, z: -5.75, axis: "z", a: 2, b: 2 },
  { x: -1.2, z: -2.6, axis: "z", a: 3, b: 4 },
  { x: -1.2, z: -4.4, axis: "z", a: 5, b: 6 },
  { x: 4.25, z: -3.45, axis: "x", a: 7, b: 7 },
  { x: 2.7, z: -1.45, axis: "z", a: 8, b: 8 },
];

/** Images (prints + custom cartridge labels) are fetched on entry; painted once loaded. */
const images = new Map<string, HTMLImageElement>();
function loadImages(srcs: string[]) {
  return Promise.all(
    srcs.map(
      (src) =>
        new Promise<void>((resolve) => {
          if (images.has(src)) return resolve();
          const img = new Image();
          img.onload = () => {
            images.set(src, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  );
}

const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
const num = (css: string) => parseInt(css.slice(1), 16);
const brandOf = (skin: Skin) => (skin.colors[0] === 0xffffff ? skin.colors[1] : skin.colors[0]);
/** Set when walk mode starts (the data comes from the server: favourites + Steam). */
let featured: ShelfGame[] = [];
const covers = new Map<string, HTMLImageElement>();

/** Draws an image centred in a square, crisp (nearest neighbour), on white. */
function paintImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, [x, y, w, h]: readonly number[]) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);
  if (!img) return;
  const scale = Math.min((w - 8) / img.width, (h - 8) / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.imageSmoothingEnabled = true;
}

export const interior: SceneExtra = {
  paint(canvas, skin) {
    const ctx = canvas.getContext("2d")!;
    ctx.textBaseline = "middle";
    SIGN_TEXTS.forEach(([jp, en], i) => {
      const [x, y, w, h] = signRect(i);
      ctx.fillStyle = hex(brandOf(skin));
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y + h - 8, w, 8);
      ctx.textAlign = "left";
      ctx.font = `800 24px ${FONT}`;
      ctx.fillText(jp, x + 18, y + h / 2 - 4);
      ctx.textAlign = "right";
      ctx.font = `900 ${en.length > 10 ? 26 : 32}px ${FONT}`;
      ctx.fillText(en, x + w - 18, y + h / 2 - 4);
    });

    // Cartridge labels: the game's own pixel art if provided, else a generated one
    featured.forEach((game, i) => {
      const [x, y, w, h] = cartRect(i);
      if (game.image) {
        paintImage(ctx, images.get(game.image), [x, y, w, h]);
        return;
      }
      ctx.fillStyle = game.label;
      ctx.fillRect(x, y, w, h);
      const cover = covers.get(game.title);
      if (cover) drawPixelated(ctx, cover, x + 13, y + 1, 70, 24);
      else drawIcon(ctx, game.icon, game.palette, x + 18, y + 6, 5);
      ctx.fillStyle = "#1b1b1f";
      ctx.fillRect(x, y + h - 26, w, 26);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = `800 ${game.title.length > 12 ? 9 : 12}px ${FONT}`;
      ctx.fillText(game.title.toUpperCase(), x + w / 2, y + h - 13, w - 6);
    });

    PRINTS.forEach((print, i) => paintImage(ctx, images.get(print.src), printRect(i)));
  },

  build(skin) {
    const bag = new Bag();
    const rnd = mulberry32(11);
    const candy = [0xe63946, 0xf4a261, 0xffd166, 0x2a9d8f, 0x4cc9f0, 0xf72585, 0x8ac926, 0x7b2cbf];
    const pick = () => candy[Math.floor(rnd() * candy.length)];
    const brand = brandOf(skin);

    // Floor tiles
    for (let x = -5.4; x < 6; x += 0.6) bag.box(x, 0.16, -3.5, 0.012, 0.004, 6.9, 0xaab2b8, 0.75);
    for (let z = -6.6; z < 0; z += 0.6) bag.box(0, 0.16, z, 11.9, 0.004, 0.012, 0xaab2b8, 0.75);

    // Magazines facing the inside of the store
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 13; i++) bag.box(-5.6 + i * 0.34, 0.68 + row * 0.5, -0.78, 0.27, 0.38, 0.04, pick(), 0.95);
    }

    // Hanging signs: two boxes back to back, with a gap so their faces never z-fight
    for (const sign of SIGNS) {
      for (const side of [1, -1]) {
        const uv = rectUv(signRect(side > 0 ? sign.a : sign.b));
        if (sign.axis === "z") {
          bag.box(sign.x, 3.05, sign.z + side * 0.007, 1.6, 0.32, 0.01, 0xffffff, 1, uv, side > 0 ? 0 : Math.PI);
        } else {
          bag.box(sign.x + side * 0.007, 3.05, sign.z, 1.6, 0.32, 0.01, 0xffffff, 1, uv, (side * Math.PI) / 2);
        }
      }
      for (const e of [-0.6, 0.6]) {
        if (sign.axis === "z") bag.box(sign.x + e, 3.21, sign.z, 0.015, 0.8, 0.015, 0x9aa0a6, 0.6);
        else bag.box(sign.x, 3.21, sign.z + e, 0.015, 0.8, 0.015, 0x9aa0a6, 0.6);
      }
    }

    // Games shelf, eye level: featured favourites on little stands, then filler carts
    // Featured near the main-aisle end, where you step into the aisle
    const shelfY = 1.0, edge = -4.02, gap = 0.4;
    const span = (featured.length - 1) * gap;
    const mid = Math.min(1.0, 1.62 - span / 2);
    const first = mid - span / 2;
    featured.forEach((game, i) => {
      const x = first + i * gap;
      bag.box(x, shelfY, edge - 0.08, 0.3, 0.02, 0.14, 0xf5f7fa, 0.95); // acrylic stand
      bag.box(x, shelfY + 0.02, edge - 0.085, 0.25, 0.3, 0.035, num(game.shell), 0.95);
      bag.box(x, shelfY + 0.3, edge - 0.085, 0.19, 0.025, 0.036, 0x1b1b1f, 0.9); // grip ridge
      bag.box(x, shelfY + 0.08, edge - 0.066, 0.21, 0.2, 0.004, 0xffffff, 1, rectUv(cartRect(i)));
      bag.box(x, shelfY - 0.05, edge + 0.002, 0.14, 0.03, 0.004, 0xffe94d, 1.1); // price tag
    });
    const start = featured.length ? first - gap / 2 : mid;
    const end = featured.length ? first + (featured.length - 1) * gap + gap / 2 : mid;
    for (let x = -4.16; x < 1.8; x += 0.13) {
      if (x > start - 0.06 && x < end + 0.06) continue;
      bag.box(x, shelfY, edge - 0.0425, 0.1, 0.12, 0.025, [0x8a8f98, 0x3a3d45, 0x6b7280, 0xd1d5db][Math.floor(rnd() * 4)], 0.95);
      bag.box(x, shelfY + 0.045, edge - 0.028, 0.08, 0.055, 0.004, pick(), 1);
    }

    // Pixel art prints on the back of gondola 1 (facing the middle aisle)
    PRINTS.forEach((_, i) => {
      const x = -0.9 + (i % 4) * 0.7;
      const y = i < 4 ? 0.95 : 0.56;
      bag.box(x, y, -2.69, 0.36, 0.36, 0.02, 0x2b2e35, 0.8);
      bag.box(x, y + 0.03, -2.702, 0.3, 0.3, 0.004, 0xffffff, 1, rectUv(printRect(i)), Math.PI);
    });

    // Shopping baskets by the door
    for (let i = 0; i < 4; i++) bag.box(-1.6, 0.16 + i * 0.14, -0.9, 0.48, 0.2, 0.34, brand, 0.85);

    // The clerk waves now and then
    bag.anim = [ANIM.sway, 2.4, 0, 0.12];
    bag.box(4.9, 1.35, -2.45, 0.1, 0.4, 0.1, 0xf1c9a5, 0.9);

    return new Float32Array(bag.data);
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: readonly number[], b: readonly number[], t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const bezier = (p0: readonly number[], p1: Vec3, p2: Vec3, p3: readonly number[], t: number): Vec3 => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [0, 1, 2].map((i) => a * p0[i] + b * p1[i] + c * p2[i] + d * p3[i]) as Vec3;
};
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function blocked(x: number, z: number) {
  for (const [x0, z0, x1, z1] of SOLIDS) {
    if (x > x0 - RADIUS && x < x1 + RADIUS && z > z0 - RADIUS && z < z1 + RADIUS) return true;
  }
  return false;
}

function inZone([x0, z0, x1, z1]: Rect, x: number, z: number) {
  return x > x0 && x < x1 && z > z0 && z < z1;
}

// ── Controller ──────────────────────────────────────────────────────────────
export type WalkHandle = {
  /** Uses whatever the player stands in front of. */
  interact: () => void;
  exit: () => void;
  /** Freezes movement while a panel is open. */
  setPaused: (paused: boolean) => void;
  /** On-screen D-pad: forward (-1..1) and turn (-1..1). */
  setVirtual: (forward: number, turn: number) => void;
  destroy: () => void;
};

export function startWalk(
  scene: SceneHandle,
  canvas: HTMLCanvasElement,
  opts: {
    reducedMotion: boolean;
    games: ShelfGame[];
    onPrompt: (id: InteractionId | null) => void;
    onInteract: (id: InteractionId) => void;
    onControl: () => void;
    /** Leaving has started: the HUD should get out of the way. */
    onRelease: () => void;
    onExit: () => void;
  },
): WalkHandle {
  featured = opts.games.slice(0, MAX_CARTS);
  scene.setExtra(interior);
  // Prints, custom labels and Steam covers arrive a moment later: repaint once they are in
  const pending = [...PRINTS.map((p) => p.src), ...featured.flatMap((g) => (g.image ? [g.image] : []))];
  const coverLoads = featured.map(async (g) => {
    if (g.image || !g.covers || covers.has(g.title)) return;
    const img = await loadCover(g.covers);
    if (img) covers.set(g.title, img);
  });
  void Promise.all([loadImages(pending), ...coverLoads]).then(() => scene.setExtra(interior));

  type Transition = { kind: "enter" | "exit"; t: number; duration: number; from: CameraPose };
  let transition: Transition | null = {
    kind: "enter",
    t: 0,
    duration: opts.reducedMotion ? 0.01 : 2.6,
    from: scene.getOrbitPose(),
  };

  const pos: Vec3 = [...START];
  let yaw = 0;
  let pitch = -0.011;
  let velX = 0, velZ = 0;
  let stride = 0;
  let door = 0;
  let paused = false;
  let prompt: InteractionId | null = null;
  const keys = new Set<string>();
  const virtual = { forward: 0, turn: 0 };
  let pose: CameraPose = transition.from;

  const walkPose = (): CameraPose => {
    const bob = opts.reducedMotion ? 0 : Math.sin(stride * 7) * 0.035 * Math.min(Math.hypot(velX, velZ) / 2, 1);
    const eye: Vec3 = [pos[0], EYE + bob, pos[2]];
    const cp = Math.cos(pitch);
    return {
      eye,
      target: [eye[0] - Math.sin(yaw) * cp, eye[1] + Math.sin(pitch), eye[2] - Math.cos(yaw) * cp],
      fov: WALK_FOV,
      near: 0.06,
    };
  };

  function setPrompt(next: InteractionId | null) {
    if (next !== prompt) {
      prompt = next;
      opts.onPrompt(next);
    }
  }

  function exit() {
    if (transition) return;
    keys.clear();
    setPrompt(null);
    opts.onRelease();
    transition = { kind: "exit", t: 0, duration: opts.reducedMotion ? 0.01 : 2.2, from: pose };
  }

  function tickTransition(tr: Transition, dt: number) {
    tr.t = Math.min(tr.t + dt / tr.duration, 1);
    const e = easeInOut(tr.t);
    const { from } = tr;
    if (tr.kind === "enter") {
      const end = walkPose();
      const eye = bezier(from.eye, [from.eye[0] * 0.35, 2.4, 7.5], [0, 1.7, 2.6], end.eye, e);
      const target = lerp3(from.target, end.target, smooth(0, 0.55, e));
      pose = { eye, target, fov: lerp(from.fov, WALK_FOV, e), near: lerp(from.near, end.near, smooth(0, 0.6, e)) };
    } else {
      const orbit = scene.getOrbitPose();
      const eye = bezier(from.eye, [0, EYE, -0.6], [orbit.eye[0] * 0.3, 2.2, 6], orbit.eye, e);
      const target = lerp3(from.target, orbit.target, smooth(0.25, 1, e));
      pose = { eye, target, fov: lerp(from.fov, orbit.fov, e), near: lerp(from.near, orbit.near, smooth(0.4, 1, e)) };
    }
    if (tr.t >= 1) {
      transition = null;
      if (tr.kind === "enter") {
        opts.onControl();
      } else {
        finish();
        opts.onExit();
      }
    }
  }

  function tickWalk(dt: number) {
    const k = (code: string) => (keys.has(code) ? 1 : 0);
    const forward = paused ? 0 : k("KeyW") + k("ArrowUp") - k("KeyS") - k("ArrowDown") + virtual.forward;
    const strafe = paused ? 0 : k("KeyD") - k("KeyA");
    const turn = paused ? 0 : k("ArrowRight") - k("ArrowLeft") + virtual.turn;
    const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 4.2 : 2.6;

    yaw -= turn * 2.1 * dt;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let wx = fx * forward + rx * strafe;
    let wz = fz * forward + rz * strafe;
    const len = Math.hypot(wx, wz);
    if (len > 1) {
      wx /= len;
      wz /= len;
    }
    const a = 1 - Math.exp(-dt * 12);
    velX += (wx * speed - velX) * a;
    velZ += (wz * speed - velZ) * a;

    // Axis-separated moves let you slide along shelves instead of sticking to them
    const nx = pos[0] + velX * dt;
    if (!blocked(nx, pos[2])) pos[0] = nx;
    else velX = 0;
    const nz = pos[2] + velZ * dt;
    if (!blocked(pos[0], nz)) pos[2] = nz;
    else velZ = 0;
    stride += Math.hypot(velX, velZ) * dt;

    // Walking up to the doors means leaving
    if (pos[2] > -0.4 && Math.abs(pos[0]) < 1.1 && velZ > 0.3) {
      exit();
      return;
    }

    const lookX = -Math.sin(yaw), lookZ = -Math.cos(yaw);
    const spot = INTERACTIONS.find(
      (i) => inZone(i.zone, pos[0], pos[2]) && lookX * i.facing[0] + lookZ * i.facing[1] > 0.5,
    );
    setPrompt(spot?.id ?? null);
    pose = walkPose();
  }

  const tick = (dt: number) => {
    if (transition) tickTransition(transition, dt);
    else tickWalk(dt);

    // Automatic doors: open while the camera is near them
    const near = Math.abs(pose.eye[0]) < 2.2 && pose.eye[2] > -2.2 && pose.eye[2] < 4;
    door += ((near ? 1 : 0) - door) * (opts.reducedMotion ? 1 : 1 - Math.exp(-dt * 6));
    scene.setDoor(door);
    scene.setReflection(pose.eye[2] > -0.3);
    scene.setCamera(pose);
  };

  // ── Input ─────────────────────────────────────────────────────────────────
  const MOVE_KEYS = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"];
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === "Escape") {
      exit();
      return;
    }
    if (transition || paused) return;
    if (MOVE_KEYS.includes(e.code)) {
      keys.add(e.code);
      e.preventDefault();
    } else if ((e.code === "KeyE" || e.code === "Enter" || e.code === "Space") && !e.repeat) {
      e.preventDefault();
      handle.interact();
    }
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
  const onBlur = () => keys.clear();

  let drag: { x: number; y: number; id: number } | null = null;
  const onPointerDown = (e: PointerEvent) => {
    if (transition) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!drag || drag.id !== e.pointerId || paused) return;
    yaw -= (e.clientX - drag.x) * 0.005;
    pitch = Math.min(Math.max(pitch - (e.clientY - drag.y) * 0.004, -0.9), 0.9);
    drag.x = e.clientX;
    drag.y = e.clientY;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (drag?.id === e.pointerId) drag = null;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  scene.setTicker(tick);

  function finish() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    scene.setTicker(null);
    scene.setCamera(null);
    scene.setDoor(0);
    scene.setReflection(true);
  }

  const handle: WalkHandle = {
    interact() {
      if (prompt && !transition && !paused) opts.onInteract(prompt);
    },
    exit,
    setPaused(value) {
      paused = value;
      keys.clear();
    },
    setVirtual(forward, turn) {
      virtual.forward = forward;
      virtual.turn = turn;
    },
    destroy: finish,
  };
  return handle;
}
