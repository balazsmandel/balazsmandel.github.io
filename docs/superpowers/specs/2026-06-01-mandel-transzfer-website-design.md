# Mandel Transzfer — modern weboldal · Tervdokumentum (spec)

**Dátum:** 2026-06-01
**Domain:** mandeltranszfer.hu (jelenleg GitHub Pages, CNAME)
**Cél:** A régi statikus oldal lecserélése egy modern, „stunning", erősen konverzió-fókuszú, SEO-optimalizált, többnyelvű, scroll-vezérelt (3D) oldalra.

---

## 1. Célok és sikermutatók

- **Több konverzió:** a fő cél, hogy a látogató **árajánlatot kérjen** (űrlap) vagy **telefonáljon/WhatsAppozzon**.
- **Modern, prémium élmény:** Awwwards-szintű hangulat (Lando Norris-stílus referencia): filmszerű fotók, óriás tipográfia, visszafogott paletta + egy arany akcentus, lágy scroll-animációk, WebGL 3D autó.
- **SEO:** organikus láthatóság a releváns kulcsszavakra (lásd 9.).
- **Többnyelvűség:** magyar (alapértelmezett) + angol + német — a reptéri transzfer nemzetközi/osztrák utasokat is kiszolgál.
- **Mérhetőség:** sikermutató = ajánlatkérő űrlap-kitöltések és hívás-/WhatsApp-kattintások száma (esemény-mérés analytics-ben).

---

## 2. Üzleti tények (tartalom forrása)

- **Cég:** Mandel Transzfer — reptéri transzfer + taxi szolgáltatás.
- **Terület:** Komárom-Esztergom megye (bázis: Tatabánya környéke).
- **Tapasztalat:** 30 év, balesetmentesen.
- **Autók:** **Kia e-Niro** (elektromos), **Škoda Octavia**.
- **Utasszám:** ~4 fő/autó (sedan) — **MEGERŐSÍTENDŐ** (a régi „8 fő" törölve).
- **Fő reptéri célok:** Budapest (Liszt Ferenc) és Bécs (Schwechat / Ausztria).
- **Tájékoztató („-tól") árak Tatabányáról:**
  - → Budapest reptér: **34 000 Ft-tól**
  - → Ausztria / Bécs reptér: **59 000 Ft-tól**
  - → Egyedi útvonal: ajánlatkérés (minden út egyedi árképzésű)
- **Elérhetőség:** +36 20 328 9955 · csaba.mandel@gmail.com · Facebook (Mandel Transfer).
- **Megtartandó asset:** a meglévő hero-grafika (repülő + világtérkép + tuk-tuk + „Bármikor, bárhová") — de **nem** a fő hero háttereként egymásra hányva, hanem dedikált „márka/identitás" elemként (lásd 6.4).

---

## 3. Vizuális nyelv (jóváhagyott irány)

- **Téma:** „Éjféli" sötét. Alap near-black `#080b0f` / `#0c1117`.
- **Akcentus:** **pezsgőarany** `#e7c884` (CTA-k, kiemelések). Visszafogottan — ez a „prémium" kulcsa. Türkiz csak nagyon finom másodlagos elem.
- **Szöveg:** meleg off-white `#f4f1ea`, tompított `#9aa3ad`.
- **Tipográfia:** display = **Archivo** (800–900, all-caps, feszes letter-spacing); szövegtörzs = **Inter**. Teljes magyar ékezet-támogatás.
- **Logó:** letisztult **MANDEL.** wordmark (arany pont) + „TRANSZFER" tracked alcím. (A régi logó elvetve.) — *Külön logó-finomítás a build elején; 2-3 variáció bemutatása.*
- **Favicon:** arany repülő-jel sötét lekerekített négyzeten (SVG, már kész).
- **Gombok:** arany háttér + **sötét, magas kontrasztú** szöveg (a korábbi „olvashatatlan" hiba javítva); hover: emelkedés + erősebb árnyék.
- **Mozgás-elv:** lassú, „ease-out", soha nem „snap". Kevesebb, de minőségi animáció.

---

## 4. Technológia

Statikus oldal (GitHub Pages-kompatibilis, backend nélkül), de modern eszközökkel:

- **Alap:** szemantikus HTML + modern CSS. Build: **Vite** (asset-optimalizálás, kép-tömörítés, kód-bundling). Kimenet: statikus fájlok GitHub Pages-re.
- **Smooth scroll:** **Lenis** (a díjnyertes oldalak alapja).
- **Scroll-animáció:** **GSAP + ScrollTrigger** (scrub, pin, reveal, parallax, számlálók).
- **3D autó:** **Three.js** — licencelt/ingyenes 3D autómodell (általános elektromos crossover + sedan sziluett), ami **görgetésre forog** (scroll-scrub), reflektorfény-anyaggal, az arany „bemutatótermi" korongon. *(Döntés: WebGL 3D modell, nem fotósorozat.)*
- **Képek:** WebP/AVIF, reszponzív `srcset`, lazy-load, méretre vágva. Forrás: **ingyenes, kereskedelmileg szabad stock** (Unsplash) + a megtartott márka-grafika. *(Döntés: stock — később cserélhető a saját fotókra.)*
- **Űrlap-háttér (backend nélkül):** **Web3Forms** vagy **Formspree** (ingyenes) → e-mail a csaba.mandel@gmail.com címre. Spam-védelem (honeypot + captcha opció). *(Alternatíva: `mailto:` — nem ajánlott, rossz UX.)*
- **Analytics:** Google Analytics 4 vagy Plausible (könnyű, GDPR-barát) — esemény-mérés (form submit, hívás-kattintás).
- **Hozzáférhetőség:** WCAG AA kontraszt, `prefers-reduced-motion` támogatás (animációk kikapcsolása), billentyűzet-navigáció.
- **Reszponzív:** mobil-első; a 3D/scroll-effektek mobilon is működnek (vagy könnyített változat), nem „csak desktopon szép".

---

## 5. Többnyelvűség (i18n)

- **Nyelvek:** HU (alap) · EN · DE. Nyelvváltó a fejlécben (a teljes oldal — **minden** szöveg, kártya, chip, lábléc — vált).
- **Megvalósítás:** különálló nyelvi útvonalak (`/`, `/en/`, `/de/`) statikus oldalakként, **vagy** JSON-szótár + JS-csere. SEO szempontból a **külön URL-ek + `hreflang`** a jobb (Google így indexeli mindhárom nyelvet). → **Javaslat: külön statikus oldalak nyelvenként, közös sablonból generálva (Vite + szótár).**
- Minden nyelvhez saját `<title>`, meta description, OG-tag, structured data.

---

## 6. Oldalszerkezet és scroll-eventek

Egyetlen, hosszú, görgethető főoldal (one-page), szekciókkal. Minden szekciónál jelölve a scroll-viselkedés.

### 6.1 Fejléc (sticky)
Logó · menü (A cégről, Szolgáltatások, Autóink, Árak, Kapcsolat) · nyelvváltó · arany **Ajánlatkérés** CTA.
**Scroll:** áttetszőből elsötétülő, blur-os háttér görgetésre; menü „magától" összehúzódik.

### 6.2 Hero
Teljes képernyős filmszerű fotó (éjszakai prémium fuvar). Óriás all-caps „BÁRMIKOR, BÁRHOVÁ." (arany második sor), kicker, alcím, arany CTA + telefon.
**Scroll-event:** háttér parallax (lassabban mozog, mint a szöveg), a főcím belépő „rise" animáció, scroll-jelző.

### 6.3 Bizalom / statisztika sáv
Full-bleed kifutópálya-fotó (parallax). Óriás **„30"** + „ÉV BALESETMENTESEN", majd 3 statisztika-kártya (utasszám, 2 reptér, 24/7).
**Scroll-event:** szám-felszámlálás (count-up) belépéskor, kártyák staggered reveal, háttér parallax.

### 6.4 A megtartott márka-grafika („Bármikor, bárhová" identitás)
A meglévő grafika dedikált, levegős szekcióban — keretezve, finom arany glow-val, rövid márka-szöveggel. Itt „él" az eredeti kép, tisztán, nem a hero mögött.
**Scroll-event:** a repülő/elemek finom úsztatása (parallax rétegek), szöveg reveal.

### 6.5 Szolgáltatások
3 kártya: Reptéri transzfer · Taxi · Egyedi/csoport út. Tiszta ikonográfia (vonalas, nem emoji).
**Scroll-event:** kártyák alulról beemelkednek, hover 3D-tilt (desktop).

### 6.6 Autóink — WebGL 3D bemutató (a fő „wow")
Pinned (ragadós) szekció: **Three.js 3D autómodell** az arany korongon, ami **görgetésre 360°-ban forog** (scroll-scrub). Görgetve átvált **Kia e-Niro → Škoda Octavia**, mindkettőhöz feature-lista (elektromos/csendes; tágas/nagy csomagtér). Stock kiegészítő fotók.
**Scroll-event:** scroll-scrub modell-forgatás, autó-váltás áttűnéssel, spec-chipek beúsznak.

### 6.7 Árak
Tájékoztató „-tól" árkártyák (Budapest 34 000 Ft, Ausztria 59 000 Ft Tatabányáról, egyedi: ajánlatkérés). Egyértelmű „minden út egyedi" üzenet.
**Scroll-event:** kártyák reveal, ár-szám finom count-up.

### 6.8 Ajánlatkérő űrlap (fő konverzió)
Mezők: Honnan · Hová · Dátum/időpont · Utasszám · Név · E-mail/telefon · (opcionális) megjegyzés. Web3Forms → e-mail. Sikeres küldés visszajelzés. Bizalom-erősítők a közelben (30 év, balesetmentes, gyors válasz).
**Scroll-event:** szekció reveal; sticky mobil CTA-sáv (Hívás / WhatsApp / Ajánlatkérés) végig elérhető.

### 6.9 Miért minket? / vélemények (opcionális, ha van)
Rövid USP-k + (ha lesz) ügyfél-vélemények. *Vélemények: tartalom szükséges — később.*

### 6.10 Lábléc
Elérhetőség, Facebook, nyelv, adatkezelési tájékoztató link, copyright.

### Globális konverziós elemek
- **Sticky mobil CTA-sáv** (Hívás · WhatsApp · Ajánlatkérés).
- **WhatsApp** gomb (ha van WhatsApp-os szám — **MEGERŐSÍTENDŐ**).
- Kattintható telefon/e-mail mindenhol.

---

## 7. Konverzió-optimalizálás (CRO)

- Egyértelmű, ismétlődő elsődleges CTA: **„Kérek árajánlatot"** (arany), másodlagos: hívás.
- „-tól" árak a bizalomért (nem rejtjük el az árszintet).
- Bizalmi jelek: 30 év, balesetmentes, valódi elérhetőség, (később) vélemények.
- Rövid, súrlódásmentes űrlap; mobilon kiemelt hívás-gomb.
- Gyors betöltés (a sebesség közvetlenül növeli a konverziót).

---

## 8. SEO (és „ASO" tisztázása)

> **Megjegyzés az ASO-ról:** az ASO (App Store Optimization) **alkalmazás-boltokra** vonatkozik. Mivel ez egy **weboldal**, nincs ASO; a megfelelője a **technikai + helyi SEO** és a **Google Cégprofil (Google Business Profile)** optimalizálása. Ezt visszük végig. (Ha később lesz mobilapp/PWA, az külön projekt.)

- **Technikai SEO:** szemantikus HTML, gyors betöltés (Core Web Vitals), reszponzív, `sitemap.xml`, `robots.txt`, canonical, tiszta URL-ek.
- **Többnyelvű SEO:** `hreflang` HU/EN/DE, nyelvenként külön indexelhető oldal, lokalizált meta.
- **Meta + közösségi:** egyedi `<title>`/description nyelvenként, Open Graph + Twitter Card képek.
- **Structured data (JSON-LD):** `TaxiService` / `LocalBusiness` séma — cégnév, terület (Komárom-Esztergom, Tatabánya), telefon, nyitvatartás, szolgáltatások, árszint; `BreadcrumbList`; `FAQPage` (ha lesz GYIK).
- **Kulcsszavak (HU példa):** „reptéri transzfer Tatabánya", „reptéri transzfer Komárom-Esztergom", „Bécs reptér transzfer", „Budapest reptér transzfer", „repülőtéri taxi Tatabánya", „Schwechat transzfer". EN/DE megfelelők.
- **Helyi SEO:** Google Cégprofil javaslatok (kép, kategória, szolgáltatási terület, értékelések kérése) — *teendő-lista a launch után.*
- **Tartalom:** minden képnek értelmes `alt`; H1–H2 hierarchia; (opció) rövid GYIK szekció a kulcsszavakra.

---

## 9. Teljesítmény és hozzáférhetőség

- Lighthouse cél: 90+ minden kategóriában (mobil is).
- Képek: AVIF/WebP, `srcset`, lazy-load, méretezve; a 3D modell és scriptek code-split + lazy.
- `prefers-reduced-motion`: animációk visszafogása.
- Billentyűzet- és képernyőolvasó-barát; AA kontraszt (a gomb-olvashatóság javítva).

---

## 10. Assetek és teendők

**Tőled (opcionális, később cserélhető):**
- Tényleges max **utasszám** megerősítése (autónként és összesen).
- Van-e **WhatsApp** szám a CTA-hoz?
- Logó: jelenlegi „MANDEL." irány OK, vagy mutassak 2-3 variációt? (a build elején)
- Később: saját autó-fotók, ügyfél-vélemények, pontosabb árlista, adatkezelési tájékoztató szövege.

**Én intézem:**
- Stock fotók (kereskedelmileg szabad), 3D autómodell (licenc-tiszta), ikonok, kód, animációk, fordítások (HU/EN/DE), SEO-beállítások, űrlap-integráció.

---

## 11. Hatókörön kívül (most nem)
- Online fizetés / valós idejű foglalási rendszer naptárral.
- Mobilalkalmazás / PWA (külön projekt).
- Sofőr-/diszpécser rendszer.
- Blog (később SEO-bővítésként megfontolható).

---

## 12. Nyitott kérdések (megerősítendő)
1. Pontos max **utasszám**?
2. **WhatsApp** szám van-e?
3. Logó: maradjon a „MANDEL." irány, vagy variációk kellenek?
4. Az „Ausztria 59 000 Ft" = **Bécs reptér** Tatabányáról, vagy általános Ausztria-irányár? (a kártya feliratához)
