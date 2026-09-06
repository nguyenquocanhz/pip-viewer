/**
 * Giả lập API extension để xem thử popup.html / dashboard.html bằng máy chủ tĩnh
 * (chỉ dùng khi phát triển: mở kèm ?stub=1).
 */
(() => {
  const store = JSON.parse(localStorage.getItem('pip-stub') || '{}');
  const persist = () => localStorage.setItem('pip-stub', JSON.stringify(store));

  window.chrome = {
    storage: {
      sync: {
        get: (d, cb) => cb(Object.assign({}, d, store)),
        set: (v, cb) => { Object.assign(store, v); persist(); cb && cb(); },
      },
      onChanged: { addListener() {} },
    },
    runtime: {
      lastError: null,
      getManifest: () => ({ version: '1.0.0', manifest_version: 3 }),
      getURL: (p) => '/mv3/' + p,
      openOptionsPage: () => (location.href = '/mv3/dashboard.html?stub=1'),
      sendMessage: (msg, cb) =>
        cb({
          ok: true,
          inPiP: false,
          nativePiP: true,
          host: 'example.com',
          disabled: false,
          videos: [
            { index: 0, width: 1920, height: 1080, duration: 754, playing: true, active: false, label: 'Video giới thiệu sản phẩm' },
            { index: 1, width: 640, height: 360, duration: 31, playing: false, active: false, label: 'Quảng cáo đầu trang' },
          ],
        }),
    },
    commands: {
      getAll: (cb) =>
        cb([
          { name: 'toggle-pip', shortcut: 'Alt+P' },
          { name: 'pick-element', shortcut: 'Alt+Shift+P' },
          { name: 'pip-image', shortcut: '' },
        ]),
    },
    tabs: { create: (o) => console.log('tabs.create', o) },
  };
})();
