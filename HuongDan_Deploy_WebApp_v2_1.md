# 🚀 HƯỚNG DẪN DEPLOY v2.1 — BOOTSTRAP + WEB APP DASHBOARD

> Bản v2.1 thay thế hoàn toàn `AppScript_v2.gs`. Bonus: tự tạo tab + có URL chiếu lên màn hình giao ban.

---

## ✅ PHẦN 1 — Cài Apps Script (1 lần, ~3 phút)

1. Mở Google Sheet `Giao_ban_Phong_VTTBYT_2025`.
2. **Tiện ích mở rộng → Apps Script**.
3. **Xóa toàn bộ code cũ** trong file `Code.gs` (kể cả của v2 cũ).
4. Mở `AppScript_v2_1.gs` (file kèm trong folder `Giao ban`), copy hết → dán vào.
5. Bấm **Lưu (Ctrl+S)**.
6. Reload lại tab Sheet → trên menu sẽ xuất hiện **📊 Giao ban**.

---

## ✅ PHẦN 2 — Bootstrap (chạy 1 lần duy nhất)

Mục đích: tự tạo 6 tab `dm_co_so`, `dm_canbo`, `dm_khoa`, `cfg_threshold`, `5A. Tổ kho - Tồn`, `5B. Tổ kho - Đề xuất` — không cần import xlsx thủ công nữa.

1. Trên menu Sheet: **📊 Giao ban → 🚀 Bootstrap (tạo tab lần đầu)**.
2. Lần đầu sẽ hỏi quyền → **Cho phép** (chọn tài khoản `ducphamhn01@gmail.com` → Advanced → Go to project → Allow).
3. Đợi ~5 giây → toast hiện *"Đã bootstrap đầy đủ tab + dữ liệu mẫu."*
4. Kiểm tra: xuất hiện đầy đủ 6 tab ở dưới, có sẵn data validation, conditional formatting, và công thức mẫu ở 5A/5B.

> ⚠️ Chỉ chạy `bootstrap()` **1 lần**. Nếu chạy lại, các tab có sẵn sẽ KHÔNG bị ghi đè (function check `getSheetByName` rồi tạo mới chỉ khi chưa có).

---

## ✅ PHẦN 3 — Cài Trigger định kỳ (1 lần)

1. **📊 Giao ban → ⚙️ Cài đặt Triggers (1 lần)**.
2. Cấp quyền → xong sẽ có 3 trigger:
   - `runAggregator()` — chạy mỗi 15 phút (cập nhật tab Dashboard).
   - `sendMorningBrief()` — chạy 7:00–8:00 sáng mỗi ngày (gửi email tóm tắt).
   - `flagHotIssues()` — chạy 4 lần/ngày (8h, 11h, 14h, 17h).

---

## ✅ PHẦN 4 — Deploy Web App (chiếu màn hình giao ban)

Đây là **bước quan trọng nhất** cho việc giao ban.

### 4.1 — Deploy lần đầu

1. Trong cửa sổ Apps Script: bấm nút **Deploy** (góc trên phải) → **New deployment**.
2. Bấm icon ⚙️ bên trái → chọn **Web app**.
3. Điền:
   - **Description**: `Dashboard giao ban v2.1`
   - **Execute as**: `Me (ducphamhn01@gmail.com)`
   - **Who has access**: 
     - Chọn **Anyone with the link** nếu muốn chiếu trên TV phòng họp/máy chung.
     - Hoặc **Anyone within [tên tổ chức]** nếu muốn giới hạn nội bộ.
4. Bấm **Deploy** → cấp quyền → copy **Web app URL** (kết thúc bằng `/exec`).

### 4.2 — Lấy URL bất cứ lúc nào

- Trên menu Sheet: **📊 Giao ban → 🌐 Lấy URL Web App** → hiện popup có URL → bấm copy.

### 4.3 — Cách dùng khi giao ban

1. Mở URL trên Chrome của máy tính phòng họp.
2. Bấm **F11** để vào fullscreen.
3. Dashboard sẽ tự refresh mỗi 60 giây — không cần thao tác.
4. Sau giao ban: bấm **F11** lần nữa để thoát.

---

## 🎨 Dashboard có gì?

Layout 4 ô lớn (CSS Grid):

| 🔧 Kỹ thuật | 📁 Hồ sơ |
|:---:|:---:|
| 🧪 Vật tư | 📦 Kho |

Mỗi ô:
- Số tổng / số đang xử lý / số cảnh báo
- Border đổi màu: 🟥 đỏ (≥ ngưỡng `WARNING_*`) / 🟨 vàng / 🟩 xanh

Phía dưới: **TOP điểm nóng** — danh sách 8 vấn đề ưu tiên nhất từ tab `Dashboard`.

Header: đồng hồ realtime + chấm xanh nháy "LIVE" + thời điểm cập nhật cuối.

Nền tối #0F1B2D — phù hợp chiếu lên màn hình lớn, không lóa, dễ nhìn từ xa.

---

## 🔁 Khi cần cập nhật code (sau này có v2.2…)

1. Thay code trong Apps Script.
2. **Deploy → Manage deployments → bấm bút chì ✏️** → **Version: New version** → **Deploy**.
3. URL không đổi → màn hình giao ban không cần làm lại.

---

## ❗ Troubleshooting

| Lỗi | Cách xử lý |
|---|---|
| Bấm bootstrap → "Authorization required" | Cấp quyền lần đầu là bình thường — đồng ý hết. |
| Web app báo lỗi #ERROR ở tab Dashboard | Chạy `runAggregator()` (📊 Giao ban → 🔄 Cập nhật Dashboard ngay). |
| URL Web App trắng tinh | Vào Apps Script → bấm Run hàm `doGet` để cấp quyền lần đầu. |
| Đổi `SHEET_ID` sang sheet khác | Sửa hằng số `SHEET_ID` đầu file → Save → Deploy New version. |
| Dashboard không cập nhật | URL phải kết thúc bằng `/exec` (không phải `/dev`). |

---

## 📞 Cần hỗ trợ thêm

- File code: `AppScript_v2_1.gs` (44 KB, ~877 dòng)
- File template Excel (đã rất hạn chế còn dùng): `BaoCaoGiaoBan_v2.xlsx`
- File hướng dẫn tổng: `HuongDan_ThucThi.docx`

Chúc giao ban suôn sẻ! 🎯
