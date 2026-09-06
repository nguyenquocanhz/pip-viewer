/**
 * PiP Viewer - background
 * Cùng một file chạy được ở cả service worker (MV3) lẫn background page (MV2).
 */
const api = globalThis.chrome || globalThis.browser;

/**
 * Điểm mở rộng: mô-đun ngoài khai báo globalThis.PIP_COMMANDS trước khi file
 * này chạy để thêm lệnh phím tắt và mục menu chuột phải riêng.
 *   PIP_COMMANDS = { 'ten-lenh': (tab, send) => send(tab.id, { type: 'X' }) }
 *   PIP_MENUS    = [ { id, title, contexts, message } ]
 */
const t = (k) => (api.i18n && api.i18n.getMessage(k)) || k;

const EXTRA_COMMANDS = globalThis.PIP_COMMANDS || {};
const EXTRA_MENUS = globalThis.PIP_MENUS || [];

const MENUS = [
  { id: 'pip-video', title: t('menuVideo'), contexts: ['video'] },
  { id: 'pip-image', title: t('menuImage'), contexts: ['image'] },
  { id: 'pip-page', title: t('menuPage'), contexts: ['page', 'frame'] },
  { id: 'pip-pick', title: t('menuPick'), contexts: ['page', 'frame'] },
];

function buildMenus() {
  if (!api.contextMenus) return;
  api.contextMenus.removeAll(() => {
    for (const m of [...MENUS, ...EXTRA_MENUS]) {
      try { api.contextMenus.create({ id: m.id, title: m.title, contexts: m.contexts }); } catch (_) {}
    }
  });
}

api.runtime.onInstalled.addListener(buildMenus);
if (api.runtime.onStartup) api.runtime.onStartup.addListener(buildMenus);

/** Đúng thứ tự như content_scripts trong manifest — thiếu i18n.js là hiện khoá thô. */
const CONTENT_FILES = ['i18n.js', 'defaults.js', 'content.js'];

/** Tiêm content script rồi thử gửi lại (trang đã mở trước khi cài extension). */
function inject(tabId, frameId, done) {
  if (api.scripting && api.scripting.executeScript) {
    api.scripting.executeScript(
      {
        target: frameId != null ? { tabId, frameIds: [frameId] } : { tabId, allFrames: true },
        files: CONTENT_FILES,
      },
      () => done(api.runtime.lastError)
    );
  } else if (api.tabs.executeScript) {
    // MV2 chỉ tiêm được một file mỗi lần, nên nối tiếp theo đúng thứ tự
    const opts = { runAt: 'document_idle' };
    if (frameId != null) opts.frameId = frameId;
    else opts.allFrames = true;
    let i = 0;
    const next = () => {
      if (api.runtime.lastError) return done(api.runtime.lastError);
      if (i >= CONTENT_FILES.length) return done(null);
      api.tabs.executeScript(tabId, Object.assign({ file: CONTENT_FILES[i++] }, opts), next);
    };
    next();
  } else {
    done(new Error('no injection API'));
  }
}

/** sendMessage có/không kèm options — tránh truyền undefined cho Chrome. */
function post(tabId, message, frameId, cb) {
  if (frameId != null) api.tabs.sendMessage(tabId, message, { frameId }, cb);
  else api.tabs.sendMessage(tabId, message, cb);
}

function send(tabId, message, frameId) {
  post(tabId, message, frameId, () => {
    if (!api.runtime.lastError) return;
    inject(tabId, frameId, (err) => {
      if (err) {
        console.warn('[PiP Viewer] không tiêm được vào tab', tabId, err.message || err);
        return;
      }
      post(tabId, message, frameId, () => void api.runtime.lastError);
    });
  });
}

/* Nhấp vào icon extension */
const action = api.action || api.browserAction;
if (action && action.onClicked) {
  action.onClicked.addListener((tab) => tab && tab.id != null && send(tab.id, { type: 'TOGGLE_PIP' }));
}

/* Phím tắt */
if (api.commands) {
  api.commands.onCommand.addListener((command) => {
    api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || tab.id == null) return;
      if (EXTRA_COMMANDS[command]) EXTRA_COMMANDS[command](tab, send);
      else if (command === 'toggle-pip') send(tab.id, { type: 'TOGGLE_PIP' });
      else if (command === 'pick-element') send(tab.id, { type: 'PICK_ELEMENT' });
      else if (command === 'pip-image') send(tab.id, { type: 'PIP_IMAGE' });
    });
  });
}

/* Menu chuột phải */
if (api.contextMenus) {
  api.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || tab.id == null) return;
    const frameId = info.frameId;
    const extra = EXTRA_MENUS.find((m) => m.id === info.menuItemId);
    if (extra) return send(tab.id, extra.message, frameId);
    switch (info.menuItemId) {
      case 'pip-video':
        send(tab.id, { type: 'PIP_CONTEXT_VIDEO' }, frameId);
        break;
      case 'pip-image':
        send(tab.id, { type: 'PIP_CONTEXT_IMAGE', srcUrl: info.srcUrl }, frameId);
        break;
      case 'pip-page':
        send(tab.id, { type: 'TOGGLE_PIP' });
        break;
      case 'pip-pick':
        send(tab.id, { type: 'PICK_ELEMENT' }, frameId);
        break;
    }
  });
}

/* Yêu cầu từ popup */
api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.from !== 'popup') return;
  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || tab.id == null) return sendResponse({ ok: false, error: 'no-tab' });
    post(tab.id, msg.payload, null, (res) => {
      if (!api.runtime.lastError) return sendResponse(res || { ok: true });
      inject(tab.id, null, (err) => {
        if (err) return sendResponse({ ok: false, error: 'cannot-inject' });
        post(tab.id, msg.payload, null, (r) => {
          void api.runtime.lastError;
          sendResponse(r || { ok: true });
        });
      });
    });
  });
  return true; // giữ kênh mở cho phản hồi bất đồng bộ
});
