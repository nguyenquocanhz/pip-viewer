# Nhật ký thay đổi — PiP Viewer

Ghi chú trong mỗi mục được `npm run release` dùng làm nội dung release.

## 1.1.0

**Extension giờ có tiếng Anh.** Chrome tự chọn ngôn ngữ theo cài đặt của trình
duyệt: máy đặt tiếng Việt thì hiện tiếng Việt, máy đặt tiếng Anh thì hiện tiếng
Anh. Không có nút đổi ngôn ngữ riêng vì đây là cách Chrome quy định.

Dịch toàn bộ 131 chuỗi, không sót chỗ nào: tên và mô tả extension, popup, trang
cấu hình, menu chuột phải, mô tả phím tắt, và cả các thông báo nhỏ hiện trên
trang khi mở PiP hay khi có lỗi.

### Sửa lỗi

Extension nạp vào tab đã mở từ trước chỉ được tiêm một trong ba file cần thiết.
Trước đây chưa lộ ra vì hai file kia chỉ chứa cấu hình mặc định, nhưng với bản
dịch thì tab đó sẽ hiện tên khoá thô thay vì chữ. Nay tiêm đủ và đúng thứ tự.

## 1.0.1

Bản bảo trì. Không thêm tính năng mới, nhưng **nên tải lại** vì gói của bản 1.0.0
bị lỗi đóng gói.

### Sửa lỗi đóng gói

Gói `.zip` của bản 1.0.0 được tạo bằng `Compress-Archive` của PowerShell, và công
cụ này ghi dấu phân cách đường dẫn là `\` thay vì `/` — sai đặc tả ZIP. Một số
công cụ giải nén sẽ bung sai cấu trúc thư mục, khiến extension không nạp được.
Nay dự án tự dựng file ZIP đúng chuẩn.

Nếu bản 1.0.0 của bạn nạp bình thường thì không có gì phải lo, nhưng bản này an
toàn hơn cho người khác.

### Mở điểm mở rộng cho mô-đun ngoài

`window.__pipViewer__` đổi từ một cờ đúng/sai thành đối tượng công khai phần lõi
(cấu hình, giao diện, các hàm PiP) kèm hai móc nối:

- `handlers[]` — xử lý thông điệp riêng trước bộ xử lý mặc định
- `openOverride` — thay cách mở cửa sổ PiP cho video

Trong background, `globalThis.PIP_COMMANDS` và `PIP_MENUS` cho phép thêm phím tắt
và mục menu chuột phải mà không phải sửa `background.js`.

Bản free chạy y hệt như trước khi không có mô-đun nào đăng ký. Phần này dành cho
bản Pro và cho ai muốn tự viết thêm mô-đun trên nền dự án.

### Sửa nội dung

Bảng so sánh với bản Pro được viết lại cho đúng thực tế. Dòng "ghim nhiều cửa sổ
PiP cùng lúc" bị gỡ: trình duyệt chỉ cho mở một cửa sổ PiP thật tại một thời
điểm, nên đó là điều không hứa được.

## 1.0.0

Bản phát hành đầu tiên. Mở video, ảnh hoặc canvas bất kỳ vào cửa sổ ảnh-trong-ảnh
nổi trên mọi ứng dụng. Có nút PiP khi rê chuột, menu chuột phải, phím tắt, chế độ
chọn phần tử, trang cấu hình đầy đủ và danh sách trang loại trừ. Hai bản Manifest
V3 (Chrome/Edge) và V2 (Firefox) dùng chung một mã nguồn.
