/** Trang cấu hình PiP Viewer. */
const api = globalThis.chrome || globalThis.browser;
const DEFAULTS = globalThis.PIP_DEFAULTS;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let state = Object.assign({}, DEFAULTS);

/* ---------------- Lưu / nạp ---------------- */

const savedBadge = $('#saved');
let savedTimer;
function flashSaved() {
  savedBadge.hidden = false;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => (savedBadge.hidden = true), 1400);
}

function save(patch) {
  Object.assign(state, patch);
  api.storage.sync.set(patch, () => {
    void api.runtime.lastError;
    flashSaved();
  });
  applyDependencies();
}

/* ---------------- Gắn các control ---------------- */

function render() {
  for (const el of $$('[data-key]')) {
    const key = el.dataset.key;
    const v = state[key];
    if (el.type === 'checkbox') el.checked = !!v;
    else if (el.type === 'radio') el.checked = el.value === String(v);
    else el.value = v;
  }
  for (const out of $$('output[data-for]')) {
    out.textContent = state[out.dataset.for] + ' px';
  }
  applyDependencies();
  renderSites();
}

/** Làm mờ các dòng phụ thuộc vào một công tắc đang tắt. */
function applyDependencies() {
  for (const row of $$('[data-depends]')) {
    row.classList.toggle('off', !state[row.dataset.depends]);
  }
}

for (const el of $$('[data-key]')) {
  const key = el.dataset.key;
  const evt = el.type === 'range' ? 'input' : 'change';
  el.addEventListener(evt, () => {
    let value;
    if (el.type === 'checkbox') value = el.checked;
    else if (el.type === 'range') value = Number(el.value);
    else value = el.value;

    if (el.type === 'range') {
      const out = $(`output[data-for="${key}"]`);
      if (out) out.textContent = value + ' px';
    }
    save({ [key]: value });
  });
}

/* ---------------- Danh sách trang loại trừ ---------------- */

function normalizeHost(raw) {
  let h = String(raw).trim().toLowerCase();
  if (!h) return '';
  h = h.replace(/^[a-z]+:\/\//, '').split('/')[0].split(':')[0].replace(/^www\./, '');
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(h) ? h : '';
}

function renderSites() {
  const list = $('#site-list');
  const sites = state.disabledSites || [];
  list.textContent = '';
  $('#site-empty').hidden = sites.length > 0;

  for (const host of sites) {
    const li = document.createElement('li');
    li.append(host);
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '✕';
    del.title = 'Bỏ khỏi danh sách';
    del.addEventListener('click', () => {
      save({ disabledSites: state.disabledSites.filter((h) => h !== host) });
      renderSites();
    });
    li.appendChild(del);
    list.appendChild(li);
  }
}

$('#site-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#site-input');
  const host = normalizeHost(input.value);
  if (!host) {
    input.focus();
    input.select();
    return;
  }
  if (!state.disabledSites.includes(host)) {
    save({ disabledSites: [...state.disabledSites, host] });
    renderSites();
  }
  input.value = '';
});

/* ---------------- Phím tắt ---------------- */

$('#btn-shortcuts').addEventListener('click', () => {
  const url = navigator.userAgent.includes('Firefox')
    ? 'about:addons'
    : 'chrome://extensions/shortcuts';
  $('#shortcut-url').textContent = url;
  try {
    api.tabs.create({ url });
  } catch (_) {
    $('#shortcut-hint').hidden = false;
  }
  // Firefox không cho mở about:addons từ extension -> hiện hướng dẫn thủ công
  setTimeout(() => {
    if (api.runtime.lastError) $('#shortcut-hint').hidden = false;
  }, 200);
});

/* Hiện phím tắt thật sự đang được gán */
if (api.commands && api.commands.getAll) {
  api.commands.getAll((cmds) => {
    void api.runtime.lastError;
    const byName = Object.fromEntries((cmds || []).map((c) => [c.name, c.shortcut]));
    const rows = $$('table.keys tr');
    const map = ['toggle-pip', 'pick-element', 'pip-image'];
    rows.forEach((tr, i) => {
      const sc = byName[map[i]];
      const cell = tr.querySelector('td');
      if (!cell) return;
      cell.textContent = '';
      if (!sc) {
        const em = document.createElement('span');
        em.className = 'unset';
        em.textContent = 'chưa gán';
        cell.appendChild(em);
        return;
      }
      for (const part of sc.split('+')) {
        const kbd = document.createElement('kbd');
        kbd.textContent = part;
        cell.appendChild(kbd);
      }
    });
  });
}

/* ---------------- Trạng thái ---------------- */

function renderStatus() {
  const mf = api.runtime.getManifest();
  $('#version').textContent = 'v' + mf.version;

  const rows = [
    ['Phiên bản manifest', 'MV' + mf.manifest_version, null],
    ['Trình duyệt', navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Chromium', null],
    [
      'PiP gốc cho video',
      document.pictureInPictureEnabled ? 'Được hỗ trợ' : 'Không hỗ trợ — dùng cửa sổ nổi',
      !!document.pictureInPictureEnabled,
    ],
    [
      'Document PiP (ảnh, HTML)',
      'documentPictureInPicture' in window ? 'Được hỗ trợ' : 'Không hỗ trợ',
      'documentPictureInPicture' in window,
    ],
  ];

  const dl = $('#status');
  dl.textContent = '';
  for (const [k, v, ok] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v;
    if (ok === true) dd.className = 'yes';
    if (ok === false) dd.className = 'no';
    dl.append(dt, dd);
  }
}

/* ---------------- Pro & ủng hộ ---------------- */

const LINKS = globalThis.PIP_LINKS || {};

function openUrl(url) {
  if (!url) return;
  if (api.tabs && api.tabs.create) api.tabs.create({ url });
  else window.open(url, '_blank', 'noopener');
}

$('#btn-pro').addEventListener('click', () => openUrl(LINKS.pro || LINKS.repo));
$('#btn-sponsor').addEventListener('click', () => openUrl(LINKS.sponsor || LINKS.repo));

/** Chỉ hiện những liên kết đã được điền trong defaults.js. */
function renderLinks() {
  const box = $('#links');
  const items = [
    ['Mã nguồn trên GitHub', LINKS.repo],
    ['Báo lỗi / góp ý', LINKS.issues],
    ['GitHub Sponsors', LINKS.sponsor],
    ['Ko-fi', LINKS.kofi],
    ['MoMo', LINKS.momo],
    ['PayPal', LINKS.paypal],
  ].filter(([, url]) => url);

  box.textContent = '';
  for (const [label, url] of items) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = label;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openUrl(url);
    });
    box.appendChild(a);
  }
}
renderLinks();

/* ---------------- Khôi phục mặc định ---------------- */

$('#btn-reset').addEventListener('click', () => {
  if (!confirm('Khôi phục toàn bộ cài đặt về mặc định?')) return;
  state = Object.assign({}, DEFAULTS);
  api.storage.sync.set(state, () => {
    void api.runtime.lastError;
    flashSaved();
    render();
  });
});

/* ---------------- Điều hướng bên trái ---------------- */

const links = $$('nav a');
const sections = links.map((a) => $(a.getAttribute('href')));
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const i = sections.indexOf(e.target);
      links.forEach((a, j) => a.classList.toggle('active', i === j));
    }
  },
  { rootMargin: '-15% 0px -70% 0px' }
);
sections.forEach((s) => s && io.observe(s));

/* ---------------- Khởi động ---------------- */

api.storage.sync.get(DEFAULTS, (v) => {
  void api.runtime.lastError;
  state = Object.assign({}, DEFAULTS, v || {});
  if (!Array.isArray(state.disabledSites)) state.disabledSites = [];
  render();
});
renderStatus();
