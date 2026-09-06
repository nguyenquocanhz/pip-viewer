/**
 * Lớp dịch dùng chung cho content script, popup và trang cấu hình.
 *
 * Chuỗi có tham số viết bằng dấu ngoặc nhọn: "Tìm thấy {n} video".
 * Cố ý không dùng cú pháp $1 của Chrome để khỏi phải khai placeholders
 * cho từng chuỗi trong messages.json.
 */
var PIP_I18N = (() => {
  const api = globalThis.chrome || globalThis.browser;

  /** Lấy chuỗi đã dịch. Thiếu khoá thì trả về chính khoá để lộ ra ngay. */
  function t(key, vars) {
    let s = '';
    try {
      s = (api && api.i18n && api.i18n.getMessage(key)) || '';
    } catch (_) {}
    if (!s) s = key;
    if (vars) {
      for (const name in vars) s = s.split('{' + name + '}').join(vars[name]);
    }
    return s;
  }

  /**
   * Điền chuỗi vào một cây DOM tĩnh.
   *   data-i18n="key"        -> nội dung chữ
   *   data-i18n-title="key"  -> thuộc tính title
   *   data-i18n-ph="key"     -> thuộc tính placeholder
   *   data-i18n-aria="key"   -> thuộc tính aria-label
   */
  function apply(root = document) {
    for (const el of root.querySelectorAll('[data-i18n]')) {
      el.textContent = t(el.dataset.i18n);
    }
    const attrs = { i18nTitle: 'title', i18nPh: 'placeholder', i18nAria: 'aria-label' };
    for (const prop in attrs) {
      for (const el of root.querySelectorAll(`[data-${prop.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}]`)) {
        el.setAttribute(attrs[prop], t(el.dataset[prop]));
      }
    }
    if (root === document) {
      const title = document.querySelector('title[data-i18n-doc]');
      if (title) document.title = t(title.dataset.i18nDoc);
    }
  }

  /** Ngôn ngữ giao diện đang dùng, để chọn định dạng số. */
  function locale() {
    try {
      return (api && api.i18n && api.i18n.getUILanguage && api.i18n.getUILanguage()) || 'vi';
    } catch (_) {
      return 'vi';
    }
  }

  return { t, apply, locale };
})();

if (typeof window !== 'undefined') window.PIP_I18N = PIP_I18N;
