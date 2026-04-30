# Hướng dẫn Deploy Web App v2.3 — Liên kết chéo KT ↔ VT ↔ HS

> Mục tiêu v2.3: nhìn thấy **móc nối** giữa các tổ.
> Máy hỏng → vật tư đang thiếu → gói thầu đang vướng. Một cú click ra đủ chuỗi.

---

## TL;DR (5 bước)

1. Mở Google Sheet → menu **Tiện ích mở rộng → Apps Script**.
2. **Xóa toàn bộ** code cũ (Ctrl+A → Delete) → **Dán** nội dung file `AppScript_v2_3.gs`.
3. Bấm 💾 (Save).
4. Quay lại Sheet → **F5 reload** → menu **Giao ban** → **🔗 Bootstrap Links v2.3 (thêm cột liên kết)**. Bấm OK.
5. **Manage deployments** → bút ✏️ → **Version: New version** → **Deploy**. URL Web App **không đổi**.

> Sau bước 4, Sheet có thêm các cột "Mã KT", "Mã VT", "Liên kết HS", "Liên kết VT", "Liên kết KT" + tab `MAP_LIENKET` (junction table).
> Sau bước 5, Web App đã có nav mới **🔗 Liên kết** + ô search trên header + click drill-down 360°.

---

## v2.3 thêm gì

### 1. Cột liên kết trong 4 tab dữ liệu (bootstrap tự thêm, idempotent)

| Tab                              | Cột mới                        | Auto-ID         |
|----------------------------------|--------------------------------|-----------------|
| Nhóm kỹ thuật                    | Mã KT, Liên kết HS, Liên kết VT | KT001, KT002... |
| Nhóm Hồ sơ                       | Liên kết KT, Liên kết VT       | (mã HS có sẵn)  |
| Nhóm vật tư tiêu hao- hóa chất   | Mã VT, Liên kết HS, Liên kết KT | VT001, VT002... |

Cách điền liên kết: gõ một hoặc nhiều mã, ngăn cách dấu phẩy.
Ví dụ ở dòng máy CT hỏng: cột **Liên kết VT** = `VT003, VT005` (2 vật tư đang thiếu cho máy này).

### 2. Tab `MAP_LIENKET` (junction table tổng)

Mở tab này để vẽ chuỗi liên kết tập trung. Mỗi dòng:
```
KT_ID  |  HS_ID  |  VT_ID  |  Loại quan hệ  |  Ghi chú  |  Ngày tạo
KT001  |  HS012  |  VT003  |  Máy hỏng vì thiếu VT chưa thầu  |  ...  |  2026-04-30
```
Bootstrap đã tạo sẵn 3 dòng mẫu. Sửa/xóa thoải mái.

### 3. Web App thêm nav **🔗 Liên kết**

Hiển thị **TOP 20 chuỗi vướng mắc**, sắp xếp theo độ nghiêm trọng:
```
[KT001] Máy CT 16 lát hỏng compressor (Khoa CĐHA)
   ├─ vật tư cần: VT003 (Khí lạnh R134a) — đang thiếu, chưa duyệt thầu
   └─ hồ sơ: HS012 (Gói thầu Vật tư Q2/2026) — vướng phê duyệt từ 30 ngày
```
Mỗi mã là **link click** → mở **Modal 360°** chi tiết entity đó.

### 4. Modal 360° (KEY FEATURE)

Click bất cứ mã nào (KT, VT, HS) → mở popup 3 cột:
- **Cột 1 (KT)**: máy nào đang gặp sự cố
- **Cột 2 (VT)**: vật tư liên quan + còn đáp ứng được bao nhiêu ngày
- **Cột 3 (HS)**: hồ sơ thầu đang vướng

Ngoài ra có nút "Mở dòng trong Sheet" deep-link tới đúng range để sửa nhanh.

### 5. Search bar global trên header

Gõ tên máy / khoa / mã VT — typeahead dropdown trả về top 8 kết quả từ cả 4 tab.
Enter hoặc click → mở modal 360°.

### 6. Smart fuzzy matching (cho dòng chưa điền liên kết)

Nếu một dòng máy trong "Nhóm kỹ thuật" **chưa được link** trong cột Liên kết VT/HS, hệ thống tự dò tìm fuzzy theo:
- Từ khóa trong tên máy ↔ tên vật tư (VD: "máy CT" ↔ "vật tư CT")
- Cùng khoa

→ Modal vẫn gợi ý top 5 VT + top 5 HS có khả năng liên quan.
→ Khi anh confirm, điền vào cột Liên kết → lần sau không cần fuzzy nữa.

---

## Các bước chi tiết

### Bước 1: Backup (nếu chưa)

Mở Sheet → File → Make a copy → đặt tên `Giao ban BACKUP 2026-04-30 (truoc v2.3)`.

### Bước 2: Paste code v2.3

1. Sheet → **Tiện ích mở rộng → Apps Script** (mở tab mới).
2. Tab `Code.gs` (hoặc tên gì đó tương tự): **Ctrl+A → Delete**.
3. Mở file `AppScript_v2_3.gs` ở Desktop → **Ctrl+A → Ctrl+C**.
4. Quay lại Apps Script → **Ctrl+V**.
5. **Ctrl+S** (Save). Apps Script sẽ confirm "Project saved".

### Bước 3: Bootstrap links

1. Quay lại Google Sheet (tab gốc).
2. Bấm **F5** (reload trang) — đợi menu "Giao ban" load lại.
3. Menu → **Giao ban → 🔗 Bootstrap Links v2.3 (thêm cột liên kết)**.
4. Lần đầu sẽ hỏi **Authorization** — cấp quyền (Allow).
5. Chạy lại lần 2 nếu lần 1 chỉ xin quyền.
6. Hộp thoại sẽ hiện kết quả:
   ```
   ✓ Nhóm kỹ thuật: thêm 3 cột (Mã KT, Liên kết HS, Liên kết VT) — auto-fill 47 mã
   ✓ Nhóm Hồ sơ: thêm 2 cột (Liên kết KT, Liên kết VT)
   ✓ Nhóm vật tư tiêu hao- hóa chất: thêm 3 cột (Mã VT, Liên kết HS, Liên kết KT) — auto-fill 23 mã
   ✓ MAP_LIENKET: đã tạo + 3 dòng mẫu
   ```
7. Idempotent: chạy lại lần 2/3/4 không sao, không double cột.

### Bước 4: Deploy New version (URL không đổi)

1. Apps Script → góc phải trên cùng → **Deploy → Manage deployments**.
2. Tìm deployment hiện tại (Active) → bấm icon **bút chì ✏️**.
3. Dropdown **Version: New version**.
4. Description: `v2.3 - liên kết chéo KT-VT-HS, modal 360, search`.
5. Bấm **Deploy**.
6. URL Web App giữ nguyên — refresh tab Web App là thấy giao diện mới.

### Bước 5: Điền liên kết thực tế

**Cách 1 — Thủ công (nhanh nhất cho dữ liệu hiện tại):**

Mở tab "Nhóm kỹ thuật". Mỗi máy đang hỏng vì thiếu vật tư:
- Cột **Liên kết VT**: gõ mã VT (VD: `VT003`)
- Cột **Liên kết HS**: gõ mã HS (VD: `HS012`)

Hoặc làm tập trung trong tab `MAP_LIENKET`:
```
KT_ID    HS_ID    VT_ID    Loại quan hệ                       Ghi chú
KT005    HS012    VT003    Máy hỏng vì thiếu VT chưa thầu     Máy CT khoa CĐHA
KT012    HS015             Sửa chữa đang chờ thầu             Máy siêu âm
         HS018    VT007    VT cấp bù khẩn cấp                 Hết tồn kho
```

**Cách 2 — Smart fuzzy (gợi ý từ system):**

1. Mở Web App → 🔗 Liên kết.
2. Click một KT bất kỳ → modal 360° mở.
3. Hệ thống đã suggest top 5 VT + 5 HS có vẻ liên quan (theo từ khóa + khoa).
4. Tự xác nhận đúng/sai, sau đó điền vào cột Liên kết để lần sau khỏi đoán.

---

## Test nhanh sau deploy

Mở Web App URL → bấm tab **🔗 Liên kết**:

- [ ] Thấy danh sách chuỗi (kể cả dòng mẫu từ MAP_LIENKET).
- [ ] Click vào mã KT001 / VT001 → modal 360° mở, có 3 cột.
- [ ] Trong modal, click **Mở dòng trong Sheet** → tab Sheet mở đúng dòng.
- [ ] Gõ vào ô search: tên một máy / khoa → dropdown ra kết quả → click → modal mở.
- [ ] Tab cũ (KT, HS, VT, Kho, Khoa) vẫn chạy bình thường — KHÔNG vỡ.

Nếu Liên kết tab trống: chạy lại bootstrap, hoặc kiểm tra MAP_LIENKET có dữ liệu không.

---

## Troubleshooting

**Lỗi "function bootstrapLinks is not defined"**
→ Chưa save code, hoặc save chưa xong. Apps Script → Ctrl+S, đợi "Project saved" hiện rõ.

**Modal hiện "Không tìm thấy entity"**
→ Mã đó chưa có trong tab tương ứng. Chạy lại bootstrap.

**Search không trả kết quả**
→ Reload tab Web App (Ctrl+F5). Nếu vẫn lỗi: mở console (F12) → xem có error không → screenshot gửi anh.

**Cột Liên kết bị xóa nhầm**
→ Chạy lại `bootstrapLinks()` từ menu — nó sẽ thêm lại cột mất, không động cột đã có.

**Không thấy menu "Giao ban"**
→ F5 reload Sheet. Lần đầu paste code mới phải đợi 5-10s.

---

## Cập nhật HANDOFF.md

Sau deploy thành công, mở `HANDOFF.md` mục **Lịch sử các phiên bản**, thêm:

```
- v2.3 (2026-04-30): Liên kết chéo KT↔VT↔HS — junction table MAP_LIENKET, 
  modal 360° drill-down, global search, smart fuzzy matching, top 20 chuỗi 
  vướng mắc trên nav 🔗 Liên kết.
```

Đã xong.
