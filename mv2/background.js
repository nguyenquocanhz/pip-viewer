/**
 * PiP Viewer - background
 * Cùng một file chạy được ở cả service worker (MV3) lẫn background page (MV2).
 */
const api = globalThis.chrome || globalThis.browser;

const MENUS = [
  { id: 'pip-video', title: 'Xem video trong ảnh-trong-ảnh', contexts: ['video'] },
  { id: 'pip-image', title: 'Xem ảnh trong ảnh-trong-ảnh', contexts: ['image'] },
  { id: 'pip-page', title: 'PiP video đang phát trên trang', contexts: ['page', 'frame'] },
  { id: 'pip-pick', title: 'Chọn phần tử để mở PiP…', contexts: ['page', 'frame'] },
];

function buildMenus() {
  if (!api.contextMenus) return;
  api.contextMenus.removeAll(() => {
    for (const m of MENUS) {
      try { api.contextMenus.create(m); } catch (_) {}
    }
  });
}

api.runtime.onInstalled.addListener(buildMenus);
if (api.runtime.onStartup) api.runtime.onStartup.addListener(buildMenus);

/** Tiêm content script rồi thử gửi lại (trang đã mở trước khi cài extension). */
function inject(tabId, frameId, done) {
  if (api.scripting && api.scripting.executeScript) {
    api.scripting.executeScript(
      {
        target: frameId != null ? { tabId, frameIds: [frameId] } : { tabId, allFrames: true },
        files: ['content.js'],
      },
      () => done(api.runtime.lastError)
    );
  } else if (api.tabs.executeScript) {
    const opts = { file: 'content.js', runAt: 'document_idle' };
    if (frameId != null) opts.frameId = frameId;
    else opts.allFrames = true;
    api.tabs.executeScript(tabId, opts, () => done(api.runtime.lastError));
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
      if (command === 'toggle-pip') send(tab.id, { type: 'TOGGLE_PIP' });
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
