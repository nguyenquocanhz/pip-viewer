// Kiểm tra nhanh: manifest hợp lệ, file khai báo có thật, JS không lỗi cú pháp.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

let fails = 0;
const fail = (m) => { console.error('  ✗ ' + m); fails++; };
const pass = (m) => console.log('  ✓ ' + m);

for (const dir of ['mv3', 'mv2']) {
  console.log(`\n[${dir}]`);
  const mfPath = `${dir}/manifest.json`;
  if (!existsSync(mfPath)) { fail('thiếu manifest.json'); continue; }

  let mf;
  try {
    mf = JSON.parse(readFileSync(mfPath, 'utf8'));
    pass('manifest.json là JSON hợp lệ');
  } catch (e) { fail('manifest.json lỗi cú pháp: ' + e.message); continue; }

  const expected = dir === 'mv3' ? 3 : 2;
  if (mf.manifest_version === expected) pass(`manifest_version = ${expected}`);
  else fail(`manifest_version = ${mf.manifest_version}, cần ${expected}`);

  // Thu thập mọi đường dẫn file được khai báo trong manifest
  const refs = new Set();
  const add = (p) => typeof p === 'string' && refs.add(p);
  Object.values(mf.icons || {}).forEach(add);
  const act = mf.action || mf.browser_action || {};
  add(act.default_popup);
  add(mf.options_ui?.page);
  add(mf.options_page);
  Object.values(act.default_icon || {}).forEach(add);
  (mf.background?.scripts || []).forEach(add);
  add(mf.background?.service_worker);
  (mf.content_scripts || []).forEach((cs) => {
    (cs.js || []).forEach(add);
    (cs.css || []).forEach(add);
  });

  for (const r of refs) {
    if (existsSync(`${dir}/${r}`)) pass(`có ${r}`);
    else fail(`manifest trỏ tới ${r} nhưng file không tồn tại`);
  }

  // API đúng thế hệ manifest
  if (expected === 3) {
    if (mf.background?.service_worker) pass('dùng service_worker');
    else fail('MV3 cần background.service_worker');
    if (mf.host_permissions) pass('có host_permissions');
    else fail('MV3 nên khai báo host_permissions');
    if ((mf.permissions || []).some((p) => p.includes('://') || p === '<all_urls>'))
      fail('MV3 không được để host pattern trong "permissions"');
  } else {
    if (mf.background?.scripts) pass('dùng background.scripts');
    else fail('MV2 cần background.scripts');
    if (mf.host_permissions) fail('MV2 không dùng host_permissions');
    if (mf.browser_action) pass('dùng browser_action');
    else fail('MV2 cần browser_action');
  }

  for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    try {
      execFileSync(process.execPath, ['--check', `${dir}/${f}`], { stdio: 'pipe' });
      pass(`${f} không lỗi cú pháp`);
    } catch (e) {
      fail(`${f}: ${String(e.stderr || e).split('\n').slice(0, 3).join(' ')}`);
    }
  }

  // Hai bản phải cùng mã nguồn dùng chung
  if (dir === 'mv2') {
    for (const f of ['defaults.js', 'content.js', 'background.js', 'popup.js', 'popup.css',
                     'popup.html', 'dashboard.js', 'dashboard.css', 'dashboard.html']) {
      const a = readFileSync(`mv3/${f}`, 'utf8');
      const b = readFileSync(`mv2/${f}`, 'utf8');
      if (a === b) pass(`${f} khớp với bản mv3`);
      else fail(`${f} lệch với mv3 — chạy \`npm run sync\``);
    }
  }
}

console.log(fails ? `\n${fails} lỗi cần sửa.` : '\nTất cả kiểm tra đều đạt.');
process.exit(fails ? 1 : 0);
