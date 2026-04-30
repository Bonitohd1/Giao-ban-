/**
 * ============================================================================
 *  BỆNH VIỆN K — PHÒNG VT-TBYT — HỆ THỐNG GIAO BAN v2.1
 * ----------------------------------------------------------------------------
 *  THỨ TỰ CHẠY LẦN ĐẦU:
 *    1) bootstrap()         — Tự tạo các tab dm_*, cfg, 5A, 5B (1 lần duy nhất).
 *    2) setupTriggers()     — Cài 3 trigger định kỳ (1 lần).
 *    3) Deploy Web App      — Triển khai → URL chiếu giao ban (làm 1 lần).
 *
 *  CÁC FUNCTION KHÁC:
 *    runAggregator()        — Cập nhật tab "Dashboard" (chạy mỗi 15 phút).
 *    sendMorningBrief()     — Email Brief Sáng (7:30 mỗi ngày).
 *    flagHotIssues()        — Quét điểm nóng (chạy 8h, 11h, 14h, 17h).
 *    prepareBriefingMode()  — Popup tóm tắt cho Sếp trước họp GĐ.
 *    doGet()                — Web app dashboard (HTML chiếu lên màn hình lớn).
 * ============================================================================
 */

// ============================================================================
//  CONFIG  (Sếp sửa các hằng số dưới đây)
// ============================================================================
const SHEET_ID = "18Dvv9lYosbfqIiH4uge4HMpIL-vaPxalQw5BzEfbFQ4";
const TIMEZONE = "Asia/Ho_Chi_Minh";

const EMAIL_TRUONG_PHONG = "ducphamhn01@gmail.com";
const EMAIL_TO_KY_THUAT = "";
const EMAIL_TO_HO_SO    = "";
const EMAIL_TO_VT       = "";
const EMAIL_TO_KHO      = "";

const TAB = {
  KY_THUAT:    "Nhóm kỹ thuật",
  KY_THUAT_DS: "Nhóm kỹ thuật- DS TB quản lý",
  VTTH:        "Nhóm vật tư tiêu hao- hóa chất",
  HO_SO:       "Nhóm Hồ sơ",
  KHO_5A:      "5A. Tổ kho - Tồn",
  KHO_5B:      "5B. Tổ kho - Đề xuất",
  CFG:         "cfg_threshold",
  DM_KHOA:     "dm_khoa",
  DM_CB:       "dm_canbo",
  DM_CS:       "dm_co_so",
  DASHBOARD:   "Dashboard",
  LOG_HOT:     "log_hot_issues"
};

// ============================================================================
//  MENU
// ============================================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📊 Giao ban")
    .addItem("🚀 Bootstrap (tạo tab lần đầu)", "bootstrap")
    .addSeparator()
    .addItem("🔄 Cập nhật Dashboard ngay", "runAggregator")
    .addItem("📧 Gửi Brief Sáng (test)", "sendMorningBrief")
    .addItem("🔥 Quét điểm nóng (test)", "flagHotIssues")
    .addItem("📋 Briefing mode (trước họp GĐ)", "prepareBriefingMode")
    .addSeparator()
    .addItem("⚙️ Cài đặt Triggers (1 lần)", "setupTriggers")
    .addItem("🌐 Lấy URL Web App", "showWebAppUrl")
    .addToUi();
}

// ============================================================================
//  SEED DATA — phục vụ bootstrap()
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
  ["Kỹ thuật", "Số ngày trễ Deadline (TB hỏng)", "ngày",     0,  7, "Yellow: đã trễ. Red: ≥ 7 ngày."],
  ["Kỹ thuật", "Tỷ lệ TB hỏng / tổng TB",        "%",       10, 20, "Yellow: 10-20%. Red: ≥ 20%."],
  ["Kỹ thuật", "Số TB hỏng tại khoa trọng yếu", "máy",      1,  3, "Yellow: 1-2. Red: ≥ 3."],
  ["Hồ sơ",    "Số ngày trễ tiến độ gói thầu",   "ngày",     0, 14, "Yellow: đã trễ. Red: ≥ 14 ngày."],
  ["Hồ sơ",    "Số gói thầu đang vướng",         "gói",      1,  3, "Yellow: 1-2. Red: ≥ 3."],
  ["Vật tư",   "Số ngày trễ ký HĐ/Thanh toán",   "ngày",     0, 10, "Yellow: đã trễ. Red: ≥ 10 ngày."],
  ["Vật tư",   "Số HĐ chờ ký quá lâu",           "HĐ",       1,  3, "Yellow: có HĐ chờ. Red: ≥ 3."],
  ["Kho",      "Tồn dưới định mức tối thiểu",    "%",       80, 50, "% so với min. Yellow: ≤80%. Red: ≤50%."],
  ["Kho",      "Số ngày tồn (DOH)",              "ngày",     7,  3, "Yellow: 7 ngày. Red: ≤ 3."],
  ["Kho",      "Số khoa cùng yêu cầu 1 mặt hàng","khoa",     2,  4, "Yellow: 2-3. Red: ≥ 4."],
  ["Kho",      "Số yêu cầu khoa trọng yếu chưa cấp","yêu cầu",1, 2, "Yellow: 1. Red: ≥ 2."],
];

// ============================================================================
//  BOOTSTRAP — tự tạo các tab mới + đổ data + validation
// ============================================================================
function bootstrap() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    "🚀 Bootstrap setup",
    "Sẽ tự tạo các tab MỚI:\n  • dm_co_so, dm_canbo, dm_khoa\n  • cfg_threshold\n  • 5A. Tổ kho - Tồn\n  • 5B. Tổ kho - Đề xuất\n\nTab nào đã có sẽ bỏ qua. KHÔNG đụng vào dữ liệu cũ.\n\nTiếp tục?",
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
  if (_setup5A(ss)) created.push("5A. Tổ kho - Tồn"); else skipped.push("5A. Tổ kho - Tồn");
  if (_setup5B(ss)) created.push("5B. Tổ kho - Đề xuất"); else skipped.push("5B. Tổ kho - Đề xuất");

  let msg = "✅ Hoàn thành!\n\n";
  if (created.length) msg += "Đã tạo:\n  • " + created.join("\n  • ") + "\n\n";
  if (skipped.length) msg += "Bỏ qua (đã tồn tại):\n  • " + skipped.join("\n  • ") + "\n\n";
  msg += "Bước tiếp theo:\n  1) Chạy setupTriggers() để cài trigger định kỳ.\n  2) Deploy Web App (xem 'Lấy URL Web App' trong menu).";
  ui.alert(msg);
}

function _hdr(sheet, headers) {
  const r = sheet.getRange(1, 1, 1, headers.length);
  r.setValues([headers]).setFontWeight("bold").setBackground("#1F4E78").setFontColor("#FFFFFF")
   .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, sheet.getMaxColumns()).setFontFamily("Arial");
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
  // Highlight khoa trọng yếu
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
  s.getRange(2, 4, SEED_CFG.length, 2).setBackground("#FFF2CC"); // ngưỡng = ô vàng (sửa được)
  s.setColumnWidth(1, 100); s.setColumnWidth(2, 280); s.setColumnWidth(3, 80);
  s.setColumnWidth(4, 100); s.setColumnWidth(5, 100); s.setColumnWidth(6, 400);
  return true;
}

function _setup5A(ss) {
  if (ss.getSheetByName(TAB.KHO_5A)) return false;
  const s = ss.insertSheet(TAB.KHO_5A);
  const headers = ["STT","Mã VTTH","Tên VTTH","Đơn vị","Loại","Cơ sở","CB phụ trách",
    "Tồn đầu kỳ","Nhập trong kỳ","Xuất trong kỳ","Tồn hiện tại","Định mức MIN","Định mức MAX",
    "Trạng thái cảnh báo","Số ngày tồn (DOH)","Khoa yêu cầu nhiều nhất","Số khoa đang chờ",
    "Đề xuất xử lý","Ghi chú / Cập nhật"];
  _hdr(s, headers);

  // Sample 10 rows + formula columns (K, N, O)
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

  // Conditional formatting cột N (Trạng thái cảnh báo)
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

  // Data validations
  _addListValidation(s, "E2:E1000", "Vật tư,Hóa chất,Linh kiện,Khác");
  _addRangeValidation(s, "F2:F1000", ss.getSheetByName(TAB.DM_CS), "A2:A5");
  _addRangeValidation(s, "G2:G1000", ss.getSheetByName(TAB.DM_CB), "A2:A33");

  // Widths
  const w = [50,90,260,70,110,90,160,80,80,80,90,80,80,180,90,180,100,250,250];
  w.forEach((width, i) => s.setColumnWidth(i + 1, width));
  s.setFrozenRows(1);
  return true;
}

function _setup5B(ss) {
  if (ss.getSheetByName(TAB.KHO_5B)) return false;
  const s = ss.insertSheet(TAB.KHO_5B);
  const headers = ["STT","Ngày yêu cầu","Khoa yêu cầu","Cơ sở","Người yêu cầu","VTTH yêu cầu",
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

  // Format cột ngày
  s.getRange("B2:B1000").setNumberFormat("dd/mm/yyyy");
  s.getRange("L2:M1000").setNumberFormat("dd/mm/yyyy");

  // Validations
  _addRangeValidation(s, "C2:C1000", ss.getSheetByName(TAB.DM_KHOA), "B2:B50");
  _addRangeValidation(s, "D2:D1000", ss.getSheetByName(TAB.DM_CS), "A2:A5");
  _addRangeValidation(s, "K2:K1000", ss.getSheetByName(TAB.DM_CB), "A2:A33");
  _addListValidation(s, "J2:J1000", "Chờ tiếp nhận,Đang xử lý,Đã cấp đủ,Cấp một phần,Từ chối,Tạm hoãn");

  // CF cột I (Mức ưu tiên)
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
//  TRIGGERS
// ============================================================================
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ScriptApp.newTrigger("onEdit").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("runAggregator").timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger("sendMorningBrief").timeBased().atHour(7).nearMinute(30).everyDays(1).create();
  [8, 11, 14, 17].forEach(h => {
    ScriptApp.newTrigger("flagHotIssues").timeBased().atHour(h).nearMinute(0).everyDays(1).create();
  });
  SpreadsheetApp.getUi().alert("✅ Đã cài " + ScriptApp.getProjectTriggers().length + " trigger.");
}

// ============================================================================
//  ON EDIT
// ============================================================================
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const row = e.range.getRow();
  if (row < 2) return;

  try {
    const log = _getOrCreateSheet("_change_log", ["Thời điểm","Tổ","Sheet","Ô","Giá trị mới","Người sửa"]);
    log.appendRow([new Date(), _mapTeam(sheetName), sheetName, e.range.getA1Notation(),
      String(e.value || "").substring(0, 200), e.user ? e.user.getEmail() : ""]);
  } catch (err) { Logger.log("onEdit log err: " + err); }

  if ([TAB.KHO_5A, TAB.KHO_5B].indexOf(sheetName) >= 0) {
    const sttCell = sheet.getRange(row, 1);
    if (!sttCell.getValue() && e.range.getColumn() === 2) sttCell.setValue(row - 1);
  }
}

function _mapTeam(name) {
  if (name.indexOf("kỹ thuật") >= 0) return "Kỹ thuật";
  if (name.indexOf("Hồ sơ") >= 0) return "Hồ sơ";
  if (name.indexOf("vật tư") >= 0 || name.indexOf("VTTH") >= 0) return "Vật tư";
  if (name.indexOf("kho") >= 0 || name.indexOf("Kho") >= 0) return "Kho";
  return "Khác";
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
//  AGGREGATOR (tab Dashboard)
// ============================================================================
function runAggregator() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const dash = _getOrCreateSheet(TAB.DASHBOARD, []);
  dash.clear();

  dash.getRange("B2").setValue("DASHBOARD GIAO BAN PHÒNG VT-TBYT")
    .setFontSize(16).setFontWeight("bold").setFontColor("#1F4E78").setFontFamily("Arial");
  dash.getRange("B3").setValue("Cập nhật: " + Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy HH:mm"))
    .setFontStyle("italic").setFontColor("#595959");

  let row = 5;
  const stats = _computeStats();

  row = _renderBlock(dash, row, "1. KỸ THUẬT — Thiết bị hỏng / đang sửa", [
    ["Tổng đầu việc", stats.kt.total],
    ["Đã hoàn thành", stats.kt.done],
    ["Đang xử lý",    stats.kt.inProgress],
    ["⚠️ Trễ deadline",      stats.kt.overdue,      stats.kt.overdue > 0 ? "#FFC7CE" : null],
    ["🔴 ƯU TIÊN CAO",       stats.kt.priorityHigh, stats.kt.priorityHigh > 0 ? "#FFC7CE" : null],
  ]);

  row = _renderBlock(dash, row + 1, "2. HỒ SƠ — Gói thầu / quy trình", [
    ["Tổng đầu việc", stats.hs.total],
    ["Đang xử lý",    stats.hs.inProgress],
    ["⚠️ Vướng mắc",   stats.hs.stuck,   stats.hs.stuck > 0 ? "#FFC7CE" : null],
    ["⚠️ Trễ deadline",stats.hs.overdue, stats.hs.overdue > 0 ? "#FFC7CE" : null],
  ]);

  row = _renderBlock(dash, row + 1, "3. VẬT TƯ TIÊU HAO - HOÁ CHẤT", [
    ["Tổng đầu việc",            stats.vt.total],
    ["🔴 Ưu tiên CAO",           stats.vt.priorityHigh, stats.vt.priorityHigh > 0 ? "#FFC7CE" : null],
    ["⚠️ Vướng / chờ duyệt",      stats.vt.stuck,        stats.vt.stuck > 0 ? "#FFC7CE" : null],
  ]);

  row = _renderBlock(dash, row + 1, "4. KHO — Tồn & Đề xuất", [
    ["🔴 Mã ĐỎ",                  stats.kho.red,         stats.kho.red > 0 ? "#FFC7CE" : null],
    ["🟡 Mã VÀNG",                stats.kho.yellow,      stats.kho.yellow > 0 ? "#FFEB9C" : null],
    ["Yêu cầu chờ tiếp nhận",     stats.kho.requestPending],
    ["🔴 Yêu cầu CAO chưa cấp",   stats.kho.requestHigh, stats.kho.requestHigh > 0 ? "#FFC7CE" : null],
  ]);

  row += 1;
  dash.getRange(row, 2).setValue("5. TOP ĐIỂM NÓNG")
    .setFontWeight("bold").setBackground("#C00000").setFontColor("#FFFFFF").setFontSize(12);
  dash.getRange(row, 2, 1, 4).merge();
  row++;
  if (stats.hot.length === 0) {
    dash.getRange(row, 2).setValue("(Không có điểm nóng — tốt!)")
      .setFontStyle("italic").setFontColor("#107C10");
  } else {
    stats.hot.slice(0, 5).forEach(h => {
      dash.getRange(row, 2).setValue("• " + h.team + " — " + h.title);
      dash.getRange(row, 2, 1, 4).merge();
      dash.getRange(row, 2).setFontColor("#C00000").setFontWeight("bold");
      row++;
    });
  }
  dash.setColumnWidth(1, 30); dash.setColumnWidth(2, 360);
  dash.setColumnWidth(3, 120); dash.setColumnWidth(4, 200);
}

function _renderBlock(sheet, startRow, title, items) {
  sheet.getRange(startRow, 2).setValue(title)
    .setFontWeight("bold").setBackground("#1F4E78").setFontColor("#FFFFFF").setFontSize(12);
  sheet.getRange(startRow, 2, 1, 3).merge();
  startRow++;
  items.forEach(it => {
    const [label, value, bg] = it;
    sheet.getRange(startRow, 2).setValue(label);
    sheet.getRange(startRow, 3).setValue(value).setHorizontalAlignment("center").setFontWeight("bold");
    if (bg) sheet.getRange(startRow, 2, 1, 2).setBackground(bg);
    startRow++;
  });
  return startRow;
}

// ============================================================================
//  COMPUTE STATS  (dùng chung cho Dashboard tab + Web App + Email)
// ============================================================================
function _computeStats() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const stats = { kt: {}, hs: {}, vt: {}, kho: {}, hot: [] };
  stats.kt = _analyzeSheet(ss, TAB.KY_THUAT, {
    statusCol: "Tình trạng", doneCol: "Đã Hoàn Thành", deadlineCol: "Deadline", priorityCol: "Cấp độ ưu tiên"
  });
  stats.hs = _analyzeSheet(ss, TAB.HO_SO, {
    statusCol: "Tình trạng", deadlineCol: "Deadline", stuckValue: "Vướng mắc"
  });
  stats.vt = _analyzeSheet(ss, TAB.VTTH, {
    statusCol: "Trạng thái", priorityCol: "Cấp độ ưu tiên", stuckValue: "Vướng mắc"
  });
  stats.kho = _analyzeKho(ss);
  stats.hot = _collectHot(ss, stats);
  return stats;
}

function _analyzeSheet(ss, tabName, opts) {
  const out = { total: 0, done: 0, inProgress: 0, overdue: 0, stuck: 0, priorityHigh: 0 };
  const sheet = ss.getSheetByName(tabName);
  if (!sheet) return out;
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return out;
  const h = data[0];
  const idx = (n) => h.indexOf(n);
  const iSt = opts.statusCol ? idx(opts.statusCol) : -1;
  const iDn = opts.doneCol ? idx(opts.doneCol) : -1;
  const iDl = opts.deadlineCol ? idx(opts.deadlineCol) : -1;
  const iPr = opts.priorityCol ? idx(opts.priorityCol) : -1;
  const today = new Date();

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row[0] && !row[1] && !row[2]) continue;
    out.total++;
    const isDone = iDn >= 0 && (String(row[iDn]).toUpperCase() === "X" || row[iDn] === "✓" || row[iDn] === true);
    if (isDone) out.done++; else out.inProgress++;
    if (iDl >= 0 && row[iDl] instanceof Date && row[iDl] < today && !isDone) out.overdue++;
    if (iSt >= 0 && opts.stuckValue && row[iSt] === opts.stuckValue) out.stuck++;
    if (iPr >= 0 && String(row[iPr]).toUpperCase().indexOf("CAO") >= 0) out.priorityHigh++;
  }
  return out;
}

function _analyzeKho(ss) {
  const out = { red: 0, yellow: 0, requestPending: 0, requestHigh: 0 };
  const s5a = ss.getSheetByName(TAB.KHO_5A);
  if (s5a) {
    const data = s5a.getDataRange().getValues();
    const iSt = (data[0] || []).indexOf("Trạng thái cảnh báo");
    if (iSt >= 0) {
      for (let r = 1; r < data.length; r++) {
        const v = String(data[r][iSt] || "");
        if (v.indexOf("ĐỎ") >= 0) out.red++;
        else if (v.indexOf("VÀNG") >= 0) out.yellow++;
      }
    }
  }
  const s5b = ss.getSheetByName(TAB.KHO_5B);
  if (s5b) {
    const data = s5b.getDataRange().getValues();
    const h = data[0] || [];
    const iSt = h.indexOf("Trạng thái xử lý");
    const iPr = h.indexOf("Mức ưu tiên");
    if (iSt >= 0) {
      for (let r = 1; r < data.length; r++) {
        const status = String(data[r][iSt] || "");
        const priority = iPr >= 0 ? String(data[r][iPr] || "") : "";
        if (status === "Chờ tiếp nhận") out.requestPending++;
        if (priority.indexOf("CAO") >= 0 && status !== "Đã cấp đủ") out.requestHigh++;
      }
    }
  }
  return out;
}

function _collectHot(ss, stats) {
  const hot = [];
  const kt = ss.getSheetByName(TAB.KY_THUAT);
  if (kt) {
    const data = kt.getDataRange().getValues();
    const h = data[0] || [];
    const iTen = h.indexOf("Tên Thiết Bị");
    const iKhoa = h.indexOf("Khoa");
    const iPr = h.indexOf("Cấp độ ưu tiên");
    const iDn = h.indexOf("Đã Hoàn Thành");
    for (let r = 1; r < data.length && hot.length < 10; r++) {
      const pri = iPr >= 0 ? String(data[r][iPr] || "") : "";
      const done = iDn >= 0 ? String(data[r][iDn] || "") : "";
      if (pri.indexOf("CAO") >= 0 && done.toUpperCase() !== "X" && done !== "✓") {
        hot.push({ team: "KT", title: (data[r][iTen] || "?") + " — " + (data[r][iKhoa] || "?") });
      }
    }
  }
  const kho = ss.getSheetByName(TAB.KHO_5A);
  if (kho) {
    const data = kho.getDataRange().getValues();
    const h = data[0] || [];
    const iTen = h.indexOf("Tên VTTH");
    const iSt = h.indexOf("Trạng thái cảnh báo");
    for (let r = 1; r < data.length && hot.length < 10; r++) {
      const status = iSt >= 0 ? String(data[r][iSt] || "") : "";
      if (status.indexOf("ĐỎ") >= 0) hot.push({ team: "KHO", title: (data[r][iTen] || "?") + " — " + status });
    }
  }
  return hot;
}

// ============================================================================
//  EMAIL BRIEF SÁNG
// ============================================================================
function sendMorningBrief() {
  runAggregator();
  const stats = _computeStats();
  const dateStr = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy");
  const sheetUrl = "https://docs.google.com/spreadsheets/d/" + SHEET_ID;

  const subject = "[GIAO BAN] Brief Sáng " + dateStr + " — Phòng VT-TBYT";
  let html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">';
  html += '<h2 style="color:#1F4E78;border-bottom:2px solid #1F4E78;padding-bottom:8px;">📊 Brief Sáng — ' + dateStr + '</h2>';
  html += '<table style="width:100%;border-collapse:collapse;margin:12px 0;">';
  html += '<tr style="background:#1F4E78;color:#fff;"><th style="padding:8px;text-align:left;">Tổ</th><th>Tổng</th><th>Đang xử lý</th><th>⚠️ Cần lưu ý</th></tr>';
  html += _emailRow("KỸ THUẬT", stats.kt.total, stats.kt.inProgress,
    [stats.kt.priorityHigh > 0 ? `🔴 ${stats.kt.priorityHigh} TB CAO chưa xong` : null,
     stats.kt.overdue > 0 ? `⚠️ ${stats.kt.overdue} trễ deadline` : null]);
  html += _emailRow("HỒ SƠ", stats.hs.total, stats.hs.inProgress,
    [stats.hs.stuck > 0 ? `🔴 ${stats.hs.stuck} gói vướng` : null,
     stats.hs.overdue > 0 ? `⚠️ ${stats.hs.overdue} trễ` : null]);
  html += _emailRow("VẬT TƯ", stats.vt.total, stats.vt.inProgress,
    [stats.vt.priorityHigh > 0 ? `🔴 ${stats.vt.priorityHigh} CAO` : null,
     stats.vt.stuck > 0 ? `⚠️ ${stats.vt.stuck} vướng` : null]);
  html += _emailRow("KHO", "—", "—",
    [stats.kho.red > 0 ? `🔴 ${stats.kho.red} mã ĐỎ` : null,
     stats.kho.yellow > 0 ? `🟡 ${stats.kho.yellow} mã VÀNG` : null,
     stats.kho.requestHigh > 0 ? `🔴 ${stats.kho.requestHigh} YC CAO chưa cấp` : null]);
  html += '</table>';
  html += '<h3 style="color:#C00000;">🔥 TOP điểm nóng</h3>';
  if (stats.hot.length === 0) html += '<p style="color:#107C10;font-style:italic;">(Không có — chúc Sếp ngày yên ổn!)</p>';
  else {
    html += '<ol>';
    stats.hot.slice(0, 5).forEach(h => html += '<li><b>[' + h.team + ']</b> ' + h.title + '</li>');
    html += '</ol>';
  }
  html += '<p style="margin-top:20px;"><a href="' + sheetUrl + '" style="background:#1F4E78;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Mở Sheet đầy đủ →</a></p>';
  html += '<p style="font-size:11px;color:#999;margin-top:24px;">Tự động — gửi 7:30 mỗi sáng. ' + Utilities.formatDate(new Date(), TIMEZONE, "HH:mm dd/MM/yyyy") + '</p>';
  html += '</div>';

  const recipients = [EMAIL_TRUONG_PHONG, EMAIL_TO_KY_THUAT, EMAIL_TO_HO_SO, EMAIL_TO_VT, EMAIL_TO_KHO]
    .filter(e => e && e.indexOf("@") > 0).join(",");
  if (!recipients) { Logger.log("⚠️ Chưa cấu hình email"); return; }
  MailApp.sendEmail({ to: recipients, subject, htmlBody: html });
  Logger.log("Đã gửi Brief Sáng: " + recipients);
}

function _emailRow(team, total, inProgress, alerts) {
  const alertText = alerts.filter(a => a).join("<br>") || '<span style="color:#107C10;">✓ ổn</span>';
  return '<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">' + team + '</td>' +
    '<td style="text-align:center;border-bottom:1px solid #eee;">' + total + '</td>' +
    '<td style="text-align:center;border-bottom:1px solid #eee;">' + inProgress + '</td>' +
    '<td style="border-bottom:1px solid #eee;">' + alertText + '</td></tr>';
}

// ============================================================================
//  HOT ISSUES SCAN
// ============================================================================
function flagHotIssues() {
  const stats = _computeStats();
  const today = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
  const log = _getOrCreateSheet(TAB.LOG_HOT, ["Ngày", "Mã sự kiện", "Mô tả", "Đã gửi"]);
  const data = log.getDataRange().getValues();
  const sentToday = new Set();
  data.forEach(r => { if (r[0] === today) sentToday.add(r[1]); });

  const events = [];
  if (stats.kt.priorityHigh > 0) events.push({ id: "KT_HIGH_" + stats.kt.priorityHigh, msg: "Có " + stats.kt.priorityHigh + " TB ưu tiên CAO chưa hoàn thành." });
  if (stats.kho.red > 0) events.push({ id: "KHO_RED_" + stats.kho.red, msg: "Có " + stats.kho.red + " mã kho ĐỎ." });
  if (stats.kho.requestHigh > 0) events.push({ id: "KHO_REQ_" + stats.kho.requestHigh, msg: "Có " + stats.kho.requestHigh + " yêu cầu CAO chưa cấp đủ." });
  if (stats.hs.stuck >= 3) events.push({ id: "HS_STUCK_" + stats.hs.stuck, msg: "Có " + stats.hs.stuck + " gói thầu đang vướng." });

  events.forEach(e => {
    if (sentToday.has(e.id)) return;
    MailApp.sendEmail({
      to: EMAIL_TRUONG_PHONG,
      subject: "[CẢNH BÁO ĐIỂM NÓNG] " + e.msg,
      htmlBody: '<div style="font-family:Arial;color:#333;"><h3 style="color:#C00000;">🔥 Cảnh báo</h3><p>' + e.msg + '</p><p><a href="https://docs.google.com/spreadsheets/d/' + SHEET_ID + '">Mở Sheet</a></p></div>'
    });
    log.appendRow([today, e.id, e.msg, "✓"]);
  });
}

// ============================================================================
//  BRIEFING MODE (popup)
// ============================================================================
function prepareBriefingMode() {
  const stats = _computeStats();
  const dateStr = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy HH:mm");
  let s = "📋 BRIEFING — " + dateStr + "\n\n";
  s += "1. KỸ THUẬT — Tổng " + stats.kt.total + " | Done " + stats.kt.done + " | 🔴 CAO " + stats.kt.priorityHigh + " | Trễ " + stats.kt.overdue + "\n";
  s += "2. HỒ SƠ — Tổng " + stats.hs.total + " | 🔴 Vướng " + stats.hs.stuck + " | Trễ " + stats.hs.overdue + "\n";
  s += "3. VẬT TƯ — Tổng " + stats.vt.total + " | 🔴 CAO " + stats.vt.priorityHigh + " | Vướng " + stats.vt.stuck + "\n";
  s += "4. KHO — Đỏ " + stats.kho.red + " | Vàng " + stats.kho.yellow + " | YC chờ " + stats.kho.requestPending + " | YC CAO " + stats.kho.requestHigh + "\n\n";
  s += "🔥 TOP 3 ĐIỂM NÓNG:\n";
  if (stats.hot.length === 0) s += "(Không có)\n";
  else stats.hot.slice(0, 3).forEach((h, i) => s += (i + 1) + ". [" + h.team + "] " + h.title + "\n");

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
  const html = HtmlService.createHtmlOutput(_buildDashboardHtml())
    .setTitle("Giao ban VT-TBYT — Bệnh viện K")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return html;
}

/** Endpoint AJAX cho web app — trả JSON. Gọi từ HTML qua google.script.run. */
function getDashboardJson() {
  const stats = _computeStats();
  return {
    updatedAt: Utilities.formatDate(new Date(), TIMEZONE, "HH:mm:ss dd/MM/yyyy"),
    kt: stats.kt, hs: stats.hs, vt: stats.vt, kho: stats.kho,
    hot: stats.hot.slice(0, 8)
  };
}

function showWebAppUrl() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput(
    !url
      ? '<div style="font-family:Arial;padding:20px;"><h3>⚠️ Chưa Deploy</h3><p>Sếp cần Deploy Web App trước:</p><ol><li>Bấm <b>Deploy</b> (góc trên bên phải Apps Script editor) → <b>New deployment</b></li><li>Loại: <b>Web app</b></li><li>Execute as: <b>Me</b></li><li>Who has access: <b>Anyone with the link</b> (nội bộ BV) hoặc <b>Anyone within ...</b></li><li>Bấm <b>Deploy</b> → copy URL</li></ol><p>Sau đó chạy lại menu này để xem URL.</p></div>'
      : '<div style="font-family:Arial;padding:20px;"><h3>🌐 URL Web App</h3><p>Sếp copy link dưới đây, mở trên trình chiếu giao ban:</p><input type="text" value="' + url + '" style="width:100%;padding:8px;font-size:14px;font-family:monospace;" readonly onclick="this.select()" /><p style="margin-top:12px;"><a href="' + url + '" target="_blank" style="background:#1F4E78;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Mở ngay →</a></p><p style="color:#999;font-size:12px;margin-top:16px;">Trang tự refresh số liệu mỗi 60 giây.</p></div>'
  ).setWidth(600).setHeight(380);
  SpreadsheetApp.getUi().showModalDialog(html, "🌐 Web App URL");
}

function _buildDashboardHtml() {
  // Trang HTML tự refresh mỗi 60 giây qua google.script.run
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Giao ban VT-TBYT</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif}
  body{background:#0F1B2D;color:#fff;padding:24px;min-height:100vh}
  .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1F4E78;padding-bottom:16px;margin-bottom:24px}
  .title{font-size:32px;font-weight:bold;color:#fff}
  .title small{display:block;font-size:14px;color:#8AA8C9;font-weight:normal;margin-top:4px}
  .clock{font-size:18px;color:#C8D8EB;text-align:right}
  .clock .live{display:inline-block;width:10px;height:10px;background:#00C853;border-radius:50%;margin-right:8px;animation:pulse 1.5s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:24px}
  .card{background:#162A44;border-radius:12px;padding:20px;border-top:5px solid #2E75B6;box-shadow:0 4px 16px rgba(0,0,0,.3)}
  .card.alert{border-top-color:#FF5252;background:linear-gradient(180deg,#3D1818 0%,#162A44 100%)}
  .card.warn{border-top-color:#FFC107}
  .card.ok{border-top-color:#00C853}
  .card h3{font-size:16px;color:#8AA8C9;margin-bottom:14px;text-transform:uppercase;letter-spacing:1px}
  .card .big{font-size:48px;font-weight:bold;line-height:1}
  .card .big.red{color:#FF5252}
  .card .big.yellow{color:#FFC107}
  .card .big.green{color:#00C853}
  .card .stats{margin-top:14px;font-size:14px;color:#C8D8EB}
  .card .stats div{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed rgba(255,255,255,.1)}
  .card .stats div:last-child{border-bottom:none}
  .card .stats span.v{font-weight:bold;color:#fff}
  .card .stats span.v.red{color:#FF5252}
  .card .stats span.v.yellow{color:#FFC107}
  .hot{background:#3D1818;border-radius:12px;padding:24px;border-left:6px solid #FF5252}
  .hot h2{font-size:20px;color:#FF5252;margin-bottom:16px;display:flex;align-items:center;gap:10px}
  .hot ol{list-style:none;counter-reset:hot}
  .hot li{counter-increment:hot;padding:12px 16px;margin-bottom:8px;background:rgba(255,82,82,.1);border-radius:6px;font-size:16px;display:flex;align-items:center;gap:12px}
  .hot li::before{content:counter(hot);font-size:20px;font-weight:bold;color:#FF5252;background:rgba(255,82,82,.2);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .hot .team{display:inline-block;background:#FF5252;color:#fff;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:bold;margin-right:10px}
  .empty{color:#00C853;font-style:italic;text-align:center;padding:20px}
  .footer{text-align:center;color:#8AA8C9;font-size:12px;margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,.1)}
  .loading{text-align:center;padding:60px;font-size:18px;color:#8AA8C9}
  @media (max-width:1100px){.grid{grid-template-columns:repeat(2,1fr)}}
</style>
</head>
<body>

<div class="header">
  <div class="title">DASHBOARD GIAO BAN — PHÒNG VT-TBYT
    <small>Bệnh viện K — Tổng hợp 4 tổ: Kỹ thuật / Hồ sơ / Vật tư / Kho</small>
  </div>
  <div class="clock">
    <div><span class="live"></span>LIVE</div>
    <div id="clock">--:--:--</div>
    <div id="updated" style="font-size:12px;color:#8AA8C9;margin-top:4px;">Đang tải...</div>
  </div>
</div>

<div id="content"><div class="loading">⏳ Đang tải dữ liệu...</div></div>

<div class="footer">
  Tự động refresh mỗi 60 giây. Phiên bản v2.1.<br>
  Phiên: <span id="session"></span>
</div>

<script>
  function pad(n){return n<10?'0'+n:''+n}
  function tickClock(){
    var d=new Date();
    document.getElementById('clock').textContent=pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
  }
  setInterval(tickClock,1000); tickClock();

  function severity(n,yellow,red){
    if(n>=red) return 'red';
    if(n>=yellow) return 'yellow';
    return 'green';
  }
  function statSpan(label,value,cls){
    return '<div><span>'+label+'</span><span class="v '+(cls||'')+'">'+value+'</span></div>';
  }
  function render(d){
    var ktAlert = (d.kt.priorityHigh>0 || d.kt.overdue>0);
    var hsAlert = (d.hs.stuck>0 || d.hs.overdue>0);
    var vtAlert = (d.vt.priorityHigh>0 || d.vt.stuck>0);
    var khoAlert = (d.kho.red>0 || d.kho.requestHigh>0);

    var html = '<div class="grid">';
    // Kỹ thuật
    html += '<div class="card '+(ktAlert?'alert':'ok')+'">';
    html += '<h3>1. KỸ THUẬT</h3>';
    html += '<div class="big '+(d.kt.priorityHigh>0?'red':(d.kt.overdue>0?'yellow':'green'))+'">'+d.kt.total+'</div>';
    html += '<div class="stats">';
    html += statSpan('Đã hoàn thành', d.kt.done, 'green');
    html += statSpan('Đang xử lý', d.kt.inProgress);
    html += statSpan('🔴 Ưu tiên CAO', d.kt.priorityHigh, d.kt.priorityHigh>0?'red':'');
    html += statSpan('⚠️ Trễ deadline', d.kt.overdue, d.kt.overdue>0?'yellow':'');
    html += '</div></div>';

    // Hồ sơ
    html += '<div class="card '+(hsAlert?'alert':'ok')+'">';
    html += '<h3>2. HỒ SƠ</h3>';
    html += '<div class="big '+(d.hs.stuck>0?'red':'green')+'">'+d.hs.total+'</div>';
    html += '<div class="stats">';
    html += statSpan('Đang xử lý', d.hs.inProgress);
    html += statSpan('🔴 Vướng mắc', d.hs.stuck, d.hs.stuck>0?'red':'');
    html += statSpan('⚠️ Trễ', d.hs.overdue, d.hs.overdue>0?'yellow':'');
    html += '</div></div>';

    // Vật tư
    html += '<div class="card '+(vtAlert?'alert':'ok')+'">';
    html += '<h3>3. VẬT TƯ</h3>';
    html += '<div class="big '+(d.vt.priorityHigh>0?'red':(d.vt.stuck>0?'yellow':'green'))+'">'+d.vt.total+'</div>';
    html += '<div class="stats">';
    html += statSpan('🔴 Ưu tiên CAO', d.vt.priorityHigh, d.vt.priorityHigh>0?'red':'');
    html += statSpan('⚠️ Vướng / chờ', d.vt.stuck, d.vt.stuck>0?'yellow':'');
    html += '</div></div>';

    // Kho
    html += '<div class="card '+(khoAlert?'alert':'ok')+'">';
    html += '<h3>4. KHO</h3>';
    html += '<div class="big '+(d.kho.red>0?'red':(d.kho.yellow>0?'yellow':'green'))+'">'+d.kho.red+'</div>';
    html += '<div class="stats">';
    html += statSpan('🔴 Mã ĐỎ', d.kho.red, d.kho.red>0?'red':'');
    html += statSpan('🟡 Mã VÀNG', d.kho.yellow, d.kho.yellow>0?'yellow':'');
    html += statSpan('YC chờ tiếp nhận', d.kho.requestPending);
    html += statSpan('🔴 YC CAO chưa cấp', d.kho.requestHigh, d.kho.requestHigh>0?'red':'');
    html += '</div></div>';
    html += '</div>';

    // Hot
    html += '<div class="hot"><h2>🔥 TOP ĐIỂM NÓNG CẦN XỬ LÝ NGAY</h2>';
    if(d.hot.length===0){
      html += '<div class="empty">✓ Không có điểm nóng — tốt!</div>';
    } else {
      html += '<ol>';
      d.hot.forEach(function(h){
        html += '<li><span class="team">'+h.team+'</span> <span>'+h.title+'</span></li>';
      });
      html += '</ol>';
    }
    html += '</div>';

    document.getElementById('content').innerHTML = html;
    document.getElementById('updated').textContent = 'Cập nhật: '+d.updatedAt;
  }

  function load(){
    google.script.run
      .withSuccessHandler(render)
      .withFailureHandler(function(err){
        document.getElementById('content').innerHTML =
          '<div class="loading" style="color:#FF5252;">❌ Lỗi tải dữ liệu: '+err.message+'</div>';
      })
      .getDashboardJson();
  }
  load();
  setInterval(load, 60000);
  document.getElementById('session').textContent = Math.random().toString(36).substring(2,8);
</script>
</body>
</html>
  `;
}
