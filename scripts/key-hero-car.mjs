// Keys the hypercar studio shot out of its dark backdrop so it composites
// into the hero night seamlessly. Per-row background estimate from the edge
// strips (the backdrop is a smooth gradient), alpha by colour distance.
// Imperfect alpha on the black body is invisible: near-black over near-black.
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "assets/img/hypercar.png";
const DST = "public/assets/img/hero-car.png";
const MAXW = 1600;
const T0 = 16, T1 = 52; // colour distance: below T0 transparent, above T1 opaque
const STRIP = 36;       // edge strip width used to estimate the backdrop

const src = PNG.sync.read(readFileSync(SRC));
const { width: W0, height: H0 } = src;

// 1) per-row backdrop estimate from left+right strips
const bg = new Float32Array(H0 * 3);
for (let y = 0; y < H0; y++) {
  let r = 0, g = 0, b = 0, n = 0;
  for (const x of [...Array(STRIP).keys(), ...Array.from({ length: STRIP }, (_, i) => W0 - 1 - i)]) {
    const i = (y * W0 + x) * 4;
    r += src.data[i]; g += src.data[i + 1]; b += src.data[i + 2]; n++;
  }
  bg[y * 3] = r / n; bg[y * 3 + 1] = g / n; bg[y * 3 + 2] = b / n;
}

// 2) alpha = smooth distance from the row's backdrop colour
for (let y = 0; y < H0; y++) {
  for (let x = 0; x < W0; x++) {
    const i = (y * W0 + x) * 4;
    const d = Math.abs(src.data[i] - bg[y * 3]) +
      Math.abs(src.data[i + 1] - bg[y * 3 + 1]) +
      Math.abs(src.data[i + 2] - bg[y * 3 + 2]);
    const a = d <= T0 ? 0 : d >= T1 ? 255 : Math.round(((d - T0) / (T1 - T0)) * 255);
    src.data[i + 3] = Math.min(src.data[i + 3], a)
  }
}

// 3) downscale to MAXW (simple box sampling)
const s = Math.min(1, MAXW / W0);
const W = Math.round(W0 * s), H = Math.round(H0 * s);
const out = new PNG({ width: W, height: H });
const inv = 1 / s;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const x0 = Math.floor(x * inv), x1 = Math.min(W0, Math.ceil((x + 1) * inv));
    const y0 = Math.floor(y * inv), y1 = Math.min(H0, Math.ceil((y + 1) * inv));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W0 + xx) * 4;
      const al = src.data[i + 3] / 255;
      r += src.data[i] * al; g += src.data[i + 1] * al; b += src.data[i + 2] * al; a += src.data[i + 3]; n++;
    }
    const o = (y * W + x) * 4;
    const al = a / n / 255;
    out.data[o] = al > 0.01 ? Math.round(r / n / al) : 0;
    out.data[o + 1] = al > 0.01 ? Math.round(g / n / al) : 0;
    out.data[o + 2] = al > 0.01 ? Math.round(b / n / al) : 0;
    out.data[o + 3] = Math.round(a / n);
  }
}
writeFileSync(DST, PNG.sync.write(out));
console.log(`${DST}: ${W0}x${H0} -> ${W}x${H}, keyed`);
