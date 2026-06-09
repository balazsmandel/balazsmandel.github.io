# Gemini képgenerálás — Night Runway assetek

A képeket Gemini (image) generálja; az alábbi promptok bemásolhatók.
A Remotion compositionök hot-swap módon használják: csak a fájlt kell felülírni
ugyanazon a néven, majd `npm run video:render:all`.

## A) Hero éjszakai plate (epic transzfer-autóval) → `public/assets/img/hero-night.jpg`
Felbontás: 1920×1080 (16:9). Felirat/logó NÉLKÜL. Bal oldalt sötét negatív tér a címsornak.

Prompt:
> Epic cinematic wide night shot, 16:9 aspect ratio, of a sleek premium black
> executive sedan (luxury airport-transfer car) with a softly glowing amber roof
> taxi sign light (no readable lettering), driving on wet reflective asphalt
> through a modern city at night near an airport — distant runway, control tower
> and skyline with airplane lights in the background. Warm gold streetlights and
> cool electric-blue neon reflections on the glossy paint, dramatic long-exposure
> light trails streaking past, low dynamic hero camera angle, gold and blue rim
> lighting, shallow depth of field, volumetric fog, deep cinematic blacks,
> powerful premium mood. Keep the left side darker with negative space for a
> headline. No text, no brand logos, no watermark, no people in focus.
> Color palette: deep navy-black, gold, electric blue. Ultra-detailed,
> photorealistic, 8k.

Brutálisabb (Korona-stílus) változat: a `premium black executive sedan` helyett
`a jaw-dropping exotic supercar styled as a premium taxi, glossy with gold accents`.

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
