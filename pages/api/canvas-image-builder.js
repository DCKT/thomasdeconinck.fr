import { createCanvas, loadImage, Image, registerFont } from "canvas";
import path from "path";

function wrapText({
  ctx,
  text,
  x,
  y,
  maxWidth,
  lineHeight,
  font,
  singleLinePosition,
}) {
  ctx.font = font;
  const lines = text.split("\n");
  let isSingleLine = true;

  for (let i = 0; i < lines.length; i++) {
    let words = lines[i].split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        isSingleLine = false;
        ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(
      line,
      x,
      isSingleLine && singleLinePosition ? singleLinePosition : y
    );
    y += lineHeight;
  }
}
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

const FONT_PUBLIC_FOLDER_PATH = path.resolve("./public", "font");
const PICTURE_PUBLIC_FOLDER_PATH = path.resolve("./public", "./me.png");

registerFont(`${FONT_PUBLIC_FOLDER_PATH}/rubik/Rubik-Medium.ttf`, {
  family: "Rubik Medium",
});
registerFont(`${FONT_PUBLIC_FOLDER_PATH}/rubik/Rubik-Light.ttf`, {
  family: "Rubik Light",
});

const buildImage = (text) => {
  const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);

  let ctx1 = canvas.getContext("2d");

  ctx1.fillStyle = "#1f2028";
  ctx1.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  let ctx = canvas.getContext("2d");

  ctx.fillStyle = "#e5e7eb";

  return loadImage(`${PICTURE_PUBLIC_FOLDER_PATH}`).then((image) => {
    const paddingX = 80;
    const paddingBottom = 150;
    const imageY = 60;
    const borderY = 365;
    const borderWidth = 190;
    const blogTitleY = 320;
    const articleTitleY = IMAGE_HEIGHT - paddingBottom;

    ctx.drawImage(image, IMAGE_WIDTH / 2 - 100, imageY, 200, 200);

    ctx.beginPath();

    ctx.moveTo(0, borderY);
    ctx.lineTo(IMAGE_WIDTH, borderY);

    ctx.moveTo(0, borderY + 20);
    ctx.lineTo(IMAGE_WIDTH, borderY + 20);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#aaa";
    ctx.stroke();

    wrapText({
      font: "34px Rubik Light",
      ctx: ctx,
      text: "Thomas Deconinck",
      x: IMAGE_WIDTH / 2 - 140,
      y: blogTitleY,
      maxWidth: 650,
      lineHeight: 40,
    });

    wrapText({
      font: "56px Rubik Medium",
      ctx: ctx,
      text: text,
      x: paddingX,
      y: articleTitleY,
      maxWidth: IMAGE_WIDTH - paddingX * 2,
      lineHeight: 80,
      singleLinePosition: articleTitleY + 60,
    });

    return canvas.toBuffer();
  });
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
    const text = decodeURIComponent(searchParams.get("text"));
    const CACHE_DURATION = 60 * 60 * 24 * 365;

    try {
      const imageBuffer = await buildImage(text);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", imageBuffer.length);
      res.setHeader(
        "Cache-Control",
        `max-age=0, s-maxage=${CACHE_DURATION}, stale-while-revalidate`
      );
      res.end(imageBuffer, "binary");
    } catch (err) {
      console.log("🚨 An error occured while building the image");
      console.error(err);

      res.status(500).end("🚨 An error occured while building the image");
    }
  } else {
    res.status(405).end();
  }
}
