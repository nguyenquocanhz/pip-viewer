// Kiểm tra nhanh: manifest hợp lệ, file khai báo có thật, JS không lỗi cú pháp.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { MESSAGES, LOCALES } from './messages.mjs';

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

  // ---- Ngôn ngữ ----
  const known = new Set(Object.keys(MESSAGES));
  let i18nBad = 0;

  for (const loc of LOCALES) {
    const p = `${dir}/_locales/${loc}/messages.json`;
    if (!existsSync(p)) {
      fail(`thiếu ${p} — chạy npm run i18n`);
      i18nBad++;
      continue;
    }
    const n = Object.keys(JSON.parse(readFileSync(p, 'utf8'))).length;
    if (n !== known.size) {
      fail(`${loc} có ${n} chuỗi, nguồn có ${known.size} — chạy npm run i18n`);
      i18nBad++;
    }
  }
  if (mf.default_locale && !LOCALES.includes(mf.default_locale)) {
    fail(`default_locale "${mf.default_locale}" không nằm trong danh sách ngôn ngữ`);
    i18nBad++;
  }

  // Mọi khoá dùng trong manifest, HTML và JS đều phải có bản dịch
  const used = new Set();
  for (const m of JSON.stringify(mf).matchAll(/__MSG_(\w+)__/g)) used.add(m[1]);
  for (const f of readdirSync(dir)) {
    const src = () => readFileSync(`${dir}/${f}`, 'utf8');
    // Thuộc tính chỉ có ở HTML; quét cả .js sẽ dính phần chú thích của i18n.js
    if (f.endsWith('.html')) {
      for (const m of src().matchAll(/data-i18n(?:-doc|-title|-ph|-aria)?="([^"]+)"/g)) used.add(m[1]);
    } else if (f.endsWith('.js') && f !== 'i18n.js') {
      for (const m of src().matchAll(/\bt\('([A-Za-z][A-Za-z0-9_]*)'/g)) used.add(m[1]);
    }
  }
  const unknown = [...used].filter((k) => !known.has(k));
  if (unknown.length) {
    fail('dùng khoá chưa có bản dịch: ' + unknown.join(', '));
    i18nBad++;
  }
  if (!i18nBad) {
    pass(`${LOCALES.length} ngôn ngữ × ${known.size} chuỗi, ${used.size} khoá đang dùng đều hợp lệ`);
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
    for (const f of ['i18n.js', 'defaults.js', 'content.js', 'background.js', 'popup.js', 'popup.css',
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
