# 🚀 HƯỚNG DẪN DEPLOY v2.2 — DASHBOARD DRILL-DOWN 6 VIEW

> Bản v2.2 thay thế hoàn toàn `AppScript_v2_1.gs`.
> Khắc phục tất cả phản ánh của v2.1: số liệu sai, không click được, không thấy chi tiết.

---

## 🎯 v2.2 khác v2.1 thế nào

| Vấn đề v2.1 | Cách xử lý ở v2.2 |
|---|---|
| Số liệu thẻ Tổng/Đang xử lý/Cảnh báo sai | Đổi sang **đọc theo TÊN cột** (header lookup), không đoán vị trí. Dù sheet đảo cột vẫn chạy đúng. |
| TOP điểm nóng hiện "?" | Lấy đúng cột Tên + Khoa + Chi tiết tình trạng; xếp theo độ ưu tiên (CAO + trễ deadline trước). |
| Chỉ 1 màn, không click vào được | **6 view có thanh tab**: Tổng quan / Kỹ thuật / Hồ sơ / VTTH / Kho / Theo Khoa. |
| Không biết khoa nào nhiều vấn đề nhất | Tab **Theo Khoa** + biểu đồ thanh ngang ở Tổng quan, click khoa → mở chi tiết khoa đó. |
| Không thấy máy hỏng cụ thể | Tab **Kỹ thuật**: bảng đầy đủ Tên TB / Khoa / Tình trạng / Chi tiết / CB / Tiến độ / Deadline / Vướng. |
| Không thấy hồ sơ đang vướng | Tab **Hồ sơ**: Kanban theo Trạng thái + bảng vướng mắc + giá trị dự toán. |
| Không thấy vật tư sắp hết | Tab **Kho**: đỏ trước, sắp hết (DOH ↓) trên cùng + tab phụ "Đề xuất chưa cấp". |
| Không jump được vào dòng cụ thể trên Sheet | **Click bất kỳ dòng nào** → mở Sheet đúng tab, đúng dòng. |

---

## ✅ PHẦN 1 — Cập nhật code (~2 phút)

1. Mở Google Sheet `Giao_ban_Phong_VTTBYT_2025`.
2. **Tiện ích mở rộng → Apps Script**.
3. **Xóa toàn bộ code cũ** trong `Code.gs` (code của v2.1).
4. Mở file `AppScript_v2_2.gs` (trong folder `Giao ban` của bạn) → copy hết → dán vào.
5. Bấm **Lưu (Ctrl+S)**.

> Bootstrap & triggers đã setup từ v2.1 thì **không cần làm lại**. Tab dữ liệu giữ nguyên.

---

## ✅ PHẦN 2 — Deploy bản mới (URL cũ giữ nguyên)

1. Trong Apps Script: bấm **Deploy** (góc trên phải) → **Manage deployments**.
2. Bấm icon bút chì ✏️ cạnh deployment cũ ("Dashboard giao ban v2.1").
3. Ở dòng **Version** → chọn **New version**.
4. Đổi Description thành `Dashboard giao ban v2.2 — drill-down`.
5. Bấm **Deploy**. URL Web App **không đổi** → màn hình phòng họp không cần làm gì.

> Nếu Apps Script hỏi cấp lại quyền (vì có thêm hàm mới) → đồng ý hết.

---

## 🎨 6 view của v2.2

### 1. Tổng quan
- 4 thẻ lớn KT / HS / VT / Kho — màu đỏ/vàng/xanh tự động theo ngưỡng.
- Biểu đồ **TOP khoa nhiều vấn đề** (thanh ngang) → click khoa = nhảy sang Theo Khoa.
- Lưới **Điểm nóng** ưu tiên cao nhất, click 1 ô = mở Sheet đúng dòng.

### 2. Kỹ thuật
- Bảng đầy đủ: Tên thiết bị, Khoa, Tình trạng, Chi tiết, CB, Tiến độ bước, Deadline, Vướng, Ưu tiên.
- Filter nhanh: Tất cả / Chỉ CAO / Trễ Deadline / Đã thanh lý ✓.
- Click 1 hàng = nhảy thẳng vào hàng đó trên tab `1. Kỹ Thuật`.

### 3. Hồ sơ
- **Kanban** chia theo Trạng thái (Đang chuẩn bị / Đang thẩm định / Đã trình / …).
- Bảng vướng mắc (sắp xếp theo giá trị giảm dần).
- Hiển thị Tiến độ % + Deadline + Hình thức LCNT.

### 4. VTTH (Vật tư hóa chất)
- Bảng task vật tư từ tab `4. VTHC`: Loại nhóm / Khoa / CB / Trạng thái / Tiến độ.
- Sắp xếp: trễ deadline trên cùng → tiến độ thấp → CAO ưu tiên.

### 5. Kho
- **5A — Tồn:** sắp xếp ĐỎ trước, sau đó DOH (số ngày tồn) tăng dần → **mặt hàng nào sắp hết** lên đầu.
- Hiển thị: Mã / Tên / Tồn hiện tại / MIN / MAX / DOH / Khoa cần nhiều / Số khoa chờ.
- **5B — Đề xuất:** danh sách yêu cầu chưa cấp, sắp xếp theo Mức ưu tiên.

### 6. Theo Khoa
- Danh sách tất cả các khoa, hiện tổng số vấn đề mỗi khoa.
- Click 1 khoa → trang chi tiết khoa: liệt kê đầy đủ KT + HS + VT + Kho liên quan đến khoa đó.

---

## 🔑 Tính năng then chốt mới

**Click-to-Sheet:** Mỗi hàng/thẻ có icon mũi tên → bấm là mở Google Sheet đúng tab + scroll đúng hàng. Trong cuộc giao ban, anh em phản biện 1 case → click 1 phát là vào sửa được luôn.

**Header-based mapping:** Code không hardcode vị trí cột. Sau này thêm/xóa cột giữa sheet, đổi tên cột không quá khác (vd "Tình trạng" → "Trạng thái thiết bị"), code vẫn chạy được.

**Auto-refresh 60 giây** giống v2.1, nhưng chỉ refresh đúng view đang xem (đỡ tốn quota).

---

## ❗ Troubleshooting

| Lỗi | Cách xử lý |
|---|---|
| Tab nào đó hiện "Lỗi tải dữ liệu" | Mở Console (F12) → xem log → thường do tên sheet bị đổi. Code tìm theo các tên: `1. Kỹ Thuật`, `2. Hồ Sơ`, `4. VTHC`, `5A. Tổ kho - Tồn`, `5B. Tổ kho - Đề xuất`. |
| Số liệu trong card vẫn lệch so với cảm nhận | Tab Kỹ thuật → filter "Chỉ CAO" → đếm tay đối chiếu. Nếu vẫn sai báo lại, có thể tên cột trong sheet đặc biệt. |
| Click hàng không nhảy được | Bảo mật trình duyệt chặn popup → cho phép popup từ `script.google.com`. |
| Web app trắng | Vào Apps Script → Run hàm `doGet` 1 lần để cấp quyền. |

---

## 📞 Files trong folder `Giao ban`

| File | Vai trò |
|---|---|
| `AppScript_v2_2.gs` | **Code mới — dán vào Apps Script** |
| `AppScript_v2_1.gs` | Code cũ (giữ phòng cần rollback) |
| `HuongDan_Deploy_WebApp_v2_2.md` | File này |
| `BaoCaoGiaoBan_v2.xlsx` | Template Excel (ít dùng từ khi có web app) |

Chúc giao ban hôm nay khác hẳn — không còn ngồi đoán cột nào số nào nữa! 🎯
