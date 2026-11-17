/** Things you can use inside the store. Shared by the walk controller and the HUD. */
export type InteractionId =
  | "blog"
  | "manga"
  | "editor"
  | "games"
  | "about"
  | "cards"
  | "pixel-art"
  | "favorites"
  | "drinks"
  | "fried"
  | "oden"
  | "coffee"
  | "onigiri"
  | "snacks"
  | "icecream"
  | "kiosk";

export const INTERACTION_LABELS: Record<InteractionId, string> = {
  blog: "Read the blog",
  manga: "Browse my favorite manga",
  editor: "Use the copy machine · Pixel editor",
  games: "Use the ATM · My games",
  about: "Talk to the clerk",
  cards: "Buy manhole cards · Booster packs",
  "pixel-art": "Look at my pixel art",
  favorites: "Browse my favorite games",
  drinks: "Grab a drink",
  fried: "Order fried chicken",
  oden: "Get some oden",
  coffee: "Pour a coffee",
  onigiri: "Grab an onigiri",
  snacks: "Pick a snack",
  icecream: "Slide the lid · Ice cream",
  kiosk: "Use the ticket machine",
};

/** Things you buy: they just say something nice. */
export const TOASTS: Partial<Record<InteractionId, string[]>> = {
  drinks: ["Ice-cold green tea. ¥0, on the house.", "A can of coffee, still the best ¥130 in Japan.", "Milk tea in a glass bottle. Good choice."],
  fried: ["Fried chicken, ¥220. Careful, it's hot!", "Karaage, extra crispy. いただきます！"],
  oden: ["Daikon, egg and konnyaku. Perfect for a rainy night.", "Extra broth? Of course."],
  coffee: ["Regular hot coffee, ¥120. The machine whirrs…", "Iced café latte. Cup, ice, button."],
  onigiri: ["Tuna mayo onigiri. Pull tab 1, then 2, then 3.", "Salmon onigiri. Nori still crispy."],
  snacks: ["A bag of chips for the walk home.", "Chocolate biscuit sticks. Obviously."],
  icecream: ["A chocolate monaka, cold enough to hurt.", "Soda bar. There might be a winning stick inside.", "Matcha ice cream. The lid squeaks shut."],
  kiosk: ["The machine prints a ticket… for a concert in 2009.", "「画面にタッチしてください」. You touch the screen. It beeps."],
};

/** Same-origin, resized manga cover (proxied from Komga by app/api/komga/cover). */
export const mangaCoverUrl = (id: string, width = 128) =>
  `/_next/image?url=${encodeURIComponent(`/api/komga/cover/${id}`)}&w=${width}&q=75`;

/** Pixel art hung on the gondola in walk mode (small files only: they load on entry). */
export const PRINTS = [
  { src: "/2025-06-28-another-character-attempt/Totoro.png", alt: "Totoro" },
  { src: "/2025-06-30-gba-sp/GBA.png", alt: "Game Boy Advance SP" },
  { src: "/Cat.png", alt: "Cat" },
  { src: "/2025-06-25-fruits/Fraise.png", alt: "Strawberry" },
  { src: "/2025-06-25-fruits/Pasteque.png", alt: "Watermelon" },
  { src: "/2025-06-25-fruits/Cerise.png", alt: "Cherry" },
  { src: "/2025-06-25-fruits/Pomme.png", alt: "Apple" },
  { src: "/2025-06-25-fruits/Banane.png", alt: "Banana" },
];
