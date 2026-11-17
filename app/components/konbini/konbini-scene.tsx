"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_SKIN, DOOR_SPOT, GACHA_SPOT, isSkin, MOTION_EVENT, SKIN_EVENT, SPOTS, type SkinId } from "app/lib/skins";
import { ENTER_EVENT, GACHA_EVENT, GACHA_PREFETCH_EVENT, PREFETCH_EVENT, USE_EVENT } from "./events";
import type { GachaHandle, GachaPhase } from "./gacha";
import { DEFAULT_MACHINE } from "./gacha-data";
import type { SceneHandle, Spot } from "./scene";
import type { InteractionId } from "./interactions";
import type { WalkHandle } from "./walk";
import type { WalkData } from "./walk-hud";

type Hud = typeof import("./walk-hud").default;

/** Walk mode (controller + HUD) is its own chunk, fetched on hover of the door box. */
let walkChunk: Promise<[typeof import("./walk"), typeof import("./walk-hud")]> | null = null;
const loadWalk = () => (walkChunk ??= Promise.all([import("./walk"), import("./walk-hud")]));

type GachaHud = typeof import("./gacha-hud").default;
/** Same for the capsule machines: fetched on hover of the "Gacha !" tag. */
let gachaChunk: Promise<[typeof import("./gacha"), typeof import("./gacha-hud")]> | null = null;
const loadGacha = () => (gachaChunk ??= Promise.all([import("./gacha"), import("./gacha-hud")]));

/**
 * Progressive enhancement: the hero is fully usable as plain HTML. Once mounted,
 * the WebGL scene is loaded in its own chunk and the section links get pinned
 * onto the 3D store as price tags. Clicking the door box walks you inside,
 * the "Gacha !" tag takes you to the capsule machines.
 */
export default function KonbiniScene({ data }: { data: WalkData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [Hud, setHud] = useState<Hud | null>(null);
  const [walk, setWalk] = useState<WalkHandle | null>(null);
  const [control, setControl] = useState(false);
  const [prompt, setPrompt] = useState<InteractionId | null>(null);
  const [GachaHud, setGachaHud] = useState<GachaHud | null>(null);
  const [gacha, setGacha] = useState<{ handle: GachaHandle; phase: GachaPhase; machine: number } | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const hero = canvas?.closest<HTMLElement>(".hero");
    if (!canvas || !hero) return;
    const root = document.documentElement;

    let handle: SceneHandle | null = null;
    let current: WalkHandle | null = null;
    let currentGacha: GachaHandle | null = null;
    let cancelled = false;
    const spots: Spot[] = [];
    for (const spot of [...SPOTS, DOOR_SPOT, GACHA_SPOT]) {
      const el = hero.querySelector<HTMLElement>(`[data-spot="${spot.id}"]`);
      if (el) spots.push({ id: spot.id, pos: spot.pos, el });
    }

    import("./scene").then(({ createScene }) => {
      if (cancelled) return;
      const skin = root.dataset.skin;
      handle = createScene(canvas, {
        skin: isSkin(skin) ? skin : DEFAULT_SKIN,
        spots,
        reducedMotion: root.dataset.motion === "off",
        onReady: () => hero.classList.add("is-live"),
      });
      if (!handle) hero.classList.add("is-static");
    });

    const leave = () => {
      current = null;
      hero.classList.remove("is-walking");
      root.classList.remove("konbini-walking");
      setWalk(null);
      setControl(false);
      setPrompt(null);
    };

    const onEnter = async () => {
      if (!handle || current || currentGacha) return;
      (document.activeElement as HTMLElement | null)?.blur();
      window.scrollTo({ top: 0 });
      hero.classList.add("is-walking");
      root.classList.add("konbini-walking");
      const [{ startWalk }, hud] = await loadWalk();
      if (cancelled || !handle) return;
      setHud(() => hud.default);
      current = startWalk(handle, canvas, {
        reducedMotion: root.dataset.motion === "off",
        content: { games: data.games, manga: data.manga, posts: data.posts },
        onPrompt: setPrompt,
        onInteract: (id) => window.dispatchEvent(new CustomEvent(USE_EVENT, { detail: id })),
        onControl: () => setControl(true),
        onRelease: () => setControl(false),
        onExit: leave,
      });
      setWalk(current);
    };
    // Hovering the door box: fetch walk mode and build the interior now, not during the flight
    const onPrefetch = () =>
      void loadWalk().then(([walkModule]) => {
        if (handle && !cancelled) walkModule.prepareWalk(handle, { games: data.games, manga: data.manga, posts: data.posts });
      });

    // The capsule machines: same full-screen takeover as walk mode, different controller
    let gachaPending = false;
    const onGacha = async () => {
      if (!handle || current || currentGacha || gachaPending) return;
      gachaPending = true;
      (document.activeElement as HTMLElement | null)?.blur();
      window.scrollTo({ top: 0 });
      hero.classList.add("is-gacha");
      root.classList.add("konbini-walking");
      const [{ startGacha }, hud] = await loadGacha();
      gachaPending = false;
      if (cancelled || !handle) return;
      setGachaHud(() => hud.default);
      const started = startGacha(handle, canvas, {
        reducedMotion: root.dataset.motion === "off",
        onPhase: (phase, machine) => setGacha((g) => g && { ...g, phase, machine }),
        onExit: () => {
          currentGacha = null;
          hero.classList.remove("is-gacha");
          root.classList.remove("konbini-walking");
          setGacha(null);
        },
      });
      currentGacha = started;
      setGacha({ handle: started, phase: "enter", machine: DEFAULT_MACHINE });
    };
    const onGachaPrefetch = () => void loadGacha();

    const onSkin = (e: Event) => handle?.setSkin((e as CustomEvent<SkinId>).detail);
    const onMotion = (e: Event) => handle?.setMotion((e as CustomEvent<boolean>).detail);
    window.addEventListener(SKIN_EVENT, onSkin);
    window.addEventListener(MOTION_EVENT, onMotion);
    window.addEventListener(ENTER_EVENT, onEnter);
    window.addEventListener(PREFETCH_EVENT, onPrefetch);
    window.addEventListener(GACHA_EVENT, onGacha);
    window.addEventListener(GACHA_PREFETCH_EVENT, onGachaPrefetch);

    const cleanups = spots.map(({ el }) => {
      const enter = () => handle?.setHold(true);
      const release = () => handle?.setHold(false);
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", release);
      el.addEventListener("click", release);
      return () => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", release);
        el.removeEventListener("click", release);
      };
    });

    return () => {
      cancelled = true;
      window.removeEventListener(SKIN_EVENT, onSkin);
      window.removeEventListener(MOTION_EVENT, onMotion);
      window.removeEventListener(ENTER_EVENT, onEnter);
      window.removeEventListener(PREFETCH_EVENT, onPrefetch);
      window.removeEventListener(GACHA_EVENT, onGacha);
      window.removeEventListener(GACHA_PREFETCH_EVENT, onGachaPrefetch);
      cleanups.forEach((fn) => fn());
      current?.destroy();
      currentGacha?.destroy();
      root.classList.remove("konbini-walking");
      handle?.destroy();
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="hero-canvas" aria-hidden="true" />
      {walk && Hud && <Hud walk={walk} data={data} control={control} prompt={prompt} />}
      {gacha && GachaHud && <GachaHud gacha={gacha.handle} phase={gacha.phase} machine={gacha.machine} />}
    </>
  );
}
