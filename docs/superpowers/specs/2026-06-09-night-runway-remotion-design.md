# Night Runway — Remotion-alapú látványréteg a Mandel Transzfer oldalra

**Dátum:** 2026-06-09
**Branch:** `feat/night-runway-remotion`
**Állapot:** Spec (jóváhagyásra vár)

## Cél

A `mandeltranszfer.hu` oldalt feldobni egy szembetűnő, prémium, „modern tech / éjszakai
város" látványréteggel, Remotionnal készített, **renderelt loop-videók** formájában.
A meglévő sötét (#080b0f) + arany (#e7c884) dizájn, a HTML-struktúra, a tartalom és az
i18n (HU/EN/DE) **változatlan marad** — a videók a háttérbe/szekciók alá kerülnek.

Mellékcél: a flotta-képek konzisztenciájának javítása (a Mercedes és a Transit kép
jelenleg elüt az Octavia/Kia tiszta kivágásától).

## Stílus / hangulat

Modern tech / éjszakai város: **neon-arany + elektromos kék**, mozgó fénycsíkok,
nedves tükröződő aszfalt, filmes glow + finom szemcse. Visszafogottan dinamikus, nem
„arany bling".

## Architektúra

```
Remotion (remotion/ mappa, React/TSX)
   │  npm run render → public/assets/video/*.webm + *.mp4
   ▼
Vanilla Vite oldal (index.html + src/js + src/styles)
   <video autoplay muted loop playsinline poster=...> elemek
```

- A Remotion teljesen elkülönül a vanilla sitetól (saját belépési pont, már telepítve).
- A render kimenete `public/assets/video/`-ba kerül, így a Vite statikusként szolgálja.
- A weboldal kódjába **nem kerül React** — csak `<video>` elemek.

## Remotion kompozíciók

Mind a háromhoz: 1920×1080 mester, tökéletes (varratmentes) loop, webm (VP9) + mp4 (h264)
kimenet. Mobilra szükség szerint kisebb/rövidebb változat.

### 1. `HeroLoop` (~8 mp loop)
- **Réteg 1:** Gemini éjszakai reptér/város plate, lassú parallax ráközelítés (push-in).
- **Réteg 2:** átsuhanó neon-arany + elektromos-kék fénycsíkok (procedurális Remotion).
- **Réteg 3:** vignetta + filmszemcse + lágy fénylő glow.
- Felhasználás: a hero `.hero-bg` helyett `<video>` háttér; a hero tartalom (badge, H1,
  CTA, trust) változatlanul felette.

### 2. `FleetShowcase` (~10 mp loop, vagy 4 rövid klip)
- A 4 autó (`octavia`, `eniro`, `merci`, `transit`) sötét, tükröződő színpadon.
- Mindegyiken **neon-arany rim-fény** + lágy lebegés (float) + átsuhanó fénypászta-
  tükröződés. Ez **egységesíti** a kocsikat akkor is, ha a forrásképek kissé eltérnek.
- Felhasználás: a `#fleet` szekció háttere/dísze (a kártyák megmaradhatnak felette,
  vagy a showcase váltja ki — implementációkor véglegesítjük).

### 3. `SectionAmbient` (~6 mp loop, könnyű)
- Neon bokeh / fénycsík ambient, alacsony fájlméret.
- Felhasználás: stats/divider és további szekció-hátterek finom mozgása.

## Gemini-generált képek (a felhasználó generálja, kész promptokkal)

> A részletes, bemásolható Gemini-promptokat az implementációs terv tartalmazza.

- **A) Hero éjszakai plate** — éjszakai reptéri apron/kifutó + városi skyline, nedves
  tükröződő aszfalt, meleg arany kifutófények + hideg kék akcentek, hosszú-expozíciós
  fénycsíkok. 16:9, **felirat/logó nélkül**, sötét, filmes. (1–3 variáció.)
- **B) Mercedes + Transit újragenerálás** — tiszta **fehér seamless** stúdió-háttér,
  3/4 elöl-szög és semleges fény, az Octavia/Kia stílusához igazítva → könnyen kivágható,
  konzisztens. (Az Octavia és Kia marad.)
- **C) Opcionális** ambient textúrák (neon fénycsík/bokeh) a `SectionAmbient`-hez.

## Integráció (vanilla Vite)

- `<video autoplay muted loop playsinline poster="<fallback>">` webm+mp4 forrással.
- A meglévő `hero-night.jpg` marad **poszternek/fallbacknek**.
- `prefers-reduced-motion: reduce` → statikus poszter (akadálymentesség), videó nem indul.
- Mobil / `navigator.connection` lassú net → könnyebb loop vagy statikus poszter.
- A nem-hero videók (`FleetShowcase`, `SectionAmbient`) `IntersectionObserver`-rel,
  lazy módon töltődnek és indulnak.

## Teljesítmény-korlátok

- Loop-onként cél: **~2–3 MB alatt** (webm VP9/AV1 elsődleges, mp4 h264 fallback).
- Rövid, varratmentes loopok (8–10 mp), hogy kicsi maradjon a méret.
- A hero videó `preload="auto"` (poszterrel), a többi `preload="none"` + lazy.

## Scope (első kör)

**Teljes csomag:** `HeroLoop` + `FleetShowcase` + `SectionAmbient`, integráció és
fallbackek. A 2 hibás autó-kép Gemini-újragenerálásához kész promptok.

## Nem cél (YAGNI)

- Interaktív `@remotion/player` beágyazás (a renderelt videó elég a látványhoz).
- A meglévő tartalom/szövegek/i18n átírása.
- Az Octavia/Kia képek újragenerálása.
- A teljes hero-elrendezés átszabása — csak a háttérréteg cserélődik mozgóra.

## Kockázatok / nyitott pontok

- Gemini-képek minősége/konzisztenciája — több próbálkozás kellhet (a Remotion-színpad
  tompítja az eltéréseket).
- Videó fájlméret vs. minőség egyensúly — render-beállításokkal hangoljuk.
- Mobil teljesítmény — szükség esetén statikus poszterre esünk vissza.
```
