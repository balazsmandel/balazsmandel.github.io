// One-off visual verification for the 3D modernization (feat/3d-modern).
// Screenshots hero / journey / warp / routes / fleet and re-runs the
// hero-video freeze check.
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
// catch the journey mid-drive and the takeoff
await new Promise((r) => setTimeout(r, 3000));
await page.screenshot({ path: `${OUT}/3d-hero-drive.png` });
const t2 = await page.evaluate(() => document.querySelector(".hero-bg-video")?.currentTime ?? null);
await new Promise((r) => setTimeout(r, 5500));
await page.screenshot({ path: `${OUT}/3d-hero-takeoff.png` });

// warp divider
await page.evaluate(() => document.getElementById("about")?.scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 2000));
await page.screenshot({ path: `${OUT}/3d-warp.png` });

// routes section (real map)
await page.evaluate(() => document.getElementById("routes3d")?.scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 3500));
await page.screenshot({ path: `${OUT}/3d-routes.png` });

// fleet reflections
await page.evaluate(() => document.getElementById("fleet")?.scrollIntoView({ block: "start" }));
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: `${OUT}/3d-fleet.png` });

console.log("hero video currentTime:", t1, "->", t2, t2 > t1 + 0.1 ? "PLAYS" : "FROZEN");
console.log("LOGS:\n" + logs.slice(0, 30).join("\n"));
await browser.close();
