# CLAUDE.md — AI auto-load context

> Tài liệu này được Claude Code / Cowork / AI assistants tự động load khi làm việc trong repo. Đừng xóa.

## ĐỌC TRƯỚC TIÊN

**Mọi AI session mới BẮT BUỘC đọc `HANDOFF.md` trước khi sửa code.** File đó tóm tắt toàn bộ ngữ cảnh trong 5 phút.

## Tóm tắt nhanh

- Dự án: Dashboard giao ban Apps Script cho phòng Vật tư – Thiết bị Y tế, BV K.
- User: anh Bonito (ducphamhn01@gmail.com), trưởng phòng. Tiếng Việt, thẳng.
- Phiên bản hiện tại: `AppScript_v2_7.gs` (~3425 dòng, ~187 KB) — KPI redesign + Multi-cơ sở. Composite key Khoa·Cơ sở cho `_aggKhoa()`. 4 KPI cards Tổng quan format X/Y + progress gradient + chips + hover lift + click switch tab. Tab KT redesign: summary strip 4 chips clickable, filter row gộp + CB dropdown, pin Cấp độ + HT, row coloring (critical/cao/tre/done). Kế thừa v2.6 cache 5 phút + lazy-load.
- Web App URL deployed (giữ nguyên qua các bản): user sẽ paste khi cần.

## Quy tắc vàng (đừng phá)

1. **Header-based column lookup** qua `_findCol(headers, ...candidates)`. KHÔNG hardcode index cột.
2. Tạo file mới khi nâng cấp: `AppScript_vX_Y.gs` + `HuongDan_Deploy_WebApp_vX_Y.md`. Giữ file cũ.
3. Deploy: luôn "Manage deployments → New version" trên deployment cũ → URL không đổi.
4. Click-to-Sheet deep link: `https://docs.google.com/spreadsheets/d/{ID}/edit#gid={gid}&range=A{row}` — tính năng KEY từ v2.2.
4b. (v2.3) Cross-link KT↔VT↔HS qua junction table `MAP_LIENKET` + cột "Liên kết X" trong từng tab. Bootstrap tự thêm cột + auto-gen ID idempotent.
4c. (v2.5) Kho 5A/5B nối vào chuỗi: backend `_resolveKhoForVt()` enrich VT với `{stock, queue}`; `getKho()` enrich mỗi 5A row với `vt[]/hs[]/queue[]/queueOpen`; `getLinkedChains()` trả thêm `khoChains[]`. Match Kho ↔ VT qua **Mã VTTH** (primary) hoặc **Tên VTTH** (fuzzy fallback).
5. Dark theme `#0F1B2D` cho phòng họp, đừng đổi.
6. Sau khi sửa code: `node --check` syntax → cập nhật HANDOFF.md "Lịch sử các phiên bản" → commit.

## Workflow chuẩn cho mỗi yêu cầu sửa

```
1. Đọc HANDOFF.md mục 4 (mục tiêu cốt lõi) + mục 7 (cấu trúc tab Sheet) + AGENTS.md
2. Copy AppScript_v2_7.gs → AppScript_v2_X.gs (bản mới — đừng sửa file cũ)
3. Sửa từng đoạn nhỏ, validate node --check (đổi đuôi .gs → .js để check)
4. Viết HuongDan_Deploy_WebApp_v2_X.md
5. Cập nhật HANDOFF.md (lịch sử phiên bản, tình trạng hiện tại)
6. Append log vào docs/SESSION_LOGS.md
7. git add . && git commit -m "v2.X: ..." && git push
8. Đưa user 2 dòng deploy: "Apps Script → dán code → Deploy → Manage → ✏️ → New version"
```

> **CẢNH BÁO:** Edit tool có thể truncate file lớn (~150 KB) khi old_string không đủ unique. Khi sửa nhiều đoạn liên tiếp, dùng Python script với `assert old_string in s` để tránh mất content.

## Đừng làm

- Đừng tự đổi tên/xóa tab Sheet.
- Đừng tạo dashboard nhiều màn rời rạc — user thích single page app, click drill-down.
- Đừng dài dòng trong response. User thích thẳng + ngắn.
- Đừng dùng emoji trừ khi user hỏi.

## Cấu trúc folder

```
.
├── HANDOFF.md                     # ⭐ ĐỌC TRƯỚC
├── CLAUDE.md                      # Tóm tắt hệ thống (File này)
├── AGENTS.md                      # ⭐ QUY TẮC ĐỒNG BỘ CÁC AI AGENT (Bắt buộc)
├── README.md                      # Cho người xem GitHub
├── AppScript_v2_7.gs              # ⭐ CURRENT
├── AppScript_v2_6.gs              # rollback gần
├── AppScript_v2_5.gs / v2_4.gs    # rollback xa hơn
├── AppScript_v2_3.gs / v2_2.gs    # rollback xa
├── AppScript_v2_1.gs / v2.gs      # rollback xa nhất
├── HuongDan_Deploy_WebApp_v2_7.md # deploy guide hiện tại
├── HuongDan_Deploy_WebApp_v2_6.md # deploy guide cũ
├── HuongDan_Deploy_WebApp_v2_5.md # deploy guide cũ hơn
├── BaoCaoGiaoBan_v2.xlsx          # template Excel (deprecated)
├── HuongDan_ThucThi.docx          # tài liệu nội bộ ban đầu
└── docs/                          # tài liệu phụ (PRD, SESSION_LOGS)
```
