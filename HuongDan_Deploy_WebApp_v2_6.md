# HƯỚNG DẪN DEPLOY v2.6 — Tối ưu Lazy-Load & Cache Layer

> Bản v2.6 tập trung vào **hiệu năng (Performance)** và **trải nghiệm người dùng (UX)**. Web App giờ đây load nhanh hơn 3-5 lần đối với các tab dữ liệu lớn (Kho, VTTH).

---

## 1. Có gì mới ở v2.6

| Khu vực | v2.5 | v2.6 (Tối ưu) |
|---|---|---|
| **Hiệu năng chung** | Đọc dữ liệu trực tiếp từ Sheet mỗi lần click tab | **Cache Layer (5 phút)**: Sử dụng CacheService để lưu trữ index quan hệ. Phản hồi các tab gần như tức thì. |
| **Tab Kho 5A** | Load toàn bộ chi tiết VT/HS cho từng hàng ngay từ đầu (nặng) | **Lazy-load Expand**: Chỉ tải chi tiết (VT/HS/5B) khi anh click vào nút expand (▶). Load danh sách ban đầu cực nhanh. |
| **Tab VTTH** | Bảng có cột 📦 Kho (hơi rối mắt) | **Clean View**: Bỏ cột Kho ở bảng chính. Thông tin Kho được chuyển vào Modal chi tiết (drill-down) để tinh gọn. |
| **Modal VTTH** | Chỉ hiện kho nếu khớp chính xác mã/tên | **Smart Match (Related Kho)**: Nếu không khớp 1-1, hệ thống gợi ý các mặt hàng Kho cùng loại/cùng khoa để anh đối soát. |
| **Hệ thống Cache** | Không có | **Warm Cache**: Tự động build lại index mỗi 5 phút + **Auto-Invalidate** khi anh sửa bất kỳ tab nào trên Sheet. |
| **Nút 🔄 Refresh** | Không có | **Manual refresh**: Nút ở header để force invalidate cache khi anh muốn lấy dữ liệu mới ngay (không phải đợi 5 phút). |

---

## 2. Các thay đổi quan trọng trong Code

1. **`getKho()`**: Giờ đây chỉ trả về danh sách phẳng.
2. **`getKhoDetail(idVT)`**: Endpoint mới phục vụ việc lấy chi tiết khi click expand.
3. **`_buildLinkIndex()`**: Tích hợp `CacheService` với cơ chế chunking (chia nhỏ JSON) để vượt giới hạn 100KB của Google.
4. **`onEdit(e)`**: Tự động gọi `invalidateLinkIndex()` khi anh sửa các tab KT, HS, VT, Kho, MAP_LIENKET.
5. **`warmCache()`**: Hàm mới dùng để mồi cache tự động.

---

## 3. Các bước deploy

### Bước 1: Mở Apps Script
1. Trong Sheet giao ban → Menu **Extensions → Apps Script**.

### Bước 2: Dán code v2.6
1. Copy toàn bộ nội dung file `AppScript_v2_6.gs`.
2. Dán đè vào Apps Script editor (file `Code.gs`).
3. **Lưu (Ctrl+S)**.

### Bước 3: Cập nhật Triggers (QUAN TRỌNG)
Bản v2.6 cần thêm trigger để warm cache.
1. Trong Apps Script editor, tìm hàm `setupTriggers` (dòng ~439).
2. Nhấn nút **Run** cho hàm này.
3. Hệ thống sẽ hỏi cấp quyền (nếu có) và thông báo: *"✅ Đã cài X trigger (gồm warmCache mỗi 5 phút)."*
4. Việc này giúp đảm bảo Web App luôn ở trạng thái "nóng", mở là có dữ liệu ngay.

### Bước 4: Deploy New Version
1. **Deploy → Manage deployments**.
2. Edit deployment hiện tại → **Version: New version**.
3. Description: `v2.6 — Lazy-load & Cache optimizations`.
4. Click **Deploy**.

---

## 4. Kiểm tra sau khi deploy (Verify)

1. **Tab Kho**: Click vào biểu tượng ▶ ở đầu mỗi hàng. Nếu dữ liệu hiện ra sau ~1s (có chữ *Đang tải lazy-load...*) là thành công.
2. **Tab VTTH**: Bảng phải trông gọn gàng hơn (không còn cột Kho). Click vào 1 hàng để mở Modal -> Thông tin kho phải hiện ở trong Modal.
3. **Cache Test**: Click qua lại giữa các tab KT, HS, VT. Tốc độ chuyển tab phải nhanh hơn rõ rệt so với bản v2.5.
4. **Auto-Refresh**: Thử sửa 1 tên máy ở tab `1. Kỹ thuật` trên Sheet -> Quay lại Web App click tab Kỹ thuật -> Dữ liệu mới phải hiện ra ngay (nhờ cơ chế invalidate cache khi edit).
5. **Nút Refresh thủ công**: Bấm nút **🔄 Refresh** ở góc phải header → cache invalidate ngay lập tức + reload tab hiện tại. Dùng khi anh sửa Sheet bằng người khác hoặc nghi ngờ cache cũ.

---

## 5. Rollback

Nếu v2.6 gặp lỗi lạ:
1. Copy code `AppScript_v2_5.gs` dán lại vào Apps Script.
2. Deploy New version.
3. Chạy lại `setupTriggers` để gỡ bỏ warmCache nếu cần (hoặc cứ để đó cũng không sao).

---

**Medical-AI Solution Team**
*Cập nhật: 30/04/2026*
