// Renders the raster images the site serves from its brand sources, with the Chromium the e2e already installs: the home's Open Graph card
// for each locale that has the home, public/og/home-<locale>-v<version>.jpg, and the apple-touch-icon, src/app/apple-icon.png.
//
//   node apps/landing/scripts/brand-images.mjs [hero master]
//
// The art defaults to the shipped hero (_art/home-hero.webp); the cards in the repo come from its lossless 1280x720 PNG master. A changed card
// is a new version: bump `version` here and in ogCard (the home's metadata.ts), and keep the old files, which links already shared point at
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import resolved from '@nasqa/trama-theme-opta/tokens.resolved.json' with { type: 'json' };
import { chromium } from '@playwright/test';
import en from '../messages/en.json' with { type: 'json' };
import es from '../messages/es.json' with { type: 'json' };

const version = 2;
const card = { width: 1200, height: 630, inset: 60, maxBytes: 300_000 };
// The headline ends above this line, which keeps a margin of paper over the mountains on the left and the palms on the right
const skyFloor = 300;
const minContrast = 7;
// Room kept around every line, so no word grazes a palm or a ridge even where the contrast would pass
const clearance = 16;

const app = join(import.meta.dirname, '..');
const assets = join(app, 'src/modules/site-shell/assets');
const art = process.argv[2] ?? join(app, 'src/app/[locale]/(site)/_art/home-hero.webp');
const mime = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const dataUri = async (path) => `data:${mime[extname(path)]};base64,${(await readFile(path)).toString('base64')}`;

const { light } = resolved;
const ink = light['color.text.primary'].hex;
const paper = light['color.surface.canvas'].hex;

// The band is the hero's own 16:9 at the card's width, top-aligned, so the crop takes 45 px of foreground and keeps the sky; the sun sits where
// SceneBand puts it (scene-band.module.css: top 20 %, left 80 %, 16.1 % wide, centred)
const page = async ({ title, size }) => `<!doctype html>
<html><head><style>
  @font-face { font-family: Comfortaa; src: url(${await dataUri(fileURLToPath(import.meta.resolve('@nasqa/trama-theme-opta/fonts/comfortaa-latin-wght-normal.woff2')))}) format('woff2'); font-weight: 300 700; }
  html, body { margin: 0; }
  body { position: relative; width: ${card.width}px; height: ${card.height}px; overflow: hidden; background: ${paper}; }
  .band { position: absolute; top: 0; left: 0; width: ${card.width}px; aspect-ratio: 16 / 9; }
  .scene { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .sun { position: absolute; top: 20%; left: 80%; width: 16.1%; height: auto; translate: -50% -50%; }
  .text { position: absolute; top: ${card.inset}px; left: ${card.inset}px; width: 640px; }
  .logo { display: block; height: 52px; width: auto; }
  h1 { margin: 24px 0 0; color: ${ink}; font: 700 ${size}px/1.125 Comfortaa; letter-spacing: -0.0147em; text-wrap: balance; }
</style></head><body>
  <div class="band"><img class="scene" src="${await dataUri(art)}" alt=""><img class="sun" src="${await dataUri(join(assets, 'sun.svg'))}" alt=""></div>
  <div class="text"><img class="logo" src="${await dataUri(join(assets, 'opta-horizontal.svg'))}" alt=""><h1>${title.replace(/[&<>]/g, (character) => `&#${character.charCodeAt(0)};`)}</h1></div>
</body></html>`;

// WCAG 2 contrast of two sRGB colours
const luminance = (rgb) => {
  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};
const hexRgb = (hex) => [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));

// The headline's line boxes, and every distinct colour under them once the text is hidden: the real pixels each line sits on
const lineBoxes = (tab) =>
  tab.locator('h1').evaluate((h1) => {
    const range = document.createRange();
    range.selectNodeContents(h1);
    return [...range.getClientRects()].map(({ x, y, width, height }) => ({ x: Math.floor(x), y: Math.floor(y), width: Math.ceil(width), height: Math.ceil(height) }));
  });

const backdrop = async (tab, boxes) => {
  const hidden = await tab.addStyleTag({ content: 'h1 { color: transparent !important; }' });
  const png = (await tab.screenshot()).toString('base64');
  await hidden.evaluate((style) => style.remove());
  const pixels = await tab.evaluate(
    async ({ data, boxes }) => {
      const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
      const context = new OffscreenCanvas(image.width, image.height).getContext('2d');
      context.drawImage(image, 0, 0);
      const seen = new Set();
      for (const { x, y, width, height } of boxes) {
        const rgba = context.getImageData(x, y, width, height).data;
        for (let index = 0; index < rgba.length; index += 4) seen.add((rgba[index] << 16) | (rgba[index + 1] << 8) | rgba[index + 2]);
      }
      return [...seen];
    },
    { data: png, boxes },
  );
  return pixels.map((value) => [(value >> 16) & 255, (value >> 8) & 255, value & 255]);
};

// The largest headline that takes at most three lines, ends above the sky's floor and keeps 7:1 on every pixel behind and around it
const render = async (tab, title) => {
  for (let size = 60; size >= 36; size -= 2) {
    await tab.setContent(await page({ title, size }), { waitUntil: 'load' });
    const faces = await tab.evaluate(async (font) => (await document.fonts.load(font)).map((face) => face.status), `700 ${size}px Comfortaa`);
    if (faces.length === 0 || faces.some((status) => status !== 'loaded')) throw new Error('Comfortaa did not load: the card would ship the fallback font');
    const boxes = await lineBoxes(tab);
    if (boxes.length > 3 || Math.max(...boxes.map(({ y, height }) => y + height)) > skyFloor) continue;
    const padded = boxes.map(({ x, y, width, height }) => ({ x: x - clearance, y: y - clearance, width: width + 2 * clearance, height: height + 2 * clearance }));
    const worst = Math.min(...(await backdrop(tab, padded)).map((pixel) => contrast(hexRgb(ink), pixel)));
    if (worst >= minContrast) return { size, lines: boxes.length, worst };
  }
  throw new Error(`"${title}" does not fit on the paper sky`);
};

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: card.width, height: card.height }, deviceScaleFactor: 1 });
await mkdir(join(app, 'public/og'), { recursive: true });

for (const [locale, messages] of Object.entries({ es, en })) {
  if (!messages.Prelaunch) continue;
  const { size, lines, worst } = await render(tab, messages.Prelaunch.ogTitle);

  // The JPEG quality steps down until the card fits WhatsApp's budget with room to spare
  let quality = 90;
  let jpeg = await tab.screenshot({ type: 'jpeg', quality });
  while (jpeg.length > card.maxBytes) {
    if ((quality -= 5) < 50) throw new Error(`${locale}: the card is over ${card.maxBytes} bytes even at quality 55`);
    jpeg = await tab.screenshot({ type: 'jpeg', quality });
  }
  const path = join(app, `public/og/home-${locale}-v${version}.jpg`);
  await writeFile(path, jpeg);
  console.log(`${path}: ${jpeg.length} bytes, quality ${quality}, headline ${size}px in ${lines} lines, worst contrast ${worst.toFixed(2)}`);
}

// iOS paints a transparent touch icon's background black, so the ring sits on the paper canvas, opaque, at the 180 px Apple asks for, with the
// same margin as public/brand/opta-icon-512.png (src/app/icon.png): the SVG's own, the ring being 300 of its 420 units
await tab.setViewportSize({ width: 180, height: 180 });
await tab.setContent(
  `<!doctype html><html><body style="margin: 0; width: 180px; height: 180px; display: grid; place-items: center; background: ${paper}"><img src="${await dataUri(join(assets, 'opta-icon.svg'))}" alt="" style="width: 180px; height: 180px"></body></html>`,
  { waitUntil: 'load' },
);
await writeFile(join(app, 'src/app/apple-icon.png'), await tab.screenshot());
console.log(join(app, 'src/app/apple-icon.png'));

await browser.close();
