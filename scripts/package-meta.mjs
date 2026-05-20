import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import process from 'node:process';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const outRoot = path.join(root, 'releases', 'meta-instant-game');
const staging = path.join(outRoot, 'package');
const zipPath = path.join(outRoot, 'arrow-again-meta.zip');

await rm(outRoot, { recursive: true, force: true });
await mkdir(staging, { recursive: true });
await cp(path.join(root, 'dist'), staging, { recursive: true });
await cp(path.join(root, 'public', 'fbapp-config.json'), path.join(staging, 'fbapp-config.json'));

const indexPath = path.join(staging, 'index.html');
const indexHtml = await readFile(indexPath, 'utf8');
const sdkScript = '<script src="https://connect.facebook.net/en_US/fbinstant.6.3.js"></script>';
if (!indexHtml.includes('fbinstant.6.3.js')) {
  await writeFile(indexPath, indexHtml.replace('</head>', `  ${sdkScript}\n  </head>`));
}

try {
  await execFileAsync('zip', ['-qr', zipPath, '.'], { cwd: staging });
  console.log(`Meta package written to ${zipPath}`);
} catch (error) {
  console.error('Could not create zip archive. The staged Meta package is still available at:');
  console.error(staging);
  throw error;
}
