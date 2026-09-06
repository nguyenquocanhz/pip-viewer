/**
 * Nguồn duy nhất cho mọi chuỗi hiển thị.
 *
 * Chạy `npm run i18n` để sinh ra mv3/_locales/<mã>/messages.json.
 * Thêm ngôn ngữ = thêm một cột vào LOCALES và một khoá vào từng mục;
 * script sinh sẽ báo ngay nếu thiếu, nên hai bản dịch không thể lệch nhau.
 *
 * Chuỗi có tham số dùng dấu ngoặc nhọn, ví dụ {n}. i18n.js thay ở lúc chạy —
 * cố ý không dùng $1 của Chrome để khỏi phải khai placeholders cho từng chuỗi.
 */
import { mkdirSync, writeFileSync } from 'node:fs';

export const LOCALES = ['vi', 'en'];
export const DEFAULT_LOCALE = 'vi';

export const MESSAGES = {
  /* ---------- Manifest ---------- */
  extName: {
    vi: 'PiP Viewer — Xem video & ảnh trong ảnh',
    en: 'PiP Viewer — Picture-in-Picture for video & images',
  },
  extDesc: {
    vi: 'Mở video, ảnh hoặc canvas bất kỳ trong cửa sổ ảnh-trong-ảnh nổi trên mọi ứng dụng.',
    en: 'Open any video, image or canvas in a picture-in-picture window that floats above every app.',
  },
  actionTitle: { vi: 'PiP Viewer (Alt+P)', en: 'PiP Viewer (Alt+P)' },
  cmdTogglePip: {
    vi: 'Bật/tắt PiP cho video đang phát',
    en: 'Toggle picture-in-picture for the playing video',
  },
  cmdPickElement: { vi: 'Chọn phần tử để mở PiP', en: 'Pick an element to open in PiP' },
  cmdPipImage: {
    vi: 'Mở PiP cho ảnh lớn nhất trên trang',
    en: 'Open PiP for the largest image on the page',
  },

  /* ---------- Menu chuột phải ---------- */
  menuVideo: { vi: 'Xem video trong ảnh-trong-ảnh', en: 'Watch video in picture-in-picture' },
  menuImage: { vi: 'Xem ảnh trong ảnh-trong-ảnh', en: 'View image in picture-in-picture' },
  menuPage: { vi: 'PiP video đang phát trên trang', en: 'PiP the video playing on this page' },
  menuPick: { vi: 'Chọn phần tử để mở PiP…', en: 'Pick an element to open in PiP…' },

  /* ---------- Popup ---------- */
  popupScanning: { vi: 'Đang quét trang…', en: 'Scanning the page…' },
  popupUnavailable: { vi: 'Không dùng được trên trang này', en: 'Not available on this page' },
  popupFound: { vi: 'Tìm thấy {n} video', en: '{n} video(s) found' },
  popupFoundInPip: {
    vi: 'Tìm thấy {n} video — đang ở chế độ PiP',
    en: '{n} video(s) found — picture-in-picture is on',
  },
  popupNoVideo: {
    vi: 'Không thấy video — vẫn có thể mở PiP cho ảnh',
    en: 'No video found — you can still open an image in PiP',
  },
  popupBtnVideo: { vi: 'PiP video đang phát', en: 'PiP the playing video' },
  popupBtnImage: { vi: 'Ảnh lớn nhất', en: 'Largest image' },
  popupBtnPick: { vi: 'Chọn phần tử', en: 'Pick element' },
  popupBtnExit: { vi: 'Thoát PiP', en: 'Exit PiP' },
  popupListTitle: { vi: 'Video trên trang', en: 'Videos on this page' },
  popupKeyToggle: { vi: 'bật/tắt PiP', en: 'toggle PiP' },
  popupKeyPick: { vi: 'chọn phần tử', en: 'pick element' },
  popupSettings: { vi: 'Cấu hình đầy đủ', en: 'All settings' },
  popupPro: {
    vi: 'PiP Viewer Pro — điều khiển trong cửa sổ PiP, phụ đề, chụp ảnh và cắt clip',
    en: 'PiP Viewer Pro — in-window controls, subtitles, screenshots and clips',
  },
  videoN: { vi: 'Video {n}', en: 'Video {n}' },
  statePlaying: { vi: 'đang phát', en: 'playing' },
  statePaused: { vi: 'đã dừng', en: 'paused' },

  /* ---------- Công tắc dùng chung ---------- */
  optHoverButton: {
    vi: 'Hiện nút PiP khi rê chuột lên video',
    en: 'Show a PiP button when hovering a video',
  },
  optAutoPiP: {
    vi: 'Tự bật PiP khi chuyển sang tab khác',
    en: 'Turn on PiP when you switch tabs',
  },

  /* ---------- Trang cấu hình: khung ---------- */
  dashTitle: { vi: 'Cấu hình PiP Viewer', en: 'PiP Viewer settings' },
  dashLede: {
    vi: 'Mọi thay đổi được lưu ngay và áp dụng cho các tab đang mở.',
    en: 'Every change saves immediately and applies to open tabs.',
  },
  dashSaved: { vi: 'Đã lưu', en: 'Saved' },
  navHover: { vi: 'Nút trên video', en: 'Button on videos' },
  navBehavior: { vi: 'Hành vi tự động', en: 'Automatic behaviour' },
  navDisplay: { vi: 'Hiển thị & ảnh', en: 'Display & images' },
  navSites: { vi: 'Trang loại trừ', en: 'Excluded sites' },
  navKeys: { vi: 'Phím tắt', en: 'Keyboard shortcuts' },
  navPro: { vi: 'Nâng cấp Pro', en: 'Upgrade to Pro' },
  navAbout: { vi: 'Trạng thái & giới thiệu', en: 'Status & about' },

  /* ---------- Trang cấu hình: nút trên video ---------- */
  secHover: { vi: 'Nút PiP trên video', en: 'PiP button on videos' },
  hoverBtnDesc: {
    vi: 'Một nút nhỏ xuất hiện ở góc video, bấm là mở PiP ngay.',
    en: 'A small button appears in the corner of the video; one click opens PiP.',
  },
  hoverPos: { vi: 'Vị trí nút', en: 'Button position' },
  hoverPosDesc: { vi: 'Góc của video nơi nút hiển thị.', en: 'Which corner of the video it sits in.' },
  cornerTL: { vi: 'Trên trái', en: 'Top left' },
  cornerTR: { vi: 'Trên phải', en: 'Top right' },
  cornerBL: { vi: 'Dưới trái', en: 'Bottom left' },
  cornerBR: { vi: 'Dưới phải', en: 'Bottom right' },
  minWidth: { vi: 'Bề ngang video tối thiểu', en: 'Minimum video width' },
  minWidthDesc: {
    vi: 'Video hẹp hơn mức này sẽ không hiện nút — tránh làm phiền ở quảng cáo và video nhỏ.',
    en: 'Narrower videos get no button — keeps ads and thumbnails out of the way.',
  },

  /* ---------- Trang cấu hình: hành vi ---------- */
  secBehavior: { vi: 'Hành vi tự động', en: 'Automatic behaviour' },
  autoPiPDesc: {
    vi: 'Video đang phát sẽ tự nổi lên khi bạn rời tab.',
    en: 'The playing video floats up on its own when you leave the tab.',
  },
  exitOnReturn: { vi: 'Thoát PiP khi quay lại tab', en: 'Exit PiP when you come back' },
  exitOnReturnDesc: {
    vi: 'Trả video về đúng vị trí cũ trên trang.',
    en: 'Puts the video back exactly where it was on the page.',
  },
  pauseOnExit: { vi: 'Tạm dừng video khi đóng cửa sổ PiP', en: 'Pause the video when PiP closes' },
  pauseOnExitDesc: {
    vi: 'Mặc định video vẫn chạy tiếp trên trang sau khi đóng PiP.',
    en: 'By default the video keeps playing on the page after PiP closes.',
  },

  /* ---------- Trang cấu hình: hiển thị ---------- */
  secDisplay: { vi: 'Hiển thị & ảnh', en: 'Display & images' },
  showToast: { vi: 'Hiện thông báo nhỏ', en: 'Show small notifications' },
  showToastDesc: {
    vi: 'Thông báo ở cuối trang khi mở PiP hoặc khi có lỗi.',
    en: 'A note at the bottom of the page when PiP opens or something fails.',
  },
  imageMode: { vi: 'Cách mở ảnh', en: 'How images open' },
  imageModeDesc: {
    vi: 'Ảnh được vẽ lên canvas rồi phát như video, nhờ vậy nổi trên mọi cửa sổ.',
    en: 'Images are drawn to a canvas and played as video, so they float above every window.',
  },
  imageModeReal: { vi: 'Cửa sổ PiP thật', en: 'Real PiP window' },
  imageModeFloat: { vi: 'Cửa sổ nổi trong trang', en: 'Floating window in page' },
  floatWidth: { vi: 'Bề ngang cửa sổ nổi', en: 'Floating window width' },
  floatWidthDesc: {
    vi: 'Áp dụng cho cửa sổ nổi trong trang (khi trình duyệt không hỗ trợ PiP thật).',
    en: 'Used for the in-page floating window when the browser has no real PiP.',
  },

  /* ---------- Trang cấu hình: trang loại trừ ---------- */
  secSites: { vi: 'Trang loại trừ', en: 'Excluded sites' },
  sitesDesc: {
    vi: 'Trên những trang này, PiP Viewer sẽ không hiện nút khi rê chuột và không tự bật PiP. Bạn vẫn có thể mở PiP thủ công bằng phím tắt hoặc menu chuột phải. Nhập tên miền, ví dụ example.com — các tên miền con cũng được tính.',
    en: 'On these sites PiP Viewer shows no hover button and never turns PiP on by itself. You can still open PiP by hand with a shortcut or the right-click menu. Enter a domain such as example.com — subdomains count too.',
  },
  sitesAdd: { vi: 'Thêm', en: 'Add' },
  sitesEmpty: { vi: 'Chưa có trang nào bị loại trừ.', en: 'No sites excluded yet.' },
  sitesRemove: { vi: 'Bỏ khỏi danh sách', en: 'Remove from list' },

  /* ---------- Trang cấu hình: phím tắt ---------- */
  secKeys: { vi: 'Phím tắt', en: 'Keyboard shortcuts' },
  keyToggleDesc: { vi: 'Bật/tắt PiP cho video đang phát', en: 'Toggle PiP for the playing video' },
  keyPickDesc: { vi: 'Chọn phần tử trên trang để mở PiP', en: 'Pick an element on the page to open in PiP' },
  keyImageDesc: { vi: 'Mở PiP cho ảnh lớn nhất trên trang', en: 'Open PiP for the largest image on the page' },
  keyUnset: { vi: 'chưa gán', en: 'not set' },
  keysChange: { vi: 'Đổi phím tắt trong trình duyệt', en: 'Change shortcuts in the browser' },
  keysHint: {
    vi: 'Mở thủ công trang {url} để đổi phím tắt.',
    en: 'Open {url} manually to change the shortcuts.',
  },

  /* ---------- Trang cấu hình: Pro ---------- */
  secPro: { vi: 'PiP Viewer Pro', en: 'PiP Viewer Pro' },
  proHead: {
    vi: 'Bản miễn phí đã đủ dùng hằng ngày.',
    en: 'The free version is enough for everyday use.',
  },
  proSub: {
    vi: 'Bản Pro thêm những thứ cần nhiều công sức bảo trì hơn — mua một lần, dùng mãi.',
    en: 'Pro adds the parts that take real upkeep — buy once, keep it.',
  },
  proBadge: { vi: 'Đang phát triển', en: 'In development' },
  colFeature: { vi: 'Tính năng', en: 'Feature' },
  colFree: { vi: 'Miễn phí', en: 'Free' },
  colPro: { vi: 'Pro', en: 'Pro' },
  featBasic: { vi: 'PiP cho video, ảnh, canvas', en: 'PiP for video, images, canvas' },
  featEntry: {
    vi: 'Nút hover, phím tắt, menu chuột phải',
    en: 'Hover button, shortcuts, right-click menu',
  },
  featSites: { vi: 'Trang loại trừ', en: 'Excluded sites' },
  featControls: {
    vi: 'Điều khiển trong cửa sổ PiP (tua, tốc độ, âm lượng)',
    en: 'Controls inside the PiP window (seek, speed, volume)',
  },
  featSubs: { vi: 'Phụ đề hiển thị ngay trong cửa sổ PiP', en: 'Subtitles shown inside the PiP window' },
  featCapture: { vi: 'Chụp khung hình & ghi clip đoạn đang xem', en: 'Grab a frame, record the part you are watching' },
  featRules: { vi: 'Quy tắc riêng cho từng trang web', en: 'Per-site rules' },
  featAdjust: { vi: 'Chỉnh độ sáng, tương phản, xoay, lật gương', en: 'Brightness, contrast, rotate, mirror' },
  featGain: { vi: 'Khuếch đại âm lượng tới 300%', en: 'Boost volume up to 300%' },
  featLoop: { vi: 'Lặp đoạn A–B', en: 'A–B loop' },
  featSrt: { vi: 'Nạp phụ đề .srt từ máy bằng kéo thả', en: 'Drag a local .srt file onto the window' },
  featNight: { vi: 'Chế độ ban đêm một nút', en: 'One-button night mode' },
  featFrame: { vi: 'Tua từng khung hình khi tạm dừng', en: 'Step frame by frame while paused' },
  featSpeed: { vi: 'Nhớ tốc độ phát theo từng trang', en: 'Remember playback speed per site' },
  featKeys: { vi: 'Phím tắt ngay trong cửa sổ PiP', en: 'Shortcuts inside the PiP window' },
  proSee: { vi: 'Xem bản Pro', en: 'See Pro' },
  proSponsor: { vi: 'Ủng hộ tác giả', en: 'Support the author' },
  proHint: {
    vi: 'Chưa cần trả tiền để dùng — bản miễn phí không giới hạn thời gian.',
    en: 'No payment needed to use it — the free version never expires.',
  },

  /* ---------- Trang cấu hình: trạng thái ---------- */
  secAbout: { vi: 'Trạng thái & giới thiệu', en: 'Status & about' },
  statManifest: { vi: 'Phiên bản manifest', en: 'Manifest version' },
  statBrowser: { vi: 'Trình duyệt', en: 'Browser' },
  statNativePiP: { vi: 'PiP gốc cho video', en: 'Native PiP for video' },
  statDocPiP: { vi: 'Document PiP (ảnh, HTML)', en: 'Document PiP (images, HTML)' },
  statSupported: { vi: 'Được hỗ trợ', en: 'Supported' },
  statUnsupported: { vi: 'Không hỗ trợ', en: 'Not supported' },
  statUnsupportedFloat: {
    vi: 'Không hỗ trợ — dùng cửa sổ nổi',
    en: 'Not supported — falls back to a floating window',
  },
  aboutUsage: {
    vi: 'Cách dùng: bấm biểu tượng extension để chọn nhanh, chuột phải lên video hoặc ảnh để mở PiP, hoặc dùng Chọn phần tử rồi nhấp vào video / ảnh / canvas bất kỳ.',
    en: 'How to use it: click the extension icon for quick actions, right-click a video or image to open PiP, or use Pick element and click any video, image or canvas.',
  },
  linkSource: { vi: 'Mã nguồn trên GitHub', en: 'Source on GitHub' },
  linkIssues: { vi: 'Báo lỗi / góp ý', en: 'Report a bug / suggest' },
  linkSponsor: { vi: 'GitHub Sponsors', en: 'GitHub Sponsors' },
  resetTitle: { vi: 'Khôi phục cài đặt gốc', en: 'Reset to defaults' },
  resetDesc: {
    vi: 'Xoá mọi tuỳ chỉnh, kể cả danh sách trang loại trừ.',
    en: 'Clears every customisation, including the excluded sites.',
  },
  resetBtn: { vi: 'Khôi phục', en: 'Reset' },
  resetConfirm: {
    vi: 'Khôi phục toàn bộ cài đặt về mặc định?',
    en: 'Reset all settings to their defaults?',
  },

  /* ---------- Đơn vị ---------- */
  unitPx: { vi: '{n} px', en: '{n} px' },
  unitPercent: { vi: '{n}%', en: '{n}%' },

  /* ---------- Content script ---------- */
  noVideo: {
    vi: 'Không tìm thấy video nào trên trang này',
    en: 'No video found on this page',
  },
  cannotPiPVideo: { vi: 'Không thể mở PiP cho video này', en: 'Cannot open PiP for this video' },
  fallbackFloat: {
    vi: 'Trình duyệt không hỗ trợ PiP gốc — dùng cửa sổ nổi trong trang',
    en: 'This browser has no native PiP — using an in-page floating window',
  },
  noImage: { vi: 'Không tìm thấy ảnh nào', en: 'No image found' },
  imageLoadFailed: { vi: 'Không tải được ảnh này', en: 'Could not load this image' },
  cannotPiPElement: {
    vi: 'Không thể mở PiP cho phần tử này',
    en: 'Cannot open PiP for this element',
  },
  noElement: { vi: 'Không xác định được phần tử', en: 'No element identified' },
  notMedia: {
    vi: 'Phần tử này không phải video hay ảnh',
    en: 'That element is not a video or an image',
  },
  pickerTip: {
    vi: 'Nhấp vào video hoặc ảnh để mở PiP — Esc để huỷ',
    en: 'Click a video or image to open PiP — Esc to cancel',
  },
  windowClose: { vi: 'Đóng', en: 'Close' },
  windowTitle: { vi: 'Ảnh trong ảnh', en: 'Picture in picture' },
  imageWindowTitle: { vi: 'Ảnh — {name}', en: 'Image — {name}' },
};

/* ------------------------------------------------------------------ */

/** Sinh _locales cho một thư mục bản dựng. */
export function writeLocales(dir) {
  const keys = Object.keys(MESSAGES);
  const missing = [];

  for (const locale of LOCALES) {
    const out = {};
    for (const key of keys) {
      const value = MESSAGES[key][locale];
      if (typeof value !== 'string' || !value) {
        missing.push(`${locale}.${key}`);
        continue;
      }
      out[key] = { message: value };
    }
    const path = `${dir}/_locales/${locale}`;
    mkdirSync(path, { recursive: true });
    writeFileSync(`${path}/messages.json`, JSON.stringify(out, null, 2) + '\n');
  }

  if (missing.length) {
    throw new Error('Thiếu bản dịch cho: ' + missing.join(', '));
  }
  return { locales: LOCALES.length, keys: keys.length };
}
