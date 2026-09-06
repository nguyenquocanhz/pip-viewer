const api = globalThis.chrome || globalThis.browser;
const $ = (id) => document.getElementById(id);

/** Gửi lệnh qua background để nó lo phần tiêm content script khi cần. */
function ask(payload) {
  return new Promise((resolve) => {
    api.runtime.sendMessage({ from: 'popup', payload }, (res) => {
      void api.runtime.lastError;
      resolve(res || { ok: false });
    });
  });
}

function fmt(sec) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

async function refresh() {
  const res = await ask({ type: 'LIST_MEDIA' });
  const status = $('status');
  const wrap = $('list-wrap');
  const list = $('list');

  if (!res.ok) {
    status.textContent = 'Không dùng được trên trang này';
    wrap.hidden = true;
    return;
  }

  const vids = res.videos || [];
  status.textContent = vids.length
    ? `Tìm thấy ${vids.length} video${res.inPiP ? ' — đang ở chế độ PiP' : ''}`
    : 'Không thấy video — vẫn có thể mở PiP cho ảnh';

  list.textContent = '';
  wrap.hidden = vids.length < 2;
  if (vids.length < 2) return;

  for (const v of vids) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    if (v.active) btn.className = 'active';

    const t = document.createElement('span');
    t.className = 't';
    if (v.playing) {
      const dot = document.createElement('span');
      dot.className = 'dot';
      t.appendChild(dot);
    }
    t.append(v.label || `Video ${v.index + 1}`);

    const m = document.createElement('span');
    m.className = 'm';
    m.textContent = [
      v.width && v.height ? `${v.width}×${v.height}` : '',
      fmt(v.duration),
      v.playing ? 'đang phát' : 'đã dừng',
    ].filter(Boolean).join(' · ');

    btn.append(t, m);
    btn.addEventListener('click', async () => {
      await ask({ type: 'PIP_INDEX', index: v.index });
      window.close();
    });
    li.appendChild(btn);
    list.appendChild(li);
  }
}

function wire(id, payload, close = true) {
  $(id).addEventListener('click', async () => {
    await ask(payload);
    if (close) window.close();
  });
}

wire('btn-video', { type: 'TOGGLE_PIP' });
wire('btn-image', { type: 'PIP_IMAGE' });
wire('btn-pick', { type: 'PICK_ELEMENT' });
wire('btn-exit', { type: 'EXIT_PIP' });

/* Mở trang cấu hình */
$('open-dashboard').addEventListener('click', (e) => {
  e.preventDefault();
  if (api.runtime.openOptionsPage) api.runtime.openOptionsPage();
  else api.tabs.create({ url: api.runtime.getURL('dashboard.html') });
  window.close();
});

/* Bản Pro */
$('open-pro').addEventListener('click', (e) => {
  e.preventDefault();
  const links = globalThis.PIP_LINKS || {};
  api.tabs.create({ url: links.pro || links.repo });
  window.close();
});

/* Hai công tắc nhanh (phần còn lại nằm ở trang cấu hình) */
const DEFAULTS = globalThis.PIP_DEFAULTS;
api.storage.sync.get(DEFAULTS, (v) => {
  const s = Object.assign({}, DEFAULTS, v);
  $('opt-hover').checked = !!s.hoverButton;
  $('opt-blur').checked = !!s.autoPiPOnBlur;
});
$('opt-hover').addEventListener('change', (e) =>
  api.storage.sync.set({ hoverButton: e.target.checked })
);
$('opt-blur').addEventListener('change', (e) =>
  api.storage.sync.set({ autoPiPOnBlur: e.target.checked })
);

refresh();
