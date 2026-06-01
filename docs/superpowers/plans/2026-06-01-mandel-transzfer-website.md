# Mandel Transzfer Website — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern, conversion-focused, multilingual (HU/EN/DE), scroll-animated static website for Mandel Transzfer that replaces the old site and can be deployed to GitHub Pages (mandeltranszfer.hu).

**Architecture:** Vite-based static site. Single semantic HTML page with section partials, vanilla-JS modules for interactions, Lenis smooth scroll, GSAP/ScrollTrigger for scroll choreography, Three.js for the scroll-rotated 3D car. Client-side i18n via JSON dictionaries (HU default); a build step pre-renders localized `/en/` and `/de/` pages for SEO with `hreflang`. Quote form posts to Web3Forms (no backend).

**Tech Stack:** Vite, vanilla JS (ES modules), CSS (custom properties), Lenis, GSAP + ScrollTrigger, Three.js (GLTFLoader), Web3Forms, Google Fonts (Archivo, Inter).

---

## Visual constants (single source of truth)

```
--bg:#080b0f  --bg2:#0c1117  --gold:#e7c884  --gold-ink:#231a09
--text:#f4f1ea  --muted:#9aa3ad  --teal:#1aa6b0  --border:rgba(231,200,132,.22)
display font: Archivo 800/900 (all-caps headings)   body: Inter
Phone: +36 20 328 9955   Email: csaba.mandel@gmail.com
Facebook: https://www.facebook.com/Mandel-Transfer-112481643553395/
Prices from Tatabánya: Budapest airport 34 000 Ft-tól · Vienna (Schwechat) 59 000 Ft-tól
Cars: Kia e-Niro (electric), Škoda Octavia · up to 4 passengers/car (CONFIRM)
```

## File Structure

```
fater/
  package.json            # scripts + deps
  vite.config.js          # base, build outDir
  scripts/build-i18n.mjs  # generates /en/ and /de/ static pages + sitemap
  index.html              # HU page (source template with data-i18n)
  src/
    styles/main.css       # all styles (sectioned with comments)
    js/
      main.js             # entry: imports, init Lenis, nav, lang, form, reveals
      i18n.js             # dictionary import + applyLang(lang)
      scroll.js           # GSAP/ScrollTrigger choreography (parallax, pin, count-up)
      car3d.js            # Three.js scene: load GLB, scroll-scrub rotate, car swap
    i18n/
      hu.json en.json de.json
  public/
    assets/img/           # hero-night, runway-dusk, brand-graphic(kept), og, favicon
    assets/models/        # car-ev.glb, car-sedan.glb (or one model)
    robots.txt
    CNAME                 # mandeltranszfer.hu
```

---

### Task 1: Project scaffold (Vite + deps + fonts)

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html` (skeleton), `src/styles/main.css` (reset + tokens), `src/js/main.js` (empty init), `public/CNAME`, `public/robots.txt`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "mandel-transzfer",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && node scripts/build-i18n.mjs",
    "preview": "vite preview"
  },
  "devDependencies": { "vite": "^5.4.0" },
  "dependencies": { "gsap": "^3.12.5", "lenis": "^1.1.13", "three": "^0.169.0" }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'
export default defineConfig({ base: '/', build: { outDir: 'dist', assetsInlineLimit: 0 } })
```

- [ ] **Step 3: `public/CNAME`** → `mandeltranszfer.hu`. **`public/robots.txt`** →
```
User-agent: *
Allow: /
Sitemap: https://mandeltranszfer.hu/sitemap.xml
```

- [ ] **Step 4: `index.html` skeleton** with `<head>` (charset, viewport, Google Fonts preconnect+Archivo/Inter, favicon SVG data URI, title/description placeholders), and empty `<body>` linking `/src/js/main.js` (type=module) + `/src/styles/main.css`.

- [ ] **Step 5: `src/styles/main.css`** — CSS reset, `:root` tokens (above), base `body`/`.display` typography, `.reveal` utility.

- [ ] **Step 6: Install + run dev**

Run: `npm install` then `npm run dev`
Expected: Vite dev server starts (localhost:5173), blank dark page loads, fonts load.

- [ ] **Step 7: Commit** — `chore: scaffold vite project with tokens and fonts`

---

### Task 2: i18n core (dictionaries + apply + live switch)

**Files:**
- Create: `src/i18n/hu.json`, `en.json`, `de.json`, `src/js/i18n.js`
- Test: `scripts/check-i18n.mjs` (key-parity check)

- [ ] **Step 1: Write key-parity check `scripts/check-i18n.mjs`**

```js
import hu from '../src/i18n/hu.json' assert { type: 'json' }
import en from '../src/i18n/en.json' assert { type: 'json' }
import de from '../src/i18n/de.json' assert { type: 'json' }
const keys = o => Object.keys(o).sort()
const base = keys(hu)
for (const [name, d] of [['en', en], ['de', de]]) {
  const k = keys(d)
  const missing = base.filter(x => !k.includes(x))
  const extra = k.filter(x => !base.includes(x))
  if (missing.length || extra.length) { console.error(`${name} mismatch`, { missing, extra }); process.exit(1) }
}
console.log('i18n keys OK')
```

- [ ] **Step 2: Run it, expect FAIL** (`Cannot find module hu.json`). Confirms test runs before impl.

- [ ] **Step 3: Create `hu.json`/`en.json`/`de.json`** with EVERY visible string keyed (nav_*, hero_*, stat_*, brand_*, serv_*, fleet_*, price_*, form_*, foot_*). HU = source. (Reuse translations already drafted in the hero demo; extend to all sections.)

- [ ] **Step 4: Run check, expect PASS** (`i18n keys OK`).

- [ ] **Step 5: Create `src/js/i18n.js`**

```js
import hu from '../i18n/hu.json'
import en from '../i18n/en.json'
import de from '../i18n/de.json'
const DICT = { hu, en, de }
export function applyLang(lang) {
  const d = DICT[lang] || DICT.hu
  document.documentElement.lang = lang
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = d[el.dataset.i18n]; if (v != null) el.innerHTML = v
  })
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    // format: "attr:key,attr2:key2"
    el.dataset.i18nAttr.split(',').forEach(pair => {
      const [a, k] = pair.split(':'); if (d[k] != null) el.setAttribute(a, d[k])
    })
  })
}
```

- [ ] **Step 6: Commit** — `feat: i18n dictionaries (hu/en/de) with key-parity check`

---

### Task 3: Header / nav (sticky, language switcher, CTA)

**Files:** Modify `index.html` (nav markup), `src/styles/main.css` (nav styles), `src/js/main.js` (scrolled state + lang menu + applyLang call)

- [ ] **Step 1:** Add `<nav>` markup: brand `MANDEL.` + tracked `TRANSZFER`, links (data-i18n: nav_about/services/fleet/prices), lang dropdown (HU/EN/DE buttons calling a handler), gold `Ajánlatkérés` CTA (`href="#contact"`).
- [ ] **Step 2:** CSS: fixed nav, `.nav.scrolled` blurred dark bg, `.langmenu.open`, `.cta` with **dark gold-ink text (high contrast)** + hover lift.
- [ ] **Step 3:** `main.js`: `applyLang('hu')` on load; lang buttons → `applyLang(lang)` + update button label + persist to `localStorage`; nav scrolled toggle on scroll; click-outside closes menu.
- [ ] **Step 4: Verify** in dev: switching HU/EN/DE updates ALL nav text; nav darkens on scroll; CTA readable.
- [ ] **Step 5: Commit** — `feat: sticky nav with working language switcher`

---

### Task 4: Hero section (cinematic, oversized type, entrance + parallax)

**Files:** Modify `index.html` (hero), `main.css` (hero), `scroll.js` (parallax)

- [ ] **Step 1:** Hero markup: full-bleed `.hero-bg` (hero-night.webp), gradient `.hero-overlay`, content: kicker, `<h1>` two clip-reveal lines (BÁRMIKOR, / bárhová. gold), sub, CTA row (gold quote + ghost phone `tel:`), scroll cue. All text `data-i18n`. Image `alt` via `data-i18n-attr`.
- [ ] **Step 2:** CSS: hero 100vh, oversized clamp() Archivo 900, line clip + `@keyframes rise/up`, button contrast, scroll cue animation, `prefers-reduced-motion` disables entrance.
- [ ] **Step 3:** `scroll.js`: hero-bg parallax (`translateY(scrollY*0.35) scale(1.08)`) via GSAP or rAF.
- [ ] **Step 4: Verify** hero matches approved demo; text wraps OK in EN/DE; mobile legible.
- [ ] **Step 5: Commit** — `feat: cinematic hero with entrance animation and parallax`

---

### Task 5: Lenis smooth scroll + GSAP ScrollTrigger setup + reveal system

**Files:** Modify `src/js/main.js`, create `src/js/scroll.js`

- [ ] **Step 1:** `scroll.js`: init Lenis, RAF loop, `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add`. Export `initScroll()`.
- [ ] **Step 2:** Generic `.reveal` → ScrollTrigger batch: fade+rise on enter, stagger. Respect `prefers-reduced-motion` (no transform, instant show).
- [ ] **Step 3:** `main.js` calls `initScroll()`.
- [ ] **Step 4: Verify** smooth scrolling works; reveals trigger once on scroll.
- [ ] **Step 5: Commit** — `feat: Lenis smooth scroll + GSAP reveal system`

---

### Task 6: Trust/stats divider (full-bleed parallax + count-up)

**Files:** Modify `index.html`, `main.css`, `scroll.js`

- [ ] **Step 1:** Section: full-bleed runway-dusk bg (parallax), dark overlay, label, giant `30`, h2 "Év balesetmentesen az úton", 3 stat cards (4 fő / 2 reptér / 24-7). data-i18n on all.
- [ ] **Step 2:** CSS for `.divider`, `.bignum`, `.stats`/`.stat`.
- [ ] **Step 3:** `scroll.js`: divider bg parallax; GSAP count-up for `30`/`4`/`2` on enter.
- [ ] **Step 4: Verify** parallax + numbers animate; readable on mobile.
- [ ] **Step 5: Commit** — `feat: trust/stats divider with parallax and count-up`

---

### Task 7: Brand-graphic section (the kept image, presented cleanly)

**Files:** Modify `index.html`, `main.css`, `scroll.js`; asset `public/assets/img/brand-graphic.png`

- [ ] **Step 1:** Copy kept graphic to `public/assets/img/brand-graphic.png`. Section: roomy, centered framed graphic with subtle gold glow, short brand copy (data-i18n), no text overlapping the image.
- [ ] **Step 2:** CSS: framed card, glow, generous padding.
- [ ] **Step 3:** `scroll.js`: subtle parallax/float on the graphic + copy reveal.
- [ ] **Step 4: Verify** the kept image looks intentional and clean.
- [ ] **Step 5: Commit** — `feat: brand-identity section featuring the kept graphic`

---

### Task 8: Services section (3 cards, line icons, hover tilt)

**Files:** Modify `index.html`, `main.css`

- [ ] **Step 1:** 3 cards: Reptéri transzfer / Taxi / Egyedi-csoport út, each with inline SVG line icon, title, copy (data-i18n).
- [ ] **Step 2:** CSS grid, card style (subtle gradient + border), hover 3D-tilt (desktop, pointer-driven), reveal.
- [ ] **Step 3: Verify** cards render, translate, tilt on desktop only.
- [ ] **Step 4: Commit** — `feat: services section`

---

### Task 9: 3D car showcase (Three.js, scroll-scrub rotation, car swap)

**Files:** Modify `index.html`, `main.css`, create `src/js/car3d.js`; assets `public/assets/models/*.glb`

- [ ] **Step 1: Source a royalty-free GLB car model** (CC0/royalty-free, e.g. Poly Pizza / Khronos samples). Place `car.glb` (and optional second) in `public/assets/models/`. If sourcing fails, FALLBACK: a stylized low-poly car primitive built in code. Document the source + license in `docs/ASSETS.md`.
- [ ] **Step 2:** Pinned section markup: `<canvas>` + gold turntable, two info panels (Kia e-Niro / Škoda Octavia) with feature chips (data-i18n), progress label.
- [ ] **Step 3:** `car3d.js`: Three.js scene (camera, env light, gold ground glow), GLTFLoader, render loop; export `initCar3D()`. Lazy-init when section near viewport (IntersectionObserver) to keep initial load fast.
- [ ] **Step 4:** ScrollTrigger pin + scrub: map scroll progress → model `rotation.y` (0→2π); crossfade info panels Kia→Škoda at progress 0.5. Mobile: lighter (auto-rotate or static render) if perf low.
- [ ] **Step 5: Verify** model rotates on scroll-scrub, panels swap, no jank; fallback path works if model absent.
- [ ] **Step 6: Commit** — `feat: scroll-driven 3D car showcase (three.js)`

---

### Task 10: Prices section

**Files:** Modify `index.html`, `main.css`, `scroll.js`

- [ ] **Step 1:** 3 price cards: → Budapest reptér **34 000 Ft-tól**; → Bécs reptér (Ausztria) **59 000 Ft-tól** (label "Tatabányáról"); → Egyedi útvonal "Ajánlatkérés". "Minden út egyedi árképzésű" note. data-i18n.
- [ ] **Step 2:** CSS price cards; reveal; optional count-up on amounts.
- [ ] **Step 3: Verify** prices correct, translated.
- [ ] **Step 4: Commit** — `feat: indicative prices section`

---

### Task 11: Quote form (Web3Forms) + sticky mobile CTA

**Files:** Modify `index.html`, `main.css`, `src/js/main.js`

- [ ] **Step 1:** `<form>` posting to `https://api.web3forms.com/submit` with hidden `access_key` (placeholder `WEB3FORMS_KEY` — user pastes real key), fields: from, to, date, passengers, name, email/phone, message; honeypot; `data-i18n` labels/placeholders via `data-i18n-attr`.
- [ ] **Step 2:** JS: intercept submit → fetch POST → show success/fail message (data-i18n). GA event on success.
- [ ] **Step 3:** Sticky mobile CTA bar: Hívás (`tel:`) · WhatsApp (`https://wa.me/36203289955`) · Ajánlatkérés (`#contact`). Hidden on desktop.
- [ ] **Step 4:** CSS for form + sticky bar.
- [ ] **Step 5: Verify** form validates, submits (test key), success message localized; sticky bar on mobile.
- [ ] **Step 6: Commit** — `feat: quote form (web3forms) + sticky mobile CTA`

---

### Task 12: Footer + analytics

**Files:** Modify `index.html`, `main.css`, `main.js`

- [ ] **Step 1:** Footer: contact, Facebook link, lang note, privacy link (placeholder), copyright. data-i18n.
- [ ] **Step 2:** Add GA4 (or Plausible) snippet with placeholder ID; events for `tel:`/WhatsApp/form clicks.
- [ ] **Step 3: Verify** footer renders/translates.
- [ ] **Step 4: Commit** — `feat: footer + analytics events`

---

### Task 13: SEO — meta, JSON-LD, Open Graph, sitemap, hreflang, static i18n pages

**Files:** Modify `index.html` `<head>`; create `scripts/build-i18n.mjs`; generate `dist/en/index.html`, `dist/de/index.html`, `dist/sitemap.xml`

- [ ] **Step 1:** `<head>`: localized title/description (per page), canonical, OG + Twitter tags (og-image asset), `hreflang` alternates (hu/en/de + x-default).
- [ ] **Step 2:** JSON-LD `TaxiService`/`LocalBusiness` (name, areaServed Komárom-Esztergom/Tatabánya, telephone, services, priceRange, sameAs Facebook).
- [ ] **Step 3:** `scripts/build-i18n.mjs`: after `vite build`, read `dist/index.html`, produce `dist/en/index.html` and `dist/de/index.html` with localized text (from JSON), localized meta + canonical + active hreflang; write `dist/sitemap.xml` listing all three; default page sets `<html lang>` per locale and pre-applies dictionary so content is in source for crawlers.
- [ ] **Step 4: Verify** `npm run build` emits 3 localized pages + sitemap; view-source shows translated content + correct hreflang/canonical.
- [ ] **Step 5: Commit** — `feat: SEO meta, JSON-LD, OG, hreflang, localized static pages + sitemap`

---

### Task 14: Performance, accessibility, responsive pass

**Files:** Various

- [ ] **Step 1:** Convert raster images to WebP/AVIF with `srcset`; lazy-load below-fold; code-split Three.js (dynamic import in car3d init).
- [ ] **Step 2:** Audit: AA contrast (esp. gold buttons — dark ink), focus states, `aria-label`s, keyboard nav, `prefers-reduced-motion` across all animations.
- [ ] **Step 3:** Mobile breakpoints for hero type, stats, 3D (lighter), sticky CTA; test 360px.
- [ ] **Step 4:** Run Lighthouse (mobile). Target 90+ all categories. Fix regressions.
- [ ] **Step 5: Commit** — `perf+a11y: image optimization, contrast, reduced-motion, responsive`

---

### Task 15: Deploy config (GitHub Pages)

**Files:** Create `.github/workflows/deploy.yml`

- [ ] **Step 1:** GitHub Actions workflow: on push to main → `npm ci` → `npm run build` → deploy `dist/` to Pages. Ensure `CNAME` carried into `dist`.
- [ ] **Step 2:** Document in `README.md`: dev (`npm run dev`), build, deploy, where to paste Web3Forms key + GA id, how to swap car photos/model later.
- [ ] **Step 3: Verify** build output is Pages-ready (relative asset paths, CNAME present).
- [ ] **Step 4: Commit** — `ci: github pages deploy workflow + readme`

---

## Self-Review

- **Spec coverage:** Visual language → T1,T3,T4; i18n full → T2,T3,T13; tech (Vite/Lenis/GSAP/Three) → T1,T5,T9; scroll-events → T4,T5,T6,T7,T9,T10; sections (hero/stats/brand/services/cars/prices/form/footer) → T4,T6,T7,T8,T9,T10,T11,T12; conversion (form/sticky CTA/WhatsApp/prices) → T10,T11; SEO+ASO-clarified → T13; perf/a11y/responsive → T14; deploy → T15. Brand graphic kept → T7. No "8 fő" (4 used). Prices corrected → T10. ✔
- **Placeholders:** Real keys/values throughout; only deliberate user-supplied secrets (Web3Forms key, GA id) and CONFIRM items (passenger count, WhatsApp) are flagged — acceptable.
- **Type consistency:** `applyLang(lang)`, `initScroll()`, `initCar3D()`, `.reveal`, token names consistent across tasks. ✔
