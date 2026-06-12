// One-off: optimize the generated hero assets into web-friendly sizes.
//  assets/img/bg.png       -> public/assets/img/hero-letters.jpg (2560w, q.82)
//  assets/img/hypercar.png -> public/assets/img/hero-car.png     (1600w)
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync } from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();

async function conv(src, dst, maxW, type, q) {
  const b64 = readFileSync(src).toString("base64");
  const out = await page.evaluate(async (b64, maxW, type, q) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const s = Math.min(1, maxW / img.naturalWidth);
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(type, q);
  }, b64, maxW, type, q);
  writeFileSync(dst, Buffer.from(out.split(",")[1], "base64"));
  console.log(dst, "written");
}

await conv("assets/img/bg.png", "public/assets/img/hero-letters.jpg", 2560, "image/jpeg", 0.82);
await conv("assets/img/hypercar.png", "public/assets/img/hero-car.png", 1600, "image/png");
await browser.close();
