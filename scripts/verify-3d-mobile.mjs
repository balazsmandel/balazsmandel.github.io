// Mobile-viewport spot check for the 3D layers.
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required", "--use-gl=angle"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

const logs = [];
page.on("pageerror", (e) => logs.push("pageerror: " + e.message));

await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 30000 });
await new Promise((r) => setTimeout(r, 2500));
const t1 = await page.evaluate(() => document.querySelector(".hero-bg-video")?.currentTime ?? null);
await page.screenshot({ path: "_build/m-hero.png" });
await new Promise((r) => setTimeout(r, 2000));
const t2 = await page.evaluate(() => document.querySelector(".hero-bg-video")?.currentTime ?? null);

await page.evaluate(() => document.getElementById("about")?.scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 2000));
await page.screenshot({ path: "_build/m-warp.png" });

await page.evaluate(() => document.getElementById("routes3d")?.scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 3500));
await page.screenshot({ path: "_build/m-routes.png" });

await page.evaluate(() => document.getElementById("fleet")?.scrollIntoView({ block: "start" }));
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: "_build/m-fleet.png" });

await page.evaluate(() => document.getElementById("contact")?.scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: "_build/m-form.png" });

// FPS sample while the routes scene is on screen (animation cost on mobile)
await page.evaluate(() => document.getElementById("routes3d")?.scrollIntoView({ block: "center" }));
const fps = await page.evaluate(() => new Promise((res) => {
  let n = 0; const t0 = performance.now();
  const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(Math.round(n / 2)) };
  requestAnimationFrame(tick);
}));

console.log("hero video:", t1, "->", t2, t2 > t1 + 0.1 ? "PLAYS" : "FROZEN");
console.log("routes section ~FPS:", fps);
console.log(logs.length ? logs.join("\n") : "no page errors");
await browser.close();
