const fs = require('fs');

let content = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

// Use regex to replace the whole block from const TAB down to the end of the second LINK_COL
// And then the onOpen function
content = content.replace(/const TAB = \{[\s\S]+?\}\s*;/g, ''); 
content = content.replace(/const LINK_COL = \{[\s\S]+?\}\s*;/g, '');
content = content.replace(/function onOpen\(\) \{[\s\S]+?\}\s*}/g, ''); // Fix duplicated onOpen

// Clean up any remaining partial blocks if necessary, but better to insert correctly
const config = `const TAB = {
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
};

function onOpen() {
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
}
`;

// Insert after the timezone/config
const insertPoint = content.indexOf('const EMAIL_TO_KHO      = "";') + 'const EMAIL_TO_KHO      = "";'.length;
content = content.substring(0, insertPoint) + "\n\n" + config + "\n" + content.substring(insertPoint);

// Remove the old sections if they were left behind elsewhere
// Actually, let's just make sure the file is clean
fs.writeFileSync('AppScript_v2_10.gs', content, 'utf8');
console.log('Cleaned and inserted critical sections.');
