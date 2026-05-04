# HƯỚNG DẪN DEPLOY v2.7 — KPI redesign & Multi-cơ sở khoa

> Bản v2.7 tập trung vào **giao diện chuyên nghiệp** kiểu executive dashboard. Sếp nhìn 1 lần là nắm được, click drill-down khi cần chi tiết.

---

## 1. 4 thay đổi chính

### 1.1 Khoa ở nhiều cơ sở (composite key)

Trước đây "GMHS", "TT CĐHA", "NS-TDCN" tồn tại ở cả 3 cơ sở (CS1 Quán Sứ, CS2 Tam Hiệp, CS3 Tân Triều) bị **gộp chung 1 dòng** trên chart "Khoa nóng nhất" → mất nhìn đâu là điểm nóng cụ thể.

v2.7: composite key = **Khoa · Cơ sở** (ví dụ: `"GMHS · CS3"`, `"GMHS · CS1"`). Bar chart top khoa giờ tách riêng từng cơ sở. Click 1 bar → modal khoa lọc đúng theo cả khoa lẫn cơ sở.

### 1.2 KPI cards mới — "X / Y" + progress bar

4 card Tổng quan đổi format:
- **Big number**: `19 / 46` (đã hoàn thành / tổng) thay vì chỉ `46`.
- **Progress bar** màu (đỏ <30%, vàng 30-70%, xanh >70%).
- **Chips** cảnh báo phía dưới: 🔴 CAO, ⏰ trễ, 🚧 vướng, 🛠 đang sửa, ♻ đề xuất TL.
- **Hover** → card nổi lên + hiện chữ "↗ Xem chi tiết".
- **Click cả card** → switch sang tab tương ứng (KT/HS/VT/Kho).

Card Kho dùng "X/Y an toàn" (mã XANH / tổng mặt hàng) thay vì done/total.

### 1.3 Filter theo CB phụ trách (tab Kỹ thuật)

Thêm dropdown "Tất cả CB" (unique từ cột CB phụ trách + CB Hồ sơ phối hợp, sort A-Z theo tiếng Việt). Search box giờ tìm cả qua CB và Bước thực hiện.

### 1.4 Tab Kỹ thuật redesign

Layout mới:
- **Summary strip** trên cùng: 4 chips clickable (`🛠 đang sửa`, `⏰ trễ deadline`, `🔴 CAO`, `♻ đề xuất TL`) + nút `↻ Tất cả` reset.
- **Filter row** gộp 1 hàng duy nhất: search + 5 dropdown (Cơ sở, Khoa, **CB**, Tình trạng, Cấp độ) + 2 toggle (Ẩn TL / Ẩn HT) + counter.
- **Bảng mới**: cột "Cấp độ" + "HT" được pin sang trái sau Tên máy. Sort priority: CAO → trễ → đang xử lý → đã HT.
- **Row coloring**:
  - **CAO + trễ** = nền đỏ nhạt (critical)
  - **CAO** = viền trái đỏ
  - **Trễ** = viền trái vàng
  - **Đã HT** = mờ 55%
- Chip click → auto set filter tương ứng + highlight chip active.

---

## 2. Các bước deploy

1. Mở Sheet → Extensions → Apps Script.
2. Copy toàn bộ `AppScript_v2_7.gs` → dán đè vào Code.gs → Ctrl+S.
3. Deploy → Manage deployments → ✏️ → New version → Description: `v2.7 — KPI redesign + multi-cơ sở`.
4. URL Web App giữ nguyên.

> **Triggers**: không cần chạy lại `setupTriggers()`, các trigger từ v2.6 (warmCache, sendMorningBrief, flagHotIssues) vẫn hoạt động.

---

## 3. Verify (5 chỗ kiểm tra)

1. **Tổng quan — 4 KPI cards mới**: thấy `X / Y` + progress bar màu + chips dưới. Hover card thấy "↗ Xem chi tiết". Click 1 card → switch sang tab tương ứng.
2. **Bar chart "Khoa × Cơ sở nóng nhất"**: nhãn dạng `GMHS · CS3` (khoa + cơ sở), không còn gộp. Click 1 bar → modal khoa lọc đúng cơ sở.
3. **Tab Kỹ thuật — summary strip**: 4 chip ở đầu, click chip "trễ" → bảng chỉ còn rows trễ deadline. Click "↻ Tất cả" → reset.
4. **Tab Kỹ thuật — filter CB**: dropdown "Tất cả CB" có danh sách CB phụ trách. Chọn 1 CB → bảng lọc chỉ máy của CB đó.
5. **Tab Kỹ thuật — row coloring**: máy CAO + trễ có nền đỏ nhạt; CAO chưa trễ có viền trái đỏ; trễ có viền trái vàng.

---

## 4. Rollback

Nếu v2.7 có vấn đề:
1. Copy nội dung `AppScript_v2_6.gs` → dán đè vào Apps Script.
2. Deploy New version.
3. Tất cả version cũ giữ trong repo (`v2.6`, `v2.5`, `v2.4`, `v2.3`...).

---

## 5. Lưu ý cho phiên bản tiếp theo

- Tab **Hồ sơ** và **VTTH** chưa apply pattern KPI cards/summary chips — sẽ làm ở v2.8 nếu user thấy v2.7 ổn.
- Có thể thêm sparkline trend 7 ngày qua trong KPI cards (cần data lịch sử — log snapshot vào tab dm_*).
- Donut chart "Phân bổ cấp độ" (CAO/TB/THẤP) cho Tổng quan — cân nhắc nếu chật.
