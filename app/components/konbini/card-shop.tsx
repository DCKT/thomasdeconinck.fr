"use client";

import { useEffect, useRef, useState } from "react";
import "./card-shop.css";
import {
  addPack,
  CARD_KINDS,
  CARD_RARITIES,
  cardNumber,
  CARDS,
  isShiny,
  loadBinder,
  openPack,
  owned,
  ownedCount,
  PACK,
  saveBinder,
  slotOdds,
  type Binder,
  type CardRarityId,
  type Pulled,
} from "./cards-data";
import { playCardFlip, playCardReveal, playOpen, playSecretCharge, playTear } from "./gacha-sound";

/**
 * shop → sealed → torn → reveal (one card at a time, the rare one last and face down)
 * → summary → shop. The binder opens from the shop or the summary.
 */
type View = "shop" | "sealed" | "torn" | "reveal" | "summary" | "binder";

const TEAR_MS = 750;
/** A secret rare shakes and glows this long before it turns over… */
const CHARGE_MS = 1900;
/** …then spins in under the flash, the screen shaking. */
const BOOM_MS = 1400;

/** The secret rare's own reveal: charge → boom → done (the title stays up). */
type Secret = "" | "charge" | "boom" | "done";

const RAINBOW = ["#ff5d8f", "#ffc400", "#49e08a", "#4cc9f0", "#b14dff", "#ffffff"];

/** `?pack=SR` in the URL forces the rare slot: handy to look at each reveal. */
function forcedRarity() {
  const id = new URLSearchParams(window.location.search).get("pack")?.toUpperCase();
  return id && id in CARD_RARITIES ? (id as CardRarityId) : undefined;
}

const reducedMotion = () => document.documentElement.dataset.motion === "off";

export default function CardShop({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>("shop");
  const [binder, setBinder] = useState<Binder>({ packs: 0, cards: {} });
  const [pulls, setPulls] = useState<Pulled[]>([]);
  /** Slugs that were not in the binder before this pack. */
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [inspect, setInspect] = useState<Pulled | null>(null);
  const [secret, setSecret] = useState<Secret>("");
  /** Where "back" goes from the binder. */
  const binderFrom = useRef<View>("shop");
  const timer = useRef(0);

  useEffect(() => {
    setBinder(loadBinder());
    return () => window.clearTimeout(timer.current);
  }, []);

  const last = pulls.length - 1;
  const current = pulls[index];
  const isLast = index === last;

  const buy = () => {
    setPulls(openPack(Math.random, forcedRarity()));
    setIndex(0);
    setFlipped(false);
    setSecret("");
    setView("sealed");
    playCardFlip();
  };

  const tear = () => {
    if (view !== "sealed") return;
    // The cards are yours as soon as the wrapper is open, even if you walk away mid-reveal
    setFresh(new Set(pulls.filter(({ card }) => owned(binder, card) === 0).map(({ card }) => card.slug)));
    const next = addPack(binder, pulls);
    setBinder(next);
    saveBinder(next);
    playTear();
    setView("torn");
    timer.current = window.setTimeout(() => setView("reveal"), reducedMotion() ? 0 : TEAR_MS);
  };

  const advance = () => {
    if (view !== "reveal" || !current) return;
    if (isLast && !flipped) {
      if (secret === "charge") return;
      const rarity = current.card.rarity === "SR" ? "SR" : current.card.rarity === "HR" ? "HR" : "R";
      if (rarity === "SR" && !reducedMotion()) {
        setSecret("charge");
        playSecretCharge(CHARGE_MS / 1000);
        timer.current = window.setTimeout(() => {
          setFlipped(true);
          setSecret("boom");
          playCardReveal("SR");
          timer.current = window.setTimeout(() => setSecret("done"), BOOM_MS);
        }, CHARGE_MS);
        return;
      }
      setFlipped(true);
      if (rarity === "SR") setSecret("done");
      playCardReveal(rarity);
      return;
    }
    if (isLast) {
      setView("summary");
      return;
    }
    playCardFlip();
    if (index + 1 < last && isShiny(pulls[index + 1])) playOpen("A"); // a reverse holo gets a little chime
    setIndex(index + 1);
  };

  const openBinder = () => {
    binderFrom.current = view === "summary" ? "summary" : "shop";
    setView("binder");
  };

  const back = () => {
    if (inspect) setInspect(null);
    else if (view === "binder") setView(binderFrom.current);
    else if (view === "summary") setView("shop");
    else if (view === "shop") onClose();
    // A pack being opened has to be finished: no going back on a torn wrapper
    else if (view === "sealed") tear();
    else advance();
  };

  const primary = () => {
    if (inspect) setInspect(null);
    else if (view === "shop" || view === "summary") buy();
    else if (view === "sealed") tear();
    else if (view === "reveal") advance();
  };

  // Capture phase: the walk controller must not see these keys while the shop is open
  const keys = useRef({ back, primary });
  keys.current = { back, primary };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const isPrimary = e.code === "Space" || e.code === "Enter";
      if (e.code !== "Escape" && e.code !== "KeyE" && !isPrimary) return;
      e.stopPropagation();
      // A focused button handles its own Space / Enter (it would fire twice otherwise)
      if (isPrimary && e.target instanceof HTMLElement && e.target.closest("button, a")) return;
      e.preventDefault();
      if (e.repeat) return;
      if (isPrimary) keys.current.primary();
      else if (e.code === "Escape") keys.current.back();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const have = ownedCount(binder);
  const opening = view === "sealed" || view === "torn";

  return (
    <div className="cards" data-view={view} data-secret={secret || undefined} role="dialog" aria-label="Manhole card boosters">
      {view === "reveal" && secret && <div className="cards-aura" data-phase={secret} aria-hidden="true" />}
      <button type="button" className="cards-leave" onClick={back}>
        <kbd>Esc</kbd>{" "}
        {view === "shop" ? "Back to the store" : view === "binder" || view === "summary" ? "Back" : "Keep opening"}
      </button>

      {view === "shop" && (
        <div className="cards-shop">
          <p className="eyebrow">マンホールカード · 第1弾</p>
          <h2>Manhole cards</h2>
          <p className="cards-pitch">
            Every Japanese town casts its pride into its manhole covers. {CARDS.length} of them to collect, {PACK.size}{" "}
            cards a pack.
          </p>
          <Pack />
          <button type="button" className="cards-buy" onClick={buy} autoFocus>
            Buy a booster
            <small>¥{PACK.price} · {PACK.size}枚入り</small>
          </button>
          <button type="button" className="cards-quiet" onClick={openBinder}>
            Open my binder · {have}/{CARDS.length}
          </button>
          <ul className="cards-odds" aria-label="What is in a pack">
            <li>
              <b>{PACK.commons}</b> {CARD_RARITIES.C.symbol} common
            </li>
            <li>
              <b>1</b> {CARD_RARITIES.U.symbol} uncommon
            </li>
            <li>
              <b>1</b> {CARD_RARITIES.R.symbol} rare or better
            </li>
            {PACK.rareSlot.slice(1).map((slot) => (
              <li key={slot.rarity} data-rarity={slot.rarity}>
                {CARD_RARITIES[slot.rarity].label} <b>{slotOdds(slot.weight)}</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      {opening && (
        <div className="cards-opening">
          <button
            type="button"
            className={`cards-pack-button${view === "torn" ? " is-torn" : ""}`}
            onClick={tear}
            disabled={view !== "sealed"}
            aria-label="Tear the pack open"
            autoFocus
          >
            <Pack />
          </button>
          <p className="cards-hint">{view === "sealed" ? "Click the pack to tear it open" : "びりっ…"}</p>
        </div>
      )}

      {view === "reveal" && current && (
        <div className="cards-reveal">
          {secret === "boom" || secret === "done" ? (
            <p className="cards-secret-title">
              SECRET RARE
              <small lang="ja">シークレットレア!!</small>
            </p>
          ) : (
            <p className="cards-count">
              {index + 1} / {pulls.length}
            </p>
          )}
          <div className="cards-pile" data-left={last - index}>
            {isLast && flipped && <Burst rarity={current.card.rarity} />}
            <ManholeCard
              key={index}
              pull={current}
              faceDown={isLast && !flipped}
              className={
                isLast ? `is-last${secret === "charge" ? " is-charging" : secret === "boom" || secret === "done" ? " is-secret" : ""}` : "is-dealt"
              }
              onClick={advance}
              label={isLast && !flipped ? "Flip the rare card" : "Next card"}
              autoFocus
            />
          </div>
          {(!isLast || flipped) && <CardCaption pull={current} isNew={fresh.has(current.card.slug)} />}
          <p className="cards-hint">
            {secret === "charge"
              ? "…!?"
              : isLast && !flipped
                ? "The rare card. Click to flip it"
                : isLast
                  ? "Click to finish"
                  : "Click for the next card"}
          </p>
        </div>
      )}

      {view === "summary" && (
        <div className="cards-summary">
          <p className="eyebrow">開封結果 · Your pack</p>
          <ul className="cards-row">
            {pulls.map((pull, i) => (
              <li key={pull.card.slug} style={{ "--i": i } as React.CSSProperties}>
                <ManholeCard pull={pull} onClick={() => setInspect(pull)} label={`Look at ${pull.card.name}`} />
                {fresh.has(pull.card.slug) && <em className="cards-new">NEW</em>}
              </li>
            ))}
          </ul>
          <div className="cards-actions">
            <button type="button" className="cards-buy" onClick={buy} autoFocus>
              One more pack!
              <small>もう1パック</small>
            </button>
            <button type="button" className="cards-quiet" onClick={openBinder}>
              Open my binder · {have}/{CARDS.length}
            </button>
          </div>
        </div>
      )}

      {view === "binder" && (
        <div className="cards-binder">
          <div className="cards-binder-head">
            <p className="eyebrow">コレクション · {binder.packs} packs opened</p>
            <h2>
              Binder <span>{have}/{CARDS.length}</span>
            </h2>
            <div className="cards-progress" aria-hidden="true">
              <i style={{ width: `${(have / CARDS.length) * 100}%` }} />
            </div>
          </div>
          <ul className="cards-grid">
            {CARDS.map((card) => {
              const [regular, foil] = binder.cards[card.slug] ?? [0, 0];
              // Show off the reverse holo when there is one
              const pull = { card, foil: foil > 0 };
              return (
                <li key={card.slug}>
                  {regular + foil > 0 ? (
                    <>
                      <ManholeCard pull={pull} onClick={() => setInspect(pull)} label={`Look at ${card.name}`} still />
                      {regular + foil > 1 && <em className="cards-copies">×{regular + foil}</em>}
                    </>
                  ) : (
                    <div className="cards-slot" data-rarity={card.rarity}>
                      <b>{String(card.no).padStart(3, "0")}</b>
                      <span>{CARD_RARITIES[card.rarity].symbol}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="cards-credits">
            Photos from{" "}
            <a
              href="https://commons.wikimedia.org/wiki/Category:Colored_manhole_covers_in_Japan"
              target="_blank"
              rel="noopener noreferrer"
            >
              Wikimedia Commons
            </a>{" "}
            and Flickr. Author and licence are on each card. Collab characters © their owners.
          </p>
        </div>
      )}

      {inspect && (
        <div className="cards-inspect" onClick={() => setInspect(null)}>
          <ManholeCard pull={inspect} className="is-big" />
          <CardCaption pull={inspect} credit />
        </div>
      )}
    </div>
  );
}

/** Name, rarity and (in the close-up) the photo credit, under a card. */
function CardCaption({ pull: { card, foil }, isNew, credit }: { pull: Pulled; isNew?: boolean; credit?: boolean }) {
  const rarity = CARD_RARITIES[card.rarity];
  return (
    <p className="cards-caption" data-rarity={card.rarity} onClick={(e) => e.stopPropagation()}>
      <strong>
        {card.name}
        {isNew && <em className="cards-new">NEW</em>}
      </strong>
      <span>
        {rarity.symbol} {rarity.label}
        {foil ? " · reverse holo" : ""} · {rarity.jp}
      </span>
      {credit && (
        <small>
          Photo:{" "}
          <a href={card.source} target="_blank" rel="noopener noreferrer">
            {card.author}
          </a>{" "}
          · {card.license} · {card.cropped ? "cropped" : "uncropped"}
        </small>
      )}
    </p>
  );
}

/** The foil wrapper. Purely decorative: the button around it does the work. */
function Pack() {
  return (
    <span className="pack" aria-hidden="true">
      <span className="pack-top" />
      <span className="pack-body">
        <span className="pack-set">第1弾</span>
        <span className="pack-lid" />
        <span className="pack-title">
          <small>マンホールカード</small>
          MANHOLE
          <br />
          CARDS
        </span>
        <span className="pack-count">{PACK.size} cards · 5枚入り</span>
      </span>
    </span>
  );
}

function Burst({ rarity }: { rarity: CardRarityId }) {
  const secret = rarity === "SR";
  const sparkles = secret ? 48 : rarity === "HR" ? 16 : 8;
  return (
    <div className="cards-burst" data-rarity={rarity} aria-hidden="true">
      {secret && (
        <>
          <b className="cards-ring" />
          <b className="cards-ring" style={{ animationDelay: "0.18s" }} />
        </>
      )}
      {Array.from({ length: sparkles }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--a": `${(i / sparkles) * 360 + (i % 2) * 9}deg`,
              "--d": `${10 + ((i * 7) % 5) * 2.6}rem`,
              "--t": `${(i % 4) * 0.05 + (secret && i % 2 ? 0.35 : 0)}s`,
              ...(secret && { "--c": RAINBOW[i % RAINBOW.length], "--d": `${14 + ((i * 7) % 6) * 3}rem` }),
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * One card. It leans towards the pointer, and the holo layers follow it (--mx / --my),
 * so a shiny card has to be moved around to be seen properly, like the real thing.
 */
function ManholeCard({
  pull,
  faceDown = false,
  still = false,
  className = "",
  label,
  autoFocus,
  onClick,
}: {
  pull: Pulled;
  faceDown?: boolean;
  /** No tilt (the binder grid: too many cards moving at once). */
  still?: boolean;
  className?: string;
  label?: string;
  autoFocus?: boolean;
  onClick?: () => void;
}) {
  const { card, foil } = pull;
  const ref = useRef<HTMLDivElement>(null);
  const rarity = CARD_RARITIES[card.rarity];

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || still || reducedMotion()) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 22}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 26}deg`);
    el.dataset.active = "";
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    for (const name of ["--mx", "--my", "--rx", "--ry"]) el.style.removeProperty(name);
    delete el.dataset.active;
  };

  const body = (
    <div className="mcard-inner">
      <div className="mcard-front">
        <div className="mcard-head">
          <span className="mcard-kind" title={CARD_KINDS[card.kind].label}>
            {CARD_KINDS[card.kind].jp}
          </span>
          <strong>{card.name}</strong>
          <span lang="ja">{card.jp}</span>
        </div>
        <div className="mcard-art">
          <img src={card.image} alt={`Manhole cover of ${card.name}, ${card.prefecture}`} draggable={false} />
          <i className="mcard-holo" />
        </div>
        <p className="mcard-pref">
          {card.prefecture} · {CARD_KINDS[card.kind].label}
        </p>
        <p className="mcard-text">{card.text}</p>
        <div className="mcard-foot">
          <span className="mcard-rarity">{rarity.symbol}</span>
          <span>{cardNumber(card)}</span>
          <span className="mcard-credit">
            {card.author} · {card.license}
          </span>
        </div>
        <i className="mcard-foil" />
        <i className="mcard-glare" />
      </div>
      <div className="mcard-back">
        <span>
          マンホール
          <br />
          カード
        </span>
      </div>
    </div>
  );

  const props = {
    className: `mcard ${className}`,
    "data-rarity": card.rarity,
    "data-kind": card.kind,
    "data-foil": foil ? "" : undefined,
    "data-shiny": isShiny(pull) ? "" : undefined,
    "data-down": faceDown ? "" : undefined,
    onPointerMove: onMove,
    onPointerLeave: onLeave,
  };

  return (
    <div {...props} ref={ref}>
      {body}
      {onClick && <button type="button" className="mcard-hit" onClick={onClick} aria-label={label} autoFocus={autoFocus} />}
    </div>
  );
}
