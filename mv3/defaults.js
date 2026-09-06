/**
 * Cấu hình mặc định — dùng chung cho content script, popup và dashboard.
 * (Content script và popup/dashboard nạp file này trước file chính.)
 */
var PIP_DEFAULTS = {
  /* Nút PiP nổi trên video */
  hoverButton: true,
  hoverPosition: 'tr', // tr | tl | br | bl
  minVideoWidth: 200, // video hẹp hơn ngưỡng này sẽ không hiện nút

  /* Hành vi tự động */
  autoPiPOnBlur: false, // tự bật PiP khi chuyển sang tab khác
  exitOnReturn: true, // thoát PiP khi quay lại tab
  pauseOnExit: false, // tạm dừng video khi đóng cửa sổ PiP

  /* Hiển thị */
  showToast: true, // hiện thông báo nhỏ ở cuối trang
  imageMode: 'auto', // auto = PiP thật cho ảnh | float = cửa sổ nổi trong trang
  floatWidth: 480, // bề ngang cửa sổ nổi (px)

  /* Trang bị tắt (danh sách hostname) */
  disabledSites: [],
};

/**
 * Liên kết dự án. Để chuỗi rỗng thì nút tương ứng tự ẩn — không tạo link chết.
 * Sửa ở đây là đổi cho cả popup lẫn dashboard.
 */
var PIP_LINKS = {
  repo: 'https://github.com/nguyenquocanhz/pip-viewer',
  issues: 'https://github.com/nguyenquocanhz/pip-viewer/issues',
  sponsor: 'https://github.com/sponsors/nguyenquocanhz',
  pro: 'https://github.com/nguyenquocanhz/pip-viewer#-pip-viewer-pro',
  // TODO: điền kênh của bạn rồi nút sẽ hiện ra
  kofi: '',
  momo: '',
  paypal: '',
};

if (typeof window !== 'undefined') {
  window.PIP_DEFAULTS = PIP_DEFAULTS;
  window.PIP_LINKS = PIP_LINKS;
}
