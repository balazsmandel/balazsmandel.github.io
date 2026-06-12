// Mobile hero check across several phone viewports: pickup / drive / takeoff.
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PHONES = [
  { name: "s360", w: 360, h: 800 },
  { name: "s412", w: 412, h: 915 },
  { name: "i430", w: 430, h: 932 },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle"] });
for (const ph of PHONES) {
  const page = await browser.newPage();
  const logs = [];
  page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
  await page.setViewport({ width: ph.w, height: ph.h, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 6200)); // mid-drive
  await page.screenshot({ path: `_build/mh-${ph.name}-drive.png` });
  await new Promise((r) => setTimeout(r, 5500)); // mid-takeoff
  await page.screenshot({ path: `_build/mh-${ph.name}-takeoff.png` });
  console.log(ph.name, logs.length ? logs.join("; ") : "ok");
  await page.close();
}
await browser.close();
