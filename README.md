# PiP Viewer — xem video & ảnh trong ảnh

Extension mở video, ảnh hoặc canvas bất kỳ trên trang web vào một cửa sổ
ảnh-trong-ảnh (Picture-in-Picture) nổi trên mọi ứng dụng.

[![Release](https://img.shields.io/github/v/release/nguyenquocanhz/pip-viewer?color=6366f1)](https://github.com/nguyenquocanhz/pip-viewer/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-6366f1.svg)](LICENSE)
[![Manifest V3 + V2](https://img.shields.io/badge/Manifest-V3%20%2B%20V2-22c55e.svg)](#)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ec4899.svg)](https://github.com/sponsors/nguyenquocanhz)

> Miễn phí, mã nguồn mở, không quảng cáo, không thu thập dữ liệu.
> Nếu thấy hữu ích, bạn có thể [ủng hộ tác giả](#-ủng-hộ-tác-giả) một ly cà phê ☕

Có sẵn **hai bản dùng chung một mã nguồn**:

| Thư mục | Manifest | Dành cho |
|---|---|---|
| `mv3/` | Manifest V3 | Chrome, Edge, Brave, Opera, Cốc Cốc |
| `mv2/` | Manifest V2 | Firefox và các trình duyệt Chromium cũ |

## Tính năng

- **Video → PiP** bằng API gốc của trình duyệt; nếu trình duyệt không hỗ trợ
  (ví dụ Firefox) thì tự chuyển sang **cửa sổ nổi kéo–thả–co giãn** ngay trong trang,
  và trả video về đúng vị trí cũ khi đóng.
- **Ảnh → PiP thật**: ảnh được vẽ lên canvas, `captureStream()` thành luồng video rồi
  đưa vào cửa sổ PiP — nhờ vậy ảnh cũng nổi trên mọi cửa sổ như video.
  Ảnh cross-origin bị chặn canvas sẽ tự lùi về Document PiP hoặc cửa sổ nổi.
- **Canvas → PiP** cho biểu đồ, bản đồ, game trên nền canvas.
- **Chọn phần tử**: bật chế độ chọn rồi nhấp vào video / ảnh / canvas bất kỳ,
  kể cả ảnh đặt làm `background-image`.
- Tìm media **xuyên qua Shadow DOM** và mọi iframe cùng cấp.
- **Nút PiP nổi** ở góc video khi rê chuột (chọn được góc, ngưỡng kích thước).
- **Menu chuột phải** trên video / ảnh / trang.
- **Phím tắt**: `Alt+P` bật tắt PiP, `Alt+Shift+P` chọn phần tử.
- **Trang cấu hình** (`dashboard.html`) với đầy đủ tuỳ chọn và danh sách trang loại trừ.

## Cài đặt

Tải bản đóng gói ở trang [**Releases**](https://github.com/nguyenquocanhz/pip-viewer/releases/latest),
hoặc clone repo rồi dùng thẳng thư mục `mv3` / `mv2`.

**Chrome / Edge / Brave / Cốc Cốc (bản MV3)**

1. Tải `pip-viewer-mv3.zip` và giải nén (hoặc dùng thư mục `mv3` trong repo)
2. Mở `chrome://extensions`
3. Bật **Chế độ dành cho nhà phát triển**
4. **Tải tiện ích đã giải nén** → chọn thư mục vừa giải nén

**Firefox (bản MV2)**

1. Tải `pip-viewer-mv2.zip` và giải nén (hoặc dùng thư mục `mv2` trong repo)
2. Mở `about:debugging#/runtime/this-firefox`
3. **Load Temporary Add-on…** → chọn file `manifest.json`

> Add-on nạp kiểu tạm thời sẽ mất khi đóng Firefox — đó là giới hạn của add-on
> chưa ký, không phải lỗi.

## Cấu hình

Bấm biểu tượng extension → **Cấu hình đầy đủ**, hoặc mở trang tuỳ chọn của extension.

| Mục | Ý nghĩa |
|---|---|
| `hoverButton` | Hiện nút PiP khi rê chuột lên video |
| `hoverPosition` | Góc đặt nút: trên/dưới × trái/phải |
| `minVideoWidth` | Video hẹp hơn ngưỡng này thì không hiện nút |
| `autoPiPOnBlur` | Tự bật PiP khi bạn chuyển sang tab khác |
| `exitOnReturn` | Thoát PiP khi quay lại tab |
| `pauseOnExit` | Tạm dừng video khi đóng cửa sổ PiP |
| `showToast` | Hiện thông báo nhỏ ở cuối trang |
| `imageMode` | Ảnh mở bằng cửa sổ PiP thật hay cửa sổ nổi trong trang |
| `floatWidth` | Bề ngang cửa sổ nổi |
| `disabledSites` | Các tên miền không tự hiện nút và không tự bật PiP |

Cài đặt lưu trong `chrome.storage.sync` và áp dụng ngay cho các tab đang mở.

## ✦ PiP Viewer Pro

Bản miễn phí trong repo này đã đủ dùng hằng ngày và **không giới hạn thời gian**.
Bản Pro là bản dựng riêng, thêm những tính năng tốn nhiều công bảo trì hơn:

| Tính năng | Miễn phí | Pro |
|---|:--:|:--:|
| PiP cho video, ảnh, canvas | ✓ | ✓ |
| Nút hover, phím tắt, menu chuột phải | ✓ | ✓ |
| Trang loại trừ | ✓ | ✓ |
| Điều khiển ngay trong cửa sổ PiP (tua, tốc độ, âm lượng) | — | ✓ |
| Phụ đề hiển thị ngay trong cửa sổ PiP | — | ✓ |
| Chụp khung hình & ghi clip đoạn đang xem | — | ✓ |
| Quy tắc riêng cho từng trang web | — | ✓ |
| Chỉnh độ sáng, tương phản, xoay, lật gương | — | ✓ |
| Khuếch đại âm lượng tới 300% | — | ✓ |
| Lặp đoạn A–B để học ngoại ngữ, tập nhạc | — | ✓ |
| Nạp phụ đề .srt từ máy bằng kéo thả, dịch giờ phụ đề | — | ✓ |
| Nhớ tốc độ phát theo từng trang | — | ✓ |
| Phím tắt ngay trong cửa sổ PiP | — | ✓ |

Cửa sổ PiP có điều khiển dựa trên Document Picture-in-Picture, cần Chrome 116 trở lên;
trình duyệt cũ hơn sẽ dùng cửa sổ nổi trong trang với cùng bộ điều khiển.

Trạng thái: **đang thử nghiệm nội bộ**. Mở [issue](https://github.com/nguyenquocanhz/pip-viewer/issues)
để đăng ký nhận thông báo khi mở bán, hoặc để đề xuất tính năng bạn muốn có trong bản Pro.

## ❤ Ủng hộ tác giả

Dự án làm ngoài giờ và cho không. Nếu nó tiết kiệm thời gian cho bạn:

- ⭐ **Star repo** — cách ủng hộ dễ nhất và giúp người khác tìm thấy dự án
- 💖 [**GitHub Sponsors**](https://github.com/sponsors/nguyenquocanhz)
- 🐛 Báo lỗi, góp ý, gửi pull request

> Người bảo trì: sửa `PIP_LINKS` trong [`mv3/defaults.js`](mv3/defaults.js) để thêm
> MoMo / Ko-fi / PayPal — nút nào có link thì hiện, để trống thì tự ẩn.
> Nhớ bật GitHub Sponsors và cập nhật [`.github/FUNDING.yml`](.github/FUNDING.yml).

## Phát triển

```bash
npm run icons   # sinh lại bộ icon PNG
npm run sync    # chép mã dùng chung từ mv3/ sang mv2/
npm run check   # kiểm tra manifest, đường dẫn file, cú pháp JS, đồng bộ hai bản
npm run build   # chạy cả ba bước trên
npm run pack    # đóng gói dist/pip-viewer-mv3.zip và -mv2.zip
```

**Chỉ sửa trong `mv3/`** rồi chạy `npm run sync` — `mv2/` là bản chép, riêng
`mv2/manifest.json` được giữ độc lập.

### Thử nhanh không cần cài

```bash
node tools/serve.mjs
```

- `http://localhost:5178/` — trang thử với 2 video, 1 ảnh, 1 canvas và các nút
  gọi thẳng những thông điệp mà background gửi cho content script.
- `http://localhost:5178/mv3/popup.html?stub=1` — xem thử popup.
- `http://localhost:5178/mv3/dashboard.html?stub=1` — xem thử trang cấu hình.

Tham số `?stub=1` chèn `test/ext-stub.js` để giả lập API extension.

## Cấu trúc

```
mv3/                 bản Manifest V3 (nguồn chính)
  manifest.json
  defaults.js        cấu hình mặc định dùng chung
  content.js         toàn bộ logic PiP + giao diện trong trang (shadow DOM)
  background.js      menu chuột phải, phím tắt, cầu nối popup ↔ content
  popup.html/css/js  bảng điều khiển nhanh
  dashboard.html/... trang cấu hình đầy đủ
  icons/
mv2/                 bản Manifest V2 (chép từ mv3, khác manifest.json)
test/                trang thử + API extension giả lập
tools/               sinh icon, đồng bộ, kiểm tra, đóng gói, máy chủ tĩnh
```

## Ghi chú kỹ thuật

- `background.js` dùng chung cho service worker (MV3) và background page (MV2):
  nó tự dò `chrome.scripting` (MV3) hay `chrome.tabs.executeScript` (MV2), và
  `chrome.action` hay `chrome.browserAction`.
- Content script tự tiêm lại khi cần, nên extension dùng được ngay trên các tab
  đã mở từ trước lúc cài.
- Giao diện trong trang nằm trong shadow DOM khép kín nên không bị CSS của trang
  web ảnh hưởng và không ảnh hưởng ngược lại.
- Firefox chưa hỗ trợ `requestPictureInPicture()` từ JavaScript, vì vậy bản MV2
  chạy nhánh cửa sổ nổi trong trang.
