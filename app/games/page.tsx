export const metadata = {
  title: "Games",
  description: "Some of my mini games I developed",
};

const GAMES = [
  {
    url: "https://dckt.github.io/ratatui-2048/",
    github: "https://github.com/DCKT/ratatui-2048",
    title: "ratatui-2048",
    description: "2048 games with ratatui framework",
    picture:
      "https://github.com/user-attachments/assets/671f9f76-3911-42b7-a38f-d6925f4abaeb",
    rotate: "-rotate-1",
  },
  {
    url: "https://dckt.github.io/kashoot/",
    github: "https://github.com/DCKT/kashoot",
    title: "Kashoot",
    description: "Simple shooting game exploring Kaplay.js API and their free assets.",
    picture:
      "https://github.com/DCKT/kashoot/blob/main/public/Kashoot.png?raw=true",
    rotate: "rotate-1",
  },
];

export default function Page() {
  return (
    <section>
      <div
        className="mb-8 px-5 py-4"
        style={{
          backgroundColor: "#d4a84b",
          border: "4px solid #2a1810",
          outline: "2px solid #c0392b",
          outlineOffset: "-8px",
          boxShadow: "5px 5px 0 #2a1810",
        }}
      >
        <h1
          className="text-4xl text-center"
          style={{
            fontFamily: "var(--font-display)",
            color: "#2a1810",
            letterSpacing: "0.08em",
          }}
        >
          (mini) Games
        </h1>
      </div>

      <p className="mb-8" style={{ color: "#2a1810" }}>
        Sometimes I make some basic video games, I post them here with some
        thought or feedback about the development.
      </p>

      <section className="flex flex-col gap-8">
        {GAMES.map((game, i) => (
          <a
            href={game.url}
            key={game.title}
            className={`block ${game.rotate} hover:rotate-0 transition-transform`}
            style={{ textDecoration: "none" }}
          >
            <div
              className="flex flex-row items-center gap-4 p-4"
              style={{
                border: "6px solid #2a1810",
                backgroundColor: "#f4e8d0",
                boxShadow: `6px 6px 0 #c0392b`,
              }}
            >
              <img
                src={game.picture}
                alt={game.title}
                className="w-28 shrink-0"
                style={{
                  border: "3px solid #2a1810",
                  imageRendering: "pixelated",
                }}
              />
              <div>
                <h3
                  className="text-2xl mb-1"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#2a1810",
                    letterSpacing: "0.05em",
                  }}
                >
                  {game.title}
                </h3>
                <p className="text-sm" style={{ color: "#2a1810" }}>
                  {game.description}
                </p>
              </div>
            </div>
          </a>
        ))}
      </section>
    </section>
  );
}
