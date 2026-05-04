# Hướng dẫn Deploy Web App — Bản v2.10 (Dự báo Bảo trì & Báo cáo Chi tiết)

> **Lưu ý:** Bản v2.10 mang đến bước đột phá trong việc quản lý thiết bị: Chuyển từ "Sửa khi hỏng" sang "Dự báo để bảo trì". Đồng thời kết nối chặt chẽ giữa nhóm Kỹ thuật và nhóm Hồ sơ để quản lý các gói thầu bảo trì.

---

## 1. Các bước cập nhật Code & Cấu trúc Sheet

1.  Mở file **`AppScript_v2_10.gs`** và copy toàn bộ code.
2.  Dán vào Google Apps Script dự án của bạn và nhấn **Save**.
3.  **Quan trọng:** Sau khi Save code, trong giao diện Google Sheet, bạn hãy nhấn nút **🔄 Refresh** (hoặc chạy hàm `bootstrapLinks` trong script editor). 
    - Hệ thống sẽ tự động thêm 5 cột mới vào cuối tab **"1. Kỹ thuật"**: `Ngày hết bảo hành`, `Bảo trì gần nhất`, `Chu kỳ (tháng)`, `Bảo trì tiếp theo`, `Liên kết Gói bảo trì`.

---

## 2. Các bước Deploy (Giữ nguyên URL)

1.  Nhấn nút **Deploy** -> Chọn **Manage deployments**.
2.  Nhấn biểu tượng ✏️ (Chỉnh sửa) tại Web App đang dùng.
3.  Tại mục **Version**, chọn **New version**.
4.  Nhấn nút **Deploy**.

---

## 3. Cách sử dụng tính năng "Dự báo Bảo trì"

1.  **Nhập liệu:** Tại tab Kỹ thuật, hãy điền ngày bảo trì gần nhất và chu kỳ (ví dụ: 6). 
2.  **Liên kết Hồ sơ:** Tại cột `Liên kết Gói bảo trì`, hãy điền Mã Hồ sơ (ví dụ: `HS045`) của gói thầu bảo trì tương ứng.
3.  **Theo dõi:** 
    - Trên Dashboard, Tab Báo cáo sẽ hiện cảnh báo nếu máy đến hạn bảo trì mà chưa có gói thầu (hiện chữ ĐỎ).
    - Nếu đã có gói thầu và đang thực hiện, hệ thống sẽ hiện chữ XANH (`⏳ Đang làm HS bảo trì`).

---

## 4. Các điểm mới trong Báo cáo v2.10

-   **Báo cáo Tuần/Tháng:** Không chỉ hiện biểu đồ, hệ thống giờ đây tự động liệt kê bảng chi tiết các máy hỏng nặng, hồ sơ vướng mắc và các thiết bị sắp đến hạn bảo dưỡng.
-   **Email Giao ban:** Tự động đính kèm mục "DỰ BÁO BẢO TRÌ/BẢO HÀNH" ngay đầu email để lãnh đạo nắm bắt được các nguy cơ thiết bị xuống cấp.
-   **Branding:** Logo hiển thị `v2.10 · Maintenance & Integration`.

---
*Cập nhật ngày 03/05/2026 bởi Antigravity AI.*
