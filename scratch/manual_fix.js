const fs = require('fs');

function fixSection(content, startMark, endMark, newContent) {
  const startIdx = content.indexOf(startMark);
  const endIdx = content.indexOf(endMark, startIdx);
  if (startIdx === -1 || endIdx === -1) return content;
  return content.substring(0, startIdx) + newContent + content.substring(endIdx + endMark.length);
}

let content = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

// Fix TAB and LINK_COL
const newConfig = `const TAB = {
  KY_THUAT:    "Nhóm kỹ thuật",
  KY_THUAT_DS: "Nhóm kỹ thuật- DS TB quản lý",
  VTTH:        "Nhóm vật tư tiêu hao- hóa chất",
  HO_SO:       "Nhóm Hồ sơ",
  KHO_5A:      "5A. Tổ kho - Tồn",
  KHO_5B:      "5B. Tổ kho - Đề xuất",
  CFG:         "cfg_threshold",
  CFG_EMAILS:  "cfg_emails",
  DM_KHOA:     "dm_khoa",
  DM_CB:       "dm_canbo",
  DM_CS:       "dm_co_so",
  DASHBOARD:   "Dashboard",
  LOG_HOT:     "log_hot_issues",
  MAP_LIENKET: "MAP_LIENKET"
};

const LINK_COL = {
  KT_MA:      "Mã KT",
  KT_LINK_HS: "Liên kết HS",
  KT_LINK_VT: "Liên kết VT",
  HS_LINK_KT: "Liên kết KT",
  HS_LINK_VT: "Liên kết VT",
  VT_MA:      "Mã VT",
  VT_LINK_HS: "Liên kết HS",
  VT_LINK_KT: "Liên kết KT",
  // v2.10: Maintenance tracking
  KT_LINK_BAO_TRI: "Liên kết Gói bảo trì",
  KT_BH_DATE:      "Ngày hết bảo hành",
  KT_BT_LAST:      "Bảo trì gần nhất",
  KT_BT_CYCLE:     "Chu kỳ (tháng)",
  KT_BT_NEXT:      "Bảo trì tiếp theo"
};`;

content = fixSection(content, 'const TAB = {', '};', newConfig);

// Fix onOpen menu
const newMenu = `function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📊 Giao ban")
    .addItem("🚀 Bootstrap (tạo tab lần đầu)", "bootstrap")
    .addItem("🔗 Bootstrap Links v2.3 (thêm cột liên kết)", "bootstrapLinks")
    .addSeparator()
    .addItem("📧 Gửi Brief Sáng (test)", "sendMorningBrief")
    .addItem("🔥 Quét điểm nóng (test)", "flagHotIssues")
    .addItem("📋 Briefing mode (trước họp GĐ)", "prepareBriefingMode")
    .addSeparator()
    .addItem("⚙️ Cài đặt Triggers (1 lần)", "setupTriggers")
    .addItem("🌐 Lấy URL Web App", "showWebAppUrl")
    .addToUi();
}`;

content = fixSection(content, 'function onOpen() {', '}', newMenu);

fs.writeFileSync('AppScript_v2_10.gs', content, 'utf8');
console.log('Manually fixed critical sections in AppScript_v2_10.gs');
