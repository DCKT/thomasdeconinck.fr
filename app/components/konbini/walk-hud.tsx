"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GAMES } from "app/lib/games";
import type { MangaItem } from "app/lib/komga";
import type { ShelfGame } from "app/lib/steam";
import { USE_EVENT } from "./events";
import { INTERACTION_LABELS, mangaCoverUrl, PRINTS, TOASTS, type InteractionId } from "./interactions";
import { drawIcon, drawPixelated, loadCover } from "./pixel-icons";
import { greet, preloadGreeting, VOICE_CREDIT } from "./voice";
import type { WalkHandle } from "./walk";

export type ShelfItem = { slug: string; title: string; date: string };
export type WalkData = { posts: ShelfItem[]; pixelArt: ShelfItem[]; games: ShelfGame[]; manga: MangaItem[] };

const PANELS = ["blog", "manga", "games", "about", "pixel-art", "favorites"] as const;
type Panel = (typeof PANELS)[number];
const isPanel = (id: InteractionId): id is Panel => (PANELS as readonly string[]).includes(id);

/** Physical WASD keys, labelled for the visitor's layout (ZQSD on AZERTY…). */
function useMoveKeys() {
  const [label, setLabel] = useState("WASD");
  useEffect(() => {
    if (/^fr/i.test(navigator.language)) setLabel("ZQSD");
    const nav = navigator as Navigator & { keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> } };
    nav.keyboard
      ?.getLayoutMap?.()
      .then((map) => {
        const keys = ["KeyW", "KeyA", "KeyS", "KeyD"].map((code) => map.get(code)?.toUpperCase());
        if (keys.every((k) => k && k.length === 1)) setLabel(keys.join(""));
      })
      .catch(() => {});
  }, []);
  return label;
}

export default function WalkHud({
  walk,
  data,
  control,
  prompt,
}: {
  walk: WalkHandle;
  data: WalkData;
  control: boolean;
  prompt: InteractionId | null;
}) {
  const router = useRouter();
  const keys = useMoveKeys();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef(0);

  const say = (text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => preloadGreeting(), []);

  useEffect(() => {
    if (control) say("いらっしゃいませ！ Welcome in.");
    else setPanel(null);
  }, [control]);

  // The walk controller reports interactions as a window event (see konbini-scene).
  useEffect(() => {
    const onUse = (e: Event) => {
      const id = (e as CustomEvent<InteractionId>).detail;
      if (id === "editor") router.push("/pixel-editor");
      else if (isPanel(id)) {
        if (id === "about") greet(); // the clerk says いらっしゃいませ
        setPanel(id);
      }
      else {
        const lines = TOASTS[id] ?? [];
        if (lines.length) say(lines[Math.floor(Math.random() * lines.length)]);
      }
    };
    window.addEventListener(USE_EVENT, onUse);
    return () => window.removeEventListener(USE_EVENT, onUse);
  }, [router]);

  useEffect(() => {
    walk.setPaused(panel !== null);
    if (!panel) return;
    // Capture phase: close the panel without the walk controller also seeing the key
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyE") {
        e.preventDefault();
        e.stopPropagation();
        setPanel(null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [panel, walk]);

  const pad = (forward: number, turn: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      walk.setVirtual(forward, turn);
    },
    onPointerUp: () => walk.setVirtual(0, 0),
    onPointerCancel: () => walk.setVirtual(0, 0),
  });

  return (
    <div className={`walk-hud${control ? " is-control" : ""}`}>
      <button type="button" className="walk-leave" onClick={() => walk.exit()}>
        <kbd>Esc</kbd> Leave the store
      </button>

      {toast && (
        <p className="walk-toast" role="status">
          {toast}
        </p>
      )}

      {prompt && !panel && (
        <button type="button" className="walk-prompt" onClick={() => walk.interact()}>
          <kbd>E</kbd> {INTERACTION_LABELS[prompt]}
        </button>
      )}

      <p className="walk-help">
        <span>
          <kbd>{keys}</kbd> / <kbd>↑↓</kbd> move
        </span>
        <span>
          <kbd>←→</kbd> turn
        </span>
        <span>drag to look</span>
        <span>
          <kbd>Shift</kbd> run
        </span>
        <span>
          <kbd>E</kbd> use
        </span>
      </p>

      <div className="walk-pad" aria-hidden="true">
        <button type="button" className="pad-up" {...pad(1, 0)}>▲</button>
        <button type="button" className="pad-left" {...pad(0, -1)}>◀</button>
        <button type="button" className="pad-use" onPointerDown={() => walk.interact()}>E</button>
        <button type="button" className="pad-right" {...pad(0, 1)}>▶</button>
        <button type="button" className="pad-down" {...pad(-1, 0)}>▼</button>
      </div>

      {panel && (
        <div className="walk-panel" role="dialog" aria-label={INTERACTION_LABELS[panel]}>
          <div className="walk-panel-head">
            <p className="eyebrow">{PANEL_TITLES[panel].jp}</p>
            <h2>{PANEL_TITLES[panel].title}</h2>
            <button type="button" className="walk-close" onClick={() => setPanel(null)} aria-label="Close">
              ✕
            </button>
          </div>
          {panel === "blog" && <Shelf items={data.posts} base="/blog" />}
          {panel === "pixel-art" && (
            <div className="walk-scroll">
              <ul className="walk-prints">
                {PRINTS.map((print) => (
                  <li key={print.src}>
                    <img src={print.src} alt={print.alt} loading="lazy" />
                  </li>
                ))}
              </ul>
              <Shelf items={data.pixelArt} base="/pixel-art" />
            </div>
          )}
          {panel === "manga" &&
            (data.manga.length ? (
              <ul className="walk-list walk-manga">
                {data.manga.map((m) => (
                  <li key={m.id}>
                    <img src={mangaCoverUrl(m.id)} alt="" loading="lazy" />
                    <div>
                      <strong>{m.title}</strong>
                      <span>
                        {[m.authors.join(", "), m.year, `${m.volumes} vol.`].filter(Boolean).join(" · ")}
                      </span>
                      <span className="walk-progress">
                        <i style={{ width: `${m.volumes ? Math.round((m.read / m.volumes) * 100) : 0}%` }} />
                        read {m.read}/{m.volumes}
                        {m.status === "ENDED" ? " · complete" : m.status === "ONGOING" ? " · ongoing" : ""}
                      </span>
                      {m.summary && <p>{m.summary}…</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="walk-about">The comics shelf is still being stocked. Come back soon!</p>
            ))}
          {panel === "favorites" && (
            <ul className="walk-list">
              {data.games.map((game) => (
                <li key={game.title} className="walk-game">
                  <Cartridge game={game} />
                  <div>
                    <strong>{game.title}</strong>
                    <span>
                      {game.platform}
                      {game.year ? ` · ${game.year}` : ""}
                      {game.hours ? ` · ${game.hours} h played` : ""}
                    </span>
                    {game.note && <p>{game.note}</p>}
                    {game.storeUrl && (
                      <a className="walk-store" href={game.storeUrl} target="_blank" rel="noopener noreferrer">
                        Steam page ↗
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {panel === "games" && (
            <ul className="walk-list">
              {GAMES.map((game) => (
                <li key={game.url}>
                  <a href={game.url}>
                    <strong>{game.title}</strong>
                    <span>{game.description}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {panel === "about" && (
            <div className="walk-about">
              <p>
                <strong>いらっしゃいませ!</strong> I&apos;m Thomas, a developer who loves functional languages (ReScript
                first), Neovim, and starting side projects I never finish.
              </p>
              <p>Grab a magazine from the rack by the window: those are my articles.</p>
              <a href="/#about" onClick={() => walk.exit()}>
                More about me →
              </a>
              <small className="walk-credit">Clerk voice: {VOICE_CREDIT}</small>
            </div>
          )}
          <p className="walk-panel-foot">
            <kbd>Esc</kbd> back to the store
          </p>
        </div>
      )}
    </div>
  );
}

const PANEL_TITLES: Record<Panel, { jp: string; title: string }> = {
  blog: { jp: "雑誌コーナー", title: "Magazine rack" },
  "pixel-art": { jp: "ドット絵", title: "Pixel art I drew" },
  games: { jp: "ATM", title: "Arcade Token Machine · games I made" },
  about: { jp: "店長", title: "The clerk" },
  favorites: { jp: "お気に入り · ゲーム", title: "Favorite games" },
  manga: { jp: "お気に入り · 漫画", title: "Favorite manga" },
};

/** The cartridge label, as on the shelf: custom art, the pixelated Steam cover, or a generated icon. */
function Cartridge({ game }: { game: ShelfGame }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx || game.image) return;
    let live = true;
    ctx.fillStyle = game.label;
    ctx.fillRect(0, 0, 48, 48);
    drawIcon(ctx, game.icon, game.palette, 6, 6, 3);
    if (game.covers) {
      void loadCover(game.covers).then((img) => {
        if (live && img) drawPixelated(ctx, img, 0, 0, 48, 24);
      });
    }
    return () => {
      live = false;
    };
  }, [game]);
  return (
    <span className="walk-cart" style={{ background: game.shell }}>
      {game.image ? <img src={game.image} alt="" /> : <canvas ref={ref} width={48} height={48} />}
    </span>
  );
}

function Shelf({ items, base }: { items: ShelfItem[]; base: string }) {
  return (
    <ul className="walk-list">
      {items.map((item) => (
        <li key={item.slug}>
          <Link href={`${base}/${item.slug}`}>
            <strong>{item.title}</strong>
            <span>{item.date}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
