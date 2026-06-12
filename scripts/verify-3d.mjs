// One-off visual verification for the 3D modernization (feat/3d-modern).
// Screenshots hero / routes / fleet and re-runs the hero-video freeze check.
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "_build";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required", "--use-gl=angle"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const logs = [];
page.on("console", (m) => logs.push("console: " + m.text()));
page.on("pageerror", (e) => logs.push("pageerror: " + e.message));

await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 30000 });
await new Promise((r) => setTimeout(r, 2500));

const t1 = await page.evaluate(() => document.querySelector(".hero-bg-video")?.currentTime ?? null);
await page.screenshot({ path: `${OUT}/3d-hero.png` });
await new Promise((r) => setTimeout(r, 2000));
const t2 = await page.evaluate(() => document.querySelector(".hero-bg-video")?.currentTime ?? null);

// routes section
await page.evaluate(() => document.getElementById("routes3d")?.scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 3000));
await page.screenshot({ path: `${OUT}/3d-routes.png` });

// hover the Vienna price card to check route highlight
await page.evaluate(() => document.querySelector('[data-route="vie"]')?.scrollIntoView({ block: "end" }));
await new Promise((r) => setTimeout(r, 800));
const card = await page.$('[data-route="vie"]');
if (card) {
  const b = await card.boundingBox();
  if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
}
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: `${OUT}/3d-routes-hover.png` });

// fleet reflections
await page.evaluate(() => document.getElementById("fleet")?.scrollIntoView({ block: "start" }));
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: `${OUT}/3d-fleet.png` });

console.log("hero video currentTime:", t1, "->", t2, t2 > t1 + 0.1 ? "PLAYS" : "FROZEN");
console.log("LOGS:\n" + logs.slice(0, 30).join("\n"));
await browser.close();
