// Quick screenshot helper: node scripts/shot.mjs [outPrefix]
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const prefix = process.argv[2] || "shot";
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ["--use-gl=angle"],
});
const page = await browser.newPage();
const logs = [];
page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 3500));
await page.screenshot({ path: `_build/${prefix}-hero.png` });
// logo hover
const brand = await page.$(".nav .brand");
if (brand) {
  const bb = await brand.boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `_build/${prefix}-logo.png`, clip: { x: 0, y: 0, width: 520, height: 140 } });
}
console.log(logs.length ? logs.join("\n") : "no errors");
await browser.close();
