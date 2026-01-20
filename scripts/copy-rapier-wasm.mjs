import { mkdir, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();

const src = path.join(
  repoRoot,
  'node_modules',
  '@dimforge',
  'rapier3d-compat',
  'rapier_wasm3d_bg.wasm'
);

const destDir = path.join(repoRoot, 'dist', 'assets');
const dest = path.join(destDir, 'rapier_wasm3d_bg.wasm');

await mkdir(destDir, { recursive: true });
await copyFile(src, dest);

const { size } = await stat(dest);
console.log(`✅ Copied Rapier WASM -> ${path.relative(repoRoot, dest)} (${size} bytes)`);

