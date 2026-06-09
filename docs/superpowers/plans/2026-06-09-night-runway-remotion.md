# Night Runway — Remotion látványréteg — Implementációs terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **FONTOS — lokális munka:** A felhasználó kérése: **NE commitolj**. Minden „Checkpoint" lépés csak ellenőrzés (render/teszt/böngésző), `git commit` nélkül.

**Goal:** Remotionnal renderelt loop-videókkal (HeroLoop, FleetShowcase, SectionAmbient) feldobni a vanilla Vite oldalt, „modern tech / éjszakai város" stílusban, a meglévő dizájn és tartalom megtartásával.

**Architecture:** A Remotion (TSX, `remotion/` mappa) compositionöket `.webm`+`.mp4`-be renderelünk `public/assets/video/`-ba. A vanilla oldal `<video data-bg>` elemekkel ágyazza be őket; egy kis `src/js/video.js` kezeli az autoplay/lazy/reduced-motion logikát. A poszter-kép (`hero-night.jpg`) az univerzális fallback (no-JS / reduced-motion esetén). React NEM kerül a weboldalba.

**Tech Stack:** Remotion 4 (React 19, TSX), Vite 5 (vanilla JS), Node 24 `node:test` a logikai egységekhez.

---

## Fájlstruktúra

**Remotion (új/módosított):**
- `remotion/lib/colors.js` — márkapaletta konstansok (plain ESM JS).
- `remotion/lib/loop.js` — varratmentes loop-segédfüggvények (plain ESM JS).
- `remotion/lib/loop.test.js` — `node:test` tesztek a loop-helpershez.
- `remotion/components/LightStreaks.tsx` — procedurális neon fénycsíkok.
- `remotion/components/FilmGrain.tsx` — vignetta + szemcse overlay.
- `remotion/compositions/HeroLoop.tsx`
- `remotion/compositions/FleetShowcase.tsx`
- `remotion/compositions/SectionAmbient.tsx`
- `remotion/Root.tsx` — MÓDOSÍT: a 3 új composition regisztrálása.
- `remotion/MandelPromo.tsx` — TÖRÖL (minta, már nem kell).
- `tsconfig.json` — MÓDOSÍT: `allowJs: true` (hogy a .tsx importálhassa a .js helpereket).
- `scripts/render-videos.mjs` — ÚJ: mindhárom composition renderelése webm+mp4-be.
- `package.json` — MÓDOSÍT: render scriptek.

**Weboldal (módosított/új):**
- `src/js/video.js` — ÚJ: autoplay/lazy/reduced-motion vezérlés + `shouldAutoplay` tiszta függvény.
- `src/js/video.test.js` — ÚJ: `node:test` a `shouldAutoplay`-hez.
- `src/js/main.js` — MÓDOSÍT: `initVideos()` meghívása.
- `src/styles/main.css` — MÓDOSÍT: videóréteg stílusok.
- `index.html` — MÓDOSÍT: hero / fleet / divider `<video>` elemek.

**Deliverable doksi:**
- `docs/superpowers/assets/gemini-prompts.md` — ÚJ: bemásolható Gemini-promptok.

**Eszköz-kimenet (render hozza létre):**
- `public/assets/video/hero-loop.{webm,mp4}`
- `public/assets/video/fleet-showcase.{webm,mp4}`
- `public/assets/video/section-ambient.{webm,mp4}`

---

## Task 1: Márkapaletta + loop-helperek (TDD)

**Files:**
- Create: `remotion/lib/colors.js`
- Create: `remotion/lib/loop.js`
- Test: `remotion/lib/loop.test.js`
- Modify: `tsconfig.json`

- [ ] **Step 1: Írd meg a bukó tesztet** — `remotion/lib/loop.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { loopProgress, seamlessSine, pingPong } from "./loop.js";

test("loopProgress wraps to [0,1)", () => {
  assert.equal(loopProgress(0, 100), 0);
  assert.equal(loopProgress(50, 100), 0.5);
  assert.equal(loopProgress(100, 100), 0); // seam: end == start
  assert.equal(loopProgress(150, 100), 0.5);
});

test("seamlessSine matches at frame 0 and period (seamless loop)", () => {
  const a = seamlessSine(0, 60, 10);
  const b = seamlessSine(60, 60, 10);
  assert.ok(Math.abs(a - b) < 1e-9);
  assert.ok(Math.abs(seamlessSine(0, 60, 10)) < 1e-9); // sin(0)=0
});

test("pingPong is a 0..1..0 triangle", () => {
  assert.equal(pingPong(0, 100), 0);
  assert.ok(Math.abs(pingPong(50, 100) - 1) < 1e-9);
  assert.ok(Math.abs(pingPong(100, 100)) < 1e-9);
});
```

- [ ] **Step 2: Futtasd, hogy bukjon**

Run: `node --test remotion/lib/loop.test.js`
Expected: FAIL — `Cannot find module './loop.js'`

- [ ] **Step 3: Írd meg a `loop.js`-t**

```js
// remotion/lib/loop.js — varratmentes loop segédfüggvények (plain ESM)
export function loopProgress(frame, period) {
  if (period <= 0) return 0;
  return ((frame % period) + period) % period / period;
}

export function seamlessSine(frame, period, amplitude = 1, phase = 0) {
  return amplitude * Math.sin((frame / period) * Math.PI * 2 + phase);
}

export function pingPong(frame, period) {
  const p = loopProgress(frame, period); // 0..1
  return 1 - Math.abs(p * 2 - 1);
}
```

- [ ] **Step 4: Írd meg a `colors.js`-t**

```js
// remotion/lib/colors.js — márkapaletta
export const DARK = "#080b0f";
export const NAVY = "#0b1f3a";
export const GOLD = "#e7c884";
export const GOLD_DEEP = "#f5c451";
export const BLUE = "#4ea0ff";
export const BLUE_DEEP = "#2b6cff";
```

- [ ] **Step 5: Állítsd be a `tsconfig.json`-ban az `allowJs`-t** — a `compilerOptions` blokkba vedd fel:

```json
    "allowJs": true,
    "checkJs": false,
```

(A `tsconfig.json` jelenlegi `compilerOptions` után, a meglévő kulcsok mellé. Ne töröld a `noEmit`/`jsx`/`strict` kulcsokat.)

- [ ] **Step 6: Futtasd a tesztet, hogy ZÖLD legyen**

Run: `node --test remotion/lib/loop.test.js`
Expected: PASS — 3 teszt zöld.

- [ ] **Step 7: Checkpoint (no commit)** — `node --test remotion/lib/loop.test.js` zöld, `colors.js` és `loop.js` léteznek.

---

## Task 2: Újrahasználható vizuális komponensek

**Files:**
- Create: `remotion/components/LightStreaks.tsx`
- Create: `remotion/components/FilmGrain.tsx`

- [ ] **Step 1: Írd meg a `LightStreaks.tsx`-et**

```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loopProgress } from "../lib/loop.js";
import { GOLD, BLUE } from "../lib/colors.js";

export const LightStreaks: React.FC<{ count?: number; opacity?: number }> = ({
  count = 6,
  opacity = 0.5,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const p = loopProgress(frame, durationInFrames);

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", overflow: "hidden" }}>
      {Array.from({ length: count }).map((_, i) => {
        const phase = (i / count + p) % 1; // wrap → seamless
        const left = phase * (width + 600) - 300;
        const color = i % 2 === 0 ? GOLD : BLUE;
        const top = (i * 137) % 100;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${top}%`,
              left,
              width: 260,
              height: 3,
              borderRadius: 3,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              filter: "blur(1px)",
              opacity,
              transform: "rotate(-18deg)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Írd meg a `FilmGrain.tsx`-et** (statikus szemcse + vignetta — a statikus szemcse nem rontja a loopot)

```tsx
import { AbsoluteFill } from "remotion";

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export const FilmGrain: React.FC = () => (
  <>
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        boxShadow: "inset 0 0 300px 90px rgba(0,0,0,0.7)",
      }}
    />
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: 0.05,
        backgroundImage: `url("${GRAIN_SVG}")`,
        backgroundRepeat: "repeat",
      }}
    />
  </>
);
```

- [ ] **Step 3: Checkpoint (no commit)** — a fájlok léteznek; valódi ellenőrzés a Task 3 renderében.

---

## Task 3: HeroLoop composition + regisztráció + render

**Files:**
- Create: `remotion/compositions/HeroLoop.tsx`
- Modify: `remotion/Root.tsx`

- [ ] **Step 1: Írd meg a `HeroLoop.tsx`-et**

```tsx
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LightStreaks } from "../components/LightStreaks";
import { FilmGrain } from "../components/FilmGrain";
import { loopProgress } from "../lib/loop.js";
import { DARK } from "../lib/colors.js";

export const HERO_LOOP_DURATION = 240; // 8s @ 30fps

export type HeroLoopProps = { plate: string };

export const HeroLoop: React.FC<HeroLoopProps> = ({ plate }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = loopProgress(frame, durationInFrames);
  const wave = Math.sin(p * Math.PI * 2); // -1..1, seamless

  const scale = 1.07 + 0.04 * wave;
  const x = interpolate(wave, [-1, 1], [-18, 18]);
  const src = plate.startsWith("http") ? plate : staticFile(plate);

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <AbsoluteFill style={{ transform: `scale(${scale}) translateX(${x}px)` }}>
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 80% at 50% 30%, rgba(231,200,132,0.12), transparent 60%)",
        }}
      />
      <LightStreaks count={6} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(8,11,15,0.25) 0%, rgba(8,11,15,0) 35%, rgba(8,11,15,0.6) 100%)",
        }}
      />
      <FilmGrain />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Módosítsd a `remotion/Root.tsx`-et** — cseréld a teljes tartalmat erre:

```tsx
import { Composition } from "remotion";
import { HeroLoop, HERO_LOOP_DURATION } from "./compositions/HeroLoop";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroLoop"
        component={HeroLoop}
        durationInFrames={HERO_LOOP_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ plate: "assets/img/hero-night.jpg" }}
      />
    </>
  );
};
```

(A FleetShowcase és SectionAmbient a Task 4/5-ben kerül be ide.)

- [ ] **Step 3: Ellenőrizd a regisztrációt**

Run: `npx remotion compositions`
Expected: a listában szerepel `HeroLoop  30  1920x1080  240 (8.00 sec)`.

- [ ] **Step 4: Renderelj egy teszt-webm-et**

Run: `npx remotion render HeroLoop public/assets/video/hero-loop.webm --codec=vp9 --crf=34`
Expected: lefut, létrejön a fájl. Ha a `public/assets/video/` mappa nincs, hozd létre előbb: `mkdir -p public/assets/video`.

- [ ] **Step 5: Vizuális ellenőrzés** — nyisd meg a `public/assets/video/hero-loop.webm`-et (vagy `npm run video:studio` → HeroLoop). Ellenőrizd: sötét, mozgó fénycsíkok, lassú parallax, a vég varratmentesen visszaér az elejére.

- [ ] **Step 6: Checkpoint (no commit)** — `HeroLoop` renderel, a loop folytonos, fájlméret ésszerű (`ls -la public/assets/video/hero-loop.webm`, cél < ~3 MB; ha nagyobb, emeld a `--crf` értéket pl. 38-ra).

---

## Task 4: FleetShowcase composition + render

**Files:**
- Create: `remotion/compositions/FleetShowcase.tsx`
- Modify: `remotion/Root.tsx`

- [ ] **Step 1: Írd meg a `FleetShowcase.tsx`-et**

```tsx
import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { FilmGrain } from "../components/FilmGrain";
import { seamlessSine } from "../lib/loop.js";
import { GOLD } from "../lib/colors.js";

export const FLEET_PER = 75; // 2.5s / autó
export const CARS = [
  "assets/img/octavia.png",
  "assets/img/eniro.png",
  "assets/img/merci.png",
  "assets/img/transit.png",
];
export const FLEET_DURATION = FLEET_PER * CARS.length; // 300 = 10s

const CarSlide: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame(); // 0..FLEET_PER (Sequence-relatív)
  const fade = interpolate(frame, [0, 12, FLEET_PER - 12, FLEET_PER], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const float = seamlessSine(frame, 60, 14);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade }}>
      <div style={{ position: "relative", transform: `translateY(${float}px)` }}>
        <Img
          src={staticFile(src)}
          style={{ width: 1000, filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.6))" }}
        />
        <AbsoluteFill
          style={{
            background: `radial-gradient(60% 40% at 50% 50%, ${GOLD}22, transparent 70%)`,
            mixBlendMode: "screen",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const FleetShowcase: React.FC = () => (
  <AbsoluteFill
    style={{ background: "radial-gradient(120% 100% at 50% 0%, #11203a 0%, #080b0f 60%)" }}
  >
    <AbsoluteFill
      style={{ top: "70%", background: "linear-gradient(180deg, rgba(78,160,255,0.08), transparent)" }}
    />
    {CARS.map((src, i) => (
      <Sequence key={i} from={i * FLEET_PER} durationInFrames={FLEET_PER}>
        <CarSlide src={src} />
      </Sequence>
    ))}
    <FilmGrain />
  </AbsoluteFill>
);
```

> Megjegyzés: a loop varratánál (frame 300 → 0) a 4. autó kifade-el és az 1. befade-el, mindkettő feketén keresztül — ez sima átmenet, nem ugrik.

- [ ] **Step 2: Vedd fel a Root-ba** — a `remotion/Root.tsx`-ben az import sorhoz add:

```tsx
import { FleetShowcase, FLEET_DURATION } from "./compositions/FleetShowcase";
```

és a `</>` elé, a HeroLoop `<Composition>` után:

```tsx
      <Composition
        id="FleetShowcase"
        component={FleetShowcase}
        durationInFrames={FLEET_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
```

- [ ] **Step 3: Ellenőrizd a regisztrációt**

Run: `npx remotion compositions`
Expected: `FleetShowcase  30  1920x1080  300 (10.00 sec)` is a listában.

- [ ] **Step 4: Renderelj webm-et**

Run: `npx remotion render FleetShowcase public/assets/video/fleet-showcase.webm --codec=vp9 --crf=34`
Expected: lefut, fájl létrejön.

- [ ] **Step 5: Vizuális ellenőrzés** — a 4 autó sorban átúszik, arany rim-fénnyel, lágy lebegéssel, sötét színpadon. A jelenlegi (még nem javított) merci/transit is elfogadhatóan néz ki a sötét színpad + rim-fény miatt.

- [ ] **Step 6: Checkpoint (no commit)** — `FleetShowcase` renderel, loop folytonos, méret cél < ~3 MB.

---

## Task 5: SectionAmbient composition + render

**Files:**
- Create: `remotion/compositions/SectionAmbient.tsx`
- Modify: `remotion/Root.tsx`

- [ ] **Step 1: Írd meg a `SectionAmbient.tsx`-et**

```tsx
import { AbsoluteFill } from "remotion";
import { LightStreaks } from "../components/LightStreaks";
import { DARK } from "../lib/colors.js";

export const SECTION_AMBIENT_DURATION = 180; // 6s @ 30fps

export const SectionAmbient: React.FC = () => (
  <AbsoluteFill style={{ background: DARK }}>
    <LightStreaks count={10} opacity={0.35} />
    <AbsoluteFill
      style={{
        background: "radial-gradient(80% 60% at 50% 50%, rgba(231,200,132,0.06), transparent)",
      }}
    />
  </AbsoluteFill>
);
```

- [ ] **Step 2: Vedd fel a Root-ba** — import:

```tsx
import { SectionAmbient, SECTION_AMBIENT_DURATION } from "./compositions/SectionAmbient";
```

és `<Composition>` a `</>` elé:

```tsx
      <Composition
        id="SectionAmbient"
        component={SectionAmbient}
        durationInFrames={SECTION_AMBIENT_DURATION}
        fps={30}
        width={1280}
        height={720}
      />
```

- [ ] **Step 3: Renderelj webm-et** (kisebb felbontás → kis fájl)

Run: `npx remotion render SectionAmbient public/assets/video/section-ambient.webm --codec=vp9 --crf=36`
Expected: lefut, fájl < ~1.5 MB.

- [ ] **Step 4: Checkpoint (no commit)** — `npx remotion compositions` mind a 3 compositiont mutatja; a 3 webm létezik.

---

## Task 6: Render-pipeline (webm + mp4 mindháromhoz)

**Files:**
- Create: `scripts/render-videos.mjs`
- Modify: `package.json`

- [ ] **Step 1: Írd meg a `scripts/render-videos.mjs`-t**

```js
// Mindhárom composition renderelése webm (vp9) + mp4 (h264) formátumba.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const OUT = "public/assets/video";
mkdirSync(OUT, { recursive: true });

const JOBS = [
  { id: "HeroLoop", name: "hero-loop", crf: 34 },
  { id: "FleetShowcase", name: "fleet-showcase", crf: 34 },
  { id: "SectionAmbient", name: "section-ambient", crf: 36 },
];

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

for (const j of JOBS) {
  for (const [codec, ext] of [["vp9", "webm"], ["h264", "mp4"]]) {
    const out = `${OUT}/${j.name}.${ext}`;
    console.log(`Rendering ${j.id} -> ${out}`);
    execFileSync(
      npx,
      ["remotion", "render", j.id, out, `--codec=${codec}`, `--crf=${j.crf}`],
      { stdio: "inherit" }
    );
  }
}
console.log("Done.");
```

- [ ] **Step 2: Add hozzá a `package.json` scriptekhez** — a `"scripts"` blokkba:

```json
    "video:render:all": "node scripts/render-videos.mjs",
```

(A meglévő `video:studio` script maradjon; a régi `video:render` sort cseréld erre az `all`-osra vagy hagyd meg mellette — a `MandelPromo` törlése miatt a régi `video:render` már nem érvényes, ezért töröld a `"video:render": "remotion render MandelPromo ..."` sort.)

- [ ] **Step 3: Futtasd a teljes renderelést**

Run: `npm run video:render:all`
Expected: 6 fájl jön létre: `hero-loop.{webm,mp4}`, `fleet-showcase.{webm,mp4}`, `section-ambient.{webm,mp4}`.

- [ ] **Step 4: Checkpoint (no commit)** — `ls -la public/assets/video/` mind a 6 fájlt mutatja, mindegyik > 0 byte, a hero+fleet < ~3 MB, az ambient < ~1.5 MB.

---

## Task 7: Weboldal-integráció — autoplay/lazy logika + hero videó (TDD)

**Files:**
- Create: `src/js/video.js`
- Test: `src/js/video.test.js`
- Modify: `src/js/main.js`
- Modify: `src/styles/main.css`
- Modify: `index.html`

- [ ] **Step 1: Írd meg a bukó tesztet** — `src/js/video.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldAutoplay } from "./video.js";

test("autoplay only when motion allowed and not data-saver", () => {
  assert.equal(shouldAutoplay({ reducedMotion: false, saveData: false }), true);
  assert.equal(shouldAutoplay({ reducedMotion: true, saveData: false }), false);
  assert.equal(shouldAutoplay({ reducedMotion: false, saveData: true }), false);
  assert.equal(shouldAutoplay({ reducedMotion: true, saveData: true }), false);
});
```

- [ ] **Step 2: Futtasd, hogy bukjon**

Run: `node --test src/js/video.test.js`
Expected: FAIL — `Cannot find module './video.js'` vagy `shouldAutoplay is not a function`.

- [ ] **Step 3: Írd meg a `src/js/video.js`-t**

```js
// Háttérvideók progresszív bekapcsolása: autoplay csak ha van mozgásengedély
// és nincs adatspórolás; a nem-hero videók lazy módon töltődnek.
export function shouldAutoplay({ reducedMotion, saveData }) {
  return !(reducedMotion || saveData);
}

function loadVideo(v) {
  v.querySelectorAll("source[data-src]").forEach((s) => {
    if (!s.src) s.src = s.dataset.src;
  });
  v.load();
  const play = v.play?.();
  if (play && typeof play.catch === "function") play.catch(() => {});
}

export function initVideos(doc = document) {
  const reducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const saveData = navigator.connection?.saveData ?? false;

  const videos = [...doc.querySelectorAll("video[data-bg]")];
  if (!shouldAutoplay({ reducedMotion, saveData })) {
    // poszter marad, semmit nem töltünk
    return;
  }

  const eager = videos.filter((v) => !("lazy" in v.dataset));
  const lazy = videos.filter((v) => "lazy" in v.dataset);

  eager.forEach(loadVideo);

  if (lazy.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            loadVideo(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "200px" }
    );
    lazy.forEach((v) => io.observe(v));
  } else {
    lazy.forEach(loadVideo);
  }
}
```

- [ ] **Step 4: Futtasd a tesztet, hogy ZÖLD legyen**

Run: `node --test src/js/video.test.js`
Expected: PASS.

- [ ] **Step 5: Hívd meg az `initVideos`-t a `main.js`-ben** — a `src/js/main.js` tetejére (a többi import mellé):

```js
import { initVideos } from "./video.js";
```

és az inicializáló részben (ahol a DOM kész / a többi init fut) hívd meg:

```js
initVideos();
```

(Ha a `main.js` egy `DOMContentLoaded` handlerben vagy egy `init()`-ben fut, oda tedd; ha modul-szinten azonnal fut a többi init, oda.)

- [ ] **Step 6: Cseréld a hero hátteret videóra** — `index.html`-ben a hero `<div class="hero-bg"></div>` sort cseréld erre:

```html
    <video class="hero-bg-video" data-bg autoplay muted loop playsinline preload="auto" poster="/assets/img/hero-night.jpg" aria-hidden="true">
      <source data-src="/assets/video/hero-loop.webm" type="video/webm" />
      <source data-src="/assets/video/hero-loop.mp4" type="video/mp4" />
    </video>
```

> A `data-src` (üres `src`) miatt no-JS / reduced-motion esetén a videó nem töltődik, és a `poster` (hero-night.jpg) marad látható — ez az univerzális fallback.

- [ ] **Step 7: Add hozzá a CSS-t** — `src/styles/main.css` végére:

```css
/* --- Remotion háttérvideók --- */
.hero-bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
}
.hero .hero-content { position: relative; z-index: 2; }
```

> Ellenőrizd a meglévő `.hero` / `.hero-bg` z-index rétegzést a `main.css`-ben: a `.hero-content`, `.hero-overlay` stb. a videó FÖLÉ kell kerüljön (nagyobb z-index). Ha a meglévő `.hero-bg`-re vannak szabályok (gradiens/kép), azokat a videó megtartott poszteréhez igazítsd vagy hagyd a videó alatt (`z-index:0`).

- [ ] **Step 8: Indítsd a dev szervert és ellenőrizd böngészőben**

Run: `npm run dev`
Expected: a hero háttérben a mozgó loop megy, a szöveg/CTA olvasható felette. DevTools → emulate `prefers-reduced-motion: reduce` → a videó nem indul, a poszter látszik.

- [ ] **Step 9: Checkpoint (no commit)** — `node --test src/js/video.test.js` zöld; hero videó megy; reduced-motion fallback poszter működik.

---

## Task 8: Weboldal-integráció — fleet banner + divider ambient (lazy)

**Files:**
- Modify: `index.html`
- Modify: `src/styles/main.css`

- [ ] **Step 1: Tedd be a FleetShowcase bannert** — `index.html`-ben a `<section class="fleet" id="fleet">` belsejében, a szekciócím után és a `<div class="fleet-rows">` ELÉ szúrd be:

```html
    <div class="fleet-banner">
      <video class="section-video" data-bg data-lazy muted loop playsinline preload="none" poster="/assets/img/octavia.png" aria-hidden="true">
        <source data-src="/assets/video/fleet-showcase.webm" type="video/webm" />
        <source data-src="/assets/video/fleet-showcase.mp4" type="video/mp4" />
      </video>
    </div>
```

- [ ] **Step 2: Tedd be a SectionAmbient hátteret a divider szekcióba** — `index.html`-ben a `<section class="divider" id="about">` belsejében, a `<div class="divider-bg"></div>` UTÁN szúrd be:

```html
    <video class="section-video ambient" data-bg data-lazy muted loop playsinline preload="none" aria-hidden="true">
      <source data-src="/assets/video/section-ambient.webm" type="video/webm" />
      <source data-src="/assets/video/section-ambient.mp4" type="video/mp4" />
    </video>
```

- [ ] **Step 3: Add hozzá a CSS-t** — `src/styles/main.css` végére:

```css
.fleet-banner {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 7;
  max-height: 340px;
  overflow: hidden;
  border-radius: 16px;
  margin: 0 auto 2.5rem;
}
.section-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.divider { position: relative; }
.divider .section-video.ambient {
  z-index: 0;
  opacity: 0.5;
  pointer-events: none;
}
.divider .divider-in { position: relative; z-index: 2; }
```

> Ellenőrizd, hogy a `.divider-in` (tartalom) a `.divider-bg`/`.divider-ov`/ambient videó FÖLÖTT van (z-index). Igazítsd, ha a meglévő rétegzés mást diktál.

- [ ] **Step 4: Böngésző-ellenőrzés**

Run: `npm run dev`
Expected: a fleet szekció tetején a mozgó autó-banner; lefelé görgetve a `#fleet`/`#about` videók csak közeledtükkor indulnak (Network fülön a webm akkor töltődik — lazy). A stats/divider szekcióban finom ambient mozgás a szöveg mögött.

- [ ] **Step 5: Checkpoint (no commit)** — fleet banner és divider ambient megy, lazy betöltés a Network fülön igazolva, a szövegek olvashatók a videók felett.

---

## Task 9: Gemini-promptok (deliverable) + asset-csere útmutató

**Files:**
- Create: `docs/superpowers/assets/gemini-prompts.md`

- [ ] **Step 1: Hozd létre a `docs/superpowers/assets/gemini-prompts.md`-t**

````markdown
# Gemini képgenerálás — Night Runway assetek

A képeket Gemini (image) generálja; az alábbi promptok bemásolhatók.
A Remotion compositionök hot-swap módon használják: csak a fájlt kell felülírni
ugyanazon a néven, majd `npm run video:render:all`.

## A) Hero éjszakai plate → `public/assets/img/hero-night.jpg`
Felbontás: 1920×1080 (16:9). Felirat/logó NÉLKÜL.

Prompt:
> Cinematic wide night shot of a modern airport apron and runway with a distant
> city skyline, wet reflective asphalt, warm gold runway/taxiway lights and cool
> electric-blue accent lighting, long-exposure light trails from moving vehicles,
> shallow depth of field, moody premium atmosphere, deep blacks, subtle fog,
> no text, no logos, no people in focus. Color palette: deep navy-black, gold,
> electric blue. Photorealistic, 16:9.

## B) Mercedes S-osztály → `public/assets/img/merci.png`
Tiszta, fehér seamless stúdió-háttér, 3/4 elöl-szög, semleges fény (mint az Octavia/Kia).

Prompt:
> Studio product photo of a black Mercedes-Benz S-Class sedan, front 3/4 view
> from slightly above, on a pure seamless white background, even soft neutral
> studio lighting, no reflections of colored backgrounds, no tint, sharp, clean
> cutout-ready, full car in frame, photorealistic. Background: pure white #ffffff.

A kivágáshoz: ha nem átlátszó PNG-t ad, a fehér hátteret távolítsd el (pl.
remove.bg vagy Photoshop), és mentsd `merci.png` néven átlátszó háttérrel.

## C) Ford Transit kisbusz → `public/assets/img/transit.png`

Prompt:
> Studio product photo of a black Ford Transit passenger van (medium roof),
> front 3/4 view, on a pure seamless white background, even soft neutral studio
> lighting, no colored background reflections, no tint, sharp, clean cutout-ready,
> full vehicle in frame, photorealistic. Background: pure white #ffffff.

## Asset-csere lépések
1. Generáld a képet, mentsd a fenti útvonalra (felülírva a régit).
2. `merci`/`transit` esetén: az `index.html`-ben emeld a cache-bustert
   (`?v=7` → `?v=8`) a `.car-img` `<img>`-nél.
3. Futtasd újra: `npm run video:render:all` (a HeroLoop és FleetShowcase
   automatikusan az új képeket használja).
````

- [ ] **Step 2: Checkpoint (no commit)** — a prompt-doksi létezik, a 3 prompt és az asset-csere lépések benne vannak.

---

## Task 10: Takarítás + záró ellenőrzés

**Files:**
- Delete: `remotion/MandelPromo.tsx`
- Modify: `.gitignore` (ellenőrzés)

- [ ] **Step 1: Töröld a minta-compositiont**

Run: `rm remotion/MandelPromo.tsx`

(A `Root.tsx` már nem hivatkozik rá — a Task 3 felülírta. Ha valahol mégis import maradt, töröld azt is.)

- [ ] **Step 2: Ellenőrizd, hogy a render-kimenet verziókövetésbe kerül-e** — a `.gitignore` jelenleg `out/`-ot ignorál, de a `public/assets/video/` NEM ignorált (ez kell, hogy a site szolgálja). Erősítsd meg, hogy a `public/assets/video/*.webm/mp4` NINCS kizárva. Ha a felhasználó nem akarja verziókövetni a videókat, azt külön jelzi.

- [ ] **Step 3: Teljes ellenőrző futás**

Run: `node --test remotion/lib/loop.test.js src/js/video.test.js`
Expected: minden teszt zöld.

Run: `npx remotion compositions`
Expected: `HeroLoop`, `FleetShowcase`, `SectionAmbient` mind ott.

Run: `npm run dev` → böngészőben: hero loop megy, fleet banner megy, divider ambient megy, reduced-motion esetén poszterek. A meglévő `npm run build` (Vite + i18n) változatlanul fut: `npm run build`.

- [ ] **Step 4: Checkpoint (no commit)** — minden teszt zöld, mind a 3 videó megy az oldalon, a build sikeres, a minta-composition törölve.

---

## Megjegyzések az implementálónak

- **Nincs git commit** — a felhasználó lokálban dolgozik.
- A Gemini-képek (Task 9) **nem blokkolják** a fejlesztést: a compositionök a meglévő
  `hero-night.jpg` / autó-PNG-kkel működnek; az új képek csak felülírják ezeket, majd
  `npm run video:render:all`.
- Ha egy webm túl nagy: emeld a `--crf`-et (32→38), vagy csökkentsd a felbontást/hosszt.
- A loop-folytonosság a kulcs: minden mozgás `loopProgress`/`seamlessSine` alapú, ami a
  period végén visszaér a kezdőértékre — ezt vizuálisan mindig ellenőrizd a renderen.
