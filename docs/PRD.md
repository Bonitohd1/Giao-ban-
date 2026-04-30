# PRD: Hệ Thống Dashboard Giao Ban Quản Trị Phòng VT-TBYT

## 1. Tổng quan dự án (Project Overview)
Ứng dụng Dashboard Giao Ban là giải pháp quản trị tập trung dành riêng cho Trưởng phòng Vật tư - Trang thiết bị y tế (VT-TBYT). Ứng dụng giúp tổng hợp, trực quan hóa và phân tích dữ liệu theo thời gian thực từ 4 tổ chuyên môn: Kỹ thuật, Hồ sơ, Vật tư tiêu hao (VTTH), và Kho. 

Mục đích cốt lõi là cung cấp "bức tranh toàn cảnh" để Trưởng phòng dễ dàng nắm bắt các điểm nóng, đưa ra quyết định nhanh chóng, và có số liệu chính xác, trực quan để báo cáo trong các buổi giao ban với Ban Giám đốc bệnh viện.

## 2. Mục tiêu sản phẩm (Product Goals)
- **Tập trung hóa dữ liệu:** Quy tụ dữ liệu phân tán từ 4 tổ chuyên môn về một màn hình duy nhất.
- **Tối ưu hóa thời gian:** Giảm thiểu thời gian thu thập báo cáo thủ công trước mỗi buổi giao ban.
- **Hỗ trợ ra quyết định:** Cảnh báo sớm các rủi ro (máy hỏng, chậm tiến độ thầu, nguy cơ hết vật tư) để có phương án can thiệp kịp thời.

## 3. Chân dung người dùng (User Persona)
- **Người dùng chính (End-User):** Lãnh đạo/Trưởng phòng VT-TBYT.
- **Nhu cầu cốt lõi:** 
  - Xem nhanh (Glanceability), đi thẳng vào vấn đề.
  - Biết ngay cái gì đang vướng mắc, cái gì đang gấp, cần hỗ trợ gì.
  - Theo dõi tiến độ các đầu việc lớn.
  - Có số liệu, biểu đồ trực quan để thuyết trình/báo cáo sếp lớn.

---

## 4. Yêu cầu tính năng chi tiết (Functional Requirements)

Hệ thống được thiết kế chia thành 5 phân hệ (module) chính dựa trên 5 tiêu chí quản trị do Lãnh đạo đề ra:

### 4.1. Module 1: Trung tâm Cảnh báo & Công việc Khẩn (Overview & Urgent Actions)
Đây là màn hình trang chủ (Dashboard) tổng hợp, hiển thị ngay khi mở app, tập trung vào các "điểm nóng" từ 4 tổ.
- **Tính năng:**
  - **Danh sách báo động đỏ:** Hiển thị danh sách các đầu mục nổi bật, quan trọng, gấp cần giải quyết ngay từ 4 tổ (được đánh dấu ưu tiên: Đỏ - Khẩn cấp, Vàng - Cảnh báo).
  - **Phân loại theo tổ:** Bộ lọc nhanh công việc khẩn theo từng tổ (Ví dụ: Tổ Kỹ thuật có Máy MRI hỏng; Tổ Kho báo Hết găng tay phẫu thuật).
  - **Action Board:** Cho phép người quản lý "Gắn cờ" (Flag), "Bình luận chỉ đạo" hoặc "Giao việc/Phản hồi" nhanh cho các tổ trưởng ngay trên hệ thống.

### 4.2. Module 2: Quản lý Tổ Kỹ Thuật (Technical Management)
Tập trung vào tình trạng hoạt động và bảo trì của trang thiết bị toàn viện.
- **Tính năng:**
  - **Biểu đồ trạng thái thiết bị:** Thống kê tỷ lệ thiết bị Đang hoạt động / Đang hỏng / Đang bảo trì sửa chữa.
  - **Danh sách máy hỏng trọng điểm:** Liệt kê chi tiết các máy đang hỏng (Đặc biệt nhấn mạnh nhóm thiết bị hồi sức cấp cứu, máy cận lâm sàng, máy xã hội hóa có doanh thu cao).
  - **Tiến độ xử lý:** Theo dõi trạng thái sửa chữa (Đang chờ linh kiện, Đang đợi báo giá, Đang trình ký, Kỹ sư đang sửa).
  - **Tình trạng nhóm kỹ thuật:** Thông tin phân công nhân sự (ai đang phụ trách sửa máy nào, tiến độ đến đâu).

### 4.3. Module 3: Quản lý Tổ Hồ Sơ (Documentation/Bidding Management)
Quản lý tổng thể tiến độ các gói thầu mua sắm trang thiết bị y tế.
- **Tính năng:**
  - **Kanban Board Tiến độ thầu:** Theo dõi trạng thái các gói thầu (Đang lập danh mục -> Thẩm định giá -> Chờ duyệt KHLCNT -> Chấm thầu -> Đã có kết quả).
  - **Nhận diện vướng mắc (Nút thắt cổ chai):** Cảnh báo tự động các gói thầu đang chậm so với kế hoạch, bôi đỏ các khâu đang bị vướng (VD: Sở Y tế chưa duyệt, Hội đồng khoa học chậm).
  - **Đề xuất tháo gỡ:** Không gian để tổ trưởng tổ hồ sơ trình bày vướng mắc và đề xuất hướng xử lý lên Trưởng phòng.

### 4.4. Module 4: Quản lý Tổ Vật Tư Tiêu Hao & Hóa Chất (Consumables & Chemicals)
Theo dõi các gói thầu, cung ứng riêng cho VTTH và Hóa chất sinh phẩm.
- **Tính năng:**
  - **Tiến độ thầu VTTH/Hóa chất:** Trạng thái các gói thầu định kỳ và mua sắm bổ sung đột xuất.
  - **Cảnh báo chuỗi cung ứng:** Theo dõi nhà thầu chậm giao hàng, hàng giao không đúng chủng loại, không đạt chất lượng kiểm nhập.
  - **Giải pháp tình huống:** Ghi nhận các báo cáo vướng mắc và đề xuất phương án thay thế, điều chuyển tạm thời từ các bệnh viện khác khi thiếu hụt.

### 4.5. Module 5: Quản lý Tổ Kho (Inventory Management)
Kiểm soát dòng vật tư xuất/nhập/tồn và dự báo nhu cầu mua sắm sớm.
- **Tính năng:**
  - **Báo cáo Xuất - Nhập - Tồn:** Số liệu tổng quan thời gian thực dạng biểu đồ.
  - **Cảnh báo dự kiến hết hàng:** Danh sách các mặt hàng đã chạm "Ngưỡng tồn kho an toàn" hoặc hệ thống dự báo sắp hết trong 1-2 tuần tới dựa trên tốc độ tiêu hao của các khoa lâm sàng.
  - **Bản đồ nhu cầu (Heatmap):** Nhận diện các mặt hàng được nhiều khoa phòng đề xuất đột xuất/nhu cầu tăng đột biến để đưa vào ưu tiên thực hiện mua sắm sớm.
  - **Tối ưu tồn kho:** Cảnh báo các mặt hàng cận date, ứ đọng lâu ngày chưa xuất để có kế hoạch luân chuyển, tiêu hao.

---

## 5. Yêu cầu Phi chức năng (Non-Functional Requirements)

- **UI/UX (Trải nghiệm người dùng):** 
  - Giao diện Dashboard (Bảng điều khiển) cần chuẩn mực, hiện đại, ứng dụng phong cách "Glanceable Interface" (nhìn lướt là hiểu).
  - Sử dụng các biểu đồ (Pie, Bar, Line chart) trực quan, có tính tương tác cao (hover để xem chi tiết).
  - Tối ưu hóa hiển thị đặc biệt trên màn hình Laptop và iPad/Tablet để mang vào phòng họp giao ban.
- **Hệ thống màu sắc:** Sử dụng "Traffic light system" (Đỏ - Vàng - Xanh) để cảnh báo mức độ nghiêm trọng của dữ liệu.
- **Hiệu năng:** Hệ thống phải đảm bảo tốc độ tải trang nhanh, dữ liệu hiển thị realtime hoặc near-realtime.

## 6. Kiến trúc hệ thống & Lộ trình triển khai (Roadmap)

- **Giai đoạn 1 (MVP - Xây dựng cốt lõi):** 
  - Xây dựng UI/UX và logic Dashboard theo chuẩn PRD.
  - Cho phép các tổ trưởng nhập liệu báo cáo thủ công qua form hoặc import file Excel định kỳ trước giao ban.
- **Giai đoạn 2 (Tích hợp hệ thống):** 
  - Kết nối API lấy dữ liệu trực tiếp từ hệ thống HIS (Hospital Information System) của bệnh viện và phần mềm phần mềm quản lý kho hiện hành để tự động cập nhật số liệu.
- **Giai đoạn 3 (AI & Dự báo thông minh):** 
  - Ứng dụng AI phân tích dữ liệu lịch sử để tự động dự báo lượng vật tư tiêu thụ các tháng tới và đưa ra danh mục mua sắm gợi ý tự động.
