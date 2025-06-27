import { mkdir, writeFile } from "node:fs/promises";
import path from "path";

const now = new Date();
const formattedDate = `${now.getFullYear()}-${now.getMonth() + 1 < 10 ? "0" : ""}${now.getMonth() + 1}-${now.getDate() + 1}`;
const postsDir = path.resolve(process.cwd(), "./app/pixel-art/posts/");
const publicDir = path.resolve(process.cwd(), "./public/");
const TEMPLATE = `---
title: ""
publishedAt: "${formattedDate}"
summary: ""
---
`;

process.stdout.write("Slug name: ");
let name = "";

for await (const line of console) {
  name = `${formattedDate}-${line}`;
  break;
}
await mkdir(path.resolve(publicDir, name));
await writeFile(path.resolve(postsDir, `${name}.mdx`), TEMPLATE);
