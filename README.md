# Mandel Transzfer — weboldal

Modern, többnyelvű (HU/EN/DE), scroll-animált, konverzió-fókuszú statikus oldal
reptéri transzferhez. Vite + GSAP/ScrollTrigger + Lenis + Three.js.

## Fejlesztés

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # statikus build a dist/ mappába (+ /en/ /de/ + sitemap)
npm run preview    # a build helyi megtekintése
npm run check:i18n # ellenőrzi, hogy HU/EN/DE kulcsok egyeznek
```

## Amit be kell állítani élesítés előtt

| Hol | Mit |
|-----|-----|
| `index.html` → `name="access_key"` | **Web3Forms** kulcs (ingyenes: web3forms.com) — ide jön az ajánlatkérő e-mail. Cseréld a `WEB3FORMS_ACCESS_KEY` helyőrzőt. |
| `index.html` → `<head>` | (Opcionális) Google Analytics 4 / Plausible script + mérési azonosító. |
| `public/assets/models/car.glb` | (Opcionális) valódi 3D autómodell. Ha hiányzik, kódból épített stilizált autó jelenik meg. |
| Autó-fotók | Jelenleg stock/3D. Saját fotó esetén cseréld a `public/assets/img/` képeket. |

## Tartalmi tények (ellenőrizendő)

- Max utasszám: **4 fő/autó** (megerősítendő).
- Árak Tatabányáról: Budapest reptér **34 000 Ft-tól**, Bécs/Ausztria **59 000 Ft-tól**.
- Tel: +36 20 328 9955 · csaba.mandel@gmail.com · Facebook.

## Deploy (GitHub Pages)

A `.github/workflows/deploy.yml` minden `main`-re pusholt commitnál buildel és
deployol. A `public/CNAME` tartalmazza a `mandeltranszfer.hu` domaint.
GitHub repo → Settings → Pages → Source: GitHub Actions.

## Struktúra

```
index.html              HU forrásoldal (data-i18n attribútumokkal)
src/styles/main.css      teljes stíluslap (tokenek + szekciók)
src/js/main.js           belépő: nyelv, nav, űrlap, scroll indítás
src/js/i18n.js           szótár + applyLang()
src/js/scroll.js         Lenis + GSAP koreográfia (parallax, pin, count-up)
src/js/car3d.js          Three.js 3D autó (GLB vagy kódból épített fallback)
src/i18n/*.json          HU/EN/DE fordítások
scripts/build-i18n.mjs   /en/ /de/ statikus oldalak + sitemap generálása
```
