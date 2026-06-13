// Renders the brand SVG favicon to PNG sizes and packs a multi-size favicon.ico.
// Uses the chrome-headless-shell that ships with @remotion + puppeteer-core.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pub = resolve(root, 'public');

const CHROME = resolve(
  root,
  'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe'
);
if (!existsSync(CHROME)) {
  console.error('chrome-headless-shell not found at', CHROME);
  process.exit(1);
}

const svg = readFileSync(resolve(pub, 'favicon.svg'), 'utf8');

const pngSizes = [16, 32, 48, 180, 192, 512];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--force-color-profile=srgb'],
});

const pngBuffers = {};
try {
  const page = await browser.newPage();
  for (const size of pngSizes) {
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    const html = `<!doctype html><html><head><style>
      html,body{margin:0;padding:0;background:transparent}
      svg{display:block;width:${size}px;height:${size}px}
    </style></head><body>${svg}</body></html>`;
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const buf = await page.screenshot({ omitBackground: true, type: 'png' });
    pngBuffers[size] = buf;
    writeFileSync(resolve(pub, `favicon-${size}.png`), buf);
  }
} finally {
  await browser.close();
}

// Named outputs used by the <head>.
writeFileSync(resolve(pub, 'apple-touch-icon.png'), pngBuffers[180]);
writeFileSync(resolve(pub, 'icon-192.png'), pngBuffers[192]);
writeFileSync(resolve(pub, 'icon-512.png'), pngBuffers[512]);

// Pack 16/32/48 PNGs into a single .ico (PNG-compressed entries — supported by
// all modern browsers and Google's favicon crawler).
function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const chunks = [];
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 0); // width
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1); // height
    dir.writeUInt8(0, o + 2); // palette
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // color planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(e.data.length, o + 8); // size of data
    dir.writeUInt32LE(offset, o + 12); // offset
    offset += e.data.length;
    chunks.push(e.data);
  });
  return Buffer.concat([header, dir, ...chunks]);
}

const ico = buildIco([
  { size: 16, data: pngBuffers[16] },
  { size: 32, data: pngBuffers[32] },
  { size: 48, data: pngBuffers[48] },
]);
writeFileSync(resolve(pub, 'favicon.ico'), ico);

console.log('Generated:', ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', ...pngSizes.map(s => `favicon-${s}.png`)].join(', '));
