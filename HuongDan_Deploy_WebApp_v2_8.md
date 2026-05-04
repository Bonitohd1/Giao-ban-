# Hướng dẫn Deploy Web App — Bản v2.8 (Tối ưu hiệu năng & Chi tiết 360°)

> **Lưu ý:** Bản v2.8 tập trung vào việc triệt tiêu lỗi treo dashboard khi dữ liệu lớn bằng hệ thống Index O(N) và bổ sung thông tin CB phụ trách/Tiến độ vào modal chi tiết.

---

## 1. Các bước cập nhật Code

1.  Mở file **`AppScript_v2_8.gs`** trong thư mục dự án trên máy tính.
2.  Copy toàn bộ nội dung code (Ctrl + A -> Ctrl + C).
3.  Truy cập vào [Google Apps Script](https://script.google.com) dự án của bạn.
4.  Chọn toàn bộ code cũ trong editor và **Xóa hết**.
5.  Dán code mới đã copy vào (Ctrl + V).
6.  Nhấn nút **Save** (biểu tượng đĩa mềm).

---

## 2. Các bước Deploy (Quan trọng để không đổi URL)

1.  Nhấn nút **Deploy** (Triển khai) -> Chọn **Manage deployments** (Quản lý các bản triển khai).
2.  Tìm bản triển khai Web App đang hoạt động, nhấn biểu tượng **Chỉnh sửa** (hình cây bút ✏️).
3.  Tại mục **Version** (Phiên bản), chọn **New version** (Phiên bản mới).
4.  Nhấn nút **Deploy** (Triển khai).
5.  **Giữ nguyên URL Web App cũ** (không cần đổi URL trên TV hay điện thoại).

---

## 3. Các điểm mới cần kiểm tra (Verify)

Sau khi nhấn F5 (Refresh) Dashboard, hãy kiểm tra các mục sau:

1.  **Tốc độ:** Chuyển đổi giữa các tab (Tổng quan, Kỹ thuật, Hồ sơ, VTTH) xem có còn hiện tượng "xoay" lâu không. Tốc độ hiện tại sẽ gần như tức thì nhờ Cache v31.
2.  **Chi tiết 360°:** Click vào một Mã vật tư (ví dụ: `VT043`) hoặc một Mã hồ sơ. Kiểm tra xem trong bảng danh sách liên kết đã hiện thêm cột **CB phụ trách** và **Tiến độ (%)** chưa.
3.  **Vướng mắc:** Kiểm tra xem các dòng có vướng mắc có hiện nội dung in nghiêng màu đỏ trực tiếp trong bảng liên kết không.
4.  **Dự đoán cung ứng:** Tại tab Kho, kiểm tra bảng "Dự đoán cung ứng" xem các gợi ý (Recommendation) có còn gây treo trình duyệt không.
5.  **Dữ liệu rác:** Nếu trước đây có mã nào bị báo "Không tìm thấy" do thừa dấu cách trong Sheet, hãy kiểm tra lại xem giờ đã xem được chưa.

---

## 4. Troubleshooting (Xử lý sự cố)

-   **Nếu Dashboard vẫn xoay:** Hãy nhấn nút **Refresh (vòng xoáy 🔄)** ở header của Dashboard để buộc hệ thống xóa cache cũ và nạp lại Index mới (mất khoảng 3-5 giây).
-   **Nếu cột bị lệch:** Hãy kiểm tra lại tên tiêu đề trong Sheet xem có khớp với các từ khóa: `"Mã VTTH"`, `"Mã VT"`, `"Loại nhóm"`, `"CB phụ trách"`.

---
*Cập nhật ngày 03/05/2026 bởi Antigravity AI.*
