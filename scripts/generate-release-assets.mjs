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
      <rect width="${width}" height="${height}" rx="${width * 0.22}" fill="url(#iconBg)"/>
      <path d="M0 ${height * 0.77} C${width * 0.28} ${height * 0.63} ${width * 0.64} ${height * 0.95} ${width} ${height * 0.7} L${width} ${height} L0 ${height}Z" fill="#D9EEE7" opacity=".75"/>
      <path d="M${-width * 0.08} ${height * 0.2} C${width * 0.18} ${-height * 0.06} ${width * 0.42} ${height * 0.12} ${width * 0.61} ${-height * 0.04}" stroke="#ffffff" stroke-width="${width * 0.022}" opacity=".32" fill="none"/>
    `;

  const boardX = width * 0.16;
  const boardY = height * 0.18;
  const boardW = width * 0.68;
  const boardH = height * 0.64;
  const route = `
    <g filter="url(#softShadow)">
      <rect x="${boardX}" y="${boardY}" width="${boardW}" height="${boardH}" rx="${width * 0.11}" fill="#EFF9F5"/>
      <rect x="${boardX + width * 0.025}" y="${boardY + width * 0.025}" width="${boardW - width * 0.05}" height="${boardH - width * 0.05}" rx="${width * 0.085}" fill="#DDEFE8" opacity=".72"/>
      <path d="M${width * 0.27} ${height * 0.32} H${width * 0.63} Q${width * 0.73} ${height * 0.32} ${width * 0.73} ${height * 0.43} V${height * 0.63}" stroke="#ffffff" stroke-width="${width * 0.092}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.27} ${height * 0.32} H${width * 0.63} Q${width * 0.73} ${height * 0.32} ${width * 0.73} ${height * 0.43} V${height * 0.63}" stroke="#6BC5A0" stroke-width="${width * 0.052}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.24} ${height * 0.66} H${width * 0.49} V${height * 0.45} H${width * 0.61}" stroke="#ffffff" stroke-width="${width * 0.088}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.24} ${height * 0.66} H${width * 0.49} V${height * 0.45} H${width * 0.61}" stroke="#5AA4E8" stroke-width="${width * 0.049}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.33} ${height * 0.23} V${height * 0.52} H${width * 0.2}" stroke="#ffffff" stroke-width="${width * 0.086}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${width * 0.33} ${height * 0.23} V${height * 0.52} H${width * 0.2}" stroke="#E8615B" stroke-width="${width * 0.048}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="iconBg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#F7FBF3"/>
      <stop offset=".54" stop-color="#DDF3EC"/>
      <stop offset="1" stop-color="#CDEBE0"/>
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
    ${arrowTile(width * 0.58, height * 0.45, width * 0.17, '#63B77E', 'right')}
    ${arrowTile(width * 0.29, height * 0.52, width * 0.15, '#D85B55', 'left')}
    ${arrowTile(width * 0.66, height * 0.64, width * 0.145, '#E3B333', 'down')}
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
    down: `${cx - size * 0.24},${cy - size * 0.23} ${cx},${cy + size * 0.26} ${cx + size * 0.24},${cy - size * 0.23}`
  }[direction];

  return `<g>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="#ffffff"/>
    <rect x="${x + size * 0.08}" y="${y + size * 0.08}" width="${size * 0.84}" height="${size * 0.84}" rx="${r * 0.78}" fill="${color}"/>
    <polygon points="${points}" fill="#F8FFF9"/>
    <path d="M${x + size * 0.2} ${y + size * 0.18} H${x + size * 0.72}" stroke="#ffffff" stroke-width="${size * 0.045}" opacity=".36" stroke-linecap="round"/>
  </g>`;
}

function splashSvg(width, height) {
  const min = Math.min(width, height);
  const logoSize = min * 0.28;
  const logoX = width / 2 - logoSize / 2;
  const logoY = height * 0.34 - logoSize / 2;
  const titleY = height * 0.55;
  const isPortrait = height >= width;
  const boardOpacity = isPortrait ? 0.32 : 0.24;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="splashBg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#F9FBF4"/>
      <stop offset=".58" stop-color="#E6F5EE"/>
      <stop offset="1" stop-color="#CAE9DC"/>
    </linearGradient>
    <filter id="splashShadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="${min * 0.035}" stdDeviation="${min * 0.034}" flood-color="#264057" flood-opacity=".16"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#splashBg)"/>
  <circle cx="${width * 0.18}" cy="${height * 0.2}" r="${min * 0.38}" fill="#ffffff" opacity=".34"/>
  <circle cx="${width * 0.88}" cy="${height * 0.78}" r="${min * 0.28}" fill="#BFE5D5" opacity=".32"/>
  <g opacity="${boardOpacity}">
    <path d="M${width * 0.12} ${height * 0.79} H${width * 0.88}" stroke="#FFFFFF" stroke-width="${min * 0.08}" stroke-linecap="round"/>
    <path d="M${width * 0.12} ${height * 0.79} H${width * 0.88}" stroke="#6BC5A0" stroke-width="${min * 0.039}" stroke-linecap="round"/>
    <path d="M${width * 0.18} ${height * 0.88} H${width * 0.56} V${height * 0.74} H${width * 0.78}" stroke="#FFFFFF" stroke-width="${min * 0.075}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${width * 0.18} ${height * 0.88} H${width * 0.56} V${height * 0.74} H${width * 0.78}" stroke="#5AA4E8" stroke-width="${min * 0.037}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g transform="translate(${logoX} ${logoY}) scale(${logoSize / 1024})" filter="url(#splashShadow)">
    ${iconSvg({ width: 1024, height: 1024 }).replace(/<svg[^>]*>|<\/svg>/g, '')}
  </g>
  <text x="${width / 2}" y="${titleY}" text-anchor="middle" fill="#1F2B3A" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="${min * 0.064}" font-weight="850" letter-spacing="${min * 0.002}">Arrow Again</text>
  <text x="${width / 2}" y="${titleY + min * 0.061}" text-anchor="middle" fill="#5C7182" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="${min * 0.03}" font-weight="700">Unblock the arrows. Clear the maze.</text>
</svg>`;
}

function shareSvg(width = 1200, height = 630) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="shareBg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#F9FBF4"/>
      <stop offset=".45" stop-color="#E4F5EE"/>
      <stop offset="1" stop-color="#C6EADB"/>
    </linearGradient>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="24" stdDeviation="26" flood-color="#274157" flood-opacity=".18"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#shareBg)"/>
  <circle cx="1040" cy="130" r="250" fill="#FFFFFF" opacity=".34"/>
  <circle cx="170" cy="520" r="230" fill="#9DDDBE" opacity=".22"/>
  <g transform="translate(110 95)" filter="url(#cardShadow)">
    <rect width="430" height="430" rx="112" fill="#F8FBF6"/>
    ${iconSvg({ width: 430, height: 430 }).replace(/<svg[^>]*>|<\/svg>/g, '')}
  </g>
  <text x="610" y="205" fill="#1F2B3A" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="76" font-weight="900">Arrow Again</text>
  <text x="613" y="280" fill="#526879" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="34" font-weight="700">A satisfying arrow-maze puzzle</text>
  <text x="613" y="342" fill="#1F2B3A" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="38" font-weight="800">Tap free arrows.</text>
  <text x="613" y="388" fill="#1F2B3A" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="38" font-weight="800">Clear the maze.</text>
  <g transform="translate(613 438)">
    <rect width="278" height="64" rx="32" fill="#1F2B3A"/>
    <text x="139" y="43" fill="#F8FBF6" text-anchor="middle" font-family="Avenir Next, Nunito, Arial, sans-serif" font-size="25" font-weight="800">Play the challenge</text>
  </g>
</svg>`;
}

async function renderSvg(page, svg, filePath, width, height, options = {}) {
  await ensureParent(filePath);
  await page.setViewportSize({ width, height });
  await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:${options.transparent ? 'transparent' : '#E8F5F0'};}</style></head><body>${svg}</body></html>`);
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
