import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const logs = [];
page.on("console", (m) => logs.push("console: " + m.text()));
page.on("pageerror", (e) => logs.push("pageerror: " + e.message));

await page.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 30000 });
await new Promise((r) => setTimeout(r, 2500));

const ct1 = await page.evaluate(() => {
  const v = document.querySelector(".hero-bg-video");
  return v ? v.currentTime : null;
});
await page.screenshot({ path: "public/assets/img/_shot1.png" });

await new Promise((r) => setTimeout(r, 2500));

const info = await page.evaluate(() => {
  const v = document.querySelector(".hero-bg-video");
  if (!v) return { found: false };
  const r = v.getBoundingClientRect();
  const cs = getComputedStyle(v);
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const topEl = document.elementFromPoint(cx, cy);
  return {
    found: true,
    paused: v.paused,
    currentTime: v.currentTime,
    readyState: v.readyState,
    networkState: v.networkState,
    error: v.error ? v.error.code + " " + v.error.message : null,
    videoWidth: v.videoWidth,
    videoHeight: v.videoHeight,
    currentSrc: v.currentSrc,
    muted: v.muted,
    autoplay: v.autoplay,
    loop: v.loop,
    rect: { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) },
    display: cs.display,
    visibility: cs.visibility,
    opacity: cs.opacity,
    zIndex: cs.zIndex,
    topElementAtCenter: topEl ? topEl.tagName + "." + (topEl.className || "") : null,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
});
await page.screenshot({ path: "public/assets/img/_shot2.png" });

console.log("currentTime @2.5s:", ct1);
console.log("currentTime @5.0s:", info.currentTime);
console.log("ADVANCING:", info.currentTime > ct1 + 0.1 ? "YES (plays)" : "NO (frozen)");
console.log("INFO:", JSON.stringify(info, null, 2));
console.log("LOGS:\n" + logs.slice(0, 25).join("\n"));

await browser.close();
