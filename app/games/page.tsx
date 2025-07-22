export const metadata = {
  title: "Games",
  description: "Some of my mini games I developed",
};

const GAMES = [
  {
    url: "https://dckt.github.io/kashoot/",
    github: "https://github.com/DCKT/kashoot",
    title: "Kashoot",
    description:
      "Simple shooting game exploring Kaplay.js API and their free assets.",
    picture:
      "https://github.com/DCKT/kashoot/blob/main/public/Kashoot.png?raw=true",
  },
];

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-4xl mb-8 font-title">(mini) Games</h1>
      <p>
        Sometimes I make some basic video games, I post them here with some
        thought or feedback about the development.
      </p>
      <section className="mt-8">
        {GAMES.map((game) => {
          return (
            <a
              href={game.url}
              key={game.title}
              className="flex flex-row items-center gap-4"
            >
              <img
                src={game.picture}
                alt={game.title}
                className="w-32 border rounded border-neutral-300"
              />
              <div>
                <h3 className="text-2xl font-semibold">{game.title}</h3>
                <p>{game.description}</p>
              </div>
            </a>
          );
        })}
      </section>
    </section>
  );
}
