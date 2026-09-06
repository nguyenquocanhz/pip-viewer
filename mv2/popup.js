const api = globalThis.chrome || globalThis.browser;
const $ = (id) => document.getElementById(id);
const t = PIP_I18N.t;

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
    status.textContent = t('popupUnavailable');
    wrap.hidden = true;
    return;
  }

  const vids = res.videos || [];
  status.textContent = vids.length
    ? t(res.inPiP ? 'popupFoundInPip' : 'popupFound', { n: vids.length })
    : t('popupNoVideo');

  list.textContent = '';
  wrap.hidden = vids.length < 2;
  if (vids.length < 2) return;

  for (const v of vids) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    if (v.active) btn.className = 'active';

    const label = document.createElement('span');
    label.className = 't';
    if (v.playing) {
      const dot = document.createElement('span');
      dot.className = 'dot';
      label.appendChild(dot);
    }
    label.append(v.label || t('videoN', { n: v.index + 1 }));

    const m = document.createElement('span');
    m.className = 'm';
    m.textContent = [
      v.width && v.height ? `${v.width}×${v.height}` : '',
      fmt(v.duration),
      t(v.playing ? 'statePlaying' : 'statePaused'),
    ].filter(Boolean).join(' · ');

    btn.append(label, m);
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

PIP_I18N.apply();
refresh();
