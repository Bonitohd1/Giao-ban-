# 📋 Implementation Plan — Phase B: Tab "Báo cáo" (v2.10)

## 🎯 Objectives
- Add a dedicated "Báo cáo" (Reports) tab to the dashboard.
- Provide 5 standard report types with customizable filters.
- Support real-time HTML preview.
- Enable actions: Send via Email, Print to PDF, and Export to Excel.

## 🏗️ Architecture
1.  **Frontend (HTML/JS):**
    -   New view `view-baocao`.
    -   Split layout: Sidebar (Report Selection + Filters) | Content (Preview + Actions).
    -   Dynamic report generation using `google.script.run.getReportHtml`.
2.  **Backend (Apps Script):**
    -   New API `getReportHtml(type, filters)`: returns a formatted HTML string for preview.
    -   Integrated with `_buildBriefHtml` for consistent styling.
    -   Logic for weekly/monthly aggregation.

## 📝 Tasks

### 1. Header & Navigation
- [ ] Add `📊 Báo cáo` button to the main navigation bar.
- [ ] Initialize `view-baocao` container in the main layout.

### 2. Frontend: Report Controller
- [ ] Implement `renderBaoCao()`:
    -   Sidebar with report list:
        -   📅 Giao ban hôm nay
        -   📊 Tổng kết tuần
        -   📈 Báo cáo tháng
        -   🔮 Dự báo cung ứng
        -   📦 Kiểm soát tồn đọng
    -   Filter controls (Khoa, Cơ sở, CB, Range).
    -   Action buttons: `📧 Gửi Email`, `📄 Xuất PDF`, `📊 Tải Excel`.
    -   Preview area with a loading spinner.

### 3. Backend: Data & HTML Generation
- [ ] Implement `getReportHtml(type, filters)`:
    -   Fetch relevant data from `getOverview()`, `getKyThuat()`, `getHoSo()`, `getVTTH()`, `getKho()`.
    -   Format data into a print-friendly HTML template.
    -   Add watermark and branding.

### 4. Backend: Actions
- [ ] Implement `sendEmailReport(type, html, recipients)`:
    -   Uses existing `_getEmailRecipients(type)` logic.
- [ ] Implement `generateReportExcel(type, data)`:
    -   (Initial version: Create a temporary spreadsheet and return the URL).

### 5. Styling (CSS)
- [ ] Sidebar styling (glassmorphism/active states).
- [ ] Preview container (white background, shadows, print-optimized).
- [ ] Button states (loading, success).

## 🚀 Deployment Strategy
- Update `AppScript_v2_8.gs` (or increment to `v2.9/v2.10` if requested).
- Use `v32_lidx_` for cache isolation.
- Test with sample data for weekly/monthly ranges.

---
**Status:** ⏳ Pending Approval
