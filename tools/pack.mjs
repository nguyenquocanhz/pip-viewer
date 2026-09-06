// Dong goi mv3/ va mv2/ thanh file .zip de tai len store.
import { execFileSync } from 'node:child_process';
import { rmSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

mkdirSync('dist', { recursive: true });
for (const dir of ['mv3', 'mv2']) {
  const out = resolve(`dist/pip-viewer-${dir}.zip`);
  if (existsSync(out)) rmSync(out);
  execFileSync('powershell', [
    '-NoProfile', '-Command',
    `Compress-Archive -Path '${resolve(dir)}\*' -DestinationPath '${out}' -Force`,
  ], { stdio: 'inherit' });
  console.log('da tao ' + out);
}
