# 📓 SESSION LOGS - Nhật ký làm việc của các AI

> **YÊU CẦU BẮT BUỘC:** Mọi AI (Antigravity, Claude) trước khi kết thúc phiên làm việc phải ghi log lại tại file này để phiên sau (hoặc AI khác) đọc và nắm được tiến độ dự án mà không bị mất ngữ cảnh (Context Loss).

---

## Mẫu Log (Copy và dán lên đầu danh sách mỗi khi đóng phiên)

```markdown
### [Ngày Tháng Năm - Giờ] | AI: [Tên AI]
- **Mục tiêu phiên:** ...
- **File đã thay đổi:** ...
- **Tính năng / Lỗi đã xử lý:** ...
- **Hành động cần làm ở phiên tiếp theo:** ...
```

---

## Nhật ký các phiên

### [03/05/2026 - 03:45] | AI: Antigravity — v2.10 Maintenance & Integration (Hệ thống Dự báo Bảo trì)
- **Mục tiêu phiên:** Tích hợp quản lý Bảo trì/Bảo hành chủ động cho nhóm KT và liên kết chéo với nhóm Hồ sơ.
- **File đã thay đổi:** `AppScript_v2_10.gs`, `HANDOFF.md`, `docs/SESSION_LOGS.md`, `HuongDan_Deploy_WebApp_v2_10.md`.
- **Tính năng / Lỗi đã xử lý:**
  - **Dự báo Bảo trì/Bảo hành:** Bổ sung 5 cột dữ liệu mới vào tab Kỹ thuật để theo dõi mốc bảo hành, chu kỳ bảo trì.
  - **Liên kết chéo (KT ↔ HS):** Cho phép gắn mã gói thầu bảo trì (từ tab Hồ sơ) vào từng máy. Hệ thống tự động cảnh báo nếu máy đến hạn bảo trì mà chưa có gói thầu tương ứng.
  - **Báo cáo chi tiết (Detailed Reports):** Nâng cấp Báo cáo Tuần/Tháng với các bảng chi tiết cho từng nhóm (KT, HS), liệt kê cụ thể các điểm nóng và vướng mắc thay vì chỉ tóm tắt KPI.
  - **Logic Cảnh báo:** Thêm section "DỰ BÁO BẢO TRÌ/BẢO HÀNH" vào Email báo cáo với các nhãn màu (Đỏ: Quá hạn/Không có gói thầu; Xanh: Đang làm HS).
- **Hành động cần làm ở phiên tiếp theo:**
  - Hoàn thiện tính năng xuất Excel (Phase C).
  - Tự động hóa gửi báo cáo theo lịch (Trigger).

---

### [03/05/2026 - 03:15] | AI: Antigravity — v2.9 Phase B: Tab Báo cáo (Report Hub)
- **Mục tiêu phiên:** Triển khai Phase B của dự án Báo cáo & Email — đưa tính năng báo cáo vào một Tab riêng biệt trên Dashboard.
- **File đã thay đổi:** `AppScript_v2_9.gs`, `HANDOFF.md`, `CLAUDE.md`, `docs/SESSION_LOGS.md`, `HuongDan_Deploy_WebApp_v2_9.md`.
- **Tính năng / Lỗi đã xử lý:**
  - **Tab "📊 Báo cáo":** Thêm tab mới vào thanh điều hướng (desktop & mobile menu).
  - **Report Hub UI:** Giao diện 2 cột (Sidebar chọn loại + Content xem trước).
  - **Hỗ trợ 5 loại báo cáo:** Giao ban sáng, Tổng kết tuần, Báo cáo tháng, Dự báo cung ứng, Kiểm soát tồn đọng.
  - **Preview & Watermark:** Cho phép xem trước HTML báo cáo ngay trong app với watermark "PHÒNG VT-TBYT" chuyên nghiệp.
  - **Actions:** Tích hợp nút Gửi email (gọi backend `sendReportNow`) và In PDF (print-friendly).
  - **Branding:** Cập nhật version UI lên v2.9.
- **Hành động cần làm ở phiên tiếp theo:**
  - Phase C: Tự động hóa gửi báo cáo định kỳ (Trigger Weekly/Monthly).
  - Hoàn thiện logic lọc (Filter) theo Cơ sở/Khoa cho từng báo cáo.
  - Export Excel (tạo file Spreadsheet tạm).

---

### [03/05/2026 - 02:45] | AI: Antigravity — v2.8.2 Optimization & Detail Enhancement
- **Mục tiêu phiên:** Xử lý lỗi treo dashboard (Performance), lỗi báo đỏ (Syntax/TypeError) và nâng cấp giao diện chi tiết VT/HS.
- **File đã thay đổi:** `AppScript_v2_8.gs`, `HANDOFF.md`, `CLAUDE.md`, `docs/SESSION_LOGS.md`, `HuongDan_Deploy_WebApp_v2_8.md`.
- **Tính năng / Lỗi đã xử lý:**
  - **Tối ưu hiệu năng (O(N) Indexing):** Thay thế các vòng lặp fuzzy search $O(N^2)$ bằng hệ thống `idx.vtByMaLow`, `idx.hsByMaLow` và `idx.hsList`. Dashboard không còn bị treo khi dữ liệu lớn.
  - **Fix lỗi treo Modal:** Sửa lỗi mất thuộc tính `hsByName` trong hàm `_buildLinkIndex` gây lỗi `TypeError` khiến modal "Chi tiết" bị kẹt ở trạng thái "Đang tải...".
  - **Nâng cấp Modal 360° cho VT/HS:** 
    - Bổ sung cột hiển thị **CB phụ trách** và **Tiến độ (%)** vào modal chi tiết của Vật tư và Hồ sơ.
    - Hiển thị nội dung **Vướng mắc** (italic) trực tiếp trong danh sách liên kết.
  - **Fix lỗi "Không tìm thấy VT":**
    - Thêm cơ chế `.trim()` cho tất cả các bước truy xuất Mã VT để tránh lỗi do dấu cách thừa trong Google Sheet.
    - Mở rộng bộ lọc tiêu đề cột: chấp nhận cả `"Mã VTTH"`, `"Mã VT"`, `"Tên VTTH"`, `"Loại nhóm"`.
  - **Làm mới Cache (v31):** Nâng cấp prefix cache lên `v31` để buộc hệ thống cập nhật cấu trúc dữ liệu mới nhất.
- **Hành động cần làm ở phiên tiếp theo:**
  - User dán code `AppScript_v2_8.gs` và Deploy New version.
  - Verify: Click vào VT043 (hoặc bất kỳ VT nào) xem đã hiện đầy đủ thông tin CB phụ trách và tiến độ chưa.
  - Kiểm tra tốc độ switch giữa các tab xem có còn hiện tượng "xoay" lâu không.

---

### [02/05/2026 - 10:30] | AI: Claude (Cowork) — v2.9.2 Mobile responsive
- **Mục tiêu phiên:** User screenshot iPhone — dashboard render ở viewport rộng → iOS Safari auto-shrink → mọi thứ nhỏ tí. Cần mobile-responsive đầy đủ.
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs`.
- **Tính năng / Lỗi đã xử lý:**
  - Thêm 2 block `@media`:
    - `(max-width:900px)` — tablet/mobile portrait, gốc rễ vấn đề
    - `(max-width:480px)` — phones nhỏ
  - **Header**: brand-row stack (column-flex thay vì row-flex), search-wrap full width, status-row wrap.
  - **Tabs nav**: overflow-x scrollable, white-space nowrap → swipe ngang giữa các tab.
  - **KPI grid**: 4-col → **1-col** trên mobile. Big number 38px → 32px. Cta hidden.
  - **Forecast stats**: 7-col → **2-col** trên 900px, **1-col** trên 480px.
  - **Hot by team**: 3-col → 1-col.
  - **KT summary chips**: flex 50%/50% mỗi chip, nút reset full width.
  - **Filter rows**: stack column thay vì wrap, input/select full width.
  - **HS toolbar**: stack column, view toggle full width, group-by select flex.
  - **Bar chart**: shrink columns (160px→120px name, 50px→32px val).
  - **Tables**: font 13px → 11px, padding 10px → 7px, scroll touch enabled.
  - **Pipeline**: column min-width 280px → 240px (220px ở phones nhỏ) để swipe ngang dễ hơn.
  - **Forecast table**: 3-col grid → 1-col stack.
  - **Modal**: padding 30px → 6px, 3-col → 1-col stack với border-bottom giữa cols.
  - **Section heading**: font-size nhỏ hơn, ẩn small note để gọn.
  - **Forecast alert**: padding compact hơn.
- **Kỹ thuật áp dụng:**
  - CSS-only fix (không thay HTML), media query bao phủ tất cả components mới.
  - `-webkit-overflow-scrolling:touch` cho native scroll feel trên iOS.
  - Viewport meta đã có sẵn (`width=device-width,initial-scale=1`) — không cần đổi.
- **Hành động cần làm ở phiên tiếp theo:** User dán code vào Apps Script + Deploy. Mở Web App trên iPhone:
  1. KPI cards stack 1-col, đọc rõ ràng
  2. Tabs swipe ngang được
  3. Hot list 1-col
  4. Filter row stack column
  5. Pipeline cards rộng vừa, swipe ngang giữa các cột

---

### [02/05/2026 - 09:00] | AI: Claude (Cowork) — v2.9 Phase A: Email báo cáo + Web App link + Tab Kho KPI redesign
- **Mục tiêu phiên:** Triển khai Phase A của PLAN_REPORT (5 mục) — đáp ứng yêu cầu user về báo cáo email và KPI Kho có ý nghĩa.
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs` + tạo mới `docs/PLAN_REPORT_v2.9_v2.10.md`.
- **5 mục Phase A đã làm:**
  1. **A1 — KPI card Kho Tổng quan redesign**: thay vì "0 ĐỎ · 0 VÀNG · 0 YC chờ" (sếp không quan tâm), giờ hiện chips chi tiết:
     - 🚨 sắp hết <30n (Mức 1)
     - 🔴 cần gấp 30-60n (Mức 2)
     - ⚠ chưa có gói thầu (Mức 1 không giải pháp)
     - 📦 tồn >1 năm (stagnantTier 3)
     - Big number = số mặt hàng tồn an toàn / tổng. Foot hiển thị tên mặt hàng nóng nhất + DOH.
     - Backend `getOverview()` cards.kho thêm `forecast: {l1, l2, noSolution, stagnantLong, top:[...]}`.
  2. **A2 — `sendMorningBrief()` redesign HTML**: template mobile-responsive với:
     - Header gradient #1E3A8A → #1F4E78 + dateStr + branding phòng VT-TBYT
     - **CTA button** "📱 Mở dashboard" lớn dùng URL Web App (lấy từ `ScriptApp.getService().getUrl()`)
     - 4 KPI rows X/Y + progress bar + chips alerts
     - **Section Cảnh báo cung ứng** kèm tên mặt hàng + DOH cụ thể (top 5)
     - Section Top 5 điểm nóng có tên CB
     - CTA button bottom (lặp cho mobile dễ click)
     - Footer + link Sheet nguồn (mờ)
     - Tách hàm `_buildBriefHtml(data, mode)` để dùng chung cho `sendMorningBrief` + `flagHotIssues` + `sendReportNow`.
  3. **A3 — `flagHotIssues()` redesign**: 4 lần/ngày (8h/11h/14h/17h) — gộp các event thành 1 email tổng dùng `_buildBriefHtml(data, "flash")` thay vì spam nhiều mail.
     - Thêm event mới: "X mặt hàng kho Mức 1 KHẨN CHƯA có gói thầu".
     - Gửi danh sách email theo `_getEmailRecipients("flag_hot")`.
  4. **A4 — Nút "📧 Gửi email" trong header dashboard**: cạnh nút Refresh.
     - Click → confirm dialog → `google.script.run.sendReportNow("morning_brief")` → backend gửi email ngay.
     - Disable button 30s sau khi gửi để tránh spam.
     - CSS: nền xanh đậm, hover #1E3A8A.
  5. **A5 — Tab `cfg_emails` + bootstrap**: cấu hình danh sách email theo loại báo cáo.
     - Cấu trúc: STT | Loại báo cáo | Tên người nhận | Email | Active.
     - 6 loại pre-filled: morning_brief / weekly / monthly / forecast / ton_dong / flag_hot.
     - Helper `_getEmailRecipients(type)` đọc từ tab này, fallback EMAIL_TRUONG_PHONG.
     - `bootstrap()` tự thêm tab nếu chưa có.
- **Backend mới**: `_buildBriefHtml(data, mode)`, `sendReportNow(type)`, `_setupCfgEmails(ss)`, `_getEmailRecipients(type)`, `_getWebAppUrl()`.
- **Frontend mới**: nút btn-email + onclick handler + CSS.
- **Header version** v2.7.1 → **v2.9** với subtitle "email báo cáo".
- **Lessons learned:** 
  - File .gs lớn (250+ KB) → Edit tool có thể truncate. Đã recover bằng cách append tail chuẩn.
  - File gặp trailing null bytes do Edit cũ → cần `python: rstrip(b'\\x00')` để xử lý.
- **Hành động cần làm ở phiên tiếp theo:** User dán lại `AppScript_v2_7.gs` + Deploy. Verify:
  1. Tab Tổng quan: card Kho hiện chips "sắp hết / cần gấp / chưa có gói thầu / tồn >1 năm" + tên mặt hàng nóng nhất ở footer.
  2. Bấm nút 📧 Gửi email → vào inbox xem template HTML mới có header gradient + CTA button + chi tiết tên mặt hàng cảnh báo cung ứng + link Web App.
  3. Mở Sheet → tab `cfg_emails` đã có 6 row mặc định, sếp thêm tổ trưởng vào.
  4. Sau khi config email xong → chạy lại `setupTriggers()` (không cần — trigger không đổi).

### [02/05/2026 - 08:30] | AI: Claude (Cowork) — Plan v2.9 + v2.10 (báo cáo & email)
- **Mục tiêu:** Ghi log kế hoạch chi tiết tính năng báo cáo + email đã chốt với user.
- **File:** Tạo mới `docs/PLAN_REPORT_v2.9_v2.10.md` với 3 phase + checklist.
- **Plan:**
  - Phase A (đang làm — v2.9): Email & KPI Kho cải tiến, 5 mục.
  - Phase B (sau Phase A — v2.9 hoặc v2.10): Tab "📊 Báo cáo" trong app, 7 mục (3 actions: email/PDF/Excel + 5 loại báo cáo).
  - Phase C (auto — v2.10): Trigger weekly/monthly + log email.

---

### [01/05/2026 - 16:30] | AI: Claude (Cowork) — v2.8.1 Phân cấp tồn đọng 3 mức + recommendation rõ ràng hơn
- **Mục tiêu phiên:** User feedback: cảnh báo "dùng ít / không dùng" hiện chỉ có 1 mức ≥90n. Cần phân cấp chi tiết hơn để biết mặt hàng nào tồn đọng nguy cấp nhất.
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs`.
- **Tính năng / Lỗi đã xử lý:**
  - **Backend `_getSupplyRisk()`**: thêm field `stagnantTier`:
    - 0 = không tồn đọng (DOH < 90n)
    - 1 = tồn cao (90-180n) — có thể chỉ là dùng tự nhiên thấp
    - 2 = tồn đọng 6 tháng - 1 năm (180-365n) — đề xuất chuyển khoa
    - 3 = tồn đọng > 1 năm (≥365n) — BẮT BUỘC rà soát
  - **Backend `getKho()` stats**: thêm `stagnantHigh` (tier 2) và `stagnantLong` (tier 3).
  - **Recommendation text** rõ ràng hơn theo từng tier:
    - Mức 4 (DOH 90-180): "✓ Trong tầm quy trình thầu rộng rãi · 📦 tồn cao, kiểm tra nhu cầu"
    - Tier 2 (180-365): "⚠ Tồn đọng X tháng — đề xuất chuyển khoa khác / điều chuyển nội bộ / xử lý theo quy định"
    - Tier 3 (>365): "🚨 Tồn đọng X tháng (>1 năm) — BẮT BUỘC rà soát: chuyển dùng / điều chuyển / thanh lý nếu hết hạn"
  - **Frontend KPI cards**: 5 → **7 cards** (1+2+3+4 + Tồn cao 90-180 + Tồn 6 tháng 180-365 + Tồn >1 năm ≥365). Grid `repeat(7,1fr)` mặc định, responsive collapse 3-col ở <1100px.
  - **Frontend banner thứ 3**: nếu có tồn >1 năm → banner đỏ "🚨 X mặt hàng tồn đọng trên 1 năm — bắt buộc rà soát". Nếu không có nhưng có tồn 6 tháng-1 năm → banner cam "⚠ X mặt hàng tồn 6 tháng - 1 năm — đề xuất xử lý".
  - **Frontend section "Tồn đọng" tách thành 3 sub-section** theo tier, mỗi section ưu tiên hiển thị theo độ nguy cấp:
    - 🚨 Tồn đọng > 1 năm — BẮT BUỘC xử lý (background đỏ đậm)
    - ⚠ Tồn đọng 6 tháng - 1 năm (background cam)
    - 📦 Tồn cao 3-6 tháng (background xám — chỉ thông tin)
  - DOH hiển thị thêm "(X tháng)" để dễ đọc cho mặt hàng tồn lâu.
  - CSS thêm: `.fs-darkgray`, `.fs-darkred` (KPI cards), `.forecast-alert.stag/.stag-mid` (banner), `.ft-darkred` (row đỏ đậm).
- **Hành động cần làm ở phiên tiếp theo:** User dán lại `AppScript_v2_7.gs` + Deploy. Verify Tab Kho:
  1. Có 7 KPI cards thay vì 5.
  2. Banner đỏ pulse hiện nếu có tồn >1 năm.
  3. Có 3 section tồn đọng riêng (>1 năm / 6 tháng-1 năm / 3-6 tháng) với background tinted color.
  4. Recommendation text mỗi mặt hàng tồn đọng có cụm "tồn X tháng — đề xuất ..."

---

### [01/05/2026 - 16:00] | AI: Claude (Cowork) — v2.8 Logic Dự đoán cung ứng VTTH/Hóa chất
- **Mục tiêu phiên:** Implement bài toán cốt lõi nhất với phòng VT-TBYT — dự đoán mặt hàng kho sắp hết và map đến tiến trình gói thầu mua sắm để có giải pháp chủ động kịp thời.
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs`.
- **Logic 4 mức cảnh báo + 1 cảnh báo tồn đọng** (theo luật anh chốt):
  - 🚨 Mức 1 (DOH < 30 ngày): KHẨN — chào giá trực tuyến / chỉ định thầu / mua trực tiếp NGAY
  - 🔴 Mức 2 (30-60 ngày): CAO — phải đến bước "Đánh giá HSDT" / shortcut
  - 🟡 Mức 3 (60-90 ngày): TRUNG — phải có "Phê duyệt KHLCNT"
  - 🟢 Mức 4 (90-180 ngày): Trong tầm quy trình thầu rộng rãi bình thường
  - 📦 Tồn đọng (DOH ≥ 90 ngày): "dùng ít / không dùng" — cần rà soát nhu cầu
- **Backend mới:**
  - `_hsStage(tt)` — phân loại HS thành 7 stage (0=chưa rõ, 1=chuẩn bị, 2=KHLCNT phê duyệt, 3=phát hành HSMT, 4=đánh giá HSDT, 5=đã trình, 6=đã ký HĐ).
  - `_isShortcutHS(hsObj)` — nhận diện gói shortcut (chỉ định / mua trực tiếp / chào hàng / chào giá).
  - `_getSupplyRisk(item, idx)` — đánh giá risk cho 1 mặt hàng 5A: tìm VT/HS link, tính maxStage, sinh recommendation text cụ thể (nêu rõ mã HS, tên CB, trạng thái hiện tại).
  - `getKho()` trả thêm `forecast: { stats: {l1,l2,l3,l4,l5,stagnant,l1NoSolution,l2NoSolution}, items: [...] }`.
- **Frontend section "🔮 Dự đoán cung ứng" trên đầu Tab Kho:**
  - Banner đỏ pulse (cảnh báo) nếu có Mức 1 chưa có giải pháp ("X mặt hàng có DOH<30n VÀ chưa có gói thầu/shortcut — phải triển khai NGAY HÔM NAY").
  - 5 KPI mini cards: Mức 1/2/3/4 + Tồn đọng (mỗi card có border-top color, big number, sublabel "DOH < 30 ngày" v.v.).
  - Bảng top 10 mặt hàng cần xử lý: 3 cột [Mức · Cảnh báo] / [Tên VTTH + Mã + Khoa + Tồn + DOH] / [Recommendation cụ thể].
    - Recommendation tự sinh dựa vào HS link: "✓ Đang xử lý qua chỉ định thầu [HS-001 · Đã trình · Khuất Văn Huy]" hoặc "🚨 Chưa có gói thầu — TRIỂN KHAI NGAY: chào giá trực tuyến / chỉ định thầu" v.v.
    - Background row tinted theo color (đỏ nhạt cho Mức 1, cam cho Mức 2, …).
    - Mặt hàng vừa Mức 1-3 vừa stagnant có tag bonus "📦 dùng ít".
  - Section riêng "📦 Tồn đọng / Dùng ít" cho các mặt hàng DOH ≥ 90 ở Mức 4 (cân nhắc chuyển khoa / rà soát nhu cầu).
  - Bảng tồn 5A đầy đủ giữ nguyên ở dưới — click row vẫn expand chuỗi liên kết VT/HS/queue 5B.
- **CSS mới**: `.forecast-alert` với pulse animation đỏ/cam, `.forecast-stats` 5-col grid, `.fs-card` border-top color, `.ft-row` 3-col layout với background tint, `.ft-stag-tag` mini badge cho stagnant.
- **Hành động cần làm ở phiên tiếp theo:** User dán lại `AppScript_v2_7.gs` + Deploy. Verify Tab Kho:
  1. Có section "🔮 Dự đoán cung ứng" trên cùng với 5 KPI.
  2. Banner đỏ pulse hiện nếu có Mức 1 chưa có gói thầu.
  3. Bảng top 10 hiện recommendation cụ thể (mã HS, CB, trạng thái).
  4. Click row trong bảng forecast → mở modal generic row của 5A.

---

### [01/05/2026 - 15:30] | AI: Claude (Cowork) — v2.7.8 Tab VTTH Pipeline/Bảng + Group-by
- **Mục tiêu phiên:** Đồng bộ pattern (Summary chips + View toggle + Group-by + auto-grid + HOT badge) sang Tab VTTH — hoàn tất bộ 3 tab task (KT, HS, VT) theo style premium nhất quán.
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs`.
- **Tính năng / Lỗi đã xử lý:**
  - **Backend `getVTTH()`** trả thêm `cbList[]` unique sort tiếng Việt (đồng bộ với KT/HS).
  - **Frontend renderVT redesign hoàn toàn**:
    - Summary 5 chips: ✓ Hoàn thành (X/Y%), 🚧 vướng, ⏰ trễ, 🔴 CAO, ↻ Reset.
    - View toggle 📋 Bảng (default — tab này có nhiều cột thông tin) ↔ 🗂 Pipeline.
    - Group by 6 chiều: 📋 Trạng thái · 🧪 Loại nhóm · 🔴 Cấp độ · 🏥 Khoa · 🏢 Cơ sở · 👤 CB phụ trách.
    - Filter row: search + 6 dropdown (Cơ sở, Khoa, CB, Trạng thái, Loại nhóm, Cấp độ) + toggle Ẩn HT + counter.
    - Auto-grid fallback khi 1 cột (đồng nhất với KT/HS).
    - Card Kanban có: tên loại + 📍 khoa·CS + badge trạng thái + bước tiến độ inline + 👤 CB + ⏱ deadline + % progress + ⚠ vướng mắc + HOT badge.
    - Bảng có pin Loại nhóm + Cấp độ + HT, sort priority CAO → trễ → done.
  - **Refactor**: tách `renderVTCardInner(r)`, `renderVTKanban(rows)`, `renderVTTable(rows)`, `applyVT()` riêng — DRY tương đồng KT/HS.
  - CSS không cần thêm — reuse hết từ `.hs-toolbar`, `.hs-vbtn`, `.hs-groupby`, `.hs-grid`, `.kanban-card`, `.hot-badge` đã có.
- **Trạng thái 3 tab task — đồng bộ 100%:**
  - Tab KT (46 máy) — default Bảng, group by Tình trạng
  - Tab HS (106 gói) — default Pipeline, group by Trạng thái + có 💰 tổng giá trị
  - Tab VT (52 task) — default Bảng, group by Trạng thái
- **Hành động cần làm ở phiên tiếp theo:** User dán lại `AppScript_v2_7.gs` + Deploy. Verify Tab VTTH:
  1. Có 5 chips ở đầu + nút Pipeline/Bảng + dropdown Group by 6 lựa chọn.
  2. Switch sang Pipeline → mặc định nhóm theo Trạng thái → thấy các cột.
  3. Đổi Group by sang "🧪 Loại nhóm" hoặc "👤 CB phụ trách" → cards re-arrange.
  4. Filter để 1 cột → tự ra grid 3 cột.

---

### [01/05/2026 - 15:00] | AI: Claude (Cowork) — v2.7.7 Tab KT Pipeline/Bảng + Group-by (đồng bộ HS)
- **Mục tiêu phiên:** User feedback: "tính năng này khá hay, tối ưu sang cả nhóm kỹ thuật cũng có. để đồng bộ tính năng" — apply pattern view-toggle (Pipeline/Bảng) + Group-by selector từ Tab Hồ sơ sang Tab Kỹ thuật.
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs` — replace toàn bộ renderKT.
- **Tính năng / Lỗi đã xử lý:**
  - **View toggle**: 📋 Bảng đầy đủ (default cho KT vì 46 máy table dày phù hợp hơn) ↔ 🗂 Pipeline.
  - **Group by selector** với 5 chiều:
    - 📋 Tình trạng (default — Đang sửa / Bảo trì / Đề xuất TL / Hỏng / …)
    - 🔴 Cấp độ ưu tiên (CAO / Bình thường)
    - 🏥 Khoa
    - 🏢 Cơ sở
    - 👤 CB phụ trách
  - **Refactor**: tách `renderKTCardInner(r)` để Kanban col + Grid view dùng chung; tách `renderKTKanban(rows)` và `renderKTTable(rows)` riêng biệt; `applyKT()` chuyển đổi giữa 2 view dựa vào STATE_KT.view.
  - **Auto-grid fallback**: nếu nhóm chỉ ra 1 cột → switch sang CSS Grid + banner gợi ý đổi Group by (đồng nhất với HS).
  - **CSS reuse**: dùng lại class `.hs-toolbar`, `.hs-view-toggle`, `.hs-vbtn`, `.hs-groupby`, `.hs-grid`, `.hs-grid-banner` đã định nghĩa cho HS — không trùng lặp CSS.
  - **Kanban card KT**: hiện tên máy + thông tin SN/Hãng + 📍 khoa·CS + badge tình trạng inline + chi tiết tình trạng (90 ký tự) + 👤 CB + ⏱ deadline + ⚠ vướng mắc inline + HOT badge.
- **Hành động cần làm ở phiên tiếp theo:** User dán lại `AppScript_v2_7.gs` + Deploy. Verify Tab Kỹ thuật:
  1. Có nút Pipeline/Bảng cạnh summary chips
  2. Group by dropdown 5 lựa chọn hoạt động
  3. Switch sang Pipeline → Group by Tình trạng → thấy 4 cột (Đang sửa / Bảo trì / Đề xuất TL / Hỏng)
  4. Filter CB → 1 cột → tự switch grid với banner

---

### [01/05/2026 - 14:30] | AI: Claude (Cowork) — v2.7.6 Kanban Group-by + auto-grid fallback
- **Mục tiêu phiên:** User feedback: "pipeline kanban nhìn k chuyên nghiệp vì có mỗi 1 cột" — khi filter theo CB Hoàng Văn Thuân, tất cả 16 gói thầu của anh đều có Trạng thái "(Chưa phân loại)" → kanban chỉ có 1 cột chiếm 280px, vô nghĩa và xấu.
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs`.
- **Tính năng / Lỗi đã xử lý:**
  - **Group-by selector**: Thêm dropdown "Group by" cạnh View toggle với 5 lựa chọn:
    - 📋 Trạng thái (default)
    - 📊 Hình thức LCNT (Đấu thầu rộng rãi / Chỉ định / …)
    - 🔴 Cấp độ ưu tiên (CAO / Bình thường)
    - 👤 CB phụ trách
    - 🏥 Khoa
  - **Auto-grid fallback**: nếu sau khi nhóm chỉ ra 1 cột → tự switch sang **CSS Grid** `repeat(auto-fill, minmax(320px,1fr))` để cards trải đều theo chiều ngang. Hiển thị banner "📋 [tên nhóm] (X gói) — chỉ có 1 [groupBy], hiển thị grid để dễ scan. Đổi Group by để thấy cột phân nhóm khác." → user biết tại sao và cách sửa.
  - **Refactor**: tách hàm `renderHSCardInner(it)` để dùng chung cho cả Kanban column và Grid view (DRY).
  - **CSS**: thêm `.hs-toolbar` flex layout, `.hs-groupby` style dropdown, `.hs-grid` responsive grid, `.hs-grid-banner` với hint italic ở cuối.
- **Hành động cần làm ở phiên tiếp theo:** User dán lại `AppScript_v2_7.gs` + Deploy. Verify: 
  1. Tab HS có thêm dropdown "Group by" cạnh nút Pipeline/Bảng.
  2. Khi filter ra chỉ 1 nhóm → tự render grid cards thay vì 1 cột Kanban dài.
  3. Đổi Group by → cards re-arrange theo cột mới.

---

### [01/05/2026 - 14:00] | AI: Claude (Cowork) — v2.7.5 HOT badge + re-apply HS redesign
- **Mục tiêu phiên:**
  1. User feedback: "phía đầu màu khác, không chuyên nghiệp" — row coloring (background tint + sticky col darker bg + border-left color) ở Tab Kỹ thuật trông lệch màu giữa sticky col và body. User đề xuất: **HOT icon nhấp nháy ở góc trái** thay cho row coloring.
  2. Phát hiện: renderHS redesign từ phiên trước đã bị **mất** do file truncate+recover cycle (v2.6 truncate → restored từ v2.5 tail mang theo OLD renderHS) → cần re-apply.
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs`.
- **Tính năng / Lỗi đã xử lý:**
  - **Bỏ row coloring lệch màu** (`.row-critical bg`, `.row-cao border-left`, `.row-tre border-left`, `.row-critical td.col-ten dark bg`). Giữ chỉ `.row-done` opacity 0.55 + hover `#1F2D45`.
  - **Thêm HOT badge animated** với keyframes `hot-pulse` (scale 1.04 + box-shadow ring expand). 3 variant:
    - `.hb-critical` — đỏ mạnh + animation (CAO + trễ)
    - `.hb-tre` — vàng cam + animation (chỉ trễ)
    - `.hb-cao` — đỏ tĩnh không nhấp nháy (chỉ CAO chưa trễ)
  - **renderKT**: thêm HOT badge vào đầu cột "Tên máy" theo logic: CAO+trễ → 🔥 HOT, chỉ trễ → ⏰, chỉ CAO → CAO mini-pill.
  - **renderHS re-apply** (full redesign): summary chips 5 cái (✓ done, 🚧 vướng, ⏰ trễ, 🔴 CAO, ↻ reset) + block 💰 Tổng giá trị + view toggle Kanban/Bảng + filter row 8 thứ + Kanban card có CB + vướng mắc inline + Bảng đầy đủ + HOT badge cho cả Kanban và Bảng. Sort priority + row-done opacity.
  - Filter chip "tre" giờ post-filter dùng selector `.hot-badge.hb-critical, .hot-badge.hb-tre` thay vì class row-tre/critical.
- **Hành động cần làm ở phiên tiếp theo:** User dán lại `AppScript_v2_7.gs` vào Apps Script + Deploy New version. Verify:
  1. Tab KT: row CAO+trễ có 🔥 HOT badge nhấp nháy ở đầu Tên máy, không còn bg lệch màu.
  2. Tab HS: hiện summary chips + Pipeline có CB phụ trách + có thể switch sang Bảng đầy đủ.

---

### [01/05/2026 - 13:00] | AI: Claude (Cowork) — v2.7.4 Tab Hồ sơ redesign (BỊ MẤT do truncate, re-apply ở v2.7.5)
- **Mục tiêu phiên:** Tối ưu giao diện màn Hồ sơ theo cùng style Tab Kỹ thuật (summary chips + filter gộp + view toggle Kanban/Bảng).
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs`.
- **Tính năng / Lỗi đã xử lý:**
  - Backend `getHoSo()` trả thêm `cbList[]` unique (CB phụ trách + CB phối hợp), sort tiếng Việt.
  - Frontend `renderHS()` redesign hoàn toàn:
    - **Summary strip 5 chips clickable**: ✓ Hoàn thành (X/Y + %), 🚧 Vướng mắc, ⏰ Trễ deadline, 🔴 Ưu tiên CAO, ↻ Reset. Plus block 💰 Tổng giá trị dự toán hiển thị bên phải.
    - **View toggle**: 🗂 Pipeline (Kanban) ↔ 📋 Bảng đầy đủ. Tab segmented kiểu pill.
    - **Filter row gộp**: search + Cơ sở + Khoa + **CB** + Trạng thái + Hình thức LCNT + Cấp độ + toggle Ẩn HT + counter.
    - **Kanban cards mới**: card có border-left color theo severity (critical/cao/tre); hiện 👤 CB phụ trách dưới meta; nội dung vướng mắc hiện inline italic; mã HS có badge "CAO" mini-pill nếu ưu tiên cao; khoa truncate 18 ký tự + tooltip full.
    - **Bảng mới**: thay vì chỉ list "vướng mắc" như cũ, giờ list **TOÀN BỘ HS**. Pin "Mã + Nội dung" trái, pin "Cấp độ" + "HT". Cột giá trị dự toán hiển thị fmtVnd. Sort: CAO → trễ → đang xử lý → đã HT. Row coloring critical/cao/tre/done.
  - CSS thêm: `.hs-budget`, `.hs-view-toggle`, `.hs-vbtn` segmented, `.kanban-card.card-critical/cao/tre`, `.kanban-cb`, `.kanban-vuong`, `.kt-chip.green` (cho chip "hoàn thành" motivate).
  - Filter chip "vuong" + "tre" có post-filter để ẩn rows không match (giữ lại UI smooth).
- **Hành động cần làm ở phiên tiếp theo:** User dán lại `AppScript_v2_7.gs` vào Apps Script + Deploy New version. Verify: 5 chips ở đầu, switch Kanban/Bảng smooth, click chip filter đúng, CB phụ trách hiện trên kanban-card.

---

### [01/05/2026 - 12:30] | AI: Claude (Cowork) — Hotfix v2.7.3 (nút Đóng modal không hoạt động)
- **Mục tiêu phiên:** User report nút "Đóng" trên modal không hoạt động (chỉ Esc + click backdrop hoạt động).
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs` (5 chỗ).
- **Tính năng / Lỗi đã xử lý:**
  - **Bug root cause:** Inline `onclick` dùng nested double quotes — sau khi qua 2 lớp escape (JS string trong .gs → JS string trong HTML script), HTML attribute parser thấy: `onclick="document.getElementById("modal")...` — quote thứ 2 đóng attribute sớm, JS bị truncate thành `document.getElementById(` → click không làm gì.
  - **Fix:** Thay đổi inline JS dùng **single quotes** (apostrophe) thay cho double quotes: `onclick="document.getElementById('modal').classList.remove('show')"`. Apostrophes trong double-quoted attribute là literal — browser parse đúng.
  - 5 chỗ fix: `openDetail()` modal close (2 chỗ Mở Sheet + Đóng), `openGenericRow()` modal close (2 chỗ), `openKhoaModal()` modal close.
  - Esc + click backdrop vẫn hoạt động bình thường (đã có handler `document.addEventListener("keydown")` và `$("#modal").onclick`).
- **Hành động cần làm ở phiên tiếp theo:** User dán lại `AppScript_v2_7.gs` vào Apps Script + Deploy New version.

---

### [01/05/2026 - 12:00] | AI: Claude (Cowork) — Hotfix v2.7.2 (Hot list groupby)
- **Mục tiêu phiên:** User feedback: "mục top 10 điểm nóng tư duy có thể phân chia theo từng nhóm để cũng dễ nắm được và có phương án triển khai" — chia top hot theo team (KT/HS/Kho) thay vì list phẳng để sếp nắm được nhanh + có CB phụ trách để giao việc.
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs` (header subtitle bump v2.7.1 → v2.7.2 ngầm — vẫn giữ "v2.7.1" trong header để khớp deploy version, log ghi v2.7.2 nội bộ).
- **Tính năng / Lỗi đã xử lý:**
  - Backend `_topHot()`: thêm field `cb` vào KT items + HS items (CB phụ trách). Subtitle KT giờ có thêm cơ sở rút gọn (CS1/CS2/CS3). Bỏ `slice(limit)` ở backend — frontend group rồi take top theo team.
  - Frontend `renderOverview()` hot section thay vì 1 grid phẳng → chia 3 cột theo team: 🔧 Kỹ thuật (top 5), 📁 Hồ sơ (top 4), 📦 Kho (top 4). Mỗi cột có:
    - Header với icon + tên team + số điểm
    - Border-top màu theo severity (đỏ/vàng/cam)
    - Card item: số thứ tự + title (2 line clamp) + badge severity + subtitle (📍 khoa·CS) + detail (2 line clamp) + 👤 CB phụ trách
    - Footer "+ N điểm nữa — click để xem tab chi tiết" — click switch sang tab tương ứng
  - CSS mới: `.hot-by-team` grid 3 cột (collapse 1 cột ở <1100px), `.hot-team-col` border-top color, `.hot-item-cb` highlight CB với icon 👤 + màu vàng.
- **Lý do thiết kế chia 3 cột:** Sếp scan trái-phải theo team thay vì đọc list dài; mỗi team có CB phụ trách hiện ngay → có thể giao việc tại chỗ; click vào card để xem chi tiết, hoặc "+ N điểm nữa" để xem full tab tương ứng.
- **Hành động cần làm ở phiên tiếp theo:** User dán lại `AppScript_v2_7.gs` vào Apps Script + Deploy New version. Verify mục Top hot có 3 cột theo team, mỗi card hiện CB phụ trách.

---

### [01/05/2026 - 11:30] | AI: Claude (Cowork) — Hotfix v2.7.1
- **Mục tiêu phiên:** 2 hotfix sau khi user deploy v2.7:
  1. Chip "Đề xuất thanh lý" hiện 0 trong khi thực tế có 18 máy.
  2. Sau ~60s không tương tác, các tab tự refresh khiến filter bị reset (cảm giác "về màn hình chính").
- **File đã thay đổi:** Patch trực tiếp `AppScript_v2_7.gs` (không tạo file mới, header subtitle bump v2.7 → v2.7.1).
- **Tính năng / Lỗi đã xử lý:**
  - Bug 1: Vòng đếm chip dùng `if(r.ht) return` ngay đầu loop → skip mọi máy đã HT. Nhưng máy thanh lý đều được tick HT (vì KT coi "đề xuất thanh lý" = đã xong việc của họ). Fix: di chuyển check `thanh lý++` LÊN TRƯỚC dòng skip HT, các chip khác giữ nguyên skip.
  - Bug 2: `setInterval(loadView, 60000)` reload mọi tab → filter ở Kỹ thuật/Hồ sơ/VTTH bị reset. Fix: chỉ auto-refresh khi `currentView==="overview"` và không có modal đang mở. Tăng interval 60s → 120s. Các tab khác giờ chỉ refresh thủ công qua nút 🔄.
- **Hành động cần làm ở phiên tiếp theo:** User dán lại `AppScript_v2_7.gs` đã hotfix vào Apps Script, Deploy New version (description: `v2.7.1 hotfix`).

---

### [01/05/2026 - 09:00] | AI: Claude (Cowork)
- **Mục tiêu phiên:** Redesign giao diện theo phong cách executive dashboard (mẫu Base.vn). User feedback: "giao diện sẽ là chỗ đắt tiền mà sếp nhìn vào thấy chuyên nghiệp hay không. nhìn là nắm được, muốn chi tiết thì sẽ click vào." Đồng thời xử lý 4 vấn đề: (1) khoa ở nhiều cơ sở GMHS/CĐHA/NS-TDCN bị gộp, (2) hiện X/Y format motivate completion, (3) filter theo CB, (4) tab KT trông pro hơn.
- **File đã thay đổi:** Tạo mới `AppScript_v2_7.gs` (3425 dòng, 187 KB) + `HuongDan_Deploy_WebApp_v2_7.md`. Cập nhật `HANDOFF.md`, `CLAUDE.md`, `docs/SESSION_LOGS.md`.
- **Tính năng / Lỗi đã xử lý:**
  - **Backend `_aggKhoa()`** đổi key đơn → composite `Khoa · Cơ sở` (rút gọn "Cơ sở X" → "CSX"). Bar chart top khoa giờ tách đúng từng cơ sở. Trả về `{key, khoa, coso, label, count}`.
  - **Backend `getKyThuat()`** trả thêm `cbList[]` unique từ cột CB phụ trách + CB Hồ sơ phối hợp, sort theo locale "vi".
  - **Backend `getByKhoa(khoaName, cosoFilter)`** accept tham số cơ sở để filter cả khoa + cơ sở khi user click bar.
  - **Frontend Tổng quan KPI cards mới**: 4 cards format `X / Y` + progress bar gradient (đỏ <30%, vàng 30-70%, xanh >70%) + chips cảnh báo (CAO/trễ/vướng/đang sửa/đề xuất TL) + hover lift effect + click cả card switch sang tab tương ứng. Card Kho dùng "X/Y an toàn" (mã XANH/total).
  - **Frontend bar chart** "Khoa × Cơ sở nóng nhất" với composite label, click bar → modal khoa pass cả `khoa` + `coso`.
  - **Frontend tab KT redesign**:
    - Summary strip: 4 chips clickable (`🛠 đang sửa`, `⏰ trễ`, `🔴 CAO`, `♻ TL`) + nút `↻ Tất cả` reset.
    - Filter row gộp 1 hàng: search + 5 dropdown (Cơ sở, Khoa, **CB**, Tình trạng, Cấp độ) + 2 toggle inline + counter `X / Y máy`.
    - Bảng pin cột Cấp độ + HT sang trái sau Tên máy. Header "Khoa · Cơ sở" gộp.
    - Sort priority: CAO → trễ → đang xử lý → đã HT.
    - Row coloring: `.row-critical` (CAO+trễ, nền đỏ), `.row-cao` (viền trái đỏ), `.row-tre` (viền trái vàng), `.row-done` (opacity 55%).
    - Search box giờ tìm cả qua CB/CB-HS/Bước/Vướng mắc.
  - **CSS premium**: `.kpi-card` gradient bg + box-shadow + transform on hover, `.kpi-progress` gradient fill animation 0.6s, `.kpi-chips` bordered-left color, `.kt-chip` pill-style với active state, `.tbl-kt` sticky col + tinted bg cho critical row.
  - **Header version** v2.6 → v2.7 với subtitle "KPI redesign".
- **Hành động cần làm ở phiên tiếp theo:**
  - User dán `AppScript_v2_7.gs` vào Apps Script và Deploy New version.
  - Verify 5 chỗ theo `HuongDan_Deploy_WebApp_v2_7.md` mục 3.
  - Apply pattern KPI/summary chips cho tab Hồ sơ + VTTH ở v2.8 nếu user thấy v2.7 ổn.
  - Push Git remote.

---

### [01/05/2026 - 21:30] | AI: Claude (Cowork)
- **Mục tiêu phiên:** Tối ưu performance v2.5 — user phản ánh load 30-40s mỗi click tab/modal vì backend rebuild link index từ 6 tab Sheets API mỗi call.
- **File đã thay đổi:** Tạo mới `AppScript_v2_6.gs` (3221 dòng, 174 KB) + `HuongDan_Deploy_WebApp_v2_6.md`. Cập nhật `HANDOFF.md`, `CLAUDE.md`, `docs/SESSION_LOGS.md`.
- **Tính năng / Lỗi đã xử lý:**
  - **Cache layer**: Wrap `_buildLinkIndex()` với CacheService (TTL 5 phút). Original hàm rename thành `_buildLinkIndexRaw()`. Implement split-key chunking (90KB/chunk) để vượt giới hạn 100KB của CacheService.
  - **Lazy-load tab Kho**: Bỏ enrich `vt[]/hs[]/queue[]` per-row trong `getKho()`. Thêm endpoint mới `getKhoDetail(idVT)` lazy fetch khi user click expand.
  - **Bỏ cột 📦 Kho trong tab VTTH**: Tab này chứa task quản lý không phải item kho — match 1-1 không có ý nghĩa, luôn `—`. Thay bằng section "Mặt hàng kho cùng loại/khoa" trong modal VT (`relatedKho` smart match qua tokens + khoa).
  - **Nút 🔄 Refresh** ở header — gọi `invalidateLinkIndex()` + reload current view khi user muốn force-fresh ngay.
  - **Auto-invalidate cache**: hook vào `onEdit(e)` — khi user sửa 1 trong 6 watched tabs (KT/HS/VT/MAP/5A/5B) → invalidate. User edit → click tab → data mới ngay (không đợi 5 phút TTL).
  - **Warm cache trigger**: hàm mới `warmCache()` + trigger time-based mỗi 5 phút trong `setupTriggers()`. Đảm bảo cache luôn nóng.
  - **Bonus**: search global giờ tìm thêm trong Kho 5A.
- **Vấn đề gặp phải:** Edit tool truncate file v2.6 mid-byte ở line 3121 (Vietnamese UTF-8 char "Bư" bị cắt) → recover bằng cách `head -3120 v2.6 + awk NR>=2925 v2.5 > merged`. Bài học: file `.gs` >150KB phải dùng Python `assert old in s; replace(old,new,1)` patch atomic, không dùng Edit tool nữa.
- **Hành động cần làm ở phiên tiếp theo:**
  - User dán `AppScript_v2_6.gs` vào Apps Script và Deploy New version (URL Web App giữ nguyên).
  - **BẮT BUỘC** chạy `setupTriggers()` để cài trigger `warmCache` mỗi 5 phút (nếu không cache không tự warm).
  - Verify: tốc độ click tab giờ <2s sau lần đầu; lazy expand ở tab Kho mất ~1-2s/row; nút Refresh hoạt động; modal VT có "Mặt hàng kho cùng loại/khoa".
  - Push lên Git remote.

---

### [30/04/2026 - 18:00] | AI: Claude (Cowork)
- **Mục tiêu phiên:** Hoàn thiện chuỗi liên kết Kho ↔ VT ↔ HS theo yêu cầu user — "tổ kho thường sẽ liên kết với nhóm vật tư tiêu hao-hóa chất vì mua sắm rồi tổ kho cấp phát cũng cần phải móc nối", mục tiêu là một cỗ máy đồng bộ 4 tổ.
- **File đã thay đổi:** Tạo mới `AppScript_v2_5.gs` (3008 dòng), `HuongDan_Deploy_WebApp_v2_5.md`. Cập nhật `HANDOFF.md`, `CLAUDE.md`, `docs/SESSION_LOGS.md`.
- **Tính năng / Lỗi đã xử lý:**
  - Backend `getDetail("HS")` enrich mỗi VT trong gói thầu với `kho` (stock 5A + queue 5B).
  - Backend `getVTTH()` enrich mỗi row với `kho` mini (qua `_resolveKhoForVt`).
  - Backend `getKho()` enrich mỗi mặt hàng 5A với `vt[]`, `hs[]` (qua VT→HS), `queue[]`, `queueOpen`. Thêm cột Mã VTTH cho 5B.
  - Backend `searchAll()` thêm tìm trong Kho 5A theo mã/tên/khoa YC nhiều nhất.
  - Backend `getLinkedChains()` trả thêm `khoChains[]` — chuỗi Kho-driven (5A ĐỎ/VÀNG → VT khớp → HS mua sắm) sort theo severity.
  - Frontend `renderVT()` thêm cột "📦 Kho" với mini badge stock-pill.
  - Frontend `renderKho()` thay table flat bằng table có expand inline (3 cột: VT/HS/Queue 5B). Click row toggle expand. Shift+click vẫn mở Sheet.
  - Frontend `renderLienket()` thêm section "📦 Mạch Kho → Vật tư → Mua sắm" sau danh sách chuỗi vướng mắc cũ.
  - CSS: thêm `.kho-card`, `.kho-mini`, `.mini-pill`, `.stock-pill.{red,yellow,orange,green,blue,gray}`, `.kho-expand-wrap`, `.kho-link-card`, `.kho-queue-line`, `.kho-expand-action`. Header version v2.4 → v2.5.
  - Validate: `node --check` pass (đã đổi đuôi .gs → .js để chạy).
- **Hành động cần làm ở phiên tiếp theo:**
  - User dán `AppScript_v2_5.gs` vào Apps Script và Deploy New version (URL Web App giữ nguyên).
  - Verify 4 chỗ: cột Kho ở tab VTTH, expand inline ở tab Kho 5A, section khoChains ở tab Liên kết, thẻ Kho cho từng VT trong modal HS.
  - Đồng bộ Mã VTTH giữa tab 4.VTHC, 5A, 5B nếu cột Kho hiện `—` toàn bộ (xem mục 4 trong `HuongDan_Deploy_WebApp_v2_5.md`).
  - Push lên Git remote.
- **Bài học:** File .gs ~150 KB lớn, Edit tool có thể truncate nếu old_string không đủ unique → dùng Python script `assert old in s; s = s.replace(old, new, 1)` để patch atomic. Đã ghi note này trong CLAUDE.md.

---

### [30/04/2026 - 15:40] | AI: Antigravity
- **Mục tiêu phiên:** Xử lý lỗi Web App không load được dữ liệu, nâng cấp tính năng Deep Link cho Hot Issues.
- **File đã thay đổi:** Cập nhật `AppScript_v2_4.gs`, `HANDOFF.md`, `docs/SESSION_LOGS.md`.
- **Tính năng / Lỗi đã xử lý:**
  - Fix lỗi logic render khiến frontend bị treo khi gặp dữ liệu null/undefined.
  - Bổ sung trường `linkType`, `linkId`, `linkTab` cho Hot Issues để click mở đúng Sheet.
  - Cập nhật HANDOFF để AI phiên sau nắm được version mới nhất là v2.4.
- **Hành động cần làm ở phiên tiếp theo:** Push toàn bộ thay đổi lên Git theo yêu cầu của User.

### [30/04/2026 - 13:45] | AI: Antigravity
- **Mục tiêu phiên:** Thiết lập hàng rào kỹ thuật, chuẩn hóa quy trình phối hợp nhiều AI cùng code (Claude & Antigravity).
- **File đã thay đổi:** Tạo mới `AGENTS.md`, `docs/SESSION_LOGS.md`, cập nhật `CLAUDE.md`.
- **Tính năng / Lỗi đã xử lý:** Áp dụng bộ quy chuẩn làm việc theo mô hình của ClaudeKit Engineer, yêu cầu tư duy trước khi code, sửa đúng điểm, và bắt buộc ghi nhận trạng thái cuối session.
- **Hành động cần làm ở phiên tiếp theo:** Sẵn sàng tiếp nhận yêu cầu phát triển mới từ User với các quy trình đã được thiết lập chặt chẽ.
