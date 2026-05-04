# Hướng dẫn Deploy Web App — Bản v2.9 (Phase B: Trung tâm Báo cáo)

> **Lưu ý:** Bản v2.9 chính thức ra mắt Tab "Báo cáo" — cho phép bạn xem trước và xuất bản 5 loại báo cáo chuyên nghiệp trực tiếp từ Dashboard mà không cần vào Google Sheet.

---

## 1. Các bước cập nhật Code

1.  Mở file **`AppScript_v2_9.gs`** trong thư mục dự án trên máy tính.
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

## 3. Các tính năng mới cần kiểm tra (Verify)

Sau khi nhấn F5 (Refresh) Dashboard, hãy kiểm tra các mục sau:

1.  **Tab Báo cáo:** Kiểm tra xem trên thanh Menu đã xuất hiện nút **📊 Báo cáo** chưa. (Trên mobile, nút này nằm trong mục "Thêm ...").
2.  **Xem trước báo cáo:** Click vào Tab Báo cáo, chọn các loại báo cáo ở cột bên trái (Giao ban, Tuần, Tháng...). Kiểm tra xem nội dung có hiển thị ở khung bên phải kèm watermark "PHÒNG VT-TBYT" không.
3.  **Gửi Email:** Thử nhấn nút **📧 Gửi Email** trong tab Báo cáo. Hệ thống sẽ hỏi xác nhận và gửi đúng mẫu báo cáo bạn đang xem cho danh sách email trong tab `cfg_emails`.
4.  **In PDF:** Nhấn nút **📄 In PDF** để kiểm tra giao diện dàn trang khi in. Mọi thứ đã được tối ưu để in ra giấy A4 sạch sẽ.
5.  **Version:** Logo ở góc trái trên cùng phải hiển thị là `v2.9 · Reports & Performance`.

---

## 4. Troubleshooting (Xử lý sự cố)

-   **Nếu không thấy Tab mới:** Hãy đảm bảo bạn đã chọn "New version" khi Deploy. Nếu vẫn không thấy, hãy thử mở Web App bằng tab ẩn danh để tránh cache trình duyệt.
-   **Nếu báo cáo không có dữ liệu:** Đảm bảo các tab nguồn (Kỹ thuật, Hồ sơ, Vật tư, Kho) có dữ liệu hợp lệ.
-   **Lỗi gửi email:** Kiểm tra tab `cfg_emails` xem cột `Active` đã đánh dấu tích `✓` chưa.

---
*Cập nhật ngày 03/05/2026 bởi Antigravity AI.*
