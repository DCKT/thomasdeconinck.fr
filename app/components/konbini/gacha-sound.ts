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

function tone(ac: AudioContext, midi: number, at: number, length: number, gain = 1, type: OscillatorType = "sine") {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  const t0 = ac.currentTime + at;
  osc.type = type;
  osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(VOLUME * gain, t0 + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(env).connect(ac.destination);
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
  source.connect(filter).connect(env).connect(ac.destination);
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

/** The capsule rattles before it opens. */
export function playRattle(duration: number) {
  const ac = audio();
  if (!ac) return;
  for (let t = 0; t < duration / 1000 - 0.05; t += 0.09) click(ac, t, 2400, 0.45);
}

const FANFARES: Record<RarityId, number[]> = {
  B: [72, 76],
  A: [72, 76, 79, 84],
  S: [72, 76, 79, 84, 88, 91],
  SSS: [72, 76, 79, 84, 88, 91, 96, 100, 103],
};

/** The pop, then a fanfare that grows with the rarity. */
export function playOpen(rarity: RarityId) {
  const ac = audio();
  if (!ac) return;
  click(ac, 0, 1100, 1.5);
  const notes = FANFARES[rarity];
  const step = rarity === "SSS" ? 0.07 : 0.085;
  notes.forEach((midi, i) => {
    const last = i === notes.length - 1;
    tone(ac, midi, 0.04 + i * step, last ? 1.1 : 0.4, last ? 0.9 : 0.65, "triangle");
    tone(ac, midi + 12, 0.04 + i * step, 0.25, 0.18);
  });
  if (rarity === "S" || rarity === "SSS") {
    const end = 0.04 + notes.length * step;
    for (const midi of [72, 79, 84, 88]) tone(ac, midi, end, rarity === "SSS" ? 1.8 : 1.1, 0.35);
  }
}
