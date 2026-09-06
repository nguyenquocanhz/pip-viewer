// Đóng gói mv3/ và mv2/ thành .zip đúng chuẩn để nạp vào trình duyệt / store.
// Tự viết bộ ghi ZIP (deflate) thay vì gọi Compress-Archive của PowerShell,
// vì PowerShell ghi dấu phân cách đường dẫn là "\" — sai đặc tả ZIP.
import { deflateRawSync } from 'node:zlib';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/** Giờ sửa đổi theo định dạng MS-DOS mà ZIP dùng. */
function dosTime(date) {
  const time = ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() / 2)) & 0xffff;
  const day = (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;
  return { time, day };
}

function walk(dir, base = dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, base, out);
    else out.push({ full, name: relative(base, full).split('\\').join('/') });
  }
  return out;
}

function zip(dir) {
  const files = walk(dir);
  const locals = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const data = readFileSync(file.full);
    const deflated = deflateRawSync(data, { level: 9 });
    // Nếu nén không lợi thì lưu nguyên (method 0)
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const name = Buffer.from(file.name, 'utf8');
    const { time, day } = dosTime(statSync(file.full).mtime);
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // phiên bản cần để giải nén
    local.writeUInt16LE(0x0800, 6); // cờ: tên file mã hoá UTF-8
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, body);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4); // phiên bản tạo
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(day, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt32LE((0o100644 << 16) >>> 0, 38); // quyền file trên hệ Unix
    cd.writeUInt32LE(offset, 42);
    central.push(cd, name);

    offset += local.length + name.length + body.length;
  }

  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);

  return { buf: Buffer.concat([...locals, cdBuf, end]), count: files.length };
}

mkdirSync('dist', { recursive: true });
for (const dir of ['mv3', 'mv2']) {
  const out = `dist/pip-viewer-${dir}.zip`;
  const { buf, count } = zip(dir);
  writeFileSync(out, buf);
  console.log(`${out} — ${count} file, ${(buf.length / 1024).toFixed(1)} KB`);
}
