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
await page.screenshot({ path: "_build/3d-mobile-hero.png" });
await page.evaluate(() => document.getElementById("routes3d")?.scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: "_build/3d-mobile-routes.png" });
console.log(logs.length ? logs.join("\n") : "no page errors");
await browser.close();
