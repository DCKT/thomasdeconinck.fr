import { PageHead } from "app/components/page-head";
import { GAMES } from "app/lib/games";

export const metadata = {
  title: "Games",
  description: "Some of my mini games I developed",
};


export default function Page() {
  return (
    <main className="page">
      <PageHead jp="自販機コーナー · Vending machines" title="(mini) Games">
        Sometimes I make some basic video games, I post them here with some thought or feedback about the development.
      </PageHead>

      <div className="games">
        {GAMES.map((game) => (
          <a href={game.url} key={game.title} className="game-card">
            <img src={game.picture} alt="" loading="lazy" decoding="async" />
            <div>
              <h2>{game.title}</h2>
              <p>{game.description}</p>
              <span className="price">¥0 · Play →</span>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
