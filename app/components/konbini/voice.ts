import { isMuted } from "app/lib/chime";

/**
 * The clerk's greeting. A recorded clip when there is one (same on every device),
 * otherwise the browser's speech synthesis: a Japanese voice when the system has one,
 * else the romanised phrase with the default voice, so nobody gets silence.
 *
 * To use a recording: put it in public/sounds/ and set CLERK_CLIP, e.g. "/sounds/irasshaimase.mp3".
 */
const CLERK_CLIP: string | null = "/sounds/irasshaimase.mp3"; // VOICEVOX 玄野武宏, 喜び style
/** Required by the voice's terms whenever the clip is used (shown in the clerk panel + footer). */
export const VOICE_CREDIT = "VOICEVOX:玄野武宏(CV:ガロ)";
const CLIP_VOLUME = 0.6;

let clip: HTMLAudioElement | null = null;

/** Warms the clip up so the greeting plays instantly (called when entering the store). */
export function preloadGreeting() {
  if (!CLERK_CLIP || clip) return;
  clip = new Audio(CLERK_CLIP);
  clip.preload = "auto";
  clip.volume = CLIP_VOLUME;
}

export function greet() {
  if (isMuted() || typeof window === "undefined") return;
  if (CLERK_CLIP) {
    preloadGreeting();
    clip!.currentTime = 0;
    void clip!.play().catch(() => speak());
    return;
  }
  speak();
}

function speak() {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const say = () => {
    const japanese = synth.getVoices().filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("ja"));
    const voice = japanese.find((v) => /kyoko|google|haruka|nanami/i.test(v.name)) ?? japanese[0];
    // No Japanese voice (e.g. Firefox on Linux): the romanised phrase still sounds right
    const utterance = new SpeechSynthesisUtterance(voice ? "いらっしゃいませ！" : "Irasshaimase!");
    utterance.lang = voice ? "ja-JP" : "en-US";
    if (voice) utterance.voice = voice;
    utterance.rate = 1.05;
    utterance.pitch = 1.15;
    utterance.volume = 0.8;
    synth.cancel();
    synth.speak(utterance);
  };
  if (synth.getVoices().length) say();
  else {
    let done = false;
    const once = () => {
      if (!done) {
        done = true;
        say();
      }
    };
    synth.addEventListener("voiceschanged", once, { once: true });
    window.setTimeout(once, 400);
  }
}
