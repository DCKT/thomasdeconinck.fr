import readline from "node:readline";
import { mkdir, writeFile } from "node:fs/promises";

import path from "path";

const now = new Date();
const formattedDate = `${now.getFullYear()}-${now.getMonth() + 1 < 10 ? "0" : ""}${now.getMonth() + 1}-${now.getDate()}`;
const pixelPostsDir = path.resolve(process.cwd(), "./app/pixel-art/posts/");
const blogPostsDir = path.resolve(process.cwd(), "./app/blog/posts/");
const publicDir = path.resolve(process.cwd(), "./public/");
const TEMPLATE = `---
title: ""
publishedAt: "${formattedDate}"
summary: ""
---
`;

const options = ["Blog", "Pixel art"];
let selected = 0;

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

function render() {
  console.clear();
  console.log("Which kind of post type ? (↑ ↓ Enter) :\n");
  options.forEach((option, index) => {
    if (index === selected) {
      console.log(`> ${option}`);
    } else {
      console.log(`  ${option}`);
    }
  });
}

async function askSlug() {
  const isPixelPost = selected === 1;
  let name = "";

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Slug name: ", async (answer: string) => {
    name = `${formattedDate}-${answer}`;
    if (isPixelPost) {
      await mkdir(path.resolve(publicDir, name));
    }
    await writeFile(
      path.resolve(isPixelPost ? pixelPostsDir : blogPostsDir, `${name}.mdx`),
      TEMPLATE,
    );
    rl.close();
  });
}

render();

process.stdin.on("keypress", async (_, key) => {
  if (key.name === "up") {
    selected = (selected - 1 + options.length) % options.length;
    render();
  } else if (key.name === "down") {
    selected = (selected + 1) % options.length;
    render();
  } else if (key.name === "return") {
    console.clear();
    console.log(`Selected -> ${options[selected]}`);
    try {
      process.stdin.setRawMode(false);
      process.stdin.removeAllListeners("keypress");
      await askSlug();
    } catch (e) {
      console.error("Ask slug error", e);
    }
  } else if (key.name === "c" && key.ctrl) {
    process.exit();
  }
});
