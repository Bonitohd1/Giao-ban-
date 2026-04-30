# CLAUDE.md — AI auto-load context

> Tài liệu này được Claude Code / Cowork / AI assistants tự động load khi làm việc trong repo. Đừng xóa.

## ĐỌC TRƯỚC TIÊN

**Mọi AI session mới BẮT BUỘC đọc `HANDOFF.md` trước khi sửa code.** File đó tóm tắt toàn bộ ngữ cảnh trong 5 phút.

## Tóm tắt nhanh

- Dự án: Dashboard giao ban Apps Script cho phòng Vật tư – Thiết bị Y tế, BV K.
- User: anh Bonito (ducphamhn01@gmail.com), trưởng phòng. Tiếng Việt, thẳng.
- Phiên bản hiện tại: `AppScript_v2_3.gs` (~2400 dòng) — liên kết chéo KT↔VT↔HS, modal 360°, search global, junction table `MAP_LIENKET`.
- Web App URL deployed (giữ nguyên qua các bản): user sẽ paste khi cần.

## Quy tắc vàng (đừng phá)

1. **Header-based column lookup** qua `_findCol(headers, ...candidates)`. KHÔNG hardcode index cột.
2. Tạo file mới khi nâng cấp: `AppScript_vX_Y.gs` + `HuongDan_Deploy_WebApp_vX_Y.md`. Giữ file cũ.
3. Deploy: luôn "Manage deployments → New version" trên deployment cũ → URL không đổi.
4. Click-to-Sheet deep link: `https://docs.google.com/spreadsheets/d/{ID}/edit#gid={gid}&range=A{row}` — tính năng KEY từ v2.2.
4b. (v2.3) Cross-link KT↔VT↔HS qua junction table `MAP_LIENKET` + cột "Liên kết X" trong từng tab. Bootstrap tự thêm cột + auto-gen ID idempotent.
5. Dark theme `#0F1B2D` cho phòng họp, đừng đổi.
6. Sau khi sửa code: `node --check` syntax → cập nhật HANDOFF.md "Lịch sử các phiên bản" → commit.

## Workflow chuẩn cho mỗi yêu cầu sửa

```
1. Đọc HANDOFF.md mục 4 (mục tiêu cốt lõi) + mục 7 (cấu trúc tab Sheet)
2. Copy AppScript_v2_2.gs → AppScript_v2_3.gs (hoặc bản mới)
3. Sửa, validate node --check
4. Viết HuongDan_Deploy_v2_3.md
5. Cập nhật HANDOFF.md (lịch sử phiên bản, tình trạng hiện tại)
6. git add . && git commit -m "v2.3: ..." && git push
7. Đưa user 2 dòng deploy: "Apps Script → dán code → Deploy → Manage → ✏️ → New version"
```

## Đừng làm

- Đừng tự đổi tên/xóa tab Sheet.
- Đừng tạo dashboard nhiều màn rời rạc — user thích single page app, click drill-down.
- Đừng dài dòng trong response. User thích thẳng + ngắn.
- Đừng dùng emoji trừ khi user hỏi.

## Cấu trúc folder

```
.
├── HANDOFF.md                     # ⭐ ĐỌC TRƯỚC
├── CLAUDE.md                      # File này
├── README.md                      # Cho người xem GitHub
├── AppScript_v2_3.gs              # ⭐ CURRENT
├── AppScript_v2_2.gs              # rollback gần
├── AppScript_v2_1.gs / v2.gs      # rollback xa
├── HuongDan_Deploy_WebApp_v2_3.md # deploy guide hiện tại
├── HuongDan_Deploy_WebApp_v2_2.md # deploy guide cũ
├── BaoCaoGiaoBan_v2.xlsx          # template Excel (deprecated)
├── HuongDan_ThucThi.docx          # tài liệu nội bộ ban đầu
└── docs/                          # tài liệu phụ
```
