# 📋 HANDOFF — Dự án "Giao ban Phòng VTTBYT"

> **Đọc file này TRƯỚC khi làm bất cứ thứ gì.** Đây là toàn bộ ngữ cảnh dự án — đủ để AI session mới bắt nhịp trong 5 phút mà không cần đọc lại transcript dài.

---

## 1. Người dùng & bối cảnh

| | |
|---|---|
| **Tên gọi** | Bonito (anh Bonito) |
| **Email** | ducphamhn01@gmail.com |
| **Vai trò** | Trưởng phòng Vật tư – Thiết bị Y tế (VT-TBYT), Bệnh viện K |
| **Mục tiêu** | Số hoá cuộc giao ban phòng — biết ngay mỗi sáng: thiết bị nào hỏng, hồ sơ thầu nào kẹt, vật tư nào sắp hết, khoa nào đang nóng nhất |
| **Phong cách giao tiếp** | Nói tiếng Việt, ngắn gọn, hay dùng tiếng Anh kỹ thuật. Phản ứng thẳng khi sản phẩm không đúng ý ("code đoán mò", "nhìn chả biết khoa nào…") — đừng vòng vo, sửa luôn. |
| **Workspace folder** | `C:\Users\KCCShopVn\Desktop\Giao ban` (đây là toàn bộ project) |

---

## 2. Hệ thống đang chạy ra sao

```
┌──────────────────────────────────────────┐
│  Google Sheet "Giao_ban_Phong_VTTBYT_2025"│  ← nguồn dữ liệu duy nhất
│   - Tab "1. Kỹ Thuật"        (KT)         │
│   - Tab "2. Hồ Sơ"           (HS)         │
│   - Tab "4. VTHC"            (VTTH)       │
│   - Tab "5A. Tổ kho - Tồn"   (kho 5A)     │
│   - Tab "5B. Tổ kho - Đề xuất" (kho 5B)   │
│   - Các tab dm_*, cfg_*, Dashboard        │
└──────────────────────────────────────────┘
                  ▲
                  │ đọc/ghi
                  │
┌──────────────────────────────────────────┐
│  Apps Script (file AppScript_v2_2.gs)    │
│   - bootstrap() : tạo tab lần đầu        │
│   - runAggregator() : tính Dashboard     │
│   - sendMorningBrief() : email 7-8h      │
│   - flagHotIssues() : 4 lần/ngày         │
│   - doGet() : phục vụ Web App            │
│   - 6 API: getOverview/KT/HS/VT/Kho/Khoa │
└──────────────────────────────────────────┘
                  ▲
                  │ HTTPS
                  │
┌──────────────────────────────────────────┐
│  Web App (URL /exec)                     │
│   - Chiếu trên TV phòng họp giao ban     │
│   - 6 view drill-down, click-to-Sheet    │
│   - Auto refresh 60s                     │
└──────────────────────────────────────────┘
```

**Triggers đang cài (1 lần, đã setup):**
- `runAggregator()` mỗi 15 phút
- `sendMorningBrief()` mỗi sáng 7–8h
- `flagHotIssues()` 4 lần/ngày (8h/11h/14h/17h)

---

## 3. Lịch sử các phiên bản

| Phiên bản | File | Trạng thái | Ghi chú |
|---|---|---|---|
| v2.0 | `AppScript_v2.gs` | ❌ deprecated | Bản đầu tiên, không có Web App |
| v2.1 | `AppScript_v2_1.gs` | ❌ deprecated | Có Web App nhưng số liệu sai vì hardcode vị trí cột; chỉ 1 màn, không click drill-down |
| v2.2 | `AppScript_v2_2.gs` | 🟡 stable rollback | Header-based column lookup; 6 view drill-down; click-to-Sheet deep link |
| **v2.3** | **`AppScript_v2_3.gs`** | ✅ **CURRENT** | Liên kết chéo KT↔VT↔HS — junction table `MAP_LIENKET`, modal 360° drill-down, global search, smart fuzzy matching, top 20 chuỗi vướng mắc trên nav 🔗 Liên kết. Bootstrap tự thêm cột Mã KT/Mã VT/Liên kết HS/Liên kết VT/Liên kết KT vào 4 tab gốc (idempotent). |

**Quy ước:** Bản mới luôn KEEP file cũ (đừng xóa) để rollback. Đặt tên `AppScript_vX_Y.gs` + `HuongDan_Deploy_WebApp_vX_Y.md` đi kèm.

---

## 4. Mục tiêu chính của Dashboard (cốt lõi — đừng quên)

Đây là 5 câu hỏi mà người chủ trì giao ban cần trả lời được trong 30 giây mỗi sáng. Bất kỳ thay đổi nào cũng phải phục vụ 5 câu này:

1. **Khoa nào đang nóng nhất?** → Tab Tổng quan: bar chart top khoa + tab Theo Khoa
2. **Máy/thiết bị nào đang hỏng, ai đang xử lý, đến đâu rồi?** → Tab Kỹ thuật
3. **Hồ sơ/gói thầu nào đang vướng, vướng ở khâu nào?** → Tab Hồ sơ (Kanban theo Trạng thái)
4. **Vật tư hóa chất nào đang cấp/đề xuất chậm?** → Tab VTTH
5. **Mặt hàng nào sắp hết kho? Bao giờ hết?** → Tab Kho (5A sort theo DOH tăng dần)

→ **Mỗi vấn đề click 1 phát phải mở được Sheet đúng dòng để sửa luôn trong cuộc họp.**

---

## 5. Quyết định kiến trúc QUAN TRỌNG (đừng phá lại)

### 5.1. Header-based column lookup (KHÔNG hardcode vị trí cột)

```javascript
function _findCol(headers, ...candidates) {
  // Pass 1: exact match (case-insensitive, normalize whitespace)
  // Pass 2: includes match
  // Trả về -1 nếu không tìm thấy
}
```

**Lý do:** Sheet thực tế bị đảo cột, đổi tên cột vài lần. Hardcode ở v2.1 dẫn đến đếm sai → user phản ứng dữ. Ở v2.2 mọi đọc cột đều qua `_findCol(headers, "Tên Thiết Bị", "Tên TB", "Thiết bị")` → resilient.

### 5.2. HTML qua string concatenation, KHÔNG dùng template literals

Ở Apps Script với HTML lớn dán inline trong .gs, dùng backtick template literals dễ vỡ vì escape ngược. v2.2 dùng `'<div>' + x + '</div>'` cho HTML server-side, còn client-side JS thì thoải mái dùng `\`...\``.

### 5.3. Click-to-Sheet deep link

Mỗi hàng trên Web App phải có thuộc tính cho phép mở Sheet đúng tab + đúng dòng:
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid={tab_gid}&range=A{row_number}
```
→ Đây là tính năng KEY của v2.2. Đừng bỏ.

### 5.4. SHEET_ID là constant đầu file

Nếu user đổi sheet, chỉ sửa 1 dòng `const SHEET_ID = "..."` ở đầu `AppScript_v2_2.gs` → Save → Deploy New version.

### 5.5. Dark theme #0F1B2D

Để chiếu lên TV phòng họp, không lóa. Đừng đổi sang light theme trừ khi user yêu cầu.

---

## 6. Cấu trúc file trong folder `Giao ban`

```
Giao ban/
├── AppScript_v2_2.gs              # ⭐ CODE HIỆN TẠI (~1810 dòng, 96 KB)
├── AppScript_v2_1.gs              # rollback
├── AppScript_v2.gs                # rollback xa hơn
├── HuongDan_Deploy_WebApp_v2_2.md # hướng dẫn deploy v2.2
├── HuongDan_Deploy_WebApp_v2_1.md # cũ
├── HuongDan_ThucThi.docx          # tài liệu nội bộ (do user soạn ban đầu)
├── BaoCaoGiaoBan_v2.xlsx          # template Excel (ít dùng từ khi có Web App)
├── HANDOFF.md                     # ⭐ FILE NÀY
├── CLAUDE.md                      # AI auto-load
├── README.md                      # cho người xem repo trên GitHub
└── docs/                          # tài liệu phụ
```

---

## 7. Cấu trúc các tab Sheet (KEY — dùng khi đụng tới code)

### Tab `1. Kỹ Thuật` (KT) — 19 cột thực tế
Cột chính code đang đọc (qua _findCol):
- Tên Thiết Bị, Khoa/ Phòng Sử Dụng, Tình trạng, Chi tiết tình trạng
- CB phụ trách, Tiến độ bước, Deadline, Khó khăn vướng mắc
- Cấp độ ưu tiên (CAO/TB/THẤP), Đã Hoàn Thành (✓ / "Đã HT" / X)

**Quy ước "Đã Hoàn Thành":** check qua `_isDone(v)` chấp nhận: `✓`, `X`, `1`, `TRUE`, `Đã HT`, `Hoàn thành`. Có nhiều dòng "Đề xuất thanh lý" + ✓ — đó là KT đã xong việc của họ.

### Tab `2. Hồ Sơ` (HS) — 21 cột
- Mã Hồ sơ, Nội dung công việc được giao, Khoa, Giá trị Dự toán, Hình thức LCNT
- **Trạng thái** (cột mới so với v2.1: "Đang chuẩn bị" / "Đang thẩm định" / "Đã trình" / …)
- Tiến độ %, Deadline, Vướng mắc

→ Tab Hồ sơ ở Web App vẽ Kanban từ cột Trạng thái.

### Tab `4. VTHC` (VTTH)
- **Loại nhóm** (đã đổi từ "Nội dung công việc được giao" hồi v2.1)
- Khoa, CB phụ trách, Trạng thái, Tiến độ %

### Tab `5A. Tổ kho - Tồn`
- Mã VTTH, Tên VTTH, Tồn đầu kỳ, Nhập, Xuất, **Tồn hiện tại**, MIN, MAX
- **Trạng thái cảnh báo** (ĐỎ/VÀNG/XANH), **DOH** (số ngày tồn), Khoa yêu cầu nhiều nhất, Số khoa đang chờ, Đề xuất xử lý

→ DOH là KEY: sort tăng dần để biết mặt hàng nào sắp hết.

### Tab `5B. Tổ kho - Đề xuất`
- Ngày yêu cầu, Khoa, Người YC, VTTH, Số lượng, Đơn vị
- Mức ưu tiên, Trạng thái xử lý, CB Kho, Ngày DK cấp, Ngày thực cấp, Ghi chú

---

## 8. Workflow khi anh user yêu cầu sửa

```
User feedback → Đọc HANDOFF.md (nếu chưa) → Hiểu mục tiêu cốt lõi (mục 4)
              → Sửa AppScript_vX_Y+1.gs (KHÔNG sửa file cũ — copy ra bản mới)
              → node --check syntax
              → Cập nhật HuongDan_Deploy_WebApp_vX_Y+1.md
              → Cập nhật HANDOFF.md mục "Lịch sử các phiên bản"
              → git add . && git commit -m "..." && git push
              → Đưa user 2 dòng "anh dán code mới + Deploy → New version"
```

**Đừng làm:**
- Đừng hardcode vị trí cột (luôn dùng _findCol).
- Đừng tạo nhiều tab/màn hình mới khi user chưa yêu cầu — họ thích gọn.
- Đừng đổi URL Web App. Luôn deploy "New version" trên deployment cũ → URL không đổi → màn TV không phải làm gì.
- Đừng xóa file `_v2_1.gs`, `_v2.gs` — giữ rollback.
- Đừng dùng emoji bừa bãi trong code/file. User thích sạch.

---

## 9. Tình trạng hiện tại (snapshot tại điểm handoff)

- ✅ v2.3 đã code xong, syntax OK (`node --check` pass), copy về Desktop (~131 KB, ~2400 dòng).
- ✅ Hướng dẫn deploy v2.3 đã viết: `HuongDan_Deploy_WebApp_v2_3.md`.
- ✅ Repo Git config sẵn — remote = https://github.com/Bonitohd1/Giao-ban-.git
- ⏳ Chờ user double-click `setup-git.bat` để push lần đầu (sandbox không có credentials GitHub).
- ⏳ Chờ user dán code v2.3 vào Apps Script + chạy menu **Giao ban → 🔗 Bootstrap Links v2.3** + Deploy New version.
- ⏳ Chờ user điền mã liên kết thực tế vào tab `MAP_LIENKET` (hoặc cột Liên kết trong từng tab) để chuỗi KT→VT→HS hiện ra trên Web App.
- ⏳ Chờ user verify 7 view (6 view cũ + 🔗 Liên kết) chạy đúng với data thật.

### Bộ API mới của v2.3 (cho AI session sau biết)

| Endpoint | Trả về | Dùng ở |
|---|---|---|
| `getDetail(type, id)` | entity + related KT/VT/HS (3-col modal data) | Modal 360° khi click bất kỳ mã nào |
| `searchAll(q)` | top 8 results across 4 tabs | Search bar typeahead |
| `getLinkedChains()` | top 20 chuỗi vướng mắc, sort theo severity | Nav 🔗 Liên kết |
| `bootstrapLinks()` | (menu action) thêm cột Mã + Liên kết, tạo MAP_LIENKET | Menu **Giao ban** trong Sheet |

### Junction table `MAP_LIENKET`

Cấu trúc: `KT_ID | HS_ID | VT_ID | Loại quan hệ | Ghi chú | Ngày tạo`. Ưu tiên cao nhất khi build chain — code đọc cả MAP_LIENKET lẫn cột "Liên kết X" trong 4 tab gốc, hợp nhất, dedupe theo cặp `(type1:id1, type2:id2)`.

**Cách push lần đầu / push sau khi sửa:**
1. Double-click `setup-git.bat` (hoặc chuột phải `setup-git.ps1` → Run with PowerShell).
2. Nếu Windows hỏi đăng nhập → chọn tài khoản Bonitohd1.
3. Nếu hỏi password trên terminal → dùng [Personal Access Token](https://github.com/settings/tokens) (scope `repo`), KHÔNG phải mật khẩu GitHub.

---

## 10. Liên hệ với hệ thống tổ chức

User là **trưởng phòng**. Email cho user trong Web App đang gửi từ `ducphamhn01@gmail.com`. Triggers chạy on behalf of user. Nếu user đổi tài khoản hoặc rời vị trí, phải:
1. Chuyển ownership Sheet sang người mới.
2. Re-deploy Apps Script under new account → URL sẽ đổi.

---

## 11. Glossary (thuật ngữ riêng của ngành/của user)

| Từ | Nghĩa |
|---|---|
| KT | Kỹ thuật — đội bảo trì thiết bị y tế |
| HS | Hồ sơ — gói thầu, gói mua sắm |
| VTTH / VTHC | Vật tư tiêu hao / Vật tư hóa chất |
| LCNT | Lựa chọn nhà thầu |
| Khoa | Đơn vị sử dụng (Khoa Xét nghiệm, Khoa Hồi sức,…) |
| DOH | Days On Hand — số ngày tồn còn lại với tốc độ tiêu thụ hiện tại |
| Thanh lý | Đề xuất loại bỏ thiết bị hỏng không sửa được nữa |
| Giao ban | Cuộc họp đầu giờ sáng (~15 phút) chốt việc trong ngày |

---

**Tóm tắt 1 câu cho AI mới:**
> Đây là Web App Apps Script hiển thị dashboard giao ban cho 1 trưởng phòng VT-TBYT bệnh viện. Code hiện tại là `AppScript_v2_3.gs` (liên kết chéo KT↔VT↔HS qua junction table + modal 360°). Quy tắc vàng: header-based column lookup, click-to-Sheet, dark theme, KHÔNG hardcode cột, bootstrap idempotent.
