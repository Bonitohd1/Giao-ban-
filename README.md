# Giao ban — Dashboard phòng VT-TBYT

Hệ thống số hoá cuộc giao ban đầu giờ sáng cho phòng **Vật tư – Thiết bị Y tế, Bệnh viện K**.

Chạy trên **Google Sheets + Google Apps Script** (không server, không cost), chiếu dashboard lên TV phòng họp với 6 view drill-down — click 1 phát mở thẳng dòng cần sửa trên Sheet.

---

## Mục tiêu

5 câu hỏi mỗi sáng giao ban phải trả lời được trong 30 giây:

1. Khoa nào đang nóng nhất?
2. Thiết bị nào đang hỏng, ai xử lý, đến đâu rồi?
3. Hồ sơ / gói thầu nào đang vướng, vướng khâu nào?
4. Vật tư hóa chất nào đang chậm cấp?
5. Mặt hàng nào sắp hết kho?

---

## Cấu trúc

```
Google Sheet ─── Apps Script ─── Web App URL ─── TV phòng họp
   (data)         (logic)          (/exec)         (display)
```

- **Source of truth**: 1 Google Sheet duy nhất với các tab `1. Kỹ Thuật`, `2. Hồ Sơ`, `4. VTHC`, `5A. Tổ kho - Tồn`, `5B. Tổ kho - Đề xuất` + tab `Dashboard` cho aggregator.
- **Logic**: `AppScript_v2_2.gs` (~1810 dòng) — bootstrap tabs, aggregator chạy mỗi 15 phút, email morning brief 7-8h, hot issue alerts 4 lần/ngày.
- **Display**: Web App đơn HTML page, dark theme `#0F1B2D`, 6 tab (Tổng quan / Kỹ thuật / Hồ sơ / VTTH / Kho / Theo Khoa), auto refresh 60s.

---

## Quick start

1. Mở Google Sheet `Giao_ban_Phong_VTTBYT_2025`.
2. Tiện ích mở rộng → Apps Script → dán nội dung `AppScript_v2_2.gs` → Save.
3. Menu Sheet → 📊 Giao ban → 🚀 Bootstrap (tạo tab lần đầu).
4. Menu Sheet → 📊 Giao ban → ⚙️ Cài đặt Triggers.
5. Apps Script → Deploy → New deployment → Web app → Anyone with the link → Deploy → copy URL `/exec`.
6. Mở URL trên Chrome máy phòng họp, F11 fullscreen.

Chi tiết đầy đủ: xem [HuongDan_Deploy_WebApp_v2_2.md](HuongDan_Deploy_WebApp_v2_2.md).

---

## Files

| File | Vai trò |
|---|---|
| `AppScript_v2_2.gs` | **Code hiện tại** — dán toàn bộ vào Apps Script |
| `AppScript_v2_1.gs` | Bản trước (giữ rollback) |
| `AppScript_v2.gs` | Bản đầu (giữ rollback) |
| `HuongDan_Deploy_WebApp_v2_2.md` | Hướng dẫn deploy bản hiện tại |
| `HANDOFF.md` | **Ngữ cảnh đầy đủ cho AI session sau** |
| `CLAUDE.md` | Auto-load cho Claude Code / AI assistants |
| `BaoCaoGiaoBan_v2.xlsx` | Template Excel (ít dùng từ khi có Web App) |
| `HuongDan_ThucThi.docx` | Tài liệu nội bộ ban đầu |
| `docs/` | Tài liệu phụ |

---

## Quy tắc nâng cấp

1. **Đừng sửa file cũ** — copy ra bản mới `AppScript_vX_Y.gs`.
2. **Header-based column lookup** — KHÔNG hardcode vị trí cột.
3. **Deploy New version** trên deployment cũ → URL không đổi → màn TV không phải làm gì.
4. Cập nhật `HANDOFF.md` mục "Lịch sử các phiên bản" sau mỗi bản.

Chi tiết: xem `CLAUDE.md`.

---

## License

Internal use — Bệnh viện K, phòng VT-TBYT.
