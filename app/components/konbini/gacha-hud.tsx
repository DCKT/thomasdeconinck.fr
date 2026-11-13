"use client";

import { useEffect, useRef, useState } from "react";
import type { GachaHandle, GachaPhase } from "./gacha";
import {
  CAPSULE_COLORS,
  GACHA_SERIES,
  odds,
  pickPrize,
  RARITIES,
  rollRarity,
  type Prize,
  type Rarity,
  type RarityId,
} from "./gacha-data";
import { playOpen, playRattle } from "./gacha-sound";

/** closed: waiting for a click · opening: rattling · open: prize revealed */
type Pull = { key: number; rarity: Rarity; prize: Prize; color: string; state: "closed" | "opening" | "open" };

/** `?gacha=SSS` in the URL forces a rarity: handy to look at each reveal. */
function forcedRarity() {
  const id = new URLSearchParams(window.location.search).get("gacha")?.toUpperCase();
  return RARITIES.find((r) => r.id === id);
}

export default function GachaHud({ gacha, phase, machine }: { gacha: GachaHandle; phase: GachaPhase; machine: number }) {
  const [pull, setPull] = useState<Pull | null>(null);
  const [tally, setTally] = useState<Record<RarityId, number>>({ B: 0, A: 0, S: 0, SSS: 0 });
  const pulls = useRef(0);
  const timer = useRef(0);
  const series = GACHA_SERIES[machine];

  // A capsule just fell out of the machine: decide what is inside
  useEffect(() => {
    window.clearTimeout(timer.current);
    if (phase !== "dropped") {
      setPull(null);
      return;
    }
    const rarity = forcedRarity() ?? rollRarity();
    setPull({
      key: ++pulls.current,
      rarity,
      prize: pickPrize(rarity.id),
      color: CAPSULE_COLORS[Math.floor(Math.random() * CAPSULE_COLORS.length)],
      state: "closed",
    });
  }, [phase]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const open = () => {
    if (!pull || pull.state !== "closed") return;
    const reduced = document.documentElement.dataset.motion === "off";
    const suspense = reduced ? 0 : pull.rarity.suspense;
    setPull({ ...pull, state: "opening" });
    playRattle(suspense);
    timer.current = window.setTimeout(() => {
      playOpen(pull.rarity.id);
      setTally((t) => ({ ...t, [pull.rarity.id]: t[pull.rarity.id] + 1 }));
      setPull((p) => (p && p.key === pull.key ? { ...p, state: "open" } : p));
    }, suspense);
  };

  // Space / Enter does "the obvious next thing", Esc steps back
  const act = useRef<(code: string) => boolean>(() => false);
  act.current = (code) => {
    if (code === "Escape") {
      if (phase === "dropped") gacha.back();
      else gacha.exit();
      return true;
    }
    if (code !== "Space" && code !== "Enter") return false;
    if (phase === "idle") gacha.turn();
    else if (pull?.state === "closed") open();
    else if (pull?.state === "open") gacha.turn();
    return true;
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      // Let a focused button handle its own Space / Enter (it would fire twice otherwise)
      if (e.code !== "Escape" && e.target instanceof HTMLElement && e.target.closest("button, a")) return;
      if (act.current(e.code)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const live = phase !== "enter" && phase !== "exit";

  return (
    <div className={`gacha-hud${live ? " is-live" : ""}`} data-phase={phase}>
      <button type="button" className="gacha-leave" onClick={() => (phase === "dropped" ? gacha.back() : gacha.exit())}>
        <kbd>Esc</kbd> {phase === "dropped" ? "Back to the machines" : "Back to the street"}
      </button>

      <aside className="gacha-odds" aria-label="Odds">
        <p className="eyebrow">ガチャガチャ · Capsule toys</p>
        <ul>
          {RARITIES.map((r) => (
            <li key={r.id} data-rarity={r.id}>
              <b className="gacha-rank">{r.id}</b>
              <span>{r.label}</span>
              <i>{odds(r)}</i>
              <em aria-label={`${tally[r.id]} pulled`}>×{tally[r.id]}</em>
            </li>
          ))}
        </ul>
      </aside>

      {phase !== "dropped" && (
        <div className="gacha-actions">
          <p className="gacha-series">
            <small>{series.jp}</small> {series.en}
          </p>
          <button type="button" className="gacha-turn" disabled={phase !== "idle"} onClick={() => gacha.turn()}>
            {phase === "turning" ? "ガチャ… ガチャ…" : "Turn the handle"}
            <small>¥0 · 1回</small>
          </button>
          <p className="gacha-hint">or click any machine</p>
        </div>
      )}

      {pull && (
        <div className="gacha-stage" data-state={pull.state} data-rarity={pull.rarity.id} key={pull.key}>
          <div className="gacha-rays" aria-hidden="true" />
          <div className="gacha-flash" aria-hidden="true" />
          {pull.state === "open" && (
            <div className="gacha-sparkles" aria-hidden="true">
              {Array.from({ length: pull.rarity.sparkles }, (_, i) => (
                <span
                  key={i}
                  style={
                    {
                      "--a": `${(i / pull.rarity.sparkles) * 360 + (i % 2) * 9}deg`,
                      "--d": `${9 + ((i * 7) % 5) * 2.4}rem`,
                      "--t": `${(i % 4) * 0.05}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}

          <button
            type="button"
            className="gacha-capsule"
            style={{ "--c": pull.color } as React.CSSProperties}
            onClick={open}
            disabled={pull.state !== "closed"}
            aria-label="Open the capsule"
            autoFocus
          >
            <span className="gacha-half gacha-half-top" />
            <span className="gacha-half gacha-half-bottom" />
          </button>

          {pull.state === "open" && (
            <div className="gacha-card" role="status">
              <b className="gacha-rank">{pull.rarity.id}</b>
              <img src={pull.prize.image} alt="" />
              <strong>{pull.prize.name}</strong>
              <small>
                {pull.rarity.label} · {pull.rarity.jp}
              </small>
            </div>
          )}

          <div className="gacha-next">
            {pull.state === "closed" && <p className="gacha-hint">Click the capsule to open it</p>}
            {pull.state === "open" && (
              <>
                <button type="button" className="gacha-turn" onClick={() => gacha.turn()} autoFocus>
                  One more!
                  <small>もう1回</small>
                </button>
                <button type="button" className="gacha-quiet" onClick={() => gacha.back()}>
                  Pick another machine
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
