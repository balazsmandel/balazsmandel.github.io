// Bakes a static dark night-map of the HU/AT/SK region from CARTO dark tiles
// (© OpenStreetMap contributors, © CARTO — attribution shown on the site).
// Output: public/assets/img/map-night.png + src/js/fx/map-bounds.json with the
// exact mercator bounds so routes3d.js can project real lat/lon onto the plane.
import { PNG } from "pngjs";
import { writeFileSync, mkdirSync } from "node:fs";

const Z = 9;
const BOUNDS = { lonW: 15.4, lonE: 21.2, latS: 46.55, latN: 48.95 };

const lon2x = (lon) => ((lon + 180) / 360) * 2 ** Z;
const lat2y = (lat) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * 2 ** Z;
};
const x2lon = (x) => (x / 2 ** Z) * 360 - 180;
const y2lat = (y) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** Z))) * 180) / Math.PI;

const x0 = Math.floor(lon2x(BOUNDS.lonW));
const x1 = Math.floor(lon2x(BOUNDS.lonE));
const y0 = Math.floor(lat2y(BOUNDS.latN));
const y1 = Math.floor(lat2y(BOUNDS.latS));
const TILE = 256;
const W = (x1 - x0 + 1) * TILE;
const H = (y1 - y0 + 1) * TILE;
console.log(`tiles x ${x0}-${x1}, y ${y0}-${y1} -> ${W}x${H}px`);

const out = new PNG({ width: W, height: H });
const subs = ["a", "b", "c", "d"];
let n = 0;

for (let ty = y0; ty <= y1; ty++) {
  for (let tx = x0; tx <= x1; tx++) {
    const s = subs[(tx + ty) % subs.length];
    const url = `https://${s}.basemaps.cartocdn.com/dark_nolabels/${Z}/${tx}/${ty}.png`;
    const res = await fetch(url, { headers: { "User-Agent": "mandeltranszfer.hu map bake (one-off)" } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const tile = PNG.sync.read(Buffer.from(await res.arrayBuffer()));
    const ox = (tx - x0) * TILE, oy = (ty - y0) * TILE;
    for (let py = 0; py < TILE; py++) {
      for (let px = 0; px < TILE; px++) {
        const si = (py * TILE + px) * 4;
        const di = ((oy + py) * W + (ox + px)) * 4;
        out.data[di] = tile.data[si];
        out.data[di + 1] = tile.data[si + 1];
        out.data[di + 2] = tile.data[si + 2];
        out.data[di + 3] = 255;
      }
    }
    n++;
    process.stdout.write(`\rfetched ${n}/${(x1 - x0 + 1) * (y1 - y0 + 1)}`);
  }
}
console.log();

mkdirSync("public/assets/img", { recursive: true });
writeFileSync("public/assets/img/map-night.png", PNG.sync.write(out));

// exact geographic bounds of the stitched (tile-aligned) image
const bounds = {
  lonW: x2lon(x0), lonE: x2lon(x1 + 1),
  latN: y2lat(y0), latS: y2lat(y1 + 1),
  px: { w: W, h: H },
};
writeFileSync("src/js/fx/map-bounds.json", JSON.stringify(bounds, null, 2));
console.log("bounds:", bounds);
console.log("wrote public/assets/img/map-night.png + src/js/fx/map-bounds.json");
