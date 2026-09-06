// Sinh icon PNG (khong can thu vien ngoai) cho extension.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return (buf) => {
    let c = -1;
    for (const b of buf) c = t[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(CRC(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      raw[p++] = pixels[i];
      raw[p++] = pixels[i + 1];
      raw[p++] = pixels[i + 2];
      raw[p++] = pixels[i + 3];
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Anti-alias bang supersampling 4x
const SS = 4;
function render(size) {
  const px = Buffer.alloc(size * size * 4);
  const S = size * SS;
  const acc = new Float64Array(size * size * 4);

  const radius = S * 0.22;
  const inRounded = (x, y, x0, y0, x1, y1, r) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = Math.min(Math.max(x, x0 + r), x1 - r);
    const cy = Math.min(Math.max(y, y0 + r), y1 - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };

  // khung "man hinh" lon + o PiP nho goc duoi phai
  const m = S * 0.17;
  const fx0 = m, fy0 = S * 0.21, fx1 = S - m, fy1 = S - S * 0.21;
  const stroke = Math.max(S * 0.075, 1);
  const px0 = fx1 - (fx1 - fx0) * 0.46, py0 = fy1 - (fy1 - fy0) * 0.5;

  for (let sy = 0; sy < S; sy++) {
    for (let sx = 0; sx < S; sx++) {
      let r, g, b, a;
      if (inRounded(sx, sy, 0, 0, S - 1, S - 1, radius)) {
        // nen gradient tim -> xanh
        const t = (sx / S) * 0.5 + (sy / S) * 0.5;
        r = 99 + (37 - 99) * t;
        g = 91 + (99 - 91) * t;
        b = 255 + (235 - 255) * t;
        a = 255;
        const outer = inRounded(sx, sy, fx0, fy0, fx1, fy1, S * 0.06);
        const inner = inRounded(sx, sy, fx0 + stroke, fy0 + stroke, fx1 - stroke, fy1 - stroke, S * 0.04);
        const small = inRounded(sx, sy, px0, py0, fx1 - stroke * 1.1, fy1 - stroke * 1.1, S * 0.03);
        if ((outer && !inner) || small) { r = 255; g = 255; b = 255; }
      } else {
        r = g = b = 0; a = 0;
      }
      const dx = (sx / SS) | 0, dy = (sy / SS) | 0;
      const i = (dy * size + dx) * 4;
      acc[i] += r * a; acc[i + 1] += g * a; acc[i + 2] += b * a; acc[i + 3] += a;
    }
  }
  const n = SS * SS;
  for (let i = 0; i < size * size; i++) {
    const a = acc[i * 4 + 3] / n;
    px[i * 4 + 3] = Math.round(a);
    for (let c = 0; c < 3; c++) {
      px[i * 4 + c] = a > 0 ? Math.round(Math.min(255, acc[i * 4 + c] / n / a)) : 0;
    }
  }
  return px;
}

for (const dir of ['mv3/icons', 'mv2/icons']) {
  mkdirSync(dir, { recursive: true });
  for (const size of [16, 32, 48, 128]) {
    writeFileSync(`${dir}/icon${size}.png`, png(size, render(size)));
  }
}
console.log('icons ok');
