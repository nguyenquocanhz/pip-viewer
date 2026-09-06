/**
 * Phát hành bản free bằng một lệnh.
 *
 *   npm run release              giữ nguyên version đang có trong manifest
 *   npm run release -- patch     1.0.1 -> 1.0.2
 *   npm run release -- minor     1.0.1 -> 1.1.0
 *   npm run release -- major     1.0.1 -> 2.0.0
 *   npm run release -- 1.2.3     đặt thẳng số version
 *   npm run release -- --dry-run diễn tập, không đẩy gì lên GitHub
 *
 * Các bước: kiểm tra tiền đề -> đặt version -> build -> check -> pack ->
 * commit + tag -> push -> tạo release kèm file zip.
 */
import { execFileSync } from 'node:child_process';
import { notesFromChangelog, notesFromCommits } from './notes.mjs';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';

const REPO = 'nguyenquocanhz/pip-viewer';
const BRANCH = 'main';
const MANIFESTS = ['mv3/manifest.json', 'mv2/manifest.json'];
const ASSETS = ['dist/pip-viewer-mv3.zip', 'dist/pip-viewer-mv2.zip'];
const TITLE = (v) => `PiP Viewer ${v}`;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const bump = args.find((a) => !a.startsWith('--'));

let step = 0;
const log = (msg) => console.log(`\n[${++step}] ${msg}`);
const ok = (msg) => console.log(`    ✓ ${msg}`);
const die = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};

function run(cmd, cmdArgs, { allowFail = false, show = false } = {}) {
  try {
    const out = execFileSync(cmd, cmdArgs, {
      encoding: 'utf8',
      stdio: show ? ['ignore', 'inherit', 'inherit'] : 'pipe',
    });
    return (out || '').trim();
  } catch (err) {
    if (allowFail) return null;
    const detail = (err.stderr || err.stdout || err.message || '').toString().trim();
    die(`lệnh thất bại: ${cmd} ${cmdArgs.join(' ')}\n${detail}`);
  }
}

function mutate(label, fn) {
  if (dryRun) {
    console.log(`    · (diễn tập) bỏ qua: ${label}`);
    return null;
  }
  return fn();
}

/* ------------------------------------------------------------------ */
/* 1. Kiểm tra tiền đề                                                 */
/* ------------------------------------------------------------------ */

log('Kiểm tra tiền đề');

for (const m of MANIFESTS) if (!existsSync(m)) die(`không thấy ${m} — chạy từ thư mục gốc của repo`);
ok('có đủ hai manifest');

if (!run('gh', ['auth', 'status'], { allowFail: true })) {
  die('gh chưa đăng nhập — chạy `gh auth login` trước');
}
ok('gh đã đăng nhập');

const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch !== BRANCH) die(`đang ở nhánh "${branch}", phải đứng ở "${BRANCH}" để phát hành`);
ok(`nhánh ${BRANCH}`);

const dirty = run('git', ['status', '--porcelain']);
if (dirty) die(`còn thay đổi chưa commit:\n${dirty}`);
ok('cây làm việc sạch');

run('git', ['fetch', '--quiet', 'origin', BRANCH], { allowFail: true });
const behind = run('git', ['rev-list', '--count', `HEAD..origin/${BRANCH}`], { allowFail: true });
if (behind && behind !== '0') die(`local chậm hơn origin ${behind} commit — chạy \`git pull\` trước`);
ok('local ngang bằng origin');

/* ------------------------------------------------------------------ */
/* 2. Xác định version                                                 */
/* ------------------------------------------------------------------ */

log('Xác định version');

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const versions = MANIFESTS.map((m) => read(m).version);
if (new Set(versions).size !== 1) die(`hai manifest lệch version: ${versions.join(' và ')}`);
const current = versions[0];

function nextVersion(from, how) {
  if (!how) return from;
  if (/^\d+\.\d+\.\d+$/.test(how)) return how;
  const [maj, min, pat] = from.split('.').map(Number);
  if (how === 'major') return `${maj + 1}.0.0`;
  if (how === 'minor') return `${maj}.${min + 1}.0`;
  if (how === 'patch') return `${maj}.${min}.${pat + 1}`;
  die(`không hiểu "${how}" — dùng patch | minor | major | x.y.z`);
}

const version = nextVersion(current, bump);
const tag = `v${version}`;
console.log(`    ${current}${version === current ? ' (giữ nguyên)' : ` -> ${version}`}`);

if (run('git', ['tag', '-l', tag])) die(`tag ${tag} đã tồn tại`);
if (run('git', ['ls-remote', '--tags', 'origin', tag], { allowFail: true })) {
  die(`tag ${tag} đã có trên origin`);
}
ok(`tag ${tag} chưa tồn tại`);

/* ------------------------------------------------------------------ */
/* 3. Ghi version rồi dựng bản                                         */
/* ------------------------------------------------------------------ */

log('Dựng bản phát hành');

if (version !== current) {
  mutate(`ghi version ${version} vào manifest và package.json`, () => {
    for (const m of MANIFESTS) {
      const mf = read(m);
      mf.version = version;
      writeFileSync(m, JSON.stringify(mf, null, 2) + '\n');
    }
    const pkg = read('package.json');
    pkg.version = version;
    writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  });
}

run(process.execPath, ['tools/sync.mjs'], { show: true });
run(process.execPath, ['tools/check.mjs'], { show: true });
run(process.execPath, ['tools/pack.mjs'], { show: true });

const built = read('mv3/manifest.json').version;
if (!dryRun && built !== version) die(`gói mang version ${built} nhưng tag là ${tag}`);
ok(`gói mang version ${built}`);

for (const a of ASSETS) {
  if (!existsSync(a)) die(`thiếu file đóng gói ${a}`);
  ok(`${a} — ${(statSync(a).size / 1024).toFixed(1)} KB`);
}

/* ------------------------------------------------------------------ */
/* 4. Ghi chú phát hành                                                */
/* ------------------------------------------------------------------ */

log('Soạn ghi chú phát hành');

const fromChangelog = notesFromChangelog(version);
const notes = fromChangelog || notesFromCommits(run);
console.log('    ' + (fromChangelog ? 'lấy từ CHANGELOG.md' : 'dựng từ lịch sử commit'));
console.log(notes.split('\n').map((l) => '    | ' + l).join('\n'));

/* ------------------------------------------------------------------ */
/* 5. Commit, tag, push, tạo release                                   */
/* ------------------------------------------------------------------ */

log('Đưa lên GitHub');

if (version !== current) {
  mutate(`commit "phát hành ${tag}"`, () => {
    run('git', ['add', ...MANIFESTS, 'package.json']);
    run('git', ['commit', '-m', `Phát hành ${tag}`]);
  });
}

mutate(`tạo tag ${tag}`, () => run('git', ['tag', '-a', tag, '-m', TITLE(version)]));
mutate(`push ${BRANCH} và ${tag}`, () => {
  run('git', ['push', 'origin', BRANCH]);
  run('git', ['push', 'origin', tag]);
});

const notesFile = 'dist/release-notes.md';
mutate('ghi file ghi chú', () => writeFileSync(notesFile, notes + '\n'));

const url = mutate(`tạo release ${tag} kèm ${ASSETS.length} file`, () =>
  run('gh', [
    'release', 'create', tag,
    '--repo', REPO,
    '--title', TITLE(version),
    '--notes-file', notesFile,
    ...ASSETS,
  ])
);

console.log(
  dryRun
    ? `\n✓ Diễn tập xong. Bỏ --dry-run để phát hành thật ${tag}.\n`
    : `\n✓ Đã phát hành ${tag}\n  ${url}\n`
);
