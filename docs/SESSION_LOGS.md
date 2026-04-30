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
21: 
22: ### [30/04/2026 - 15:40] | AI: Antigravity
23: - **Mục tiêu phiên:** Xử lý lỗi Web App không load được dữ liệu, nâng cấp tính năng Deep Link cho Hot Issues.
24: - **File đã thay đổi:** Cập nhật `AppScript_v2_4.gs`, `HANDOFF.md`, `docs/SESSION_LOGS.md`.
25: - **Tính năng / Lỗi đã xử lý:** 
26:   - Fix lỗi logic render khiến frontend bị treo khi gặp dữ liệu null/undefined.
27:   - Bổ sung trường `linkType`, `linkId`, `linkTab` cho Hot Issues để click mở đúng Sheet.
28:   - Cập nhật HANDOFF để AI phiên sau nắm được version mới nhất là v2.4.
29: - **Hành động cần làm ở phiên tiếp theo:** Push toàn bộ thay đổi lên Git theo yêu cầu của User.
30: 

### [30/04/2026 - 13:45] | AI: Antigravity
- **Mục tiêu phiên:** Thiết lập hàng rào kỹ thuật, chuẩn hóa quy trình phối hợp nhiều AI cùng code (Claude & Antigravity).
- **File đã thay đổi:** Tạo mới `AGENTS.md`, `docs/SESSION_LOGS.md`, cập nhật `CLAUDE.md`.
- **Tính năng / Lỗi đã xử lý:** Áp dụng bộ quy chuẩn làm việc theo mô hình của ClaudeKit Engineer, yêu cầu tư duy trước khi code, sửa đúng điểm, và bắt buộc ghi nhận trạng thái cuối session.
- **Hành động cần làm ở phiên tiếp theo:** Sẵn sàng tiếp nhận yêu cầu phát triển mới từ User với các quy trình đã được thiết lập chặt chẽ.
