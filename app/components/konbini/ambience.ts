import { isMuted } from "app/lib/chime";

/**
 * What a konbini sounds like at night once the jingle has stopped: the coolers'
 * compressors humming, air moving, and the register's "pi" when you buy something.
 * All synthesized (no files), part of the walk-mode chunk, silent when the site is muted.
 */
const LEVEL = 0.05;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sources: AudioScheduledSourceNode[] = [];
let observer: MutationObserver | null = null;

function audio() {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state !== "running") void ctx.resume().catch(() => {});
  return ctx;
}

export function startAmbience() {
  const ac = audio();
  if (!ac || master) return;
  const out = ac.createGain();
  out.gain.value = 0;
  out.connect(ac.destination);
  master = out;

  // Compressor hum: mains frequency and a few slightly detuned harmonics, slowly beating
  for (const [freq, level] of [[100, 0.5], [150.3, 0.2], [200.8, 0.1], [301.1, 0.03]]) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = freq;
    gain.gain.value = level;
    osc.connect(gain).connect(out);
    osc.start();
    sources.push(osc);
  }
  // Air conditioning: looped noise through a low-pass
  const buffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const lowpass = ac.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 520;
  const air = ac.createGain();
  air.gain.value = 0.45;
  noise.connect(lowpass).connect(air).connect(out);
  noise.start();
  sources.push(noise);

  const apply = () => out.gain.setTargetAtTime(isMuted() ? 0 : LEVEL, ac.currentTime, 0.5);
  apply();
  observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-sound"] });
}

export function stopAmbience() {
  observer?.disconnect();
  observer = null;
  if (!ctx || !master) return;
  const out = master, playing = sources;
  master = null;
  sources = [];
  out.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
  window.setTimeout(() => {
    playing.forEach((node) => node.stop());
    out.disconnect();
  }, 1500);
}

/** The scanner at the register: two short pips. */
export function beep() {
  const ac = audio();
  if (!ac || isMuted()) return;
  [0, 0.11].forEach((at) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const t = ac.currentTime + at;
    osc.frequency.value = 2093;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.005);
    gain.gain.setValueAtTime(0.045, t + 0.06);
    gain.gain.linearRampToValueAtTime(0, t + 0.075);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  });
}
