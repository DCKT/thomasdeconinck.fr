import { isMuted } from "app/lib/chime";
import type { RarityId } from "./gacha-data";

/** Gachapon sound effects, synthesized (no files) and silent when the store jingle is muted. */
const VOLUME = 0.16;
let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined" || isMuted()) return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state !== "running") void ctx.resume().catch(() => {});
  return ctx;
}

/** Everything goes through one compressor, so the big stacked chords do not clip. */
let master: DynamicsCompressorNode | null = null;
function out(ac: AudioContext) {
  if (!master || master.context !== ac) {
    master = ac.createDynamicsCompressor();
    master.threshold.value = -14;
    master.ratio.value = 6;
    master.connect(ac.destination);
  }
  return master;
}

function tone(ac: AudioContext, midi: number, at: number, length: number, gain = 1, type: OscillatorType = "sine") {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  const t0 = ac.currentTime + at;
  osc.type = type;
  osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(VOLUME * gain, t0 + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(env).connect(out(ac));
  osc.start(t0);
  osc.stop(t0 + length + 0.05);
}

/** A short burst of filtered noise: plastic on plastic. */
function click(ac: AudioContext, at: number, freq: number, gain = 1) {
  const length = 0.05;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * length), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  const source = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const env = ac.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 1.4;
  env.gain.value = VOLUME * 2.2 * gain;
  source.connect(filter).connect(env).connect(out(ac));
  source.start(ac.currentTime + at);
}

/** Half a turn of the handle: the ratchet. */
export function playCrank() {
  const ac = audio();
  if (!ac) return;
  for (let i = 0; i < 6; i++) click(ac, i * 0.075, 1500 + (i % 2) * 500, 0.7 + i * 0.05);
}

/** The capsule falls into the chute. */
export function playDrop() {
  const ac = audio();
  if (!ac) return;
  click(ac, 0, 700, 1.3);
  tone(ac, 43, 0, 0.22, 1.4);
  click(ac, 0.16, 900, 0.7);
  tone(ac, 48, 0.16, 0.14, 0.7);
}

/** A rising swell of filtered noise, for the big reveals. */
function whoosh(ac: AudioContext, at: number, length: number, gain = 1) {
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * length), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const env = ac.createGain();
  const t0 = ac.currentTime + at;
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.Q.value = 2;
  filter.frequency.setValueAtTime(300, t0);
  filter.frequency.exponentialRampToValueAtTime(5000, t0 + length);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(VOLUME * 1.6 * gain, t0 + length * 0.9);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  source.connect(filter).connect(env).connect(out(ac));
  source.start(t0);
}

/** A held note with a little vibrato: the brass of the legendary fanfare. */
function horn(ac: AudioContext, midi: number, at: number, length: number, gain = 1) {
  const osc = ac.createOscillator();
  const lfo = ac.createOscillator();
  const depth = ac.createGain();
  const filter = ac.createBiquadFilter();
  const env = ac.createGain();
  const t0 = ac.currentTime + at;
  osc.type = "sawtooth";
  osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  lfo.frequency.value = 5.5;
  depth.gain.value = osc.frequency.value * 0.006;
  lfo.connect(depth).connect(osc.frequency);
  filter.type = "lowpass";
  filter.frequency.value = 2600;
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(VOLUME * 0.5 * gain, t0 + 0.03);
  env.gain.setValueAtTime(VOLUME * 0.42 * gain, t0 + length * 0.6);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(filter).connect(env).connect(out(ac));
  osc.start(t0);
  lfo.start(t0);
  osc.stop(t0 + length + 0.05);
  lfo.stop(t0 + length + 0.05);
}

/**
 * The capsule rattles before it opens. A rare one rattles faster and faster, and the
 * very rare ones hum a rising tone underneath: the tell every gacha player waits for.
 */
export function playRattle(duration: number, rarity: RarityId = "B") {
  const ac = audio();
  if (!ac) return;
  const seconds = duration / 1000;
  const speeds = rarity === "S" || rarity === "SSS";
  let gap = 0.09;
  for (let t = 0; t < seconds - 0.05; t += gap) {
    click(ac, t, 2400 + (speeds ? (t / seconds) * 1600 : 0), 0.45);
    if (speeds) gap = Math.max(0.035, gap * 0.95);
  }
  if (rarity === "SSS") whoosh(ac, seconds * 0.35, seconds * 0.65, 0.9);
}

/** The pop, then a sound of its own for each rarity. */
export function playOpen(rarity: RarityId) {
  const ac = audio();
  if (!ac) return;
  click(ac, 0, 1100, 1.5);
  switch (rarity) {
    // Common: a modest two-note "boop"
    case "B":
      tone(ac, 72, 0.04, 0.18, 0.7);
      tone(ac, 76, 0.13, 0.3, 0.6);
      break;
    // Rare: a bright bell chime
    case "A":
      [79, 84, 88].forEach((midi, i) => {
        tone(ac, midi, 0.04 + i * 0.1, 0.9, 0.55);
        tone(ac, midi + 19, 0.04 + i * 0.1, 0.4, 0.15); // the bell's overtone
      });
      break;
    // Super rare: an 8-bit power-up, then a chord
    case "S":
      [60, 64, 67, 72, 76, 79, 84, 88].forEach((midi, i) => tone(ac, midi, 0.04 + i * 0.045, 0.12, 0.35, "square"));
      for (const midi of [72, 76, 79, 84]) tone(ac, midi, 0.42, 1, 0.3, "square");
      break;
    // Legendary: brass fanfare (da-da-da-DAAA) over a held chord, with twinkles
    case "SSS":
      [
        [67, 0.04, 0.14],
        [67, 0.2, 0.14],
        [67, 0.36, 0.14],
        [72, 0.52, 1.6],
      ].forEach(([midi, at, length]) => {
        horn(ac, midi, at, length);
        horn(ac, midi + 4, at, length, 0.6);
      });
      for (const midi of [48, 55, 60, 64]) horn(ac, midi, 0.52, 2.2, 0.5);
      for (let i = 0; i < 10; i++) tone(ac, 96 + ((i * 5) % 12), 0.6 + i * 0.09, 0.3, 0.25);
      break;
  }
}

// ── Booster packs (the counter) ─────────────────────────────────────────────
/** The foil wrapper rips open. */
export function playTear() {
  const ac = audio();
  if (!ac) return;
  whoosh(ac, 0, 0.32, 0.8);
  for (let i = 0; i < 9; i++) click(ac, i * 0.03, 3200 + i * 250, 0.4);
}

/** A card slides off the pile. */
export function playCardFlip() {
  const ac = audio();
  if (!ac) return;
  click(ac, 0, 2600, 0.6);
  click(ac, 0.05, 1500, 0.35);
}

/** The jingle for the last card of a pack, from a plain rare to a secret one. */
export function playCardReveal(rarity: "R" | "HR" | "SR") {
  if (rarity === "SR") playSecretReveal();
  else playOpen(rarity === "R" ? "A" : "S");
}

/** A tone gliding from one note to another: the charge-up siren. */
function sweep(ac: AudioContext, from: number, to: number, at: number, length: number, gain = 1, type: OscillatorType = "sawtooth") {
  const osc = ac.createOscillator();
  const filter = ac.createBiquadFilter();
  const env = ac.createGain();
  const t0 = ac.currentTime + at;
  const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
  osc.type = type;
  osc.frequency.setValueAtTime(hz(from), t0);
  osc.frequency.exponentialRampToValueAtTime(hz(to), t0 + length);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(400, t0);
  filter.frequency.exponentialRampToValueAtTime(5000, t0 + length);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(VOLUME * 0.45 * gain, t0 + length * 0.95);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + length + 0.04);
  osc.connect(filter).connect(env).connect(out(ac));
  osc.start(t0);
  osc.stop(t0 + length + 0.1);
}

/** A drum hit: a sine whose pitch falls fast. Low for a boom, higher for a timpani. */
function thump(ac: AudioContext, at: number, from: number, to: number, length: number, gain = 1) {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  const t0 = ac.currentTime + at;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + length * 0.7);
  env.gain.setValueAtTime(VOLUME * 2.4 * gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(env).connect(out(ac));
  osc.start(t0);
  osc.stop(t0 + length + 0.05);
}

/** A long hiss that dies away: the crash cymbal. */
function crash(ac: AudioContext, at: number, length: number, gain = 1) {
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * length), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
  const source = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const env = ac.createGain();
  source.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 3500;
  env.gain.value = VOLUME * 1.6 * gain;
  source.connect(filter).connect(env).connect(out(ac));
  source.start(ac.currentTime + at);
}

/**
 * Before a secret rare turns over: a heartbeat that speeds up, a siren and a swell of
 * noise rising together, cut dead at the end (the reveal comes in on the silence).
 */
export function playSecretCharge(seconds: number) {
  const ac = audio();
  if (!ac) return;
  let gap = 0.42;
  for (let t = 0; t < seconds - 0.12; t += gap) {
    thump(ac, t, 90, 45, 0.22, 0.55 + (t / seconds) * 0.6);
    gap = Math.max(0.09, gap * 0.8);
  }
  sweep(ac, 40, 88, 0, seconds, 1);
  sweep(ac, 47, 95, 0, seconds, 0.5, "square");
  whoosh(ac, seconds * 0.2, seconds * 0.8, 1.3);
}

/**
 * The secret rare itself: an impact (boom and crash), then a brass fanfare climbing to a
 * held C major chord, under a timpani roll and a long glitter of chimes.
 */
export function playSecretReveal() {
  const ac = audio();
  if (!ac) return;
  thump(ac, 0, 140, 32, 0.9, 1.6);
  click(ac, 0, 300, 3);
  crash(ac, 0, 2.2);
  // The tune: da-da-da DAA, da-da DAAAA (the top note held over the chord)
  const tune: [midi: number, at: number, length: number][] = [
    [67, 0.18, 0.12],
    [67, 0.31, 0.12],
    [67, 0.44, 0.12],
    [72, 0.57, 0.42],
    [76, 1.02, 0.14],
    [79, 1.18, 0.14],
    [84, 1.34, 2.6],
  ];
  for (const [midi, at, length] of tune) {
    horn(ac, midi, at, length, 1.1);
    horn(ac, midi - 5, at, length, 0.55); // a fourth below: the second trumpet
  }
  for (const midi of [36, 43, 48, 52, 55, 60, 64]) horn(ac, midi, 1.34, 3, 0.45);
  for (let i = 0; i < 12; i++) thump(ac, 0.62 + i * 0.06, 110, 80, 0.12, 0.25 + i * 0.03); // the roll
  thump(ac, 1.34, 120, 40, 0.8, 1.2);
  crash(ac, 1.34, 3);
  for (let i = 0; i < 22; i++) tone(ac, [84, 88, 91, 96, 100, 103][i % 6] + (i % 12 >= 6 ? 12 : 0), 1.4 + i * 0.08, 0.4, 0.22);
}
