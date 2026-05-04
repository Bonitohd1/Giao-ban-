# HƯỚNG DẪN DEPLOY v2.5 — Liên kết Kho ↔ VT ↔ HS

> Bản v2.5 chỉ thay file code Apps Script. URL Web App giữ nguyên — TV phòng họp **không cần làm gì**.

---

## 1. Có gì mới ở v2.5

So với v2.4, v2.5 hiện thực hoá đầy đủ chuỗi liên kết **Kỹ thuật → Hồ sơ → Vật tư → Kho** thành một hệ thống đồng bộ:

| Khu vực | Trước v2.5 | Sau v2.5 |
|---|---|---|
| Modal HS (gói thầu) | Vật tư trong gói thầu không hiển thị tồn/queue kho | Mỗi VT trong gói có kèm thẻ Kho 5A + queue 5B |
| Tab VTTH | Mỗi dòng VT chỉ có tiến độ/vướng mắc | Có thêm cột **📦 Kho** hiển thị mini badge tồn / DOH / số khoa chờ |
| Tab Kho 5A | Bảng tồn kho phẳng, click chỉ mở Sheet | **Click row 1 lần → expand inline 3 cột**: VT liên quan, gói thầu mua sắm, queue đề xuất 5B (top 8). Shift+click vẫn mở Sheet. |
| Tab Liên kết | Chỉ chuỗi KT → VT → HS | Có thêm section **📦 Mạch Kho → VT → Mua sắm** — kho ĐỎ/VÀNG truy ngược lên vật tư & gói thầu |
| Search global | Không tìm trong kho | Tìm thêm trong Kho 5A theo Mã VTTH / Tên / Khoa YC nhiều nhất |
| Backend `getKho()` | Trả về 2 mảng phẳng | Mỗi mặt hàng 5A đã enrich sẵn `vt[]`, `hs[]`, `queue[]`, `queueOpen` |
| Backend `getLinkedChains()` | Chỉ severity từ VT có kho lỗi | Trả thêm `khoChains[]` riêng biệt |

---

## 2. Quy tắc match Kho ↔ VT (KEY)

Để chuỗi liên kết hiển thị đúng, dữ liệu phải đồng bộ:

1. **Ưu tiên Mã VTTH:** trùng cột "Mã VTTH" giữa tab `4. VTHC`, `5A. Tổ kho - Tồn`, `5B. Tổ kho - Đề xuất`.
2. **Fallback Tên VTTH:** nếu mã thiếu, code so khớp tên (normalize bỏ dấu, tokenize > 3 ký tự).
3. **Bộc lộ "không khớp 5A":** nếu một VT không tìm được mặt hàng kho nào, modal sẽ hiện badge xám "không khớp 5A" để anh đồng bộ tên/mã thủ công.

→ Khuyến nghị: thêm cột "Mã VTTH" vào cả 3 tab nếu chưa có. Đây là chìa khoá để chuỗi vận hành chạy mượt.

---

## 3. Các bước deploy

### Bước 1: Mở Apps Script
1. Trong Sheet "Giao_ban_Phong_VTTBYT_2025" → Menu **Extensions → Apps Script**.
2. Cửa sổ Apps Script mở ra với code v2.4 cũ.

### Bước 2: Dán code mới
1. Mở file `AppScript_v2_5.gs` trong workspace bằng VS Code / Notepad++.
2. **Ctrl+A → Ctrl+C** (chọn hết, copy).
3. Trong Apps Script: **Ctrl+A → Ctrl+V** (chọn hết file `Code.gs` rồi dán đè lên).
4. **Ctrl+S** (lưu).

### Bước 3: Deploy New Version
1. Trên Apps Script, góc phải trên → **Deploy → Manage deployments**.
2. Tìm deployment hiện tại (đang dùng v2.4) → click icon ✏️ (Edit).
3. Trong cửa sổ Edit:
   - **Version:** chọn **New version**.
   - **Description:** ghi `v2.5 — Kho-VT-HS chain integration`.
4. Click **Deploy**.
5. URL Web App **không đổi** → TV/màn hình giao ban không cần can thiệp.

### Bước 4: Verify
Mở URL Web App, kiểm 4 chỗ:

1. **Tab VTTH** — bảng có thêm cột **📦 Kho** với badge ĐỎ/VÀNG/XANH/ORANGE; nếu không khớp được kho thì hiện dấu `—`.
2. **Tab Kho** — click 1 dòng (ví dụ một mặt hàng đang ĐỎ) → row mở rộng 3 cột (VT, HS, queue 5B). Click 1 lần nữa = đóng. Shift+Click = mở Sheet 5A.
3. **Tab Liên kết** — kéo xuống dưới phần "Top chuỗi vướng mắc" → có thêm section **📦 Mạch Kho → VT → Mua sắm** liệt kê các mặt hàng kho đang cảnh báo.
4. **Modal Hồ sơ** — click 1 gói thầu (HS) → cột "Vật tư trong gói" → mỗi VT đính kèm thẻ Kho 5A + top 5 queue 5B.

---

## 4. Nếu phát hiện không có liên kết (cột Kho hiện `—` toàn bộ)

Đó là vì Mã/Tên VTTH chưa khớp giữa các tab. Hai cách xử lý:

**Cách 1 (nhanh, không sửa Sheet):** Mở 1 modal VT bất kỳ trong Web App, xem badge "không khớp 5A". Lúc đó copy đúng Tên VTTH từ tab 5A sang tab 4.VTHC để match fuzzy hoạt động.

**Cách 2 (chuẩn):** Bổ sung cột **Mã VTTH** vào tab `4. VTHC`, `5A`, `5B` rồi điền cùng 1 mã cho cùng 1 mặt hàng. Cách này giúp `_resolveKhoForVt()` match chính xác 100%.

---

## 5. Rollback

Nếu v2.5 có vấn đề:
1. Apps Script → Open file `AppScript_v2_4.gs` (đã giữ trong repo).
2. Copy nội dung → dán đè vào Apps Script editor.
3. Deploy → Manage → New version → Deploy.

Tất cả phiên bản cũ (`v2.0`, `v2.1`, `v2.2`, `v2.3`, `v2.4`) đều giữ trong repo để rollback nhanh.

---

## 6. Triggers — không thay đổi

Các trigger đã cài từ v2.2 (`runAggregator` 15 phút, `sendMorningBrief` 7-8h, `flagHotIssues` 4 lần/ngày) vẫn hoạt động bình thường trên code mới. Không cần re-install.
