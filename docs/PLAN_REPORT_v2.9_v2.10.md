# 📋 PLAN — Tính năng Báo cáo & Email (v2.9 + v2.10)

> Ghi log kế hoạch chi tiết theo yêu cầu user (anh Bonito) — 02/05/2026.
> Plan triển khai theo 3 phase, mỗi phase có checklist tracking.

---

## 🎯 Mục tiêu tổng thể

App giao ban hiện đã có dashboard đẹp (v2.7+) và logic dự đoán cung ứng (v2.8.1) nhưng **thiếu hẳn tính năng báo cáo + email chuyên nghiệp**. User feedback chốt:

1. **Email morning brief hiện gửi link Google Sheet** → bất tiện vì xem điện thoại lúc giao ban không scroll được, không có dashboard view.
   - **Giải pháp:** Đổi link → Web App URL `/exec` để mở dashboard mobile-friendly.

2. **Email content chưa chi tiết** — chỉ có số đếm tổng quan, không có tên mặt hàng cụ thể.
   - **Giải pháp:** Section forecast cung ứng phải kèm tên VTTH + DOH chi tiết (top 3-5).

3. **Tab Tổng quan card Kho hiện chưa hữu ích** — "0 đỏ · 0 vàng · 0 YC chờ" không phản ánh đúng mối quan tâm của sếp.
   - **Giải pháp:** Card Kho redesign — sếp quan tâm:
     - Hàng nào sắp hết (Mức 1, Mức 2)
     - Hàng nào cần gấp (chưa có gói thầu)
     - Hàng nào tồn đọng cần xử lý

4. **Chưa có tab "Báo cáo" trong app** — không thể tạo báo cáo theo yêu cầu, không export Excel/PDF.
   - **Giải pháp:** Tab mới với 5+ loại báo cáo, filter, preview, 3 actions (gửi email/in PDF/tải Excel).

5. **Chưa có báo cáo định kỳ tự động** — chỉ có brief sáng + flag hot issues.
   - **Giải pháp:** Trigger weekly (thứ 6 16h) + monthly (ngày 1 đầu tháng).

---

## 📊 Phase A — Email & KPI Kho cải tiến (v2.9)

> Ưu tiên cao nhất, làm trước. Tác động trực tiếp đến giao ban hàng ngày của sếp.

### A1. Tab Kho KPI card Tổng quan redesign

**Trạng thái:** ⏳ Chờ code

**Hiện tại:**
```
4. KHO — TỒN & YÊU CẦU
0
🔴 Mã ĐỎ: 0
🟡 Mã VÀNG: 0
🟢 Mã XANH: 0
YC chờ tiếp nhận: 0
🚨 YC CAO chưa cấp: 0
```

**Sau redesign:**
```
📦 Kho                    [↗ Xem chi tiết]
3 / 52
██░░░░░░░░ 5.7% an toàn
🚨 3 sắp hết · ⚠ 2 cần mua gấp · 📦 5 tồn đọng
↗ Click card → tab Kho có forecast đầy đủ
```

**Backend changes:**
- `getOverview()` cards.kho thêm: `forecastSummary: {l1, l2, noSolution, stagnantLong}`

**Frontend changes:**
- Render KPI card "Kho" với chips dạng "🚨 X sắp hết · ⚠ Y cần mua gấp · 📦 Z tồn đọng"

---

### A2. Email `sendMorningBrief()` redesign

**Trạng thái:** ⏳ Chờ code

**Yêu cầu:**
- ✅ HTML mobile-responsive (table-based layout)
- ✅ Header có logo / branding phòng VT-TBYT
- ✅ CTA button to lớn "📱 Mở dashboard giao ban" → link Web App
- ✅ 4 section tổng quan KT/HS/VT/Kho — format X/Y + cảnh báo
- ✅ Section "🚨 Cảnh báo cung ứng" — top 5 mặt hàng Mức 1 + tồn đọng >1 năm với tên + DOH cụ thể
- ✅ Section "🔥 Top 5 điểm nóng" — KT/HS/Kho hot list với tên + CB + trễ
- ✅ Footer có ngày giờ + version
- ✅ Link Web App lấy từ `ScriptApp.getService().getUrl()`

**Template đề xuất:**
```html
<table style="max-width:600px;margin:0 auto;font-family:Arial;color:#333;">
  <!-- Header -->
  <tr><td style="padding:20px;background:#1F4E78;color:#fff;text-align:center;">
    <h1>🌅 GIAO BAN SÁNG</h1>
    <div>Phòng VT-TBYT — Bệnh viện K — 02/05/2026</div>
  </td></tr>

  <!-- CTA Button -->
  <tr><td style="padding:20px;text-align:center;">
    <a href="{{WEB_APP_URL}}" style="display:inline-block;padding:14px 28px;
      background:#3B82F6;color:#fff;border-radius:8px;text-decoration:none;
      font-weight:600;font-size:16px;">
      📱 Mở dashboard giao ban đầy đủ →
    </a>
  </td></tr>

  <!-- 4 KPI rows -->
  <tr><td style="padding:14px;">
    🔧 <b>Kỹ thuật:</b> 19/46 (41%) · 22 đang sửa · 21 CAO · 3 trễ
  </td></tr>
  <tr><td style="padding:14px;background:#F9FAFB;">
    📁 <b>Hồ sơ:</b> 6/106 (5.7%) · 13.75 tỷ · 17 CAO · 12 vướng · 13 trễ
  </td></tr>
  ...

  <!-- Cảnh báo cung ứng -->
  <tr><td style="padding:18px;background:#FEE2E2;border-left:4px solid #DC2626;">
    <h3 style="color:#7F1D1D;">🚨 CẢNH BÁO CUNG ỨNG</h3>
    <ul>
      <li><b>Hóa chất ABC</b> · DOH 5n · CHƯA CÓ gói thầu → triển khai chỉ định thầu NGAY</li>
      <li><b>Vật tư XYZ</b> · DOH 12n · HS-024 (Khuất Văn Huy, Đang chuẩn bị) → đôn đốc</li>
      <li>...</li>
    </ul>
  </td></tr>

  <!-- Top hot -->
  <tr><td>
    <h3>🔥 TOP 5 ĐIỂM NÓNG HÔM NAY</h3>
    <ol>
      <li>🔧 Kính hiển vi · Khoa Xét nghiệm · Trễ 22n · CB Đỗ Công Chính</li>
      ...
    </ol>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:14px;text-align:center;color:#9CA3AF;font-size:12px;">
    Giao ban tự động · Phòng VT-TBYT · v2.9
  </td></tr>
</table>
```

---

### A3. `flagHotIssues()` redesign cùng template

**Trạng thái:** ⏳ Chờ code

- Đồng bộ template với morning brief — nhưng ngắn hơn (chỉ Top 5 hot, không có summary 4 tổ).
- Header đổi từ "🌅 GIAO BAN SÁNG" → "⚠ CẬP NHẬT GIỜ X" (8h/11h/14h/17h).
- Vẫn link Web App.

---

### A4. Nút "📧 Gửi email báo cáo ngay" trong header

**Trạng thái:** ⏳ Chờ code

- Vị trí: cạnh nút 🔄 Refresh ở góc phải header
- Click → confirm dialog "Gửi email báo cáo giao ban cho [danh sách]?"
- OK → gọi `google.script.run.sendReportNow()` → backend gửi email morning brief ngay (không phải đợi 7h sáng)
- Toast hiện "✓ Đã gửi" hoặc "⚠ Lỗi"
- Disable button trong 30s sau khi gửi để tránh spam

**Use case:** Sếp họp gấp lúc 14h muốn gửi báo cáo cập nhật ngay → click 1 nút.

---

### A5. Tab `cfg_emails` + bootstrap

**Trạng thái:** ⏳ Chờ code

**Cấu trúc tab `cfg_emails`:**
| STT | Loại báo cáo | Tên người nhận | Email | Active |
|---|---|---|---|---|
| 1 | morning_brief | Anh Bonito | ducphamhn01@gmail.com | ✓ |
| 2 | morning_brief | Trưởng tổ KT | ... | ✓ |
| 3 | weekly | Trưởng phòng | ... | ✓ |
| 4 | monthly | Lãnh đạo BV | ... | ✓ |
| 5 | forecast | Tổ Vật tư | ... | ✓ |
| 6 | ton_dong | Anh Bonito + LĐ | ... | ✓ |

**Loại báo cáo:**
- `morning_brief` — gửi 7-8h sáng + manual button
- `weekly` — gửi thứ 6 16h
- `monthly` — gửi ngày 1 đầu tháng
- `forecast` — gửi tổ Vật tư (báo cáo cung ứng riêng — Phase B)
- `ton_dong` — gửi lãnh đạo (báo cáo tồn đọng đề xuất xử lý — Phase B)
- `flag_hot` — gửi cảnh báo 4 lần/ngày

**Backend:**
- `_getEmailRecipients(type)` đọc từ tab `cfg_emails`, filter Active=true.
- Fallback: nếu tab rỗng hoặc không tìm thấy → trả về `["ducphamhn01@gmail.com"]`.
- `bootstrap()` tự thêm tab `cfg_emails` với row mặc định nếu chưa có.

---

## 📊 Phase B — Tab "Báo cáo" trong app (v2.9 hoặc v2.10)

> Sau khi Phase A ổn, làm tiếp.

### B1. Tab mới "📊 Báo cáo" trên thanh nav

**Trạng thái:** ⏳ Chờ code

- Tab thứ 7 sau Theo Khoa / Liên kết
- Layout: bên trái danh sách loại báo cáo, bên phải preview

---

### B2. 5 loại báo cáo có sẵn

| # | Tên báo cáo | Nội dung | Khi nào gửi |
|---|---|---|---|
| 1 | 📅 Giao ban hôm nay | 4 tổ + Top hot + Forecast cung ứng | Mỗi sáng / theo yêu cầu |
| 2 | 📊 Tuần này | Tiến độ tuần KT/HS/VT/Kho + so sánh tuần trước | Thứ 6 16h |
| 3 | 📈 Tháng này | Tổng kết tháng + biểu đồ trend | Đầu tháng |
| 4 | 🔮 Báo cáo cung ứng | Forecast 4 mức + recommendation | Theo yêu cầu / weekly |
| 5 | 📦 Báo cáo tồn đọng | Mặt hàng tồn >90n cần xử lý | Theo yêu cầu / monthly |

---

### B3. Filter báo cáo

- Khoa (multi-select)
- Cơ sở (CS1/CS2/CS3)
- CB phụ trách (multi-select)
- Tổ (KT/HS/VT/Kho)
- Date range (cho weekly/monthly)

---

### B4. Preview HTML formatted

- Hiển thị trong app dạng iframe hoặc div
- CSS print-friendly (sẵn sàng để in PDF)
- Watermark "Phòng VT-TBYT — BV K" mờ ở góc

---

### B5. 3 Actions

1. **📧 Gửi email** — gửi cho danh sách trong cfg_emails theo loại
2. **📄 In PDF** — `window.print()` với CSS @media print tối ưu
3. **📊 Tải Excel** — gọi backend tạo Spreadsheet tạm rồi trả URL download

---

### B6. Báo cáo cung ứng riêng

- Forecast 4 mức + 3 mức tồn đọng đầy đủ
- Khuyến nghị action cho từng mặt hàng
- Gửi cho tổ Vật tư hàng tuần
- Có cột "CB nên xử lý" để giao việc

---

### B7. Báo cáo tồn đọng

- Top mặt hàng tồn đọng > 90n
- Phân loại theo tier (3-6 tháng / 6 tháng-1 năm / >1 năm)
- Có cột "Đề xuất xử lý" (chuyển khoa / điều chuyển / thanh lý)
- Form ký duyệt sẵn để gửi lãnh đạo

---

## 📊 Phase C — Báo cáo định kỳ tự động (v2.10)

> Sau Phase B ổn, tự động hoá.

### C1. Trigger weekly

- Thứ 6 16h → `sendWeeklyReport()`
- Nội dung: tổng kết tuần (so sánh với tuần trước)

### C2. Trigger monthly

- Ngày 1 mỗi tháng → `sendMonthlyReport()`
- Nội dung: KPI tháng + biểu đồ trend

### C3. Setup triggers tự động trong `setupTriggers()`

- Bổ sung 2 trigger mới
- Update bootstrap để cài

### C4. Log lịch sử gửi email — tab `log_email`

- Cột: STT | Loại báo cáo | Người nhận | Thời gian gửi | Trạng thái | Nội dung tóm tắt
- Append mỗi khi gửi email

---

## ✅ Checklist tổng

### Phase A (5 mục) — ưu tiên làm trước
- [ ] A1: Tab Kho KPI card Tổng quan redesign
- [ ] A2: Email sendMorningBrief redesign HTML + Web App link
- [ ] A3: flagHotIssues redesign template
- [ ] A4: Nút "📧 Gửi email báo cáo ngay" trong header
- [ ] A5: Tab cfg_emails + bootstrap

### Phase B (7 mục) — sau Phase A
- [ ] B1: Tab "📊 Báo cáo" trên nav
- [ ] B2: 5 loại báo cáo có sẵn
- [ ] B3: Filter báo cáo
- [ ] B4: Preview HTML formatted
- [ ] B5: 3 actions (Email / PDF / Excel)
- [ ] B6: Báo cáo cung ứng riêng
- [ ] B7: Báo cáo tồn đọng riêng

### Phase C (4 mục) — auto
- [ ] C1: Trigger weekly thứ 6 16h
- [ ] C2: Trigger monthly ngày 1
- [ ] C3: setupTriggers() bổ sung
- [ ] C4: Log lịch sử tab log_email

---

## 🔗 Tham chiếu

- HANDOFF.md mục 9 — snapshot trạng thái hiện tại
- HuongDan_Deploy_WebApp_v2_*.md — hướng dẫn deploy theo từng version
- SESSION_LOGS.md — log từng phiên Claude/Antigravity

---

**Người lên plan:** Claude (Cowork) · 02/05/2026 16:45
**Người duyệt:** anh Bonito (chốt qua chat)
