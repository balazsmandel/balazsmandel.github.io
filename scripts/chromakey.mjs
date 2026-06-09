// Green/teal screen chroma key. Metrika: g - r (zöldet ÉS tealt is megfog).
// Lépések: alpha-kulcs → lyuk-kitöltés (belső zöld-tükröződések vissza) →
// despill (zöld szegély le) → legnagyobb folt (vízjel ki) → tight crop.
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

const T_NONE = 22; // g-r ez alatt: autó (átlátszatlan)
const T_FULL = 70; // g-r efölött: háttér (átlátszó)

function key(srcPath, dstPath, pad = 0.03) {
  const png = PNG.sync.read(readFileSync(srcPath));
  const { width: W, height: H, data } = png;
  const N = W * H;

  // 1) alpha a g-r alapján
  for (let p = 0; p < N; p++) {
    const i = p * 4;
    const k = data[i + 1] - data[i]; // g - r
    let a = 255;
    if (k >= T_FULL) a = 0;
    else if (k > T_NONE) a = Math.round(255 * (1 - (k - T_NONE) / (T_FULL - T_NONE)));
    data[i + 3] = a;
  }

  // 2) lyuk-kitöltés: a szélről elérhető átlátszó = valódi háttér; a belső
  //    átlátszó (autón belüli zöld tükröződés) → vissza átlátszatlanra.
  const BG = 30;
  const borderBg = new Uint8Array(N);
  const stack = [];
  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (!borderBg[p] && data[p * 4 + 3] < BG) { borderBg[p] = 1; stack.push(p); }
  };
  for (let x = 0; x < W; x++) { pushIf(x, 0); pushIf(x, H - 1); }
  for (let y = 0; y < H; y++) { pushIf(0, y); pushIf(W - 1, y); }
  while (stack.length) {
    const q = stack.pop(), x = q % W, y = (q / W) | 0;
    pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1);
  }
  for (let p = 0; p < N; p++) {
    if (data[p * 4 + 3] < BG && !borderBg[p]) data[p * 4 + 3] = 255; // belső lyuk vissza
  }

  // 3) despill: a green/teal szennyezést a red csatornához semlegesítjük
  //    (a zöld ÉS a kék kiugrást is levesszük, kis hűvös tartással a kéken)
  for (let p = 0; p < N; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) continue;
    const r = data[i];
    if (data[i + 1] > r) data[i + 1] = r;           // zöld → r
    if (data[i + 2] > r + 4) data[i + 2] = r + 4;   // kék/teal → ~r
  }

  // 4) legnagyobb összefüggő átlátszatlan folt (vízjel/pötty ki)
  const opaque = new Uint8Array(N);
  for (let p = 0; p < N; p++) opaque[p] = data[p * 4 + 3] > 40 ? 1 : 0;
  const label = new Int32Array(N).fill(-1);
  let best = -1, bestSize = 0, cur = 0;
  for (let s = 0; s < N; s++) {
    if (!opaque[s] || label[s] !== -1) continue;
    label[s] = cur; stack.length = 0; stack.push(s); let size = 0;
    while (stack.length) {
      const q = stack.pop(); size++;
      const x = q % W, y = (q / W) | 0;
      if (x > 0 && opaque[q - 1] && label[q - 1] === -1) { label[q - 1] = cur; stack.push(q - 1); }
      if (x < W - 1 && opaque[q + 1] && label[q + 1] === -1) { label[q + 1] = cur; stack.push(q + 1); }
      if (y > 0 && opaque[q - W] && label[q - W] === -1) { label[q - W] = cur; stack.push(q - W); }
      if (y < H - 1 && opaque[q + W] && label[q + W] === -1) { label[q + W] = cur; stack.push(q + W); }
    }
    if (size > bestSize) { bestSize = size; best = cur; }
    cur++;
  }
  for (let p = 0; p < N; p++) if (opaque[p] && label[p] !== best) data[p * 4 + 3] = 0;

  // 5) tight crop az átlátszatlan rész köré
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > 20) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const pw = Math.round((maxX - minX) * pad), ph = Math.round((maxY - minY) * pad);
  minX = Math.max(0, minX - pw); minY = Math.max(0, minY - ph);
  maxX = Math.min(W - 1, maxX + pw); maxY = Math.min(H - 1, maxY + ph);
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const out = new PNG({ width: cw, height: ch });
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const si = ((y + minY) * W + (x + minX)) * 4, di = (y * cw + x) * 4;
    out.data[di] = data[si]; out.data[di + 1] = data[si + 1];
    out.data[di + 2] = data[si + 2]; out.data[di + 3] = data[si + 3];
  }
  writeFileSync(dstPath, PNG.sync.write(out));
  console.log(`${dstPath}: ${W}x${H} -> crop ${cw}x${ch}, blob ${bestSize}px`);
}

key("_refs/merci.png", "public/assets/img/merci.png");
key("_refs/trasit.png", "public/assets/img/transit.png");
