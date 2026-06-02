import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const root = process.cwd();

const androidIconSizes = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192]
];

const androidForegroundSizes = [
  ['mipmap-mdpi', 108],
  ['mipmap-hdpi', 162],
  ['mipmap-xhdpi', 216],
  ['mipmap-xxhdpi', 324],
  ['mipmap-xxxhdpi', 432]
];

const androidSplashSizes = [
  ['drawable/splash.png', 480, 320],
  ['drawable-port-mdpi/splash.png', 320, 480],
  ['drawable-port-hdpi/splash.png', 480, 800],
  ['drawable-port-xhdpi/splash.png', 720, 1280],
  ['drawable-port-xxhdpi/splash.png', 960, 1600],
  ['drawable-port-xxxhdpi/splash.png', 1280, 1920],
  ['drawable-land-mdpi/splash.png', 480, 320],
  ['drawable-land-hdpi/splash.png', 800, 480],
  ['drawable-land-xhdpi/splash.png', 1280, 720],
  ['drawable-land-xxhdpi/splash.png', 1600, 960],
  ['drawable-land-xxxhdpi/splash.png', 1920, 1280]
];

const iosSplashFiles = [
  'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png',
  'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png',
  'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png'
];

const outputs = [];

function resolveFile(filePath) {
  return path.join(root, filePath);
}

async function ensureParent(filePath) {
  await mkdir(path.dirname(resolveFile(filePath)), { recursive: true });
}

async function writeText(filePath, text) {
  await ensureParent(filePath);
  await writeFile(resolveFile(filePath), text);
  outputs.push(filePath);
}

function iconSvg({ width = 1024, height = 1024, transparent = false } = {}) {
  const bg = transparent
    ? ''
    : `
      <rect width="${width}" height="${height}" rx="${width * 0.24}" fill="url(#iconBg)"/>
      <path d="M0 ${height * 0.75} C${width * 0.26} ${height * 0.62} ${width * 0.58} ${height * 0.95} ${width} ${height * 0.72} L${width} ${height} L0 ${height}Z" fill="#D9F0DF" opacity=".9"/>
      <path d="M${width * 0.09} 0 H${width * 0.6} L${width * 0.21} ${height} H0 V${height * 0.12}Z" fill="#FFFFFF" opacity=".28"/>
      <path d="M${width * 0.78} ${-height * 0.06} L${width * 1.08} ${height * 0.24}" stroke="#FFFFFF" stroke-width="${width * 0.035}" opacity=".46" stroke-linecap="round"/>
    `;

  const boardX = width * 0.145;
  const boardY = height * 0.16;
  const boardW = width * 0.71;
  const boardH = height * 0.69;
  const route = `
    <g filter="url(#softShadow)" transform="rotate(-4 ${width / 2} ${height / 2})">
      <rect x="${boardX}" y="${boardY}" width="${boardW}" height="${boardH}" rx="${width * 0.115}" fill="#F8FBF4"/>
      <rect x="${boardX + width * 0.026}" y="${boardY + width * 0.026}" width="${boardW - width * 0.052}" height="${boardH - width * 0.052}" rx="${width * 0.088}" fill="#E7F3EA"/>
      <path d="M${width * 0.27} ${height * 0.34} H${width * 0.65} Q${width * 0.76} ${height * 0.34} ${width * 0.76} ${height * 0.45} V${height * 0.66}" stroke="#FFFFFF" stroke-width="${width * 0.098}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.27} ${height * 0.34} H${width * 0.65} Q${width * 0.76} ${height * 0.34} ${width * 0.76} ${height * 0.45} V${height * 0.66}" stroke="#5FC68E" stroke-width="${width * 0.054}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.24} ${height * 0.67} H${width * 0.5} V${height * 0.46} H${width * 0.64}" stroke="#FFFFFF" stroke-width="${width * 0.094}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.24} ${height * 0.67} H${width * 0.5} V${height * 0.46} H${width * 0.64}" stroke="#54A6E8" stroke-width="${width * 0.051}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.35} ${height * 0.24} V${height * 0.53} H${width * 0.2}" stroke="#FFFFFF" stroke-width="${width * 0.09}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.35} ${height * 0.24} V${height * 0.53} H${width * 0.2}" stroke="#EC625B" stroke-width="${width * 0.05}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.58} ${height * 0.76} V${height * 0.57} H${width * 0.38}" stroke="#FFFFFF" stroke-width="${width * 0.076}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.58} ${height * 0.76} V${height * 0.57} H${width * 0.38}" stroke="#F0B83E" stroke-width="${width * 0.041}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="iconBg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#FFFDF4"/>
      <stop offset=".52" stop-color="#EAF6E8"/>
      <stop offset="1" stop-color="#BFE7D1"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="${height * 0.026}" stdDeviation="${height * 0.026}" flood-color="#274157" flood-opacity=".18"/>
    </filter>
    <filter id="tileShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="${height * 0.012}" stdDeviation="${height * 0.012}" flood-color="#24435B" flood-opacity=".25"/>
    </filter>
  </defs>
  ${bg}
  ${route}
  <g filter="url(#tileShadow)">
    ${arrowTile(width * 0.6, height * 0.43, width * 0.19, '#58BA77', 'right')}
    ${arrowTile(width * 0.32, height * 0.6, width * 0.17, '#D9544F', 'left')}
    ${arrowTile(width * 0.68, height * 0.67, width * 0.155, '#E4AE33', 'down')}
    ${arrowTile(width * 0.43, height * 0.29, width * 0.145, '#4F9FE0', 'up')}
  </g>
</svg>`;
}

function arrowTile(cx, cy, size, color, direction) {
  const r = size * 0.22;
  const x = cx - size / 2;
  const y = cy - size / 2;
  const points = {
    right: `${cx - size * 0.23},${cy - size * 0.24} ${cx + size * 0.26},${cy} ${cx - size * 0.23},${cy + size * 0.24}`,
    left: `${cx + size * 0.23},${cy - size * 0.24} ${cx - size * 0.26},${cy} ${cx + size * 0.23},${cy + size * 0.24}`,
    up: `${cx - size * 0.24},${cy + size * 0.23} ${cx},${cy - size * 0.26} ${cx + size * 0.24},${cy + size * 0.23}`,
    down: `${cx - size * 0.24},${cy - size * 0.23} ${cx},${cy + size * 0.26} ${cx + size * 0.24},${cy - size * 0.23}`
  }[direction];

  return `<g>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="#FFFFFF"/>
    <rect x="${x + size * 0.075}" y="${y + size * 0.075}" width="${size * 0.85}" height="${size * 0.85}" rx="${r * 0.8}" fill="${color}"/>
    <polygon points="${points}" fill="#FBFFF9"/>
    <path d="M${x + size * 0.19} ${y + size * 0.18} H${x + size * 0.73}" stroke="#FFFFFF" stroke-width="${size * 0.046}" opacity=".38" stroke-linecap="round"/>
  </g>`;
}

function splashSvg(width, height) {
  const min = Math.min(width, height);
  const isPortrait = height >= width;
  const logoSize = min * (isPortrait ? 0.32 : 0.24);
  const logoX = width / 2 - logoSize / 2;
  const logoY = height * (isPortrait ? 0.33 : 0.32) - logoSize / 2;
  const titleY = height * (isPortrait ? 0.55 : 0.59);
  const boardOpacity = isPortrait ? 0.3 : 0.18;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="splashBg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#FFFDF4"/>
      <stop offset=".54" stop-color="#F0F8EB"/>
      <stop offset="1" stop-color="#C9EBD5"/>
    </linearGradient>
    <filter id="splashShadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="${min * 0.034}" stdDeviation="${min * 0.035}" flood-color="#264057" flood-opacity=".18"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#splashBg)"/>
  <path d="M${-width * 0.08} ${height * 0.08} H${width * 0.56} L${width * 0.22} ${height} H${-width * 0.08}Z" fill="#FFFFFF" opacity=".34"/>
  <path d="M${width} ${height * 0.14} L${width} ${height * 0.66} L${width * 0.6} ${height} H${width * 0.32}Z" fill="#D8F0DE" opacity=".48"/>
  <g opacity="${boardOpacity}">
    <path d="M${width * 0.1} ${height * 0.8} H${width * 0.88}" stroke="#FFFFFF" stroke-width="${min * 0.083}" stroke-linecap="round" fill="none"/>
    <path d="M${width * 0.1} ${height * 0.8} H${width * 0.88}" stroke="#5FC68E" stroke-width="${min * 0.04}" stroke-linecap="round" fill="none"/>
    <path d="M${width * 0.18} ${height * 0.9} H${width * 0.55} V${height * 0.74} H${width * 0.78}" stroke="#FFFFFF" stroke-width="${min * 0.078}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M${width * 0.18} ${height * 0.9} H${width * 0.55} V${height * 0.74} H${width * 0.78}" stroke="#54A6E8" stroke-width="${min * 0.038}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M${width * 0.68} ${height * 0.72} V${height * 0.88}" stroke="#F0B83E" stroke-width="${min * 0.034}" stroke-linecap="round" fill="none"/>
  </g>
  <g transform="translate(${logoX} ${logoY}) scale(${logoSize / 1024})" filter="url(#splashShadow)">
    ${iconSvg({ width: 1024, height: 1024 }).replace(/<svg[^>]*>|<\/svg>/g, '')}
  </g>
  <text x="${width / 2}" y="${titleY}" text-anchor="middle" fill="#1F2B3A" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="${min * 0.067}" font-weight="850" letter-spacing="${min * 0.0015}">Arrow Again</text>
  <text x="${width / 2}" y="${titleY + min * 0.061}" text-anchor="middle" fill="#586D7D" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="${min * 0.03}" font-weight="700">Unblock the arrows. Clear the maze.</text>
</svg>`;
}

function shareSvg(width = 1200, height = 630) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="shareBg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#FFFDF4"/>
      <stop offset=".48" stop-color="#EEF8EB"/>
      <stop offset="1" stop-color="#C8EBD6"/>
    </linearGradient>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="24" stdDeviation="26" flood-color="#274157" flood-opacity=".18"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#shareBg)"/>
  <path d="M930 -30 H1240 V280 L810 630 H580Z" fill="#FFFFFF" opacity=".26"/>
  <path d="M0 430 C260 340 450 690 740 540 C930 442 1030 470 1200 402 V630 H0Z" fill="#D7F0DE" opacity=".48"/>
  <g transform="translate(110 95)" filter="url(#cardShadow)">
    <rect width="430" height="430" rx="112" fill="#FFFDF4"/>
    ${iconSvg({ width: 430, height: 430 }).replace(/<svg[^>]*>|<\/svg>/g, '')}
  </g>
  <text x="610" y="205" fill="#1F2B3A" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="76" font-weight="900">Arrow Again</text>
  <text x="613" y="280" fill="#526879" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="34" font-weight="700">A crisp arrow-maze puzzle for quick sessions</text>
  <text x="613" y="342" fill="#1F2B3A" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="38" font-weight="800">Find the free arrows.</text>
  <text x="613" y="388" fill="#1F2B3A" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="38" font-weight="800">Clear the board cleanly.</text>
  <g transform="translate(613 438)">
    <rect width="302" height="64" rx="32" fill="#1F2B3A"/>
    <text x="151" y="43" fill="#F8FBF6" text-anchor="middle" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="25" font-weight="800">Play the puzzle</text>
  </g>
</svg>`;
}

async function renderSvg(page, svg, filePath, width, height, options = {}) {
  await ensureParent(filePath);
  await page.setViewportSize({ width, height });
  await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:${options.transparent ? 'transparent' : '#F0F8EB'};}</style></head><body>${svg}</body></html>`);
  await page.screenshot({
    path: resolveFile(filePath),
    fullPage: false,
    omitBackground: Boolean(options.transparent)
  });
  outputs.push(filePath);
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

await writeText('public/icon.svg', iconSvg());
await writeText('public/brand/icon.svg', iconSvg());
await writeText('public/brand/icon-foreground.svg', iconSvg({ transparent: true }));
await writeText('public/brand/splash.svg', splashSvg(2732, 2732));
await writeText('public/brand/social-share.svg', shareSvg());

await renderSvg(page, iconSvg({ width: 1024, height: 1024 }), 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024, 1024);
await renderSvg(page, iconSvg({ width: 512, height: 512 }), 'public/icon-512.png', 512, 512);
await renderSvg(page, iconSvg({ width: 192, height: 192 }), 'public/icon-192.png', 192, 192);
await renderSvg(page, shareSvg(), 'public/social-share.png', 1200, 630);

for (const [folder, size] of androidIconSizes) {
  await renderSvg(page, iconSvg({ width: size, height: size }), `android/app/src/main/res/${folder}/ic_launcher.png`, size, size);
  await renderSvg(page, iconSvg({ width: size, height: size }), `android/app/src/main/res/${folder}/ic_launcher_round.png`, size, size);
}

for (const [folder, size] of androidForegroundSizes) {
  await renderSvg(
    page,
    iconSvg({ width: size, height: size, transparent: true }),
    `android/app/src/main/res/${folder}/ic_launcher_foreground.png`,
    size,
    size,
    { transparent: true }
  );
}

for (const [filePath, width, height] of androidSplashSizes) {
  await renderSvg(page, splashSvg(width, height), `android/app/src/main/res/${filePath}`, width, height);
}

for (const filePath of iosSplashFiles) {
  await renderSvg(page, splashSvg(2732, 2732), filePath, 2732, 2732);
}

await browser.close();

console.log(`Generated ${outputs.length} release assets:`);
for (const output of outputs) {
  console.log(`- ${output}`);
}
