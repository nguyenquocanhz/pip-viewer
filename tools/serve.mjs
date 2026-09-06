// Máy chủ tĩnh đơn giản để thử demo, popup và dashboard khi phát triển.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json',
};
const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 5178;

createServer(async (req, res) => {
  const [rawUrl, query = ''] = req.url.split('?');
  const url = decodeURIComponent(rawUrl);
  const rel = normalize(url === '/' ? '/test/demo.html' : url).replace(/^([.][.][\\/])+/, '');
  const path = join(ROOT, rel);
  try {
    let body = await readFile(path);
    // ?stub=1 -> chèn API extension giả để xem thử popup/dashboard ngoài trình duyệt
    if (query.includes('stub=1') && extname(path) === '.html') {
      body = Buffer.from(
        body
          .toString('utf8')
          .replace('</head>', '<script src="/test/ext-stub.js"></script></head>')
      );
    }
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}/`));
