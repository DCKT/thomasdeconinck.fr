import fs from "fs";
import path from "path";

const now = new Date();
const formattedDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate() + 1}`;
const postsDir = path.resolve(process.cwd(), "./app/pixel-art/posts/");
const publicDir = path.resolve(process.cwd(), "./public/");

process.stdout.write("Slug name: ");

for await (const line of console) {
  const name = `${formattedDate}-${line}`;

  console.log(path.resolve(publicDir, name));
  fs.mkdir(path.resolve(publicDir, name), (err) => {
    if (err) {
      console.log(`Unable to create folder`);
      console.log(err);
    } else {
      fs.writeFile(path.resolve(postsDir, `${name}.mdx`), "", (err) => {
        if (err) {
          console.log(`Unable to create file`);
        }
      });
    }
  });
  process.exit(0);
}
