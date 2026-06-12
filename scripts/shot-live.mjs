// Production sanity screenshot: https://mandeltranszfer.hu/
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle"] });
const page = await browser.newPage();
const logs = [];
page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
await page.setViewport({ width: 1440, height: 900 });
await page.goto("https://mandeltranszfer.hu/?nc=" + Date.now(), { waitUntil: "networkidle2", timeout: 45000 });
await new Promise((r) => setTimeout(r, 4000));
await page.screenshot({ path: "_build/live-hero.png" });
await page.evaluate(() => document.getElementById("routes3d")?.scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 3500));
await page.screenshot({ path: "_build/live-routes.png" });
console.log(logs.length ? logs.join("\n") : "no errors");
await browser.close();
