import { SKINS, type SkinId } from "app/lib/skins";
import { paintAtlas } from "./atlas";
import { buildWorld, LAMP_POS, STRIDE } from "./world";

/**
 * A tiny purpose-built WebGL2 renderer: every object is an instanced box, so the
 * whole store is one buffer, one texture and four draw calls per frame.
 */

type Vec3 = readonly [number, number, number];
type Mat4 = Float32Array;

/** A camera pose; `fov` is vertical, in radians. */
export type CameraPose = { eye: Vec3; target: Vec3; fov: number; near: number };

/** Extra geometry + atlas artwork attached after first render (the walkable interior). */
export type SceneExtra = {
  build: (skin: (typeof SKINS)[SkinId]) => Float32Array;
  paint: (canvas: HTMLCanvasElement, skin: (typeof SKINS)[SkinId]) => void;
};

export type Spot = { id: string; pos: Vec3; el: HTMLElement };

export type SceneOptions = {
  skin: SkinId;
  spots: Spot[];
  reducedMotion: boolean;
  onReady: () => void;
};

export type SceneHandle = {
  setSkin: (skin: SkinId) => void;
  /** Starts / stops all animation (rain, intro, pointer tracking). */
  setMotion: (on: boolean) => void;
  /** Freezes the pointer parallax, so a hovered tag stays still under the cursor. */
  setHold: (hold: boolean) => void;
  /** The orbit camera's latest pose (what the hero shows when nothing overrides it). */
  getOrbitPose: () => CameraPose;
  /** Replaces the orbit camera (walk mode), or gives control back with null. */
  setCamera: (pose: CameraPose | null) => void;
  /** Called at the start of every frame; keeps the loop running even with motion off. */
  setTicker: (tick: ((dt: number, now: number) => void) | null) => void;
  /** Sliding doors: 0 closed … 1 open. */
  setDoor: (open: number) => void;
  /** The wet-ground reflection pass is useless indoors: skip it there. */
  setReflection: (on: boolean) => void;
  setExtra: (extra: SceneExtra | null) => void;
  destroy: () => void;
};

const VERT = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNor;
layout(location=2) in vec3 iPos;
layout(location=3) in vec3 iSize;
layout(location=4) in vec4 iCol;
layout(location=5) in vec4 iUv;
layout(location=6) in vec2 iMisc;
layout(location=7) in vec4 iAnim;
uniform mat4 uVP;
uniform float uTime;
uniform float uMirror;
uniform float uDoor;
out vec3 vW;
out vec3 vN;
out vec4 vCol;
out vec2 vUv;
out float vTex;
out float vKind;
void main() {
  float c = cos(iMisc.x), s = sin(iMisc.x);
  vec3 p = aPos * iSize;
  p.xz = vec2(c * p.x + s * p.z, c * p.z - s * p.x);
  vec3 n = aNor;
  n.xz = vec2(c * n.x + s * n.z, c * n.z - s * n.x);
  vec3 w = iPos + p;
  if (iMisc.y >= 1.0 && iMisc.y < 2.0) {
    float y = mod(iPos.y - uTime * (15.0 + (iMisc.y - 1.0) * 9.0), 14.0);
    w.y = y + p.y;
    w.x += y * 0.07;
    // No rain indoors. Test the drop's centre, not each vertex, so a drop is culled whole.
    vec3 c = vec3(iPos.x + y * 0.07, y, iPos.z);
    if (abs(c.x) < 6.3 && c.z > -7.3 && c.z < 0.3 && c.y < 4.8) w = vec3(0.0, -60.0, 0.0);
  }
  vN = n;
  float em = iCol.a;
  float t = uTime;
  if (iAnim.x == 1.0) {          // drive: whole vehicle wraps around together
    w.x += mod(iAnim.z + t * iAnim.y + 45.0, 90.0) - 45.0 - iAnim.z;
  } else if (iAnim.x == 2.0) {   // flicker: short bursts of a dying tube
    float burst = step(fract(t * 0.13 + iAnim.z), 0.07);
    float blink = step(0.45, fract(sin(floor(t * 14.0) * 12.9898 + iAnim.z * 78.2) * 43758.5453));
    em *= 1.0 - burst * blink * iAnim.w;
  } else if (iAnim.x == 3.0) {   // bob
    w.y += sin(t * iAnim.y + iAnim.z) * iAnim.w;
  } else if (iAnim.x == 4.0) {   // sway, pivoting at the base
    w.x += sin(t * iAnim.y + iAnim.z) * iAnim.w * (aPos.y + 0.5);
  } else if (iAnim.x == 5.0) {   // sliding door
    w.x += iAnim.y * uDoor;
  }
  vW = w;
  vCol = vec4(iCol.rgb, em);
  vKind = iMisc.y;
  vTex = (aNor.z > 0.5 && iUv.z > 0.0) ? 1.0 : 0.0;
  vUv = mix(iUv.xy, iUv.zw, vec2(aPos.x + 0.5, 0.5 - aPos.y));
  w.y *= uMirror;
  gl_Position = uVP * vec4(w, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec3 vW;
in vec3 vN;
in vec4 vCol;
in vec2 vUv;
in float vTex;
in float vKind;
uniform sampler2D uAtlas;
uniform vec3 uLight;
uniform vec3 uLamp;
uniform vec3 uCam;
uniform float uMirror;
uniform float uTime;
out vec4 o;
const vec3 FOG = vec3(0.035, 0.043, 0.09);
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec4 t = vTex > 0.5 ? texture(uAtlas, vUv) : vec4(1.0);
  if (vKind >= 3.0 && vKind < 4.0) {            // glow sprite (additive)
    if (vTex < 0.5) discard;
    o = vec4(vCol.rgb * t.r * vCol.a, 1.0);
    return;
  }
  if (vKind >= 1.0 && vKind < 2.0) {            // rain streak (additive)
    o = vec4(vec3(0.11, 0.13, 0.19), 1.0);
    return;
  }
  vec3 base = vTex > 0.5 ? t.rgb : vCol.rgb;
  if (vKind >= 4.0) { o = vec4(base, 1.0); return; }

  vec3 n = normalize(vN);
  float em = vCol.a;
  // Night ambient + a hint of moonlight
  vec3 lit = base * vec3(0.3, 0.38, 0.62) * (0.2 + 0.16 * n.y + 0.14 * max(dot(n, normalize(vec3(-0.5, 0.6, 0.6))), 0.0));
  // Light spilling out of the storefront, approximated as a line light
  vec3 L = vec3(clamp(vW.x, -5.5, 5.5), 2.0, 0.4) - vW;
  float d2 = dot(L, L);
  lit += base * uLight * (0.25 + 0.75 * max(dot(n, L * inversesqrt(d2)), 0.0)) * smoothstep(-0.2, 0.3, vW.z) * 6.0 / (1.0 + d2 * 0.5);
  // Sodium street lamp
  vec3 L2 = uLamp - vW;
  float e2 = dot(L2, L2);
  lit += base * vec3(1.0, 0.6, 0.26) * max(dot(n, L2 * inversesqrt(e2)), 0.0) * 22.0 / (1.0 + e2);

  float shade = 0.74 + 0.26 * clamp(dot(n, normalize(vec3(0.25, 0.8, 0.55))), 0.0, 1.0);
  vec3 col = mix(lit, base * shade, min(em, 1.0)) * max(em, 1.0);

  float a = 1.0;
  if (vKind >= 2.0) {                           // wet asphalt: puddles let the reflection through
    float puddle = noise(vW.xz * 0.33) + 0.5 * noise(vW.xz * 1.3 + 7.0);
    vec3 V = normalize(uCam - vW);
    float fresnel = pow(1.0 - max(V.y, 0.0), 3.0);
    a = clamp(mix(0.86, 0.36, smoothstep(0.55, 1.0, puddle)) - fresnel * 0.4, 0.22, 1.0);
    col *= 0.8 + 0.4 * hash(floor(vW.xz * 36.0));
    // Raindrop ripples: one expanding ring per grid cell, each on its own clock
    vec2 g = vW.xz * 1.1;
    vec2 cell = floor(g);
    vec2 centre = 0.25 + 0.5 * vec2(hash(cell + 3.1), hash(cell + 7.7));
    float phase = fract(uTime * 0.8 + hash(cell));
    float ring = (1.0 - phase) * smoothstep(0.05, 0.0, abs(length(fract(g) - centre) - phase * 0.42));
    col += ring * vec3(0.35, 0.38, 0.5);
    a = max(a, ring * 0.9);
  }
  if (uMirror < 0.0) col *= 0.85 * exp(-vW.y * 0.1);

  float fog = max(smoothstep(-9.0, -52.0, vW.z), smoothstep(20.0, 70.0, abs(vW.x)));
  fog = max(fog, smoothstep(22.0, 90.0, vW.z));
  o = vec4(min(mix(col, FOG, fog), 1.0), a);
}`;

// ── Minimal column-major mat4 helpers ───────────────────────────────────────
function perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}

function lookAt(eye: Vec3, target: Vec3): Mat4 {
  let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
  const zl = 1 / Math.hypot(zx, zy, zz);
  zx *= zl; zy *= zl; zz *= zl;
  // x = up × z, with up = (0, 1, 0)
  let xx = zz, xz = -zx;
  const xl = 1 / Math.hypot(xx, xz);
  xx *= xl; xz *= xl;
  const yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;
  const m = new Float32Array(16);
  m[0] = xx; m[1] = yx; m[2] = zx;
  m[4] = 0; m[5] = yy; m[6] = zy;
  m[8] = xz; m[9] = yz; m[10] = zz;
  m[12] = -(xx * eye[0] + xz * eye[2]);
  m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  m[15] = 1;
  return m;
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

/** 36 vertices of a unit cube, interleaved position + normal. */
function cube(): Float32Array {
  const faces: [Vec3, Vec3, Vec3][] = [
    [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
    [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
    [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  ];
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
  const out: number[] = [];
  for (const [n, u, v] of faces) {
    for (const [a, b] of corners) {
      for (let i = 0; i < 3; i++) out.push((n[i] + a * u[i] + b * v[i]) / 2);
      out.push(n[0], n[1], n[2]);
    }
  }
  return new Float32Array(out);
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
  }
  return shader;
}

const FOV = (40 * Math.PI) / 180;
/** World width that must stay visible whatever the aspect ratio. */
const FRAME_WIDTH = 21;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function createScene(canvas: HTMLCanvasElement, options: SceneOptions): SceneHandle | null {
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "high-performance" });
  if (!gl) return null;

  let skin = SKINS[options.skin];
  let world = buildWorld(skin);
  const atlasCanvas = document.createElement("canvas");

  let program: WebGLProgram;
  let instances: WebGLBuffer;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};

  function setup() {
    program = gl!.createProgram()!;
    gl!.attachShader(program, compile(gl!, gl!.VERTEX_SHADER, VERT));
    gl!.attachShader(program, compile(gl!, gl!.FRAGMENT_SHADER, FRAG));
    gl!.linkProgram(program);
    if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) {
      throw new Error(gl!.getProgramInfoLog(program) ?? "program link failed");
    }
    gl!.useProgram(program);
    for (const name of ["uVP", "uTime", "uMirror", "uAtlas", "uLight", "uLamp", "uCam", "uDoor"]) {
      uniforms[name] = gl!.getUniformLocation(program, name);
    }

    gl!.bindVertexArray(gl!.createVertexArray());
    gl!.bindBuffer(gl!.ARRAY_BUFFER, gl!.createBuffer());
    gl!.bufferData(gl!.ARRAY_BUFFER, cube(), gl!.STATIC_DRAW);
    gl!.enableVertexAttribArray(0);
    gl!.vertexAttribPointer(0, 3, gl!.FLOAT, false, 24, 0);
    gl!.enableVertexAttribArray(1);
    gl!.vertexAttribPointer(1, 3, gl!.FLOAT, false, 24, 12);

    instances = gl!.createBuffer()!;
    gl!.bindBuffer(gl!.ARRAY_BUFFER, instances);
    for (let loc = 2; loc <= 7; loc++) {
      gl!.enableVertexAttribArray(loc);
      gl!.vertexAttribDivisor(loc, 1);
    }

    gl!.bindTexture(gl!.TEXTURE_2D, gl!.createTexture());
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR_MIPMAP_LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    const aniso = gl!.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl!.texParameterf(gl!.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);

    gl!.uniform1i(uniforms.uAtlas, 0);
    gl!.uniform3fv(uniforms.uLamp, LAMP_POS);
    gl!.enable(gl!.DEPTH_TEST);
    gl!.enable(gl!.CULL_FACE);
    gl!.disable(gl!.DITHER);
    gl!.clearColor(0.035, 0.043, 0.09, 1);
    upload();
  }

  let extra: SceneExtra | null = null;
  let extraRange = { first: 0, count: 0 };

  /** (Re)uploads geometry + textures for the current skin. */
  function upload() {
    paintAtlas(atlasCanvas, skin);
    extra?.paint(atlasCanvas, skin);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, atlasCanvas);
    gl!.generateMipmap(gl!.TEXTURE_2D);
    let data = world.data;
    if (extra) {
      const more = extra.build(skin);
      data = new Float32Array(world.data.length + more.length);
      data.set(world.data);
      data.set(more, world.data.length);
      extraRange = { first: world.data.length / STRIDE, count: more.length / STRIDE };
    } else {
      extraRange = { first: 0, count: 0 };
    }
    gl!.bindBuffer(gl!.ARRAY_BUFFER, instances);
    gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW);
    gl!.uniform3fv(uniforms.uLight, skin.light);
  }

  function draw(range: { first: number; count: number }) {
    const base = range.first * STRIDE * 4;
    const bytes = STRIDE * 4;
    gl!.vertexAttribPointer(2, 3, gl!.FLOAT, false, bytes, base);
    gl!.vertexAttribPointer(3, 3, gl!.FLOAT, false, bytes, base + 12);
    gl!.vertexAttribPointer(4, 4, gl!.FLOAT, false, bytes, base + 24);
    gl!.vertexAttribPointer(5, 4, gl!.FLOAT, false, bytes, base + 40);
    gl!.vertexAttribPointer(6, 2, gl!.FLOAT, false, bytes, base + 56);
    gl!.vertexAttribPointer(7, 4, gl!.FLOAT, false, bytes, base + 64);
    gl!.drawArraysInstanced(gl!.TRIANGLES, 0, 36, range.count);
  }

  // ── Camera state ──────────────────────────────────────────────────────────
  let width = 1, height = 1;
  let spotWidths: number[] = [];
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let hold = false;
  let moving = !options.reducedMotion;
  const start = performance.now();
  let last = start;
  let rainTime = 0;
  let ready = false;
  let override: CameraPose | null = null;
  let ticker: ((dt: number, now: number) => void) | null = null;
  let door = 0;
  let reflection = true;
  let orbitPose: CameraPose = { eye: [0, 3, 17], target: [0, 1.9, 0], fov: FOV, near: 0.5 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || 1;
    height = canvas.clientHeight || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    spotWidths = options.spots.map((s) => s.el.offsetWidth);
  }

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ticker?.(dt, now);
    const still = !moving;
    if (!still) rainTime += dt;
    const intro = still ? 1 : easeOut(Math.min((now - start) / 2200, 1));
    const k = still ? 1 : 1 - Math.exp(-dt * 4);
    pointer.sx += (pointer.x - pointer.sx) * k;
    pointer.sy += (pointer.y - pointer.sy) * k;

    const aspect = width / height;
    const portrait = aspect < 1;
    const fit = FRAME_WIDTH / 2 / (Math.tan(FOV / 2) * aspect);
    const dist = Math.max(17, fit) * (1 + (1 - intro) * 0.55) ;
    const target: Vec3 = [
      0.2,
      portrait ? 1.2 + fit * 0.03 : 1.9,
      0,
    ];

    const yaw = 0.3 + pointer.sx * 0.3 + (1 - intro) * 0.55;
    const eye: Vec3 = [
      target[0] + Math.sin(yaw) * dist,
      target[1] + 0.7 + dist * 0.07 - pointer.sy * 1.4 + (1 - intro) * 6,
      target[2] + Math.cos(yaw) * dist,
    ];
    orbitPose = { eye, target, fov: FOV, near: 0.5 };
    const pose = override ?? orbitPose;
    const vp = multiply(perspective(pose.fov, aspect, pose.near, 420), lookAt(pose.eye, pose.target));

    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniformMatrix4fv(uniforms.uVP, false, vp);
    gl!.uniform3fv(uniforms.uCam, pose.eye);
    gl!.uniform1f(uniforms.uTime, rainTime);
    gl!.uniform1f(uniforms.uDoor, door);
    gl!.depthMask(true);
    gl!.disable(gl!.BLEND);
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);

    // 1. The world mirrored through y = 0 (flips winding)…
    if (reflection) {
      gl!.uniform1f(uniforms.uMirror, -1);
      gl!.frontFace(gl!.CW);
      draw(world.mirrored);
      gl!.frontFace(gl!.CCW);
      gl!.clear(gl!.DEPTH_BUFFER_BIT);
    }
    gl!.uniform1f(uniforms.uMirror, 1);
    // 2. …seen through the semi-transparent wet ground
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);
    draw(world.ground);
    gl!.disable(gl!.BLEND);
    // 3. The world itself
    draw({ first: world.mirrored.first, count: world.mirrored.count + world.plain.count });
    if (extraRange.count) draw(extraRange);
    // 4. Additive glow + rain
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE);
    gl!.depthMask(false);
    draw(world.fx);

    // Pin the HTML price tags onto their 3D anchors (hidden while walking)
    if (!override) options.spots.forEach((spot, i) => {
      const [x, y, z] = spot.pos;
      const w = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
      const half = (spotWidths[i] || 0) / 2 + 8;
      let sx = ((vp[0] * x + vp[4] * y + vp[8] * z + vp[12]) / w * 0.5 + 0.5) * width;
      const sy = (0.5 - (vp[1] * x + vp[5] * y + vp[9] * z + vp[13]) / w * 0.5) * height;
      sx = Math.min(Math.max(sx, half), width - half);
      spot.el.style.transform = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0) translate(-50%,-100%)`;
    });

    if (!ready) {
      ready = true;
      options.onReady();
    }
  }

  // ── Loop control: only burn frames while the hero is actually on screen ───
  let raf = 0;
  let visible = true;
  const loop = (now: number) => {
    raf = 0;
    frame(now);
    schedule();
  };
  function schedule() {
    if (!raf && visible && !document.hidden && (moving || ticker) && !gl!.isContextLost()) {
      raf = requestAnimationFrame(loop);
    }
  }
  /** Draws one frame on demand (reduced motion, resize, skin change). */
  function invalidate() {
    if (!moving && !ticker && !gl!.isContextLost()) {
      last = performance.now();
      frame(last);
    } else {
      schedule();
    }
  }

  const onPointer = (e: PointerEvent) => {
    if (!moving || hold || override) return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  const onVisibility = () => {
    last = performance.now();
    schedule();
  };
  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onRestored = () => {
    setup();
    invalidate();
  };
  const resizeObserver = new ResizeObserver(() => {
    resize();
    invalidate();
  });
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    last = performance.now();
    schedule();
  });

  try {
    setup();
  } catch (error) {
    console.error("[konbini]", error);
    return null;
  }
  resize();
  resizeObserver.observe(canvas);
  intersectionObserver.observe(canvas);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  invalidate();

  return {
    setSkin(id) {
      skin = SKINS[id];
      world = buildWorld(skin);
      upload();
      invalidate();
    },
    setMotion(on) {
      moving = on;
      cancelAnimationFrame(raf);
      raf = 0;
      last = performance.now();
      invalidate();
    },
    setHold(value) {
      hold = value;
    },
    getOrbitPose: () => orbitPose,
    setCamera(pose) {
      override = pose;
      invalidate();
    },
    setTicker(tick) {
      ticker = tick;
      last = performance.now();
      invalidate();
    },
    setDoor(open) {
      door = open;
    },
    setReflection(on) {
      reflection = on;
    },
    setExtra(value) {
      extra = value;
      upload();
      invalidate();
    },
    destroy() {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    },
  };
}
