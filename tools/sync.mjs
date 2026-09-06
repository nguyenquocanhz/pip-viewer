// Đồng bộ mã dùng chung từ mv3/ sang mv2/ (manifest.json giữ nguyên riêng biệt).
import { copyFileSync } from 'node:fs';

const SHARED = [
  'defaults.js',
  'content.js',
  'background.js',
  'popup.html',
  'popup.css',
  'popup.js',
  'dashboard.html',
  'dashboard.css',
  'dashboard.js',
];
for (const f of SHARED) {
  copyFileSync(`mv3/${f}`, `mv2/${f}`);
  console.log(`mv3/${f} -> mv2/${f}`);
}
console.log('Đã đồng bộ. Nhớ chạy `npm run check`.');
