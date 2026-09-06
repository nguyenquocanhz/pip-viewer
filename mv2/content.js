/**
 * PiP Viewer - content script
 * Picture-in-Picture cho video, ảnh và phần tử bất kỳ trên trang.
 * Dùng chung cho cả Manifest V3 (Chrome/Edge) và Manifest V2 (Firefox).
 */
(() => {
  'use strict';
  if (window.__pipViewer__) return;
  // Điểm mở rộng: các mô-đun khác của cùng extension gắn thêm tính năng vào đây.
  window.__pipViewer__ = { version: '1.0.1', handlers: [] };

  const api = globalThis.chrome || globalThis.browser;
  const hasNativePiP =
    'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;
  const hasDocPiP = 'documentPictureInPicture' in window;

  const settings = Object.assign(
    {
      hoverButton: true,
      hoverPosition: 'tr',
      minVideoWidth: 200,
      autoPiPOnBlur: false,
      exitOnReturn: true,
      pauseOnExit: false,
      showToast: true,
      imageMode: 'auto',
      floatWidth: 480,
      disabledSites: [],
    },
    globalThis.PIP_DEFAULTS || {}
  );

  /** Trang này có nằm trong danh sách tắt không? */
  const isDisabled = () =>
    (settings.disabledSites || []).some((h) => {
      h = String(h).trim().toLowerCase().replace(/^www\./, '');
      if (!h) return false;
      const host = location.hostname.toLowerCase().replace(/^www\./, '');
      return host === h || host.endsWith('.' + h);
    });

  try {
    api.storage.sync.get(settings, (v) => v && Object.assign(settings, v));
    api.storage.onChanged.addListener((c) => {
      for (const k in c) if (k in settings) settings[k] = c[k].newValue;
      if (!settings.hoverButton || isDisabled()) ui.hideHoverButton();
    });
  } catch (_) {}

  /* ------------------------------------------------------------------ */
  /* Tìm phần tử media (xuyên qua shadow DOM)                            */
  /* ------------------------------------------------------------------ */

  function deepQuery(selector, root = document, out = [], depth = 0) {
    if (depth > 12) return out;
    try {
      out.push(...root.querySelectorAll(selector));
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) deepQuery(selector, el.shadowRoot, out, depth + 1);
      }
    } catch (_) {}
    return out;
  }

  function isVisible(el) {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.1;
  }

  function scoreVideo(v) {
    const r = v.getBoundingClientRect();
    const visW = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
    const visH = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    let score = visW * visH || 1;
    if (!v.paused && !v.ended) score *= 4;
    if (v.readyState >= 2) score *= 1.5;
    if (v.duration > 1) score *= 1.2;
    if (v.muted && v.paused) score *= 0.5;
    return score;
  }

  function pickBestVideo() {
    const vids = deepQuery('video').filter(isVisible);
    if (!vids.length) return null;
    return vids.sort((a, b) => scoreVideo(b) - scoreVideo(a))[0];
  }

  function pickBestImage() {
    const imgs = deepQuery('img').filter(
      (i) => isVisible(i) && i.naturalWidth > 120 && i.naturalHeight > 120
    );
    if (!imgs.length) return null;
    return imgs.sort(
      (a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight
    )[0];
  }

  /* ------------------------------------------------------------------ */
  /* Lớp giao diện (shadow DOM để không dính CSS của trang)              */
  /* ------------------------------------------------------------------ */

  const ui = (() => {
    let host, shadow, layer, hoverBtn, hoverTarget = null, picking = false;

    const CSS = `
      :host { all: initial; }
      .layer { position: fixed; inset: 0; pointer-events: none; z-index: 2147483646;
               font: 500 13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
      .layer > * { pointer-events: auto; }
      .toast { position: fixed; left: 50%; bottom: 32px; transform: translateX(-50%);
               background: rgba(24,24,27,.94); color: #fff; padding: 10px 16px;
               border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,.45);
               animation: pop .18s ease-out; max-width: 70vw; }
      .toast.err { background: rgba(185,28,28,.94); }
      @keyframes pop { from { opacity: 0; transform: translate(-50%, 8px); } }
      .hbtn { position: fixed; display: inline-flex; align-items: center; gap: 6px;
              background: #6366f1; color: #fff; border: 0; border-radius: 8px;
              padding: 7px 11px; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.4);
              font: 600 12px/1 system-ui, sans-serif; opacity: .92; }
      .hbtn:hover { opacity: 1; background: #4f46e5; }
      .hbtn svg { width: 14px; height: 14px; }
      .pickbox { position: fixed; border: 2px solid #6366f1;
                 background: rgba(99,102,241,.2); border-radius: 4px;
                 pointer-events: none; transition: all .06s linear; }
      .picktip { position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
                 background: #6366f1; color: #fff; padding: 8px 14px; border-radius: 999px;
                 box-shadow: 0 6px 20px rgba(0,0,0,.4); }
      .win { position: fixed; background: #0b0b0f; border: 1px solid rgba(255,255,255,.15);
             border-radius: 12px; overflow: hidden; box-shadow: 0 18px 60px rgba(0,0,0,.65);
             display: flex; flex-direction: column; min-width: 180px; min-height: 120px;
             resize: both; }
      .win header { display: flex; align-items: center; gap: 8px; padding: 6px 8px;
                    background: #16161d; color: #e4e4e7; cursor: move; user-select: none; }
      .win header span { flex: 1; overflow: hidden; text-overflow: ellipsis;
                         white-space: nowrap; font-size: 12px; }
      .win header button { background: rgba(255,255,255,.08); border: 0; color: #e4e4e7;
                           width: 22px; height: 22px; border-radius: 6px; cursor: pointer;
                           line-height: 1; }
      .win header button:hover { background: rgba(255,255,255,.18); }
      .win .body { flex: 1; display: flex; align-items: center; justify-content: center;
                   background: #000; overflow: hidden; }
      .win .body > * { max-width: 100%; max-height: 100%; object-fit: contain; }
    `;

    function ensure() {
      if (host && host.isConnected) return;
      host = document.createElement('div');
      host.style.cssText = 'all:initial;position:fixed;z-index:2147483647';
      shadow = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = CSS;
      layer = document.createElement('div');
      layer.className = 'layer';
      shadow.append(style, layer);
      (document.body || document.documentElement).appendChild(host);
    }

    function toast(msg, isErr) {
      if (!settings.showToast) return;
      ensure();
      const t = document.createElement('div');
      t.className = 'toast' + (isErr ? ' err' : '');
      t.textContent = msg;
      layer.appendChild(t);
      setTimeout(() => t.remove(), 2600);
    }

    /* --- Nút nổi trên video khi rê chuột --- */
    function showHoverButton(video) {
      if (!settings.hoverButton || isDisabled()) return;
      if (video.getBoundingClientRect().width < settings.minVideoWidth) return;
      ensure();
      if (!hoverBtn) {
        hoverBtn = document.createElement('button');
        hoverBtn.className = 'hbtn';
        hoverBtn.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<rect x="2" y="4" width="20" height="16" rx="2"/>' +
          '<rect x="12" y="12" width="8" height="6" rx="1" fill="currentColor"/></svg>PiP';
        hoverBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (hoverTarget) toggleVideoPiP(hoverTarget);
        });
      }
      hoverTarget = video;
      layer.appendChild(hoverBtn);
      positionHoverButton();
    }

    function positionHoverButton() {
      if (!hoverBtn || !hoverTarget || !hoverBtn.isConnected) return;
      const r = hoverTarget.getBoundingClientRect();
      if (r.width < settings.minVideoWidth || r.height < 90 || r.bottom < 0 || r.top > innerHeight) {
        return hideHoverButton();
      }
      const W = 62, H = 30, pad = 10;
      const pos = settings.hoverPosition || 'tr';
      const top = pos[0] === 't' ? r.top + pad : r.bottom - H - pad;
      const left = pos[1] === 'l' ? r.left + pad : r.right - W - pad;
      hoverBtn.style.top = Math.max(4, Math.min(innerHeight - H - 4, top)) + 'px';
      hoverBtn.style.left = Math.max(4, Math.min(innerWidth - W - 4, left)) + 'px';
    }

    function hideHoverButton() {
      hoverTarget = null;
      if (hoverBtn) hoverBtn.remove();
    }

    /* --- Cửa sổ nổi trong trang (fallback khi trình duyệt không có PiP API) --- */
    function floatWindow(node, title, onClose) {
      ensure();
      const win = document.createElement('div');
      win.className = 'win';
      const w = Math.min(settings.floatWidth || 480, innerWidth - 40);
      win.style.width = w + 'px';
      win.style.height = Math.round(w * 0.6) + 'px';
      win.style.right = '24px';
      win.style.bottom = '24px';

      const head = document.createElement('header');
      const label = document.createElement('span');
      label.textContent = title || 'Picture in Picture';
      const close = document.createElement('button');
      close.textContent = '✕';
      close.title = 'Đóng';
      head.append(label, close);

      const body = document.createElement('div');
      body.className = 'body';
      body.appendChild(node);
      win.append(head, body);
      layer.appendChild(win);

      const destroy = () => {
        win.remove();
        try { onClose && onClose(); } catch (_) {}
      };
      close.addEventListener('click', destroy);

      let sx, sy, ox, oy, dragging = false;
      head.addEventListener('pointerdown', (e) => {
        if (e.target === close) return;
        dragging = true;
        const r = win.getBoundingClientRect();
        win.style.left = r.left + 'px';
        win.style.top = r.top + 'px';
        win.style.right = 'auto';
        win.style.bottom = 'auto';
        sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
        head.setPointerCapture(e.pointerId);
      });
      head.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        win.style.left = Math.max(0, Math.min(innerWidth - 60, ox + e.clientX - sx)) + 'px';
        win.style.top = Math.max(0, Math.min(innerHeight - 40, oy + e.clientY - sy)) + 'px';
      });
      head.addEventListener('pointerup', () => { dragging = false; });
      return { el: win, close: destroy };
    }

    /* --- Chế độ chọn phần tử --- */
    function startPicker() {
      if (picking) return;
      ensure();
      picking = true;
      const box = document.createElement('div');
      box.className = 'pickbox';
      const tip = document.createElement('div');
      tip.className = 'picktip';
      tip.textContent = 'Nhấp vào video hoặc ảnh để mở PiP — Esc để huỷ';
      layer.append(box, tip);

      let current = null;
      const move = (e) => {
        const el = pickAt(e.clientX, e.clientY);
        current = el;
        if (!el) { box.style.width = '0'; return; }
        const r = el.getBoundingClientRect();
        Object.assign(box.style, {
          top: r.top + 'px', left: r.left + 'px',
          width: r.width + 'px', height: r.height + 'px',
        });
      };
      const stop = () => {
        picking = false;
        box.remove(); tip.remove();
        removeEventListener('mousemove', move, true);
        removeEventListener('click', click, true);
        removeEventListener('keydown', key, true);
      };
      const click = (e) => {
        e.preventDefault(); e.stopPropagation();
        const el = current || pickAt(e.clientX, e.clientY);
        stop();
        if (el) pipElement(el);
      };
      const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); stop(); } };
      addEventListener('mousemove', move, true);
      addEventListener('click', click, true);
      addEventListener('keydown', key, true);
    }

    function pickAt(x, y) {
      const stack = document.elementsFromPoint(x, y);
      for (const el of stack) {
        if (host && host.contains(el)) continue;
        if (el.getRootNode() === shadow) continue;
        if (el.tagName === 'VIDEO' || el.tagName === 'IMG' || el.tagName === 'CANVAS') return el;
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg.indexOf('url(') === 0 && el.getBoundingClientRect().width > 60) return el;
      }
      return stack.find((el) => !(host && host.contains(el))) || null;
    }

    addEventListener('scroll', positionHoverButton, true);
    addEventListener('resize', positionHoverButton);

    return { toast, showHoverButton, hideHoverButton, floatWindow, startPicker };
  })();

  /* ------------------------------------------------------------------ */
  /* Nghiệp vụ PiP                                                       */
  /* ------------------------------------------------------------------ */

  async function toggleVideoPiP(video) {
    const v = video || pickBestVideo();
    if (!v) return ui.toast('Không tìm thấy video nào trên trang này', true);

    // Mô-đun mở rộng có thể tự lo cửa sổ PiP; trả về true nghĩa là đã xử lý xong.
    const override = window.__pipViewer__.openOverride;
    if (override) {
      try {
        if (await override(v)) return;
      } catch (err) {
        console.warn('[PiP Viewer] mô-đun mở rộng lỗi:', err);
      }
    }

    if (document.pictureInPictureElement) {
      const same = document.pictureInPictureElement === v;
      await document.exitPictureInPicture().catch(() => {});
      if (same) return;
    }
    if (!hasNativePiP) return floatVideo(v);

    try {
      v.removeAttribute('disablepictureinpicture');
      v.disablePictureInPicture = false;
      await v.requestPictureInPicture();
      ui.hideHoverButton();
      v.addEventListener(
        'leavepictureinpicture',
        () => { if (settings.pauseOnExit) v.pause(); },
        { once: true }
      );
    } catch (_) {
      floatVideo(v);
    }
  }

  /** Fallback: đưa video vào cửa sổ nổi, trả về chỗ cũ khi đóng. */
  function floatVideo(v) {
    const placeholder = document.createComment('pip-viewer');
    const parent = v.parentNode;
    if (!parent) return ui.toast('Không thể mở PiP cho video này', true);
    parent.insertBefore(placeholder, v);
    const prevStyle = v.getAttribute('style') || '';
    const hadControls = v.hasAttribute('controls');
    v.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000';
    v.setAttribute('controls', '');
    ui.floatWindow(v, document.title, () => {
      if (prevStyle) v.setAttribute('style', prevStyle);
      else v.removeAttribute('style');
      if (!hadControls) v.removeAttribute('controls');
      if (placeholder.parentNode) placeholder.parentNode.replaceChild(v, placeholder);
    });
    ui.toast('Trình duyệt không hỗ trợ PiP gốc — dùng cửa sổ nổi trong trang');
  }

  /**
   * PiP cho ảnh: vẽ ảnh lên canvas -> captureStream -> video -> PiP gốc,
   * nhờ vậy ảnh nổi trên mọi cửa sổ giống như video.
   */
  async function imagePiP(src) {
    if (!src) return ui.toast('Không tìm thấy ảnh nào', true);

    const load = (crossOrigin) =>
      new Promise((res, rej) => {
        const img = new Image();
        if (crossOrigin) img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
      });

    let img = null;
    try { img = await load(true); } catch (_) {
      try { img = await load(false); } catch (_) {}
    }
    if (!img) return ui.toast('Không tải được ảnh này', true);

    const wantNative = settings.imageMode !== 'float';
    if (wantNative && hasNativePiP &&
        typeof HTMLCanvasElement.prototype.captureStream === 'function') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.getImageData(0, 0, 1, 1); // ném lỗi nếu canvas bị taint (ảnh cross-origin)

        const stream = canvas.captureStream(1);
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0';
        document.body.appendChild(video);
        await video.play();
        // Vẽ lại định kỳ để khung hình đầu không bị đen
        const redraw = setInterval(
          () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height),
          500
        );
        await video.requestPictureInPicture();
        video.addEventListener('leavepictureinpicture', () => {
          clearInterval(redraw);
          stream.getTracks().forEach((t) => t.stop());
          video.remove();
        });
        return;
      } catch (_) {
        /* rơi xuống các phương án dưới */
      }
    }

    if (wantNative && hasDocPiP) {
      try {
        const w = await documentPictureInPicture.requestWindow({
          width: Math.min(720, img.naturalWidth || 640),
          height: Math.min(720, img.naturalHeight || 480),
        });
        w.document.body.style.cssText =
          'margin:0;background:#000;display:flex;align-items:center;' +
          'justify-content:center;height:100vh';
        const clone = new Image();
        clone.src = img.src;
        clone.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain';
        w.document.body.appendChild(clone);
        return;
      } catch (_) {}
    }

    const clone = new Image();
    clone.src = img.src;
    ui.floatWindow(clone, 'Ảnh — ' + (src.split('/').pop() || '').slice(0, 40));
  }

  /** PiP cho canvas (game, biểu đồ, bản đồ...). */
  async function canvasPiP(canvas) {
    if (!hasNativePiP || typeof canvas.captureStream !== 'function') {
      try { return imagePiP(canvas.toDataURL()); } catch (_) {
        return ui.toast('Không thể mở PiP cho phần tử này', true);
      }
    }
    try {
      const video = document.createElement('video');
      video.srcObject = canvas.captureStream(30);
      video.muted = true;
      video.playsInline = true;
      video.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0';
      document.body.appendChild(video);
      await video.play();
      await video.requestPictureInPicture();
      video.addEventListener('leavepictureinpicture', () => video.remove());
    } catch (_) {
      ui.toast('Không thể mở PiP cho phần tử này', true);
    }
  }

  function pipElement(el) {
    if (!el) return ui.toast('Không xác định được phần tử', true);
    if (el.tagName === 'VIDEO') return toggleVideoPiP(el);
    if (el.tagName === 'IMG') return imagePiP(el.currentSrc || el.src);
    if (el.tagName === 'CANVAS') return canvasPiP(el);
    const bg = getComputedStyle(el).backgroundImage;
    const m = bg && bg.match(/url\(["']?(.*?)["']?\)/);
    if (m) return imagePiP(new URL(m[1], location.href).href);
    const inner = el.querySelector('video, img, canvas');
    if (inner) return pipElement(inner);
    ui.toast('Phần tử này không phải video hay ảnh', true);
  }

  /* ------------------------------------------------------------------ */
  /* Sự kiện trang + cầu nối với background                              */
  /* ------------------------------------------------------------------ */

  let lastContext = null;
  addEventListener(
    'contextmenu',
    (e) => {
      const el = e.composedPath ? e.composedPath()[0] : e.target;
      lastContext = el && el.nodeType === 1 ? el : null;
    },
    true
  );

  addEventListener(
    'mouseover',
    (e) => {
      if (!settings.hoverButton) return;
      const el = e.composedPath ? e.composedPath()[0] : e.target;
      if (el && el.tagName === 'VIDEO' && isVisible(el)) ui.showHoverButton(el);
    },
    true
  );

  document.addEventListener('visibilitychange', () => {
    if (!hasNativePiP || isDisabled()) return;
    if (document.hidden) {
      if (!settings.autoPiPOnBlur) return;
      const v = deepQuery('video').find((x) => !x.paused && !x.ended && isVisible(x));
      if (v && !document.pictureInPictureElement) v.requestPictureInPicture().catch(() => {});
    } else if (settings.exitOnReturn && document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }
  });

  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // Mô-đun mở rộng được xử lý trước; trả về true nghĩa là đã nhận thông điệp.
    for (const handle of window.__pipViewer__.handlers) {
      try {
        if (handle(msg, sendResponse)) return true;
      } catch (err) {
        console.warn('[PiP Viewer] mô-đun mở rộng lỗi:', err);
      }
    }
    switch (msg && msg.type) {
      case 'PING':
        sendResponse({ ok: true });
        break;
      case 'TOGGLE_PIP':
        toggleVideoPiP(null);
        sendResponse({ ok: true });
        break;
      case 'PIP_CONTEXT_VIDEO':
        toggleVideoPiP(lastContext && lastContext.tagName === 'VIDEO' ? lastContext : null);
        sendResponse({ ok: true });
        break;
      case 'PIP_CONTEXT_IMAGE': {
        const el = lastContext && lastContext.tagName === 'IMG' ? lastContext : null;
        imagePiP(el ? el.currentSrc || el.src : msg.srcUrl);
        sendResponse({ ok: true });
        break;
      }
      case 'PIP_IMAGE': {
        const best = pickBestImage();
        imagePiP(msg.srcUrl || (best && (best.currentSrc || best.src)));
        sendResponse({ ok: true });
        break;
      }
      case 'PICK_ELEMENT':
        ui.startPicker();
        sendResponse({ ok: true });
        break;
      case 'EXIT_PIP':
        if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
        sendResponse({ ok: true });
        break;
      case 'LIST_MEDIA': {
        const vids = deepQuery('video').filter(isVisible).sort((a, b) => scoreVideo(b) - scoreVideo(a));
        window.__pipList = vids;
        sendResponse({
          ok: true,
          inPiP: !!document.pictureInPictureElement,
          nativePiP: hasNativePiP,
          docPiP: hasDocPiP,
          host: location.hostname,
          disabled: isDisabled(),
          videos: vids.map((v, i) => ({
            index: i,
            width: Math.round(v.videoWidth || v.clientWidth),
            height: Math.round(v.videoHeight || v.clientHeight),
            duration: isFinite(v.duration) ? Math.round(v.duration) : 0,
            playing: !v.paused && !v.ended,
            active: document.pictureInPictureElement === v,
            label: (v.title || v.getAttribute('aria-label') || document.title || 'Video').slice(0, 60),
          })),
        });
        break;
      }
      case 'PIP_INDEX': {
        const list = window.__pipList || deepQuery('video').filter(isVisible);
        toggleVideoPiP(list[msg.index] || null);
        sendResponse({ ok: true });
        break;
      }
      default:
        sendResponse({ ok: false });
    }
    return true;
  });

  /* Công khai phần lõi cho các mô-đun mở rộng dùng lại. */
  Object.assign(window.__pipViewer__, {
    settings,
    ui,
    deepQuery,
    isVisible,
    isDisabled,
    pickBestVideo,
    pickBestImage,
    toggleVideoPiP,
    floatVideo,
    imagePiP,
    canvasPiP,
    pipElement,
    hasNativePiP,
    hasDocPiP,
  });
})();
