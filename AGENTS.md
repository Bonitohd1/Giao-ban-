# 🤖 PROTOCOL ĐỒNG BỘ AI: Antigravity & Claude

> **Tài liệu này quy định "Hàng rào kỹ thuật" (Fences) và "Bộ quy chuẩn" (Rules) bắt buộc đối với mọi AI agent (bao gồm Antigravity, Claude Code, và các Agent khác thuộc ClaudeKit) hoạt động trong dự án "Dashboard Giao Ban".**

---

## 1. Nguyên tắc cốt lõi (Core Principles)
- **Không dẫm chân nhau (No Conflicts):** Antigravity và Claude chạy trên cùng dự án phải dựa vào Git làm nguồn chân lý duy nhất (Single Source of Truth). Luôn `git pull` trước khi làm việc và `git push` sau khi xong.
- **Bảo toàn Logic (Preserve Logic):** Chỉ sửa **ĐÚNG** chỗ cần sửa. TUYỆT ĐỐI không tự ý "tối ưu hóa" (refactor) hoặc đụng vào các hàm đang hoạt động ổn định (đặc biệt là các logic core như `_findCol`, `doGet`, cấu trúc HTML/CSS hiện tại) nếu User không yêu cầu.
- **Tư duy trước khi Code (Think before typing):** Mọi thay đổi lớn hoặc thêm tính năng đều phải được đưa ra phân tích (Plan/Draft) trước khi bắt tay vào sửa file.

---

## 2. Quy trình làm việc bắt buộc (Standard Workflow)

Mỗi session (phiên làm việc) của bất kỳ AI nào phải tuân thủ nghiêm ngặt chu trình: **Tư duy (Plan) ➔ Triển khai (Cook) ➔ Đối chiếu & Đóng phiên (Review & Log)**.

### Bước 1: Tư duy & Lên phương án (Planning)
1. Đọc `HANDOFF.md` và `CLAUDE.md` để lấy ngữ cảnh mới nhất.
2. Đọc file nhật ký phiên trước (nếu có) để biết tiến độ.
3. Phác thảo phương án:
   - Sẽ can thiệp vào file nào? (Luôn tạo version mới như `AppScript_vX_Y.gs` nếu có thay đổi tính năng).
   - Hàm/Logic nào sẽ bị thay đổi?
   - Đợi User xác nhận hướng đi trước khi viết code hàng loạt.

### Bước 2: Triển khai chuẩn chỉnh (Execution)
- **Sửa đúng chỗ:** Áp dụng phương pháp Partial Edit (thay thế cục bộ). Không generate lại toàn bộ 2000 dòng code chỉ để sửa 1 biến.
- Đảm bảo tính liền mạch với code cũ: Không tự ý thay đổi tên biến toàn cục, không làm hỏng tính năng "Click-to-Sheet".
- Luôn validate code sau khi sửa (chạy `node --check <file>` nếu môi trường hỗ trợ).

### Bước 3: Đóng phiên & Ghi Log (End-of-Session Handoff) - ⚠️ BẮT BUỘC
Để AI phiên sau (hoặc agent khác) không bị mất ngữ cảnh, AI đang làm việc **phải** thực hiện quy trình sau trước khi dừng:
1. **Cập nhật trạng thái:** Sửa mục 3 và mục 9 trong file `HANDOFF.md` để phản ánh đúng thực trạng hiện tại (File nào đang là CURRENT, tính năng nào vừa làm xong).
2. **Ghi Session Log:** Thêm 1 đoạn tóm tắt vào file `docs/SESSION_LOGS.md` (nội dung gồm: Ngày giờ, AI thực hiện, Tính năng đã thêm/sửa, Các lỗi còn tồn đọng cần fix ở phiên sau).
3. **Commit & Push:** Đóng gói toàn bộ file thay đổi, commit với mô tả rõ ràng (theo chuẩn Conventional Commits) và push lên remote repo.

---

## 3. Hàng rào kỹ thuật (Technical Fences)
- **Biến cố định (Constants):** TUYỆT ĐỐI không tự đổi `SHEET_ID`, Tên Tab gốc, hệ màu (Dark theme `#0F1B2D`) nếu không có lệnh trực tiếp từ User.
- **Bắt buộc dùng Helper:** Mọi thao tác mapping cột phải dùng `_findCol`. Không được phép lấy data theo index cột hardcode (`row[2]`, `row[5]`).
- **Deploy an toàn:** Bất kỳ thay đổi cấu trúc sheet hay logic lớn đều phải đi kèm một script/hướng dẫn chạy hàm khởi tạo (VD: `bootstrap()`, `bootstrapLinks()`). Mọi code webapp đều phải chung 1 file `.gs` để User copy/paste 1 lần.

---
*Ghi chú: File này đóng vai trò như một bản hiến pháp của các AI trong dự án. Bất kỳ AI nào khi đọc được file này phải tự động căn chỉnh hành vi theo đúng các tiêu chí trên, đảm bảo tính liên tục của dự án.*
