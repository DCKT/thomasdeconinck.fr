import { DEFAULT_SKIN, isSkin, type SkinId } from "./skins";

/**
 * Door-chime jingles synthesized with WebAudio: no audio files to download.
 * The melodies are original, written in the spirit of a konbini entrance chime.
 *
 * Each note is [midi, startBeat, lengthBeats].
 */
type Jingle = { beat: number; partials: [ratio: number, gain: number][]; notes: [number, number, number][] };

const JINGLES: Record<SkinId, Jingle> = {
  // Bright electronic door chime
  famima: {
    beat: 0.2,
    partials: [[1, 1], [2, 0.3], [3.01, 0.1]],
    notes: [[79, 0, 1], [84, 1, 1], [88, 2, 1], [86, 3, 1], [84, 4, 1], [79, 5, 1], [81, 6, 1], [84, 7, 4]],
  },
  // Quick, cheerful marimba
  seven: {
    beat: 0.15,
    partials: [[1, 1], [4, 0.25], [9.2, 0.05]],
    notes: [[76, 0, 1], [79, 1, 1], [81, 2, 1], [88, 3, 2], [86, 5, 1], [84, 6, 1], [86, 7, 1], [88, 8, 4]],
  },
  // Mellow vibraphone
  lawson: {
    beat: 0.24,
    partials: [[1, 1], [4, 0.15], [2.01, 0.08]],
    notes: [[69, 0, 1], [73, 1, 1], [76, 2, 1], [81, 3, 2], [80, 5, 1], [76, 6, 1], [78, 7, 1], [81, 8, 4]],
  },
};

/**
 * Optional recorded jingles, e.g. { famima: "/sounds/famima.mp3" } with the file in public/sounds/.
 * When a skin has a file it is played instead of the synthesized melody.
 * Only add recordings you have the rights to publish.
 */
const JINGLE_FILES: Partial<Record<SkinId, string>> = { famima: "/sounds/famima.mp3" };

/** Playback volume of recorded jingles (0..1). Kept low: it's a welcome, not an alarm. */
const FILE_VOLUME = 0.105;

const audioCache = new Map<string, HTMLAudioElement>();

function audioFor(src: string) {
  let audio = audioCache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = FILE_VOLUME;
    audioCache.set(src, audio);
  }
  return audio;
}

/** Starts downloading the skin's recording (if any) so the first play is instant. */
export function preloadJingle(skin: SkinId) {
  const file = JINGLE_FILES[skin];
  if (file) audioFor(file).load();
}

const VOLUME = 0.112;

let ctx: AudioContext | null = null;
let current: GainNode | null = null;
let currentAudio: HTMLAudioElement | null = null;

export function currentSkin(): SkinId {
  const skin = document.documentElement.dataset.skin;
  return isSkin(skin) ? skin : DEFAULT_SKIN;
}

export function isMuted() {
  return document.documentElement.dataset.sound === "off";
}

export function stopJingle() {
  currentAudio?.pause();
  currentAudio = null;
  if (!ctx || !current) return;
  current.gain.cancelScheduledValues(ctx.currentTime);
  current.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
  current = null;
}

/**
 * Plays the skin's jingle. Resolves to false when the browser's autoplay policy
 * blocked it (no user gesture yet), so the caller can retry on the first click.
 */
export async function playJingle(skin: SkinId, { force = false } = {}): Promise<boolean> {
  if (isMuted() && !force) return true;
  const file = JINGLE_FILES[skin];
  if (file) {
    stopJingle();
    const audio = audioFor(file);
    audio.currentTime = 0;
    currentAudio = audio;
    return audio.play().then(
      () => true,
      () => false,
    );
  }
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return true;
  ctx ??= new Ctor();
  if (ctx.state !== "running") {
    // resume() never settles while autoplay is blocked: give it a moment, then give up
    await Promise.race([ctx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 150))]);
    // (re-read: the await above may have changed it)
    if ((ctx.state as AudioContextState) !== "running") return false;
  }
  stopJingle();

  const master = ctx.createGain();
  master.gain.value = VOLUME;
  master.connect(ctx.destination);
  current = master;

  const { beat, partials, notes } = JINGLES[skin];
  const start = ctx.currentTime + 0.05;
  for (const [midi, at, length] of notes) {
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const t0 = start + at * beat;
    const decay = Math.max(length * beat * 1.8, 0.35);
    for (const [ratio, level] of partials) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * ratio;
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(level, t0 + 0.006);
      // Higher partials die out faster, like a struck bar
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + decay / Math.sqrt(ratio));
      osc.connect(env).connect(master);
      osc.start(t0);
      osc.stop(t0 + decay + 0.05);
    }
  }
  return true;
}
