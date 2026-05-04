/**
 * ============================================================================
 *  BỆNH VIỆN K — PHÒNG VT-TBYT — HỆ THỐNG GIAO BAN v2.10
 *  Dashboard Web App với hệ liên kết chéo KT ↔ VT ↔ HS
 * ----------------------------------------------------------------------------
 *  THỨ TỰ CHẠY LẦN ĐẦU (hoặc khi nâng cấp từ v2.2):
 *    1) bootstrap()         — Tạo các tab dm_*, cfg, 5A, 5B (1 lần).
 *    2) bootstrapLinks()    — MỚI v2.3: thêm cột Mã + Liên kết vào 4 tab chính.
 *    3) setupTriggers()     — Cài 3 trigger định kỳ (1 lần).
 *    4) Deploy Web App      — Triển khai → URL chiếu giao ban (1 lần).
 *
 *  7 VIEW DASHBOARD:
 *    - 🏠 Tổng quan: 4 KPI + Top khoa nóng + chuỗi vướng mắc nhân-quả
 *    - 🔧 Kỹ thuật: bảng máy hỏng có filter, click → mở MODAL 360° KT↔VT↔HS
 *    - 📁 Hồ sơ: pipeline gói thầu + KT/VT bị ảnh hưởng
 *    - 🧪 VTTH: task vật tư + map đến gói thầu + máy phụ thuộc
 *    - 📦 Kho: tồn sort DOH + dự báo về kho (theo deadline HS)
 *    - 🏥 Theo Khoa: chọn khoa → hiện toàn bộ chuỗi vấn đề của khoa
 *    - 🔗 Liên kết: MỚI - bản đồ chuỗi vướng, sort theo ngày kẹt
 *
 *  TÍNH NĂNG MỚI v2.3:
 *    • bootstrapLinks() tự thêm cột Mã KT/Mã VT + Liên kết vào 4 tab chính.
 *    • Smart fuzzy matching cho dòng chưa link thủ công (theo tên + khoa).
 *    • Modal 360°: click 1 entity → hiện toàn bộ KT/VT/HS liên quan.
 *    • Search bar global ở header.
 *    • Predictive supply: DOH vs ETA gói thầu → cảnh báo hết trước khi về.
 * ============================================================================
 */

// ============================================================================
//  CONFIG
// ============================================================================
const SHEET_ID = "18Dvv9lYosbfqIiH4uge4HMpIL-vaPxalQw5BzEfbFQ4";
const TIMEZONE = "Asia/Ho_Chi_Minh";

const EMAIL_TRUONG_PHONG = "ducphamhn01@gmail.com";
const EMAIL_TO_KY_THUAT = "";
const EMAIL_TO_HO_SO    = "";
const EMAIL_TO_VT       = "";
const EMAIL_TO_KHO      = "";

// v2.10: URL Web App cố định — thay thế bằng URL deployment thực tế
// Cách lấy: Apps Script → Deploy → Manage deployments → copy URL ở mục "Web app"
// (URL có dạng https://script.google.com/macros/s/{LONG_ID}/exec)
// Nếu để trống, code sẽ fallback ScriptApp.getService().getUrl() — có thể trả /dev sai
const WEB_APP_URL_OVERRIDE = ""; // ← DÁN URL VÀO ĐÂY

const TAB = {
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

// ============================================================================
//  LINK SYSTEM (v2.3) - tên cột để cross-link giữa các tab
// ============================================================================
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

// ============================================================================
//  MENU
// ============================================================================
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

// ============================================================================
//  SEED DATA
// ============================================================================
const SEED_CO_SO = [
  ["CS1", "Cơ sở 1 - Quán Sứ"],
  ["CS2", "Cơ sở 2 - Tam Hiệp"],
  ["CS3", "Cơ sở 3 - Tân Triều"],
  ["ALL", "Cả 3 cơ sở"],
];

const SEED_CANBO = [
  ["Hoàng Thế Hà",        "Lãnh đạo",     "Trưởng phòng"],
  ["Bùi Tuấn Nam",        "Lãnh đạo",     "Phó phòng"],
  ["Trần Thị Phượng",     "Tổ Kỹ thuật",  ""],
  ["Đỗ Công Chính",       "Tổ Kỹ thuật",  ""],
  ["Phan Việt Đức",       "Tổ Kỹ thuật",  ""],
  ["Nguyễn Đăng Nhàn",    "Tổ Kỹ thuật",  ""],
  ["Nguyễn Ngọc Nam",     "Tổ Kỹ thuật",  ""],
  ["Đỗ Vi Vũ Anh",        "Tổ Kỹ thuật",  ""],
  ["Nguyễn Hoàng Vũ",     "Tổ Kỹ thuật",  ""],
  ["Ngô Thủy Linh",       "Tổ Kỹ thuật",  ""],
  ["Phạm Quang Hiển",     "Tổ Hồ sơ",     ""],
  ["Nguyễn Thị Hương",    "Tổ Hồ sơ",     ""],
  ["Nguyễn Thanh Hải",    "Tổ Hồ sơ",     ""],
  ["Nguyễn Quang Tuấn",   "Tổ Hồ sơ",     ""],
  ["Hoàng Văn Thuận",     "Tổ Hồ sơ",     ""],
  ["Nguyễn Tuấn Dũng",    "Tổ Hồ sơ",     ""],
  ["Vũ Thị Thu Hằng",     "Tổ Hồ sơ",     ""],
  ["Ngô Thùy Linh",       "Tổ Hồ sơ",     ""],
  ["Nguyễn Hoàng Minh",   "Tổ Hồ sơ",     ""],
  ["Lê Thị Học",          "Tổ Hồ sơ",     ""],
  ["Đỗ Trọng Hiếu",       "Tổ Hồ sơ",     ""],
  ["Nông Thị Hà Phương",  "Tổ Vật tư",    ""],
  ["Trịnh Quang Nguyên",  "Tổ Vật tư",    ""],
  ["Khuất Văn Huy",       "Tổ Vật tư",    ""],
  ["Đinh Hồng Phúc",      "Tổ Vật tư",    ""],
  ["Nguyễn Thị Phương Nga","Tổ Vật tư",   ""],
  ["Trần Thế Anh",        "Tổ Kho",       ""],
  ["Nguyễn Đức Thịnh",    "Tổ Kho",       ""],
  ["Trần Thị Thanh Nga",  "Tổ Kho",       ""],
  ["Nguyễn Thị Lan Anh",  "Tổ Kho",       ""],
  ["Nguyễn Thị Cẩm Tú",   "Tổ Kho",       ""],
  ["Nguyễn Thanh Bách",   "Tổ Kho",       ""],
];

const SEED_KHOA = [
  ["GMHS",   "Khoa Gây mê hồi sức",          "ALL", "TRUE",  "Trước/trong mổ - không thể gián đoạn"],
  ["HSCC",   "Khoa Hồi sức cấp cứu",         "ALL", "TRUE",  "Bệnh nhân nặng - 24/7"],
  ["CDHA",   "Trung tâm Chẩn đoán hình ảnh", "ALL", "TRUE",  "Chẩn đoán → quyết định điều trị"],
  ["KSNK",   "Khoa Kiểm soát nhiễm khuẩn",   "ALL", "TRUE",  "Máy giặt/hấp/sấy hỏng = không có dụng cụ vô trùng"],
  ["GPB",    "Trung tâm GPB - SHPT",         "ALL", "TRUE",  "Giải phẫu bệnh là nền tảng chẩn đoán K"],
  ["PK",     "Phòng khám",                   "ALL", "TRUE",  "Đầu mối tiếp đón"],
  ["XT",     "Khoa Xạ trị",                  "ALL", "TRUE",  "Máy gia tốc hỏng = lùi kế hoạch xạ cả tuần"],
  ["PTM",    "Khoa Phẫu thuật / Phòng mổ",   "ALL", "TRUE",  "Trung tâm phẫu thuật"],
  ["XN",     "Khoa Xét nghiệm",              "ALL", "TRUE",  "Hoá chất hết → xét nghiệm dừng"],
  ["YHHN",   "Khoa Y học hạt nhân",          "ALL", "TRUE",  "SPECT/CT, máy đặc thù"],
  ["DD",     "Phòng Điều dưỡng",             "ALL", "FALSE", ""],
  ["DUOC",   "Khoa Dược",                    "ALL", "FALSE", ""],
  ["KHTH",   "Phòng KH Tổng hợp",            "ALL", "FALSE", ""],
  ["VTTBYT", "Phòng Vật tư - TBYT",          "ALL", "FALSE", ""],
  ["HCQT",   "Phòng Hành chính Quản trị",    "ALL", "FALSE", ""],
];

const SEED_CFG = [
  ["Kỹ thuật", "Số ngày trễ Deadline",          "ngày",     0,  7, "Yellow: đã trễ. Red: ≥ 7 ngày."],
  ["Kỹ thuật", "Số TB hỏng tại khoa trọng yếu", "máy",      1,  3, "Yellow: 1-2. Red: ≥ 3."],
  ["Hồ sơ",    "Số ngày trễ tiến độ gói thầu",  "ngày",     0, 14, "Yellow: đã trễ. Red: ≥ 14 ngày."],
  ["Hồ sơ",    "Số gói thầu đang vướng",        "gói",      1,  3, "Yellow: 1-2. Red: ≥ 3."],
  ["Vật tư",   "Số ngày trễ ký HĐ/Thanh toán",  "ngày",     0, 10, "Yellow: đã trễ. Red: ≥ 10 ngày."],
  ["Kho",      "Số ngày tồn (DOH)",             "ngày",     7,  3, "Yellow: ≤7. Red: ≤ 3."],
  ["Kho",      "Số khoa cùng yêu cầu 1 mặt hàng","khoa",    2,  4, "Yellow: 2-3. Red: ≥ 4."],
];

// ============================================================================
//  BOOTSTRAP
// ============================================================================
function bootstrap() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    "🚀 Bootstrap setup",
    "Sẽ tự tạo các tab MỚI:\n  • dm_co_so, dm_canbo, dm_khoa\n  • cfg_threshold, cfg_emails\n  • 5A. Tổ kho - Tồn\n  • 5B. Tổ kho - Đề xuất\n\nTab nào đã có sẽ bỏ qua. KHÔNG đụng vào dữ liệu cũ.\n\nTiếp tục?",
    ui.ButtonSet.YES_NO
  );
  if (resp !== ui.Button.YES) return;

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const created = [];
  const skipped = [];

  if (_setupCoSo(ss)) created.push("dm_co_so"); else skipped.push("dm_co_so");
  if (_setupCanBo(ss)) created.push("dm_canbo"); else skipped.push("dm_canbo");
  if (_setupKhoa(ss)) created.push("dm_khoa"); else skipped.push("dm_khoa");
  if (_setupCfg(ss)) created.push("cfg_threshold"); else skipped.push("cfg_threshold");
  if (_setupCfgEmails(ss)) created.push("cfg_emails"); else skipped.push("cfg_emails");
  if (_setup5A(ss)) created.push("5A. Tổ kho - Tồn"); else skipped.push("5A. Tổ kho - Tồn");
  if (_setup5B(ss)) created.push("5B. Tổ kho - Đề xuất"); else skipped.push("5B. Tổ kho - Đề xuất");

  let msg = "✅ Hoàn thành!\n\n";
  if (created.length) msg += "Đã tạo:\n  • " + created.join("\n  • ") + "\n\n";
  if (skipped.length) msg += "Bỏ qua (đã tồn tại):\n  • " + skipped.join("\n  • ") + "\n\n";
  msg += "Bước tiếp theo:\n  1) Chạy setupTriggers().\n  2) Deploy Web App.";
  ui.alert(msg);
}

// ============================================================================
//  v2.9 — cfg_emails: cấu hình danh sách email theo loại báo cáo
// ============================================================================
function _setupCfgEmails(ss) {
  if (ss.getSheetByName(TAB.CFG_EMAILS)) return false;
  const sh = ss.insertSheet(TAB.CFG_EMAILS);
  _hdr(sh, ["STT", "Loại báo cáo", "Tên người nhận", "Email", "Active"]);
  // Pre-fill 1 row mặc định cho trưởng phòng
  sh.getRange(2, 1, 6, 5).setValues([
    [1, "morning_brief", "Trưởng phòng", EMAIL_TRUONG_PHONG, "✓"],
    [2, "weekly",        "Trưởng phòng", EMAIL_TRUONG_PHONG, "✓"],
    [3, "monthly",       "Trưởng phòng", EMAIL_TRUONG_PHONG, "✓"],
    [4, "forecast",      "Trưởng phòng", EMAIL_TRUONG_PHONG, "✓"],
    [5, "ton_dong",      "Trưởng phòng", EMAIL_TRUONG_PHONG, "✓"],
    [6, "flag_hot",      "Trưởng phòng", EMAIL_TRUONG_PHONG, "✓"]
  ]);
  // Note row
  sh.getRange(9, 1).setValue("Hướng dẫn:");
  sh.getRange(10, 1).setValue("• Loại báo cáo: morning_brief / weekly / monthly / forecast / ton_dong / flag_hot");
  sh.getRange(11, 1).setValue("• Active: '✓' để gửi, để trống hoặc 'X' để bỏ qua");
  sh.getRange(12, 1).setValue("• Thêm dòng dưới để bổ sung tổ trưởng các nhóm — Mỗi loại có thể nhiều người");
  sh.getRange(9, 1, 4, 1).setFontStyle("italic").setFontColor("#6B7280");
  sh.setColumnWidths(1, 5, 160);
  sh.setColumnWidth(2, 140);
  sh.setColumnWidth(4, 240);
  return true;
}

function _getEmailRecipients(type) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheetByName(TAB.CFG_EMAILS);
    if (!sh) return [EMAIL_TRUONG_PHONG];
    const data = sh.getDataRange().getValues();
    const headers = data[0] || [];
    const cType = headers.indexOf("Loại báo cáo");
    const cEmail = headers.indexOf("Email");
    const cActive = headers.indexOf("Active");
    if (cType < 0 || cEmail < 0) return [EMAIL_TRUONG_PHONG];
    const out = [];
    for (let i = 1; i < data.length; i++) {
      const t = (data[i][cType] || "").toString().trim();
      const e = (data[i][cEmail] || "").toString().trim();
      const a = (cActive >= 0 ? (data[i][cActive] || "").toString().trim() : "✓");
      if (t === type && e.indexOf("@") > 0 && (a === "✓" || a === "1" || a === "TRUE" || a === "Y")) out.push(e);
    }
    return out.length ? out : [EMAIL_TRUONG_PHONG];
  } catch (err) {
    return [EMAIL_TRUONG_PHONG];
  }
}

function _getWebAppUrl() {
  // v2.9.1: Ưu tiên URL hardcode trong WEB_APP_URL_OVERRIDE.
  // Fallback ScriptApp.getService().getUrl() — có thể trả /dev nếu chạy từ editor.
  if (typeof WEB_APP_URL_OVERRIDE === "string" && WEB_APP_URL_OVERRIDE.indexOf("http") === 0) {
    return WEB_APP_URL_OVERRIDE;
  }
  try {
    const url = ScriptApp.getService().getUrl();
    if (url && url.indexOf("/exec") > 0) return url;
    if (url) return url; // fallback /dev nếu có
  } catch (e) {}
  return "";
}

function _hdr(sheet, headers) {
  const r = sheet.getRange(1, 1, 1, headers.length);
  r.setValues([headers]).setFontWeight("bold").setBackground("#1F4E78").setFontColor("#FFFFFF")
   .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
}

function _setupCoSo(ss) {
  if (ss.getSheetByName(TAB.DM_CS)) return false;
  const s = ss.insertSheet(TAB.DM_CS);
  _hdr(s, ["Mã", "Tên cơ sở"]);
  s.getRange(2, 1, SEED_CO_SO.length, 2).setValues(SEED_CO_SO);
  s.setColumnWidth(1, 70); s.setColumnWidth(2, 220);
  return true;
}

function _setupCanBo(ss) {
  if (ss.getSheetByName(TAB.DM_CB)) return false;
  const s = ss.insertSheet(TAB.DM_CB);
  _hdr(s, ["Họ tên", "Tổ", "Vai trò", "Email", "SĐT", "Ghi chú"]);
  const rows = SEED_CANBO.map(r => [r[0], r[1], r[2], "", "", ""]);
  s.getRange(2, 1, rows.length, 6).setValues(rows);
  s.setColumnWidth(1, 200); s.setColumnWidth(2, 130); s.setColumnWidth(3, 130);
  s.setColumnWidth(4, 200); s.setColumnWidth(5, 120); s.setColumnWidth(6, 250);
  return true;
}

function _setupKhoa(ss) {
  if (ss.getSheetByName(TAB.DM_KHOA)) return false;
  const s = ss.insertSheet(TAB.DM_KHOA);
  _hdr(s, ["Mã khoa", "Tên khoa", "Cơ sở", "Trọng yếu (TRUE/FALSE)", "Lý do trọng yếu", "Ghi chú"]);
  const rows = SEED_KHOA.map(r => [r[0], r[1], r[2], r[3], r[4], ""]);
  s.getRange(2, 1, rows.length, 6).setValues(rows);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][3] === "TRUE") s.getRange(i + 2, 4).setBackground("#FCE4D6");
  }
  s.setColumnWidth(1, 90); s.setColumnWidth(2, 280); s.setColumnWidth(3, 80);
  s.setColumnWidth(4, 150); s.setColumnWidth(5, 380); s.setColumnWidth(6, 200);
  return true;
}

function _setupCfg(ss) {
  if (ss.getSheetByName(TAB.CFG)) return false;
  const s = ss.insertSheet(TAB.CFG);
  _hdr(s, ["Tổ", "Chỉ số", "Đơn vị", "Ngưỡng VÀNG", "Ngưỡng ĐỎ", "Mô tả"]);
  s.getRange(2, 1, SEED_CFG.length, 6).setValues(SEED_CFG);
  s.getRange(2, 4, SEED_CFG.length, 2).setBackground("#FFF2CC");
  s.setColumnWidth(1, 100); s.setColumnWidth(2, 280); s.setColumnWidth(3, 80);
  s.setColumnWidth(4, 100); s.setColumnWidth(5, 100); s.setColumnWidth(6, 400);
  return true;
}

function _setup5A(ss) {
  if (ss.getSheetByName(TAB.KHO_5A)) return false;
  const s = ss.insertSheet(TAB.KHO_5A);
  const headers = ["STT","Mã VTTH","Tên VTTH","Khoa/ Phòng Sử Dụng","Loại","Cơ sở","CB phụ trách",
    "Tồn đầu kỳ","Nhập trong kỳ","Xuất trong kỳ","Tồn hiện tại","Định mức MIN","Định mức MAX",
    "Trạng thái cảnh báo","Số ngày tồn (DOH)","Khoa yêu cầu nhiều nhất","Số khoa đang chờ",
    "Đề xuất xử lý","Ghi chú / Cập nhật"];
  _hdr(s, headers);

  const N = 10;
  for (let i = 0; i < N; i++) {
    const r = i + 2;
    s.getRange(r, 1).setValue(i + 1);
    s.getRange(r, 11).setFormula("=H"+r+"+I"+r+"-J"+r);
    s.getRange(r, 14).setFormula(
      '=IF(K'+r+'="","",IF(K'+r+'=0,"ĐỎ - Hết hàng",IF(K'+r+'<L'+r+'*0.5,"ĐỎ - Cực thấp",IF(K'+r+'<L'+r+',"VÀNG - Dưới MIN",IF(K'+r+'>M'+r+',"VÀNG - Vượt MAX","XANH - Bình thường")))))'
    );
    s.getRange(r, 15).setFormula('=IFERROR(IF(J'+r+'=0,"",ROUND(K'+r+'/(J'+r+'/30),0)),"")');
  }

  const cfRules = s.getConditionalFormatRules();
  cfRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains("ĐỎ").setBackground("#FFC7CE").setFontColor("#9C0006")
    .setRanges([s.getRange("N2:N1000")]).build());
  cfRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains("VÀNG").setBackground("#FFEB9C").setFontColor("#9C5700")
    .setRanges([s.getRange("N2:N1000")]).build());
  cfRules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains("XANH").setBackground("#C6EFCE").setFontColor("#006100")
    .setRanges([s.getRange("N2:N1000")]).build());
  s.setConditionalFormatRules(cfRules);

  _addListValidation(s, "E2:E1000", "Vật tư,Hóa chất,Linh kiện,Khác");
  _addRangeValidation(s, "F2:F1000", ss.getSheetByName(TAB.DM_CS), "B2:B5");
  _addRangeValidation(s, "G2:G1000", ss.getSheetByName(TAB.DM_CB), "A2:A33");

  const w = [50,90,260,180,110,90,160,80,80,80,90,80,80,180,90,180,100,250,250];
  w.forEach((width, i) => s.setColumnWidth(i + 1, width));
  s.setFrozenRows(1);
  return true;
}

function _setup5B(ss) {
  if (ss.getSheetByName(TAB.KHO_5B)) return false;
  const s = ss.insertSheet(TAB.KHO_5B);
  const headers = ["STT","Ngày yêu cầu","Khoa/ Phòng Sử Dụng","Cơ sở","Người yêu cầu","VTTH yêu cầu",
    "Số lượng","Đơn vị","Mức ưu tiên","Trạng thái xử lý","CB Kho xử lý",
    "Ngày dự kiến cấp","Ngày thực cấp","Ghi chú"];
  _hdr(s, headers);

  const N = 10;
  for (let i = 0; i < N; i++) {
    const r = i + 2;
    s.getRange(r, 1).setValue(i + 1);
    s.getRange(r, 9).setFormula(
      '=IFERROR(IF(VLOOKUP(C'+r+',dm_khoa!$B$2:$D$50,3,FALSE)="TRUE","CAO (khoa trọng yếu)","Bình thường"),"")'
    );
  }

  s.getRange("B2:B1000").setNumberFormat("dd/mm/yyyy");
  s.getRange("L2:M1000").setNumberFormat("dd/mm/yyyy");

  _addRangeValidation(s, "C2:C1000", ss.getSheetByName(TAB.DM_KHOA), "B2:B50");
  _addRangeValidation(s, "D2:D1000", ss.getSheetByName(TAB.DM_CS), "B2:B5");
  _addRangeValidation(s, "K2:K1000", ss.getSheetByName(TAB.DM_CB), "A2:A33");
  _addListValidation(s, "J2:J1000", "Chờ tiếp nhận,Đang xử lý,Đã cấp đủ,Cấp một phần,Từ chối,Tạm hoãn");

  const cf = s.getConditionalFormatRules();
  cf.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains("CAO").setBackground("#FFC7CE").setFontColor("#9C0006")
    .setRanges([s.getRange("I2:I1000")]).build());
  cf.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("Đã cấp đủ").setBackground("#C6EFCE").setFontColor("#006100")
    .setRanges([s.getRange("J2:J1000")]).build());
  cf.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("Chờ tiếp nhận").setBackground("#FFEB9C").setFontColor("#9C5700")
    .setRanges([s.getRange("J2:J1000")]).build());
  s.setConditionalFormatRules(cf);

  const w = [50,100,200,80,140,260,80,80,180,140,160,110,110,250];
  w.forEach((width, i) => s.setColumnWidth(i + 1, width));
  s.setFrozenRows(1);
  return true;
}

function _addListValidation(sheet, a1, csv) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(csv.split(","), true).setAllowInvalid(true).build();
  sheet.getRange(a1).setDataValidation(rule);
}

function _addRangeValidation(sheet, a1, srcSheet, srcA1) {
  if (!srcSheet) return;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(srcSheet.getRange(srcA1), true).setAllowInvalid(true).build();
  sheet.getRange(a1).setDataValidation(rule);
}

// ============================================================================
//  BOOTSTRAP LINKS (v2.3) — thêm cột Mã + Liên kết vào 4 tab chính
//  Idempotent: chạy nhiều lần không nhân đôi cột.
// ============================================================================
function bootstrapLinks() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    "🔗 Bootstrap Links v2.3",
    "Sẽ thêm cột vào 4 tab (idempotent, không phá data cũ):\n" +
    "  • Nhóm kỹ thuật: + Mã KT, Liên kết HS, Liên kết VT\n" +
    "  • Nhóm Hồ sơ:    + Liên kết KT, Liên kết VT\n" +
    "  • Nhóm vật tư..: + Mã VT, Liên kết HS, Liên kết KT\n" +
    "  • + tab MAP_LIENKET (junction table tổng)\n\n" +
    "Mã KT/VT auto-sinh (KT001, VT001…). Cột 'Liên kết X' để trống — anh điền\n" +
    "tay bằng list mã cách nhau bằng dấu phẩy. Web app sẽ kết hợp link thủ công\n" +
    "+ smart fuzzy match cho dòng chưa điền.\n\nTiếp tục?",
    ui.ButtonSet.YES_NO
  );
  if (resp !== ui.Button.YES) return;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const log = [];
  log.push(_ensureLinkCols(ss, TAB.KY_THUAT,
    [LINK_COL.KT_MA, LINK_COL.KT_LINK_HS, LINK_COL.KT_LINK_VT], "KT"));
  log.push(_ensureLinkCols(ss, TAB.HO_SO,
    [LINK_COL.HS_LINK_KT, LINK_COL.HS_LINK_VT], null));
  log.push(_ensureLinkCols(ss, TAB.VTTH,
    [LINK_COL.VT_MA, LINK_COL.VT_LINK_HS, LINK_COL.VT_LINK_KT], "VT"));
  log.push(_setupMapLienket(ss));
  ui.alert("✅ Bootstrap Links hoàn thành!\n\n" + log.join("\n"));
}

function _ensureLinkCols(ss, tabName, cols, autoIdPrefix) {
  const sh = ss.getSheetByName(tabName);
  if (!sh) return "❌ Không có tab: " + tabName;
  const lastCol = sh.getLastColumn();
  const lastRow = sh.getLastRow();
  if (lastCol === 0) return "❌ Tab " + tabName + " trống";
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const existing = headers.map(_norm);
  let added = 0;
  cols.forEach(c => {
    if (existing.indexOf(_norm(c)) < 0) {
      const newColIdx = sh.getLastColumn() + 1;
      sh.getRange(1, newColIdx).setValue(c)
        .setFontWeight("bold").setBackground("#1F4E78").setFontColor("#FFFFFF");
      sh.setColumnWidth(newColIdx, 140);
      added++;
    }
  });
  if (autoIdPrefix && lastRow > 1) {
    const newHeaders = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const cMa = _findCol(newHeaders, autoIdPrefix === "KT" ? LINK_COL.KT_MA : LINK_COL.VT_MA);
    if (cMa >= 0) {
      const data = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();
      let nextNum = 1;
      data.forEach(r => {
        const v = (r[cMa] || "").toString();
        const m = v.match(new RegExp("^" + autoIdPrefix + "(\\d+)$"));
        if (m) { const n = parseInt(m[1], 10); if (n >= nextNum) nextNum = n + 1; }
      });
      for (let i = 0; i < data.length; i++) {
        const r = data[i];
        const hasData = r.some((v, j) => j !== cMa && v !== "" && v !== null);
        if (hasData && !r[cMa]) {
          sh.getRange(i + 2, cMa + 1).setValue(autoIdPrefix + String(nextNum).padStart(3, "0"));
          nextNum++;
        }
      }
    }
  }
  return "✓ " + tabName + ": +" + added + " cột" + (autoIdPrefix ? ", auto-Mã đã chạy" : "");
}

function _setupMapLienket(ss) {
  if (ss.getSheetByName(TAB.MAP_LIENKET)) return "✓ MAP_LIENKET: đã có";
  const s = ss.insertSheet(TAB.MAP_LIENKET);
  _hdr(s, ["Loại link", "Từ (Mã)", "Tới (Mã)", "Lý do / Ghi chú", "Ngày tạo", "Trạng thái"]);
  _addListValidation(s, "A2:A1000", "KT-VT,KT-HS,VT-HS");
  _addListValidation(s, "F2:F1000", "Active,Closed");
  s.getRange("E2:E1000").setNumberFormat("dd/mm/yyyy");
  const sample = [
    ["KT-VT", "(điền Mã KT)", "(điền Mã VT)", "VD: máy thở Carefusion cần dây thở", new Date(), "Active"],
    ["VT-HS", "(điền Mã VT)", "(điền Mã Hồ sơ)", "VD: dây thở đang trong gói thầu HS-2025-007", new Date(), "Active"],
    ["KT-HS", "(điền Mã KT)", "(điền Mã Hồ sơ)", "VD: máy CT cần gói sửa chữa HS-2025-015", new Date(), "Active"]
  ];
  s.getRange(2, 1, 3, 6).setValues(sample);
  s.getRange("A2:A4").setFontStyle("italic").setFontColor("#888");
  const w = [100, 140, 140, 350, 110, 100];
  w.forEach((width, i) => s.setColumnWidth(i + 1, width));
  s.setFrozenRows(1);
  return "✓ MAP_LIENKET: đã tạo + 3 dòng mẫu";
}

// ============================================================================
//  TRIGGERS + ONEDIT
// ============================================================================
function setupTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ScriptApp.newTrigger("onEdit").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("sendMorningBrief").timeBased().atHour(7).nearMinute(30).everyDays(1).create();
  [8, 11, 14, 17].forEach(h => {
    ScriptApp.newTrigger("flagHotIssues").timeBased().atHour(h).nearMinute(0).everyDays(1).create();
  });
  // v2.6: warm cache mỗi 5 phút để click tab luôn nhanh
  ScriptApp.newTrigger("warmCache").timeBased().everyMinutes(5).create();
  
  const msg = "✅ Đã cài " + ScriptApp.getProjectTriggers().length + " trigger (gồm warmCache mỗi 5 phút).";
  Logger.log(msg);
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(msg, "Triggers", 5);
  } catch(e) {}
}

function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const row = e.range.getRow();
  if (row < 2) return;

  if ([TAB.KHO_5A, TAB.KHO_5B].indexOf(sheetName) >= 0) {
    const sttCell = sheet.getRange(row, 1);
    if (!sttCell.getValue() && e.range.getColumn() === 2) sttCell.setValue(row - 1);
  }

  // v2.6: invalidate link index cache khi user sửa data trên các tab quan hệ
  // → click tab tiếp theo sẽ thấy data mới ngay (không phải đợi 5 phút TTL)
  const watchedTabs = [TAB.KY_THUAT, TAB.HO_SO, TAB.VTTH, TAB.KHO_5A, TAB.KHO_5B, TAB.MAP_LIENKET];
  if (watchedTabs.indexOf(sheetName) >= 0) {
    try { invalidateLinkIndex(); } catch (err) { /* ignore */ }
  }
}

// v2.6: warm cache — gọi từ trigger time-based để dashboard luôn có cache nóng
function warmCache() {
  try {
    invalidateLinkIndex();
    _buildLinkIndex();
  } catch (e) { /* ignore */ }
}

function _getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    if (headers && headers.length) {
      s.getRange(1, 1, 1, headers.length).setValues([headers])
        .setFontWeight("bold").setBackground("#1F4E78").setFontColor("#FFFFFF");
    }
  }
  return s;
}

// ============================================================================
//  HEADER-BASED COLUMN LOOKUP (resilient to column reorders)
// ============================================================================
function _norm(s) {
  return (s || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
}

function _findCol(headers, ...candidates) {
  const hn = headers.map(_norm);
  // Pass 1: exact match
  for (const c of candidates) {
    const cn = _norm(c);
    const idx = hn.indexOf(cn);
    if (idx >= 0) return idx;
  }
  // Pass 2: header includes candidate
  for (const c of candidates) {
    const cn = _norm(c);
    const idx = hn.findIndex(h => h.indexOf(cn) >= 0);
    if (idx >= 0) return idx;
  }
  return -1;
}

function _readTab(tabName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(tabName);
  if (!sh) return { name: tabName, gid: null, headers: [], rows: [], missing: true };
  const data = sh.getDataRange().getValues();
  return {
    name: tabName,
    gid: sh.getSheetId(),
    headers: data[0] || [],
    rows: (data.slice(1) || []).filter(r => r.some(v => v !== "" && v !== null))
  };
}

function _isDone(v) {
  const s = (v || "").toString().trim();
  return s === "✓" || s.toUpperCase() === "X" || s === "1" || s === "TRUE" || s === "Đã HT" || s === "Hoàn thành";
}

function _isCao(v) {
  return _norm(v).indexOf("cao") >= 0;
}

function _toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  // Try parse dd/mm/yyyy
  const s = v.toString().trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let y = parseInt(m[3], 10); if (y < 100) y += 2000;
    return new Date(y, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function _daysBetween(d1, d2) {
  if (!d1 || !d2) return null;
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function _truncate(s, n) {
  s = (s || "").toString();
  return s.length > n ? s.substring(0, n - 1) + "…" : s;
}

// ============================================================================
//  API ENDPOINT — OVERVIEW
// ============================================================================
function getOverview() {
  const kt = _readTab(TAB.KY_THUAT);
  const hs = _readTab(TAB.HO_SO);
  const vt = _readTab(TAB.VTTH);
  const kho5a = _readTab(TAB.KHO_5A);
  const kho5b = _readTab(TAB.KHO_5B);

  // v2.9: Thêm forecast summary cho card Kho ở Tổng quan
  const khoCard = _summaryKho(kho5a, kho5b);
  if (!kho5a.missing) {
    try {
      const linkIdx = _buildLinkIndex();
      const cTen = _findCol(kho5a.headers, "Tên VTTH");
      const cMa = _findCol(kho5a.headers, "Mã VTTH", "Mã VT", "Mã");
      const cTon = _findCol(kho5a.headers, "Tồn hiện tại", "Tồn");
      const cDOH = _findCol(kho5a.headers, "Số ngày tồn", "DOH");
      const cTT = _findCol(kho5a.headers, "Trạng thái cảnh báo", "Trạng thái");
      const cKhoa = _findCol(kho5a.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
      const f = { l1:0, l2:0, noSolution:0, stagnantLong:0, top: [] };
      kho5a.rows.forEach(function(row, i) {
        const ten = (cTen>=0 ? row[cTen] : "").toString().trim();
        if (!ten) return;
        const item = {
          ma: (cMa>=0 ? row[cMa] : "").toString(),
          ten: ten,
          khoa: (cKhoa>=0 ? row[cKhoa] : "").toString(),
          ton: cTon>=0 ? row[cTon] : "",
          doh: cDOH>=0 ? row[cDOH] : "",
          tt: (cTT>=0 ? row[cTT] : "").toString(),
          rowNum: i+2, gid: kho5a.gid
        };
        const risk = _getSupplyRisk(item, linkIdx);
        if (!risk) return;
        if (risk.level === 1) { f.l1++; if (!risk.ok) f.noSolution++; }
        if (risk.level === 2) f.l2++;
        if (risk.stagnantTier === 3) f.stagnantLong++;
        if (risk.level <= 2 || risk.stagnantTier === 3) {
          f.top.push({
            ten: item.ten, ma: item.ma, khoa: item.khoa, doh: risk.doh,
            level: risk.level, label: risk.label, action: risk.action, ok: risk.ok,
            stagnantTier: risk.stagnantTier
          });
        }
      });
      // Sort: Level 1 trước, sau đó level 2, rồi tồn dài
      f.top.sort(function(a, b) {
        if (a.level !== b.level) return a.level - b.level;
        return a.doh - b.doh;
      });
      f.top = f.top.slice(0, 5);
      khoCard.forecast = f;
    } catch (e) {
      khoCard.forecast = { l1:0, l2:0, noSolution:0, stagnantLong:0, top: [] };
    }
  }

  return {
    updatedAt: Utilities.formatDate(new Date(), TIMEZONE, "HH:mm:ss dd/MM/yyyy"),
    sheetUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID,
    webAppUrl: _getWebAppUrl(),
    cards: {
      kt: _summaryKT(kt),
      hs: _summaryHS(hs),
      vt: _summaryVT(vt),
      kho: khoCard
    },
    // v2.10: Maintenance forecast for reports
    maintenance: _summaryMaintenance(kt, linkIdx),
    topKhoa: _aggKhoa([kt, hs, vt, kho5b]),
    hot: _topHot(kt, hs, kho5a, 10)
  };
}

function _summaryKT(t) {
  const out = { total:0, done:0, dangSua:0, baoTri:0, thanhLy:0, hong:0, cao:0, treDL:0, missing: t.missing };
  if (!t || t.missing) return out;
  const cTen = _findCol(t.headers, "Tên Thiết Bị", "Tên TB", "Tên");
  const cTinh = _findCol(t.headers, "Tình trạng");
  const cHT = _findCol(t.headers, "Đã Hoàn Thành", "Đã HT");
  const cUT = _findCol(t.headers, "Cấp độ ưu tiên", "Ưu tiên");
  const cDL = _findCol(t.headers, "Deadline");
  const today = new Date(); today.setHours(0,0,0,0);

  t.rows.forEach(row => {
    const ten = (row[cTen >= 0 ? cTen : 0] || "").toString().trim();
    if (!ten) return;
    
    out.total++;
    const ts = _norm(row[cTinh]);
    const isThanhLy = ts.indexOf("thanh lý") >= 0;
    
    if (isThanhLy) {
      out.thanhLy++;
    }
    
    if (ts.indexOf("đang sửa") >= 0) out.dangSua++;
    if (ts.indexOf("bảo trì") >= 0 || ts.indexOf("bảo dưỡng") >= 0) out.baoTri++;
    if (ts === "hỏng") out.hong++;
    
    const done = _isDone(row[cHT]);
    // v2.8.3: thanh lý không được tính là done
    if (done && !isThanhLy) out.done++;
    
    if (_isCao(row[cUT])) out.cao++;
    const dl = _toDate(row[cDL]);
    if (dl && dl < today && !done) out.treDL++;
  });
  return out;
}

function _summaryHS(t) {
  const out = { total:0, done:0, dangXL:0, vuong:0, treDL:0, cao:0, tongGiaTri:0, missing: t.missing };
  if (!t || t.missing) return out;
  const cMa = _findCol(t.headers, "Mã Hồ sơ", "Mã HS");
  const cND = _findCol(t.headers, "Nội dung công việc được giao", "Nội dung");
  const cHT = _findCol(t.headers, "Đã Hoàn Thành", "Đã HT");
  const cUT = _findCol(t.headers, "Cấp độ ưu tiên", "Ưu tiên");
  const cDL = _findCol(t.headers, "Deadline");
  const cVM = _findCol(t.headers, "Khó khăn, vướng mắc", "Vướng mắc");
  const cGT = _findCol(t.headers, "Giá trị Dự toán (VND)", "Giá trị Dự toán", "Giá trị");
  const today = new Date(); today.setHours(0,0,0,0);

  t.rows.forEach(row => {
    const ma = (row[cMa] || "").toString().trim();
    const nd = (row[cND] || "").toString().trim();
    if (!ma && !nd) return;
    out.total++;
    const done = _isDone(row[cHT]);
    if (done) out.done++; else out.dangXL++;
    const vm = (row[cVM] || "").toString().trim();
    if (vm && !done) out.vuong++;
    if (_isCao(row[cUT])) out.cao++;
    const dl = _toDate(row[cDL]);
    if (dl && dl < today && !done) out.treDL++;
    const gt = parseFloat(row[cGT]);
    if (!isNaN(gt)) out.tongGiaTri += gt;
  });
  return out;
}

function _summaryVT(t) {
  const out = { total:0, done:0, dangXL:0, vuong:0, treDL:0, cao:0, missing: t.missing };
  if (!t || t.missing) return out;
  const cHT = _findCol(t.headers, "Đã Hoàn Thành", "Đã HT");
  const cUT = _findCol(t.headers, "Cấp độ ưu tiên", "Mức ưu tiên", "Ưu tiên");
  const cDL = _findCol(t.headers, "Deadline");
  const cVM = _findCol(t.headers, "Khó khăn, vướng mắc", "Vướng mắc");
  const cTT = _findCol(t.headers, "Trạng thái");
  const today = new Date(); today.setHours(0,0,0,0);

  t.rows.forEach(row => {
    if (!row.some(v => v !== "" && v !== null)) return;
    out.total++;
    const done = _isDone(row[cHT]);
    if (done) out.done++; else out.dangXL++;
    const vm = (row[cVM] || "").toString().trim();
    if (vm && !done) out.vuong++;
    if (_isCao(row[cUT])) out.cao++;
    const dl = _toDate(row[cDL]);
    if (dl && dl < today && !done) out.treDL++;
  });
  return out;
}

function _summaryKho(t5a, t5b) {
  const out = { total:0, red:0, yellow:0, green:0, requestPending:0, requestHigh:0,
                missing5A: t5a.missing, missing5B: t5b.missing };
  if (t5a && !t5a.missing) {
    const cTT = _findCol(t5a.headers, "Trạng thái cảnh báo", "Cảnh báo");
    const cTen = _findCol(t5a.headers, "Tên VTTH");
    t5a.rows.forEach(row => {
      const ten = (row[cTen] || "").toString().trim();
      if (!ten) return;
      out.total++;
      const v = (row[cTT] || "").toString();
      if (v.indexOf("ĐỎ") >= 0) out.red++;
      else if (v.indexOf("VÀNG") >= 0) out.yellow++;
      else if (v.indexOf("XANH") >= 0) out.green++;
    });
  }
  if (t5b && !t5b.missing) {
    const cTT = _findCol(t5b.headers, "Trạng thái xử lý", "Trạng thái");
    const cUT = _findCol(t5b.headers, "Mức ưu tiên", "Ưu tiên");
    t5b.rows.forEach(row => {
      const status = (row[cTT] || "").toString().trim();
      const priority = (row[cUT] || "").toString();
      if (status === "Chờ tiếp nhận") out.requestPending++;
      if (priority.indexOf("CAO") >= 0 && status !== "Đã cấp đủ") out.requestHigh++;
    });
  }
  return out;
}

function _aggKhoa(tabs) {
  // v2.7: composite key Khoa | Cơ sở để 1 khoa có ở nhiều cơ sở (GMHS, CĐHA, NS-TDCN…)
  // hiện thành các cột riêng, không gộp nhầm.
  const counts = {};
  const meta = {};
  tabs.forEach(t => {
    if (!t || t.missing) return;
    const cKhoa = _findCol(t.headers, "Khoa/ Phòng Sử Dụng", "Khoa/ phòng sử dụng", "Khoa/ Phòng SD", "Khoa", "Khoa yêu cầu");
    const cCoSo = _findCol(t.headers, "Cơ sở 1", "Cơ sở");
    const cHT = _findCol(t.headers, "Đã Hoàn Thành", "Đã HT");
    const cTinh = _findCol(t.headers, "Tình trạng", "Trạng thái", "Trạng thái xử lý");
    if (cKhoa < 0) return;
    t.rows.forEach(row => {
      const k = (row[cKhoa] || "").toString().trim();
      if (!k || k.length < 2) return;
      
      const tinh = cTinh >= 0 ? (row[cTinh] || "").toString().toLowerCase() : "";
      const isThanhLy = tinh.indexOf("thanh lý") >= 0;
      const isKhoDone = tinh.indexOf("đã cấp đủ") >= 0;
      
      // Máy thanh lý luôn được tính là vướng mắc
      if ((_isDone(row[cHT]) || isKhoDone) && !isThanhLy) return;
      
      const co = cCoSo >= 0 ? (row[cCoSo] || "").toString().trim() : "";
      // Rút gọn cơ sở để hiển thị chip ngắn (CS1/CS2/CS3 hoặc giữ nguyên nếu khác mẫu)
      const coShort = co.replace(/^Cơ sở\s*/i, "CS").replace(/\s*-\s*.+$/, "");
      const key = co ? (k + " · " + coShort) : k;
      counts[key] = (counts[key] || 0) + 1;
      if (!meta[key]) meta[key] = { khoa: k, coso: co };
    });
  });
  return Object.keys(counts).map(key => ({
    key: key,
    khoa: meta[key].khoa,
    coso: meta[key].coso,
    label: key,
    count: counts[key]
  })).sort((a, b) => b.count - a.count).slice(0, 10);
}

function _topHot(kt, hs, kho5a, limit) {
  const items = [];
  const today = new Date(); today.setHours(0,0,0,0);

  if (kt && !kt.missing) {
    const cTen = _findCol(kt.headers, "Tên Thiết Bị", "Tên");
    const cKhoa = _findCol(kt.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
    const cCoSo = _findCol(kt.headers, "Cơ sở 1", "Cơ sở");
    const cCB = _findCol(kt.headers, "CB phụ trách", "Cán bộ Quản lý");
    const cTinh = _findCol(kt.headers, "Tình trạng");
    const cCT = _findCol(kt.headers, "Chi tiết tình trạng", "Chi tiết");
    const cUT = _findCol(kt.headers, "Cấp độ ưu tiên");
    const cHT = _findCol(kt.headers, "Đã Hoàn Thành");
    const cDL = _findCol(kt.headers, "Deadline");
    kt.rows.forEach((row, i) => {
      if (!_isCao(row[cUT])) return;
      if (_isDone(row[cHT])) return;
      const tinh = (row[cTinh] || "").toString();
      if (tinh.indexOf("thanh lý") >= 0) return;
      const dl = _toDate(row[cDL]);
      const tre = dl && dl < today ? _daysBetween(dl, today) : 0;
      const khoa = (row[cKhoa] || "").toString();
      const coso = cCoSo>=0 ? (row[cCoSo] || "").toString() : "";
      items.push({
        team: "KT",
        teamLabel: "🔧 KT",
        title: (row[cTen] || "?").toString(),
        subtitle: khoa + (coso ? " · " + coso.replace(/^Cơ sở\s*/i, "CS").replace(/\s*-\s*.+$/, "") : ""),
        detail: _truncate((row[cCT] || row[cTinh] || ""), 100),
        cb: cCB>=0 ? (row[cCB] || "").toString() : "",
        badge: tre > 0 ? "Trễ " + tre + "n" : tinh,
        severity: 80 + Math.min(tre, 20),
        sheetRow: i + 2,
        gid: kt.gid,
        linkType: "KT",
        linkId: (row[cTen] || "").toString(),
        linkTab: TAB.KY_THUAT
      });
    });
  }

  if (kho5a && !kho5a.missing) {
    const cTen = _findCol(kho5a.headers, "Tên VTTH");
    const cKhoa = _findCol(kho5a.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
    const cTon = _findCol(kho5a.headers, "Tồn hiện tại");
    const cMin = _findCol(kho5a.headers, "Định mức MIN");
    const cTT = _findCol(kho5a.headers, "Trạng thái cảnh báo");
    const cDOH = _findCol(kho5a.headers, "Số ngày tồn", "DOH");
    kho5a.rows.forEach((row, i) => {
      const tt = (row[cTT] || "").toString();
      if (tt.indexOf("ĐỎ") < 0) return;
      items.push({
        team: "KHO",
        teamLabel: "📦 Kho",
        title: (row[cTen] || "?").toString(),
        subtitle: (row[cKhoa] || "").toString(),
        detail: "Tồn: " + (row[cTon] || 0) + " | MIN: " + (row[cMin] || "?") + " | DOH: " + (row[cDOH] || "?"),
        badge: tt,
        severity: 95,
        sheetRow: i + 2,
        gid: kho5a.gid,
        linkTab: TAB.KHO_5A,
        linkTitle: (row[cTen] || "Hàng kho 5A").toString()
      });
    });
  }

  if (hs && !hs.missing) {
    const cMa = _findCol(hs.headers, "Mã Hồ sơ", "Mã HS");
    const cND = _findCol(hs.headers, "Nội dung công việc được giao", "Nội dung");
    const cKhoa = _findCol(hs.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
    const cCB = _findCol(hs.headers, "Cán bộ phụ trách", "CB phụ trách");
    const cVM = _findCol(hs.headers, "Khó khăn, vướng mắc", "Vướng mắc");
    const cUT = _findCol(hs.headers, "Cấp độ ưu tiên");
    const cHT = _findCol(hs.headers, "Đã Hoàn Thành");
    const cDL = _findCol(hs.headers, "Deadline");
    hs.rows.forEach((row, i) => {
      if (_isDone(row[cHT])) return;
      const vm = (row[cVM] || "").toString().trim();
      const dl = _toDate(row[cDL]);
      const tre = dl && dl < today ? _daysBetween(dl, today) : 0;
      const cao = _isCao(row[cUT]);
      if (!vm && tre <= 0 && !cao) return;
      items.push({
        team: "HS",
        teamLabel: "📁 HS",
        title: (row[cMa] || "") + " — " + _truncate(row[cND] || "?", 80),
        subtitle: (row[cKhoa] || "").toString(),
        detail: _truncate(vm, 120),
        cb: cCB>=0 ? (row[cCB] || "").toString() : "",
        badge: tre > 0 ? "Trễ " + tre + "n" : (cao ? "CAO" : "Vướng"),
        severity: 70 + Math.min(tre, 25),
        sheetRow: i + 2,
        gid: hs.gid,
        linkType: "HS",
        linkId: ((row[cMa] || row[cND]) || "").toString(),
        linkTab: TAB.HO_SO
      });
    });
  }

  // v2.7.2: thêm VT hot items (vướng + trễ + CAO + chưa HT)
  // (parameter chỉ có kt/hs/kho5a; phải _readTab VT thêm — chỉ làm nếu cần thiết)
  // Để tối ưu, bỏ qua VT ở topHot — task VT thường là gói thầu admin, không phải hot trực tiếp.

  // v2.7.2: KHO items thêm CB Kho phụ trách (nếu có)
  // Đã ở B trên; bỏ qua.

  items.sort((a, b) => b.severity - a.severity);
  // v2.7.2: KHÔNG slice limit ở backend nữa — frontend group theo team rồi take top 5/team
  return items;
}

// ============================================================================
//  API ENDPOINT — KỸ THUẬT
// ============================================================================
function getKyThuat() {
  const t = _readTab(TAB.KY_THUAT);
  if (t.missing) return { rows: [], gid: null, missing: true };
  const c = {
    ten:    _findCol(t.headers, "Tên Thiết Bị", "Tên TB", "Tên"),
    khoa:   _findCol(t.headers, "Khoa/ Phòng Sử Dụng", "Khoa"),
    info:   _findCol(t.headers, "Thông tin thiết bị", "Hãng"),
    coso:   _findCol(t.headers, "Cơ sở"),
    cb:     _findCol(t.headers, "CB phụ trách", "Cán bộ Quản lý", "Cán bộ phụ trách"),
    cbhs:   _findCol(t.headers, "Cán bộ Hồ sơ phối hợp", "CB phối hợp"),
    tinh:   _findCol(t.headers, "Tình trạng"),
    chitiet:_findCol(t.headers, "Chi tiết tình trạng", "Chi tiết"),
    nhan:   _findCol(t.headers, "Ngày bắt đầu", "Ngày bắt đầu nhận việc"),
    buoc:   _findCol(t.headers, "Tiến độ, bước đang thực hiện", "Tiến độ"),
    nht:    _findCol(t.headers, "Ngày dự kiến hoàn thành"),
    dl:     _findCol(t.headers, "Deadline"),
    vuong:  _findCol(t.headers, "Khó khăn, vướng mắc", "Vướng mắc"),
    dexuat: _findCol(t.headers, "Đề xuất, giải pháp", "Đề xuất"),
    cd:     _findCol(t.headers, "Chỉ đạo của Lãnh đạo", "Chỉ đạo"),
    ut:     _findCol(t.headers, "Cấp độ ưu tiên"),
    ht:     _findCol(t.headers, "Đã Hoàn Thành", "Đã HT")
  };
  const today = new Date(); today.setHours(0,0,0,0);

  const rows = t.rows.map((row, i) => {
    const ten = (row[c.ten] || "").toString().trim();
    if (!ten) return null;
    const dl = _toDate(row[c.dl]);
    const tre = dl && dl < today && !_isDone(row[c.ht]) ? _daysBetween(dl, today) : null;
    return {
      idx: i + 2,
      gid: t.gid,
      ten: ten,
      khoa: (row[c.khoa] || "").toString(),
      info: (row[c.info] || "").toString(),
      coso: (row[c.coso] || "").toString(),
      cb: (row[c.cb] || "").toString(),
      cbhs: (row[c.cbhs] || "").toString(),
      tinh: (row[c.tinh] || "").toString(),
      chitiet: (row[c.chitiet] || "").toString(),
      nhan: _formatDate(row[c.nhan]),
      buoc: (row[c.buoc] || "").toString(),
      nht: _formatDate(row[c.nht]),
      dl: _formatDate(row[c.dl]),
      tre: tre,
      vuong: (row[c.vuong] || "").toString(),
      dexuat: (row[c.dexuat] || "").toString(),
      cd: (row[c.cd] || "").toString(),
      ut: (row[c.ut] || "").toString(),
      ht: _isDone(row[c.ht])
    };
  }).filter(r => r);

  // v2.7: cbList — danh sách CB unique cho filter dropdown
  const cbSet = {};
  rows.forEach(function(r) {
    if (r.cb && r.cb.trim()) cbSet[r.cb.trim()] = 1;
    if (r.cbhs && r.cbhs.trim()) cbSet[r.cbhs.trim()] = 1;
  });
  const cbList = Object.keys(cbSet).sort(function(a, b) { return a.localeCompare(b, "vi"); });

  return { rows, gid: t.gid, sheetUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID, cbList: cbList };
}

function _formatDate(v) {
  const d = _toDate(v);
  if (!d) return (v || "").toString();
  return Utilities.formatDate(d, TIMEZONE, "dd/MM/yyyy");
}

// ============================================================================
//  API ENDPOINT — HỒ SƠ (Pipeline)
// ============================================================================
function getHoSo() {
  const t = _readTab(TAB.HO_SO);
  if (t.missing) return { rows: [], pipeline: [], gid: null, missing: true };
  const c = {
    stt:    _findCol(t.headers, "STT"),
    ma:     _findCol(t.headers, "Mã Hồ sơ", "Mã HS"),
    nd:     _findCol(t.headers, "Nội dung công việc được giao", "Nội dung"),
    khoa:   _findCol(t.headers, "Khoa/ Phòng Sử Dụng", "Khoa"),
    coso:   _findCol(t.headers, "Cơ sở"),
    cb:     _findCol(t.headers, "Cán bộ phụ trách", "CB phụ trách"),
    cbph:   _findCol(t.headers, "Cán bộ phối hợp"),
    gt:     _findCol(t.headers, "Giá trị Dự toán (VND)", "Giá trị Dự toán", "Giá trị"),
    hinh:   _findCol(t.headers, "Hình thức LCNT", "Hình thức"),
    tt:     _findCol(t.headers, "Trạng thái"),
    quy:    _findCol(t.headers, "Quy trình chi tiết", "Quy trình"),
    nhan:   _findCol(t.headers, "Ngày bắt đầu tiếp nhận", "Ngày bắt đầu"),
    buoc:   _findCol(t.headers, "Tiến độ, bước đang thực hiện", "Tiến độ bước"),
    pct:    _findCol(t.headers, "Tiến độ (%)"),
    nht:    _findCol(t.headers, "Ngày dự kiến hoàn thành"),
    dl:     _findCol(t.headers, "Deadline"),
    vuong:  _findCol(t.headers, "Khó khăn, vướng mắc", "Vướng mắc"),
    dexuat: _findCol(t.headers, "Đề xuất, giải pháp"),
    cd:     _findCol(t.headers, "Chỉ đạo Lãnh đạo", "Chỉ đạo"),
    ut:     _findCol(t.headers, "Cấp độ ưu tiên"),
    ht:     _findCol(t.headers, "Đã Hoàn Thành", "Đã HT")
  };
  const today = new Date(); today.setHours(0,0,0,0);

  const rows = t.rows.map((row, i) => {
    const ma = (row[c.ma] || "").toString().trim();
    const nd = (row[c.nd] || "").toString().trim();
    if (!ma && !nd) return null;
    const dl = _toDate(row[c.dl]);
    const ht = _isDone(row[c.ht]);
    const tre = dl && dl < today && !ht ? _daysBetween(dl, today) : null;
    const gt = parseFloat(row[c.gt]);
    return {
      idx: i + 2,
      gid: t.gid,
      stt: (row[c.stt] || "").toString(),
      ma: ma,
      nd: nd,
      khoa: (row[c.khoa] || "").toString(),
      coso: (row[c.coso] || "").toString(),
      cb: (row[c.cb] || "").toString(),
      cbph: (row[c.cbph] || "").toString(),
      gt: isNaN(gt) ? null : gt,
      hinh: (row[c.hinh] || "").toString(),
      tt: (row[c.tt] || "").toString().trim() || "(Chưa phân loại)",
      buoc: (row[c.buoc] || "").toString(),
      pct: _parsePct(row[c.pct]),
      nht: _formatDate(row[c.nht]),
      dl: _formatDate(row[c.dl]),
      tre: tre,
      vuong: (row[c.vuong] || "").toString(),
      ut: (row[c.ut] || "").toString(),
      ht: ht
    };
  }).filter(r => r);

  // Build pipeline: group by Trạng thái
  const buckets = {};
  rows.forEach(r => {
    if (r.ht) return;
    const key = r.tt || "(Chưa phân loại)";
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(r);
  });
  const pipeline = Object.keys(buckets).map(key => ({
    name: key,
    count: buckets[key].length,
    items: buckets[key]
  })).sort((a, b) => b.count - a.count);

  return { rows, pipeline, gid: t.gid, sheetUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID };
}

function _parsePct(v) {
  if (v === null || v === undefined || v === "") return null;
  const s = v.toString().replace("%", "").trim();
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return n > 1 ? Math.round(n) : Math.round(n * 100);
}

// ============================================================================
//  API ENDPOINT — VTTH
// ============================================================================
function getVTTH() {
  const t = _readTab(TAB.VTTH);
  if (t.missing) return { rows: [], gid: null, missing: true };
  const c = {
    stt:    _findCol(t.headers, "STT"),
    loai:   _findCol(t.headers, "Loại nhóm", "Nội dung công việc được giao", "Tên VTTH", "Nội dung"),
    khoa:   _findCol(t.headers, "Khoa/ Phòng Sử Dụng", "Khoa"),
    coso:   _findCol(t.headers, "Cơ sở 1", "Cơ sở"),
    cb:     _findCol(t.headers, "CB phụ trách", "Cán bộ phụ trách"),
    cbhs:   _findCol(t.headers, "CB Hồ sơ phối hợp", "Người phối hợp"),
    tt:     _findCol(t.headers, "Trạng thái"),
    nhan:   _findCol(t.headers, "Ngày bắt đầu nhận công việc", "Ngày bắt đầu"),
    buoc:   _findCol(t.headers, "Tiến độ, bước thực hiện", "Tiến độ bước"),
    pct:    _findCol(t.headers, "Tiến độ (%)"),
    nht:    _findCol(t.headers, "Ngày dự kiến hoàn thành"),
    dl:     _findCol(t.headers, "Deadline"),
    vuong:  _findCol(t.headers, "Khó khăn, vướng mắc", "Vướng mắc"),
    cd:     _findCol(t.headers, "Chỉ đạo Lãnh đạo", "Chỉ đạo"),
    ut:     _findCol(t.headers, "Cấp độ ưu tiên"),
    ht:     _findCol(t.headers, "Đã Hoàn Thành", "Đã HT")
  };
  const today = new Date(); today.setHours(0,0,0,0);

  // v2.6: bỏ enrich kho mini ở đây — tab VTTH chứa task quản lý không phải item kho,
  // match 1-1 không có ý nghĩa. Thông tin kho liên quan giờ chỉ hiện trong modal chi tiết.
  const cMaVT = _findCol(t.headers, LINK_COL.VT_MA, "Mã VT");

  const rows = t.rows.map((row, i) => {
    if (!row.some(v => v !== "" && v !== null)) return null;
    const dl = _toDate(row[c.dl]);
    const ht = _isDone(row[c.ht]);
    const tre = dl && dl < today && !ht ? _daysBetween(dl, today) : null;
    return {
      idx: i + 2,
      gid: t.gid,
      stt: (row[c.stt] || "").toString(),
      ma: cMaVT >= 0 ? (row[cMaVT] || "").toString().trim() : "",
      loai: (row[c.loai] || "").toString(),
      khoa: (row[c.khoa] || "").toString(),
      coso: (row[c.coso] || "").toString(),
      cb: (row[c.cb] || "").toString(),
      tt: (row[c.tt] || "").toString(),
      buoc: (row[c.buoc] || "").toString(),
      pct: _parsePct(row[c.pct]),
      nht: _formatDate(row[c.nht]),
      dl: _formatDate(row[c.dl]),
      tre: tre,
      vuong: (row[c.vuong] || "").toString(),
      ut: (row[c.ut] || "").toString(),
      ht: ht
    };
  }).filter(r => r);

  // v2.7.8: cbList — cho filter dropdown
  const cbSet = {};
  rows.forEach(function(r) {
    if (r.cb && r.cb.trim()) cbSet[r.cb.trim()] = 1;
  });
  const cbList = Object.keys(cbSet).sort(function(a, b) { return a.localeCompare(b, "vi"); });

  return { rows, gid: t.gid, sheetUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID, cbList: cbList };
}

// ============================================================================
//  API ENDPOINT — KHO
// ============================================================================
function getKho() {
  const t5a = _readTab(TAB.KHO_5A);
  const t5b = _readTab(TAB.KHO_5B);

  let ton = [];
  if (!t5a.missing) {
    const c = {
      stt:   _findCol(t5a.headers, "STT"),
      ma:    _findCol(t5a.headers, "Mã VTTH"),
      ten:   _findCol(t5a.headers, "Tên VTTH"),
      khoa:  _findCol(t5a.headers, "Khoa/ Phòng Sử Dụng", "Khoa"),
      loai:  _findCol(t5a.headers, "Loại"),
      coso:  _findCol(t5a.headers, "Cơ sở"),
      cb:    _findCol(t5a.headers, "CB phụ trách"),
      tdk:   _findCol(t5a.headers, "Tồn đầu kỳ"),
      nhap:  _findCol(t5a.headers, "Nhập trong kỳ"),
      xuat:  _findCol(t5a.headers, "Xuất trong kỳ"),
      ton:   _findCol(t5a.headers, "Tồn hiện tại"),
      min:   _findCol(t5a.headers, "Định mức MIN"),
      max:   _findCol(t5a.headers, "Định mức MAX"),
      tt:    _findCol(t5a.headers, "Trạng thái cảnh báo"),
      doh:   _findCol(t5a.headers, "Số ngày tồn", "DOH"),
      khoamax:_findCol(t5a.headers, "Khoa yêu cầu nhiều nhất"),
      sokhoa:_findCol(t5a.headers, "Số khoa đang chờ"),
      dexuat:_findCol(t5a.headers, "Đề xuất xử lý"),
      ghichu:_findCol(t5a.headers, "Ghi chú")
    };
    ton = t5a.rows.map((row, i) => {
      const ten = (row[c.ten] || "").toString().trim();
      if (!ten) return null;
      return {
        idx: i + 2,
        gid: t5a.gid,
        stt: row[c.stt] || (i+1),
        ma: (row[c.ma] || "").toString(),
        ten: ten,
        khoa: (row[c.khoa] || "").toString(),
        loai: (row[c.loai] || "").toString(),
        coso: (row[c.coso] || "").toString(),
        cb: (row[c.cb] || "").toString(),
        ton: row[c.ton] || 0,
        min: row[c.min] || "",
        max: row[c.max] || "",
        tt: (row[c.tt] || "").toString(),
        doh: row[c.doh] === "" || row[c.doh] === null ? null : Number(row[c.doh]),
        khoamax: (row[c.khoamax] || "").toString(),
        sokhoa: row[c.sokhoa] || 0,
        dexuat: (row[c.dexuat] || "").toString(),
        ghichu: (row[c.ghichu] || "").toString()
      };
    }).filter(r => r);
    // Sort: ĐỎ > VÀNG > XANH; trong mỗi nhóm sort by DOH ascending
    ton.sort((a, b) => {
      const sev = s => s.indexOf("ĐỎ") >= 0 ? 0 : s.indexOf("VÀNG") >= 0 ? 1 : s.indexOf("XANH") >= 0 ? 2 : 3;
      const sa = sev(a.tt), sb = sev(b.tt);
      if (sa !== sb) return sa - sb;
      const da = a.doh === null ? 99999 : a.doh;
      const db = b.doh === null ? 99999 : b.doh;
      return da - db;
    });
  }

  let dexuat = [];
  if (!t5b.missing) {
    const c = {
      stt:    _findCol(t5b.headers, "STT"),
      ngay:   _findCol(t5b.headers, "Ngày yêu cầu"),
      khoa:   _findCol(t5b.headers, "Khoa/ Phòng Sử Dụng", "Khoa yêu cầu", "Khoa"),
      coso:   _findCol(t5b.headers, "Cơ sở"),
      nguoi:  _findCol(t5b.headers, "Người yêu cầu"),
      ma:     _findCol(t5b.headers, "Mã VTTH", "Mã VT"),
      vtth:   _findCol(t5b.headers, "VTTH yêu cầu", "Tên VTTH"),
      sl:     _findCol(t5b.headers, "Số lượng"),
      dv:     _findCol(t5b.headers, "Đơn vị"),
      ut:     _findCol(t5b.headers, "Mức ưu tiên"),
      tt:     _findCol(t5b.headers, "Trạng thái xử lý", "Trạng thái"),
      cb:     _findCol(t5b.headers, "CB Kho xử lý"),
      ndk:    _findCol(t5b.headers, "Ngày dự kiến cấp"),
      ntc:    _findCol(t5b.headers, "Ngày thực cấp"),
      gc:     _findCol(t5b.headers, "Ghi chú")
    };
    dexuat = t5b.rows.map((row, i) => {
      if (!row.some(v => v !== "" && v !== null)) return null;
      return {
        idx: i + 2,
        gid: t5b.gid,
        stt: row[c.stt] || (i+1),
        ngay: _formatDate(row[c.ngay]),
        khoa: (row[c.khoa] || "").toString(),
        coso: (row[c.coso] || "").toString(),
        nguoi: (row[c.nguoi] || "").toString(),
        ma: c.ma >= 0 ? (row[c.ma] || "").toString() : "",
        vtth: (row[c.vtth] || "").toString(),
        sl: row[c.sl] || "",
        dv: (row[c.dv] || "").toString(),
        ut: (row[c.ut] || "").toString(),
        tt: (row[c.tt] || "").toString(),
        cb: (row[c.cb] || "").toString(),
        ndk: _formatDate(row[c.ndk]),
        ntc: _formatDate(row[c.ntc]),
        gc: (row[c.gc] || "").toString()
      };
    }).filter(r => r);
    // Sort: chưa cấp đủ lên đầu
    dexuat.sort((a, b) => {
      const done = s => s === "Đã cấp đủ" ? 1 : 0;
      return done(a.tt) - done(b.tt);
    });
  }

// v2.6: bỏ enrich vt/hs/queue per row — chuyển sang lazy load qua getKhoDetail()
  // khi user click 1 row expand. Tab Kho load nhanh hơn ~3-5x.

  // v2.8: Forecast cung ứng — tính risk cho mỗi mặt hàng
  const linkIdx = _buildLinkIndex();
  const forecast = {
    stats: { l1:0, l2:0, l3:0, l4:0, l5:0, stagnant:0, stagnantHigh:0, stagnantLong:0, l1NoSolution:0, l2NoSolution:0 },
    items: []
  };
  ton.forEach(function(r) {
    const risk = _getSupplyRisk(r, linkIdx);
    if (!risk) return;
    if (risk.level === 1) forecast.stats.l1++;
    else if (risk.level === 2) forecast.stats.l2++;
    else if (risk.level === 3) forecast.stats.l3++;
    else if (risk.level === 4) forecast.stats.l4++;
    else if (risk.level === 5) forecast.stats.l5++;
    if (risk.stagnant) forecast.stats.stagnant++;
    if (risk.stagnantTier === 2) forecast.stats.stagnantHigh++;
    if (risk.stagnantTier === 3) forecast.stats.stagnantLong++;
    if (risk.level === 1 && !risk.ok) forecast.stats.l1NoSolution++;
    if (risk.level === 2 && !risk.ok) forecast.stats.l2NoSolution++;
    if (risk.level <= 4 || risk.stagnant) {
      forecast.items.push({
        ma: r.ma, ten: r.ten, khoa: r.khoa, ton: r.ton, doh: r.doh,
        tt: r.tt, gid: r.gid, idx: r.idx, dexuat: r.dexuat,
        risk: risk
      });
    }
  });
  // Sort: level thấp lên đầu (KHẨN trước), trong cùng level sort theo DOH tăng dần
  forecast.items.sort(function(a, b) {
    if (a.risk.level !== b.risk.level) return a.risk.level - b.risk.level;
    return a.risk.doh - b.risk.doh;
  });

  return { ton, dexuat, forecast, sheetUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID };
}

// ============================================================================
//  v2.8 — Logic dự đoán cung ứng VTTH/Hóa chất
//  4 mức cảnh báo theo DOH + map đến trạng thái HS gói thầu
// ============================================================================

// Phân stage HS gói thầu (0=chưa có/không rõ, 1=chuẩn bị, 2=KHLCNT phê duyệt,
//  3=phát hành HSMT, 4=đánh giá HSDT, 5=đã trình, 6=đã ký)
function _hsStage(tt) {
  const s = (tt || "").toString().toLowerCase();
  if (!s) return 0;
  if (s.indexOf("ký hợp đồng") >= 0 || s.indexOf("đã ký") >= 0) return 6;
  if (s.indexOf("đã trình") >= 0 || s.indexOf("trình duyệt") >= 0 || s.indexOf("trình thẩm") >= 0 || s.indexOf("phê duyệt kết quả") >= 0) return 5;
  if (s.indexOf("đánh giá") >= 0 || s.indexOf("mở thầu") >= 0 || s.indexOf("chấm thầu") >= 0) return 4;
  if (s.indexOf("phát hành") >= 0 || s.indexOf("đăng tải hsmt") >= 0 || s.indexOf("đang đấu thầu") >= 0) return 3;
  if (s.indexOf("phê duyệt khlcnt") >= 0 || s.indexOf("khlcnt") >= 0 || s.indexOf("kế hoạch lựa chọn") >= 0) return 2;
  if (s.indexOf("chuẩn bị") >= 0 || s.indexOf("khảo sát") >= 0 || s.indexOf("dự thảo") >= 0) return 1;
  return 0;
}

// Là gói thầu kiểu "shortcut" — chỉ định thầu / mua trực tiếp / chào hàng / chào giá
function _isShortcutHS(hsObj) {
  const s = ((hsObj.tt || "") + " " + (hsObj.hinh || hsObj.hinhthuc || "")).toLowerCase();
  return /chỉ định|mua sắm trực tiếp|mua trực tiếp|chào hàng|chào giá/.test(s);
}

// Đánh giá risk cho 1 mặt hàng 5A — trả về { level, color, label, action, ok, doh, linkedHs[] }
function _getSupplyRisk(item, idx) {
  const doh = Number(item.doh);
  if (isNaN(doh) || doh < 0) return null;

  // Tìm VT/HS liên kết qua Mã VTTH (primary) hoặc tên (fallback)
  const keyMa = (item.ma || "").toString().toLowerCase().trim();
  const keyName = _norm(item.ten || "");
  let linkedVt = null;
  if (keyMa) linkedVt = idx.vtByMaLow[keyMa] || null;
  if (!linkedVt && keyName) linkedVt = idx.vtByName[keyName] || null;
  let linkedHs = [];
  if (linkedVt) {
    const list = idx.vtToHs[linkedVt.ma] || [];
    linkedHs = list.map(function(m) { return idx.hs[m]; }).filter(Boolean);
  }
  // Fallback: nếu chưa có VT match, tìm HS qua tên VTTH (rộng hơn)
  if (!linkedHs.length && keyName) {
    for (let i = 0; i < idx.hsList.length; i++) {
      if (linkedHs.length >= 3) break;
      const h = idx.hsList[i];
      if (h.norm && h.norm.indexOf(keyName) >= 0) linkedHs.push(h.obj);
    }
  }

  const maxStage = linkedHs.length ? Math.max.apply(null, linkedHs.map(function(h) { return _hsStage(h.tt); })) : 0;
  const hasShortcut = linkedHs.some(_isShortcutHS);
  const bestHs = linkedHs.length ? linkedHs.reduce(function(best, h) {
    return (_hsStage(h.tt) > _hsStage(best.tt)) ? h : best;
  }, linkedHs[0]) : null;
  const bestHsStr = bestHs ? ("[" + (bestHs.ma || "?") + " · " + (bestHs.tt || "?") + (bestHs.cb ? " · " + bestHs.cb : "") + "]") : "";

  let level, color, label, action, ok;

  if (doh < 30) {
    level = 1; color = "red"; label = "🚨 Mức 1 — KHẨN";
    if (hasShortcut && maxStage >= 4) {
      ok = true;
      action = "✓ Đang xử lý qua chỉ định thầu/mua trực tiếp " + bestHsStr;
    } else if (linkedHs.length === 0) {
      ok = false;
      action = "🚨 Chưa có gói thầu — TRIỂN KHAI NGAY: chào giá trực tuyến / chỉ định thầu / mua sắm trực tiếp";
    } else {
      ok = false;
      action = "🚨 Đang ở '" + (bestHs.tt || "?") + "' — cần shortcut sang chỉ định thầu / mua trực tiếp ngay " + bestHsStr;
    }
  } else if (doh < 60) {
    level = 2; color = "orange"; label = "🔴 Mức 2 — CAO";
    if (maxStage >= 4 || hasShortcut) {
      ok = true;
      action = "✓ Đã đến bước đánh giá HSDT hoặc shortcut — bám tiến độ " + bestHsStr;
    } else if (linkedHs.length === 0) {
      ok = false;
      action = "⚠ Chưa có gói thầu — phải đến bước đánh giá HSDT / chỉ định thầu / mua trực tiếp mới kịp";
    } else {
      ok = false;
      action = "⚠ Đang ở '" + (bestHs.tt || "?") + "' — cần đến bước đánh giá HSDT hoặc shortcut " + bestHsStr;
    }
  } else if (doh < 90) {
    level = 3; color = "yellow"; label = "🟡 Mức 3 — TRUNG";
    if (maxStage >= 2) {
      ok = true;
      action = "✓ KHLCNT đã được phê duyệt — theo dõi sát " + bestHsStr;
    } else if (linkedHs.length === 0) {
      ok = false;
      action = "⚠ Chưa có gói thầu — cần phê duyệt KHLCNT trước khi DOH xuống dưới 60n";
    } else {
      ok = false;
      action = "⚠ Đang ở '" + (bestHs.tt || "?") + "' — phải có phê duyệt KHLCNT mới kịp " + bestHsStr;
    }
  } else if (doh < 180) {
    level = 4; color = "blue"; label = "🟢 Mức 4 — Trong tầm";
    ok = true;
    action = "✓ Trong tầm quy trình thầu rộng rãi — DOH " + doh + " ngày · 📦 tồn cao, kiểm tra nhu cầu sử dụng" + (linkedHs.length ? " · " + bestHsStr : "");
  } else if (doh < 365) {
    level = 5; color = "gray"; label = "📦 Tồn đọng 6 tháng";
    ok = true;
    action = "⚠ Tồn đọng " + Math.round(doh/30) + " tháng — đề xuất chuyển khoa khác / điều chuyển nội bộ / xử lý theo quy định";
  } else {
    level = 5; color = "darkred"; label = "🚨 Tồn đọng > 1 năm";
    ok = false;
    action = "🚨 Tồn đọng " + Math.round(doh/30) + " tháng (>1 năm) — BẮT BUỘC rà soát: chuyển dùng / điều chuyển / thanh lý nếu hết hạn";
  }

  // v2.8.1: Phân cấp tồn đọng (stagnantTier)
  // 0 = không tồn đọng (DOH<90), 1 = tồn cao (90-180), 2 = tồn dài (180-365), 3 = tồn rất dài (>365)
  let stagnantTier = 0;
  if (doh >= 365) stagnantTier = 3;
  else if (doh >= 180) stagnantTier = 2;
  else if (doh >= 90) stagnantTier = 1;
  const stagnant = stagnantTier > 0;

  return {
    level: level, color: color, label: label, action: action, ok: ok,
    stagnant: stagnant, stagnantTier: stagnantTier,
    doh: doh, linkedHs: linkedHs.slice(0, 3),
    bestHs: bestHs, maxStage: maxStage
  };
}

// ============================================================================
//  API ENDPOINT — getKhoDetail (v2.6) — lazy load expand row trong tab Kho
//  Trả về: stock + queue 5B + VT khớp + HS qua VT cho 1 mặt hàng kho cụ thể
// ============================================================================
function getKhoDetail(idVT) {
  if (!idVT) return { error: "Thiếu Mã/Tên VTTH" };
  const idx = _buildLinkIndex();
  const sheetUrl = "https://docs.google.com/spreadsheets/d/" + SHEET_ID;
  const keyMa = idVT.toString().toLowerCase().trim();
  const keyName = _norm(idVT);
  let stock = idx.kho5a[keyMa] || idx.kho5aByName[keyName] || null;
  if (!stock && keyName) {
    const tokens = keyName.split(/\s+/).filter(function(t) { return t.length > 3; });
    Object.keys(idx.kho5aByName).forEach(function(k) {
      if (stock) return;
      if (tokens.some(function(t) { return k.indexOf(t) >= 0; })) stock = idx.kho5aByName[k];
    });
  }
  if (!stock) return { error: "Không tìm thấy mặt hàng kho: " + idVT };

  const sMa = (stock.ma || "").toLowerCase();
  const sName = _norm(stock.ten || "");

  // queue 5B
  let queue = [];
  if (sMa && idx.kho5b[sMa]) queue = idx.kho5b[sMa].slice();
  if (!queue.length && sName && idx.kho5bByName[sName]) queue = idx.kho5bByName[sName].slice();
  queue.sort(function(a, b) {
    const da = (a.tt || "").indexOf("Đã cấp đủ") >= 0 ? 1 : 0;
    const db = (b.tt || "").indexOf("Đã cấp đủ") >= 0 ? 1 : 0;
    if (da !== db) return da - db;
    const ua = (a.ut || "").indexOf("CAO") >= 0 ? 0 : 1;
    const ub = (b.ut || "").indexOf("CAO") >= 0 ? 0 : 1;
    return ua - ub;
  });
  const queueOpen = queue.filter(function(q) { return (q.tt || "").indexOf("Đã cấp đủ") < 0; }).length;

  // back-link VT
  const vts = [];
  if (sMa) Object.values(idx.vt).forEach(function(v) {
    if ((v.ma || "").toLowerCase() === sMa) vts.push(v);
  });
  if (!vts.length && sName) {
    const v = idx.vtByName[sName];
    if (v) vts.push(v);
  }
  // back-link HS via VT
  const hsSet = {};
  const hss = [];
  vts.forEach(function(v) {
    (idx.vtToHs[v.ma] || []).forEach(function(maHs) {
      const h = idx.hs[maHs];
      if (h && !hsSet[h.ma]) { hsSet[h.ma] = 1; hss.push(h); }
    });
  });

  return {
    stock: stock,
    queue: queue.slice(0, 8),
    queueOpen: queueOpen,
    vt: vts.slice(0, 5),
    hs: hss.slice(0, 5),
    sheetUrl: sheetUrl
  };
}

// v2.6: Tìm mặt hàng Kho 5A "cùng loại / cùng khoa" cho 1 task VT (Modal VT)
function _findRelatedKhoItems(vtObj, idx) {
  if (!vtObj) return [];
  const tenN = _norm(vtObj.ten || "");
  const khoaN = _norm(vtObj.khoa || "");
  const tokens = tenN.split(/\s+/).filter(function(t) { return t.length > 3; });
  const items = [];
  Object.values(idx.kho5a).forEach(function(k) {
    let score = 0;
    const kKhoaMax = _norm(k.khoamax || "");
    const kTen = _norm(k.ten || "");
    if (khoaN && kKhoaMax && kKhoaMax.indexOf(khoaN) >= 0) score += 2;
    if (tokens.length && tokens.some(function(t) { return kTen.indexOf(t) >= 0; })) score += 3;
    if (score > 0) items.push(Object.assign({}, k, { _score: score }));
  });
  items.sort(function(a, b) { return b._score - a._score; });
  return items.slice(0, 8);
}

// ============================================================================
//  API ENDPOINT — getRowDetail (v2.4) — đọc 1 hàng raw cho generic row modal
// ============================================================================
function getRowDetail(tabName, rowIdx) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheetByName(tabName);
    if (!sh) return { error: "Không tìm thấy tab: " + tabName };
    const r = parseInt(rowIdx, 10);
    if (!r || r < 2) return { error: "Row index không hợp lệ: " + rowIdx };
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const last = sh.getLastRow();
    if (r > last) return { error: "Hàng " + r + " vượt quá " + last };
    const row = sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0];
    const fields = [];
    for (let i = 0; i < headers.length; i++) {
      const h = (headers[i] || "").toString().trim();
      if (!h) continue;
      let v = row[i];
      if (v instanceof Date) v = Utilities.formatDate(v, TIMEZONE, "dd/MM/yyyy");
      else if (v === null || v === undefined) v = "";
      else v = v.toString();
      fields.push({ key: h, val: v });
    }
    return {
      tab: tabName,
      rowIdx: r,
      gid: sh.getSheetId(),
      sheetUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID,
      fields: fields
    };
  } catch (e) {
    return { error: "Lỗi đọc row: " + (e && e.message || e) };
  }
}

// ============================================================================
//  API ENDPOINT — THEO KHOA
// ============================================================================
function getByKhoa(khoaName, cosoFilter) {
  try {
    return _getByKhoaImpl(khoaName, cosoFilter);
  } catch (e) {
    return { error: "Lỗi getByKhoa: " + (e && e.message || e), khoaList: [], kt:[], hs:[], vt:[], kho:[], summary:{totalKT:0,doneKT:0,totalHS:0,doneHS:0,totalVT:0,totalKho:0} };
  }
}
function _getByKhoaImpl(khoaName, cosoFilter) {
  const kt = _readTab(TAB.KY_THUAT);
  const hs = _readTab(TAB.HO_SO);
  const vt = _readTab(TAB.VTTH);
  const kho5b = _readTab(TAB.KHO_5B);

  const norm = s => _norm(s);
  const target = norm(khoaName || "");

  function filterTab(t, khoaCol, mapper) {
    if (!t || t.missing) return [];
    const idx = _findCol(t.headers, ...khoaCol);
    if (idx < 0) return [];
    // v2.7: thêm filter cơ sở nếu user chỉ định
    const cIdxCoSo = _findCol(t.headers, "Cơ sở 1", "Cơ sở");
    const targetCoSo = cosoFilter ? norm(cosoFilter) : "";
    return t.rows.map((row, i) => ({ row, i })).filter(o => {
      const k = norm(o.row[idx]);
      if (!k) return false;
      const khoaMatch = (k === target || k.indexOf(target) >= 0 || target.indexOf(k) >= 0);
      if (!khoaMatch) return false;
      if (targetCoSo && cIdxCoSo >= 0) {
        const co = norm(o.row[cIdxCoSo]);
        if (co.indexOf(targetCoSo) < 0 && targetCoSo.indexOf(co) < 0) return false;
      }
      return true;
    }).map(o => mapper(o.row, o.i, t.gid));
  }

  // List unique khoa across tabs
  const khoaSet = new Set();
  [kt, hs, vt, kho5b].forEach(t => {
    if (!t || t.missing) return;
    const idx = _findCol(t.headers, "Khoa/ Phòng Sử Dụng", "Khoa/ phòng sử dụng", "Khoa yêu cầu", "Khoa");
    if (idx < 0) return;
    t.rows.forEach(row => {
      const k = (row[idx] || "").toString().trim();
      if (k && k.length > 2) khoaSet.add(k);
    });
  });
  const allKhoa = Array.from(khoaSet).sort();

  if (!khoaName) return { khoaList: allKhoa };

  const ktItems = filterTab(kt, ["Khoa/ Phòng Sử Dụng", "Khoa"], (row, i, gid) => {
    const c = {
      ten:_findCol(kt.headers, "Tên Thiết Bị"),
      tinh:_findCol(kt.headers, "Tình trạng"),
      ct:_findCol(kt.headers, "Chi tiết tình trạng"),
      cb:_findCol(kt.headers, "CB phụ trách", "Cán bộ Quản lý"),
      buoc:_findCol(kt.headers, "Tiến độ, bước đang thực hiện"),
      dl:_findCol(kt.headers, "Deadline"),
      ht:_findCol(kt.headers, "Đã Hoàn Thành")
    };
    return {
      idx: i+2, gid: gid,
      ten: (row[c.ten]||"").toString(),
      tinh: (row[c.tinh]||"").toString(),
      ct: (row[c.ct]||"").toString(),
      cb: (row[c.cb]||"").toString(),
      buoc: (row[c.buoc]||"").toString(),
      dl: _formatDate(row[c.dl]),
      ht: _isDone(row[c.ht])
    };
  }).filter(r => r.ten);

  const hsItems = filterTab(hs, ["Khoa/ Phòng Sử Dụng", "Khoa"], (row, i, gid) => {
    const c = {
      ma:_findCol(hs.headers, "Mã Hồ sơ"),
      nd:_findCol(hs.headers, "Nội dung công việc được giao"),
      tt:_findCol(hs.headers, "Trạng thái"),
      pct:_findCol(hs.headers, "Tiến độ (%)"),
      cb:_findCol(hs.headers, "Cán bộ phụ trách"),
      dl:_findCol(hs.headers, "Deadline"),
      ht:_findCol(hs.headers, "Đã Hoàn Thành")
    };
    return {
      idx: i+2, gid: gid,
      ma: (row[c.ma]||"").toString(),
      nd: (row[c.nd]||"").toString(),
      tt: (row[c.tt]||"").toString(),
      pct: _parsePct(row[c.pct]),
      cb: (row[c.cb]||"").toString(),
      dl: _formatDate(row[c.dl]),
      ht: _isDone(row[c.ht])
    };
  }).filter(r => r.ma || r.nd);

  const vtItems = filterTab(vt, ["Khoa/ Phòng Sử Dụng", "Khoa"], (row, i, gid) => {
    const c = {
      loai:_findCol(vt.headers, "Loại nhóm", "Nội dung công việc được giao"),
      tt:_findCol(vt.headers, "Trạng thái"),
      pct:_findCol(vt.headers, "Tiến độ (%)"),
      cb:_findCol(vt.headers, "CB phụ trách"),
      dl:_findCol(vt.headers, "Deadline"),
      ht:_findCol(vt.headers, "Đã Hoàn Thành")
    };
    return {
      idx: i+2, gid: gid,
      loai: (row[c.loai]||"").toString(),
      tt: (row[c.tt]||"").toString(),
      pct: _parsePct(row[c.pct]),
      cb: (row[c.cb]||"").toString(),
      dl: _formatDate(row[c.dl]),
      ht: _isDone(row[c.ht])
    };
  });

  const khoItems = filterTab(kho5b, ["Khoa yêu cầu", "Khoa/ Phòng Sử Dụng", "Khoa"], (row, i, gid) => {
    const c = {
      ngay:_findCol(kho5b.headers, "Ngày yêu cầu"),
      vtth:_findCol(kho5b.headers, "VTTH yêu cầu"),
      sl:_findCol(kho5b.headers, "Số lượng"),
      ut:_findCol(kho5b.headers, "Mức ưu tiên"),
      tt:_findCol(kho5b.headers, "Trạng thái xử lý")
    };
    return {
      idx: i+2, gid: gid,
      ngay: _formatDate(row[c.ngay]),
      vtth: (row[c.vtth]||"").toString(),
      sl: row[c.sl] || "",
      ut: (row[c.ut]||"").toString(),
      tt: (row[c.tt]||"").toString()
    };
  });

  return {
    khoaList: allKhoa,
    khoa: khoaName,
    kt: ktItems,
    hs: hsItems,
    vt: vtItems,
    kho: khoItems,
    summary: {
      totalKT: ktItems.length,
      // v2.8.3: Máy thanh lý không được tính là "Đã xong" đối với khoa
      doneKT: ktItems.filter(r => r.ht && (r.tinh||"").toLowerCase().indexOf("thanh lý") < 0).length,
      totalHS: hsItems.length,
      doneHS: hsItems.filter(r => r.ht).length,
      totalVT: vtItems.length,
      totalKho: khoItems.length
    }
  };
}

// ============================================================================
//  EMAIL BRIEF SÁNG (giữ đơn giản)
// ============================================================================
// ============================================================================
//  LINK INDEX (v2.3) — đọc + index toàn bộ liên kết KT↔VT↔HS
// ============================================================================
function _parseLinks(s) {
  if (!s) return [];
  return s.toString().split(/[,;\n]+/).map(x => x.trim()).filter(x => x && !x.startsWith("("));
}

// ============================================================================
//  v2.6: Cache layer cho _buildLinkIndex — perf win lớn nhất
//  Mọi endpoint gọi cùng index → chỉ build 1 lần / 5 phút thay vì mỗi click
// ============================================================================
const _IDX_CACHE_PREFIX = "v31_lidx_";
const _IDX_CACHE_TTL = 300; // 5 phút

function _idxCacheGet() {
  try {
    const c = CacheService.getScriptCache();
    const meta = c.get(_IDX_CACHE_PREFIX + "m");
    if (!meta) return null;
    const n = parseInt(meta, 10);
    if (!n || n > 50) return null;
    const keys = [];
    for (let i = 0; i < n; i++) keys.push(_IDX_CACHE_PREFIX + i);
    const chunks = c.getAll(keys);
    let json = "";
    for (let i = 0; i < n; i++) {
      const k = _IDX_CACHE_PREFIX + i;
      if (!chunks[k]) return null;
      json += chunks[k];
    }
    return JSON.parse(json);
  } catch (e) { return null; }
}

function _idxCachePut(idx) {
  try {
    const json = JSON.stringify(idx);
    const CHUNK = 90 * 1024;
    const c = CacheService.getScriptCache();
    const obj = {};
    let n = 0;
    for (let i = 0; i < json.length; i += CHUNK) {
      obj[_IDX_CACHE_PREFIX + n] = json.substring(i, i + CHUNK);
      n++;
    }
    obj[_IDX_CACHE_PREFIX + "m"] = String(n);
    c.putAll(obj, _IDX_CACHE_TTL);
  } catch (e) { /* cache full or too big — skip silently */ }
}

function invalidateLinkIndex() {
  try {
    const c = CacheService.getScriptCache();
    const keys = [_IDX_CACHE_PREFIX + "m"];
    for (let i = 0; i < 30; i++) keys.push(_IDX_CACHE_PREFIX + i);
    c.removeAll(keys);
    return { ok: true, msg: "Đã làm mới cache, dữ liệu sẽ build lại ở lần gọi tiếp theo." };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function _buildLinkIndex() {
  const cached = _idxCacheGet();
  if (cached) return cached;
  const idx = _buildLinkIndexRaw();
  _idxCachePut(idx);
  return idx;
}

function _buildLinkIndexRaw() {
  const kt = _readTab(TAB.KY_THUAT);
  const hs = _readTab(TAB.HO_SO);
  const vt = _readTab(TAB.VTTH);
  const map = _readTab(TAB.MAP_LIENKET);

  const idx = {
    kt: {},   // ma -> {row, ten, khoa, tinh, ...}
    hs: {},
    vt: {},
    ktByName: {},
    vtByName: {},
    hsByName: {},
    hsByMaLow: {},
    vtByMaLow: {},
    hsList: [], // v2.9: pre-norm list for fuzzy search
    // edges
    ktToHs: {},  // maKT -> [maHS, ...]
    ktToVt: {},
    hsToKt: {},
    hsToVt: {},
    vtToHs: {},
    vtToKt: {}
  };

  // Index KT
  if (!kt.missing) {
    const cMa = _findCol(kt.headers, LINK_COL.KT_MA, "Mã KT");
    const cTen = _findCol(kt.headers, "Tên Thiết Bị", "Tên TB", "Tên");
    const cKhoa = _findCol(kt.headers, "Khoa/ Phòng Sử Dụng", "Khoa", "Phòng");
    const cTinh = _findCol(kt.headers, "Tình trạng");
    const cChiTiet = _findCol(kt.headers, "Chi tiết tình trạng", "Chi tiết");
    const cCB = _findCol(kt.headers, "CB phụ trách", "CB");
    const cDL = _findCol(kt.headers, "Deadline");
    const cVM = _findCol(kt.headers, "Khó khăn", "Vướng mắc");
    const cHT = _findCol(kt.headers, "Đã Hoàn Thành", "Đã HT");
    const cLkHS = _findCol(kt.headers, LINK_COL.KT_LINK_HS, "Liên kết HS");
    const cLkVT = _findCol(kt.headers, LINK_COL.KT_LINK_VT, "Liên kết VT");
    kt.rows.forEach((r, i) => {
      const ma = (r[cMa] || "").toString().trim();
      const ten = (r[cTen >= 0 ? cTen : 0] || "").toString().trim();
      if (!ten) return;
      const obj = {
        ma: ma, ten: ten, khoa: (r[cKhoa] || "").toString().trim(),
        tinh: (r[cTinh] || "").toString().trim(), chiTiet: (r[cChiTiet] || "").toString().trim(),
        cb: (r[cCB] || "").toString().trim(), deadline: r[cDL] || "",
        vuong: (r[cVM] || "").toString().trim(), done: _isDone(r[cHT]),
        rowNum: i + 2, gid: kt.gid, type: "KT"
      };
      if (ma) idx.kt[ma] = obj;
      idx.ktByName[_norm(ten)] = obj;
      if (ma) {
        idx.ktToHs[ma] = _parseLinks(r[cLkHS]);
        idx.ktToVt[ma] = _parseLinks(r[cLkVT]);
      }
    });
  }

  // Index HS
  if (!hs.missing) {
    const cMa = _findCol(hs.headers, "Mã Hồ sơ", "Mã HS", "Mã");
    const cND = _findCol(hs.headers, "Nội dung công việc được giao", "Nội dung");
    const cKhoa = _findCol(hs.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
    const cTT = _findCol(hs.headers, "Trạng thái");
    const cDL = _findCol(hs.headers, "Deadline");
    const cVM = _findCol(hs.headers, "Khó khăn, vướng mắc", "Khó khăn", "Vướng mắc");
    const cHT = _findCol(hs.headers, "Đã Hoàn Thành", "Đã HT");
    const cGT = _findCol(hs.headers, "Giá trị Dự toán", "Giá trị");
    const cCB = _findCol(hs.headers, "Cán bộ phụ trách", "CB phụ trách");
    const cPct = _findCol(hs.headers, "Tiến độ (%)", "Tiến độ");
    const cLkKT = _findCol(hs.headers, LINK_COL.HS_LINK_KT, "Liên kết KT");
    const cLkVT = _findCol(hs.headers, LINK_COL.HS_LINK_VT, "Liên kết VT");
    hs.rows.forEach((r, i) => {
      const ma = (r[cMa] || "").toString().trim();
      const nd = (r[cND] || "").toString().trim();
      if (!ma && !nd) return;
      
      let pctStr = "";
      if (cPct >= 0 && r[cPct] !== undefined && r[cPct] !== null) {
        pctStr = r[cPct].toString();
      }
      
      const obj = {
        ma: ma, ten: nd, noiDung: nd, khoa: (r[cKhoa] || "").toString().trim(),
        tt: (r[cTT] || "").toString().trim(), deadline: r[cDL] || "",
        vuong: (r[cVM] || "").toString().trim(), done: _isDone(r[cHT]),
        giaTri: parseFloat(r[cGT]) || 0,
        cb: cCB >= 0 ? (r[cCB] || "").toString().trim() : "",
        pct: pctStr,
        rowNum: i + 2, gid: hs.gid, type: "HS"
      };
      if (ma) {
        idx.hs[ma] = obj;
        idx.hsByMaLow[ma.toLowerCase()] = obj;
      }
      const nName = _norm(nd);
      idx.hsByName[nName] = obj;
      idx.hsList.push({ obj: obj, norm: nName });
      if (ma) {
        idx.hsToKt[ma] = _parseLinks(r[cLkKT]);
        idx.hsToVt[ma] = _parseLinks(r[cLkVT]);
      }
    });
  }

  // Index VT
  if (!vt.missing) {
    const cMa = _findCol(vt.headers, "Mã VTTH", "Mã VT", "Mã vật tư", "Mã", LINK_COL.VT_MA);
    const cTen = _findCol(vt.headers, "Loại nhóm", "Nội dung công việc được giao", "Tên VTTH", "Nội dung", "Tên");
    const cKhoa = _findCol(vt.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
    const cTT = _findCol(vt.headers, "Trạng thái");
    const cDL = _findCol(vt.headers, "Deadline");
    const cVM = _findCol(vt.headers, "Khó khăn, vướng mắc", "Khó khăn", "Vướng mắc");
    const cHT = _findCol(vt.headers, "Đã Hoàn Thành", "Đã HT");
    const cCB = _findCol(vt.headers, "CB phụ trách", "CB", "Cán bộ phụ trách");
    const cPct = _findCol(vt.headers, "Tiến độ (%)", "Tiến độ");
    const cLkHS = _findCol(vt.headers, LINK_COL.VT_LINK_HS, "Liên kết HS");
    const cLkKT = _findCol(vt.headers, LINK_COL.VT_LINK_KT, "Liên kết KT");
    
    vt.rows.forEach((r, i) => {
      if (!r.some(v => v !== "" && v !== null)) return;
      const ma = (r[cMa] || "").toString().trim();
      const ten = (cTen >= 0 ? r[cTen] : "").toString().trim();
      if (!ten && !ma) return;

      let pctStr = "";
      if (cPct >= 0 && r[cPct] !== undefined && r[cPct] !== null) {
        pctStr = r[cPct].toString();
      }

      const obj = {
        ma: ma, ten: ten, khoa: (r[cKhoa] || "").toString().trim(),
        tt: (r[cTT] || "").toString().trim(), deadline: r[cDL] || "",
        vuong: (r[cVM] || "").toString().trim(), done: _isDone(r[cHT]),
        cb: cCB >= 0 ? (r[cCB] || "").toString().trim() : "",
        pct: pctStr,
        rowNum: i + 2, gid: vt.gid, type: "VT"
      };
      if (ma) {
        idx.vt[ma] = obj;
        idx.vtByMaLow[ma.toLowerCase()] = obj;
      }
      idx.vtByName[_norm(ten)] = obj;
      if (ma) {
        idx.vtToHs[ma] = _parseLinks(r[cLkHS]);
        idx.vtToKt[ma] = _parseLinks(r[cLkKT]);
      }
    });
  }

  // Read MAP_LIENKET
  if (!map.missing) {
    const cLoai = _findCol(map.headers, "Loại link", "Loại");
    const cFrom = _findCol(map.headers, "Từ (Mã)", "Từ");
    const cTo = _findCol(map.headers, "Tới (Mã)", "Tới");
    const cTT = _findCol(map.headers, "Trạng thái");
    map.rows.forEach(r => {
      const status = (r[cTT] || "").toString().trim();
      if (status === "Closed") return;
      const loai = (r[cLoai] || "").toString().trim();
      const from = (r[cFrom] || "").toString().trim();
      const to = (r[cTo] || "").toString().trim();
      if (!from || !to || from.startsWith("(") || to.startsWith("(")) return;
      if (loai === "KT-VT") {
        (idx.ktToVt[from] = idx.ktToVt[from] || []).push(to);
        (idx.vtToKt[to] = idx.vtToKt[to] || []).push(from);
      } else if (loai === "KT-HS") {
        (idx.ktToHs[from] = idx.ktToHs[from] || []).push(to);
        (idx.hsToKt[to] = idx.hsToKt[to] || []).push(from);
      } else if (loai === "VT-HS") {
        (idx.vtToHs[from] = idx.vtToHs[from] || []).push(to);
        (idx.hsToVt[to] = idx.hsToVt[to] || []).push(from);
      }
    });
  }


  // ---- v2.3+ : Kho 5A (tồn) & 5B (đề xuất) — index by Mã VTTH (primary) + tên (fallback)
  idx.kho5a = {};       // key -> {ma, ten, ton, doh, tt, khoamax, sokhoa, dexuat, gid, rowNum}
  idx.kho5aByName = {};
  idx.kho5b = {};       // key -> [list of requests]
  idx.kho5bByName = {};
  const t5aIdx = _readTab(TAB.KHO_5A);
  const t5bIdx = _readTab(TAB.KHO_5B);
  if (!t5aIdx.missing) {
    const cMa = _findCol(t5aIdx.headers, "Mã VTTH", "Mã VT", "Mã");
    const cTen = _findCol(t5aIdx.headers, "Tên VTTH", "Tên VT", "Tên");
    const cTon = _findCol(t5aIdx.headers, "Tồn hiện tại", "Tồn");
    const cDOH = _findCol(t5aIdx.headers, "Số ngày tồn", "DOH");
    const cTT = _findCol(t5aIdx.headers, "Trạng thái cảnh báo", "Trạng thái");
    const cKM = _findCol(t5aIdx.headers, "Khoa yêu cầu nhiều nhất", "Khoa YC");
    const cSK = _findCol(t5aIdx.headers, "Số khoa đang chờ");
    const cDX = _findCol(t5aIdx.headers, "Đề xuất xử lý");
    t5aIdx.rows.forEach((r, i) => {
      const ma = (cMa>=0 ? r[cMa] : "").toString().trim();
      const ten = (cTen>=0 ? r[cTen] : "").toString().trim();
      if (!ma && !ten) return;
      const obj = {
        ma: ma, ten: ten,
        ton: cTon>=0 ? r[cTon] : "",
        doh: cDOH>=0 ? r[cDOH] : "",
        tt: (cTT>=0 ? r[cTT] : "").toString(),
        khoamax: (cKM>=0 ? r[cKM] : "").toString(),
        sokhoa: cSK>=0 ? r[cSK] : 0,
        dexuat: (cDX>=0 ? r[cDX] : "").toString(),
        rowNum: i + 2, gid: t5aIdx.gid
      };
      if (ma) idx.kho5a[ma.toLowerCase()] = obj;
      if (ten) idx.kho5aByName[_norm(ten)] = obj;
    });
  }
  if (!t5bIdx.missing) {
    const cVT = _findCol(t5bIdx.headers, "VTTH yêu cầu", "VTTH", "Tên VTTH");
    const cMa = _findCol(t5bIdx.headers, "Mã VTTH", "Mã VT");
    const cKhoa = _findCol(t5bIdx.headers, "Khoa/ Phòng Sử Dụng", "Khoa yêu cầu", "Khoa");
    const cSL = _findCol(t5bIdx.headers, "Số lượng");
    const cDV = _findCol(t5bIdx.headers, "Đơn vị");
    const cUT = _findCol(t5bIdx.headers, "Mức ưu tiên");
    const cTT = _findCol(t5bIdx.headers, "Trạng thái xử lý", "Trạng thái");
    const cNYC = _findCol(t5bIdx.headers, "Ngày yêu cầu");
    const cNDK = _findCol(t5bIdx.headers, "Ngày dự kiến cấp");
    t5bIdx.rows.forEach((r, i) => {
      const vtth = (cVT>=0 ? r[cVT] : "").toString().trim();
      const ma = (cMa>=0 ? r[cMa] : "").toString().trim();
      if (!vtth && !ma) return;
      const item = {
        khoa: (cKhoa>=0 ? r[cKhoa] : "").toString(),
        sl: cSL>=0 ? r[cSL] : "",
        dv: (cDV>=0 ? r[cDV] : "").toString(),
        ut: (cUT>=0 ? r[cUT] : "").toString(),
        tt: (cTT>=0 ? r[cTT] : "").toString(),
        ngayYC: cNYC>=0 ? _formatDate(r[cNYC]) : "",
        ngayDK: cNDK>=0 ? _formatDate(r[cNDK]) : "",
        rowNum: i + 2, gid: t5bIdx.gid
      };
      const keyMa = ma ? ma.toLowerCase() : "";
      const keyName = _norm(vtth);
      if (keyMa) (idx.kho5b[keyMa] = idx.kho5b[keyMa] || []).push(item);
      if (keyName) (idx.kho5bByName[keyName] = idx.kho5bByName[keyName] || []).push(item);
    });
  }

  return idx;
}

// Smart fuzzy match: tìm VT/HS có thể liên quan đến 1 KT (theo tên + khoa)
function _smartLinkKt(ktObj, idx) {
  const out = { vt: [], hs: [] };
  const ktName = _norm(ktObj.ten);
  const ktKhoa = _norm(ktObj.khoa);
  // Lấy các từ khóa chính từ tên thiết bị (>3 ký tự)
  const keywords = ktName.split(/\s+/).filter(w => w.length > 3);
  Object.values(idx.vt).forEach(v => {
    const vtName = _norm(v.ten);
    const match = keywords.some(k => vtName.indexOf(k) >= 0);
    const sameKhoa = ktKhoa && _norm(v.khoa).indexOf(ktKhoa) >= 0;
    if (match || (sameKhoa && v.vuong)) out.vt.push({ obj: v, score: match ? 2 : 1, fuzzy: true });
  });
  Object.values(idx.hs).forEach(h => {
    const hsName = _norm(h.ten || "");
    const match = keywords.some(k => k.length > 4 && hsName.indexOf(k) >= 0);
    const sameKhoa = ktKhoa && _norm(h.khoa).indexOf(ktKhoa) >= 0;
    if (match || (sameKhoa && (h.vuong || !h.done))) out.hs.push({ obj: h, score: match ? 2 : 1, fuzzy: true });
  });
  out.vt.sort((a, b) => b.score - a.score);
  out.hs.sort((a, b) => b.score - a.score);
  return { vt: out.vt.slice(0, 5), hs: out.hs.slice(0, 5) };
}

// Resolve kho status for a VT — match by Mã VTTH first, then by name fuzzy
function _resolveKhoForVt(vtObj, idx) {
  if (!vtObj) return { stock: null, queue: [] };
  const ma = (vtObj.ma || "").toString().toLowerCase().trim();
  const tenN = _norm(vtObj.ten || "");
  let stock = null;
  let queue = [];
  if (ma && idx.kho5a[ma]) stock = idx.kho5a[ma];
  if (!stock && tenN && idx.kho5aByName[tenN]) stock = idx.kho5aByName[tenN];
  if (!stock && tenN) {
    // Fuzzy: any kho5a key contains substantial token of tenN
    const tokens = tenN.split(/\s+/).filter(t => t.length > 3);
    Object.keys(idx.kho5aByName).forEach(k => {
      if (stock) return;
      if (tokens.some(t => k.indexOf(t) >= 0)) stock = idx.kho5aByName[k];
    });
  }
  if (ma && idx.kho5b[ma]) queue = idx.kho5b[ma].slice();
  if (!queue.length && tenN && idx.kho5bByName[tenN]) queue = idx.kho5bByName[tenN].slice();
  if (!queue.length && tenN) {
    const tokens = tenN.split(/\s+/).filter(t => t.length > 3);
    Object.keys(idx.kho5bByName).forEach(k => {
      if (queue.length) return;
      if (tokens.some(t => k.indexOf(t) >= 0)) queue = idx.kho5bByName[k].slice();
    });
  }
  // Sort queue: chưa cấp đủ + ưu tiên CAO lên đầu
  queue.sort((a, b) => {
    const da = (a.tt || "").indexOf("Đã cấp đủ") >= 0 ? 1 : 0;
    const db = (b.tt || "").indexOf("Đã cấp đủ") >= 0 ? 1 : 0;
    if (da !== db) return da - db;
    const ua = (a.ut || "").indexOf("CAO") >= 0 ? 0 : 1;
    const ub = (b.ut || "").indexOf("CAO") >= 0 ? 0 : 1;
    return ua - ub;
  });
  return { stock: stock, queue: queue.slice(0, 8) };
}

// ============================================================================
//  API ENDPOINT — getDetail (v2.3) — 360° view của 1 entity
// ============================================================================
function getDetail(type, id) {
  if (id) id = id.toString().trim();
  const idx = _buildLinkIndex();
  const sheetUrl = "https://docs.google.com/spreadsheets/d/" + SHEET_ID;
  if (type === "KT") {
    const me = idx.kt[id] || idx.ktByName[_norm(id)];
    if (!me) return { error: "Không tìm thấy KT: " + id };
    const linkedVt = (idx.ktToVt[me.ma] || []).map(m => idx.vt[m]).filter(Boolean)
      .map(o => ({ obj: o, fuzzy: false }));
    const linkedHs = (idx.ktToHs[me.ma] || []).map(m => idx.hs[m]).filter(Boolean)
      .map(o => ({ obj: o, fuzzy: false }));
    const fuzzy = _smartLinkKt(me, idx);
    const allVtKt = linkedVt.concat(fuzzy.vt.filter(f => !linkedVt.some(l => l.obj.ma === f.obj.ma)));
    // Enrich each VT with kho status
    allVtKt.forEach(function(e) { e.kho = _resolveKhoForVt(e.obj, idx); });
    return {
      type: "KT", me: me, sheetUrl: sheetUrl,
      vt: allVtKt,
      hs: linkedHs.concat(fuzzy.hs.filter(f => !linkedHs.some(l => l.obj.ma === f.obj.ma)))
    };
  }
  if (type === "VT") {
    const me = idx.vt[id] || idx.vtByName[_norm(id)];
    if (!me) return { error: "Không tìm thấy VT: " + id };
    const linkedKt = (idx.vtToKt[me.ma] || []).map(m => idx.kt[m]).filter(Boolean)
      .map(o => ({ obj: o, fuzzy: false }));
    const linkedHs = (idx.vtToHs[me.ma] || []).map(m => idx.hs[m]).filter(Boolean)
      .map(o => ({ obj: o, fuzzy: false }));
    const kho = _resolveKhoForVt(me, idx);
    // v2.6: kho cùng loại / cùng khoa (cho task VT chung chung không khớp 1-1)
    const relatedKho = _findRelatedKhoItems(me, idx);
    return { type: "VT", me: me, sheetUrl: sheetUrl, kt: linkedKt, hs: linkedHs, kho: kho, relatedKho: relatedKho };
  }
  if (type === "HS") {
    const me = idx.hs[id] || idx.hsByName[_norm(id)];
    if (!me) return { error: "Không tìm thấy HS: " + id };
    const linkedKt = (idx.hsToKt[me.ma] || []).map(m => idx.kt[m]).filter(Boolean)
      .map(o => ({ obj: o, fuzzy: false }));
    const linkedVt = (idx.hsToVt[me.ma] || []).map(m => idx.vt[m]).filter(Boolean)
      .map(o => ({ obj: o, fuzzy: false }));
    // v2.5: enrich each VT trong gói thầu với tình trạng Kho 5A/5B
    linkedVt.forEach(function(e) { e.kho = _resolveKhoForVt(e.obj, idx); });
    return { type: "HS", me: me, sheetUrl: sheetUrl, kt: linkedKt, vt: linkedVt };
  }
  return { error: "Type không hợp lệ: " + type };
}

// ============================================================================
//  API ENDPOINT — searchAll (v2.3) — global search
// ============================================================================
function searchAll(q) {
  q = (q || "").toString().trim();
  if (!q || q.length < 2) return { results: [] };
  const idx = _buildLinkIndex();
  const qn = _norm(q);
  const results = [];
  Object.values(idx.kt).forEach(o => {
    if (_norm(o.ten).indexOf(qn) >= 0 || _norm(o.khoa).indexOf(qn) >= 0 || (o.ma && _norm(o.ma) === qn)) {
      results.push({ type: "KT", id: o.ma || o.ten, label: o.ten, sub: o.khoa + " — " + o.tinh });
    }
  });
  Object.values(idx.vt).forEach(o => {
    if (_norm(o.ten).indexOf(qn) >= 0 || _norm(o.khoa).indexOf(qn) >= 0 || (o.ma && _norm(o.ma) === qn)) {
      results.push({ type: "VT", id: o.ma || o.ten, label: o.ten, sub: o.khoa + " — " + o.tt });
    }
  });
  Object.values(idx.hs).forEach(o => {
    if (_norm(o.ten).indexOf(qn) >= 0 || _norm(o.khoa).indexOf(qn) >= 0 || (o.ma && _norm(o.ma) === qn)) {
      results.push({ type: "HS", id: o.ma || o.ten, label: o.ten || o.ma, sub: o.khoa + " — " + o.tt });
    }
  });
  // v2.5: tìm trong Kho 5A theo mã VTTH / tên / khoa YC nhiều nhất
  Object.values(idx.kho5a).forEach(function(o) {
    const tenN = _norm(o.ten || "");
    const maN = (o.ma || "").toLowerCase();
    const khoaN = _norm(o.khoamax || "");
    if (tenN.indexOf(qn) >= 0 || (maN && maN.indexOf(qn) >= 0) || khoaN.indexOf(qn) >= 0) {
      results.push({
        type: "KHO", id: o.ma || o.ten, label: o.ten + (o.ma ? " (" + o.ma + ")" : ""),
        sub: "📦 " + (o.tt || "?") + " · Tồn: " + (o.ton || "-") + " · DOH: " + (o.doh || "-"),
        tab: TAB.KHO_5A, gid: o.gid, rowNum: o.rowNum
      });
    }
  });
  return { results: results.slice(0, 30) };
}

// ============================================================================
//  v2.7: Dự báo đứt quãng cung ứng (Supply Gap Analysis)
// ============================================================================
function _estimateTenderDays(status) {
  var s = _norm(status || "");
  if (s.indexOf("đã xong") >= 0 || s.indexOf("hoàn thành") >= 0) return 0;
  if (s.indexOf("có kết quả") >= 0 || s.indexOf("đã trúng") >= 0) return 7;
  if (s.indexOf("đang thầu") >= 0 || s.indexOf("mở thầu") >= 0) return 21;
  if (s.indexOf("đang trình") >= 0 || s.indexOf("phê duyệt") >= 0) return 45;
  if (s.indexOf("chưa") >= 0 || s.indexOf("lập") >= 0) return 60;
  return 30; // default
}

// ============================================================================
//  API ENDPOINT — getLinkedChains (v2.7) — top chuỗi vướng mắc + dự báo
// ============================================================================
function getLinkedChains() {
  const idx = _buildLinkIndex();
  const chains = [];
  // Tìm các KT chưa hoàn thành + có vướng/CAO/trễ
  const today = new Date(); today.setHours(0,0,0,0);
  Object.values(idx.kt).forEach(kt => {
    if (kt.done) return;
    const dl = _toDate(kt.deadline);
    const tre = dl && dl < today;
    const vuong = !!kt.vuong;
    const danger = (_norm(kt.tinh).indexOf("hỏng") >= 0 || tre || vuong);
    if (!danger) return;
    const linkedVt = ((idx.ktToVt[kt.ma] || []).map(m => idx.vt[m]).filter(Boolean));
    const linkedHs = ((idx.ktToHs[kt.ma] || []).map(m => idx.hs[m]).filter(Boolean));
    const fuzzy = _smartLinkKt(kt, idx);
    const allVt = linkedVt.concat(fuzzy.vt.map(f => f.obj).filter(o => !linkedVt.some(l => l.ma === o.ma)));
    const allHs = linkedHs.concat(fuzzy.hs.map(f => f.obj).filter(o => !linkedHs.some(l => l.ma === o.ma)));
    let severity = 0;
    if (tre) severity += 3;
    if (vuong) severity += 2;
    if (_norm(kt.tinh).indexOf("hỏng") >= 0) severity += 2;
    if (allVt.length) severity += 1;
    if (allHs.length) severity += 1;
    // v2.3+ : enrich VT with kho status, bump severity
    const vtSlice = allVt.slice(0, 3).map(function(v) {
      const kho = _resolveKhoForVt(v, idx);
      let sevAdd = 0;
      if (kho.stock) {
        const tt = (kho.stock.tt || "").toString();
        if (tt.indexOf("ĐỎ") >= 0) sevAdd += 2;
        else if (tt.indexOf("VÀNG") >= 0) sevAdd += 1;
        const doh = Number(kho.stock.doh);
        if (!isNaN(doh) && doh >= 0 && doh < 7) sevAdd += 1;
      }
      const queueOpen = kho.queue.filter(q => (q.tt || "").indexOf("Đã cấp đủ") < 0).length;
      if (queueOpen >= 3) sevAdd += 2;
      else if (queueOpen >= 1) sevAdd += 1;
      severity += sevAdd;
      return Object.assign({}, v, { kho: kho, queueOpen: queueOpen });
    });
    chains.push({
      kt: kt, vt: vtSlice, hs: allHs.slice(0, 3),
      severity: severity, daysLate: tre ? Math.floor((today - dl) / 86400000) : 0
    });
  });
  chains.sort((a, b) => b.severity - a.severity || b.daysLate - a.daysLate);

  // v2.5: bổ sung "Kho-driven chains" — mặt hàng Kho 5A đang ĐỎ/VÀNG
  // map ngược lên VT (vật tư) và HS (gói thầu mua sắm) tương ứng
  const khoChains = [];
  Object.values(idx.kho5a).forEach(function(stock) {
    const tt = (stock.tt || "").toString();
    const isRed = tt.indexOf("ĐỎ") >= 0;
    const isYellow = tt.indexOf("VÀNG") >= 0;
    if (!isRed && !isYellow) return;
    let sev = isRed ? 5 : 3;
    const dohN = Number(stock.doh);
    if (!isNaN(dohN) && dohN >= 0 && dohN < 7) sev += 2;
    if (Number(stock.sokhoa) >= 3) sev += 2;

    const keyMa = (stock.ma || "").toLowerCase().trim();
    const keyName = _norm(stock.ten || "");
    let linkedVt = null;
    if (keyMa) Object.values(idx.vt).forEach(function(v) {
      if (!linkedVt && (v.ma || "").toLowerCase() === keyMa) linkedVt = v;
    });
    if (!linkedVt && keyName) linkedVt = idx.vtByName[keyName] || null;

    let queue = [];
    if (keyMa && idx.kho5b[keyMa]) queue = idx.kho5b[keyMa].slice();
    if (!queue.length && keyName && idx.kho5bByName[keyName]) queue = idx.kho5bByName[keyName].slice();
    const queueOpen = queue.filter(function(q) { return (q.tt || "").indexOf("Đã cấp đủ") < 0; }).length;
    if (queueOpen >= 3) sev += 2;
    else if (queueOpen >= 1) sev += 1;

    let linkedHs = [];
    if (linkedVt) {
      const list = idx.vtToHs[linkedVt.ma] || [];
      linkedHs = list.map(function(m) { return idx.hs[m]; }).filter(Boolean);
    }

    khoChains.push({
      kho: stock,
      vt: linkedVt,
      hs: linkedHs.slice(0, 2),
      queue: queue.slice(0, 4),
      queueOpen: queueOpen,
      severity: sev,
      isRed: isRed,
      risk: (function() {
        if (!linkedHs.length) return { level: "HIGH", msg: "Chưa có gói thầu mua sắm!" };
        var leadTime = _estimateTenderDays(linkedHs[0].tt);
        var doh = Number(stock.doh) || 0;
        var gap = doh - leadTime;
        if (gap < 0) return { level: "CRITICAL", msg: "Dự kiến đứt quãng " + Math.abs(gap) + " ngày", gap: gap };
        if (gap < 7) return { level: "WARNING", msg: "Rủi ro sát nút (" + gap + " ngày dự phòng)", gap: gap };
        return { level: "SAFE", msg: "Tiến độ thầu ổn", gap: gap };
      })()
    });
  });
  khoChains.sort(function(a, b) { return b.severity - a.severity; });

  return { chains: chains.slice(0, 20),
    khoChains: khoChains.slice(0, 12),
    sheetUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID,
    updatedAt: Utilities.formatDate(new Date(), TIMEZONE, "HH:mm:ss dd/MM/yyyy") };
}

// v2.9: Build HTML email báo cáo (mobile-responsive)
function _buildBriefHtml(data, mode) {
  const dateStr = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy");
  const timeStr = Utilities.formatDate(new Date(), TIMEZONE, "HH:mm");
  const c = data.cards;
  const webAppUrl = data.webAppUrl || "";
  const sheetUrl = data.sheetUrl;
  const headerLabels = {
    "morning_brief": "🌅 GIAO BAN SÁNG",
    "flash": "⚠ CẬP NHẬT NHANH",
    "weekly": "📊 TỔNG KẾT TUẦN",
    "monthly": "📈 BÁO CÁO THÁNG",
    "forecast": "🔮 DỰ BÁO CUNG ỨNG",
    "ton_dong": "📦 KIỂM SOÁT TỒN ĐỌNG"
  };
  const isFlash = mode === "flash";
  const headerLabel = headerLabels[mode] || "🌅 GIAO BAN SÁNG";
  const headerBg = (isFlash || mode === "ton_dong") ? "linear-gradient(135deg,#9A3412,#DC2626)" : 
                   (mode === "forecast") ? "linear-gradient(135deg,#065F46,#10B981)" :
                   (mode === "weekly" || mode === "monthly") ? "linear-gradient(135deg,#3730A3,#4F46E5)" :
                   "linear-gradient(135deg,#1E3A8A,#1F4E78)";

  let html = '<table cellpadding="0" cellspacing="0" border="0" style="max-width:640px;margin:0 auto;font-family:Arial,sans-serif;color:#333;background:#fff;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">';

  // Header
  html += '<tr><td style="padding:24px 20px;background:' + headerBg + ';color:#fff;text-align:center;">'
       + '<div style="font-size:13px;letter-spacing:.8px;text-transform:uppercase;opacity:.85;margin-bottom:4px;">PHÒNG VT-TBYT · BỆNH VIỆN K</div>'
       + '<h1 style="margin:0;font-size:22px;letter-spacing:.3px;">' + headerLabel + '</h1>'
       + '<div style="font-size:14px;margin-top:6px;opacity:.95;">' + dateStr + ' · ' + timeStr + '</div>'
       + '</td></tr>';

  // CTA Button
  if (webAppUrl) {
    html += '<tr><td style="padding:18px 20px;text-align:center;background:#F9FAFB;border-bottom:1px solid #E5E7EB;">'
         + '<a href="' + webAppUrl + '" style="display:inline-block;padding:14px 32px;background:#3B82F6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(59,130,246,0.3);">'
         + '📱 Mở dashboard giao ban đầy đủ →</a>'
         + '<div style="font-size:11px;color:#6B7280;margin-top:8px;">Mở trên điện thoại để xem chi tiết, click drill-down, không cần Sheet.</div>'
         + '</td></tr>';
  }

  // Section 1: 4 KPI tổng quan
  if (!isFlash) {
    html += '<tr><td style="padding:18px 20px 8px;">'
         + '<h3 style="margin:0 0 10px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:.6px;">📊 TỔNG QUAN HÔM NAY</h3>'
         + '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:13px;">';
    function kpiRow(icon, label, big, total, sub, color) {
      const pct = total ? Math.round(big/total*100) : 0;
      const barColor = pct >= 70 ? "#10B981" : pct >= 30 ? "#F59E0B" : "#EF4444";
      // Email-safe: dùng table thuần, không dùng flex/grid
      return '<tr><td style="padding:0 0 8px;">'
           + '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F9FAFB;border-left:3px solid ' + color + ';border-radius:4px;">'
           + '<tr>'
           + '<td style="padding:12px 14px;font-size:14px;color:#111827;font-weight:700;">' + icon + '&nbsp;&nbsp;' + label + '</td>'
           + '<td align="right" style="padding:12px 14px;font-size:18px;font-weight:700;color:#111;font-family:Consolas,monospace;white-space:nowrap;">' + big + '&nbsp;/&nbsp;' + total + '</td>'
           + '</tr>'
           + '<tr><td colspan="2" style="padding:0 14px;">'
           + '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#E5E7EB;border-radius:3px;height:6px;line-height:6px;font-size:1px;">'
           + '<tr><td width="' + pct + '%" style="background:' + barColor + ';height:6px;line-height:6px;font-size:1px;border-radius:3px 0 0 3px;">&nbsp;</td>'
           + '<td width="' + (100-pct) + '%" style="height:6px;line-height:6px;font-size:1px;">&nbsp;</td></tr>'
           + '</table>'
           + '</td></tr>'
           + '<tr><td colspan="2" style="padding:6px 14px 12px;font-size:11px;color:#6B7280;">' + pct + '% hoàn thành &nbsp;·&nbsp; ' + sub + '</td></tr>'
           + '</table>'
           + '</td></tr>';
    }
    html += kpiRow("🔧", "Kỹ thuật", c.kt.done, c.kt.total,
      [c.kt.cao>0?"🔴 "+c.kt.cao+" CAO":"", c.kt.treDL>0?"⏰ "+c.kt.treDL+" trễ":"", c.kt.dangSua>0?c.kt.dangSua+" đang sửa":""].filter(Boolean).join(" · ") || "ổn",
      "#3B82F6");
    html += kpiRow("📁", "Hồ sơ", c.hs.done, c.hs.total,
      [c.hs.cao>0?"🔴 "+c.hs.cao+" CAO":"", c.hs.vuong>0?"🚧 "+c.hs.vuong+" vướng":"", c.hs.treDL>0?"⏰ "+c.hs.treDL+" trễ":"",
       c.hs.tongGiaTri>0?"💰 "+(c.hs.tongGiaTri/1e9).toFixed(2)+" tỷ":""].filter(Boolean).join(" · ") || "ổn",
      "#F59E0B");
    html += kpiRow("🧪", "Vật tư", c.vt.done, c.vt.total,
      [c.vt.cao>0?"🔴 "+c.vt.cao+" CAO":"", c.vt.vuong>0?"🚧 "+c.vt.vuong+" vướng":"", c.vt.treDL>0?"⏰ "+c.vt.treDL+" trễ":""].filter(Boolean).join(" · ") || "ổn",
      "#10B981");
    // KHO card — focus forecast thay vì red/yellow count
    const f = c.kho.forecast;
    if (f && (f.l1>0 || f.l2>0 || f.stagnantLong>0)) {
      const subKho = [
        f.noSolution>0 ? "🚨 "+f.noSolution+" sắp hết CHƯA giải pháp" : "",
        f.l1>0 ? "🚨 "+f.l1+" Mức 1" : "",
        f.l2>0 ? "🔴 "+f.l2+" Mức 2" : "",
        f.stagnantLong>0 ? "📦 "+f.stagnantLong+" tồn >1 năm" : ""
      ].filter(Boolean).join(" · ");
      const greenAlt = c.kho.green || 0;
      html += kpiRow("📦", "Kho", greenAlt, c.kho.total, subKho || "ổn", "#8B5CF6");
    } else {
      html += kpiRow("📦", "Kho", c.kho.green || 0, c.kho.total,
        [c.kho.red>0?"🔴 "+c.kho.red+" ĐỎ":"", c.kho.yellow>0?"🟡 "+c.kho.yellow+" VÀNG":"", c.kho.requestHigh>0?"🚨 "+c.kho.requestHigh+" YC CAO":""].filter(Boolean).join(" · ") || "an toàn",
        "#8B5CF6");
    }
    html += '</table></td></tr>';
  }

  // Section 2: Cảnh báo cung ứng (chi tiết tên mặt hàng)
  if (c.kho.forecast && c.kho.forecast.top && c.kho.forecast.top.length) {
    const top = c.kho.forecast.top;
    const hasCritical = top.some(function(t) { return t.level === 1 && !t.ok; });
    const bgAlert = hasCritical ? "#FEE2E2" : "#FEF3C7";
    const borderAlert = hasCritical ? "#DC2626" : "#D97706";
    const titleAlert = hasCritical ? "🚨 CẢNH BÁO CUNG ỨNG — Phải xử lý ngay" : "⚠ CẢNH BÁO CUNG ỨNG";
    html += '<tr><td style="padding:14px 20px;">'
         + '<div style="background:' + bgAlert + ';border-left:4px solid ' + borderAlert + ';border-radius:6px;padding:14px 16px;">'
         + '<h3 style="margin:0 0 10px;color:' + borderAlert + ';font-size:14px;">' + titleAlert + '</h3>'
         + '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:12px;">';
    top.slice(0, 5).forEach(function(t) {
      const tagBg = t.level === 1 ? "#7F1D1D" : t.level === 2 ? "#9A3412" : t.stagnantTier === 3 ? "#7F1D1D" : "#374151";
      html += '<tr><td style="padding:8px 0;border-bottom:1px dashed #D1D5DB;font-size:13px;line-height:1.5;">'
           + '<span style="display:inline-block;background:' + tagBg + ';color:#fff;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700;margin-right:8px;">' + t.label + '</span>'
           + '<b>' + t.ten + '</b>'
           + (t.ma ? ' <span style="font-family:Consolas,monospace;color:#6B7280;font-size:11px;">[' + t.ma + ']</span>' : '')
           + '<br>'
           + '<span style="font-size:11px;color:#6B7280;">📍 ' + (t.khoa || "?") + ' &nbsp;·&nbsp; ⏱ DOH <b style="color:#7F1D1D">' + t.doh + 'n</b></span>'
           + '<br>'
           + '<span style="color:' + (t.ok ? '#059669' : '#9A3412') + ';font-size:12px;">' + t.action + '</span>'
           + '</td></tr>';
    });
    html += '</table></div></td></tr>';
  }

  // Section 3: Top điểm nóng
  if (data.hot && data.hot.length) {
    const limit = isFlash ? 5 : 5;
    html += '<tr><td style="padding:14px 20px;">'
         + '<h3 style="margin:0 0 10px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:.6px;">🔥 TOP ' + Math.min(limit, data.hot.length) + ' ĐIỂM NÓNG</h3>'
         + '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:12px;">';
    data.hot.slice(0, limit).forEach(function(h, i) {
      const teamColor = h.team === "KT" ? "#1E40AF" : h.team === "HS" ? "#92400E" : h.team === "KHO" ? "#7F1D1D" : "#374151";
      html += '<tr><td style="padding:0 0 6px;">'
           + '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F9FAFB;border-radius:4px;">'
           + '<tr>'
           + '<td style="padding:10px 12px;width:34px;vertical-align:top;">'
           + '<span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:50%;background:#1F4E78;color:#fff;font-weight:700;font-size:12px;">' + (i+1) + '</span>'
           + '</td>'
           + '<td style="padding:10px 12px 10px 0;font-size:13px;line-height:1.5;">'
           + '<span style="display:inline-block;background:' + teamColor + ';color:#fff;padding:1px 7px;border-radius:3px;font-size:10px;font-weight:700;margin-right:6px;">' + h.team + '</span>'
           + '<b>' + h.title + '</b>'
           + (h.subtitle ? '<br><span style="color:#6B7280;font-size:11px;">📍 ' + h.subtitle + (h.cb ? ' &nbsp;·&nbsp; 👤 ' + h.cb : "") + '</span>' : "")
           + '</td>'
           + '<td align="right" style="padding:10px 14px;vertical-align:top;white-space:nowrap;">'
           + '<span style="color:#DC2626;font-weight:700;font-size:11px;background:#FEE2E2;padding:3px 8px;border-radius:3px;">' + (h.badge || "") + '</span>'
           + '</td>'
           + '</tr>'
           + '</table>'
           + '</td></tr>';
    });
    html += '</table></td></tr>';
  }

  // CTA Button bottom (lặp lại để dễ click trên mobile)
  if (webAppUrl) {
    html += '<tr><td style="padding:14px 20px;text-align:center;border-top:1px solid #E5E7EB;">'
         + '<a href="' + webAppUrl + '" style="display:inline-block;padding:11px 24px;background:#1F4E78;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">📱 Mở dashboard chi tiết</a>'
         + '</td></tr>';
  }

  // Footer
  html += '<tr><td style="padding:14px 20px;text-align:center;color:#9CA3AF;font-size:11px;background:#F9FAFB;border-top:1px solid #E5E7EB;">'
       + 'Báo cáo tự động · Phòng VT-TBYT — Bệnh viện K · v2.9'
       + '<br><span style="font-size:10px;">Cập nhật: ' + data.updatedAt + '</span>'
       + (sheetUrl ? '<br><a href="' + sheetUrl + '" style="color:#9CA3AF;font-size:10px;">[Mở Google Sheet nguồn]</a>' : "")
       + '</td></tr>';

  html += '</table>';
  return html;
}

function sendMorningBrief() {
  const data = getOverview();
  const dateStr = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy");
  const subject = "[GIAO BAN] Brief sáng " + dateStr + " — Phòng VT-TBYT";
  const html = _buildBriefHtml(data, "morning");

  const recipients = _getEmailRecipients("morning_brief");
  if (!recipients.length) { Logger.log("⚠️ Chưa cấu hình email morning_brief"); return; }
  MailApp.sendEmail({ to: recipients.join(","), subject: subject, htmlBody: html });
  Logger.log("✓ Sent morning brief to: " + recipients.join(", "));
}

// v2.10: Lấy HTML báo cáo cho preview/export
function getReportHtml(type, filters) {
  // Logic lọc dữ liệu theo filters (Cơ sở, Khoa) sẽ được bổ sung ở Phase C
  // Hiện tại trả về báo cáo tổng quan dựa trên template email chuyên nghiệp
  const data = getOverview();
  return _buildBriefHtml(data, type);
}

// v2.9: Cho frontend gọi gửi báo cáo manual
function sendReportNow(type) {
  type = type || "morning_brief";
  const data = getOverview();
  const dateStr = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy");
  let subject, html, recipients;
  if (type === "morning_brief" || type === "manual") {
    subject = "[GIAO BAN] Báo cáo " + dateStr + " — Phòng VT-TBYT (gửi thủ công)";
    html = _buildBriefHtml(data, "morning");
    recipients = _getEmailRecipients("morning_brief");
  } else {
    return { ok: false, error: "Loại báo cáo chưa hỗ trợ: " + type };
  }
  if (!recipients.length) return { ok: false, error: "Chưa cấu hình email cho loại " + type };
  try {
    MailApp.sendEmail({ to: recipients.join(","), subject: subject, htmlBody: html });
    return { ok: true, count: recipients.length, recipients: recipients };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function _emailRow(team, total, inProgress, alerts) {
  const alertText = alerts.filter(a => a).join("<br>") || '<span style="color:#107C10;">✓ ổn</span>';
  return '<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">' + team + '</td>' +
    '<td style="text-align:center;border-bottom:1px solid #eee;">' + total + '</td>' +
    '<td style="text-align:center;border-bottom:1px solid #eee;">' + inProgress + '</td>' +
    '<td style="border-bottom:1px solid #eee;">' + alertText + '</td></tr>';
}

function flagHotIssues() {
  const data = getOverview();
  const today = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
  const timeStr = Utilities.formatDate(new Date(), TIMEZONE, "HH:mm");
  const log = _getOrCreateSheet(TAB.LOG_HOT, ["Ngày", "Mã sự kiện", "Mô tả", "Đã gửi"]);
  const logData = log.getDataRange().getValues();
  const sentToday = new Set();
  logData.forEach(r => { if (r[0] === today) sentToday.add(r[1]); });

  // Tổng hợp event quan trọng (gộp thành 1 email tổng thay vì spam nhiều mail)
  const events = [];
  if (data.cards.kt.cao > 0) events.push({ id: "KT_CAO_" + data.cards.kt.cao, msg: data.cards.kt.cao + " TB CAO chưa hoàn thành" });
  if (data.cards.kho.forecast && data.cards.kho.forecast.noSolution > 0) {
    const n = data.cards.kho.forecast.noSolution;
    events.push({ id: "KHO_M1_NS_" + n, msg: n + " mặt hàng kho Mức 1 KHẨN CHƯA có gói thầu" });
  }
  if (data.cards.kho.red > 0) events.push({ id: "KHO_RED_" + data.cards.kho.red, msg: data.cards.kho.red + " mã kho ĐỎ" });
  if (data.cards.kho.requestHigh > 0) events.push({ id: "KHO_REQ_" + data.cards.kho.requestHigh, msg: data.cards.kho.requestHigh + " YC CAO chưa cấp đủ" });
  if (data.cards.hs.vuong >= 3) events.push({ id: "HS_VM_" + data.cards.hs.vuong, msg: data.cards.hs.vuong + " gói thầu đang vướng" });

  // Lọc event mới (chưa gửi hôm nay)
  const newEvents = events.filter(e => !sentToday.has(e.id));
  if (!newEvents.length) return;

  // Build email tổng — dùng template flash
  const subject = "[CẢNH BÁO " + timeStr + "] " + newEvents.length + " điểm nóng cần chú ý — Phòng VT-TBYT";
  const html = _buildBriefHtml(data, "flash");

  const recipients = _getEmailRecipients("flag_hot");
  if (recipients.length) {
    try {
      MailApp.sendEmail({ to: recipients.join(","), subject: subject, htmlBody: html });
      newEvents.forEach(e => log.appendRow([today, e.id, e.msg, "✓"]));
    } catch (err) {
      Logger.log("⚠ flagHotIssues error: " + err);
    }
  }
}

function prepareBriefingMode() {
  const data = getOverview();
  const dateStr = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy HH:mm");
  let s = "📋 BRIEFING — " + dateStr + "\n\n";
  s += "1. KỸ THUẬT — Tổng " + data.cards.kt.total + " | Done " + data.cards.kt.done + " | Đang sửa " + data.cards.kt.dangSua + " | Thanh lý " + data.cards.kt.thanhLy + " | 🔴 CAO " + data.cards.kt.cao + " | Trễ " + data.cards.kt.treDL + "\n";
  s += "2. HỒ SƠ — Tổng " + data.cards.hs.total + " | Done " + data.cards.hs.done + " | 🔴 Vướng " + data.cards.hs.vuong + " | Trễ " + data.cards.hs.treDL + " | Tổng giá trị: " + (data.cards.hs.tongGiaTri / 1e9).toFixed(1) + " tỷ\n";
  s += "3. VẬT TƯ — Tổng " + data.cards.vt.total + " | 🔴 CAO " + data.cards.vt.cao + " | Vướng " + data.cards.vt.vuong + "\n";
  s += "4. KHO — Tổng " + data.cards.kho.total + " | Đỏ " + data.cards.kho.red + " | Vàng " + data.cards.kho.yellow + " | YC chờ " + data.cards.kho.requestPending + " | YC CAO " + data.cards.kho.requestHigh + "\n\n";
  s += "🔥 TOP 5 ĐIỂM NÓNG:\n";
  if (data.hot.length === 0) s += "(Không có)\n";
  else data.hot.slice(0, 5).forEach((h, i) => s += (i + 1) + ". [" + h.team + "] " + h.title + (h.subtitle ? " — " + h.subtitle : "") + "\n");

  const html = HtmlService.createHtmlOutput(
    '<pre style="font-family:Consolas,monospace;font-size:13px;background:#f5f5f5;padding:12px;border-radius:4px;white-space:pre-wrap;">' +
    s.replace(/</g, "&lt;") +
    '</pre><p style="text-align:right;"><button onclick="navigator.clipboard.writeText(document.querySelector(\'pre\').innerText);this.innerText=\'✓ Đã copy\'" style="padding:8px 16px;background:#1F4E78;color:#fff;border:none;border-radius:4px;cursor:pointer;">Copy</button></p>'
  ).setWidth(700).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, "📋 Briefing Mode");
}

// ============================================================================
//  WEB APP — DASHBOARD CHIẾU GIAO BAN
// ============================================================================
function doGet(e) {
  return HtmlService.createHtmlOutput(_buildDashboardHtml())
    .setTitle("Giao ban VT-TBYT — Bệnh viện K")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function showWebAppUrl() {
  const ui = SpreadsheetApp.getUi();
  let url;
  try { url = ScriptApp.getService().getUrl(); } catch (err) { url = null; }
  let html;
  if (url) {
    html = HtmlService.createHtmlOutput(
      '<div style="font-family:Arial;font-size:14px;padding:8px;">' +
      '<p><b>URL Web App:</b></p>' +
      '<input id="u" value="' + url + '" style="width:100%;padding:8px;font-family:monospace;" readonly>' +
      '<p><button onclick="document.getElementById(\'u\').select();document.execCommand(\'copy\');this.innerText=\'✓ Đã copy\';" style="padding:8px 16px;background:#1F4E78;color:#fff;border:none;border-radius:4px;cursor:pointer;">Copy URL</button> ' +
      '<a href="' + url + '" target="_blank" style="margin-left:8px;">Mở →</a></p></div>'
    ).setWidth(600).setHeight(180);
  } else {
    html = HtmlService.createHtmlOutput(
      '<div style="font-family:Arial;font-size:14px;padding:8px;">' +
      '<p>⚠️ Chưa deploy. Làm các bước:</p>' +
      '<ol><li>Apps Script → <b>Deploy</b> (góc trên phải) → <b>New deployment</b></li>' +
      '<li>⚙️ → <b>Web app</b></li>' +
      '<li>Execute as: <b>Me</b>, Access: <b>Anyone with the link</b></li>' +
      '<li><b>Deploy</b> → copy URL</li></ol></div>'
    ).setWidth(550).setHeight(250);
  }
  ui.showModalDialog(html, "🌐 Web App URL");
}

// ============================================================================
//  HTML BUILDER
// ============================================================================
function _buildDashboardHtml() {
  return DASHBOARD_HTML;
}

const DASHBOARD_HTML = '<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n' +
/* v2.8: Detect mobile NGAY trước khi CSS render — tránh flash */
'<script>\n' +
'(function(){\n' +
'  // v2.8 ARCH FIX: window.name tồn tại qua document.write() của GAS\n' +
'  // GAS dùng document.write() → tạo <html> mới → class bị mất\n' +
'  // window.name KHÔNG bị reset → dùng làm persistent flag\n' +
'  var detected = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)\n' +
'    || (typeof screen !== "undefined" && screen.width <= 768)\n' +
'    || window.innerWidth <= 768;\n' +
'  // Lần đầu: detect và ghi vào window.name\n' +
'  // Lần sau (sau document.write()): đọc lại từ window.name\n' +
'  if(detected) window.name = "gas_mob_v28";\n' +
'  var isMob = detected || window.name === "gas_mob_v28";\n' +
'  function applyMob(){\n' +
'    if(isMob) document.documentElement.classList.add("mob");\n' +
'  }\n' +
'  applyMob();\n' +
'  document.addEventListener("DOMContentLoaded", applyMob);\n' +
'  window.addEventListener("load", applyMob);\n' +
'  // Backup: MutationObserver giữ class nếu có code nào xóa\n' +
'  if(isMob && typeof MutationObserver !== "undefined"){\n' +
'    new MutationObserver(function(){\n' +
'      if(!document.documentElement.classList.contains("mob"))\n' +
'        document.documentElement.classList.add("mob");\n' +
'    }).observe(document.documentElement,{attributes:true,attributeFilter:["class"]});\n' +
'  }\n' +
'})();\n' +
'</script>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0}\n' +
'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#0F1B2D;color:#E5E7EB;font-size:14px;line-height:1.4}\n' +
'header{background:linear-gradient(180deg,#162338 0%,#0F1B2D 100%);padding:14px 24px;border-bottom:1px solid #1F2D45;position:sticky;top:0;z-index:100}\n' +
'.brand-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}\n' +
'.brand{font-size:20px;font-weight:700;color:#fff;letter-spacing:.4px}\n' +
'.brand small{display:block;font-size:11px;font-weight:400;color:#9CA3AF;margin-top:2px}\n' +
'.status-row{display:flex;align-items:center;gap:14px;font-size:12px;color:#9CA3AF}\n' +
'#btn-refresh,#btn-email{font-size:11px;padding:5px 10px;cursor:pointer}\n' +
'#btn-refresh:disabled,#btn-email:disabled{opacity:0.6;cursor:wait}\n' +
'#btn-email{background:#1F4E78;color:#fff;border-color:#1E3A8A}\n' +
'#btn-email:hover:not(:disabled){background:#1E3A8A}\n' +
'.live{display:flex;align-items:center;gap:6px;color:#10B981}\n' +
'.live-dot{width:8px;height:8px;background:#10B981;border-radius:50%;animation:pulse 1.6s infinite}\n' +
'@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}\n' +
'#clock{font-variant-numeric:tabular-nums;font-weight:600;color:#fff;font-size:14px}\n' +
'nav.tabs{display:flex;gap:4px;flex-wrap:wrap}\n' +
'nav.tabs button{background:transparent;border:1px solid #1F2D45;color:#9CA3AF;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-family:inherit;transition:all .15s}\n' +
'nav.tabs button:hover{border-color:#374151;color:#fff}\n' +
'nav.tabs button.active{background:#1F4E78;border-color:#1F4E78;color:#fff;font-weight:600}\n' +
'main{padding:20px 24px 80px;max-width:1800px;margin:0 auto}\n' +
'section.view{display:none}section.view.active{display:block}\n' +
/* Cards */
'.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px}\n' +
'.card{background:#162338;border:1px solid #1F2D45;border-radius:10px;padding:18px;border-top:3px solid #374151}\n' +
'.card.red{border-top-color:#EF4444}.card.yellow{border-top-color:#F59E0B}.card.green{border-top-color:#10B981}\n' +
'.card h3{font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;margin-bottom:8px}\n' +
'.card .big{font-size:42px;font-weight:700;color:#fff;line-height:1;margin-bottom:8px}\n' +
'.card .big.red{color:#EF4444}.card .big.yellow{color:#F59E0B}.card .big.green{color:#10B981}\n' +
'.card ul{list-style:none}.card li{display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px dashed #1F2D45;color:#9CA3AF}\n' +
'.card li:last-child{border-bottom:0}.card li b{color:#fff;font-variant-numeric:tabular-nums}\n' +
'.card li.alert b{color:#EF4444}.card li.warn b{color:#F59E0B}\n' +
/* Section heading */
'.sh{display:flex;align-items:center;gap:10px;margin:24px 0 10px;font-size:14px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:1px}\n' +
'.sh::before{content:"";width:4px;height:18px;background:#1F4E78;border-radius:2px}\n' +
/* Bar chart */
'.bars{background:#162338;border:1px solid #1F2D45;border-radius:10px;padding:16px}\n' +
'.bar{display:grid;grid-template-columns:160px 1fr 50px;align-items:center;gap:10px;margin-bottom:10px;font-size:13px}\n' +
'.bar-name{color:#E5E7EB;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n' +
'.bar-track{background:#1F2D45;border-radius:4px;height:18px;overflow:hidden;position:relative}\n' +
'.bar-fill{background:linear-gradient(90deg,#EF4444,#F59E0B);height:100%;border-radius:4px;min-width:2px}\n' +
'.bar-val{text-align:right;font-weight:700;color:#fff;font-variant-numeric:tabular-nums}\n' +
/* Hot list */
'.hot-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}\n' +
'.hot{background:#1F1015;border:1px solid #4C1D24;border-radius:8px;padding:12px 14px;cursor:pointer;transition:all .15s;display:flex;gap:12px;align-items:flex-start}\n' +
'.hot:hover{background:#2D1820;border-color:#7F2D3A;transform:translateY(-1px)}\n' +
'.hot-num{width:28px;height:28px;background:#7F1D1D;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}\n' +
'.hot-content{flex:1;min-width:0}\n' +
'.hot-team{display:inline-block;background:#7F1D1D;color:#fff;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600;margin-right:8px}\n' +
'.hot-title{font-size:13px;color:#fff;font-weight:600;margin-bottom:2px}\n' +
'.hot-sub{font-size:11px;color:#9CA3AF;margin-bottom:4px}\n' +
'.hot-detail{font-size:11px;color:#D1D5DB;line-height:1.35}\n' +
'.hot-badge{font-size:10px;background:#7F1D1D;color:#fff;padding:2px 6px;border-radius:3px;margin-left:auto;flex-shrink:0;align-self:center}\n' +
/* Filter bar */
'.filters{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px}\n' +
'.filters select,.filters input{background:#162338;color:#fff;border:1px solid #1F2D45;border-radius:6px;padding:7px 10px;font-size:13px;font-family:inherit}\n' +
'.filters input{width:240px}\n' +
'.filters .badge{background:#374151;color:#fff;padding:5px 10px;border-radius:4px;font-size:12px;font-variant-numeric:tabular-nums}\n' +
/* Table */
'.tbl-wrap{background:#162338;border:1px solid #1F2D45;border-radius:8px;overflow:auto;max-height:75vh}\n' +
'table.tbl{width:100%;border-collapse:collapse;font-size:13px}\n' +
'table.tbl th{background:#1F2D45;color:#E5E7EB;text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.6px;font-weight:600;position:sticky;top:0;z-index:10;border-bottom:2px solid #0F1B2D}\n' +
'table.tbl td{padding:10px 12px;border-bottom:1px solid #1F2D45;vertical-align:top;color:#D1D5DB}\n' +
'table.tbl tr{cursor:pointer;transition:background .12s}\n' +
'table.tbl tr:hover{background:#1F2D45}\n' +
'table.tbl td.num{text-align:right;font-variant-numeric:tabular-nums}\n' +
'table.tbl .pill{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}\n' +
'.pill.red{background:#7F1D1D;color:#FECACA}.pill.yellow{background:#78350F;color:#FDE68A}.pill.green{background:#14532D;color:#BBF7D0}.pill.blue{background:#1E3A8A;color:#BFDBFE}.pill.gray{background:#374151;color:#D1D5DB}\n' +
'.tre-badge{background:#7F1D1D;color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;font-weight:600}\n' +
/* Pipeline */
'.pipeline{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px}\n' +
'.col{background:#162338;border:1px solid #1F2D45;border-radius:8px;min-width:280px;flex:0 0 280px;display:flex;flex-direction:column;max-height:75vh}\n' +
'.col-head{padding:12px;border-bottom:2px solid #1F2D45;display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:.5px}\n' +
'.col-count{background:#1F4E78;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px}\n' +
'.col-body{padding:8px;overflow-y:auto;flex:1}\n' +
'.kanban-card{background:#1F2D45;border:1px solid #2C3E5C;border-radius:6px;padding:10px;margin-bottom:8px;cursor:pointer;transition:all .12s}\n' +
'.kanban-card:hover{border-color:#3B82F6;background:#243353}\n' +
'.kanban-card .ma{font-size:10px;color:#60A5FA;font-weight:700;margin-bottom:3px}\n' +
'.kanban-card .nd{font-size:12px;color:#fff;font-weight:500;margin-bottom:6px;line-height:1.3}\n' +
'.kanban-card .meta{font-size:10px;color:#9CA3AF;display:flex;justify-content:space-between;align-items:center}\n' +
'.progress{background:#0F1B2D;height:4px;border-radius:2px;margin-top:6px;overflow:hidden}\n' +
'.progress-fill{background:#10B981;height:100%}\n' +
/* Khoa view */
'.khoa-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}\n' +
'.khoa-card{background:#162338;border:1px solid #1F2D45;border-radius:8px;padding:14px;text-align:center}\n' +
'.khoa-card h4{font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}\n' +
'.khoa-card .v{font-size:32px;font-weight:700;color:#fff}\n' +
/* Loading */
'.loading{text-align:center;padding:40px;color:#6B7280;font-style:italic}\n' +
'.error{background:#7F1D1D;color:#FECACA;padding:12px;border-radius:6px;margin:12px 0}\n' +
'.empty{text-align:center;padding:30px;color:#6B7280;font-style:italic;background:#162338;border-radius:8px;border:1px dashed #1F2D45}\n' +
'@media (max-width:1200px){.cards,.khoa-summary{grid-template-columns:repeat(2,1fr)}.hot-grid{grid-template-columns:1fr}}\n' +
/* v2.3 search bar */
'.search-wrap{position:relative;flex:0 0 320px}\n' +
'#search{width:100%;background:#0F1B2D;color:#E5E7EB;border:1px solid #2D3D5C;border-radius:6px;padding:8px 12px;font-size:13px}\n' +
'#search:focus{outline:none;border-color:#3B82F6}\n' +
'#search-results{position:absolute;top:38px;left:0;right:0;background:#1B2940;border:1px solid #2D3D5C;border-radius:6px;max-height:400px;overflow-y:auto;z-index:200;display:none;box-shadow:0 8px 24px rgba(0,0,0,0.4)}\n' +
'#search-results.show{display:block}\n' +
'.search-item{padding:8px 12px;cursor:pointer;border-bottom:1px solid #2D3D5C}\n' +
'.search-item:hover{background:#243553}\n' +
'.search-item .type{display:inline-block;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;margin-right:8px}\n' +
'.search-item .type.KT{background:#1E40AF;color:#DBEAFE}\n' +
'.search-item .type.VT{background:#065F46;color:#D1FAE5}\n' +
'.search-item .type.HS{background:#92400E;color:#FEF3C7}\n' +
'.search-item .label{color:#fff;font-weight:500}\n' +
'.search-item .sub{color:#9CA3AF;font-size:11px;margin-top:2px}\n' +
/* v2.3 modal 360-degree */
'.modal-backdrop{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:none;align-items:flex-start;justify-content:center;padding:30px;overflow-y:auto}\n' +
'.modal-backdrop.show{display:flex}\n' +
'.modal{background:#0F1B2D;border:1px solid #2D3D5C;border-radius:12px;width:100%;max-width:1400px;box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:slideDown .25s ease}\n' +
'@keyframes slideDown{from{transform:translateY(-30px);opacity:0}to{transform:translateY(0);opacity:1}}\n' +
'.modal-header{padding:18px 24px;border-bottom:1px solid #2D3D5C;display:flex;align-items:center;justify-content:space-between;gap:12px}\n' +
'.modal-title{display:flex;align-items:center;gap:12px;flex:1}\n' +
'.modal-title .badge{font-size:11px;font-weight:700;padding:4px 10px;border-radius:4px}\n' +
'.badge.KT{background:#1E40AF;color:#DBEAFE}\n' +
'.badge.VT{background:#065F46;color:#D1FAE5}\n' +
'.badge.HS{background:#92400E;color:#FEF3C7}\n' +
'.modal-title h2{font-size:18px;color:#fff}\n' +
'.modal-actions{display:flex;gap:8px}\n' +
'.btn{background:#243553;color:#E5E7EB;border:1px solid #2D3D5C;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px}\n' +
'.btn:hover{background:#2D3D5C}\n' +
'.btn-close{background:#7F1D1D}.btn-close:hover{background:#991B1B}\n' +
'.modal-body{padding:0}\n' +
'.modal-layout{display:grid;grid-template-columns:minmax(320px, 40%) 1fr;gap:0;border-bottom:1px solid #2D3D5C}\n' +
'.modal-main{padding:20px;border-right:1px solid #2D3D5C}\n' +
'.modal-side{padding:24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;align-content:start}\n' +
'.modal-layout h3{font-size:11px;text-transform:uppercase;color:#9CA3AF;letter-spacing:.6px;margin-bottom:12px;font-weight:600}\n' +
'.modal-layout h3 .count{background:#243553;color:#E5E7EB;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:6px}\n' +
'.alert-box{padding:12px;border-radius:6px;margin-top:10px;font-size:13px;line-height:1.5;background:rgba(239,68,68,0.15);border-left:4px solid #EF4444;color:#FECACA}\n' +
'.alert-box b{color:#FCA5A5}\n' +
'.empty-box{border:1px dashed #2D3D5C;padding:16px;text-align:center;color:#6B7280;font-style:italic;border-radius:6px;font-size:12px;background:rgba(0,0,0,0.1)}\n' +
'.entity-card{background:#162338;border:1px solid #2D3D5C;border-radius:6px;padding:10px;margin-bottom:8px;cursor:pointer;transition:.15s}\n' +
'.entity-card:hover{background:#243553;border-color:#3B82F6}\n' +
'.entity-card .name{color:#fff;font-weight:600;font-size:13px;margin-bottom:4px}\n' +
'.entity-card .meta{color:#9CA3AF;font-size:11px;line-height:1.5}\n' +
'.entity-card .meta .lbl{color:#6B7280}\n' +
'.entity-card .fuzzy-badge{font-size:9px;background:#3F3F46;color:#FACC15;padding:1px 4px;border-radius:2px;margin-left:4px}\n' +
'.entity-card .manual-badge{font-size:9px;background:#1E3A8A;color:#93C5FD;padding:1px 4px;border-radius:2px;margin-left:4px}\n' +
'.modal-meta{padding:14px 18px;background:#0B1422;color:#9CA3AF;font-size:12px;border-top:1px solid #2D3D5C;line-height:1.6}\n' +
'.modal-meta strong{color:#E5E7EB}\n' +
'.modal-meta .row-info{display:flex;gap:24px;flex-wrap:wrap}\n' +
'.modal-meta .row-info > div{flex:1;min-width:200px}\n' +
'.chain-row{background:#162338;border:1px solid #2D3D5C;border-radius:8px;padding:14px;margin-bottom:10px;transition:transform 0.2s,box-shadow 0.2s}\n' +
'.chain-row:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.3)}\n' +
'.chain-row.chain-red{border-left:4px solid #EF4444;background:linear-gradient(90deg, rgba(239,68,68,0.1) 0%, #162338 25%)}\n' +
'.chain-row.chain-orange{border-left:4px solid #F97316;background:linear-gradient(90deg, rgba(249,115,22,0.1) 0%, #162338 25%)}\n' +
'.chain-row .chain-title{display:flex;align-items:center;gap:10px;margin-bottom:10px}\n' +
'.chain-row .severity{padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700}\n' +
'.chain-row .severity.red{background:#7F1D1D;color:#FECACA}\n' +
'.chain-row .severity.orange{background:#9A3412;color:#FED7AA}\n' +
'.chain-row .severity.yellow{background:#78350F;color:#FDE68A}\n' +
'.chain-flow{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:8px;align-items:center}\n' +
'.chain-flow .arrow{color:#6B7280;font-size:18px}\n' +
'.chain-node{padding:8px;background:#0F1B2D;border-radius:4px;cursor:pointer;border:1px solid #2D3D5C}\n' +
'.chain-node:hover{background:#243553}\n' +
'.chain-node .nm{color:#fff;font-size:12px;font-weight:500}\n' +
'.chain-node .sm{color:#9CA3AF;font-size:10px;margin-top:2px}\n' +
'.chain-node.empty{opacity:0.5;font-style:italic;color:#6B7280;cursor:default}\n' +
/* v2.4 — generic row modal */
'.kv-list{padding:18px;display:grid;grid-template-columns:200px 1fr;gap:8px 16px;font-size:13px}\n' +
'.kv-list .k{color:#9CA3AF;font-weight:500;text-align:right;padding:6px 0;border-bottom:1px dashed #2D3D5C}\n' +
'.kv-list .v{color:#fff;padding:6px 0;border-bottom:1px dashed #2D3D5C;word-break:break-word}\n' +
'.kv-list .v.empty{color:#4B5563;font-style:italic}\n' +
'@media (max-width:800px){.kv-list{grid-template-columns:1fr}.kv-list .k{text-align:left}}\n' +
/* v2.4 — khoa modal (lãnh đạo dashboard cho 1 khoa) */
'.khoa-modal-wrap{padding:18px}\n' +
'.khoa-modal-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}\n' +
'.khoa-modal-stat{background:#162338;border:1px solid #2D3D5C;border-radius:6px;padding:10px;text-align:center}\n' +
'.khoa-modal-stat .k{font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px}\n' +
'.khoa-modal-stat .v{font-size:24px;font-weight:700;color:#fff;margin-top:4px}\n' +
'.khoa-modal-section{margin-top:16px;background:#162338;border:1px solid #2D3D5C;border-radius:6px}\n' +
'.khoa-modal-section h3{padding:10px 14px;border-bottom:1px solid #2D3D5C;font-size:12px;text-transform:uppercase;color:#E5E7EB;letter-spacing:.5px;font-weight:600}\n' +
'.khoa-modal-section h3 .count{background:#0F1B2D;color:#9CA3AF;padding:1px 8px;border-radius:8px;font-size:10px;margin-left:8px}\n' +
'.khoa-modal-section .tbl{margin:0;border-radius:0}\n' +
'.khoa-modal-section .empty{padding:14px;color:#6B7280;font-style:italic;font-size:12px}\n' +
'.btn-secondary{background:#374151;color:#D1D5DB;font-size:11px;padding:5px 9px}\n' +
'.btn-secondary:hover{background:#4B5563}\n' +
/* v2.5 — Kho card / mini badge / inline expand */
'.kho-card{background:#0B1422;border:1px solid #2D3D5C;border-radius:6px;padding:10px;margin-top:8px;font-size:12px;line-height:1.5}\n' +
'.kho-card .kho-h{font-size:11px;color:#D1D5DB;font-weight:600;margin-bottom:4px}\n' +
'.kho-card .kho-stat{color:#9CA3AF;font-size:11px;line-height:1.55}\n' +
'.kho-card .kho-queue{margin-top:6px;border-top:1px dashed #2D3D5C;padding-top:6px}\n' +
'.kho-card .kho-queue-item{display:flex;justify-content:space-between;font-size:11px;color:#D1D5DB;padding:2px 0}\n' +
'.kho-card .kho-queue-item .khn{color:#fff;font-weight:500}\n' +
'.kho-mini{margin-top:4px;display:flex;flex-wrap:wrap;gap:4px}\n' +
'.mini-pill{display:inline-block;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600;line-height:1.5}\n' +
'.stock-pill.red{background:#7F1D1D;color:#FECACA}\n' +
'.stock-pill.yellow{background:#78350F;color:#FDE68A}\n' +
'.stock-pill.orange{background:#9A3412;color:#FED7AA}\n' +
'.stock-pill.green{background:#14532D;color:#BBF7D0}\n' +
'.stock-pill.blue{background:#1E3A8A;color:#BFDBFE}\n' +
'.stock-pill.gray{background:#374151;color:#D1D5DB}\n' +
'.tbl-kho-5a tr.kho-5a-row.expanded{background:#1F2D45}\n' +
'.tbl-kho-5a tr.kho-5a-row.expanded td{border-bottom-color:transparent}\n' +
'.kho-expand-wrap{display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:14px;padding:14px 18px;border-top:1px solid #1F4E78;border-bottom:1px solid #1F4E78;background:#0B1422}\n' +
'.kho-expand-col h4{font-size:11px;text-transform:uppercase;color:#9CA3AF;letter-spacing:.6px;margin-bottom:8px;font-weight:600}\n' +
'.kho-expand-col .empty-mini{color:#6B7280;font-size:11px;font-style:italic;padding:6px 8px;background:#162338;border-radius:4px}\n' +
'.kho-link-card{background:#162338;border:1px solid #2D3D5C;border-radius:5px;padding:8px 10px;margin-bottom:6px;cursor:pointer;transition:.12s}\n' +
'.kho-link-card:hover{background:#243553;border-color:#3B82F6}\n' +
'.kho-link-card .nm{color:#fff;font-weight:600;font-size:12px;margin-bottom:2px}\n' +
'.kho-link-card .sm{color:#9CA3AF;font-size:11px;line-height:1.5}\n' +
'.kho-queue-line{display:grid;grid-template-columns:1.4fr .8fr .8fr 1fr;gap:8px;font-size:11px;padding:5px 8px;border-bottom:1px dashed #1F2D45;align-items:baseline}\n' +
'.kho-queue-line:last-child{border-bottom:none}\n' +
'.kho-queue-line .kn{color:#fff;font-weight:500}\n' +
'.kho-queue-line .qty{color:#FBBF24;font-variant-numeric:tabular-nums;text-align:right}\n' +
'.kho-queue-line .dt{color:#9CA3AF}\n' +
'.kho-queue-line .st{font-weight:500}\n' +
'.kho-expand-action{grid-column:1 / -1;color:#FBBF24;font-size:12px;padding:8px 10px;background:#162338;border-radius:5px;margin-top:6px}\n' +
'.kho-expand-action b{color:#fff}\n' +
/* v2.8 — Forecast cung ứng */
'.forecast-alert{border-radius:8px;padding:12px 14px;margin:10px 0 14px;font-size:13px;line-height:1.5;animation:hot-pulse 2.4s ease-in-out infinite}\n' +
'.forecast-alert.critical{background:#7F1D1D;color:#FECACA;border:1px solid #DC2626}\n' +
'.forecast-alert.warn{background:#78350F;color:#FDE68A;border:1px solid #D97706}\n' +
'.forecast-alert.stag{background:#7F1D1D;color:#FECACA;border:1px solid #991B1B}\n' +
'.forecast-alert.stag-mid{background:#451A03;color:#FED7AA;border:1px solid #9A3412}\n' +
'.forecast-alert b{color:#fff;font-weight:700}\n' +
'.forecast-stats{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;margin-bottom:14px}\n' +
'.fs-card{background:#162338;border:1px solid #1F2D45;border-radius:8px;padding:14px;text-align:center;cursor:default;transition:transform .15s}\n' +
'.fs-card:hover{transform:translateY(-1px)}\n' +
'.fs-red{border-top:3px solid #DC2626}\n' +
'.fs-orange{border-top:3px solid #EA580C}\n' +
'.fs-yellow{border-top:3px solid #D97706}\n' +
'.fs-blue{border-top:3px solid #1E40AF}\n' +
'.fs-gray{border-top:3px solid #6B7280}\n' +
'.fs-num{font-size:32px;font-weight:700;color:#fff;line-height:1;margin-bottom:6px}\n' +
'.fs-red .fs-num{color:#F87171}\n' +
'.fs-orange .fs-num{color:#FB923C}\n' +
'.fs-yellow .fs-num{color:#FBBF24}\n' +
'.fs-blue .fs-num{color:#60A5FA}\n' +
'.fs-gray .fs-num{color:#9CA3AF}\n' +
'.fs-darkgray{border-top:3px solid #4B5563}\n' +
'.fs-darkgray .fs-num{color:#FB923C}\n' +
'.fs-darkred{border-top:3px solid #991B1B}\n' +
'.fs-darkred .fs-num{color:#EF4444}\n' +
'.fs-lbl{font-size:11px;color:#E5E7EB;font-weight:600;line-height:1.3}\n' +
'.fs-lbl small{display:block;font-size:10px;color:#9CA3AF;font-weight:400;margin-top:2px;text-transform:none;letter-spacing:0}\n' +
'.forecast-table{background:#162338;border:1px solid #1F2D45;border-radius:8px;overflow:hidden;margin-bottom:6px}\n' +
'.ft-head{padding:10px 14px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px;font-weight:600;background:#1F2D45;border-bottom:1px solid #0F1B2D}\n' +
'.ft-row{display:grid;grid-template-columns:170px 1.5fr 2fr;gap:14px;padding:10px 14px;border-bottom:1px solid #1F2D45;align-items:center;cursor:pointer;transition:background .12s}\n' +
'.ft-row:last-child{border-bottom:none}\n' +
'.ft-row:hover{background:#1F2D45}\n' +
'.ft-row.ft-red{background:rgba(127,29,29,0.12)}\n' +
'.ft-row.ft-red:hover{background:rgba(127,29,29,0.22)}\n' +
'.ft-row.ft-orange{background:rgba(154,52,18,0.10)}\n' +
'.ft-row.ft-orange:hover{background:rgba(154,52,18,0.20)}\n' +
'.ft-row.ft-yellow{background:rgba(120,53,15,0.10)}\n' +
'.ft-row.ft-yellow:hover{background:rgba(120,53,15,0.20)}\n' +
'.ft-row.ft-darkred{background:rgba(127,29,29,0.18)}\n' +
'.ft-row.ft-darkred:hover{background:rgba(127,29,29,0.30)}\n' +
'.ft-row.ft-darkred .ft-action{color:#FCA5A5;font-weight:600}\n' +
'.ft-lvl{font-size:11px;font-weight:700;color:#fff;letter-spacing:.3px}\n' +
'.ft-info .ft-name{color:#fff;font-size:13px;font-weight:600;line-height:1.4;margin-bottom:3px}\n' +
'.ft-info .ft-code{display:inline-block;background:#0F1B2D;color:#60A5FA;font-size:10px;padding:1px 6px;border-radius:3px;font-weight:500;margin-left:4px;font-family:monospace}\n' +
'.ft-info .ft-meta{font-size:11px;color:#9CA3AF;line-height:1.5}\n' +
'.ft-info .ft-meta b{color:#fff}\n' +
'.ft-stag-tag{display:inline-block;font-size:10px;background:#374151;color:#9CA3AF;padding:1px 6px;border-radius:3px;margin-left:4px;font-weight:500}\n' +
'.ft-action{font-size:12px;line-height:1.5;color:#E5E7EB}\n' +
'.ft-row.ft-not-ok .ft-action{color:#FCD34D;font-weight:500}\n' +
'.ft-row.ft-red.ft-not-ok .ft-action{color:#FCA5A5}\n' +
'@media (max-width:1100px){.forecast-stats{grid-template-columns:repeat(3,1fr)}.ft-row{grid-template-columns:1fr;gap:6px}}\n' +
/* v2.7 — KPI cards (Tổng quan redesign) */
'.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}\n' +
'.kpi-card{background:linear-gradient(180deg,#1A2740 0%,#162338 100%);border:1px solid #1F2D45;border-radius:12px;padding:18px 20px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}\n' +
'.kpi-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:#374151}\n' +
'.kpi-card.kpi-red::before{background:linear-gradient(90deg,#EF4444,#DC2626)}\n' +
'.kpi-card.kpi-yellow::before{background:linear-gradient(90deg,#F59E0B,#D97706)}\n' +
'.kpi-card.kpi-green::before{background:linear-gradient(90deg,#10B981,#059669)}\n' +
'.kpi-card:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,0.4);border-color:#3B82F6}\n' +
'.kpi-card .kpi-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}\n' +
'.kpi-card .kpi-icon{font-size:22px;width:36px;height:36px;border-radius:8px;background:#0F1B2D;display:flex;align-items:center;justify-content:center;flex-shrink:0}\n' +
'.kpi-card .kpi-title{font-size:14px;color:#fff;font-weight:600;line-height:1.2}\n' +
'.kpi-card .kpi-title small{display:block;font-size:11px;color:#9CA3AF;font-weight:400;margin-top:1px}\n' +
'.kpi-card .kpi-num{font-variant-numeric:tabular-nums;margin:6px 0 12px;line-height:1}\n' +
'.kpi-card .kpi-num .big{font-size:38px;font-weight:700;color:#fff}\n' +
'.kpi-card .kpi-num .sep{font-size:24px;color:#4B5563;margin:0 2px}\n' +
'.kpi-card .kpi-num .total{font-size:22px;color:#9CA3AF;font-weight:500}\n' +
'.kpi-card .kpi-progress{background:#0F1B2D;height:6px;border-radius:3px;overflow:hidden;margin-bottom:6px}\n' +
'.kpi-card .kpi-progress-fill{height:100%;border-radius:3px;transition:width .6s ease}\n' +
'.kpi-card .kpi-progress-fill.red{background:linear-gradient(90deg,#EF4444,#F87171)}\n' +
'.kpi-card .kpi-progress-fill.yellow{background:linear-gradient(90deg,#F59E0B,#FBBF24)}\n' +
'.kpi-card .kpi-progress-fill.green{background:linear-gradient(90deg,#10B981,#34D399)}\n' +
'.kpi-card .kpi-pct{font-size:11px;font-weight:600;letter-spacing:.3px;margin-bottom:10px}\n' +
'.kpi-card .kpi-pct.red{color:#F87171}\n' +
'.kpi-card .kpi-pct.yellow{color:#FBBF24}\n' +
'.kpi-card .kpi-pct.green{color:#34D399}\n' +
'.kpi-card .kpi-chips{display:flex;flex-wrap:wrap;gap:5px;min-height:24px}\n' +
'.kpi-card .chip{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:4px;font-size:11px;background:#0F1B2D;color:#D1D5DB;line-height:1.4}\n' +
'.kpi-card .chip b{color:#fff;font-weight:700;margin-left:2px}\n' +
'.kpi-card .chip-red{background:#3F1A1F;color:#FCA5A5}\n' +
'.kpi-card .chip-red b{color:#FECACA}\n' +
'.kpi-card .chip-yellow{background:#3D2810;color:#FCD34D}\n' +
'.kpi-card .chip-yellow b{color:#FDE68A}\n' +
'.kpi-card .chip-gray{background:#1F2937;color:#9CA3AF}\n' +
'.kpi-card .kpi-foot{margin-top:10px;padding-top:8px;border-top:1px dashed #1F2D45;font-size:11px;color:#9CA3AF}\n' +
'.kpi-card .kpi-foot-num{color:#60A5FA;font-weight:600}\n' +
'.kpi-card .kpi-cta{position:absolute;top:14px;right:14px;font-size:10px;color:#6B7280;font-weight:500;text-transform:uppercase;letter-spacing:.5px;opacity:0;transition:opacity .2s}\n' +
'.kpi-card:hover .kpi-cta{opacity:1;color:#60A5FA}\n' +
'@media (max-width:1200px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}\n' +
/* v2.7 — KT summary chips */
'.kt-summary{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}\n' +
'.kt-chip{background:#162338;border:1px solid #2D3D5C;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s;color:#E5E7EB;font-family:inherit;font-size:13px;min-width:120px}\n' +
'.kt-chip:hover{background:#1F2D45;border-color:#3B82F6;transform:translateY(-1px)}\n' +
'.kt-chip.active{border-color:#3B82F6;background:#1E3A8A;color:#fff;box-shadow:0 0 0 1px #3B82F6}\n' +
'.kt-chip.red{border-left:3px solid #EF4444}\n' +
'.kt-chip.yellow{border-left:3px solid #F59E0B}\n' +
'.kt-chip.gray{border-left:3px solid #6B7280}\n' +
'.kt-chip-icon{font-size:18px}\n' +
'.kt-chip-num{display:block;font-size:18px;font-weight:700;color:#fff;line-height:1}\n' +
'.kt-chip-lbl{display:block;font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.4px;margin-top:2px}\n' +
'.kt-chip[data-chip="reset"]{min-width:auto;padding:8px 12px;color:#9CA3AF;font-size:12px}\n' +
/* v2.7 — KT filter row */
'.kt-filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;padding:10px 12px;background:#162338;border:1px solid #1F2D45;border-radius:8px}\n' +
'.kt-filters input,.kt-filters select{background:#0F1B2D;color:#fff;border:1px solid #2D3D5C;border-radius:6px;padding:6px 10px;font-size:12px;font-family:inherit}\n' +
'.kt-filters input{min-width:240px;flex:1}\n' +
'.kt-filters select{min-width:130px}\n' +
'.kt-filters .toggle{display:inline-flex;align-items:center;gap:5px;color:#9CA3AF;font-size:12px;padding:0 6px;cursor:pointer}\n' +
'.kt-filters .toggle input{width:auto;min-width:auto}\n' +
'.kt-filters .badge{background:#1E40AF;color:#fff;padding:5px 10px;border-radius:4px;font-size:11px;font-variant-numeric:tabular-nums;font-weight:600;margin-left:auto}\n' +
/* v2.7 — KT table improvements */
'.tbl-kt .col-ten{position:sticky;left:0;background:inherit;z-index:5;min-width:200px;max-width:240px}\n' +
'.tbl-kt .col-cap{width:80px;text-align:center}\n' +
'.tbl-kt .col-ht{width:50px;text-align:center}\n' +
'.tbl-kt tr.row-done{opacity:0.55}\n' +
'.tbl-kt tr.row-critical:hover,.tbl-kt tr.row-cao:hover,.tbl-kt tr.row-tre:hover{background:#1F2D45}\n' +
/* v2.7.5 — HOT badge nhấp nháy thay cho row coloring */
'.hot-badge{display:inline-flex;align-items:center;gap:2px;padding:1px 6px;border-radius:4px;font-size:9.5px;font-weight:700;letter-spacing:.4px;margin-right:6px;vertical-align:middle;animation:hot-pulse 1.6s ease-in-out infinite}\n' +
'.hot-badge.hb-critical{background:#7F1D1D;color:#FECACA}\n' +
'.hot-badge.hb-tre{background:#78350F;color:#FDE68A}\n' +
'.hot-badge.hb-cao{background:#7F1D1D;color:#FECACA;animation:none}\n' +
'@keyframes hot-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.65);transform:scale(1)}50%{box-shadow:0 0 0 5px rgba(239,68,68,0);transform:scale(1.04)}}\n' +
'.tbl-kt .ht-tick{color:#10B981;font-size:16px;font-weight:700}\n' +
'.tbl-kt .ht-pending{color:#6B7280;font-size:14px}\n' +
/* Old .cards class — giữ tương thích */
'.cards{display:none}\n' +
/* v2.7.4 — Hồ sơ tab styles */
'.hs-budget{margin-left:auto;color:#9CA3AF;font-size:12px;padding:8px 12px;background:#162338;border:1px solid #1F2D45;border-radius:6px}\n' +
'.hs-budget b{color:#60A5FA;font-weight:700}\n' +
'.hs-toolbar{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:10px}\n' +
'.hs-view-toggle{display:flex;gap:0;background:#0F1B2D;border:1px solid #1F2D45;border-radius:6px;width:fit-content;overflow:hidden}\n' +
'.hs-groupby{display:flex;align-items:center;gap:8px;color:#9CA3AF;font-size:12px}\n' +
'.hs-groupby label{font-weight:500}\n' +
'.hs-groupby select{background:#0F1B2D;color:#fff;border:1px solid #1F2D45;border-radius:6px;padding:6px 10px;font-size:12px;font-family:inherit;cursor:pointer;min-width:180px}\n' +
'.hs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;margin-top:6px}\n' +
'.hs-grid .kanban-card{margin-bottom:0}\n' +
'.hs-grid-banner{background:#162338;border:1px solid #1F2D45;border-radius:8px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;flex-wrap:wrap;gap:10px;font-size:13px;color:#E5E7EB}\n' +
'.hs-grid-banner b{color:#fff}\n' +
'.hs-grid-cnt{background:#1E40AF;color:#fff;padding:2px 9px;border-radius:10px;font-size:11px;font-weight:600}\n' +
'.hs-grid-hint{color:#9CA3AF;font-size:11px;margin-left:auto;font-style:italic}\n' +
'.hs-vbtn{background:transparent;border:0;color:#9CA3AF;padding:8px 16px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:500;transition:all .12s}\n' +
'.hs-vbtn:hover{color:#fff;background:#162338}\n' +
'.hs-vbtn.active{background:#1E40AF;color:#fff}\n' +
'.kanban-card{position:relative;border-left:3px solid transparent}\n' +
'.kanban-card.card-critical{border-left-color:#DC2626}\n' +
'.kanban-card.card-cao{border-left-color:#EF4444}\n' +
'.kanban-card.card-tre{border-left-color:#F59E0B}\n' +
'.kanban-cb{font-size:11px;color:#FBBF24;margin-top:6px;padding-top:5px;border-top:1px dashed #2C3E5C}\n' +
'.kanban-vuong{font-size:11px;color:#FCA5A5;margin-top:5px;line-height:1.4;font-style:italic}\n' +
'.kt-chip.green{border-left:3px solid #10B981}\n' +
/* v2.7.2 — Hot list grouped by team */
'.hot-by-team{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px}\n' +
'.hot-team-col{background:#162338;border:1px solid #1F2D45;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:8px}\n' +
'.hot-team-col.hot-team-red{border-top:3px solid #DC2626}\n' +
'.hot-team-col.hot-team-yellow{border-top:3px solid #D97706}\n' +
'.hot-team-col.hot-team-orange{border-top:3px solid #EA580C}\n' +
'.hot-team-h{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid #1F2D45;margin-bottom:4px}\n' +
'.hot-team-icon{font-size:20px;width:34px;height:34px;border-radius:8px;background:#0F1B2D;display:flex;align-items:center;justify-content:center;flex-shrink:0}\n' +
'.hot-team-meta{flex:1;min-width:0}\n' +
'.hot-team-name{font-size:13px;color:#fff;font-weight:600;line-height:1.2}\n' +
'.hot-team-cnt{font-size:11px;color:#9CA3AF;margin-top:2px}\n' +
'.hot-empty{padding:14px;text-align:center;color:#10B981;font-size:12px;font-style:italic;background:#0F1B2D;border-radius:6px}\n' +
'.hot-item{background:#0F1B2D;border:1px solid #1F2D45;border-radius:6px;padding:10px 12px;cursor:pointer;transition:all .15s}\n' +
'.hot-item:hover{background:#1B2940;border-color:#3B82F6;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.3)}\n' +
'.hot-item-head{display:flex;align-items:center;gap:8px;margin-bottom:5px}\n' +
'.hot-item-num{flex-shrink:0;width:20px;height:20px;border-radius:50%;background:#1F2D45;color:#9CA3AF;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}\n' +
'.hot-item-title{flex:1;color:#fff;font-size:12.5px;font-weight:600;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}\n' +
'.hot-item-badge{flex-shrink:0;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:600;line-height:1.5}\n' +
'.hot-item-badge.red{background:#7F1D1D;color:#FECACA}\n' +
'.hot-item-badge.yellow{background:#78350F;color:#FDE68A}\n' +
'.hot-item-badge.orange{background:#9A3412;color:#FED7AA}\n' +
'.hot-item-sub{font-size:11px;color:#9CA3AF;margin-bottom:4px;line-height:1.4}\n' +
'.hot-item-detail{font-size:11px;color:#D1D5DB;line-height:1.45;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n' +
'.hot-item-cb{font-size:11px;color:#FBBF24;margin-top:4px;padding-top:4px;border-top:1px dashed #1F2D45}\n' +
'.hot-item-cb b{color:#FDE68A;font-weight:600}\n' +
'.hot-more{padding:8px;text-align:center;background:#0B1422;border:1px dashed #1F2D45;border-radius:5px;color:#60A5FA;font-size:11px;cursor:pointer;transition:all .15s}\n' +
'.hot-more:hover{background:#1F2D45;color:#93C5FD}\n' +
'@media (max-width:1100px){.hot-by-team{grid-template-columns:1fr}}\n' +
'.chain-row .severity.red{background:#7F1D1D;color:#FECACA}\n' +
'.expand-toggle{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;color:#6B7280;transition:.2s}\n' +
'.expanded .expand-toggle{transform:rotate(90deg);color:#3B82F6}\n' +
'.related-kho-section{margin-top:14px;border-top:1px solid #2D3D5C;padding-top:10px}\n' +
'.related-kho-section h4{font-size:11px;color:#9CA3AF;text-transform:uppercase;margin-bottom:8px}\n' +
'.risk-badge{font-size:10px;padding:2px 6px;border-radius:4px;margin-left:8px;font-weight:700}\n' +
'.risk-badge.CRITICAL{background:#7F1D1D;color:#FEE2E2;animation:blink 1.5s infinite}\n' +
'.risk-badge.HIGH{background:#991B1B;color:#FEE2E2}\n' +
'.risk-badge.WARNING{background:#92400E;color:#FEF3C7}\n' +
'.risk-badge.SAFE{background:#065F46;color:#D1FAE5}\n' +
'@keyframes blink{50%{opacity:0.5}}\n' +
/* v2.9.2 — Mobile responsive ưu tiên cao (sếp xem điện thoại lúc giao ban) */
'@media (max-width:900px){\n' +
/* === Header & Brand === */
'header{padding:10px 14px}\n' +
'.brand-row{flex-direction:column;align-items:stretch;gap:8px;margin-bottom:8px}\n' +
'.brand{font-size:17px;line-height:1.2}\n' +
'.brand small{font-size:10.5px;margin-top:3px}\n' +
'.search-wrap{flex:1 1 100%}\n' +
'.status-row{flex-wrap:wrap;gap:8px;justify-content:flex-end}\n' +
'.status-row .live{font-size:10px}\n' +
/* === Tabs nav === */
'nav.tabs{gap:4px;overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px;-webkit-overflow-scrolling:touch}\n' +
'nav.tabs button{padding:7px 11px;font-size:12px;flex-shrink:0;white-space:nowrap}\n' +
/* === Main padding === */
'main{padding:14px 14px 60px}\n' +
/* === KPI grid 1-col on mobile === */
'.kpi-grid{grid-template-columns:1fr;gap:10px;margin-bottom:18px}\n' +
'.kpi-card{padding:14px 16px}\n' +
'.kpi-card .kpi-num .big{font-size:32px}\n' +
'.kpi-card .kpi-num .total{font-size:20px}\n' +
'.kpi-card .kpi-cta{display:none}\n' +
/* === Forecast stats === */
'.forecast-stats{grid-template-columns:repeat(2,1fr);gap:8px}\n' +
'.fs-card{padding:10px}\n' +
'.fs-num{font-size:24px}\n' +
'.fs-lbl{font-size:10.5px}\n' +
/* === Hot by team stack === */
'.hot-by-team{grid-template-columns:1fr;gap:10px}\n' +
/* === KT summary chips full width === */
'.kt-summary{gap:6px}\n' +
'.kt-chip{flex:1 1 calc(50% - 4px);min-width:auto;padding:8px 10px;justify-content:flex-start}\n' +
'.kt-chip-num{font-size:16px}\n' +
'.kt-chip-lbl{font-size:9.5px}\n' +
'.kt-chip[data-chip="reset"]{flex:1 1 100%;justify-content:center}\n' +
/* === Filter row stack === */
'.kt-filters{flex-direction:column;align-items:stretch;padding:10px}\n' +
'.kt-filters input,.kt-filters select{width:100%;min-width:0;flex:none}\n' +
'.kt-filters .toggle{justify-content:flex-start}\n' +
'.kt-filters .badge{align-self:flex-end}\n' +
'.filters{flex-direction:column;align-items:stretch}\n' +
'.filters input,.filters select{width:100%}\n' +
/* === HS toolbar stack === */
'.hs-toolbar{flex-direction:column;align-items:stretch;gap:8px}\n' +
'.hs-view-toggle{width:100%}\n' +
'.hs-vbtn{flex:1;text-align:center}\n' +
'.hs-groupby{width:100%}\n' +
'.hs-groupby select{flex:1;min-width:0}\n' +
/* === Bar chart === */
'.bar{grid-template-columns:120px 1fr 32px;gap:6px;font-size:11px;margin-bottom:8px}\n' +
'.bar-name{font-size:11px}\n' +
'.bar-val{font-size:11px}\n' +
/* === Tables horizontal scroll === */
'.tbl-wrap{max-height:65vh;-webkit-overflow-scrolling:touch}\n' +
'table.tbl{font-size:11px}\n' +
'table.tbl th,table.tbl td{padding:7px 8px}\n' +
/* === Pipeline horizontal scroll === */
'.pipeline{padding-bottom:6px}\n' +
'.col{min-width:240px;flex:0 0 240px}\n' +
/* === Forecast table stack === */
'.ft-row{grid-template-columns:1fr;gap:6px;padding:10px 12px}\n' +
'.ft-lvl{font-size:11px}\n' +
'.ft-action{font-size:11px;margin-top:4px}\n' +
/* === Hot grid === */
'.hot-grid{grid-template-columns:1fr;gap:8px}\n' +
/* === Modal === */
'.modal-backdrop{padding:6px}\n' +
'.modal{border-radius:8px;max-height:96vh}\n' +
'.modal-layout{grid-template-columns:1fr}\n' +
'.modal-main{border-right:0;border-bottom:1px solid #2D3D5C;padding:14px}\n' +
'.modal-side{padding:14px}\n' +
'.modal-header{padding:12px 14px;flex-wrap:wrap}\n' +
'.modal-title h2{font-size:15px}\n' +
'.modal-actions{flex-wrap:wrap;gap:6px}\n' +
'.modal-actions .btn{font-size:11px;padding:5px 10px}\n' +
/* === KPI footer compact === */
'.kpi-card .kpi-foot{font-size:10.5px;line-height:1.4}\n' +
/* === Section heading mobile === */
'.sh{font-size:12px;margin:18px 0 8px}\n' +
'.sh small{display:none}\n' +
/* === Forecast alert === */
'.forecast-alert{font-size:12px;padding:10px 12px}\n' +
/* === Refresh + Email button === */
'#btn-refresh,#btn-email{font-size:11px;padding:6px 10px}\n' +
/* v2.8: On 900px, keep nav.tabs showing (it’ll be hidden at 768px) */
'nav.tabs{display:flex}\n' +
'}\n' +
'@media (max-width:480px){\n' +
/* Phones nhỏ */
'.forecast-stats{grid-template-columns:1fr}\n' +
'.kpi-card .kpi-num .big{font-size:28px}\n' +
'.kt-chip{flex:1 1 100%}\n' +
'.brand{font-size:15px}\n' +
'nav.tabs button{padding:6px 9px;font-size:11px}\n' +
'main{padding:10px 10px 50px}\n' +
'.col{min-width:220px;flex:0 0 220px}\n' +
'.hs-grid{grid-template-columns:1fr}\n' +
'.kanban-card{padding:10px}\n' +
'.kanban-card .nd{font-size:12px;line-height:1.35}\n' +
'}\n' +
/* v2.8: Mobile bottom nav — always present, shown only <=768px */
'#mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:500;background:rgba(10,22,40,0.96);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(30,58,95,0.5);padding:8px 4px max(12px,env(safe-area-inset-bottom));justify-content:space-around;align-items:center;box-shadow:0 -4px 24px rgba(0,0,0,.7)}\n' +
'.mnb{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;flex:1 1 0;background:none;border:none;color:#6B7280;cursor:pointer;padding:7px 6px;font-size:10px;transition:all .2s ease;min-width:0;position:relative;border-radius:12px;margin:0 2px}\n' +
'.mnb.active{color:#60A5FA;background:rgba(59,130,246,0.15)}\n' +
'.mnb.active .mnb-ic{filter:drop-shadow(0 0 8px rgba(60,130,246,0.7))}\n' +
'.mnb:active{transform:scale(0.88);transition:transform .1s}\n' +
'.mnb-ic{font-size:23px;line-height:1;display:block;transition:transform .2s}\n' +
'.mnb-lbl{font-size:10px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:58px;display:block;letter-spacing:0.3px}\n' +
'#mob-more-menu{display:none;position:fixed;bottom:58px;right:0;left:0;background:#162338;border-top:1px solid #2D3D5C;border-bottom:none;padding:8px 0;box-shadow:0 -6px 24px rgba(0,0,0,.7);z-index:499}\n' +
'#mob-more-menu.open{display:block}\n' +
'.mnb-extra{display:block;width:100%;text-align:left;padding:13px 18px;background:none;border:none;border-bottom:1px solid #1E3A5F;color:#E5E7EB;font-size:15px;cursor:pointer}\n' +
'.mnb-extra:last-child{border-bottom:0}\n' +
'.mnb-extra:active{background:#1E3A5F}\n' +
'/* === v2.8: JS-class .mob — reliable mobile override (replaces media query) === */\n' +
'html.mob #mob-nav{display:flex}\n' +
'html.mob nav.tabs{display:none}\n' +
'html.mob header#app-header{padding:7px 12px}\n' +
'html.mob .brand-row{flex-wrap:nowrap;gap:8px;align-items:center}\n' +
'html.mob .brand{font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n' +
'html.mob .brand small{display:none}\n' +
'html.mob #updated{display:none}\n' +
'html.mob #btn-email{display:none}\n' +
'html.mob #btn-refresh{padding:5px 8px;font-size:10px}\n' +
'html.mob main{padding:12px 12px 72px}\n' +
'html.mob .kpi-grid{grid-template-columns:repeat(2,1fr);gap:8px}\n' +
'html.mob .kpi-card{padding:14px 12px}\n' +
'html.mob .kpi-card .kpi-num .big{font-size:30px;font-weight:800}\n' +
'html.mob .kpi-card .kpi-num .total{font-size:18px;opacity:0.75}\n' +
'html.mob .kpi-card .kpi-cta{display:none}\n' +
'html.mob .kpi-progress{height:6px;border-radius:3px}\n' +
'html.mob .kpi-chips{gap:4px;flex-wrap:wrap}\n' +
'html.mob .kpi-chip{font-size:10.5px;padding:3px 7px}\n' +
'html.mob .hot-team-section{border:1px solid #1E3A5F;border-radius:8px;overflow:hidden;margin-bottom:10px}\n' +
'html.mob .hot-team-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer;background:#0F1B2D;user-select:none;-webkit-tap-highlight-color:transparent}\n' +
'html.mob .hot-team-header h3{font-size:13px;margin:0;color:#fff}\n' +
'html.mob .hot-team-toggle{font-size:16px;transition:transform .2s;color:#6B7280;margin-left:8px}\n' +
'html.mob .hot-team-section.collapsed .hot-team-toggle{transform:rotate(-90deg)}\n' +
'html.mob .hot-team-body{padding:4px 8px 8px}\n' +
'html.mob .hot-team-section.collapsed .hot-team-body{display:none}\n' +
'html.mob .hot{padding:8px 10px;gap:8px;margin-bottom:6px}\n' +
'html.mob .hot-title{font-size:12px}\n' +
'html.mob .hot-sub{font-size:10px}\n' +
'html.mob .hot-badge{font-size:10px;padding:2px 7px}\n' +
'html.mob .bar{grid-template-columns:100px 1fr 32px;font-size:13px;gap:8px;margin-bottom:10px}\n' +
'html.mob .bar-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n' +
/* v2.8.1: Mobile polish — hot items + bar chart */
'html.mob .hot-item{border-left:3px solid #3B82F6!important;border-top:1px solid #1F2D45;border-right:1px solid #1F2D45;border-bottom:1px solid #1F2D45;border-radius:0 8px 8px 0;padding:10px 12px 10px 11px}\n' +
'html.mob .hot-item-title{font-size:13px;font-weight:600}\n' +
'html.mob .hot-item-badge.red{color:#FCA5A5}\n' +
'html.mob .hot-item-badge.yellow{color:#FDE68A}\n' +
'html.mob .bar-track{height:10px!important;border-radius:5px!important}\n' +
'html.mob .bar-fill{border-radius:5px!important}\n' +
/* v2.8.1: Mobile-only font override — Inter for mobile, PC keeps original */
'html.mob body,html.mob button,html.mob input,html.mob select{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}\n' +
/* v2.8.1: Bottom nav — native app feel, bigger & prominent */
'html.mob .mnb-ic{font-size:32px!important;margin-bottom:2px;line-height:1.1}\n' +
'html.mob .mnb-lbl{font-size:11px!important;font-weight:700;letter-spacing:0.4px}\n' +
'html.mob .mnb{min-height:54px!important;padding:10px 4px!important;gap:4px!important}\n' +
'html.mob #mob-nav{min-height:70px;padding:6px 4px max(20px,env(safe-area-inset-bottom))!important}\n' +
/* v2.8.1: KPI cards — spacious, readable */
'html.mob .card{padding:16px 14px;border-radius:10px}\n' +
'html.mob .card h3{font-size:12.5px;letter-spacing:0.8px;margin-bottom:10px}\n' +
'html.mob .card .big{font-size:36px!important;margin-bottom:10px;line-height:1.1}\n' +
/* v2.8.1: Section headers — prominent */
'html.mob .sh{font-size:15px;font-weight:700;margin:20px 0 10px;letter-spacing:0.4px}\n' +
/* v2.8.1: Hot items — readable text sizes */
'html.mob .hot-item-title{font-size:14px!important;font-weight:700;line-height:1.4}\n' +
'html.mob .hot-item-sub{font-size:12px!important;line-height:1.5}\n' +
'html.mob .hot-item-detail{font-size:12px!important;line-height:1.5}\n' +
'html.mob .hot-item-badge{font-size:11px!important;padding:3px 10px!important}\n' +
'html.mob .hot-item-cb{font-size:12px}\n' +
/* v2.8.1: Bar chart — readable labels */
'html.mob .bar{margin-bottom:10px;gap:8px}\n' +
'html.mob .bar-name{font-size:12.5px!important}\n' +
'html.mob .bar-val{font-size:12.5px!important;font-weight:700}\n' +
/* v2.8: Mobile header — single-row layout */
'html.mob .search-wrap{display:none}\n' +
'html.mob .search-wrap.mob-open{display:block;position:fixed;top:0;left:0;right:0;z-index:600;padding:8px 12px;background:#0F1B2D;border-bottom:1px solid #1E3A5F}\n' +
'html.mob .search-wrap.mob-open #search{width:100%;font-size:14px;padding:8px 12px}\n' +
'html.mob #btn-search-mob{display:flex;align-items:center;justify-content:center;background:none;border:1px solid #2D3D5C;border-radius:6px;color:#9CA3AF;cursor:pointer;padding:5px 8px;font-size:17px}\n' +
'#btn-search-mob{display:none}\n' +
'html.mob .status-row{gap:6px}\n' +
'html.mob #clock{font-size:12px;font-weight:600;color:#E5E7EB}\n' +
/* v2.8: @media fallback — bảo đảm mobile layout ngay cả khi html.mob class bị GAS reset */
'@media screen and (max-width:768px){\n' +
'  nav.tabs{display:none!important}\n' +
'  #mob-nav{display:flex!important}\n' +
'  .search-wrap{display:none!important}\n' +
'  #btn-email{display:none!important}\n' +
'  #updated{display:none!important}\n' +
'  main{padding:12px 12px 72px!important}\n' +
'  .kpi-grid{grid-template-columns:repeat(2,1fr)!important}\n' +
'  .brand small{display:none!important}\n' +
'  .chain-flow{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:4px!important}\n' +
'  .chain-flow .arrow{transform:rotate(90deg);text-align:center;margin:4px 0}\n' +
'}\n' +
/* v2.8.1: Landscape orientation support for mobile */
'@media screen and (orientation:landscape) and (max-height:500px){\n' +
'  html.mob main{padding:8px 16px 56px!important}\n' +
'  html.mob .kpi-grid{grid-template-columns:repeat(4,1fr)!important}\n' +
'  html.mob #mob-nav{min-height:50px!important;padding:4px 4px max(8px,env(safe-area-inset-bottom))!important}\n' +
'  html.mob .mnb{min-height:40px!important;padding:5px 4px!important}\n' +
'  html.mob .mnb-ic{font-size:22px!important}\n' +
'  html.mob .mnb-lbl{font-size:9px!important}\n' +
'}\n' +
'  /* v2.10: Report Tab Styles */\n' +
'  .report-container { display: flex; gap: 20px; height: calc(100vh - 180px); }\n' +
'  .report-sidebar { width: 300px; background: rgba(31, 45, 69, 0.4); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 20px; border: 1px solid rgba(255,255,255,0.05); }\n' +
'  .report-menu { list-style: none; }\n' +
'  .report-menu-item { padding: 12px 15px; border-radius: 8px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px; margin-bottom: 5px; color: #9CA3AF; }\n' +
'  .report-menu-item:hover { background: rgba(255,255,255,0.05); color: white; }\n' +
'  .report-menu-item.active { background: #3B82F6; color: white; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }\n' +
'  .report-filters { background: rgba(15,27,45,0.4); padding: 15px; border-radius: 8px; font-size: 13px; }\n' +
'  .report-filter-group { margin-bottom: 12px; }\n' +
'  .report-filter-group label { display: block; margin-bottom: 5px; color: #9CA3AF; }\n' +
'  .report-content { flex: 1; display: flex; flex-direction: column; gap: 15px; }\n' +
'  .report-actions { display: flex; gap: 10px; justify-content: flex-end; background: rgba(31, 45, 69, 0.4); padding: 10px 20px; border-radius: 10px; }\n' +
'  .report-preview { flex: 1; background: white; border-radius: 8px; overflow-y: auto; padding: 0; border: 1px solid rgba(255,255,255,0.1); position: relative; color: #333; }\n' +
'  .report-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 60px; color: rgba(0,0,0,0.03); pointer-events: none; white-space: nowrap; font-weight: 900; }\n' +
'</style></head><body>\n' +
'<header id="app-header">\n' +
'  <div class="brand-row">\n' +
'    <div class="brand">DASHBOARD GIAO BAN — PHÒNG VT-TBYT<small>Bệnh viện K — 4 tổ: Kỹ thuật / Hồ sơ / Vật tư / Kho · v2.9 · Reports & Performance</small></div>\n' +
'    <div class="search-wrap"><input id="search" type="text" placeholder="🔍 Tìm máy / vật tư / hồ sơ…" autocomplete="off"><div id="search-results"></div></div>\n' +
'    <div class="status-row">\n' +
'      <span class="live"><span class="live-dot"></span>LIVE</span>\n' +
'      <span id="clock">--:--:--</span>\n' +
'      <span id="updated">Cập nhật: —</span>\n' +
'      <button id="btn-search-mob" title="Tìm kiếm">🔍</button>\n' +
'      <button id="btn-refresh" class="btn btn-secondary" title="Làm mới cache nếu vừa sửa Sheet">🔄 Refresh</button>\n' +
'      <button id="btn-email" class="btn btn-secondary" title="Gửi email báo cáo giao ban ngay cho danh sách trong cfg_emails">📧 Gửi email</button>\n' +
'    </div>\n' +
'  </div>\n' +
'  <nav class="tabs" id="tabs">\n' +
'    <button data-view="overview" class="active">🏠 Tổng quan</button>\n' +
'    <button data-view="kt">🔧 Kỹ thuật</button>\n' +
'    <button data-view="hs">📁 Hồ sơ</button>\n' +
'    <button data-view="vt">🧪 VTTH</button>\n' +
'    <button data-view="kho">📦 Kho</button>\n' +
'    <button data-view="khoa">🏥 Theo Khoa</button>\n' +
'    <button data-view="lienket">🔗 Liên kết</button>\n' +
'    <button data-view="baocao">📊 Báo cáo</button>\n' +
'  </nav>\n' +
'</header>\n' +
'<main>\n' +
'  <section id="view-overview" class="view active"><div class="loading">Đang tải tổng quan…</div></section>\n' +
'  <section id="view-kt" class="view"><div class="loading">Đang tải kỹ thuật…</div></section>\n' +
'  <section id="view-hs" class="view"><div class="loading">Đang tải hồ sơ…</div></section>\n' +
'  <section id="view-vt" class="view"><div class="loading">Đang tải vật tư…</div></section>\n' +
'  <section id="view-kho" class="view"><div class="loading">Đang tải kho…</div></section>\n' +
'  <section id="view-khoa" class="view"><div class="loading">Đang tải theo khoa…</div></section>\n' +
'  <section id="view-lienket" class="view"><div class="loading">Đang tải liên kết…</div></section>\n' +
'  <section id="view-baocao" class="view"></section>\n' +
'</main>\n' +
/* v2.8: Mobile bottom nav — more menu OUTSIDE button (fix invalid HTML) */
'<div id="mob-more-menu">\n' +
'  <button class="mnb-extra" data-view="vt">🧪 VTTH</button>\n' +
'  <button class="mnb-extra" data-view="khoa">🏥 Theo Khoa</button>\n' +
'  <button class="mnb-extra" data-view="lienket">🔗 Liên kết</button>\n' +
'  <button class="mnb-extra" data-view="baocao">📊 Báo cáo</button>\n' +
'</div>\n' +
'<nav id="mob-nav">\n' +
'  <button class="mnb active" data-view="overview"><span class="mnb-ic">🏠</span><span class="mnb-lbl">Tổng quan</span></button>\n' +
'  <button class="mnb" data-view="kt"><span class="mnb-ic">🔧</span><span class="mnb-lbl">Kỹ thuật</span></button>\n' +
'  <button class="mnb" data-view="hs"><span class="mnb-ic">📁</span><span class="mnb-lbl">Hồ sơ</span></button>\n' +
'  <button class="mnb" data-view="kho"><span class="mnb-ic">📦</span><span class="mnb-lbl">Kho</span></button>\n' +
'  <button class="mnb" id="mnb-more"><span class="mnb-ic">⋯</span><span class="mnb-lbl">Thêm</span></button>\n' +
'</nav>\n' +

'<div id="modal" class="modal-backdrop">\n' +
'  <div class="modal" role="dialog">\n' +
'    <div class="modal-header">\n' +
'      <div class="modal-title" id="modal-title"></div>\n' +
'      <div class="modal-actions" id="modal-actions"></div>\n' +
'    </div>\n' +
'    <div class="modal-body" id="modal-body"></div>\n' +
'    <div class="modal-meta" id="modal-meta"></div>\n' +
'  </div>\n' +
'</div>\n' +
'<script>\n' +
'(function(){\n' +
'var STATE = { sheetUrl: "", currentView: "overview", overview: null, kt: null, hs: null, vt: null, kho: null, khoa: null };\n' +
'var TAB_NAME = { KT:"Nhóm kỹ thuật", VT:"Nhóm vật tư tiêu hao- hóa chất", HS:"Nhóm Hồ sơ", KHO_5A:"5A. Tổ kho - Tồn", KHO_5B:"5B. Tổ kho - Đề xuất" };\n' +
'function $(s,p){return (p||document).querySelector(s);} \n' +
'function $$(s,p){return Array.from((p||document).querySelectorAll(s));}\n' +
'function esc(s){if(s===null||s===undefined)return"";return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c];});}\n' +
'function fmtVnd(n){if(!n||isNaN(n))return"";if(n>=1e9)return(n/1e9).toFixed(2)+" tỷ";if(n>=1e6)return(n/1e6).toFixed(1)+" tr";return n.toLocaleString("vi-VN");}\n' +
'function deepLink(gid,row){return STATE.sheetUrl + "/edit#gid=" + gid + "&range=A" + row;}\n' +
'function openRow(gid,row){if(gid&&row)window.open(deepLink(gid,row),"_blank");}\n' +
/* v2.3 — open detail modal */
'function openDetail(type,id){\n' +
'  if(\!type||\!id)return;\n' +
'  $("#modal").classList.add("show");\n' +
'  $("#modal-body").innerHTML="<div class=\\"loading\\" style=\\"padding:40px\\">Đang tải chi tiết…</div>";\n' +
'  $("#modal-title").innerHTML="<span class=\\"badge "+esc(type)+"\\">"+esc(type)+"</span><h2>"+esc(id)+"</h2>";\n' +
'  $("#modal-actions").innerHTML="<button class=\\"btn btn-close\\" onclick=\\"document.getElementById(\'modal\').classList.remove(\'show\')\\">Đóng (Esc)</button>";\n' +
'  google.script.run.withSuccessHandler(renderDetail).withFailureHandler(showErr).getDetail(type,id);\n' +
'}\n' +
'function renderDetail(d){\n' +
'  if(d.error){$("#modal-body").innerHTML="<div class=\\"error\\" style=\\"margin:20px\\">"+esc(d.error)+"</div>";return;}\n' +
'  var me=d.me;\n' +
'  var typeLabel={KT:"Thiết bị",VT:"Vật tư",HS:"Hồ sơ"}[d.type]||d.type;\n' +
'  $("#modal-title").innerHTML="<span class=\\"badge "+esc(d.type)+"\\">"+esc(typeLabel)+(me.ma?" — "+esc(me.ma):"")+"</span><h2>"+esc(me.ten||me.noiDung||"(không tên)")+"</h2>";\n' +
'  var openLink=d.sheetUrl+"/edit#gid="+(me.gid||"")+"&range=A"+(me.rowNum||"");\n' +
'  $("#modal-actions").innerHTML="<a href=\\""+openLink+"\\" target=\\"_blank\\" class=\\"btn\\">↗ Mở Sheet</a> <button class=\\"btn btn-close\\" onclick=\\"document.getElementById(\'modal\').classList.remove(\'show\')\\">Đóng</button>";\n' +
/* v2.3+ kho renderer */
'function khoSeverity(stock){\n' +
'  if(\!stock||\!stock.tt)return"gray";\n' +
'  var t=String(stock.tt);\n' +
'  if(t.indexOf("ĐỎ")>=0)return"red";\n' +
'  if(t.indexOf("VÀNG")>=0)return"yellow";\n' +
'  if(t.indexOf("XANH")>=0)return"green";\n' +
'  return"gray";\n' +
'}\n' +
'function renderKhoCard(kho){\n' +
'  if(\!kho||(\!kho.stock&&(\!kho.queue||\!kho.queue.length)))return"";\n' +
'  var html="<div class=\\"kho-card\\">";\n' +
'  if(kho.stock){\n' +
'    var sev=khoSeverity(kho.stock);\n' +
'    var ton=kho.stock.ton===""||kho.stock.ton===null?"-":esc(kho.stock.ton);\n' +
'    var doh=kho.stock.doh===""||kho.stock.doh===null?"-":esc(kho.stock.doh);\n' +
'    html+="<div class=\\"kho-h\\">📦 Kho: <span class=\\"stock-pill "+sev+"\\">"+esc(kho.stock.tt||"-")+"</span></div>";\n' +
'    html+="<div class=\\"kho-stat\\">Tồn: <b style=\\"color:#fff\\">"+ton+"</b> · DOH: <b style=\\"color:#fff\\">"+doh+"</b> ngày";\n' +
'    if(kho.stock.khoamax)html+=" · Khoa YC nhiều nhất: <b style=\\"color:#fff\\">"+esc(kho.stock.khoamax)+"</b>";\n' +
'    if(kho.stock.sokhoa)html+=" · "+esc(kho.stock.sokhoa)+" khoa đang chờ";\n' +
'    html+="</div>";\n' +
'    if(kho.stock.dexuat)html+="<div class=\\"kho-stat\\" style=\\"margin-top:4px;color:#FBBF24\\">→ "+esc(kho.stock.dexuat)+"</div>";\n' +
'  } else {\n' +
'    html+="<div class=\\"kho-h\\" style=\\"color:#9CA3AF\\">📦 Kho: <span class=\\"stock-pill gray\\">không khớp 5A</span></div>";\n' +
'  }\n' +
'  if(kho.queue&&kho.queue.length){\n' +
'    var open=kho.queue.filter(function(q){return(q.tt||"").indexOf("Đã cấp đủ")<0;}).length;\n' +
'    html+="<div class=\\"kho-queue\\"><div style=\\"color:#9CA3AF;margin-bottom:3px\\">Đề xuất 5B ("+open+" chưa xong / "+kho.queue.length+" tổng):</div>";\n' +
'    kho.queue.slice(0,5).forEach(function(q){\n' +
'      var done=(q.tt||"").indexOf("Đã cấp đủ")>=0;\n' +
'      html+="<div class=\\"kho-queue-item\\"><span class=\\"khn\\">"+esc(q.khoa||"?")+"</span><span>"+esc(q.sl||"")+" "+esc(q.dv||"")+" · "+esc(q.ngayYC||"-")+" · <span style=\\"color:"+(done?"#10B981":"#FBBF24")+"\\">"+esc(q.tt||"chưa xử lý")+"</span></span></div>";\n' +
'    });\n' +
'    html+="</div>";\n' +
'  }\n' +
'  html+="</div>";\n' +
'  return html;\n' +
'}\n' +
'function khoMini(kho){\n' +
'  if(\!kho)return"";\n' +
'  var bits=[];\n' +
'  if(kho.stock){var sev=khoSeverity(kho.stock);bits.push("<span class=\\"mini-pill stock-pill "+sev+"\\">📦 "+esc(kho.stock.tt||"?")+"</span>");}\n' +
'  if(kho.queue&&kho.queue.length){var open=kho.queue.filter(function(q){return(q.tt||"").indexOf("Đã cấp đủ")<0;}).length;if(open)bits.push("<span class=\\"mini-pill stock-pill orange\\">"+open+" khoa chờ</span>");}\n' +
'  return bits.length?"<div class=\\"kho-mini\\">"+bits.join("")+"</div>":"";\n' +
'}\n' +
'  function renderEntCard(e,fuzzy){\n' +
'    var o=e.obj?e.obj:e;var f=e.fuzzy\!==undefined?e.fuzzy:fuzzy;\n' +
'    var badge=f?"<span class=\\"fuzzy-badge\\">🔍 đoán</span>":"<span class=\\"manual-badge\\">🔗 link</span>";\n' +
'    var html="<div class=\\"entity-card\\" data-type=\\""+esc(o.type)+"\\" data-id=\\""+esc(o.ma||o.ten)+"\\">";\n' +
'    html+="<div class=\\"name\\">"+esc(o.ten||o.noiDung||"(?)")+badge+"</div>";\n' +
'    html+="<div class=\\"meta\\">";\n' +
'    if(o.ma)html+="<span class=\\"lbl\\">Mã:</span> "+esc(o.ma)+" · ";\n' +
'    if(o.khoa)html+="<span class=\\"lbl\\">Khoa:</span> "+esc(o.khoa)+"<br>";\n' +
'    if(o.tinh)html+="<span class=\\"lbl\\">Tình trạng:</span> "+esc(o.tinh)+"<br>";\n' +
'    if(o.tt)html+="<span class=\\"lbl\\">Trạng thái:</span> "+esc(o.tt)+"<br>";\n' +
'    if(o.cb)html+="<span class=\\"lbl\\">CB:</span> "+esc(o.cb)+"<br>";\n' +
'    if(o.vuong)html+="<div class=\\"alert-box red\\" style=\\"padding:8px;font-size:11px;margin-top:8px\\">⚠ <b>Vướng:</b> "+esc(String(o.vuong).substring(0,80))+"</div>";\n' +
'    html+="</div></div>";\n' +
'    if(e&&e.kho)html=html.slice(0,-12)+renderKhoCard(e.kho)+"</div></div>";\n' +
'    return html;\n' +
'  }\n' +
'  var html="<div class=\\"modal-layout\\">";\n' +
'  /* THIS entity card */\n' +
'  html+="<div class=\\"modal-main\\"><h3>📍 "+esc(typeLabel)+" này</h3>";\n' +
'  html+="<div class=\\"entity-card\\" style=\\"cursor:default;border-color:#3B82F6;background:rgba(59,130,246,0.05)\\">";\n' +
'  html+="<div class=\\"name\\" style=\\"font-size:16px;margin-bottom:12px\\">"+esc(me.ten||me.noiDung||"(?)")+"</div><div class=\\"meta\\" style=\\"font-size:13px;line-height:1.6\\">";\n' +
'  if(me.ma)html+="<span class=\\"lbl\\">Mã:</span> <b style=\\"color:#fff\\">"+esc(me.ma)+"</b><br>";\n' +
'  if(me.khoa)html+="<span class=\\"lbl\\">Khoa:</span> "+esc(me.khoa)+"<br>";\n' +
'  if(me.tinh){\n' +
'    var tNorm = (me.tinh||"").toLowerCase();\n' +
'    var pill = tNorm.indexOf("đang sửa")>=0?"yellow":tNorm.indexOf("thanh lý")>=0?"gray":tNorm.indexOf("vướng")>=0?"orange":"blue";\n' +
'    html+="<span class=\\"lbl\\">Tình trạng:</span> <span class=\\"stock-pill "+pill+"\\" style=\\"display:inline-block;margin-bottom:4px\\">"+esc(me.tinh)+"</span><br>";\n' +
'  }\n' +
'  if(me.chiTiet)html+="<span class=\\"lbl\\">Chi tiết:</span> "+esc(me.chiTiet)+"<br>";\n' +
'  if(me.tt){\n' +
'    var ttNorm = (me.tt||"").toLowerCase();\n' +
'    var ttPill = ttNorm.indexOf("đã cấp đủ")>=0?"green":ttNorm.indexOf("chưa xử lý")>=0?"red":"orange";\n' +
'    html+="<span class=\\"lbl\\">Trạng thái:</span> <span class=\\"stock-pill "+ttPill+"\\" style=\\"display:inline-block;margin-bottom:4px\\">"+esc(me.tt)+"</span><br>";\n' +
'  }\n' +
'  if(me.pct !== undefined && me.pct !== "")html+="<span class=\\"lbl\\">Tiến độ:</span> <b style=\\"color:#60A5FA\\">"+(String(me.pct).indexOf(\'%\')<0 ? esc(me.pct)+"%" : esc(me.pct))+"</b><br>";\n' +
'  if(me.cb)html+="<span class=\\"lbl\\">CB phụ trách:</span> <b style=\\"color:#E5E7EB\\">"+esc(me.cb)+"</b><br>";\n' +
'  if(me.giaTri)html+="<span class=\\"lbl\\">Giá trị:</span> <b style=\\"color:#10B981\\">"+fmtVnd(me.giaTri)+" VND</b><br>";\n' +
'  html+="</div>";\n' +
'  if(me.vuong)html+="<div class=\\"alert-box red\\">⚠ <b>Vướng mắc:</b><br>"+esc(me.vuong)+"</div>";\n' +
'  if(d.type==="VT"){\n' +
'    if(d.kho)html+=renderKhoCard(d.kho);\n' +
'    if(d.relatedKho && d.relatedKho.length){\n' +
'      html+="<div class=\\"related-kho-section\\" style=\\"margin-top:16px\\"><h4>📦 Kho liên quan (gợi ý match)</h4>";\n' +
'      d.relatedKho.forEach(function(rk){\n' +
'        var sev=khoSeverity(rk);\n' +
'        html+="<div class=\\"entity-card\\" onclick=\\"openGenericRow(\'5A. Tổ kho - Tồn\',\'"+rk.gid+"\',\'"+rk.rowNum+"\',\'"+esc(rk.ten)+"\')\\">";\n' +
'        html+="<div class=\\"name\\">"+esc(rk.ten)+" <span class=\\"stock-pill "+sev+"\\">"+esc(rk.tt||"?")+"</span></div>";\n' +
'        html+="<div class=\\"meta\\">Tồn: "+esc(rk.ton||"-")+" · DOH: "+esc(rk.doh||"-")+"</div></div>";\n' +
'      });\n' +
'      html+="</div>";\n' +
'    }\n' +
'  }\n' +
'  html+="</div>";\n' +
'  html+="</div>"; // Close modal-main\n' +
'  /* Other 2 cols depending on type */\n' +
'  html+="<div class=\\"modal-side\\">";\n' +
'  if(d.type==="KT"){\n' +
'    html+="<div><h3>🧪 Vật tư liên quan <span class=\\"count\\">"+(d.vt||[]).length+"</span></h3>";\n' +
'    if(\!(d.vt||[]).length)html+="<div class=\\"empty-box\\">Không tìm thấy vật tư liên quan</div>";\n' +
'    (d.vt||[]).forEach(function(e){html+=renderEntCard(e);});\n' +
'    html+="</div>";\n' +
'    html+="<div><h3>📁 Hồ sơ / Gói thầu liên quan <span class=\\"count\\">"+(d.hs||[]).length+"</span></h3>";\n' +
'    if(\!(d.hs||[]).length)html+="<div class=\\"empty-box\\">Không tìm thấy hồ sơ liên quan</div>";\n' +
'    (d.hs||[]).forEach(function(e){html+=renderEntCard(e);});\n' +
'    html+="</div>";\n' +
'  } else if(d.type==="VT"){\n' +
'    html+="<div><h3>🔧 Thiết bị dùng <span class=\\"count\\">"+(d.kt||[]).length+"</span></h3>";\n' +
'    if(\!(d.kt||[]).length)html+="<div class=\\"empty-box\\">Không có thiết bị nào liên kết</div>";\n' +
'    (d.kt||[]).forEach(function(e){html+=renderEntCard(e);});\n' +
'    html+="</div>";\n' +
'    html+="<div><h3>📁 Đang trong gói thầu <span class=\\"count\\">"+(d.hs||[]).length+"</span></h3>";\n' +
'    if(\!(d.hs||[]).length)html+="<div class=\\"empty-box\\">Chưa link với gói thầu nào</div>";\n' +
'    (d.hs||[]).forEach(function(e){html+=renderEntCard(e);});\n' +
'    html+="</div>";\n' +
'  } else if(d.type==="HS"){\n' +
'    html+="<div><h3>🔧 Thiết bị bị ảnh hưởng <span class=\\"count\\">"+(d.kt||[]).length+"</span></h3>";\n' +
'    if(\!(d.kt||[]).length)html+="<div class=\\"empty-box\\">Không có thiết bị bị ảnh hưởng</div>";\n' +
'    (d.kt||[]).forEach(function(e){html+=renderEntCard(e);});\n' +
'    html+="</div>";\n' +
'    html+="<div><h3>🧪 Vật tư trong gói <span class=\\"count\\">"+(d.vt||[]).length+"</span></h3>";\n' +
'    if(\!(d.vt||[]).length)html+="<div class=\\"empty-box\\">Chưa link với vật tư cụ thể</div>";\n' +
'    (d.vt||[]).forEach(function(e){html+=renderEntCard(e);});\n' +
'    html+="</div>";\n' +
'  }\n' +
'  html+="</div></div>";\n' +
'  $("#modal-body").innerHTML=html;\n' +
'  $("#modal-meta").innerHTML="<div class=\\"row-info\\"><div><strong>Hàng:</strong> "+esc(me.rowNum||"-")+" — Click \\"↗ Mở Sheet\\" để vào sửa trực tiếp</div><div><strong>Hint:</strong> Click vào ô bên cạnh để khám phá chuỗi liên kết.</div></div>";\n' +
'  $$("#modal-body .entity-card[data-type]").forEach(function(el){el.onclick=function(){openDetail(el.dataset.type,el.dataset.id);};});\n' +
'}\n' +
/* Close modal on Esc + click backdrop */
'document.addEventListener("keydown",function(e){if(e.key==="Escape")$("#modal").classList.remove("show");});\n' +
'$("#modal").onclick=function(e){if(e.target===this)this.classList.remove("show");};\n' +
/* v2.4 — In-app generic row modal (for Kho 5A/5B & generic fallback) */
'function openGenericRow(tab,gid,rowIdx,title){\n' +
'  if(\!tab||\!rowIdx)return;\n' +
'  $("#modal").classList.add("show");\n' +
'  $("#modal-title").innerHTML="<span class=\\"badge\\" style=\\"background:#374151;color:#D1D5DB\\">📄 Hàng</span><h2>"+esc(title||tab)+"</h2>";\n' +
'  $("#modal-body").innerHTML="<div class=\\"loading\\" style=\\"padding:40px\\">Đang tải hàng…</div>";\n' +
'  $("#modal-actions").innerHTML="<button class=\\"btn btn-close\\" onclick=\\"document.getElementById(\'modal\').classList.remove(\'show\')\\">Đóng (Esc)</button>";\n' +
'  $("#modal-meta").innerHTML="";\n' +
'  google.script.run.withSuccessHandler(function(d){\n' +
'    if(d.error){$("#modal-body").innerHTML="<div class=\\"error\\" style=\\"margin:20px\\">"+esc(d.error)+"</div>";return;}\n' +
'    var html="<div class=\\"kv-list\\">";\n' +
'    d.fields.forEach(function(f){\n' +
'      var v=f.val===""?"<span class=\\"empty\\">(trống)</span>":esc(f.val);\n' +
'      html+="<div class=\\"k\\">"+esc(f.key)+"</div><div class=\\"v\\">"+v+"</div>";\n' +
'    });\n' +
'    html+="</div>";\n' +
'    $("#modal-body").innerHTML=html;\n' +
'    var openLink=d.sheetUrl+"/edit#gid="+(d.gid||"")+"&range=A"+(d.rowIdx||"");\n' +
'    $("#modal-actions").innerHTML="<a href=\\""+openLink+"\\" target=\\"_blank\\" class=\\"btn btn-secondary\\" title=\\"Mở Sheet để sửa\\">↗ Sửa trên Sheet</a> <button class=\\"btn btn-close\\" onclick=\\"document.getElementById(\'modal\').classList.remove(\'show\')\\">Đóng</button>";\n' +
'    $("#modal-meta").innerHTML="<div class=\\"row-info\\"><div><strong>Tab:</strong> "+esc(d.tab)+" · <strong>Hàng:</strong> "+esc(d.rowIdx)+"</div><div><strong>Tip:</strong> Click \\"↗ Sửa trên Sheet\\" chỉ khi cần sửa nhanh.</div></div>";\n' +
'  }).withFailureHandler(function(err){$("#modal-body").innerHTML="<div class=\\"error\\" style=\\"margin:20px\\">⚠ Lỗi tải hàng: "+esc(err && err.message || err)+"</div>";}).getRowDetail(tab,parseInt(rowIdx,10));\n' +
'}\n' +
/* v2.4 — In-app Khoa Detail modal (lãnh đạo 360° cho 1 khoa) */
'function openKhoaModal(khoaName, coso){\n' +
'  if(\!khoaName)return;\n' +
'  $("#modal").classList.add("show");\n' +
'  $("#modal-title").innerHTML="<span class=\\"badge\\" style=\\"background:#0E7490;color:#A5F3FC\\">🏥 Khoa</span><h2>"+esc(khoaName)+"</h2>";\n' +
'  $("#modal-body").innerHTML="<div class=\\"loading\\" style=\\"padding:40px\\">Đang tải toàn cảnh khoa "+esc(khoaName)+"…</div>";\n' +
'  $("#modal-actions").innerHTML="<button class=\\"btn btn-close\\" onclick=\\"document.getElementById(\'modal\').classList.remove(\'show\')\\">Đóng (Esc)</button>";\n' +
'  $("#modal-meta").innerHTML="";\n' +
'  google.script.run.withSuccessHandler(function(d){\n' +
'    if(d.error){$("#modal-body").innerHTML="<div class=\\"error\\" style=\\"margin:20px\\">"+esc(d.error)+"</div>";return;}\n' +
'    var s=d.summary||{totalKT:0,totalHS:0,totalVT:0,totalKho:0,doneKT:0,doneHS:0};\n' +
'    var html="<div class=\\"khoa-modal-wrap\\">";\n' +
'    html+="<div class=\\"khoa-modal-summary\\">";\n' +
'    html+="<div class=\\"khoa-modal-stat\\"><div class=\\"k\\">🔧 Máy hỏng</div><div class=\\"v\\"><span style=\\"color:#10B981\\">"+s.doneKT+"</span><span style=\\"font-size:18px;color:#6B7280;margin:0 3px;font-weight:400\\">/</span><span style=\\"color:"+(s.totalKT>0?"#EF4444":"#9CA3AF")+"\\">"+s.totalKT+"</span></div><div style=\\"font-size:10px;color:#9CA3AF\\">đã xong / tổng máy</div></div>";\n' +
'    html+="<div class=\\"khoa-modal-stat\\"><div class=\\"k\\">📁 Hồ sơ</div><div class=\\"v\\"><span style=\\"color:#10B981\\">"+s.doneHS+"</span><span style=\\"font-size:18px;color:#6B7280;margin:0 3px;font-weight:400\\">/</span><span style=\\"color:"+(s.totalHS>0?"#F59E0B":"#9CA3AF")+"\\">"+s.totalHS+"</span></div><div style=\\"font-size:10px;color:#9CA3AF\\">đã xong / tổng hồ sơ</div></div>";\n' +
'    html+="<div class=\\"khoa-modal-stat\\"><div class=\\"k\\">🧪 VT/HC</div><div class=\\"v\\">"+s.totalVT+"</div></div>";\n' +
'    html+="<div class=\\"khoa-modal-stat\\"><div class=\\"k\\">📦 YC kho</div><div class=\\"v\\">"+s.totalKho+"</div></div>";\n' +
'    html+="</div>";\n' +
/* KT */
'    html+="<div class=\\"khoa-modal-section\\"><h3>🔧 Thiết bị đang vướng <span class=\\"count\\">"+(d.kt||[]).length+"</span></h3>";\n' +
'    if(\!(d.kt||[]).length)html+="<div class=\\"empty\\">Không có thiết bị vướng mắc.</div>";\n' +
'    else{\n' +
'      html+="<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Tên máy</th><th>Tình trạng</th><th>Chi tiết</th><th>CB</th><th>Deadline</th><th>HT</th></tr></thead><tbody>";\n' +
'      d.kt.forEach(function(r){\n' +
'        var pill=r.tinh && r.tinh.toLowerCase().indexOf("đang sửa")>=0?"yellow":r.tinh && r.tinh.toLowerCase().indexOf("thanh lý")>=0?"gray":"blue";\n' +
'        html+="<tr data-kt-id=\\""+esc(r.ten)+"\\" style=\\"cursor:pointer\\">";\n' +
'        html+="<td><b>"+esc(r.ten)+"</b></td>";\n' +
'        html+="<td><span class=\\"pill "+pill+"\\">"+esc(r.tinh||"-")+"</span></td>";\n' +
'        html+="<td style=\\"max-width:280px;font-size:12px\\">"+esc(r.ct||"")+"</td>";\n' +
'        html+="<td style=\\"font-size:12px\\">"+esc(r.cb||"")+"</td>";\n' +
'        html+="<td style=\\"font-size:11px\\">"+esc(r.dl||"")+"</td>";\n' +
'        html+="<td>"+(r.ht?"✓":"⏳")+"</td></tr>";\n' +
'      });\n' +
'      html+="</tbody></table></div>";\n' +
'    }\n' +
'    html+="</div>";\n' +
/* HS */
'    html+="<div class=\\"khoa-modal-section\\"><h3>📁 Gói thầu / Hồ sơ <span class=\\"count\\">"+(d.hs||[]).length+"</span></h3>";\n' +
'    if(\!(d.hs||[]).length)html+="<div class=\\"empty\\">Không có hồ sơ nào.</div>";\n' +
'    else{\n' +
'      html+="<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Mã HS</th><th>Nội dung</th><th>Trạng thái</th><th>%</th><th>CB</th><th>Deadline</th><th>HT</th></tr></thead><tbody>";\n' +
'      d.hs.forEach(function(r){\n' +
'        html+="<tr data-hs-id=\\""+esc(r.ma||r.nd)+"\\" style=\\"cursor:pointer\\">";\n' +
'        html+="<td><b style=\\"color:#60A5FA\\">"+esc(r.ma||"")+"</b></td>";\n' +
'        html+="<td style=\\"max-width:340px;font-size:12px\\">"+esc(r.nd||"")+"</td>";\n' +
'        html+="<td><span class=\\"pill blue\\">"+esc(r.tt||"-")+"</span></td>";\n' +
'        html+="<td class=\\"num\\">"+(r.pct\!==null && r.pct\!==undefined?r.pct+"%":"-")+"</td>";\n' +
'        html+="<td style=\\"font-size:12px\\">"+esc(r.cb||"")+"</td>";\n' +
'        html+="<td style=\\"font-size:11px\\">"+esc(r.dl||"")+"</td>";\n' +
'        html+="<td>"+(r.ht?"✓":"⏳")+"</td></tr>";\n' +
'      });\n' +
'      html+="</tbody></table></div>";\n' +
'    }\n' +
'    html+="</div>";\n' +
/* VT */
'    html+="<div class=\\"khoa-modal-section\\"><h3>🧪 Vật tư / Hóa chất <span class=\\"count\\">"+(d.vt||[]).length+"</span></h3>";\n' +
'    if(\!(d.vt||[]).length)html+="<div class=\\"empty\\">Không có task vật tư.</div>";\n' +
'    else{\n' +
'      html+="<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Loại</th><th>Trạng thái</th><th>%</th><th>CB</th><th>Deadline</th></tr></thead><tbody>";\n' +
'      d.vt.forEach(function(r){\n' +
'        html+="<tr data-vt-id=\\""+esc(r.loai)+"\\" style=\\"cursor:pointer\\">";\n' +
'        html+="<td><b>"+esc(r.loai||"")+"</b></td>";\n' +
'        html+="<td>"+esc(r.tt||"-")+"</td>";\n' +
'        html+="<td class=\\"num\\">"+(r.pct\!==null && r.pct\!==undefined?r.pct+"%":"-")+"</td>";\n' +
'        html+="<td style=\\"font-size:12px\\">"+esc(r.cb||"")+"</td>";\n' +
'        html+="<td style=\\"font-size:11px\\">"+esc(r.dl||"")+"</td></tr>";\n' +
'      });\n' +
'      html+="</tbody></table></div>";\n' +
'    }\n' +
'    html+="</div>";\n' +
/* Kho */
'    html+="<div class=\\"khoa-modal-section\\"><h3>📦 Yêu cầu kho <span class=\\"count\\">"+(d.kho||[]).length+"</span></h3>";\n' +
'    if(\!(d.kho||[]).length)html+="<div class=\\"empty\\">Không có YC kho.</div>";\n' +
'    else{\n' +
'      html+="<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Ngày YC</th><th>VTTH</th><th>SL</th><th>Ưu tiên</th><th>Trạng thái</th></tr></thead><tbody>";\n' +
'      d.kho.forEach(function(r){\n' +
'        var pillUT=r.ut && r.ut.indexOf("CAO")>=0?"red":"gray";\n' +
'        html+="<tr><td style=\\"font-size:11px\\">"+esc(r.ngay||"")+"</td>";\n' +
'        html+="<td><b>"+esc(r.vtth||"")+"</b></td>";\n' +
'        html+="<td class=\\"num\\">"+esc(r.sl||"")+"</td>";\n' +
'        html+="<td><span class=\\"pill "+pillUT+"\\">"+esc(r.ut||"-")+"</span></td>";\n' +
'        html+="<td>"+esc(r.tt||"")+"</td></tr>";\n' +
'      });\n' +
'      html+="</tbody></table></div>";\n' +
'    }\n' +
'    html+="</div>";\n' +
'    if(\!(d.kt||[]).length && \!(d.hs||[]).length && \!(d.vt||[]).length && \!(d.kho||[]).length){\n' +
'      html+="<div class=\\"empty\\" style=\\"margin-top:14px\\">✓ Khoa "+esc(khoaName)+" hiện không có vấn đề nào — tốt\!</div>";\n' +
'    }\n' +
'    html+="</div>";\n' +
'    $("#modal-body").innerHTML=html;\n' +
'    $("#modal-meta").innerHTML="<div class=\\"row-info\\"><div><strong>Tip:</strong> Click vào hàng máy/hồ sơ/vật tư để mở chi tiết 360°.</div></div>";\n' +
'    $$("#modal-body tr[data-kt-id]").forEach(function(tr){tr.onclick=function(){openDetail("KT",tr.dataset.ktId);};});\n' +
'    $$("#modal-body tr[data-hs-id]").forEach(function(tr){tr.onclick=function(){openDetail("HS",tr.dataset.hsId);};});\n' +
'    $$("#modal-body tr[data-vt-id]").forEach(function(tr){tr.onclick=function(){openDetail("VT",tr.dataset.vtId);};});\n' +
'  }).withFailureHandler(function(err){$("#modal-body").innerHTML="<div class=\\"error\\" style=\\"margin:20px\\">⚠ Lỗi tải khoa: "+esc(err && err.message || err)+"</div>";}).getByKhoa(khoaName, coso||"");\n' +
'}\n' +
/* v2.4 — Smart in-app row click router */
'function openInApp(el){\n' +
'  if(\!el)return;\n' +
'  var d=el.dataset;\n' +
'  if(d.type && d.id){openDetail(d.type,d.id);return;}\n' +
'  if(d.tab && d.row){openGenericRow(d.tab,d.gid,d.row,d.title||d.tab);return;}\n' +
'  if(d.gid && d.row){\n' +
'    /* legacy fallback — use overview tab name as best guess (kho 5A/5B handled elsewhere) */\n' +
'    openGenericRow("",d.gid,d.row,"Hàng");\n' +
'  }\n' +
'}\n' +
/* v2.3 — Search bar */
'(function(){var t,inp=$("#search"),box=$("#search-results");\n' +
'  if(\!inp)return;\n' +
'  inp.oninput=function(){clearTimeout(t);t=setTimeout(function(){\n' +
'    var q=inp.value.trim();if(q.length<2){box.classList.remove("show");return;}\n' +
'    google.script.run.withSuccessHandler(function(d){\n' +
'      if(\!d.results||\!d.results.length){box.innerHTML="<div class=\\"search-item\\">Không tìm thấy</div>";box.classList.add("show");return;}\n' +
'      var html="";d.results.forEach(function(r){html+="<div class=\\"search-item\\" data-type=\\""+esc(r.type)+"\\" data-id=\\""+esc(r.id)+"\\"><span class=\\"type "+esc(r.type)+"\\">"+esc(r.type)+"</span><span class=\\"label\\">"+esc(r.label)+"</span><div class=\\"sub\\">"+esc(r.sub)+"</div></div>";});\n' +
'      box.innerHTML=html;box.classList.add("show");\n' +
'      $$(".search-item[data-type]",box).forEach(function(el){el.onclick=function(){box.classList.remove("show");inp.value="";openDetail(el.dataset.type,el.dataset.id);};});\n' +
'    }).withFailureHandler(function(){box.classList.remove("show");}).searchAll(q);\n' +
'  },300);};\n' +
'  document.addEventListener("click",function(e){if(\!box.contains(e.target)&&e.target\!==inp)box.classList.remove("show");});\n' +
'})();\n' +
/* v2.3 — Liên kết view (chuỗi vướng mắc) */
'function renderLienket(d){\n' +
'  STATE.sheetUrl=d.sheetUrl||STATE.sheetUrl;\n' +
'  $("#updated").textContent="Cập nhật: "+d.updatedAt;\n' +
'  var hasMain=d.chains&&d.chains.length;\n' +
'  var hasKho=d.khoChains&&d.khoChains.length;\n' +
'  if(\!hasMain&&\!hasKho){$("#view-lienket").innerHTML="<div class=\\"empty\\">🎉 Không có chuỗi vướng mắc nào nghiêm trọng. Tất cả đang trong tầm kiểm soát.</div>";return;}\n' +
'  var html=hasMain?("<h2 style=\\"font-size:16px;color:#fff;margin-bottom:14px\\">🔗 Top "+d.chains.length+" chuỗi vướng mắc — sắp xếp theo độ ưu tiên</h2>"):"";\n' +
'  (d.chains||[]).forEach(function(ch){\n' +
'    var sev=ch.severity>=6?"red":ch.severity>=4?"orange":"yellow";\n' +
'    var sevLbl=sev==="red"?"NÓNG":sev==="orange"?"CAO":"VỪA";\n' +
'    var bgCls=sev==="red"?" chain-red":sev==="orange"?" chain-orange":"";\n' +
'    html+="<div class=\\"chain-row"+bgCls+"\\">";\n' +
'    html+="<div class=\\"chain-title\\"><span class=\\"severity "+sev+"\\">"+sevLbl+"</span>";\n' +
'    html+="<div style=\\"color:#fff;font-weight:600\\">"+esc(ch.kt.ten)+"</div>";\n' +
'    if(ch.daysLate)html+="<div style=\\"color:#F87171;font-size:11px\\">trễ "+ch.daysLate+" ngày</div>";\n' +
'    html+="</div>";\n' +
'    html+="<div class=\\"chain-flow\\">";\n' +
'    /* KT node */\n' +
'    html+="<div class=\\"chain-node\\" data-type=\\"KT\\" data-id=\\""+esc(ch.kt.ma||ch.kt.ten)+"\\"><div class=\\"nm\\">🔧 "+esc(ch.kt.ten)+"</div><div class=\\"sm\\">"+esc(ch.kt.khoa||"")+" · "+esc(ch.kt.tinh||"")+"</div></div>";\n' +
'    html+="<div class=\\"arrow\\">→</div>";\n' +
'    /* VT node(s) */\n' +
'    if(ch.vt&&ch.vt.length){\n' +
'      html+="<div>";ch.vt.forEach(function(v){html+="<div class=\\"chain-node\\" data-type=\\"VT\\" data-id=\\""+esc(v.ma||v.ten)+"\\" style=\\"margin-bottom:4px\\"><div class=\\"nm\\">🧪 "+esc(v.ten)+"</div><div class=\\"sm\\">"+esc(v.tt||"")+"</div>"+khoMini(v.kho)+"</div>";});html+="</div>";\n' +
'    } else { html+="<div class=\\"chain-node empty\\">không có vật tư link</div>"; }\n' +
'    html+="<div class=\\"arrow\\">→</div>";\n' +
'    /* HS node(s) */\n' +
'    if(ch.hs&&ch.hs.length){\n' +
'      html+="<div>";ch.hs.forEach(function(h){html+="<div class=\\"chain-node\\" data-type=\\"HS\\" data-id=\\""+esc(h.ma||h.ten)+"\\" style=\\"margin-bottom:4px\\"><div class=\\"nm\\">📁 "+esc(h.ma||h.ten)+"</div><div class=\\"sm\\">"+esc(h.tt||"")+"</div></div>";});html+="</div>";\n' +
'    } else { html+="<div class=\\"chain-node empty\\">không có gói thầu link</div>"; }\n' +
'    html+="</div></div>";\n' +
'  });\n' +
'  if(hasKho){\n' +
'    html+="<h2 style=\\"font-size:16px;color:#fff;margin:24px 0 14px\\">📦 Mạch Kho → Vật tư → Mua sắm ("+d.khoChains.length+") — kho cảnh báo cần truy nguồn</h2>";\n' +
'    d.khoChains.forEach(function(ch){\n' +
'      var sev=ch.severity>=8?"red":ch.severity>=5?"orange":"yellow";\n' +
'      var sevLbl=ch.isRed?"ĐỎ":sev==="orange"?"CAO":"VỪA";\n' +
'      var riskHtml = "";\n' +
'      if(ch.risk) riskHtml = "<span class=\\"risk-badge "+ch.risk.level+"\\">"+esc(ch.risk.msg)+"</span>";\n' +
'      var bgCls=sev==="red"?" chain-red":sev==="orange"?" chain-orange":"";\n' +
'      html+="<div class=\\"chain-row"+bgCls+"\\">";\n' +
'      html+="<div class=\\"chain-title\\"><span class=\\"severity "+sev+"\\">"+sevLbl+"</span>";\n' +
'      html+="<div style=\\"color:#fff;font-weight:600\\">📦 "+esc(ch.kho.ten||"?")+(ch.kho.ma?" ("+esc(ch.kho.ma)+")":"")+" "+riskHtml+"</div>";\n' +
'      var doh=ch.kho.doh;\n' +
'      if(doh\!==""&&doh\!==null&&doh\!==undefined)html+="<div style=\\"color:"+(Number(doh)<7?"#F87171":"#9CA3AF")+";font-size:11px\\">DOH: "+esc(doh)+" ngày</div>";\n' +
'      if(ch.queueOpen)html+="<div style=\\"color:#FBBF24;font-size:11px\\">"+ch.queueOpen+" khoa đang chờ</div>";\n' +
'      html+="</div>";\n' +
'      html+="<div class=\\"chain-flow\\">";\n' +
'      var khoOpenLink=STATE.sheetUrl+"/edit#gid="+(ch.kho.gid||"")+"&range=A"+(ch.kho.rowNum||"");\n' +
'      html+="<div class=\\"chain-node\\" data-href=\\""+khoOpenLink+"\\"><div class=\\"nm\\">📦 "+esc(ch.kho.ten)+"</div><div class=\\"sm\\">Tồn: "+esc(ch.kho.ton||"-")+" · "+esc(ch.kho.tt||"")+"</div>";\n' +
'      if(ch.kho.dexuat)html+="<div class=\\"sm\\" style=\\"color:#FBBF24\\">→ "+esc(String(ch.kho.dexuat).substring(0,60))+"</div>";\n' +
'      html+="</div>";\n' +
'      html+="<div class=\\"arrow\\">→</div>";\n' +
'      if(ch.vt){\n' +
'        html+="<div class=\\"chain-node\\" data-type=\\"VT\\" data-id=\\""+esc(ch.vt.ma||ch.vt.ten)+"\\"><div class=\\"nm\\">🧪 "+esc(ch.vt.ten)+"</div><div class=\\"sm\\">"+esc(ch.vt.khoa||"")+" · "+esc(ch.vt.tt||"")+"</div></div>";\n' +
'      } else { html+="<div class=\\"chain-node empty\\">chưa có vật tư khớp — kiểm tra Mã VTTH</div>"; }\n' +
'      html+="<div class=\\"arrow\\">→</div>";\n' +
'      if(ch.hs&&ch.hs.length){\n' +
'        html+="<div>";ch.hs.forEach(function(h){html+="<div class=\\"chain-node\\" data-type=\\"HS\\" data-id=\\""+esc(h.ma||h.ten)+"\\" style=\\"margin-bottom:4px\\"><div class=\\"nm\\">📁 "+esc(h.ma||h.ten)+"</div><div class=\\"sm\\">"+esc(h.tt||"")+"</div></div>";});html+="</div>";\n' +
'      } else { html+="<div class=\\"chain-node empty\\">chưa có gói thầu mua sắm</div>"; }\n' +
'      html+="</div></div>";\n' +
'    });\n' +
'  }\n' +
'  $("#view-lienket").innerHTML=html;\n' +
'  $$("#view-lienket .chain-node[data-type]").forEach(function(el){el.onclick=function(){openDetail(el.dataset.type,el.dataset.id);};});\n' +
'  $$("#view-lienket .chain-node[data-href]").forEach(function(el){el.onclick=function(){window.open(el.getAttribute("data-href"),"_blank");};});\n' +
'}\n' +
'function clock(){var d=new Date();var p=function(n){return n<10?"0"+n:n};$("#clock").textContent=p(d.getHours())+":"+p(d.getMinutes())+":"+p(d.getSeconds());}\n' +
'setInterval(clock,1000);clock();\n' +
/* v2.6: Refresh button — invalidate cache + reload current view */
'(function(){var btn=document.getElementById("btn-refresh");if(!btn)return;\n' +
'  btn.onclick=function(){\n' +
'    btn.disabled=true;btn.textContent="🔄 Đang làm mới…";\n' +
'    google.script.run.withSuccessHandler(function(){\n' +
'      btn.textContent="✅ Đã refresh";\n' +
'      setTimeout(function(){btn.disabled=false;btn.textContent="🔄 Refresh";},1500);\n' +
'      var cur=STATE.currentView||"overview";loadView(cur);\n' +
'    }).withFailureHandler(function(e){\n' +
'      btn.disabled=false;btn.textContent="⚠ Refresh lỗi";\n' +
'      console.error(e);\n' +
'    }).invalidateLinkIndex();\n' +
'  };\n' +
'})();\n' +
/* v2.9 — Email button: gửi báo cáo giao ban manual */
'(function(){var btn=document.getElementById("btn-email");if(!btn)return;\n' +
'  btn.onclick=function(){\n' +
'    if(!confirm("Gửi email báo cáo giao ban ngay cho danh sách email trong cfg_emails?")) return;\n' +
'    btn.disabled=true;btn.textContent="📧 Đang gửi…";\n' +
'    google.script.run.withSuccessHandler(function(res){\n' +
'      if(res && res.ok){\n' +
'        btn.textContent="✅ Đã gửi (" + res.count + ")";\n' +
'        setTimeout(function(){btn.disabled=false;btn.textContent="📧 Gửi email";}, 30000);\n' +
'      } else {\n' +
'        btn.textContent="⚠ " + (res && res.error ? res.error.substring(0,30) : "Lỗi");\n' +
'        setTimeout(function(){btn.disabled=false;btn.textContent="📧 Gửi email";}, 5000);\n' +
'      }\n' +
'    }).withFailureHandler(function(e){\n' +
'      btn.disabled=false;btn.textContent="⚠ Lỗi gửi";\n' +
'      alert("Lỗi gửi email: " + (e && e.message || e));\n' +
'    }).sendReportNow("morning_brief");\n' +
'  };\n' +
'})();\n' +
/* Tab switching */
'$$("#tabs button").forEach(function(b){b.onclick=function(){\n' +
'  $$("#tabs button").forEach(function(x){x.classList.remove("active")});b.classList.add("active");\n' +
'  $$("section.view").forEach(function(x){x.classList.remove("active")});\n' +
'  var v=b.dataset.view;STATE.currentView=v;\n' +
'  $("#view-"+v).classList.add("active");\n' +
'  loadView(v);\n' +
'};});\n' +
/* Severity helper */
'function severity(card){\n' +
'  if(card.red>0||card.cao>3||card.treDL>2||card.requestHigh>0)return"red";\n' +
'  if(card.yellow>0||card.cao>0||card.treDL>0||card.vuong>0)return"yellow";\n' +
'  return"green";\n' +
'}\n' +
/* Render Overview */
'function renderBaoCao(){\n' +
'  var c = $("#view-baocao");\n' +
'  c.innerHTML = \'<div class="report-container">\' +\n' +
'    \'<div class="report-sidebar">\' +\n' +
'      \'<h3 style="margin-bottom:10px;font-size:16px">Loại báo cáo</h3>\' +\n' +
'      \'<ul class="report-menu">\' +\n' +
'        \'<li class="report-menu-item active" data-type="morning_brief">📅 Giao ban hôm nay</li>\' +\n' +
'        \'<li class="report-menu-item" data-type="weekly">📊 Tổng kết tuần</li>\' +\n' +
'        \'<li class="report-menu-item" data-type="monthly">📈 Báo cáo tháng</li>\' +\n' +
'        \'<li class="report-menu-item" data-type="forecast">🔮 Dự báo cung ứng</li>\' +\n' +
'        \'<li class="report-menu-item" data-type="ton_dong">📦 Kiểm soát tồn đọng</li>\' +\n' +
'      \'</ul>\' +\n' +
'      \'<div class="report-filters">\' +\n' +
'        \'<div class="report-filter-group"><label>Cơ sở</label><select id="rep-coso" class="filter-select" style="width:100%"><option value="ALL">Tất cả cơ sở</option></select></div>\' +\n' +
'        \'<div class="report-filter-group"><label>Khoa</label><select id="rep-khoa" class="filter-select" style="width:100%"><option value="ALL">Tất cả khoa</option></select></div>\' +\n' +
'      \'</div>\' +\n' +
'    \'</div>\' +\n' +
'    \'<div class="report-content">\' +\n' +
'      \'<div class="report-actions">\' +\n' +
'        \'<button class="btn btn-secondary" id="btn-rep-email">📧 Gửi Email</button>\' +\n' +
'        \'<button class="btn btn-secondary" onclick="window.print()">📄 In PDF</button>\' +\n' +
'      \'</div>\' +\n' +
'      \'<div class="report-preview" id="report-preview-box">\' +\n' +
'        \'<div style="padding:100px;text-align:center;color:#9CA3AF">Đang tạo bản xem trước...</div>\' +\n' +
'      \'</div>\' +\n' +
'    \'</div>\' +\n' +
'  \'</div>\';\n' +
'  /* Bind events */\n' +
'  c.querySelectorAll(".report-menu-item").forEach(function(li){\n' +
'    li.onclick = function(){\n' +
'      c.querySelectorAll(".report-menu-item").forEach(function(x){x.classList.remove("active")});\n' +
'      this.classList.add("active");\n' +
'      loadReportPreview();\n' +
'    };\n' +
'  });\n' +
'  $("#btn-rep-email").onclick = function(){ exportReport("email"); };\n' +
'  loadReportPreview();\n' +
'}\n' +
'function loadReportPreview(){\n' +
'  var type = $("#view-baocao .report-menu-item.active").dataset.type;\n' +
'  var filters = { coso: $("#rep-coso").value, khoa: $("#rep-khoa").value };\n' +
'  $("#report-preview-box").innerHTML = \'<div style="padding:100px;text-align:center;color:#9CA3AF">🔄 Đang tạo báo cáo...</div>\';\n' +
'  google.script.run.withSuccessHandler(function(html){\n' +
'    $("#report-preview-box").innerHTML = \'<div class="report-watermark">PHÒNG VT-TBYT</div>\' + html;\n' +
'  }).getReportHtml(type, filters);\n' +
'}\n' +
'function exportReport(mode){\n' +
'  var type = $("#view-baocao .report-menu-item.active").dataset.type;\n' +
'  if(mode === "email"){\n' +
'    if(!confirm("Gửi báo cáo này qua email cho danh sách cấu hình?")) return;\n' +
'    google.script.run.withSuccessHandler(function(res){\n' +
'      alert(res.ok ? "✓ Đã gửi email thành công!" : "⚠ Lỗi: " + res.error);\n' +
'    }).sendReportNow(type);\n' +
'  }\n' +
'}\n' +
'function renderOverview(d){\n' +
'  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n' +
'  $("#updated").textContent = "Cập nhật: " + d.updatedAt;\n' +
'  var c=d.cards;\n' +
'  // v2.7: Helper render KPI card với X/Y + progress + breakdown chips\n' +
'  function pctClass(p){return p>=70?"green":p>=30?"yellow":"red";}\n' +
'  function renderKpiCard(opts){\n' +
'    var pct = opts.total ? Math.round(opts.done/opts.total*100) : 0;\n' +
'    var cls = pctClass(pct);\n' +
'    var sevTop = opts.severity || "gray";\n' +
'    var html = "<div class=\\"kpi-card kpi-"+sevTop+"\\" data-view=\\""+esc(opts.view||"")+"\\">";\n' +
'    html += "<div class=\\"kpi-head\\"><span class=\\"kpi-icon\\">"+opts.icon+"</span><div class=\\"kpi-title\\">"+esc(opts.title)+"<small>"+esc(opts.sub||"")+"</small></div></div>";\n' +
'    html += "<div class=\\"kpi-num\\"><span class=\\"big\\">"+opts.done+"</span><span class=\\"sep\\"> / </span><span class=\\"total\\">"+opts.total+"</span></div>";\n' +
'    html += "<div class=\\"kpi-progress\\"><div class=\\"kpi-progress-fill "+cls+"\\" style=\\"width:"+pct+"%\\"></div></div>";\n' +
'    html += "<div class=\\"kpi-pct "+cls+"\\">"+pct+"% "+esc(opts.pctLabel||"hoàn thành")+"</div>";\n' +
'    if(opts.chips && opts.chips.length){\n' +
'      html += "<div class=\\"kpi-chips\\">";\n' +
'      opts.chips.forEach(function(ch){\n' +
'        if(ch.value === 0 || ch.value === "0" || ch.value === null || ch.value === undefined) return;\n' +
'        html += "<span class=\\"chip chip-"+(ch.cls||"gray")+"\\">"+ch.icon+" "+esc(ch.label)+" <b>"+esc(ch.value)+"</b></span>";\n' +
'      });\n' +
'      html += "</div>";\n' +
'    }\n' +
'    if(opts.foot)html += "<div class=\\"kpi-foot\\">"+opts.foot+"</div>";\n' +
'    html += "<div class=\\"kpi-cta\\">↗ Xem chi tiết</div>";\n' +
'    html += "</div>";\n' +
'    return html;\n' +
'  }\n' +
'  var html = "<div class=\\"kpi-grid\\">";\n' +
'  // KT card\n' +
'  var sevKT = c.kt.cao>0||c.kt.treDL>0?"red":c.kt.dangSua>5?"yellow":"green";\n' +
'  html += renderKpiCard({\n' +
'    icon:"🔧", title:"Kỹ thuật", sub:"Máy hỏng / bảo trì", view:"kt", severity:sevKT,\n' +
'    done:c.kt.done, total:c.kt.total,\n' +
'    chips:[\n' +
'      {icon:"🔴", label:"CAO", value:c.kt.cao, cls:"red"},\n' +
'      {icon:"⏰", label:"trễ", value:c.kt.treDL, cls:"red"},\n' +
'      {icon:"🛠", label:"đang sửa", value:c.kt.dangSua, cls:"yellow"},\n' +
'      {icon:"♻", label:"đề xuất TL", value:c.kt.thanhLy, cls:"gray"}\n' +
'    ]\n' +
'  });\n' +
'  // HS card\n' +
'  var sevHS = c.hs.cao>0||c.hs.treDL>0||c.hs.vuong>0?"red":c.hs.dangXL>0?"yellow":"green";\n' +
'  html += renderKpiCard({\n' +
'    icon:"📁", title:"Hồ sơ", sub:"Gói thầu / mua sắm", view:"hs", severity:sevHS,\n' +
'    done:c.hs.done, total:c.hs.total,\n' +
'    chips:[\n' +
'      {icon:"🔴", label:"CAO", value:c.hs.cao, cls:"red"},\n' +
'      {icon:"⏰", label:"trễ", value:c.hs.treDL, cls:"red"},\n' +
'      {icon:"🚧", label:"vướng", value:c.hs.vuong, cls:"yellow"}\n' +
'    ],\n' +
'    foot:"<span class=\\"kpi-foot-num\\">💰 "+fmtVnd(c.hs.tongGiaTri)+"</span> tổng giá trị"\n' +
'  });\n' +
'  // VT card\n' +
'  var sevVT = c.vt.cao>0||c.vt.treDL>0||c.vt.vuong>0?"red":c.vt.dangXL>0?"yellow":"green";\n' +
'  html += renderKpiCard({\n' +
'    icon:"🧪", title:"Vật tư", sub:"Task hóa chất / VTTH", view:"vt", severity:sevVT,\n' +
'    done:c.vt.done, total:c.vt.total,\n' +
'    chips:[\n' +
'      {icon:"🔴", label:"CAO", value:c.vt.cao, cls:"red"},\n' +
'      {icon:"⏰", label:"trễ", value:c.vt.treDL, cls:"red"},\n' +
'      {icon:"🚧", label:"vướng", value:c.vt.vuong, cls:"yellow"}\n' +
'    ]\n' +
'  });\n' +
'  // v2.9 — KHO card redesign: focus dự đoán cung ứng (sếp quan tâm hàng sắp hết, cần gấp, dự trù)\n' +
'  var f = c.kho.forecast || {l1:0,l2:0,noSolution:0,stagnantLong:0,top:[]};\n' +
'  var khoActionable = f.l1 + f.l2 + f.stagnantLong;\n' +
'  var khoSafe = c.kho.total - khoActionable;\n' +
'  var sevK = (f.noSolution>0 || f.stagnantLong>0) ? "red" : (f.l1>0 || f.l2>0) ? "yellow" : "green";\n' +
'  html += renderKpiCard({\n' +
'    icon:"📦", title:"Kho", sub:"Cung ứng & tồn đọng", view:"kho", severity:sevK,\n' +
'    done:khoSafe, total:c.kho.total,\n' +
'    pctLabel: khoActionable>0 ? "an toàn (còn " + khoActionable + " cần xử lý)" : "an toàn",\n' +
'    chips:[\n' +
'      {icon:"🚨", label:"sắp hết <30n", value:f.l1, cls:"red"},\n' +
'      {icon:"🔴", label:"cần gấp 30-60n", value:f.l2, cls:"red"},\n' +
'      {icon:"⚠", label:"chưa có gói thầu", value:f.noSolution, cls:"red"},\n' +
'      {icon:"📦", label:"tồn >1 năm", value:f.stagnantLong, cls:"gray"}\n' +
'    ],\n' +
'    foot: (f.top && f.top.length) ? ("<span class=\\"kpi-foot-num\\" style=\\"color:#FBBF24\\">" + esc(f.top[0].ten.substring(0, 30)) + (f.top[0].ten.length>30?"…":"") + "</span> · DOH " + f.top[0].doh + "n") : ""\n' +
'  });\n' +
'  html += "</div>";\n' +
'  // Top khoa with composite Khoa·Cơ sở\n' +
'  html += "<div class=\\"sh\\">📊 Khoa × Cơ sở nóng nhất <small style=\\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\\">(click để xem toàn cảnh khoa)</small></div>";\n' +
'  html += "<div class=\\"bars\\">";\n' +
'  if(d.topKhoa.length===0)html += "<div class=\\"empty\\" style=\\"background:transparent;border:0;\\">(Không có dữ liệu khoa)</div>";\n' +
'  else{\n' +
'    var maxC = Math.max.apply(null, d.topKhoa.map(function(k){return k.count;}));\n' +
'    d.topKhoa.forEach(function(k){\n' +
'      var pct = (k.count/maxC*100).toFixed(0);\n' +
'      var dispLabel = k.label||k.khoa;\n' +
'      html += "<div class=\\"bar\\" data-khoa=\\""+esc(k.khoa)+"\\" data-coso=\\""+esc(k.coso||"")+"\\" style=\\"cursor:pointer\\">";\n' +
'      html += "<div class=\\"bar-name\\" title=\\""+esc(dispLabel)+"\\">"+esc(dispLabel)+"</div>";\n' +
'      html += "<div class=\\"bar-track\\"><div class=\\"bar-fill\\" style=\\"width:"+pct+"%\\"></div></div>";\n' +
'      html += "<div class=\\"bar-val\\">"+k.count+"</div></div>";\n' +
'    });\n' +
'  }\n' +
'  html += "</div>";\n' +
'  // v2.7.2: Hot list — group by team (KT/HS/KHO) thay vì list phẳng\n' +
'  var hotByTeam = {KT:[], HS:[], KHO:[]};\n' +
'  (d.hot||[]).forEach(function(h){\n' +
'    var t = h.team || "KT";\n' +
'    if(!hotByTeam[t]) hotByTeam[t]=[];\n' +
'    hotByTeam[t].push(h);\n' +
'  });\n' +
'  var totalHot = (hotByTeam.KT.length+hotByTeam.HS.length+hotByTeam.KHO.length);\n' +
'  html += "<div class=\\"sh\\">🔥 Điểm nóng theo nhóm <small style=\\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\\">tổng "+totalHot+" — click để mở chi tiết, có CB phụ trách kèm theo để giao việc</small></div>";\n' +
'  if(totalHot===0)html += "<div class=\\"empty\\">✓ Không có điểm nóng — chúc Sếp ngày yên ổn!</div>";\n' +
'  else{\n' +
'    html += "<div class=\\"hot-by-team\\">";\n' +
'    var teamMeta = {\n' +
'      KT: {icon:"🔧", label:"Kỹ thuật", color:"red", limit:5},\n' +
'      HS: {icon:"📁", label:"Hồ sơ", color:"yellow", limit:4},\n' +
'      KHO:{icon:"📦", label:"Kho", color:"orange", limit:4}\n' +
'    };\n' +
'    ["KT","HS","KHO"].forEach(function(team){\n' +
'      var items = hotByTeam[team]||[]; var meta = teamMeta[team];\n' +
'      html += "<div class=\\"hot-team-col hot-team-"+meta.color+"\\">";\n' +
'      html += "<div class=\\"hot-team-h\\"><span class=\\"hot-team-icon\\">"+meta.icon+"</span><div class=\\"hot-team-meta\\"><div class=\\"hot-team-name\\">"+esc(meta.label)+"</div><div class=\\"hot-team-cnt\\">"+items.length+" điểm</div></div></div>";\n' +
'      if(items.length===0){\n' +
'        html += "<div class=\\"hot-empty\\">✓ Không có vướng mắc</div>";\n' +
'      } else {\n' +
'        items.slice(0, meta.limit).forEach(function(h, i){\n' +
'          var hotAttrs="";\n' +
'          if(h.linkType && h.linkId){hotAttrs=" data-type=\\""+esc(h.linkType)+"\\" data-id=\\""+esc(h.linkId)+"\\" data-tab=\\""+esc(h.linkTab||"")+"\\"";}\n' +
'          else if(h.linkTab){hotAttrs=" data-tab=\\""+esc(h.linkTab)+"\\" data-title=\\""+esc(h.linkTitle||h.title||"Hàng")+"\\"";}\n' +
'          html += "<div class=\\"hot-item\\""+hotAttrs+" data-gid=\\""+(h.gid||"")+"\\" data-row=\\""+(h.sheetRow||"")+"\\">";\n' +
'          html += "<div class=\\"hot-item-head\\">";\n' +
'          html += "<span class=\\"hot-item-num\\">"+(i+1)+"</span>";\n' +
'          html += "<span class=\\"hot-item-title\\">"+esc(h.title)+"</span>";\n' +
'          html += "<span class=\\"hot-item-badge "+(meta.color)+"\\">"+esc(h.badge||"")+"</span>";\n' +
'          html += "</div>";\n' +
'          if(h.subtitle)html += "<div class=\\"hot-item-sub\\">📍 "+esc(h.subtitle)+"</div>";\n' +
'          if(h.detail)html += "<div class=\\"hot-item-detail\\">"+esc(h.detail)+"</div>";\n' +
'          if(h.cb)html += "<div class=\\"hot-item-cb\\">👤 <b>"+esc(h.cb)+"</b></div>";\n' +
'          html += "</div>";\n' +
'        });\n' +
'        if(items.length > meta.limit){\n' +
'          html += "<div class=\\"hot-more\\" data-team=\\""+team+"\\">+ "+(items.length-meta.limit)+" điểm nữa — click để xem tab chi tiết</div>";\n' +
'        }\n' +
'      }\n' +
'      html += "</div>";\n' +
'    });\n' +
'    html += "</div>";\n' +
'  }\n' +
'  $("#view-overview").innerHTML = html;\n' +
'  // KPI card click → switch tab\n' +
'  $$("#view-overview .kpi-card[data-view]").forEach(function(el){\n' +
'    el.onclick=function(){\n' +
'      var v = el.getAttribute("data-view");\n' +
'      var btn = document.querySelector("#tabs button[data-view=\\""+v+"\\"]");\n' +
'      if(btn) btn.click();\n' +
'    };\n' +
'  });\n' +
'  $$("#view-overview .hot-item").forEach(function(el){el.onclick=function(){openInApp(el);};});\n' +
'  $$("#view-overview .hot-more[data-team]").forEach(function(el){\n' +
'    el.onclick=function(){\n' +
'      var team = el.getAttribute("data-team");\n' +
'      var view = team==="KT"?"kt":team==="HS"?"hs":team==="KHO"?"kho":null;\n' +
'      if(view){var btn=document.querySelector("#tabs button[data-view=\\""+view+"\\"]");if(btn)btn.click();}\n' +
'    };\n' +
'  });\n' +
'  $$("#view-overview .bar[data-khoa]").forEach(function(el){\n' +
'    el.onclick=function(){\n' +
'      var khoa = el.getAttribute("data-khoa");\n' +
'      var coso = el.getAttribute("data-coso");\n' +
'      // v2.7: pass cơ sở để khoa modal hiện đúng dữ liệu của khoa·cơ sở đó\n' +
'      openKhoaModal(khoa, coso);\n' +
'    };\n' +
'  });\n' +
'}\n' +
/* Render KT — v2.7 redesign: summary strip + CB filter + row coloring */
'function renderKT(d){\n' +
'  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n' +
'  if(d.missing){$("#view-kt").innerHTML="<div class=\\"error\\">Chưa có tab \\""+esc("Nhóm kỹ thuật")+"\\". Tạo trước hoặc đổi tên cho khớp.</div>";return;}\n' +
'  // Build filter options\n' +
'  var cosos = Array.from(new Set(d.rows.map(function(r){return r.coso;}).filter(Boolean))).sort();\n' +
'  var tinhs = Array.from(new Set(d.rows.map(function(r){return r.tinh;}).filter(Boolean))).sort();\n' +
'  var khoas = Array.from(new Set(d.rows.map(function(r){return r.khoa;}).filter(Boolean))).sort();\n' +
'  var cbs = (d.cbList || Array.from(new Set(d.rows.map(function(r){return r.cb;}).filter(Boolean))).sort());\n' +
'  // Summary stats\n' +
'  var stat = {dangSua:0, treDL:0, cao:0, thanhLy:0, hong:0};\n' +
'  d.rows.forEach(function(r){\n' +
'    var t=(r.tinh||"").toLowerCase();\n' +
'    if(t.indexOf("thanh lý")>=0) stat.thanhLy++;\n' +
'    if(r.ht) return;\n' +
'    if(t.indexOf("đang sửa")>=0) stat.dangSua++;\n' +
'    if(t==="hỏng") stat.hong++;\n' +
'    if(r.tre) stat.treDL++;\n' +
'    if((r.ut||"").toLowerCase().indexOf("cao")>=0) stat.cao++;\n' +
'  });\n' +
'  var html = "";\n' +
'  // Summary chips\n' +
'  html += "<div class=\\"kt-summary\\">";\n' +
'  html += "<button class=\\"kt-chip yellow\\" data-chip=\\"dangsua\\"><span class=\\"kt-chip-icon\\">🛠</span><div><span class=\\"kt-chip-num\\">"+stat.dangSua+"</span><span class=\\"kt-chip-lbl\\">đang sửa</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip red\\" data-chip=\\"tre\\"><span class=\\"kt-chip-icon\\">⏰</span><div><span class=\\"kt-chip-num\\">"+stat.treDL+"</span><span class=\\"kt-chip-lbl\\">trễ deadline</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip red\\" data-chip=\\"cao\\"><span class=\\"kt-chip-icon\\">🔴</span><div><span class=\\"kt-chip-num\\">"+stat.cao+"</span><span class=\\"kt-chip-lbl\\">ưu tiên CAO</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip gray\\" data-chip=\\"thanhly\\"><span class=\\"kt-chip-icon\\">♻</span><div><span class=\\"kt-chip-num\\">"+stat.thanhLy+"</span><span class=\\"kt-chip-lbl\\">đề xuất thanh lý</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip\\" data-chip=\\"reset\\" title=\\"Reset filter\\">↻ Tất cả</button>";\n' +
'  html += "</div>";\n' +
'  // v2.7.7: View toggle + Group-by — đồng bộ với Tab Hồ sơ\n' +
'  html += "<div class=\\"hs-toolbar\\">";\n' +
'  html += "<div class=\\"hs-view-toggle\\">";\n' +
'  html += "<button class=\\"hs-vbtn active\\" data-view=\\"table\\">📋 Bảng đầy đủ</button>";\n' +
'  html += "<button class=\\"hs-vbtn\\" data-view=\\"kanban\\">🗂 Pipeline</button>";\n' +
'  html += "</div>";\n' +
'  html += "<div class=\\"hs-groupby\\"><label>Group by:</label>";\n' +
'  html += "<select id=\\"kt-group\\"><option value=\\"tinh\\">📋 Tình trạng</option><option value=\\"ut\\">🔴 Cấp độ ưu tiên</option><option value=\\"khoa\\">🏥 Khoa</option><option value=\\"coso\\">🏢 Cơ sở</option><option value=\\"cb\\">👤 CB phụ trách</option></select>";\n' +
'  html += "</div>";\n' +
'  html += "</div>";\n' +
'  // Filter row\n' +
'  html += "<div class=\\"kt-filters\\">";\n' +
'  html += "<input id=\\"f-search\\" placeholder=\\"🔍 Tìm tên máy / khoa / chi tiết / CB…\\">";\n' +
'  html += "<select id=\\"f-coso\\"><option value=\\"\\">Tất cả cơ sở</option>"+cosos.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"f-khoa\\"><option value=\\"\\">Tất cả khoa</option>"+khoas.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"f-cb\\"><option value=\\"\\">Tất cả CB</option>"+cbs.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"f-tinh\\"><option value=\\"\\">Tất cả trạng thái</option>"+tinhs.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"f-ut\\"><option value=\\"\\">Mọi cấp độ</option><option>CAO</option><option>Bình thường</option></select>";\n' +
'  html += "<label class=\\"toggle\\"><input type=\\"checkbox\\" id=\\"f-hide-thanhly\\" checked> Ẩn thanh lý</label>";\n' +
'  html += "<label class=\\"toggle\\"><input type=\\"checkbox\\" id=\\"f-hide-done\\"> Ẩn hoàn thành</label>";\n' +
'  html += "<span class=\\"badge\\" id=\\"kt-count\\">"+d.rows.length+" máy</span>";\n' +
'  html += "</div>";\n' +
'  html += "<div id=\\"kt-content\\"></div>";\n' +
'  $("#view-kt").innerHTML = html;\n' +
'  var STATE_KT = {view:"table", groupBy:"tinh"};\n' +
'  function ktHotBadge(r, isCAO){\n' +
'    if(isCAO && r.tre) return "<span class=\\"hot-badge hb-critical\\" title=\\"CAO + trễ\\">🔥 HOT</span>";\n' +
'    if(r.tre) return "<span class=\\"hot-badge hb-tre\\" title=\\"Trễ deadline\\">⏰</span>";\n' +
'    if(isCAO) return "<span class=\\"hot-badge hb-cao\\">CAO</span>";\n' +
'    return "";\n' +
'  }\n' +
'  function renderKTCardInner(r){\n' +
'    var isCAO = (r.ut||"").toLowerCase().indexOf("cao")>=0;\n' +
'    var cardCls = "kanban-card";\n' +
'    if(isCAO && r.tre) cardCls += " card-critical";\n' +
'    else if(isCAO) cardCls += " card-cao";\n' +
'    else if(r.tre) cardCls += " card-tre";\n' +
'    if(r.ht) cardCls += " row-done";\n' +
'    var pillT = (r.tinh||"").toLowerCase().indexOf("thanh lý")>=0?"gray":(r.tinh||"").toLowerCase().indexOf("đang sửa")>=0?"yellow":(r.tinh||"").toLowerCase().indexOf("bảo trì")>=0?"blue":(r.tinh||"").toLowerCase()==="hỏng"?"red":"gray";\n' +
'    var hot = ktHotBadge(r, isCAO);\n' +
'    var h = "<div class=\\""+cardCls+"\\" data-type=\\"KT\\" data-id=\\""+esc(r.ten)+"\\" data-tab=\\""+esc(TAB_NAME.KT)+"\\" data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'    h += "<div class=\\"ma\\">"+hot+esc(r.ten)+(r.ht?" <span class=\\"ht-tick\\" style=\\"font-size:11px\\">✓</span>":"")+"</div>";\n' +
'    if(r.info)h += "<div class=\\"nd\\" style=\\"font-size:11px;color:#9CA3AF\\">"+esc(r.info)+"</div>";\n' +
'    h += "<div class=\\"meta\\" style=\\"margin-top:6px\\">";\n' +
'    h += "<span title=\\""+esc(r.khoa+(r.coso?" · "+r.coso:""))+"\\">📍 "+esc((r.khoa||"").substring(0,18))+(r.khoa.length>18?"…":"")+"</span>";\n' +
'    h += "<span class=\\"pill "+pillT+"\\" style=\\"font-size:10px;padding:1px 6px\\">"+esc(r.tinh||"-")+"</span>";\n' +
'    h += "</div>";\n' +
'    if(r.chitiet)h += "<div class=\\"kanban-vuong\\" style=\\"color:#D1D5DB;font-style:normal\\">"+esc(String(r.chitiet).substring(0,90))+(r.chitiet.length>90?"…":"")+"</div>";\n' +
'    if(r.cb)h += "<div class=\\"kanban-cb\\">👤 "+esc(r.cb)+"</div>";\n' +
'    if(r.dl)h += "<div class=\\"meta\\" style=\\"margin-top:5px;font-size:11px\\"><span style=\\"color:#9CA3AF\\">⏱ "+esc(r.dl)+"</span>"+(r.tre?" <span class=\\"tre-badge\\">Trễ "+r.tre+"n</span>":"")+"</div>";\n' +
'    if(r.vuong)h += "<div class=\\"kanban-vuong\\">⚠ "+esc(String(r.vuong).substring(0,80))+(r.vuong.length>80?"…":"")+"</div>";\n' +
'    h += "</div>";\n' +
'    return h;\n' +
'  }\n' +
'  function renderKTKanban(rows){\n' +
'    if(!rows.length) return "<div class=\\"empty\\">Không có máy nào khớp filter.</div>";\n' +
'    var groupBy = STATE_KT.groupBy || "tinh";\n' +
'    var groupLabel = {tinh:"Tình trạng", ut:"Cấp độ ưu tiên", khoa:"Khoa", coso:"Cơ sở", cb:"CB phụ trách"}[groupBy] || "Tình trạng";\n' +
'    var buckets = {};\n' +
'    rows.forEach(function(r){\n' +
'      var k;\n' +
'      if(groupBy==="ut") k = ((r.ut||"").toLowerCase().indexOf("cao")>=0)?"🔴 Ưu tiên CAO":"Bình thường";\n' +
'      else if(groupBy==="khoa") k = r.khoa || "(Chưa rõ khoa)";\n' +
'      else if(groupBy==="coso") k = r.coso || "(Chưa rõ cơ sở)";\n' +
'      else if(groupBy==="cb") k = r.cb || "(Chưa giao)";\n' +
'      else k = r.tinh || "(Chưa phân loại)";\n' +
'      if(!buckets[k]) buckets[k]=[];\n' +
'      buckets[k].push(r);\n' +
'    });\n' +
'    var pipe = Object.keys(buckets).map(function(k){return {name:k, count:buckets[k].length, items:buckets[k]};}).sort(function(a,b){return b.count-a.count;});\n' +
'    if(!pipe.length) return "<div class=\\"empty\\">Không có máy nào khớp filter.</div>";\n' +
'    if(pipe.length===1){\n' +
'      var col = pipe[0];\n' +
'      var hg = "<div class=\\"hs-grid-banner\\">📋 <b>"+esc(col.name)+"</b> <span class=\\"hs-grid-cnt\\">"+col.count+" máy</span> <span class=\\"hs-grid-hint\\">— chỉ có 1 "+esc(groupLabel.toLowerCase())+", hiển thị grid để dễ scan. Đổi <b>Group by</b> để thấy cột phân nhóm khác.</span></div>";\n' +
'      hg += "<div class=\\"hs-grid\\">";\n' +
'      col.items.forEach(function(it){ hg += renderKTCardInner(it); });\n' +
'      hg += "</div>";\n' +
'      return hg;\n' +
'    }\n' +
'    var h = "<div class=\\"pipeline\\" data-groupby=\\""+groupBy+"\\">";\n' +
'    pipe.forEach(function(col){\n' +
'      h += "<div class=\\"col\\"><div class=\\"col-head\\">"+esc(col.name)+"<span class=\\"col-count\\">"+col.count+"</span></div><div class=\\"col-body\\">";\n' +
'      col.items.forEach(function(it){ h += renderKTCardInner(it); });\n' +
'      h += "</div></div>";\n' +
'    });\n' +
'    h += "</div>";\n' +
'    return h;\n' +
'  }\n' +
'  function renderKTTable(rows){\n' +
'    if(!rows.length) return "<div class=\\"empty\\">Không có máy nào khớp filter.</div>";\n' +
'    var h = "<div class=\\"tbl-wrap\\"><table class=\\"tbl tbl-kt\\" id=\\"kt-table\\">";\n' +
'    h += "<thead><tr><th class=\\"col-ten\\">Tên máy</th><th class=\\"col-cap\\">Cấp độ</th><th class=\\"col-ht\\">HT</th><th>Khoa · Cơ sở</th><th>Tình trạng</th><th>Chi tiết</th><th>CB</th><th>Bước</th><th>Deadline</th><th>Vướng mắc</th></tr></thead><tbody>";\n' +
'    rows.forEach(function(r){\n' +
'      var pillT = r.tinh.toLowerCase().indexOf("thanh lý")>=0?"gray":r.tinh.toLowerCase().indexOf("đang sửa")>=0?"yellow":r.tinh.toLowerCase().indexOf("bảo trì")>=0?"blue":r.tinh.toLowerCase()==="hỏng"?"red":"gray";\n' +
'      var isCAO = r.ut.toLowerCase().indexOf("cao")>=0;\n' +
'      var pillU = isCAO?"red":"gray";\n' +
'      var rowCls = r.ht?"row-done":"";\n' +
'      var dl = r.dl + (r.tre?" <span class=\\"tre-badge\\">Trễ "+r.tre+"n</span>":"");\n' +
'      var khoaCoso = esc(r.khoa)+(r.coso?"<div style=\\"font-size:10px;color:#6B7280;margin-top:2px\\">"+esc(r.coso)+"</div>":"");\n' +
'      var hot = ktHotBadge(r, isCAO);\n' +
'      h += "<tr class=\\""+rowCls+"\\" data-type=\\"KT\\" data-id=\\""+esc(r.ten)+"\\" data-tab=\\""+esc(TAB_NAME.KT)+"\\" data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'      h += "<td class=\\"col-ten\\">"+hot+"<b>"+esc(r.ten)+"</b><div style=\\"font-size:11px;color:#6B7280;\\">"+esc(r.info)+"</div></td>";\n' +
'      h += "<td class=\\"col-cap\\"><span class=\\"pill "+pillU+"\\">"+esc(r.ut||"-")+"</span></td>";\n' +
'      h += "<td class=\\"col-ht\\">"+(r.ht?"<span class=\\"ht-tick\\">✓</span>":"<span class=\\"ht-pending\\">⏳</span>")+"</td>";\n' +
'      h += "<td>"+khoaCoso+"</td>";\n' +
'      h += "<td><span class=\\"pill "+pillT+"\\">"+esc(r.tinh)+"</span></td>";\n' +
'      h += "<td style=\\"max-width:260px;font-size:12px;\\">"+esc(r.chitiet)+"</td>";\n' +
'      h += "<td style=\\"font-size:12px;\\">"+esc(r.cb)+"</td>";\n' +
'      h += "<td style=\\"max-width:220px;font-size:11px;color:#9CA3AF;\\">"+esc(r.buoc)+"</td>";\n' +
'      h += "<td style=\\"font-size:11px;\\">"+dl+"</td>";\n' +
'      h += "<td style=\\"max-width:200px;font-size:11px;color:#FCA5A5;\\">"+esc(r.vuong)+"</td>";\n' +
'      h += "</tr>";\n' +
'    });\n' +
'    h += "</tbody></table></div>";\n' +
'    return h;\n' +
'  }\n' +
'  function applyKT(){\n' +
'    var q=$("#f-search").value.toLowerCase();\n' +
'    var cs=$("#f-coso").value, kh=$("#f-khoa").value, cb=$("#f-cb").value, ti=$("#f-tinh").value, ut=$("#f-ut").value;\n' +
'    var hideTL=$("#f-hide-thanhly").checked, hideDone=$("#f-hide-done").checked;\n' +
'    var rows=d.rows.filter(function(r){\n' +
'      var isTL = r.tinh && r.tinh.toLowerCase().indexOf("thanh lý")>=0;\n' +
'      if(hideTL && isTL) return false;\n' +
'      if(hideDone && r.ht && !isTL) return false;\n' +
'      if(cs && r.coso!==cs) return false;\n' +
'      if(kh && r.khoa!==kh) return false;\n' +
'      if(cb && r.cb!==cb && r.cbhs!==cb) return false;\n' +
'      if(ti && r.tinh!==ti) return false;\n' +
'      if(ut==="CAO" && r.ut.toLowerCase().indexOf("cao")<0) return false;\n' +
'      if(ut==="Bình thường" && r.ut.toLowerCase().indexOf("cao")>=0) return false;\n' +
'      if(q){var hay=(r.ten+" "+r.khoa+" "+r.chitiet+" "+r.cb+" "+r.cbhs+" "+r.tinh+" "+r.buoc+" "+r.vuong).toLowerCase();if(hay.indexOf(q)<0)return false;}\n' +
'      return true;\n' +
'    });\n' +
'    rows.sort(function(a,b){\n' +
'      var aCAO = a.ut.toLowerCase().indexOf("cao")>=0?0:1;\n' +
'      var bCAO = b.ut.toLowerCase().indexOf("cao")>=0?0:1;\n' +
'      if(aCAO !== bCAO) return aCAO - bCAO;\n' +
'      var aTre = a.tre?0:1, bTre = b.tre?0:1;\n' +
'      if(aTre !== bTre) return aTre - bTre;\n' +
'      return (a.ht?1:0)-(b.ht?1:0);\n' +
'    });\n' +
'    if(STATE_KT.view==="kanban") $("#kt-content").innerHTML = renderKTKanban(rows);\n' +
'    else $("#kt-content").innerHTML = renderKTTable(rows);\n' +
'    $("#kt-count").textContent = rows.length+" / "+d.rows.length+" máy";\n' +
'    $$("#kt-content .kanban-card, #kt-content tbody tr").forEach(function(el){el.onclick=function(){openInApp(el);};});\n' +
'  }\n' +
'  // Bind chip clicks\n' +
'  $$("#view-kt .kt-chip[data-chip]").forEach(function(el){\n' +
'    el.onclick=function(){\n' +
'      var chip = el.getAttribute("data-chip");\n' +
'      $$("#view-kt .kt-chip").forEach(function(x){x.classList.remove("active");});\n' +
'      if(chip!=="reset") el.classList.add("active");\n' +
'      $("#f-search").value=""; $("#f-coso").value=""; $("#f-khoa").value=""; $("#f-cb").value=""; $("#f-tinh").value=""; $("#f-ut").value="";\n' +
'      $("#f-hide-thanhly").checked=true; $("#f-hide-done").checked=false;\n' +
'      if(chip==="dangsua"){ var opt=Array.from($("#f-tinh").options).find(function(o){return o.value.toLowerCase().indexOf("đang sửa")>=0;}); if(opt) $("#f-tinh").value=opt.value; }\n' +
'      else if(chip==="cao"){ $("#f-ut").value="CAO"; }\n' +
'      else if(chip==="thanhly"){ $("#f-hide-thanhly").checked=false; var opt2=Array.from($("#f-tinh").options).find(function(o){return o.value.toLowerCase().indexOf("thanh lý")>=0;}); if(opt2) $("#f-tinh").value=opt2.value; }\n' +
'      applyKT();\n' +
'      if(chip==="tre"){\n' +
'        $$("#kt-content .kanban-card, #kt-content tbody tr").forEach(function(el){\n' +
'          var hasHot = el.querySelector(".hot-badge.hb-critical, .hot-badge.hb-tre");\n' +
'          if(!hasHot) el.style.display="none";\n' +
'        });\n' +
'      }\n' +
'    };\n' +
'  });\n' +
'  // Bind view toggle\n' +
'  $$("#view-kt .hs-vbtn").forEach(function(b){\n' +
'    b.onclick=function(){\n' +
'      $$("#view-kt .hs-vbtn").forEach(function(x){x.classList.remove("active");});\n' +
'      b.classList.add("active");\n' +
'      STATE_KT.view = b.getAttribute("data-view");\n' +
'      applyKT();\n' +
'    };\n' +
'  });\n' +
'  // Bind groupBy\n' +
'  var ktSel = $("#kt-group");\n' +
'  if(ktSel) ktSel.onchange = function(){ STATE_KT.groupBy = this.value; applyKT(); };\n' +
'  ["#f-search","#f-coso","#f-khoa","#f-cb","#f-tinh","#f-ut","#f-hide-thanhly","#f-hide-done"].forEach(function(s){var el=$(s);if(el)el.oninput=el.onchange=applyKT;});\n' +
'  applyKT();\n' +
'}\n' +
/* Render HS Pipeline */
'function renderHS(d){\n' +
'  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n' +
'  if(d.missing){$("#view-hs").innerHTML="<div class=\\"error\\">Chưa có tab \\""+esc("Nhóm Hồ sơ")+"\\".</div>";return;}\n' +
'  // Build filter options\n' +
'  var cosos = Array.from(new Set(d.rows.map(function(r){return r.coso;}).filter(Boolean))).sort();\n' +
'  var khoas = Array.from(new Set(d.rows.map(function(r){return r.khoa;}).filter(Boolean))).sort();\n' +
'  var hinhs = Array.from(new Set(d.rows.map(function(r){return r.hinh;}).filter(Boolean))).sort();\n' +
'  var tts = Array.from(new Set(d.rows.map(function(r){return r.tt;}).filter(Boolean))).sort();\n' +
'  var cbs = (d.cbList || Array.from(new Set(d.rows.map(function(r){return r.cb;}).filter(Boolean))).sort());\n' +
'  // Summary stats\n' +
'  var stat = {total:d.rows.length, done:0, vuong:0, treDL:0, cao:0, tongGT:0};\n' +
'  d.rows.forEach(function(r){\n' +
'    if(r.ht) stat.done++;\n' +
'    if(r.gt) stat.tongGT += r.gt;\n' +
'    if(r.ht) return;\n' +
'    if(r.vuong) stat.vuong++;\n' +
'    if(r.tre) stat.treDL++;\n' +
'    if((r.ut||"").toLowerCase().indexOf("cao")>=0) stat.cao++;\n' +
'  });\n' +
'  var donePct = stat.total ? Math.round(stat.done/stat.total*100) : 0;\n' +
'  var html = "";\n' +
'  html += "<div class=\\"kt-summary\\">";\n' +
'  html += "<button class=\\"kt-chip green\\" data-chip=\\"done\\" title=\\"Tỉ lệ hoàn thành\\"><span class=\\"kt-chip-icon\\">✓</span><div><span class=\\"kt-chip-num\\">"+stat.done+"<small style=\\"color:#9CA3AF;font-weight:400;font-size:14px\\"> / "+stat.total+"</small></span><span class=\\"kt-chip-lbl\\">đã hoàn thành ("+donePct+"%)</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip yellow\\" data-chip=\\"vuong\\"><span class=\\"kt-chip-icon\\">🚧</span><div><span class=\\"kt-chip-num\\">"+stat.vuong+"</span><span class=\\"kt-chip-lbl\\">vướng mắc</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip red\\" data-chip=\\"tre\\"><span class=\\"kt-chip-icon\\">⏰</span><div><span class=\\"kt-chip-num\\">"+stat.treDL+"</span><span class=\\"kt-chip-lbl\\">trễ deadline</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip red\\" data-chip=\\"cao\\"><span class=\\"kt-chip-icon\\">🔴</span><div><span class=\\"kt-chip-num\\">"+stat.cao+"</span><span class=\\"kt-chip-lbl\\">ưu tiên CAO</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip\\" data-chip=\\"reset\\" title=\\"Reset filter\\">↻ Tất cả</button>";\n' +
'  if(stat.tongGT){html += "<div class=\\"hs-budget\\">💰 Tổng giá trị: <b>"+fmtVnd(stat.tongGT)+"</b></div>";}\n' +
'  html += "</div>";\n' +
'  html += "<div class=\\"hs-toolbar\\">";\n' +
'  html += "<div class=\\"hs-view-toggle\\">";\n' +
'  html += "<button class=\\"hs-vbtn active\\" data-view=\\"kanban\\">🗂 Pipeline</button>";\n' +
'  html += "<button class=\\"hs-vbtn\\" data-view=\\"table\\">📋 Bảng đầy đủ</button>";\n' +
'  html += "</div>";\n' +
'  html += "<div class=\\"hs-groupby\\"><label>Group by:</label>";\n' +
'  html += "<select id=\\"hs-group\\"><option value=\\"tt\\">📋 Trạng thái</option><option value=\\"hinh\\">📊 Hình thức LCNT</option><option value=\\"ut\\">🔴 Cấp độ ưu tiên</option><option value=\\"cb\\">👤 CB phụ trách</option><option value=\\"khoa\\">🏥 Khoa</option></select>";\n' +
'  html += "</div>";\n' +
'  html += "</div>";\n' +
'  html += "<div class=\\"kt-filters\\">";\n' +
'  html += "<input id=\\"hs-search\\" placeholder=\\"🔍 Tìm mã / nội dung / khoa / CB / vướng mắc…\\">";\n' +
'  html += "<select id=\\"hs-coso\\"><option value=\\"\\">Tất cả cơ sở</option>"+cosos.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"hs-khoa\\"><option value=\\"\\">Tất cả khoa</option>"+khoas.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"hs-cb\\"><option value=\\"\\">Tất cả CB</option>"+cbs.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"hs-tt\\"><option value=\\"\\">Tất cả trạng thái</option>"+tts.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"hs-hinh\\"><option value=\\"\\">Mọi hình thức</option>"+hinhs.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"hs-ut\\"><option value=\\"\\">Mọi cấp độ</option><option>CAO</option><option>Bình thường</option></select>";\n' +
'  html += "<label class=\\"toggle\\"><input type=\\"checkbox\\" id=\\"hs-hide-done\\"> Ẩn hoàn thành</label>";\n' +
'  html += "<span class=\\"badge\\" id=\\"hs-count\\">"+d.rows.length+" gói</span>";\n' +
'  html += "</div>";\n' +
'  html += "<div id=\\"hs-content\\"></div>";\n' +
'  $("#view-hs").innerHTML = html;\n' +
'  var STATE_HS = {view: "kanban"};\n' +
'  function hsHotBadge(it, isCAO){\n' +
'    if(isCAO && it.tre) return "<span class=\\"hot-badge hb-critical\\" title=\\"CAO + trễ\\">🔥 HOT</span>";\n' +
'    if(it.tre) return "<span class=\\"hot-badge hb-tre\\" title=\\"Trễ deadline\\">⏰</span>";\n' +
'    if(isCAO) return "<span class=\\"hot-badge hb-cao\\">CAO</span>";\n' +
'    return "";\n' +
'  }\n' +
'  function renderHSCardInner(it){\n' +
'    var isCAO = (it.ut||"").toLowerCase().indexOf("cao")>=0;\n' +
'    var cardCls = "kanban-card";\n' +
'    if(isCAO && it.tre) cardCls += " card-critical";\n' +
'    else if(isCAO) cardCls += " card-cao";\n' +
'    else if(it.tre) cardCls += " card-tre";\n' +
'    var h = "<div class=\\""+cardCls+"\\" data-type=\\"HS\\" data-id=\\""+esc(it.ma||it.nd)+"\\" data-tab=\\""+esc(TAB_NAME.HS)+"\\" data-gid=\\""+it.gid+"\\" data-row=\\""+it.idx+"\\">";\n' +
'    var hot = hsHotBadge(it, isCAO);\n' +
'    h += "<div class=\\"ma\\">"+hot+esc(it.ma||"")+"</div>";\n' +
'    h += "<div class=\\"nd\\">"+esc(it.nd.length>120?it.nd.substring(0,120)+"…":it.nd)+"</div>";\n' +
'    h += "<div class=\\"meta\\">";\n' +
'    h += "<span title=\\""+esc(it.khoa+(it.coso?" · "+it.coso:""))+"\\">📍 "+esc((it.khoa||"").substring(0,18))+(it.khoa.length>18?"…":"")+"</span>";\n' +
'    if(it.gt)h += "<span style=\\"color:#60A5FA;font-size:11px\\">"+esc(fmtVnd(it.gt))+"</span>";\n' +
'    h += "</div>";\n' +
'    if(it.cb)h += "<div class=\\"kanban-cb\\">👤 "+esc(it.cb)+"</div>";\n' +
'    if(it.vuong)h += "<div class=\\"kanban-vuong\\">⚠ "+esc(String(it.vuong).substring(0,80))+(it.vuong.length>80?"…":"")+"</div>";\n' +
'    if(it.pct!==null)h += "<div class=\\"progress\\"><div class=\\"progress-fill\\" style=\\"width:"+it.pct+"%\\"></div></div>";\n' +
'    h += "</div>";\n' +
'    return h;\n' +
'  }\n' +
'  function renderPipeline(rows){\n' +
'    if(!rows.length) return "<div class=\\"empty\\">Không có gói thầu nào khớp filter.</div>";\n' +
'    var groupBy = STATE_HS.groupBy || "tt";\n' +
'    var groupLabel = {tt:"Trạng thái", hinh:"Hình thức LCNT", ut:"Cấp độ ưu tiên", cb:"CB phụ trách", khoa:"Khoa"}[groupBy] || "Trạng thái";\n' +
'    var buckets = {};\n' +
'    rows.forEach(function(r){\n' +
'      if(r.ht) return;\n' +
'      var k;\n' +
'      if(groupBy==="hinh") k = r.hinh || "(Chưa rõ hình thức)";\n' +
'      else if(groupBy==="ut") k = ((r.ut||"").toLowerCase().indexOf("cao")>=0) ? "🔴 Ưu tiên CAO" : "Bình thường";\n' +
'      else if(groupBy==="cb") k = r.cb || "(Chưa giao)";\n' +
'      else if(groupBy==="khoa") k = r.khoa || "(Chưa rõ khoa)";\n' +
'      else k = r.tt || "(Chưa phân loại)";\n' +
'      if(!buckets[k]) buckets[k]=[];\n' +
'      buckets[k].push(r);\n' +
'    });\n' +
'    var pipe = Object.keys(buckets).map(function(k){return {name:k, count:buckets[k].length, items:buckets[k]};}).sort(function(a,b){return b.count-a.count;});\n' +
'    if(!pipe.length) return "<div class=\\"empty\\">Tất cả gói thầu trong filter đã hoàn thành ✓</div>";\n' +
'    // v2.7.6: nếu chỉ có 1 nhóm → switch sang grid 3 cột (Kanban 1 cột thì vô nghĩa)\n' +
'    if(pipe.length===1){\n' +
'      var col = pipe[0];\n' +
'      var hg = "<div class=\\"hs-grid-banner\\">📋 <b>"+esc(col.name)+"</b> <span class=\\"hs-grid-cnt\\">"+col.count+" gói</span> <span class=\\"hs-grid-hint\\">— chỉ có 1 "+esc(groupLabel.toLowerCase())+", hiển thị grid để dễ scan. Đổi <b>Group by</b> để thấy cột phân nhóm khác.</span></div>";\n' +
'      hg += "<div class=\\"hs-grid\\">";\n' +
'      col.items.forEach(function(it){ hg += renderHSCardInner(it); });\n' +
'      hg += "</div>";\n' +
'      return hg;\n' +
'    }\n' +
'    var h = "<div class=\\"pipeline\\" data-groupby=\\""+groupBy+"\\">";\n' +
'    pipe.forEach(function(col){\n' +
'      h += "<div class=\\"col\\"><div class=\\"col-head\\">"+esc(col.name)+"<span class=\\"col-count\\">"+col.count+"</span></div><div class=\\"col-body\\">";\n' +
'      col.items.forEach(function(it){ h += renderHSCardInner(it); });\n' +
'      h += "</div></div>";\n' +
'    });\n' +
'    h += "</div>";\n' +
'    return h;\n' +
'  }\n' +
'  function renderTable(rows){\n' +
'    if(!rows.length) return "<div class=\\"empty\\">Không có gói thầu nào khớp filter.</div>";\n' +
'    rows = rows.slice().sort(function(a,b){\n' +
'      var aCAO=(a.ut||"").toLowerCase().indexOf("cao")>=0?0:1;\n' +
'      var bCAO=(b.ut||"").toLowerCase().indexOf("cao")>=0?0:1;\n' +
'      if(aCAO!==bCAO) return aCAO-bCAO;\n' +
'      var aTre=a.tre?0:1, bTre=b.tre?0:1;\n' +
'      if(aTre!==bTre) return aTre-bTre;\n' +
'      return (a.ht?1:0)-(b.ht?1:0);\n' +
'    });\n' +
'    var h = "<div class=\\"tbl-wrap\\"><table class=\\"tbl tbl-kt\\"><thead><tr><th class=\\"col-ten\\">Mã HS · Nội dung</th><th class=\\"col-cap\\">Cấp độ</th><th class=\\"col-ht\\">HT</th><th>Khoa · Cơ sở</th><th>Trạng thái</th><th>%</th><th>Giá trị</th><th>CB</th><th>Bước</th><th>Deadline</th><th>Vướng mắc</th></tr></thead><tbody>";\n' +
'    rows.forEach(function(r){\n' +
'      var isCAO=(r.ut||"").toLowerCase().indexOf("cao")>=0;\n' +
'      var pillU=isCAO?"red":"gray";\n' +
'      var pillT=(r.tt||"").indexOf("Đã trình")>=0?"green":(r.tt||"").indexOf("thẩm định")>=0?"blue":(r.tt||"").indexOf("chuẩn bị")>=0?"yellow":"gray";\n' +
'      var rowCls=r.ht?"row-done":"";\n' +
'      var dl=(r.dl||"")+(r.tre?" <span class=\\"tre-badge\\">Trễ "+r.tre+"n</span>":"");\n' +
'      var khoaCoso=esc(r.khoa)+(r.coso?"<div style=\\"font-size:10px;color:#6B7280;margin-top:2px\\">"+esc(r.coso)+"</div>":"");\n' +
'      var pct=r.pct!==null?(r.pct+"%"):"-";\n' +
'      var gt=r.gt?fmtVnd(r.gt):"-";\n' +
'      var hot=hsHotBadge(r, isCAO);\n' +
'      h += "<tr class=\\""+rowCls+"\\" data-type=\\"HS\\" data-id=\\""+esc(r.ma||r.nd)+"\\" data-tab=\\""+esc(TAB_NAME.HS)+"\\" data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'      h += "<td class=\\"col-ten\\">"+hot;\n' +
'      if(r.ma)h += "<span style=\\"font-size:11px;color:#60A5FA;font-weight:700;margin-right:6px\\">"+esc(r.ma)+"</span>";\n' +
'      h += "<div style=\\"font-size:12px;line-height:1.4;margin-top:2px\\">"+esc(r.nd.length>120?r.nd.substring(0,120)+"…":r.nd)+"</div></td>";\n' +
'      h += "<td class=\\"col-cap\\"><span class=\\"pill "+pillU+"\\">"+esc(r.ut||"-")+"</span></td>";\n' +
'      h += "<td class=\\"col-ht\\">"+(r.ht?"<span class=\\"ht-tick\\">✓</span>":"<span class=\\"ht-pending\\">⏳</span>")+"</td>";\n' +
'      h += "<td>"+khoaCoso+"</td>";\n' +
'      h += "<td><span class=\\"pill "+pillT+"\\">"+esc(r.tt||"-")+"</span></td>";\n' +
'      h += "<td class=\\"num\\">"+pct+"</td>";\n' +
'      h += "<td style=\\"font-size:11px;color:#60A5FA\\">"+gt+"</td>";\n' +
'      h += "<td style=\\"font-size:12px\\">"+esc(r.cb||"-")+"</td>";\n' +
'      h += "<td style=\\"max-width:220px;font-size:11px;color:#9CA3AF\\">"+esc(r.buoc)+"</td>";\n' +
'      h += "<td style=\\"font-size:11px\\">"+dl+"</td>";\n' +
'      h += "<td style=\\"max-width:200px;font-size:11px;color:#FCA5A5\\">"+esc(r.vuong)+"</td></tr>";\n' +
'    });\n' +
'    h += "</tbody></table></div>";\n' +
'    return h;\n' +
'  }\n' +
'  function applyHS(){\n' +
'    var q=$("#hs-search").value.toLowerCase();\n' +
'    var cs=$("#hs-coso").value, kh=$("#hs-khoa").value, cb=$("#hs-cb").value;\n' +
'    var tt=$("#hs-tt").value, hinh=$("#hs-hinh").value, ut=$("#hs-ut").value;\n' +
'    var hideDone=$("#hs-hide-done").checked;\n' +
'    var rows=d.rows.filter(function(r){\n' +
'      if(hideDone && r.ht) return false;\n' +
'      if(cs && r.coso!==cs) return false;\n' +
'      if(kh && r.khoa!==kh) return false;\n' +
'      if(cb && r.cb!==cb && r.cbph!==cb) return false;\n' +
'      if(tt && r.tt!==tt) return false;\n' +
'      if(hinh && r.hinh!==hinh) return false;\n' +
'      if(ut==="CAO" && (r.ut||"").toLowerCase().indexOf("cao")<0) return false;\n' +
'      if(ut==="Bình thường" && (r.ut||"").toLowerCase().indexOf("cao")>=0) return false;\n' +
'      if(q){var hay=((r.ma||"")+" "+(r.nd||"")+" "+(r.khoa||"")+" "+(r.cb||"")+" "+(r.vuong||"")+" "+(r.buoc||"")).toLowerCase();if(hay.indexOf(q)<0)return false;}\n' +
'      return true;\n' +
'    });\n' +
'    if(STATE_HS.view==="kanban") $("#hs-content").innerHTML = renderPipeline(rows);\n' +
'    else $("#hs-content").innerHTML = renderTable(rows);\n' +
'    $("#hs-count").textContent = rows.length+" / "+d.rows.length+" gói";\n' +
'    $$("#hs-content .kanban-card, #hs-content tbody tr").forEach(function(el){el.onclick=function(){openInApp(el);};});\n' +
'  }\n' +
'  $$("#view-hs .kt-chip[data-chip]").forEach(function(el){\n' +
'    el.onclick=function(){\n' +
'      var chip = el.getAttribute("data-chip");\n' +
'      $$("#view-hs .kt-chip").forEach(function(x){x.classList.remove("active");});\n' +
'      if(chip!=="reset") el.classList.add("active");\n' +
'      $("#hs-search").value=""; $("#hs-coso").value=""; $("#hs-khoa").value=""; $("#hs-cb").value="";\n' +
'      $("#hs-tt").value=""; $("#hs-hinh").value=""; $("#hs-ut").value="";\n' +
'      $("#hs-hide-done").checked=false;\n' +
'      if(chip==="cao") $("#hs-ut").value="CAO";\n' +
'      else if(chip==="vuong" || chip==="tre") $("#hs-hide-done").checked=true;\n' +
'      applyHS();\n' +
'      if(chip==="vuong"){\n' +
'        $$("#hs-content .kanban-card, #hs-content tbody tr").forEach(function(el){\n' +
'          var hasV = el.querySelector(".kanban-vuong") || (el.tagName==="TR" && el.querySelectorAll("td")[10] && el.querySelectorAll("td")[10].textContent.trim());\n' +
'          if(!hasV) el.style.display="none";\n' +
'        });\n' +
'      } else if(chip==="tre"){\n' +
'        $$("#hs-content .kanban-card, #hs-content tbody tr").forEach(function(el){\n' +
'          var hasHot = el.querySelector(".hot-badge.hb-critical, .hot-badge.hb-tre");\n' +
'          if(!hasHot) el.style.display="none";\n' +
'        });\n' +
'      }\n' +
'    };\n' +
'  });\n' +
'  $$("#view-hs .hs-vbtn").forEach(function(b){\n' +
'    b.onclick=function(){\n' +
'      $$("#view-hs .hs-vbtn").forEach(function(x){x.classList.remove("active");});\n' +
'      b.classList.add("active");\n' +
'      STATE_HS.view = b.getAttribute("data-view");\n' +
'      applyHS();\n' +
'    };\n' +
'  });\n' +
'  // v2.7.6: groupBy selector\n' +
'  var hgSel = $("#hs-group");\n' +
'  if(hgSel) hgSel.onchange = function(){ STATE_HS.groupBy = this.value; applyHS(); };\n' +
'  ["#hs-search","#hs-coso","#hs-khoa","#hs-cb","#hs-tt","#hs-hinh","#hs-ut","#hs-hide-done"].forEach(function(s){var el=$(s);if(el)el.oninput=el.onchange=applyHS;});\n' +
'  applyHS();\n' +
'}\n' +
/* Render VTTH */
'function renderVT(d){\n' +
'  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n' +
'  if(d.missing){$("#view-vt").innerHTML="<div class=\\"error\\">Chưa có tab \\""+esc("Nhóm vật tư tiêu hao- hóa chất")+"\\".</div>";return;}\n' +
'  if(d.rows.length===0){$("#view-vt").innerHTML = "<div class=\\"empty\\">Không có task vật tư / hóa chất nào.</div>";return;}\n' +
'  // Build filter options\n' +
'  var cosos = Array.from(new Set(d.rows.map(function(r){return r.coso;}).filter(Boolean))).sort();\n' +
'  var khoas = Array.from(new Set(d.rows.map(function(r){return r.khoa;}).filter(Boolean))).sort();\n' +
'  var loais = Array.from(new Set(d.rows.map(function(r){return r.loai;}).filter(Boolean))).sort();\n' +
'  var tts = Array.from(new Set(d.rows.map(function(r){return r.tt;}).filter(Boolean))).sort();\n' +
'  var cbs = (d.cbList || Array.from(new Set(d.rows.map(function(r){return r.cb;}).filter(Boolean))).sort());\n' +
'  // Summary stats\n' +
'  var stat = {total:d.rows.length, done:0, vuong:0, treDL:0, cao:0};\n' +
'  d.rows.forEach(function(r){\n' +
'    if(r.ht){ stat.done++; return; }\n' +
'    if(r.vuong) stat.vuong++;\n' +
'    if(r.tre) stat.treDL++;\n' +
'    if((r.ut||"").toLowerCase().indexOf("cao")>=0) stat.cao++;\n' +
'  });\n' +
'  var donePct = stat.total ? Math.round(stat.done/stat.total*100) : 0;\n' +
'  var html = "";\n' +
'  // Summary chips\n' +
'  html += "<div class=\\"kt-summary\\">";\n' +
'  html += "<button class=\\"kt-chip green\\" data-chip=\\"done\\" title=\\"Tỉ lệ hoàn thành\\"><span class=\\"kt-chip-icon\\">✓</span><div><span class=\\"kt-chip-num\\">"+stat.done+"<small style=\\"color:#9CA3AF;font-weight:400;font-size:14px\\"> / "+stat.total+"</small></span><span class=\\"kt-chip-lbl\\">đã hoàn thành ("+donePct+"%)</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip yellow\\" data-chip=\\"vuong\\"><span class=\\"kt-chip-icon\\">🚧</span><div><span class=\\"kt-chip-num\\">"+stat.vuong+"</span><span class=\\"kt-chip-lbl\\">vướng mắc</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip red\\" data-chip=\\"tre\\"><span class=\\"kt-chip-icon\\">⏰</span><div><span class=\\"kt-chip-num\\">"+stat.treDL+"</span><span class=\\"kt-chip-lbl\\">trễ deadline</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip red\\" data-chip=\\"cao\\"><span class=\\"kt-chip-icon\\">🔴</span><div><span class=\\"kt-chip-num\\">"+stat.cao+"</span><span class=\\"kt-chip-lbl\\">ưu tiên CAO</span></div></button>";\n' +
'  html += "<button class=\\"kt-chip\\" data-chip=\\"reset\\" title=\\"Reset filter\\">↻ Tất cả</button>";\n' +
'  html += "</div>";\n' +
'  // View toggle + Group-by\n' +
'  html += "<div class=\\"hs-toolbar\\">";\n' +
'  html += "<div class=\\"hs-view-toggle\\">";\n' +
'  html += "<button class=\\"hs-vbtn active\\" data-view=\\"table\\">📋 Bảng đầy đủ</button>";\n' +
'  html += "<button class=\\"hs-vbtn\\" data-view=\\"kanban\\">🗂 Pipeline</button>";\n' +
'  html += "</div>";\n' +
'  html += "<div class=\\"hs-groupby\\"><label>Group by:</label>";\n' +
'  html += "<select id=\\"vt-group\\"><option value=\\"tt\\">📋 Trạng thái</option><option value=\\"loai\\">🧪 Loại nhóm</option><option value=\\"ut\\">🔴 Cấp độ ưu tiên</option><option value=\\"khoa\\">🏥 Khoa</option><option value=\\"coso\\">🏢 Cơ sở</option><option value=\\"cb\\">👤 CB phụ trách</option></select>";\n' +
'  html += "</div>";\n' +
'  html += "</div>";\n' +
'  // Filter row\n' +
'  html += "<div class=\\"kt-filters\\">";\n' +
'  html += "<input id=\\"vt-search\\" placeholder=\\"🔍 Tìm loại / khoa / CB / vướng mắc / bước…\\">";\n' +
'  html += "<select id=\\"vt-coso\\"><option value=\\"\\">Tất cả cơ sở</option>"+cosos.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"vt-khoa\\"><option value=\\"\\">Tất cả khoa</option>"+khoas.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"vt-cb\\"><option value=\\"\\">Tất cả CB</option>"+cbs.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"vt-tt\\"><option value=\\"\\">Tất cả trạng thái</option>"+tts.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"vt-loai\\"><option value=\\"\\">Mọi loại</option>"+loais.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"vt-ut\\"><option value=\\"\\">Mọi cấp độ</option><option>CAO</option><option>Bình thường</option></select>";\n' +
'  html += "<label class=\\"toggle\\"><input type=\\"checkbox\\" id=\\"vt-hide-done\\"> Ẩn hoàn thành</label>";\n' +
'  html += "<span class=\\"badge\\" id=\\"vt-count\\">"+d.rows.length+" task</span>";\n' +
'  html += "</div>";\n' +
'  html += "<div id=\\"vt-content\\"></div>";\n' +
'  $("#view-vt").innerHTML = html;\n' +
'  var STATE_VT = {view:"table", groupBy:"tt"};\n' +
'  function vtHotBadge(r, isCAO){\n' +
'    if(isCAO && r.tre) return "<span class=\\"hot-badge hb-critical\\" title=\\"CAO + trễ\\">🔥 HOT</span>";\n' +
'    if(r.tre) return "<span class=\\"hot-badge hb-tre\\" title=\\"Trễ deadline\\">⏰</span>";\n' +
'    if(isCAO) return "<span class=\\"hot-badge hb-cao\\">CAO</span>";\n' +
'    return "";\n' +
'  }\n' +
'  function renderVTCardInner(r){\n' +
'    var isCAO = (r.ut||"").toLowerCase().indexOf("cao")>=0;\n' +
'    var cardCls = "kanban-card";\n' +
'    if(isCAO && r.tre) cardCls += " card-critical";\n' +
'    else if(isCAO) cardCls += " card-cao";\n' +
'    else if(r.tre) cardCls += " card-tre";\n' +
'    if(r.ht) cardCls += " row-done";\n' +
'    var hot = vtHotBadge(r, isCAO);\n' +
'    var h = "<div class=\\""+cardCls+"\\" data-type=\\"VT\\" data-id=\\""+esc(r.ma||r.loai)+"\\" data-tab=\\""+esc(TAB_NAME.VT)+"\\" data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'    h += "<div class=\\"ma\\">"+hot+esc(r.loai||"")+(r.ht?" <span class=\\"ht-tick\\" style=\\"font-size:11px\\">✓</span>":"")+"</div>";\n' +
'    h += "<div class=\\"meta\\" style=\\"margin-top:6px\\">";\n' +
'    h += "<span title=\\""+esc(r.khoa+(r.coso?" · "+r.coso:""))+"\\">📍 "+esc((r.khoa||"").substring(0,18))+(r.khoa.length>18?"…":"")+"</span>";\n' +
'    if(r.tt)h += "<span class=\\"pill blue\\" style=\\"font-size:10px;padding:1px 6px\\">"+esc(r.tt)+"</span>";\n' +
'    h += "</div>";\n' +
'    if(r.buoc)h += "<div class=\\"kanban-vuong\\" style=\\"color:#D1D5DB;font-style:normal\\">"+esc(String(r.buoc).substring(0,90))+(r.buoc.length>90?"…":"")+"</div>";\n' +
'    if(r.cb)h += "<div class=\\"kanban-cb\\">👤 "+esc(r.cb)+"</div>";\n' +
'    if(r.dl||r.pct!==null){\n' +
'      h += "<div class=\\"meta\\" style=\\"margin-top:5px;font-size:11px\\">";\n' +
'      if(r.dl)h += "<span style=\\"color:#9CA3AF\\">⏱ "+esc(r.dl)+"</span>"+(r.tre?" <span class=\\"tre-badge\\">Trễ "+r.tre+"n</span>":"");\n' +
'      if(r.pct !== null && r.pct !== undefined && r.pct !== "") {\n' +
'        var p = String(r.pct);\n' +
'        h += "<span style=\\"color:#60A5FA\\">"+(p.indexOf(\'%\')<0?p+"%":p)+"</span>";\n' +
'      }\n' +
'      h += "</div>";\n' +
'    }\n' +
'    if(r.pct !== null && r.pct !== undefined && r.pct !== "") h += "<div class=\\"progress\\"><div class=\\"progress-fill\\" style=\\"width:"+ (String(r.pct).indexOf(\'%\')<0?r.pct+"%":r.pct) +"\\"></div></div>";\n' +
'    if(r.vuong)h += "<div class=\\"kanban-vuong\\">⚠ "+esc(String(r.vuong).substring(0,80))+(r.vuong.length>80?"…":"")+"</div>";\n' +
'    h += "</div>";\n' +
'    return h;\n' +
'  }\n' +
'  function renderVTKanban(rows){\n' +
'    if(!rows.length) return "<div class=\\"empty\\">Không có task nào khớp filter.</div>";\n' +
'    var groupBy = STATE_VT.groupBy || "tt";\n' +
'    var groupLabel = {tt:"Trạng thái", loai:"Loại nhóm", ut:"Cấp độ ưu tiên", khoa:"Khoa", coso:"Cơ sở", cb:"CB phụ trách"}[groupBy] || "Trạng thái";\n' +
'    var buckets = {};\n' +
'    rows.forEach(function(r){\n' +
'      var k;\n' +
'      if(groupBy==="loai") k = r.loai || "(Chưa rõ loại)";\n' +
'      else if(groupBy==="ut") k = ((r.ut||"").toLowerCase().indexOf("cao")>=0)?"🔴 Ưu tiên CAO":"Bình thường";\n' +
'      else if(groupBy==="khoa") k = r.khoa || "(Chưa rõ khoa)";\n' +
'      else if(groupBy==="coso") k = r.coso || "(Chưa rõ cơ sở)";\n' +
'      else if(groupBy==="cb") k = r.cb || "(Chưa giao)";\n' +
'      else k = r.tt || "(Chưa phân loại)";\n' +
'      if(!buckets[k]) buckets[k]=[];\n' +
'      buckets[k].push(r);\n' +
'    });\n' +
'    var pipe = Object.keys(buckets).map(function(k){return {name:k, count:buckets[k].length, items:buckets[k]};}).sort(function(a,b){return b.count-a.count;});\n' +
'    if(!pipe.length) return "<div class=\\"empty\\">Không có task nào khớp filter.</div>";\n' +
'    if(pipe.length===1){\n' +
'      var col = pipe[0];\n' +
'      var hg = "<div class=\\"hs-grid-banner\\">📋 <b>"+esc(col.name)+"</b> <span class=\\"hs-grid-cnt\\">"+col.count+" task</span> <span class=\\"hs-grid-hint\\">— chỉ có 1 "+esc(groupLabel.toLowerCase())+", hiển thị grid để dễ scan. Đổi <b>Group by</b> để thấy cột phân nhóm khác.</span></div>";\n' +
'      hg += "<div class=\\"hs-grid\\">";\n' +
'      col.items.forEach(function(it){ hg += renderVTCardInner(it); });\n' +
'      hg += "</div>";\n' +
'      return hg;\n' +
'    }\n' +
'    var h = "<div class=\\"pipeline\\" data-groupby=\\""+groupBy+"\\">";\n' +
'    pipe.forEach(function(col){\n' +
'      h += "<div class=\\"col\\"><div class=\\"col-head\\">"+esc(col.name)+"<span class=\\"col-count\\">"+col.count+"</span></div><div class=\\"col-body\\">";\n' +
'      col.items.forEach(function(it){ h += renderVTCardInner(it); });\n' +
'      h += "</div></div>";\n' +
'    });\n' +
'    h += "</div>";\n' +
'    return h;\n' +
'  }\n' +
'  function renderVTTable(rows){\n' +
'    if(!rows.length) return "<div class=\\"empty\\">Không có task nào khớp filter.</div>";\n' +
'    var h = "<div class=\\"tbl-wrap\\"><table class=\\"tbl tbl-kt\\"><thead><tr><th class=\\"col-ten\\">Loại nhóm</th><th class=\\"col-cap\\">Cấp độ</th><th class=\\"col-ht\\">HT</th><th>Khoa · Cơ sở</th><th>Trạng thái</th><th>%</th><th>CB</th><th>Bước</th><th>Deadline</th><th>Vướng mắc</th></tr></thead><tbody>";\n' +
'    rows.forEach(function(r){\n' +
'      var isCAO = (r.ut||"").toLowerCase().indexOf("cao")>=0;\n' +
'      var pillU = isCAO?"red":"gray";\n' +
'      var rowCls = r.ht?"row-done":"";\n' +
'      var dl = (r.dl||"")+(r.tre?" <span class=\\"tre-badge\\">Trễ "+r.tre+"n</span>":"");\n' +
'      var khoaCoso = esc(r.khoa)+(r.coso?"<div style=\\"font-size:10px;color:#6B7280;margin-top:2px\\">"+esc(r.coso)+"</div>":"");\n' +
'      var pct = (r.pct !== null && r.pct !== undefined && r.pct !== "") ? (String(r.pct).indexOf(\'%\') < 0 ? r.pct + "%" : r.pct) : "-";\n' +
'      var hot = vtHotBadge(r, isCAO);\n' +
'      h += "<tr class=\\""+rowCls+"\\" data-type=\\"VT\\" data-id=\\""+esc(r.ma||r.loai)+"\\" data-tab=\\""+esc(TAB_NAME.VT)+"\\" data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'      h += "<td class=\\"col-ten\\">"+hot+"<b>"+esc(r.loai||"-")+"</b></td>";\n' +
'      h += "<td class=\\"col-cap\\"><span class=\\"pill "+pillU+"\\">"+esc(r.ut||"-")+"</span></td>";\n' +
'      h += "<td class=\\"col-ht\\">"+(r.ht?"<span class=\\"ht-tick\\">✓</span>":"<span class=\\"ht-pending\\">⏳</span>")+"</td>";\n' +
'      h += "<td>"+khoaCoso+"</td>";\n' +
'      h += "<td><span class=\\"pill blue\\">"+esc(r.tt||"-")+"</span></td>";\n' +
'      h += "<td class=\\"num\\">"+pct+"</td>";\n' +
'      h += "<td style=\\"font-size:12px\\">"+esc(r.cb||"-")+"</td>";\n' +
'      h += "<td style=\\"max-width:220px;font-size:11px;color:#9CA3AF\\">"+esc(r.buoc)+"</td>";\n' +
'      h += "<td style=\\"font-size:11px\\">"+dl+"</td>";\n' +
'      h += "<td style=\\"max-width:200px;font-size:11px;color:#FCA5A5\\">"+esc(r.vuong)+"</td>";\n' +
'      h += "</tr>";\n' +
'    });\n' +
'    h += "</tbody></table></div>";\n' +
'    return h;\n' +
'  }\n' +
'  function applyVT(){\n' +
'    var q=$("#vt-search").value.toLowerCase();\n' +
'    var cs=$("#vt-coso").value, kh=$("#vt-khoa").value, cb=$("#vt-cb").value;\n' +
'    var tt=$("#vt-tt").value, loai=$("#vt-loai").value, ut=$("#vt-ut").value;\n' +
'    var hideDone=$("#vt-hide-done").checked;\n' +
'    var rows=d.rows.filter(function(r){\n' +
'      if(hideDone && r.ht) return false;\n' +
'      if(cs && r.coso!==cs) return false;\n' +
'      if(kh && r.khoa!==kh) return false;\n' +
'      if(cb && r.cb!==cb) return false;\n' +
'      if(tt && r.tt!==tt) return false;\n' +
'      if(loai && r.loai!==loai) return false;\n' +
'      if(ut==="CAO" && (r.ut||"").toLowerCase().indexOf("cao")<0) return false;\n' +
'      if(ut==="Bình thường" && (r.ut||"").toLowerCase().indexOf("cao")>=0) return false;\n' +
'      if(q){var hay=((r.loai||"")+" "+(r.khoa||"")+" "+(r.cb||"")+" "+(r.vuong||"")+" "+(r.buoc||"")+" "+(r.tt||"")).toLowerCase();if(hay.indexOf(q)<0)return false;}\n' +
'      return true;\n' +
'    });\n' +
'    rows.sort(function(a,b){\n' +
'      var aCAO=(a.ut||"").toLowerCase().indexOf("cao")>=0?0:1;\n' +
'      var bCAO=(b.ut||"").toLowerCase().indexOf("cao")>=0?0:1;\n' +
'      if(aCAO!==bCAO) return aCAO-bCAO;\n' +
'      var aTre=a.tre?0:1, bTre=b.tre?0:1;\n' +
'      if(aTre!==bTre) return aTre-bTre;\n' +
'      return (a.ht?1:0)-(b.ht?1:0);\n' +
'    });\n' +
'    if(STATE_VT.view==="kanban") $("#vt-content").innerHTML = renderVTKanban(rows);\n' +
'    else $("#vt-content").innerHTML = renderVTTable(rows);\n' +
'    $("#vt-count").textContent = rows.length+" / "+d.rows.length+" task";\n' +
'    $$("#vt-content .kanban-card, #vt-content tbody tr").forEach(function(el){el.onclick=function(){openInApp(el);};});\n' +
'  }\n' +
'  // Bind chip clicks\n' +
'  $$("#view-vt .kt-chip[data-chip]").forEach(function(el){\n' +
'    el.onclick=function(){\n' +
'      var chip = el.getAttribute("data-chip");\n' +
'      $$("#view-vt .kt-chip").forEach(function(x){x.classList.remove("active");});\n' +
'      if(chip!=="reset") el.classList.add("active");\n' +
'      $("#vt-search").value=""; $("#vt-coso").value=""; $("#vt-khoa").value=""; $("#vt-cb").value="";\n' +
'      $("#vt-tt").value=""; $("#vt-loai").value=""; $("#vt-ut").value="";\n' +
'      $("#vt-hide-done").checked=false;\n' +
'      if(chip==="cao") $("#vt-ut").value="CAO";\n' +
'      else if(chip==="vuong" || chip==="tre") $("#vt-hide-done").checked=true;\n' +
'      applyVT();\n' +
'      if(chip==="vuong"){\n' +
'        $$("#vt-content .kanban-card, #vt-content tbody tr").forEach(function(el){\n' +
'          var hasV = el.querySelector(".kanban-vuong:last-child") || (el.tagName==="TR" && el.querySelectorAll("td")[9] && el.querySelectorAll("td")[9].textContent.trim());\n' +
'          if(!hasV) el.style.display="none";\n' +
'        });\n' +
'      } else if(chip==="tre"){\n' +
'        $$("#vt-content .kanban-card, #vt-content tbody tr").forEach(function(el){\n' +
'          var hasHot = el.querySelector(".hot-badge.hb-critical, .hot-badge.hb-tre");\n' +
'          if(!hasHot) el.style.display="none";\n' +
'        });\n' +
'      }\n' +
'    };\n' +
'  });\n' +
'  // Bind view toggle\n' +
'  $$("#view-vt .hs-vbtn").forEach(function(b){\n' +
'    b.onclick=function(){\n' +
'      $$("#view-vt .hs-vbtn").forEach(function(x){x.classList.remove("active");});\n' +
'      b.classList.add("active");\n' +
'      STATE_VT.view = b.getAttribute("data-view");\n' +
'      applyVT();\n' +
'    };\n' +
'  });\n' +
'  // Bind groupBy\n' +
'  var vtSel = $("#vt-group");\n' +
'  if(vtSel) vtSel.onchange = function(){ STATE_VT.groupBy = this.value; applyVT(); };\n' +
'  ["#vt-search","#vt-coso","#vt-khoa","#vt-cb","#vt-tt","#vt-loai","#vt-ut","#vt-hide-done"].forEach(function(s){var el=$(s);if(el)el.oninput=el.onchange=applyVT;});\n' +
'  applyVT();\n' +
'}\n' +
/* Render Kho */
'function renderKho(d){\n' +
'  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n' +
'  var html = "";\n' +
'  // v2.8: Forecast cung ứng — section trên cùng\n' +
'  if(d.forecast && d.forecast.items.length){\n' +
'    var f = d.forecast; var s = f.stats;\n' +
'    html += "<div class=\\"sh\\">🔮 Dự đoán cung ứng VTTH / Hóa chất <small style=\\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\\">map DOH với tiến trình gói thầu — gợi ý hành động khẩn cấp</small></div>";\n' +
'    // Banner cảnh báo nếu có Mức 1/2 chưa có giải pháp\n' +
'    if(s.l1NoSolution>0){\n' +
'      html += "<div class=\\"forecast-alert critical\\">🚨 <b>"+s.l1NoSolution+" mặt hàng</b> có DOH dưới 30 ngày VÀ <b>chưa có gói thầu / chưa shortcut</b> — phải triển khai chào giá trực tuyến hoặc chỉ định thầu / mua sắm trực tiếp NGAY HÔM NAY.</div>";\n' +
'    }\n' +
'    if(s.l2NoSolution>0){\n' +
'      html += "<div class=\\"forecast-alert warn\\">⚠ <b>"+s.l2NoSolution+" mặt hàng</b> có DOH 30-60 ngày VÀ chưa đến bước \\"Đánh giá HSDT\\" — cần đôn đốc tiến độ tuần này.</div>";\n' +
'    }\n' +
'    // v2.8.1: Banner cảnh báo tồn đọng >1 năm\n' +
'    if(s.stagnantLong>0){\n' +
'      html += "<div class=\\"forecast-alert stag\\">🚨 <b>"+s.stagnantLong+" mặt hàng</b> tồn đọng <b>trên 1 năm</b> — bắt buộc rà soát: điều chuyển khoa khác / chuyển dùng / thanh lý nếu hết hạn.</div>";\n' +
'    } else if(s.stagnantHigh>0){\n' +
'      html += "<div class=\\"forecast-alert stag-mid\\">⚠ <b>"+s.stagnantHigh+" mặt hàng</b> tồn đọng <b>6 tháng - 1 năm</b> — đề xuất chuyển khoa khác / xử lý theo quy định.</div>";\n' +
'    }\n' +
'    // 5 KPI cards\n' +
'    html += "<div class=\\"forecast-stats\\">";\n' +
'    html += "<div class=\\"fs-card fs-red\\"><div class=\\"fs-num\\">"+s.l1+"</div><div class=\\"fs-lbl\\">🚨 Mức 1 — KHẨN<br><small>DOH < 30 ngày</small></div></div>";\n' +
'    html += "<div class=\\"fs-card fs-orange\\"><div class=\\"fs-num\\">"+s.l2+"</div><div class=\\"fs-lbl\\">🔴 Mức 2 — CAO<br><small>30-60 ngày</small></div></div>";\n' +
'    html += "<div class=\\"fs-card fs-yellow\\"><div class=\\"fs-num\\">"+s.l3+"</div><div class=\\"fs-lbl\\">🟡 Mức 3 — TRUNG<br><small>60-90 ngày</small></div></div>";\n' +
'    html += "<div class=\\"fs-card fs-blue\\"><div class=\\"fs-num\\">"+s.l4+"</div><div class=\\"fs-lbl\\">🟢 Mức 4 — Trong tầm<br><small>90-180 ngày</small></div></div>";\n' +
'    html += "<div class=\\"fs-card fs-gray\\"><div class=\\"fs-num\\">"+(s.stagnant - s.stagnantHigh - s.stagnantLong)+"</div><div class=\\"fs-lbl\\">📦 Tồn cao<br><small>90-180 ngày</small></div></div>";\n' +
'    html += "<div class=\\"fs-card fs-darkgray\\"><div class=\\"fs-num\\">"+s.stagnantHigh+"</div><div class=\\"fs-lbl\\">⚠ Tồn 6 tháng<br><small>180-365 ngày</small></div></div>";\n' +
'    html += "<div class=\\"fs-card fs-darkred\\"><div class=\\"fs-num\\">"+s.stagnantLong+"</div><div class=\\"fs-lbl\\">🚨 Tồn >1 năm<br><small>≥ 365 ngày</small></div></div>";\n' +
'    html += "</div>";\n' +
'    // Bảng top 10\n' +
'    var top = f.items.filter(function(it){return it.risk.level<=3;}).slice(0,10);\n' +
'    if(\!top.length){ top = f.items.slice(0,10); }\n' +
'    if(top.length){\n' +
'      html += "<div class=\\"forecast-table\\">";\n' +
'      html += "<div class=\\"ft-head\\">Top "+top.length+" mặt hàng cần xử lý — sắp xếp theo mức độ khẩn cấp</div>";\n' +
'      top.forEach(function(it){\n' +
'        var r = it.risk;\n' +
'        var okCls = r.ok ? "ft-ok" : "ft-not-ok";\n' +
'        html += "<div class=\\"ft-row ft-"+r.color+" "+okCls+"\\" data-tab=\\""+esc(TAB_NAME.KHO_5A)+"\\" data-title=\\""+esc(it.ten||"Hàng kho 5A")+"\\" data-gid=\\""+it.gid+"\\" data-row=\\""+it.idx+"\\">";\n' +
'        html += "<div class=\\"ft-lvl\\">"+r.label+"</div>";\n' +
'        html += "<div class=\\"ft-info\\">";\n' +
'        html += "<div class=\\"ft-name\\">"+esc(it.ten);\n' +
'        if(it.ma) html += " <span class=\\"ft-code\\">"+esc(it.ma)+"</span>";\n' +
'        if(it.risk.stagnant && r.level <= 3) html += " <span class=\\"ft-stag-tag\\">📦 dùng ít</span>";\n' +
'        html += "</div>";\n' +
'        html += "<div class=\\"ft-meta\\">📍 "+esc(it.khoa||"?")+" · 📦 Tồn <b>"+esc(it.ton||"0")+"</b> · ⏱ DOH <b style=\\"color:"+(r.color==="red"?"#F87171":r.color==="orange"?"#FB923C":r.color==="yellow"?"#FBBF24":"#60A5FA")+"\\">"+r.doh+"n</b></div>";\n' +
'        html += "</div>";\n' +
'        html += "<div class=\\"ft-action\\">"+esc(r.action)+"</div>";\n' +
'        html += "</div>";\n' +
'      });\n' +
'      html += "</div>";\n' +
'    }\n' +
'    // Bonus: section Tồn đọng riêng nếu có\n' +
'    // v2.8.1: 2 section tồn đọng theo tier — Tồn dài >1 năm trước, sau đó Tồn 6 tháng\n' +
'    var stagnantLong = f.items.filter(function(it){return it.risk.stagnantTier===3;});\n' +
'    var stagnantHigh = f.items.filter(function(it){return it.risk.stagnantTier===2;}).slice(0,8);\n' +
'    var stagnantMid = f.items.filter(function(it){return it.risk.stagnantTier===1 && it.risk.level>=4;}).slice(0,5);\n' +
'    function renderStagSection(title, hint, items, lvlLabel, rowCls){\n' +
'      if(\!items.length) return "";\n' +
'      var hh = "<div class=\\"sh\\" style=\\"margin-top:18px\\">"+title+" <small style=\\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\\">"+hint+"</small></div>";\n' +
'      hh += "<div class=\\"forecast-table\\">";\n' +
'      items.forEach(function(it){\n' +
'        var r = it.risk;\n' +
'        hh += "<div class=\\"ft-row "+rowCls+"\\" data-tab=\\""+esc(TAB_NAME.KHO_5A)+"\\" data-title=\\""+esc(it.ten)+"\\" data-gid=\\""+it.gid+"\\" data-row=\\""+it.idx+"\\">";\n' +
'        hh += "<div class=\\"ft-lvl\\">"+lvlLabel+"</div>";\n' +
'        hh += "<div class=\\"ft-info\\"><div class=\\"ft-name\\">"+esc(it.ten)+(it.ma?" <span class=\\"ft-code\\">"+esc(it.ma)+"</span>":"")+"</div>";\n' +
'        hh += "<div class=\\"ft-meta\\">📍 "+esc(it.khoa||"?")+" · Tồn <b>"+esc(it.ton||"0")+"</b> · DOH <b style=\\"color:#FB923C\\">"+r.doh+"n</b> ("+Math.round(r.doh/30)+" tháng)</div></div>";\n' +
'        hh += "<div class=\\"ft-action\\">"+esc(r.action)+"</div></div>";\n' +
'      });\n' +
'      hh += "</div>";\n' +
'      return hh;\n' +
'    }\n' +
'    html += renderStagSection("🚨 Tồn đọng > 1 năm — BẮT BUỘC xử lý", "(DOH ≥ 365 ngày — rà soát điều chuyển / thanh lý nếu hết hạn)", stagnantLong, "🚨 >1 năm", "ft-darkred ft-not-ok");\n' +
'    html += renderStagSection("⚠ Tồn đọng 6 tháng - 1 năm", "(DOH 180-365 ngày — đề xuất chuyển khoa khác / xử lý theo quy định)", stagnantHigh, "⚠ 6 tháng", "ft-orange");\n' +
'    html += renderStagSection("📦 Tồn cao 3-6 tháng", "(DOH 90-180 ngày — kiểm tra nhu cầu sử dụng, có thể chỉ là dùng tự nhiên thấp)", stagnantMid, "📦 3-6 tháng", "ft-gray");\n' +
'  }\n' +
'  // Bảng tồn 5A đầy đủ — giữ nguyên\n' +
'  html += "<div class=\\"sh\\" style=\\"margin-top:22px\\">📦 Tồn kho ("+d.ton.length+" mặt hàng) — bảng đầy đủ, click row để xem chuỗi liên kết</div>";\n' +
'  if(d.ton.length===0)html += "<div class=\\"empty\\">Tab 5A chưa có dữ liệu. Chạy bootstrap() và nhập tồn kho vào.</div>";\n' +
'  else{\n' +
'    html += "<div class=\\"tbl-wrap\\"><table class=\\"tbl tbl-kho-5a\\"><thead><tr><th></th><th>Mã</th><th>Tên VTTH</th><th>Loại</th><th class=\\"num\\">Tồn</th><th class=\\"num\\">MIN</th><th class=\\"num\\">DOH</th><th>Cảnh báo</th><th>Khoa nhiều nhất</th><th class=\\"num\\">Số khoa chờ</th><th>Đề xuất</th></tr></thead><tbody>";\n' +
'    d.ton.forEach(function(r){\n' +
'      var pill = r.tt.indexOf("ĐỎ")>=0?"red":r.tt.indexOf("VÀNG")>=0?"yellow":r.tt.indexOf("XANH")>=0?"green":"gray";\n' +
'      var dohTxt = r.doh!==null && r.doh!==undefined ? r.doh + " ngày" : "-";\n' +
'      var dohClass = r.doh!==null && r.doh<=3 ? "color:#EF4444;font-weight:700" : r.doh!==null && r.doh<=7 ? "color:#F59E0B;font-weight:600" : "";\n' +
'      html += "<tr class=\\"kho-5a-row\\" data-ma=\\""+esc(r.ma||r.ten)+"\\" data-tab=\\""+esc(TAB_NAME.KHO_5A)+"\\" data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'      html += "<td class=\\"expand-cell\\"><span class=\\"expand-toggle\\">▶</span></td>";\n' +
'      html += "<td style=\\"font-size:11px;color:#60A5FA\\">"+esc(r.ma)+"</td>";\n' +
'      html += "<td><b>"+esc(r.ten)+"</b></td>";\n' +
'      html += "<td style=\\"font-size:11px\\">"+esc(r.loai)+"</td>";\n' +
'      html += "<td class=\\"num\\"><b>"+esc(r.ton)+"</b></td>";\n' +
'      html += "<td class=\\"num\\" style=\\"color:#9CA3AF\\">"+esc(r.min)+"</td>";\n' +
'      html += "<td class=\\"num\\" style=\\""+dohClass+"\\">"+dohTxt+"</td>";\n' +
'      html += "<td><span class=\\"pill "+pill+"\\">"+esc(r.tt)+"</span></td>";\n' +
'      html += "<td style=\\"font-size:11px\\">"+esc(r.khoamax)+"</td>";\n' +
'      html += "<td class=\\"num\\">"+esc(r.sokhoa)+"</td>";\n' +
'      html += "<td style=\\"max-width:240px;font-size:11px\\">"+esc(r.dexuat)+"</td></tr>";\n' +
'    });\n' +
'    html += "</tbody></table></div>";\n' +
'  }\n' +
'  // 5B\n' +
'  var pending = d.dexuat.filter(function(r){return r.tt!=="Đã cấp đủ";});\n' +
'  html += "<div class=\\"sh\\">📋 Đề xuất chờ duyệt ("+pending.length+"/"+d.dexuat.length+")</div>";\n' +
'  if(d.dexuat.length===0)html += "<div class=\\"empty\\">Tab 5B chưa có dữ liệu.</div>";\n' +
'  else{\n' +
'    html += "<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Ngày YC</th><th>Khoa</th><th>Người YC</th><th>VTTH</th><th class=\\"num\\">SL</th><th>Mức ưu tiên</th><th>Trạng thái</th><th>CB Kho</th><th>Ngày DK cấp</th></tr></thead><tbody>";\n' +
'    d.dexuat.forEach(function(r){\n' +
'      var pillUT = r.ut.indexOf("CAO")>=0?"red":"gray";\n' +
'      var pillTT = r.tt==="Đã cấp đủ"?"green":r.tt==="Chờ tiếp nhận"?"yellow":r.tt==="Đang xử lý"?"blue":"gray";\n' +
'      html += "<tr data-tab=\\""+esc(TAB_NAME.KHO_5B)+"\\" data-title=\\""+esc(r.vtth||"Đề xuất 5B")+"\\" data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'      html += "<td style=\\"font-size:11px\\">"+esc(r.ngay)+"</td>";\n' +
'      html += "<td>"+esc(r.khoa)+"</td>";\n' +
'      html += "<td style=\\"font-size:12px\\">"+esc(r.nguoi)+"</td>";\n' +
'      html += "<td><b>"+esc(r.vtth)+"</b></td>";\n' +
'      html += "<td class=\\"num\\">"+esc(r.sl)+" "+esc(r.dv)+"</td>";\n' +
'      html += "<td><span class=\\"pill "+pillUT+"\\">"+esc(r.ut||"-")+"</span></td>";\n' +
'      html += "<td><span class=\\"pill "+pillTT+"\\">"+esc(r.tt||"-")+"</span></td>";\n' +
'      html += "<td style=\\"font-size:12px\\">"+esc(r.cb)+"</td>";\n' +
'      html += "<td style=\\"font-size:11px\\">"+esc(r.ndk)+"</td></tr>";\n' +
'    });\n' +
'    html += "</tbody></table></div>";\n' +
'  }\n' +
'  $("#view-kho").innerHTML = html;\n' +
'  $$("#view-kho .ft-row[data-tab]").forEach(function(el){el.onclick=function(){openInApp(el);};});\n' +
'  $$("#view-kho tbody tr.kho-5a-row").forEach(function(tr){\n' +
'    tr.onclick = function(e){\n' +
'      if(e.target.closest(".expand-cell") || e.shiftKey){ toggleKhoExpand(tr); } \n' +
'      else { openInApp(tr); }\n' +
'    };\n' +
'  });\n' +
'  $$("#view-kho tbody tr:not(.kho-5a-row)").forEach(function(tr){tr.onclick=function(){openInApp(tr);};});\n' +
'}\n' +
'function toggleKhoExpand(tr){\n' +
'  if(tr.classList.contains("expanded")){\n' +
'    tr.classList.remove("expanded");\n' +
'    var next = tr.nextElementSibling; if(next && next.classList.contains("kho-expand-row"))next.remove();\n' +
'    return;\n' +
'  }\n' +
'  tr.classList.add("expanded");\n' +
'  var expRow = document.createElement("tr"); expRow.className = "kho-expand-row";\n' +
'  expRow.innerHTML = "<td colspan=\\"11\\"><div class=\\"loading\\">Đang tải chi tiết lazy-load…</div></td>";\n' +
'  tr.parentNode.insertBefore(expRow, tr.nextSibling);\n' +
'  google.script.run.withSuccessHandler(function(d){ renderKhoExpand(d, expRow); }).getKhoDetail(tr.dataset.ma);\n' +
'}\n' +
'function renderKhoExpand(d, rowEl){\n' +
'  if(d.error){rowEl.innerHTML = "<td colspan=\\"11\\"><div class=\\"error\\">"+esc(d.error)+"</div></td>";return;}\n' +
'  var html = "<td colspan=\\"11\\"><div class=\\"kho-expand-wrap\\">";\n' +
'  /* Col 1: VT liên quan */\n' +
'  html += "<div class=\\"kho-expand-col\\"><h4>🧪 Task VTTH khớp ("+d.vt.length+")</h4>";\n' +
'  if(\!d.vt.length)html += "<div class=\\"empty-mini\\">Không có task VTTH link với mã này</div>";\n' +
'  else d.vt.forEach(function(v){\n' +
'    html += "<div class=\\"kho-link-card\\" onclick=\\"openDetail(\'VT\',\'"+esc(v.ma||v.ten)+"\')\\">";\n' +
'    html += "<div class=\\"nm\\">"+esc(v.ten)+"</div><div class=\\"sm\\">"+esc(v.khoa)+" · "+esc(v.tt)+"</div></div>";\n' +
'  });\n' +
'  html += "</div>";\n' +
'  /* Col 2: HS liên quan */\n' +
'  html += "<div class=\\"kho-expand-col\\"><h4>📁 Gói thầu mua sắm ("+d.hs.length+")</h4>";\n' +
'  if(\!d.hs.length)html += "<div class=\\"empty-mini\\">Chưa nằm trong gói thầu nào</div>";\n' +
'  else d.hs.forEach(function(h){\n' +
'    html += "<div class=\\"kho-link-card\\" onclick=\\"openDetail(\'HS\',\'"+esc(h.ma||h.ten)+"\')\\">";\n' +
'    html += "<div class=\\"nm\\">"+esc(h.ma||h.ten)+"</div><div class=\\"sm\\">"+esc(h.tt)+" · "+esc(h.cb)+"</div></div>";\n' +
'  });\n' +
'  html += "</div>";\n' +
'  /* Col 3: Queue 5B */\n' +
'  html += "<div class=\\"kho-expand-col\\"><h4>📋 Đề xuất 5B đang chờ ("+d.queueOpen+")</h4>";\n' +
'  if(\!d.queue.length)html += "<div class=\\"empty-mini\\">Không có đề xuất nào</div>";\n' +
'  else d.queue.forEach(function(q){\n' +
'    var done = (q.tt||"").indexOf("Đã cấp đủ")>=0;\n' +
'    html += "<div class=\\"kho-queue-line\\"><span class=\\"kn\\">"+esc(q.khoa)+"</span><span class=\\"qty\\">"+esc(q.sl)+" "+esc(q.dv)+"</span><span class=\\"dt\\">"+esc(q.ngayYC)+"</span><span class=\\"st\\" style=\\"color:"+(done?"#10B981":"#FBBF24")+"\\">"+esc(q.tt)+"</span></div>";\n' +
'  });\n' +
'  html += "</div>";\n' +
'  /* Action */\n' +
'  var openLink = d.sheetUrl + "/edit#gid=" + d.stock.gid + "&range=A" + d.stock.rowNum;\n' +
'  html += "<div class=\\"kho-expand-action\\">💡 Nhấn <b>Shift + Click</b> vào hàng để mở nhanh Google Sheet tại dòng: <b>"+d.stock.rowNum+"</b> | <a href=\\""+openLink+"\\" target=\\"_blank\\" style=\\"color:#fff\\">Mở link trực tiếp →</a></div>";\n' +
'  html += "</div></td>";\n' +
'  rowEl.innerHTML = html;\n' +
'}\n' +
/* Render Theo Khoa */
'function renderKhoaList(d){\n' +
'  if(d && d.error){$("#view-khoa").innerHTML="<div class=\\"error\\">⚠ "+esc(d.error)+"</div>";return;}\n' +
'  var list=(d && d.khoaList)||[];\n' +
'  var html = "";\n' +
'  if(STATE.overview && STATE.overview.topKhoa && STATE.overview.topKhoa.length){\n' +
'    html += "<div class=\\"sh\\" style=\\"margin-top:0;font-size:13px\\">🔥 Truy cập nhanh khoa nóng nhất</div>";\n' +
'    html += "<div style=\\"display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px\\">";\n' +
'    STATE.overview.topKhoa.forEach(function(tk){\n' +
'      html += "<button class=\\"btn btn-secondary\\" style=\\"background:#0F1B2D;border-color:#1E3A5F;color:#93C5FD;padding:6px 12px;border-radius:6px\\" onclick=\\"document.getElementById(\'khoa-select\').value=\'"+esc(tk.khoa)+"\';document.getElementById(\'khoa-select\').dispatchEvent(new Event(\'change\'));\\">🏥 "+esc(tk.khoa)+" <span style=\\"background:#DC2626;color:#fff;border-radius:10px;padding:2px 6px;font-size:10px;margin-left:4px\\">"+tk.count+"</span></button>";\n' +
'    });\n' +
'    html += "</div>";\n' +
'  }\n' +
'  html += "<div class=\\"filters\\"><label style=\\"color:#9CA3AF;font-weight:600\\">Tìm khoa cụ thể:</label>";\n' +
'  html += "<select id=\\"khoa-select\\" style=\\"min-width:300px;flex:1\\"><option value=\\"\\">— Chọn khoa —</option>";\n' +
'  list.forEach(function(k){html += "<option>"+esc(k)+"</option>";});\n' +
'  html += "</select>";\n' +
'  html += "<span class=\\"badge\\" style=\\"background:#374151;color:#D1D5DB;white-space:nowrap\\">"+list.length+" khoa</span>";\n' +
'  html += "</div>";\n' +
'  html += "<div id=\\"khoa-detail\\"><div class=\\"empty\\" style=\\"padding:40px 14px\\">👆 Chọn khoa ở trên hoặc bấm vào các nút truy cập nhanh để xem toàn cảnh các vấn đề (kỹ thuật + hồ sơ + vật tư + kho).</div></div>";\n' +
'  $("#view-khoa").innerHTML = html;\n' +
'  $("#khoa-select").onchange = function(){\n' +
'    var k = this.value;\n' +
'    if(\!k){$("#khoa-detail").innerHTML="<div class=\\"empty\\">Chưa chọn khoa.</div>";return;}\n' +
'    $("#khoa-detail").innerHTML = "<div class=\\"loading\\">Đang tải dữ liệu khoa "+esc(k)+"…</div>";\n' +
'    var done=false;\n' +
'    setTimeout(function(){if(\!done)$("#khoa-detail").innerHTML="<div class=\\"error\\">⚠ Quá 20s không có phản hồi. Refresh trang (Ctrl+F5) hoặc mở console (F12) xem lỗi.</div>";},20000);\n' +
'    google.script.run.withSuccessHandler(function(d){done=true;renderKhoaDetail(d);}).withFailureHandler(function(e){done=true;$("#khoa-detail").innerHTML="<div class=\\"error\\">⚠ Lỗi tải khoa: "+esc(e && e.message || e)+"</div>";}).getByKhoa(k);\n' +
'  };\n' +
'}\n' +
'function renderKhoaDetail(d){\n' +
'  if(d && d.error){$("#khoa-detail").innerHTML="<div class=\\"error\\">⚠ "+esc(d.error)+"</div>";return;}\n' +
'  if(\!d || \!d.summary){$("#khoa-detail").innerHTML="<div class=\\"error\\">⚠ Server trả dữ liệu rỗng.</div>";return;}\n' +
'  var s = d.summary;\n' +
'  var html = "<div class=\\"sh\\">🏥 Khoa: "+esc(d.khoa)+"</div>";\n' +
'  html += "<div class=\\"khoa-summary\\">";\n' +
'  html += "<div class=\\"khoa-card\\"><h4>🔧 Kỹ thuật</h4><div class=\\"v\\"><span style=\\"color:#10B981\\">"+s.doneKT+"</span><span style=\\"font-size:20px;color:#6B7280;margin:0 4px;font-weight:400\\">/</span><span style=\\"color:"+(s.totalKT>0?"#EF4444":"#9CA3AF")+"\\">"+s.totalKT+"</span></div><div style=\\"font-size:11px;color:#9CA3AF\\">đã xong / tổng máy</div></div>";\n' +
'  html += "<div class=\\"khoa-card\\"><h4>📁 Hồ sơ</h4><div class=\\"v\\"><span style=\\"color:#10B981\\">"+s.doneHS+"</span><span style=\\"font-size:20px;color:#6B7280;margin:0 4px;font-weight:400\\">/</span><span style=\\"color:"+(s.totalHS>0?"#F59E0B":"#9CA3AF")+"\\">"+s.totalHS+"</span></div><div style=\\"font-size:11px;color:#9CA3AF\\">đã xong / tổng hồ sơ</div></div>";\n' +
'  html += "<div class=\\"khoa-card\\"><h4>🧪 Vật tư</h4><div class=\\"v\\"><span style=\\"color:"+(s.totalVT>0?"#3B82F6":"#9CA3AF")+"\\">"+s.totalVT+"</span></div><div style=\\"font-size:11px;color:#9CA3AF\\">task liên quan</div></div>";\n' +
'  html += "<div class=\\"khoa-card\\"><h4>📦 YC kho</h4><div class=\\"v\\"><span style=\\"color:"+(s.totalKho>0?"#8B5CF6":"#9CA3AF")+"\\">"+s.totalKho+"</span></div><div style=\\"font-size:11px;color:#9CA3AF\\">yêu cầu đang chờ</div></div>";\n' +
'  html += "</div>";\n' +
'  // KT\n' +
'  if(d.kt.length){\n' +
'    html += "<div class=\\"sh\\">🔧 Máy của khoa</div>";\n' +
'    html += "<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Tên máy</th><th>Tình trạng</th><th>Chi tiết</th><th>CB</th><th>Bước</th><th>Deadline</th><th>HT</th></tr></thead><tbody>";\n' +
'    d.kt.forEach(function(r){\n' +
'      var pill = (r.tinh||"").toLowerCase().indexOf("đang sửa")>=0?"yellow":(r.tinh||"").toLowerCase().indexOf("thanh lý")>=0?"gray":"blue";\n' +
'      html += "<tr data-type=\\"KT\\" data-id=\\""+esc(r.ten)+"\\" data-tab=\\""+esc(TAB_NAME.KT)+"\\" data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'      html += "<td><b>"+esc(r.ten)+"</b></td>";\n' +
'      html += "<td><span class=\\"pill "+pill+"\\">"+esc(r.tinh)+"</span></td>";\n' +
'      html += "<td style=\\"max-width:300px;font-size:12px\\">"+esc(r.ct)+"</td>";\n' +
'      html += "<td style=\\"font-size:12px\\">"+esc(r.cb)+"</td>";\n' +
'      html += "<td style=\\"max-width:240px;font-size:11px;color:#9CA3AF\\">"+esc(r.buoc)+"</td>";\n' +
'      html += "<td style=\\"font-size:11px\\">"+esc(r.dl)+"</td>";\n' +
'      html += "<td>"+(r.ht?"✓":"⏳")+"</td></tr>";\n' +
'    });\n' +
'    html += "</tbody></table></div>";\n' +
'  }\n' +
'  // HS\n' +
'  if(d.hs.length){\n' +
'    html += "<div class=\\"sh\\">📁 Gói thầu / hồ sơ của khoa</div>";\n' +
'    html += "<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Mã HS</th><th>Nội dung</th><th>Trạng thái</th><th>%</th><th>CB</th><th>Deadline</th><th>HT</th></tr></thead><tbody>";\n' +
'    d.hs.forEach(function(r){\n' +
'      html += "<tr data-type=\\"HS\\" data-id=\\""+esc(r.ma||r.nd)+"\\" data-tab=\\""+esc(TAB_NAME.HS)+"\\" data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'      html += "<td><b style=\\"color:#60A5FA\\">"+esc(r.ma)+"</b></td>";\n' +
'      html += "<td style=\\"max-width:340px;font-size:12px\\">"+esc(r.nd)+"</td>";\n' +
'      html += "<td><span class=\\"pill blue\\">"+esc(r.tt)+"</span></td>";\n' +
'      html += "<td class=\\"num\\">"+(r.pct!==null?r.pct+"%":"-")+"</td>";\n' +
'      html += "<td style=\\"font-size:12px\\">"+esc(r.cb)+"</td>";\n' +
'      html += "<td style=\\"font-size:11px\\">"+esc(r.dl)+"</td>";\n' +
'      html += "<td>"+(r.ht?"✓":"⏳")+"</td></tr>";\n' +
'    });\n' +
'    html += "</tbody></table></div>";\n' +
'  }\n' +
'  // VT\n' +
'  if(d.vt.length){\n' +
'    html += "<div class=\\"sh\\">🧪 Task VTTH liên quan</div>";\n' +
'    html += "<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Loại</th><th>Trạng thái</th><th>%</th><th>CB</th><th>Deadline</th></tr></thead><tbody>";\n' +
'    d.vt.forEach(function(r){\n' +
'      html += "<tr data-type=\\"VT\\" data-id=\\""+esc(r.loai)+"\\" data-tab=\\""+esc(TAB_NAME.VT)+"\\" data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'      html += "<td><b>"+esc(r.loai)+"</b></td>";\n' +
'      html += "<td>"+esc(r.tt)+"</td>";\n' +
'      html += "<td class=\\"num\\">"+(r.pct!==null?r.pct+"%":"-")+"</td>";\n' +
'      html += "<td style=\\"font-size:12px\\">"+esc(r.cb)+"</td>";\n' +
'      html += "<td style=\\"font-size:11px\\">"+esc(r.dl)+"</td></tr>";\n' +
'    });\n' +
'    html += "</tbody></table></div>";\n' +
'  }\n' +
'  // Kho\n' +
'  if(d.kho.length){\n' +
'    html += "<div class=\\"sh\\">📦 Yêu cầu kho của khoa</div>";\n' +
'    html += "<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Ngày YC</th><th>VTTH</th><th>SL</th><th>Ưu tiên</th><th>Trạng thái</th></tr></thead><tbody>";\n' +
'    d.kho.forEach(function(r){\n' +
'      var pillUT = (r.ut||"").indexOf("CAO")>=0?"red":"gray";\n' +
'      html += "<tr data-tab=\\""+esc(TAB_NAME.KHO_5B)+"\\" data-title=\\""+esc(r.vtth||"YC kho")+"\\" data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'      html += "<td style=\\"font-size:11px\\">"+esc(r.ngay)+"</td>";\n' +
'      html += "<td><b>"+esc(r.vtth)+"</b></td>";\n' +
'      html += "<td class=\\"num\\">"+esc(r.sl)+"</td>";\n' +
'      html += "<td><span class=\\"pill "+pillUT+"\\">"+esc(r.ut)+"</span></td>";\n' +
'      html += "<td>"+esc(r.tt)+"</td></tr>";\n' +
'    });\n' +
'    html += "</tbody></table></div>";\n' +
'  }\n' +
'  if(!d.kt.length && !d.hs.length && !d.vt.length && !d.kho.length){\n' +
'    html += "<div class=\\"empty\\">Khoa này không có vấn đề nào — tốt!</div>";\n' +
'  }\n' +
'  $("#khoa-detail").innerHTML = html;\n' +
'  $$("#khoa-detail tbody tr").forEach(function(tr){if(tr.dataset.gid)tr.onclick=function(){openInApp(tr);};});\n' +
'}\n' +
/* Loaders */
'function showErr(err){var s=$("#view-"+STATE.currentView);if(s)s.innerHTML="<div class=\\"error\\">⚠️ Lỗi tải dữ liệu: "+esc(err && err.message || err)+"</div>";}\n' +
'function loadView(v){\n' +
'  if(v==="overview"){google.script.run.withSuccessHandler(renderOverview).withFailureHandler(showErr).getOverview();}\n' +
'  else if(v==="baocao"){renderBaoCao();}\n' +
'  else if(v==="kt"){google.script.run.withSuccessHandler(renderKT).withFailureHandler(showErr).getKyThuat();}\n' +
'  else if(v==="hs"){google.script.run.withSuccessHandler(renderHS).withFailureHandler(showErr).getHoSo();}\n' +
'  else if(v==="vt"){google.script.run.withSuccessHandler(renderVT).withFailureHandler(showErr).getVTTH();}\n' +
'  else if(v==="kho"){google.script.run.withSuccessHandler(renderKho).withFailureHandler(showErr).getKho();}\n' +
'  else if(v==="khoa"){google.script.run.withSuccessHandler(renderKhoaList).withFailureHandler(showErr).getByKhoa("");}\n' +
'  else if(v==="lienket"){google.script.run.withSuccessHandler(renderLienket).withFailureHandler(showErr).getLinkedChains();}\n' +
'}\n' +
'loadView("overview");\n' +
/* v2.8: Bottom nav IIFE */
'(function(){\n' +
'  var moreMenu = document.getElementById("mob-more-menu");\n' +
'  // Helper: switch view bằng cách click tab gốc (dùng handler có sẵn)\n' +
'  function mobSwitch(v) {\n' +
'    // Sync mob nav active state\n' +
'    $$("#mob-nav .mnb[data-view]").forEach(function(b){\n' +
'      b.classList.toggle("active", b.dataset.view === v);\n' +
'    });\n' +
'    var inExtra = ["vt","khoa","lienket"].indexOf(v) >= 0;\n' +
'    var mm = document.getElementById("mnb-more");\n' +
'    if(mm) mm.classList.toggle("active", inExtra);\n' +
'    if(moreMenu) moreMenu.classList.remove("open");\n' +
'    // Trigger tab gốc\n' +
'    var tabBtn = document.querySelector("#tabs button[data-view=\\"" + v + "\\"]");\n' +
'    if(tabBtn) { tabBtn.click(); return; }\n' +
'    // Fallback nếu tab ẩn không click được\n' +
'    $$("section.view").forEach(function(x){x.classList.remove("active");});\n' +
'    var s = document.getElementById("view-" + v);\n' +
'    if(s) s.classList.add("active");\n' +
'    STATE.currentView = v;\n' +
'    loadView(v);\n' +
'  }\n' +
'  // Bottom nav buttons\n' +
'  $$("#mob-nav .mnb[data-view]").forEach(function(btn){\n' +
'    btn.addEventListener("click", function(e){\n' +
'      e.stopPropagation();\n' +
'      mobSwitch(btn.dataset.view);\n' +
'    });\n' +
'  });\n' +
'  // More button toggle\n' +
'  var mnbMore = document.getElementById("mnb-more");\n' +
'  if(mnbMore) mnbMore.addEventListener("click", function(e){\n' +
'    e.stopPropagation();\n' +
'    if(moreMenu) moreMenu.classList.toggle("open");\n' +
'  });\n' +
'  // Extra menu items\n' +
'  $$(".mnb-extra").forEach(function(btn){\n' +
'    btn.addEventListener("click", function(e){\n' +
'      e.stopPropagation();\n' +
'      mobSwitch(btn.dataset.view);\n' +
'    });\n' +
'  });\n' +
'  // Close More menu khi tap outside\n' +
'  document.addEventListener("click", function(){\n' +
'    if(moreMenu) moreMenu.classList.remove("open");\n' +
'  });\n' +
'  // Sync mob nav khi click top tab (desktop/DevTools)\n' +
'  $$("#tabs button").forEach(function(b){\n' +
'    b.addEventListener("click", function(){\n' +
'      var v = b.dataset.view;\n' +
'      $$("#mob-nav .mnb[data-view]").forEach(function(mb){\n' +
'        mb.classList.toggle("active", mb.dataset.view === v);\n' +
'      });\n' +
'      var inExtra2 = ["vt","khoa","lienket"].indexOf(v) >= 0;\n' +
'      var mm2 = document.getElementById("mnb-more");\n' +
'      if(mm2) mm2.classList.toggle("active", inExtra2);\n' +
'    });\n' +
'  });\n' +
'  // Collapsible hot list sections\n' +
'  function initHotCollapsible(){\n' +
'    $$("#view-overview .hot-team-header:not([data-c-init])").forEach(function(hdr){\n' +
'      hdr.setAttribute("data-c-init","1");\n' +
'      hdr.addEventListener("click", function(){\n' +
'        var sec = hdr.closest(".hot-team-section");\n' +
'        if(sec) sec.classList.toggle("collapsed");\n' +
'      });\n' +
'    });\n' +
'  }\n' +
'  var ov = document.getElementById("view-overview");\n' +
'  if(ov){\n' +
'    var mo = new MutationObserver(initHotCollapsible);\n' +
'    mo.observe(ov, {childList:true, subtree:false});\n' +
'  }\n' +
'  initHotCollapsible();\n' +
'  // v2.8: Search toggle on mobile\n' +
'  var btnSrch = document.getElementById("btn-search-mob");\n' +
'  var srchWrap = document.querySelector(".search-wrap");\n' +
'  var srchInput = document.getElementById("search");\n' +
'  if(btnSrch && srchWrap){\n' +
'    btnSrch.addEventListener("click", function(e){\n' +
'      e.stopPropagation();\n' +
'      srchWrap.classList.toggle("mob-open");\n' +
'      if(srchWrap.classList.contains("mob-open") && srchInput) srchInput.focus();\n' +
'    });\n' +
'    document.addEventListener("keydown", function(e){\n' +
'      if(e.key === "Escape") srchWrap.classList.remove("mob-open");\n' +
'    });\n' +
'  }\n' +
'})();\n' +
/* Auto-refresh overview every 120s */
'setInterval(function(){\n' +
'  if(STATE.currentView==="overview"&&!document.querySelector("#modal.show"))loadView("overview");\n' +
'},120000);\n' +
'})();\n' +
'</script>\n' +
'</body></html>';



/**
 * v2.10: Maintenance and Warranty Tracking Summary
 */
function _summaryMaintenance(kt, linkIdx) {
  const out = { l1:0, l2:0, noSolution:0, top: [] };
  if(!kt || kt.missing) return out;

  const cTen = _findCol(kt.headers, "Tên Thiết Bị", "Tên TB");
  const cKhoa = _findCol(kt.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
  const cBH = _findCol(kt.headers, LINK_COL.KT_BH_DATE);
  const cBTNext = _findCol(kt.headers, LINK_COL.KT_BT_NEXT);
  const cHT = _findCol(kt.headers, "Đã Hoàn Thành", "Đã HT");

  if(cTen < 0) return out;

  const today = new Date();
  const warning30 = new Date(); warning30.setDate(today.getDate() + 30);
  const danger7 = new Date(); danger7.setDate(today.getDate() + 7);

  kt.rows.forEach((row, i) => {
    if(_isDone(row[cHT])) return;
    
    const ten = (row[cTen]||"").toString().trim();
    if(!ten) return;

    const bhDate = _toDate(row[cBH]);
    const btNext = _toDate(row[cBTNext]);
    
    let level = 0;
    let label = "";
    let action = "";

    if(bhDate && bhDate <= warning30) {
      level = bhDate <= danger7 ? 2 : 1;
      label = "Hết bảo hành";
      action = "Dự kiến hết hạn: " + Utilities.formatDate(bhDate, TIMEZONE, "dd/MM/yyyy");
    } else if(btNext && btNext <= warning30) {
      const isDue = btNext <= today;
      level = isDue ? 2 : 1;
      label = isDue ? "Quá hạn bảo trì" : "Sắp đến lịch bảo trì";
      action = "Ngày dự kiến: " + Utilities.formatDate(btNext, TIMEZONE, "dd/MM/yyyy");
    }

    if(level > 0) {
      if(level === 1) out.l1++; else out.l2++;
      const risk = _getSupplyRisk({ ten: ten, rowNum: i+2 }, linkIdx);
      if(!risk || !risk.ok) out.noSolution++;

      out.top.push({
        ten: ten,
        khoa: (row[cKhoa]||"").toString().trim(),
        level: level,
        label: label,
        action: action,
        ok: risk ? risk.ok : true
      });
    }
  });

  out.top.sort((a,b) => b.level - a.level);
  out.top = out.top.slice(0, 5);
  return out;
}
