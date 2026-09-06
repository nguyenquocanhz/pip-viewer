// Kiểm tra bộ soạn ghi chú phát hành.
import { notesFromChangelog } from './notes.mjs';
import { writeFileSync, rmSync } from 'node:fs';

const FIXTURE = 'tools/.notes-fixture.md';
writeFileSync(FIXTURE, `# Nhật ký

## 2.0.0

Mục mới nhất.

- gạch đầu dòng một
- gạch đầu dòng hai

### Mục con phải được giữ

Đoạn cuối của 2.0.0.

## 1.1.0

Mục cũ hơn, không được lẫn vào.
`);

let fails = 0;
const is = (label, got, want) => {
  const okay = got === want;
  console.log(`  ${okay ? '✓' : '✗'} ${label}`);
  if (!okay) { console.log(`      nhận: ${JSON.stringify(got)}`); fails++; }
};

const a = notesFromChangelog('2.0.0', FIXTURE);
is('bỏ dòng tiêu đề', a.startsWith('Mục mới nhất.'), true);
is('giữ mục con ###', a.includes('### Mục con phải được giữ'), true);
is('giữ tới hết mục', a.endsWith('Đoạn cuối của 2.0.0.'), true);
is('không lẫn mục sau', a.includes('Mục cũ hơn'), false);
is('mục cuối file lấy được', notesFromChangelog('1.1.0', FIXTURE), 'Mục cũ hơn, không được lẫn vào.');
is('version không có -> null', notesFromChangelog('9.9.9', FIXTURE), null);
is('file không có -> null', notesFromChangelog('2.0.0', 'tools/.khong-ton-tai.md'), null);

rmSync(FIXTURE);
console.log(fails ? `\n${fails} lỗi.` : '\nBộ soạn ghi chú đạt.');
process.exit(fails ? 1 : 0);
