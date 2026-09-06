/**
 * Soạn ghi chú phát hành. Tách riêng khỏi release.mjs để kiểm thử được
 * mà không phải chạy cả quy trình phát hành.
 */
import { readFileSync, existsSync } from 'node:fs';

/** Lấy nội dung mục "## <version>" trong CHANGELOG, bỏ dòng tiêu đề. */
export function notesFromChangelog(version, file = 'CHANGELOG.md') {
  if (!existsSync(file)) return null;
  const text = readFileSync(file, 'utf8');
  const escaped = version.replace(/\./g, '\\.');
  const heading = new RegExp(`^##\\s+\\[?v?${escaped}\\]?\\s*.*$`, 'm');
  const start = text.search(heading);
  if (start < 0) return null;

  const rest = text.slice(start);
  const firstLineEnd = rest.indexOf('\n');
  if (firstLineEnd < 0) return null;

  const body = rest.slice(firstLineEnd + 1);
  // Cắt tại mục "## " kế tiếp; mục con "### " vẫn giữ nguyên.
  const next = body.search(/^##\s/m);
  return (next < 0 ? body : body.slice(0, next)).trim() || null;
}

/** Không có mục trong CHANGELOG thì liệt kê commit kể từ tag gần nhất. */
export function notesFromCommits(run) {
  const last = run('git', ['describe', '--tags', '--abbrev=0'], { allowFail: true });
  const range = last ? `${last}..HEAD` : 'HEAD';
  const lines = run('git', ['log', range, '--pretty=%s', '--no-merges'], { allowFail: true });
  const items = (lines || '').split('\n').filter(Boolean).map((l) => `- ${l}`);
  if (!items.length) return 'Bản dựng lại, không có thay đổi mã nguồn.';
  return `Thay đổi kể từ ${last || 'lần đầu'}:\n\n${items.join('\n')}`;
}
