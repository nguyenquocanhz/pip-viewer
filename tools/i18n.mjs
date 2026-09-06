// Sinh mv3/_locales và mv2/_locales từ tools/messages.mjs.
import { writeLocales, LOCALES, MESSAGES } from './messages.mjs';

for (const dir of ['mv3', 'mv2']) {
  const { keys } = writeLocales(dir);
  console.log(`${dir}/_locales — ${LOCALES.length} ngôn ngữ × ${keys} chuỗi`);
}
console.log('ngôn ngữ:', LOCALES.join(', '));
