// Mobile hero phases: pickup / drive / takeoff.
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle"] });
const page = await browser.newPage();
const logs = [];
page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 30000 });
await new Promise((r) => setTimeout(r, 2200));
await page.screenshot({ path: "_build/mh-1pickup.png" });
await new Promise((r) => setTimeout(r, 4000));
await page.screenshot({ path: "_build/mh-2drive.png" });
await new Promise((r) => setTimeout(r, 5000));
await page.screenshot({ path: "_build/mh-3takeoff.png" });
console.log(logs.length ? logs.join("\n") : "no errors");
await browser.close();
