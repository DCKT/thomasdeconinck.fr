/**
 * Gacha mode: the camera leaves the orbit, stands in front of the capsule machines and
 * cranks one. Like walk mode, this module (plus its HUD) is only downloaded on demand.
 * What comes out of the machine is the HUD's business (see gacha-hud.tsx).
 */
import { DEFAULT_MACHINE, GACHA, GACHA_COUNT, machineBase } from "./gacha-data";
import { playCrank, playDrop } from "./gacha-sound";
import type { CameraPose, SceneHandle } from "./scene";

type Vec3 = [number, number, number];

/**
 * enter → idle ⇄ turning → dropped → (idle | turning) … → exit
 * `dropped`: a capsule is out, the HUD shows it.
 */
export type GachaPhase = "enter" | "idle" | "turning" | "dropped" | "exit";

export type GachaHandle = {
  /** Cranks a machine (the last one used when omitted). Only from `idle` or `dropped`. */
  turn: (machine?: number) => void;
  /** Steps back from the machine to the whole bank. */
  back: () => void;
  exit: () => void;
  destroy: () => void;
};

const FOV = (36 * Math.PI) / 180;
const TAN = Math.tan(FOV / 2);
const NEAR = 0.1;
const CRANK_SECONDS = 1.5;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: readonly number[], b: readonly number[], t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const BANK_W = GACHA.cols * GACHA.w;
const BANK_CX = GACHA.x0 + BANK_W / 2;
const BANK_TOP = GACHA.y0 + GACHA.rows * GACHA.h + 0.3; // topper included

/** Distance at which a `halfW` × `halfH` rectangle fills the view. */
const fit = (halfW: number, halfH: number, aspect: number) => Math.max(halfH / TAN, halfW / (TAN * aspect));

/** The whole bank, seen by someone standing on the kerb. */
function bankPose(aspect: number): CameraPose {
  const cy = BANK_TOP / 2 + 0.05;
  const dist = fit(BANK_W / 2 + 0.3, BANK_TOP / 2 + 0.28, aspect);
  return {
    eye: [BANK_CX + dist * 0.1, cy + dist * 0.06, GACHA.front + dist],
    target: [BANK_CX, cy, GACHA.front],
    fov: FOV,
    near: NEAR,
  };
}

/** Leaning towards one machine. */
function machinePose(machine: number, aspect: number): CameraPose {
  const { x, y } = machineBase(machine);
  const cy = y + GACHA.h / 2;
  const dist = fit(GACHA.w / 2 + 0.22, GACHA.h / 2 + 0.3, aspect);
  return {
    eye: [x + dist * 0.12, cy + dist * 0.1, GACHA.front + dist],
    target: [x, cy - 0.03, GACHA.front],
    fov: FOV,
    near: NEAR,
  };
}

export function startGacha(
  scene: SceneHandle,
  canvas: HTMLCanvasElement,
  opts: {
    reducedMotion: boolean;
    onPhase: (phase: GachaPhase, machine: number) => void;
    onExit: () => void;
  },
): GachaHandle {
  const aspect = () => (canvas.clientWidth || 1) / (canvas.clientHeight || 1);

  let phase: GachaPhase = "enter";
  let machine = DEFAULT_MACHINE;
  /** Timed flights in and out; in between the camera simply eases towards `goal`. */
  let flight: { t: number; duration: number; from: CameraPose } | null = {
    t: 0,
    duration: opts.reducedMotion ? 0.01 : 2,
    from: scene.getOrbitPose(),
  };
  let pose: CameraPose = flight.from;
  let crank = 0; // 0..1 while turning
  let clacks = 0;
  const pointer = { x: 0, y: 0 };
  let done = false;

  function setPhase(next: GachaPhase) {
    phase = next;
    opts.onPhase(next, machine);
  }

  function goal(): CameraPose {
    const base = phase === "turning" || phase === "dropped" ? machinePose(machine, aspect()) : bankPose(aspect());
    if (opts.reducedMotion) return base;
    // A little parallax: you are standing there, not bolted to a tripod
    const eye: Vec3 = [base.eye[0] + pointer.x * 0.22, base.eye[1] - pointer.y * 0.1, base.eye[2]];
    return { ...base, eye };
  }

  const tick = (dt: number) => {
    if (flight) {
      flight.t = Math.min(flight.t + dt / flight.duration, 1);
      const e = easeInOut(flight.t);
      const to = phase === "exit" ? scene.getOrbitPose() : bankPose(aspect());
      const eye = lerp3(flight.from.eye, to.eye, e);
      eye[1] += Math.sin(Math.PI * e) * 0.5; // a slight arc over the street
      pose = {
        eye,
        target: lerp3(flight.from.target, to.target, e),
        fov: lerp(flight.from.fov, to.fov, e),
        near: lerp(flight.from.near, to.near, e),
      };
      if (flight.t >= 1) {
        flight = null;
        if (phase === "exit") {
          finish();
          opts.onExit();
          return;
        }
        setPhase("idle");
      }
    } else {
      const to = goal();
      const k = opts.reducedMotion ? 1 : 1 - Math.exp(-dt * 4.5);
      pose = { eye: lerp3(pose.eye, to.eye, k), target: lerp3(pose.target, to.target, k), fov: to.fov, near: to.near };
    }

    if (phase === "turning") {
      crank = Math.min(crank + dt / (opts.reducedMotion ? 0.01 : CRANK_SECONDS), 1);
      // "Gacha, gacha": two half turns with a breath in between
      const halves = easeInOut(clamp01(crank / 0.45)) + easeInOut(clamp01((crank - 0.5) / 0.45));
      if (clacks === 1 && crank >= 0.5) {
        clacks = 2;
        playCrank();
      }
      scene.setGacha(halves * Math.PI, Math.sin(Math.PI * crank), machine);
      if (crank >= 1) {
        scene.setGacha(0, 0, -1);
        playDrop();
        setPhase("dropped");
      }
    }
    scene.setCamera(pose);
  };

  /** Which machine is under a point of the canvas (-1: none): ray against the plane of the fronts. */
  function pick(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = 1 - ((clientY - rect.top) / rect.height) * 2;
    const [ex, ey, ez] = pose.eye;
    let fx = pose.target[0] - ex, fy = pose.target[1] - ey, fz = pose.target[2] - ez;
    const fl = Math.hypot(fx, fy, fz);
    fx /= fl; fy /= fl; fz /= fl;
    // right = forward × up, up' = right × forward
    let rx = -fz, rz = fx;
    const rl = Math.hypot(rx, rz);
    rx /= rl; rz /= rl;
    const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
    const tx = nx * TAN * (rect.width / rect.height), ty = ny * TAN;
    const dx = fx + rx * tx + ux * ty, dy = fy + uy * ty, dz = fz + rz * tx + uz * ty;
    if (dz >= 0) return -1;
    const t = (GACHA.front - ez) / dz;
    const col = Math.floor((ex + dx * t - GACHA.x0) / GACHA.w);
    const row = Math.floor((ey + dy * t - GACHA.y0) / GACHA.h);
    if (col < 0 || col >= GACHA.cols || row < 0 || row >= GACHA.rows) return -1;
    return row * GACHA.cols + col;
  }

  function turn(next = machine) {
    if ((phase !== "idle" && phase !== "dropped") || next < 0 || next >= GACHA_COUNT) return;
    machine = next;
    crank = 0;
    clacks = 1;
    playCrank();
    setPhase("turning");
  }

  function exit() {
    if (phase === "exit" || phase === "enter") return;
    scene.setGacha(0, 0, -1);
    canvas.style.cursor = "";
    flight = { t: 0, duration: opts.reducedMotion ? 0.01 : 1.7, from: pose };
    setPhase("exit");
  }

  const onPointerMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    canvas.style.cursor = phase === "idle" && pick(e.clientX, e.clientY) >= 0 ? "pointer" : "";
  };
  const onClick = (e: MouseEvent) => {
    if (phase !== "idle") return;
    const hit = pick(e.clientX, e.clientY);
    if (hit >= 0) turn(hit);
  };

  function finish() {
    if (done) return;
    done = true;
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("click", onClick);
    canvas.style.cursor = "";
    scene.setGacha(0, 0, -1);
    scene.setTicker(null);
    scene.setCamera(null);
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("click", onClick);
  scene.setTicker(tick);

  return {
    turn,
    back() {
      if (phase === "dropped") setPhase("idle");
    },
    exit,
    destroy: finish,
  };
}
