import PixelEditor from "./pixel-editor";
import { PageHead } from "app/components/page-head";

export const metadata = {
  title: "Pixel Editor",
  description: "A tiny in-browser pixel art editor",
};

export default function Page() {
  return (
    <main>
      <div className="page page-head-only">
        <PageHead jp="コピー機 · Copy machine" title="Pixel Editor">
          A tiny in-browser pixel art editor.
        </PageHead>
      </div>
      <div className="px-4 md:px-8 pb-16">
        <PixelEditor />
      </div>
    </main>
  );
}
