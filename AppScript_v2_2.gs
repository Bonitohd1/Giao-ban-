/**
 * ============================================================================
 *  BỆNH VIỆN K — PHÒNG VT-TBYT — HỆ THỐNG GIAO BAN v2.2
 *  Dashboard Web App với 6 view drill-down (header-based column lookup)
 * ----------------------------------------------------------------------------
 *  THỨ TỰ CHẠY LẦN ĐẦU:
 *    1) bootstrap()         — Tạo các tab dm_*, cfg, 5A, 5B (1 lần).
 *    2) setupTriggers()     — Cài 3 trigger định kỳ (1 lần).
 *    3) Deploy Web App      — Triển khai → URL chiếu giao ban (1 lần).
 *
 *  6 VIEW DASHBOARD:
 *    - 🏠 Tổng quan: 4 KPI + Top khoa nóng + 8 điểm nóng
 *    - 🔧 Kỹ thuật: bảng máy hỏng có filter, click → mở Sheet đúng dòng
 *    - 📁 Hồ sơ: pipeline gói thầu theo Trạng thái + bảng vướng mắc
 *    - 🧪 VTTH: bảng task hóa chất theo Loại nhóm
 *    - 📦 Kho: tồn 5A sort theo DOH (sắp hết) + đề xuất 5B chờ duyệt
 *    - 🏥 Theo Khoa: chọn khoa → hiện toàn bộ vấn đề của khoa đó
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
  msg += "Bước tiếp theo:\n  1) Chạy setupTriggers().\n  2) Deploy Web App.";
  ui.alert(msg);
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
//  TRIGGERS + ONEDIT
// ============================================================================
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ScriptApp.newTrigger("onEdit").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("sendMorningBrief").timeBased().atHour(7).nearMinute(30).everyDays(1).create();
  [8, 11, 14, 17].forEach(h => {
    ScriptApp.newTrigger("flagHotIssues").timeBased().atHour(h).nearMinute(0).everyDays(1).create();
  });
  SpreadsheetApp.getUi().alert("✅ Đã cài " + ScriptApp.getProjectTriggers().length + " trigger.");
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

  return {
    updatedAt: Utilities.formatDate(new Date(), TIMEZONE, "HH:mm:ss dd/MM/yyyy"),
    sheetUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID,
    cards: {
      kt: _summaryKT(kt),
      hs: _summaryHS(hs),
      vt: _summaryVT(vt),
      kho: _summaryKho(kho5a, kho5b)
    },
    topKhoa: _aggKhoa([kt, hs, vt]),
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
    if (ts.indexOf("đang sửa") >= 0) out.dangSua++;
    if (ts.indexOf("bảo trì") >= 0 || ts.indexOf("bảo dưỡng") >= 0) out.baoTri++;
    if (ts.indexOf("thanh lý") >= 0) out.thanhLy++;
    if (ts === "hỏng") out.hong++;
    const done = _isDone(row[cHT]);
    if (done) out.done++;
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
  const counts = {};
  tabs.forEach(t => {
    if (!t || t.missing) return;
    const cKhoa = _findCol(t.headers, "Khoa/ Phòng Sử Dụng", "Khoa/ phòng sử dụng", "Khoa/ Phòng SD", "Khoa");
    const cHT = _findCol(t.headers, "Đã Hoàn Thành", "Đã HT");
    if (cKhoa < 0) return;
    t.rows.forEach(row => {
      const k = (row[cKhoa] || "").toString().trim();
      if (!k || k.length < 2) return;
      if (_isDone(row[cHT])) return;
      counts[k] = (counts[k] || 0) + 1;
    });
  });
  return Object.keys(counts).map(k => ({ khoa: k, count: counts[k] }))
    .sort((a, b) => b.count - a.count).slice(0, 8);
}

function _topHot(kt, hs, kho5a, limit) {
  const items = [];
  const today = new Date(); today.setHours(0,0,0,0);

  if (kt && !kt.missing) {
    const cTen = _findCol(kt.headers, "Tên Thiết Bị", "Tên");
    const cKhoa = _findCol(kt.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
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
      items.push({
        team: "KT",
        teamLabel: "🔧 KT",
        title: (row[cTen] || "?").toString(),
        subtitle: (row[cKhoa] || "").toString(),
        detail: _truncate((row[cCT] || row[cTinh] || ""), 100),
        badge: tre > 0 ? "Trễ " + tre + "n" : tinh,
        severity: 80 + Math.min(tre, 20),
        sheetRow: i + 2,
        gid: kt.gid
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
        gid: kho5a.gid
      });
    });
  }

  if (hs && !hs.missing) {
    const cMa = _findCol(hs.headers, "Mã Hồ sơ", "Mã HS");
    const cND = _findCol(hs.headers, "Nội dung công việc được giao", "Nội dung");
    const cKhoa = _findCol(hs.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
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
        badge: tre > 0 ? "Trễ " + tre + "n" : (cao ? "CAO" : "Vướng"),
        severity: 70 + Math.min(tre, 25),
        sheetRow: i + 2,
        gid: hs.gid
      });
    });
  }

  items.sort((a, b) => b.severity - a.severity);
  return items.slice(0, limit);
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

  return { rows, gid: t.gid, sheetUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID };
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
    loai:   _findCol(t.headers, "Loại nhóm", "Nội dung công việc được giao", "Nội dung"),
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

  const rows = t.rows.map((row, i) => {
    if (!row.some(v => v !== "" && v !== null)) return null;
    const dl = _toDate(row[c.dl]);
    const ht = _isDone(row[c.ht]);
    const tre = dl && dl < today && !ht ? _daysBetween(dl, today) : null;
    return {
      idx: i + 2,
      gid: t.gid,
      stt: (row[c.stt] || "").toString(),
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

  return { rows, gid: t.gid, sheetUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID };
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
      vtth:   _findCol(t5b.headers, "VTTH yêu cầu"),
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

  return { ton, dexuat, sheetUrl: "https://docs.google.com/spreadsheets/d/" + SHEET_ID };
}

// ============================================================================
//  API ENDPOINT — THEO KHOA
// ============================================================================
function getByKhoa(khoaName) {
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
    return t.rows.map((row, i) => ({ row, i })).filter(o => {
      const k = norm(o.row[idx]);
      return k && (k === target || k.indexOf(target) >= 0 || target.indexOf(k) >= 0);
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
      doneKT: ktItems.filter(r => r.ht).length,
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
function sendMorningBrief() {
  const data = getOverview();
  const dateStr = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy");
  const sheetUrl = data.sheetUrl;

  const subject = "[GIAO BAN] Brief Sáng " + dateStr + " — Phòng VT-TBYT";
  let html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">';
  html += '<h2 style="color:#1F4E78;border-bottom:2px solid #1F4E78;padding-bottom:8px;">📊 Brief Sáng — ' + dateStr + '</h2>';
  html += '<table style="width:100%;border-collapse:collapse;margin:12px 0;">';
  html += '<tr style="background:#1F4E78;color:#fff;"><th style="padding:8px;text-align:left;">Tổ</th><th>Tổng</th><th>Đang xử lý</th><th>⚠️ Cần lưu ý</th></tr>';
  html += _emailRow("KỸ THUẬT", data.cards.kt.total, data.cards.kt.dangSua + data.cards.kt.baoTri,
    [data.cards.kt.cao > 0 ? "🔴 " + data.cards.kt.cao + " CAO" : null,
     data.cards.kt.treDL > 0 ? "⚠️ " + data.cards.kt.treDL + " trễ deadline" : null]);
  html += _emailRow("HỒ SƠ", data.cards.hs.total, data.cards.hs.dangXL,
    [data.cards.hs.vuong > 0 ? "🔴 " + data.cards.hs.vuong + " gói vướng" : null,
     data.cards.hs.treDL > 0 ? "⚠️ " + data.cards.hs.treDL + " trễ" : null]);
  html += _emailRow("VẬT TƯ", data.cards.vt.total, data.cards.vt.dangXL,
    [data.cards.vt.cao > 0 ? "🔴 " + data.cards.vt.cao + " CAO" : null,
     data.cards.vt.vuong > 0 ? "⚠️ " + data.cards.vt.vuong + " vướng" : null]);
  html += _emailRow("KHO", data.cards.kho.total, "—",
    [data.cards.kho.red > 0 ? "🔴 " + data.cards.kho.red + " mã ĐỎ" : null,
     data.cards.kho.yellow > 0 ? "🟡 " + data.cards.kho.yellow + " VÀNG" : null,
     data.cards.kho.requestHigh > 0 ? "🔴 " + data.cards.kho.requestHigh + " YC CAO chưa cấp" : null]);
  html += '</table>';
  html += '<h3 style="color:#C00000;">🔥 TOP điểm nóng</h3>';
  if (data.hot.length === 0) html += '<p style="color:#107C10;font-style:italic;">(Không có)</p>';
  else {
    html += '<ol>';
    data.hot.slice(0, 5).forEach(h => html += '<li><b>[' + h.team + ']</b> ' + h.title + (h.subtitle ? ' — ' + h.subtitle : '') + '</li>');
    html += '</ol>';
  }
  html += '<p style="margin-top:20px;"><a href="' + sheetUrl + '" style="background:#1F4E78;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Mở Sheet đầy đủ →</a></p>';
  html += '<p style="font-size:11px;color:#999;margin-top:24px;">Tự động — gửi 7:30 mỗi sáng. ' + data.updatedAt + '</p>';
  html += '</div>';

  const recipients = [EMAIL_TRUONG_PHONG, EMAIL_TO_KY_THUAT, EMAIL_TO_HO_SO, EMAIL_TO_VT, EMAIL_TO_KHO]
    .filter(e => e && e.indexOf("@") > 0).join(",");
  if (!recipients) { Logger.log("⚠️ Chưa cấu hình email"); return; }
  MailApp.sendEmail({ to: recipients, subject, htmlBody: html });
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
  const log = _getOrCreateSheet(TAB.LOG_HOT, ["Ngày", "Mã sự kiện", "Mô tả", "Đã gửi"]);
  const logData = log.getDataRange().getValues();
  const sentToday = new Set();
  logData.forEach(r => { if (r[0] === today) sentToday.add(r[1]); });

  const events = [];
  if (data.cards.kt.cao > 0) events.push({ id: "KT_CAO_" + data.cards.kt.cao, msg: data.cards.kt.cao + " TB CAO chưa hoàn thành." });
  if (data.cards.kho.red > 0) events.push({ id: "KHO_RED_" + data.cards.kho.red, msg: data.cards.kho.red + " mã kho ĐỎ." });
  if (data.cards.kho.requestHigh > 0) events.push({ id: "KHO_REQ_" + data.cards.kho.requestHigh, msg: data.cards.kho.requestHigh + " yêu cầu CAO chưa cấp đủ." });
  if (data.cards.hs.vuong >= 3) events.push({ id: "HS_VM_" + data.cards.hs.vuong, msg: data.cards.hs.vuong + " gói thầu đang vướng." });

  events.forEach(e => {
    if (sentToday.has(e.id)) return;
    MailApp.sendEmail({
      to: EMAIL_TRUONG_PHONG,
      subject: "[CẢNH BÁO ĐIỂM NÓNG] " + e.msg,
      htmlBody: '<div style="font-family:Arial;color:#333;"><h3 style="color:#C00000;">🔥 Cảnh báo</h3><p>' + e.msg + '</p><p><a href="' + data.sheetUrl + '">Mở Sheet</a></p></div>'
    });
    log.appendRow([today, e.id, e.msg, "✓"]);
  });
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

const DASHBOARD_HTML = '<!DOCTYPE html>\n<html lang="vi"><head><meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0}\n' +
'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#0F1B2D;color:#E5E7EB;font-size:14px;line-height:1.4}\n' +
'header{background:linear-gradient(180deg,#162338 0%,#0F1B2D 100%);padding:14px 24px;border-bottom:1px solid #1F2D45;position:sticky;top:0;z-index:100}\n' +
'.brand-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}\n' +
'.brand{font-size:20px;font-weight:700;color:#fff;letter-spacing:.4px}\n' +
'.brand small{display:block;font-size:11px;font-weight:400;color:#9CA3AF;margin-top:2px}\n' +
'.status-row{display:flex;align-items:center;gap:14px;font-size:12px;color:#9CA3AF}\n' +
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
'</style></head><body>\n' +
'<header>\n' +
'  <div class="brand-row">\n' +
'    <div class="brand">DASHBOARD GIAO BAN — PHÒNG VT-TBYT<small>Bệnh viện K — 4 tổ: Kỹ thuật / Hồ sơ / Vật tư / Kho</small></div>\n' +
'    <div class="status-row">\n' +
'      <span class="live"><span class="live-dot"></span>LIVE</span>\n' +
'      <span id="clock">--:--:--</span>\n' +
'      <span id="updated">Cập nhật: —</span>\n' +
'    </div>\n' +
'  </div>\n' +
'  <nav class="tabs" id="tabs">\n' +
'    <button data-view="overview" class="active">🏠 Tổng quan</button>\n' +
'    <button data-view="kt">🔧 Kỹ thuật</button>\n' +
'    <button data-view="hs">📁 Hồ sơ</button>\n' +
'    <button data-view="vt">🧪 VTTH</button>\n' +
'    <button data-view="kho">📦 Kho</button>\n' +
'    <button data-view="khoa">🏥 Theo Khoa</button>\n' +
'  </nav>\n' +
'</header>\n' +
'<main>\n' +
'  <section id="view-overview" class="view active"><div class="loading">Đang tải tổng quan…</div></section>\n' +
'  <section id="view-kt" class="view"><div class="loading">Đang tải kỹ thuật…</div></section>\n' +
'  <section id="view-hs" class="view"><div class="loading">Đang tải hồ sơ…</div></section>\n' +
'  <section id="view-vt" class="view"><div class="loading">Đang tải vật tư…</div></section>\n' +
'  <section id="view-kho" class="view"><div class="loading">Đang tải kho…</div></section>\n' +
'  <section id="view-khoa" class="view"><div class="loading">Đang tải theo khoa…</div></section>\n' +
'</main>\n' +
'<script>\n' +
'(function(){\n' +
'var STATE = { sheetUrl: "", currentView: "overview", overview: null, kt: null, hs: null, vt: null, kho: null, khoa: null };\n' +
'function $(s,p){return (p||document).querySelector(s);} \n' +
'function $$(s,p){return Array.from((p||document).querySelectorAll(s));}\n' +
'function esc(s){if(s===null||s===undefined)return"";return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c];});}\n' +
'function fmtVnd(n){if(!n||isNaN(n))return"";if(n>=1e9)return(n/1e9).toFixed(2)+" tỷ";if(n>=1e6)return(n/1e6).toFixed(1)+" tr";return n.toLocaleString("vi-VN");}\n' +
'function deepLink(gid,row){return STATE.sheetUrl + "/edit#gid=" + gid + "&range=A" + row;}\n' +
'function openRow(gid,row){if(gid&&row)window.open(deepLink(gid,row),"_blank");}\n' +
'function clock(){var d=new Date();var p=function(n){return n<10?"0"+n:n};$("#clock").textContent=p(d.getHours())+":"+p(d.getMinutes())+":"+p(d.getSeconds());}\n' +
'setInterval(clock,1000);clock();\n' +
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
'function renderOverview(d){\n' +
'  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n' +
'  $("#updated").textContent = "Cập nhật: " + d.updatedAt;\n' +
'  var c=d.cards;\n' +
'  var html = "";\n' +
'  html += "<div class=\\"cards\\">";\n' +
'  // KT card\n' +
'  var sevKT=severity({red:0,cao:c.kt.cao,treDL:c.kt.treDL});\n' +
'  html += "<div class=\\"card "+sevKT+"\\"><h3>1. Kỹ thuật — máy hỏng</h3>";\n' +
'  html += "<div class=\\"big "+sevKT+"\\">"+c.kt.total+"</div>";\n' +
'  html += "<ul>";\n' +
'  html += "<li>Đang sửa <b>"+c.kt.dangSua+"</b></li>";\n' +
'  html += "<li>Bảo trì/dưỡng <b>"+c.kt.baoTri+"</b></li>";\n' +
'  html += "<li>Đề xuất thanh lý <b>"+c.kt.thanhLy+"</b></li>";\n' +
'  html += "<li>Đã hoàn thành <b>"+c.kt.done+"</b></li>";\n' +
'  html += "<li class=\\""+(c.kt.cao>0?"alert":"")+"\\">🔴 Ưu tiên CAO <b>"+c.kt.cao+"</b></li>";\n' +
'  html += "<li class=\\""+(c.kt.treDL>0?"alert":"")+"\\">⚠️ Trễ deadline <b>"+c.kt.treDL+"</b></li>";\n' +
'  html += "</ul></div>";\n' +
'  // HS card\n' +
'  var sevHS=severity({red:0,cao:c.hs.cao,treDL:c.hs.treDL,vuong:c.hs.vuong});\n' +
'  html += "<div class=\\"card "+sevHS+"\\"><h3>2. Hồ sơ — gói thầu</h3>";\n' +
'  html += "<div class=\\"big "+sevHS+"\\">"+c.hs.total+"</div>";\n' +
'  html += "<ul>";\n' +
'  html += "<li>Đang xử lý <b>"+c.hs.dangXL+"</b></li>";\n' +
'  html += "<li>Đã hoàn thành <b>"+c.hs.done+"</b></li>";\n' +
'  html += "<li>Tổng giá trị <b>"+fmtVnd(c.hs.tongGiaTri)+"</b></li>";\n' +
'  html += "<li class=\\""+(c.hs.cao>0?"alert":"")+"\\">🔴 Ưu tiên CAO <b>"+c.hs.cao+"</b></li>";\n' +
'  html += "<li class=\\""+(c.hs.vuong>0?"alert":"")+"\\">🚧 Vướng mắc <b>"+c.hs.vuong+"</b></li>";\n' +
'  html += "<li class=\\""+(c.hs.treDL>0?"warn":"")+"\\">⚠️ Trễ <b>"+c.hs.treDL+"</b></li>";\n' +
'  html += "</ul></div>";\n' +
'  // VT card\n' +
'  var sevVT=severity({red:0,cao:c.vt.cao,treDL:c.vt.treDL,vuong:c.vt.vuong});\n' +
'  html += "<div class=\\"card "+sevVT+"\\"><h3>3. Vật tư — task hóa chất</h3>";\n' +
'  html += "<div class=\\"big "+sevVT+"\\">"+c.vt.total+"</div>";\n' +
'  html += "<ul>";\n' +
'  html += "<li>Đang xử lý <b>"+c.vt.dangXL+"</b></li>";\n' +
'  html += "<li>Đã hoàn thành <b>"+c.vt.done+"</b></li>";\n' +
'  html += "<li class=\\""+(c.vt.cao>0?"alert":"")+"\\">🔴 Ưu tiên CAO <b>"+c.vt.cao+"</b></li>";\n' +
'  html += "<li class=\\""+(c.vt.vuong>0?"alert":"")+"\\">🚧 Vướng mắc <b>"+c.vt.vuong+"</b></li>";\n' +
'  html += "<li class=\\""+(c.vt.treDL>0?"warn":"")+"\\">⚠️ Trễ <b>"+c.vt.treDL+"</b></li>";\n' +
'  html += "</ul></div>";\n' +
'  // KHO card\n' +
'  var sevK=severity({red:c.kho.red,requestHigh:c.kho.requestHigh});\n' +
'  html += "<div class=\\"card "+sevK+"\\"><h3>4. Kho — tồn & yêu cầu</h3>";\n' +
'  html += "<div class=\\"big "+sevK+"\\">"+c.kho.total+"</div>";\n' +
'  html += "<ul>";\n' +
'  html += "<li class=\\""+(c.kho.red>0?"alert":"")+"\\">🔴 Mã ĐỎ <b>"+c.kho.red+"</b></li>";\n' +
'  html += "<li class=\\""+(c.kho.yellow>0?"warn":"")+"\\">🟡 Mã VÀNG <b>"+c.kho.yellow+"</b></li>";\n' +
'  html += "<li>🟢 Mã XANH <b>"+c.kho.green+"</b></li>";\n' +
'  html += "<li>YC chờ tiếp nhận <b>"+c.kho.requestPending+"</b></li>";\n' +
'  html += "<li class=\\""+(c.kho.requestHigh>0?"alert":"")+"\\">🔴 YC CAO chưa cấp <b>"+c.kho.requestHigh+"</b></li>";\n' +
'  html += "</ul></div>";\n' +
'  html += "</div>";\n' +
'  // Top khoa\n' +
'  html += "<div class=\\"sh\\">📊 Khoa nào đang nhiều vấn đề nhất</div>";\n' +
'  html += "<div class=\\"bars\\">";\n' +
'  if(d.topKhoa.length===0)html += "<div class=\\"empty\\" style=\\"background:transparent;border:0;\\">(Không có dữ liệu khoa)</div>";\n' +
'  else{\n' +
'    var maxC = Math.max.apply(null, d.topKhoa.map(function(k){return k.count;}));\n' +
'    d.topKhoa.forEach(function(k){\n' +
'      var pct = (k.count/maxC*100).toFixed(0);\n' +
'      html += "<div class=\\"bar\\" data-khoa=\\""+esc(k.khoa)+"\\" style=\\"cursor:pointer\\">";\n' +
'      html += "<div class=\\"bar-name\\" title=\\""+esc(k.khoa)+"\\">"+esc(k.khoa)+"</div>";\n' +
'      html += "<div class=\\"bar-track\\"><div class=\\"bar-fill\\" style=\\"width:"+pct+"%\\"></div></div>";\n' +
'      html += "<div class=\\"bar-val\\">"+k.count+"</div></div>";\n' +
'    });\n' +
'  }\n' +
'  html += "</div>";\n' +
'  // Hot list\n' +
'  html += "<div class=\\"sh\\">🔥 Top "+d.hot.length+" điểm nóng cần xử lý</div>";\n' +
'  if(d.hot.length===0)html += "<div class=\\"empty\\">✓ Không có điểm nóng — chúc Sếp ngày yên ổn!</div>";\n' +
'  else{\n' +
'    html += "<div class=\\"hot-grid\\">";\n' +
'    d.hot.forEach(function(h,i){\n' +
'      html += "<div class=\\"hot\\" data-gid=\\""+(h.gid||"")+"\\" data-row=\\""+(h.sheetRow||"")+"\\">";\n' +
'      html += "<div class=\\"hot-num\\">"+(i+1)+"</div>";\n' +
'      html += "<div class=\\"hot-content\\">";\n' +
'      html += "<div class=\\"hot-title\\"><span class=\\"hot-team\\">"+esc(h.team)+"</span>"+esc(h.title)+"</div>";\n' +
'      if(h.subtitle)html += "<div class=\\"hot-sub\\">📍 "+esc(h.subtitle)+"</div>";\n' +
'      if(h.detail)html += "<div class=\\"hot-detail\\">"+esc(h.detail)+"</div>";\n' +
'      html += "</div>";\n' +
'      html += "<div class=\\"hot-badge\\">"+esc(h.badge||"")+"</div>";\n' +
'      html += "</div>";\n' +
'    });\n' +
'    html += "</div>";\n' +
'  }\n' +
'  $("#view-overview").innerHTML = html;\n' +
'  // Bind clicks\n' +
'  $$("#view-overview .hot").forEach(function(el){el.onclick=function(){openRow(el.dataset.gid,el.dataset.row);};});\n' +
'  $$("#view-overview .bar[data-khoa]").forEach(function(el){el.onclick=function(){\n' +
'    document.querySelector("#tabs button[data-view=khoa]").click();\n' +
'    setTimeout(function(){var sel=$("#khoa-select");if(sel){sel.value=el.dataset.khoa;sel.dispatchEvent(new Event("change"));}},300);\n' +
'  };});\n' +
'}\n' +
/* Render KT */
'function renderKT(d){\n' +
'  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n' +
'  if(d.missing){$("#view-kt").innerHTML="<div class=\\"error\\">Chưa có tab \\""+esc("Nhóm kỹ thuật")+"\\". Tạo trước hoặc đổi tên cho khớp.</div>";return;}\n' +
'  // Build filter options\n' +
'  var cosos = Array.from(new Set(d.rows.map(function(r){return r.coso;}).filter(Boolean))).sort();\n' +
'  var tinhs = Array.from(new Set(d.rows.map(function(r){return r.tinh;}).filter(Boolean))).sort();\n' +
'  var khoas = Array.from(new Set(d.rows.map(function(r){return r.khoa;}).filter(Boolean))).sort();\n' +
'  var html = "<div class=\\"filters\\">";\n' +
'  html += "<input id=\\"f-search\\" placeholder=\\"🔍 Tìm tên máy / khoa / chi tiết…\\">";\n' +
'  html += "<select id=\\"f-coso\\"><option value=\\"\\">Tất cả cơ sở</option>"+cosos.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"f-khoa\\"><option value=\\"\\">Tất cả khoa</option>"+khoas.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"f-tinh\\"><option value=\\"\\">Tất cả trạng thái</option>"+tinhs.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n' +
'  html += "<select id=\\"f-ut\\"><option value=\\"\\">Mọi cấp độ</option><option>CAO</option><option>Bình thường</option></select>";\n' +
'  html += "<label style=\\"color:#9CA3AF;font-size:12px;\\"><input type=\\"checkbox\\" id=\\"f-hide-thanhly\\" checked> Ẩn thanh lý</label>";\n' +
'  html += "<label style=\\"color:#9CA3AF;font-size:12px;\\"><input type=\\"checkbox\\" id=\\"f-hide-done\\"> Ẩn hoàn thành</label>";\n' +
'  html += "<span class=\\"badge\\" id=\\"kt-count\\">"+d.rows.length+" máy</span>";\n' +
'  html += "</div>";\n' +
'  html += "<div class=\\"tbl-wrap\\"><table class=\\"tbl\\" id=\\"kt-table\\">";\n' +
'  html += "<thead><tr><th>Tên máy</th><th>Khoa</th><th>Cơ sở</th><th>Tình trạng</th><th>Chi tiết</th><th>CB</th><th>Bước</th><th>Deadline</th><th>Vướng mắc</th><th>Cấp độ</th></tr></thead><tbody></tbody></table></div>";\n' +
'  $("#view-kt").innerHTML = html;\n' +
'  function applyKT(){\n' +
'    var q=$("#f-search").value.toLowerCase();\n' +
'    var cs=$("#f-coso").value, kh=$("#f-khoa").value, ti=$("#f-tinh").value, ut=$("#f-ut").value;\n' +
'    var hideTL=$("#f-hide-thanhly").checked, hideDone=$("#f-hide-done").checked;\n' +
'    var rows=d.rows.filter(function(r){\n' +
'      if(hideTL && r.tinh && r.tinh.toLowerCase().indexOf("thanh lý")>=0) return false;\n' +
'      if(hideDone && r.ht) return false;\n' +
'      if(cs && r.coso!==cs) return false;\n' +
'      if(kh && r.khoa!==kh) return false;\n' +
'      if(ti && r.tinh!==ti) return false;\n' +
'      if(ut==="CAO" && r.ut.toLowerCase().indexOf("cao")<0) return false;\n' +
'      if(ut==="Bình thường" && r.ut.toLowerCase().indexOf("cao")>=0) return false;\n' +
'      if(q){var hay=(r.ten+" "+r.khoa+" "+r.chitiet+" "+r.cb+" "+r.tinh).toLowerCase();if(hay.indexOf(q)<0)return false;}\n' +
'      return true;\n' +
'    });\n' +
'    rows.sort(function(a,b){\n' +
'      // CAO + chưa HT lên đầu, sau đó trễ deadline\n' +
'      var sa = (a.ut.toLowerCase().indexOf("cao")>=0?0:1) + (a.ht?2:0) + (a.tre?-3:0);\n' +
'      var sb = (b.ut.toLowerCase().indexOf("cao")>=0?0:1) + (b.ht?2:0) + (b.tre?-3:0);\n' +
'      return sa - sb;\n' +
'    });\n' +
'    var tb = $("#kt-table tbody");\n' +
'    tb.innerHTML = rows.map(function(r){\n' +
'      var pillT = r.tinh.toLowerCase().indexOf("thanh lý")>=0 ? "gray" : r.tinh.toLowerCase().indexOf("đang sửa")>=0 ? "yellow" : r.tinh.toLowerCase().indexOf("bảo trì")>=0 ? "blue" : r.tinh.toLowerCase()==="hỏng" ? "red" : "gray";\n' +
'      var pillU = r.ut.toLowerCase().indexOf("cao")>=0 ? "red" : "gray";\n' +
'      var dl = r.dl + (r.tre ? " <span class=\\"tre-badge\\">Trễ "+r.tre+"n</span>" : "");\n' +
'      var ten = (r.ht?"✓ ":"") + esc(r.ten);\n' +
'      return "<tr data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">"+\n' +
'        "<td><b>"+ten+"</b><div style=\\"font-size:11px;color:#6B7280;\\">"+esc(r.info)+"</div></td>"+\n' +
'        "<td>"+esc(r.khoa)+"</td>"+\n' +
'        "<td style=\\"font-size:11px\\">"+esc(r.coso)+"</td>"+\n' +
'        "<td><span class=\\"pill "+pillT+"\\">"+esc(r.tinh)+"</span></td>"+\n' +
'        "<td style=\\"max-width:280px;font-size:12px;\\">"+esc(r.chitiet)+"</td>"+\n' +
'        "<td style=\\"font-size:12px;\\">"+esc(r.cb)+"</td>"+\n' +
'        "<td style=\\"max-width:240px;font-size:11px;color:#9CA3AF;\\">"+esc(r.buoc)+"</td>"+\n' +
'        "<td style=\\"font-size:11px;\\">"+dl+"</td>"+\n' +
'        "<td style=\\"max-width:200px;font-size:11px;color:#FCA5A5;\\">"+esc(r.vuong)+"</td>"+\n' +
'        "<td><span class=\\"pill "+pillU+"\\">"+esc(r.ut||"-")+"</span></td>"+\n' +
'        "</tr>";\n' +
'    }).join("");\n' +
'    $("#kt-count").textContent = rows.length+" máy";\n' +
'    $$("#kt-table tbody tr").forEach(function(tr){tr.onclick=function(){openRow(tr.dataset.gid,tr.dataset.row);};});\n' +
'  }\n' +
'  ["#f-search","#f-coso","#f-khoa","#f-tinh","#f-ut","#f-hide-thanhly","#f-hide-done"].forEach(function(s){var el=$(s);if(el)el.oninput=el.onchange=applyKT;});\n' +
'  applyKT();\n' +
'}\n' +
/* Render HS Pipeline */
'function renderHS(d){\n' +
'  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n' +
'  if(d.missing){$("#view-hs").innerHTML="<div class=\\"error\\">Chưa có tab \\""+esc("Nhóm Hồ sơ")+"\\".</div>";return;}\n' +
'  var html = "<div class=\\"sh\\">📁 Pipeline gói thầu (theo Trạng thái)</div>";\n' +
'  if(d.pipeline.length===0)html += "<div class=\\"empty\\">Chưa có gói thầu nào đang xử lý.</div>";\n' +
'  else{\n' +
'    html += "<div class=\\"pipeline\\">";\n' +
'    d.pipeline.forEach(function(col){\n' +
'      html += "<div class=\\"col\\"><div class=\\"col-head\\">"+esc(col.name)+"<span class=\\"col-count\\">"+col.count+"</span></div><div class=\\"col-body\\">";\n' +
'      col.items.forEach(function(it){\n' +
'        html += "<div class=\\"kanban-card\\" data-gid=\\""+it.gid+"\\" data-row=\\""+it.idx+"\\">";\n' +
'        if(it.ma)html += "<div class=\\"ma\\">"+esc(it.ma)+"</div>";\n' +
'        html += "<div class=\\"nd\\">"+esc(it.nd.length>100?it.nd.substring(0,100)+"…":it.nd)+"</div>";\n' +
'        html += "<div class=\\"meta\\">";\n' +
'        html += "<span>"+esc(it.khoa||"")+"</span>";\n' +
'        if(it.tre)html += "<span class=\\"tre-badge\\">Trễ "+it.tre+"n</span>";\n' +
'        else if(it.gt)html += "<span style=\\"color:#60A5FA\\">"+esc(fmtVnd(it.gt))+"</span>";\n' +
'        html += "</div>";\n' +
'        if(it.pct!==null)html += "<div class=\\"progress\\"><div class=\\"progress-fill\\" style=\\"width:"+it.pct+"%\\"></div></div>";\n' +
'        html += "</div>";\n' +
'      });\n' +
'      html += "</div></div>";\n' +
'    });\n' +
'    html += "</div>";\n' +
'  }\n' +
'  // Bảng vướng mắc\n' +
'  var stuck = d.rows.filter(function(r){return !r.ht && r.vuong;});\n' +
'  html += "<div class=\\"sh\\">🚧 Vướng mắc cần giải quyết ("+stuck.length+")</div>";\n' +
'  if(stuck.length===0)html += "<div class=\\"empty\\">Không có gói thầu nào báo vướng mắc.</div>";\n' +
'  else{\n' +
'    html += "<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Mã HS</th><th>Nội dung</th><th>Khoa</th><th>Trạng thái</th><th>Vướng mắc</th><th>CB</th><th>Deadline</th></tr></thead><tbody>";\n' +
'    stuck.forEach(function(r){\n' +
'      var dl = r.dl + (r.tre?" <span class=\\"tre-badge\\">Trễ "+r.tre+"n</span>":"");\n' +
'      html += "<tr data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'      html += "<td><b style=\\"color:#60A5FA\\">"+esc(r.ma)+"</b></td>";\n' +
'      html += "<td style=\\"max-width:280px;font-size:12px;\\">"+esc(r.nd)+"</td>";\n' +
'      html += "<td>"+esc(r.khoa)+"</td>";\n' +
'      html += "<td><span class=\\"pill yellow\\">"+esc(r.tt)+"</span></td>";\n' +
'      html += "<td style=\\"max-width:280px;font-size:12px;color:#FCA5A5\\">"+esc(r.vuong)+"</td>";\n' +
'      html += "<td style=\\"font-size:12px\\">"+esc(r.cb)+"</td>";\n' +
'      html += "<td style=\\"font-size:11px\\">"+dl+"</td></tr>";\n' +
'    });\n' +
'    html += "</tbody></table></div>";\n' +
'  }\n' +
'  $("#view-hs").innerHTML = html;\n' +
'  $$("#view-hs .kanban-card, #view-hs tbody tr").forEach(function(el){el.onclick=function(){openRow(el.dataset.gid,el.dataset.row);};});\n' +
'}\n' +
/* Render VTTH */
'function renderVT(d){\n' +
'  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n' +
'  if(d.missing){$("#view-vt").innerHTML="<div class=\\"error\\">Chưa có tab \\""+esc("Nhóm vật tư tiêu hao- hóa chất")+"\\".</div>";return;}\n' +
'  var html = "<div class=\\"sh\\">🧪 Task vật tư / hóa chất ("+d.rows.length+")</div>";\n' +
'  if(d.rows.length===0)html += "<div class=\\"empty\\">Không có task nào.</div>";\n' +
'  else{\n' +
'    var rows = d.rows.slice().sort(function(a,b){\n' +
'      if(a.ht!==b.ht) return a.ht?1:-1;\n' +
'      if(!!a.tre !== !!b.tre) return a.tre?-1:1;\n' +
'      return (b.pct||0)-(a.pct||0);\n' +
'    });\n' +
'    html += "<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Loại</th><th>Khoa</th><th>Cơ sở</th><th>CB</th><th>Trạng thái</th><th>Tiến độ</th><th>%</th><th>Deadline</th><th>Vướng mắc</th><th>HT</th></tr></thead><tbody>";\n' +
'    rows.forEach(function(r){\n' +
'      var dl = r.dl + (r.tre?" <span class=\\"tre-badge\\">Trễ "+r.tre+"n</span>":"");\n' +
'      var pillU = r.ut.toLowerCase().indexOf("cao")>=0?"red":"gray";\n' +
'      var pct = r.pct!==null?(r.pct+"%"):"-";\n' +
'      html += "<tr data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
'      html += "<td style=\\"max-width:280px\\"><b>"+esc(r.loai)+"</b></td>";\n' +
'      html += "<td>"+esc(r.khoa)+"</td>";\n' +
'      html += "<td style=\\"font-size:11px\\">"+esc(r.coso)+"</td>";\n' +
'      html += "<td style=\\"font-size:12px\\">"+esc(r.cb)+"</td>";\n' +
'      html += "<td><span class=\\"pill blue\\">"+esc(r.tt||"-")+"</span></td>";\n' +
'      html += "<td style=\\"font-size:11px;color:#9CA3AF;max-width:240px\\">"+esc(r.buoc)+"</td>";\n' +
'      html += "<td class=\\"num\\">"+pct+"</td>";\n' +
'      html += "<td style=\\"font-size:11px\\">"+dl+"</td>";\n' +
'      html += "<td style=\\"max-width:200px;font-size:11px;color:#FCA5A5\\">"+esc(r.vuong)+"</td>";\n' +
'      html += "<td>"+(r.ht?"✓":"⏳")+"</td></tr>";\n' +
'    });\n' +
'    html += "</tbody></table></div>";\n' +
'  }\n' +
'  $("#view-vt").innerHTML = html;\n' +
'  $$("#view-vt tbody tr").forEach(function(tr){tr.onclick=function(){openRow(tr.dataset.gid,tr.dataset.row);};});\n' +
'}\n' +
/* Render Kho */
'function renderKho(d){\n' +
'  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n' +
'  var html = "<div class=\\"sh\\">📦 Tồn kho ("+d.ton.length+" mặt hàng) — sort theo độ ưu tiên & DOH</div>";\n' +
'  if(d.ton.length===0)html += "<div class=\\"empty\\">Tab 5A chưa có dữ liệu. Chạy bootstrap() và nhập tồn kho vào.</div>";\n' +
'  else{\n' +
'    html += "<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Mã</th><th>Tên VTTH</th><th>Loại</th><th class=\\"num\\">Tồn</th><th class=\\"num\\">MIN</th><th class=\\"num\\">DOH</th><th>Cảnh báo</th><th>Khoa nhiều nhất</th><th class=\\"num\\">Số khoa chờ</th><th>Đề xuất</th></tr></thead><tbody>";\n' +
'    d.ton.forEach(function(r){\n' +
'      var pill = r.tt.indexOf("ĐỎ")>=0?"red":r.tt.indexOf("VÀNG")>=0?"yellow":r.tt.indexOf("XANH")>=0?"green":"gray";\n' +
'      var dohTxt = r.doh!==null && r.doh!==undefined ? r.doh + " ngày" : "-";\n' +
'      var dohClass = r.doh!==null && r.doh<=3 ? "color:#EF4444;font-weight:700" : r.doh!==null && r.doh<=7 ? "color:#F59E0B;font-weight:600" : "";\n' +
'      html += "<tr data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
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
'      html += "<tr data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
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
'  $$("#view-kho tbody tr").forEach(function(tr){tr.onclick=function(){openRow(tr.dataset.gid,tr.dataset.row);};});\n' +
'}\n' +
/* Render Theo Khoa */
'function renderKhoaList(d){\n' +
'  var html = "<div class=\\"filters\\"><label style=\\"color:#9CA3AF\\">Chọn khoa:</label>";\n' +
'  html += "<select id=\\"khoa-select\\" style=\\"min-width:340px\\"><option value=\\"\\">— Chọn khoa —</option>";\n' +
'  d.khoaList.forEach(function(k){html += "<option>"+esc(k)+"</option>";});\n' +
'  html += "</select></div>";\n' +
'  html += "<div id=\\"khoa-detail\\"><div class=\\"empty\\">👆 Chọn khoa ở trên để xem toàn bộ vấn đề (kỹ thuật + hồ sơ + vật tư + kho) liên quan đến khoa đó.</div></div>";\n' +
'  $("#view-khoa").innerHTML = html;\n' +
'  $("#khoa-select").onchange = function(){\n' +
'    var k = this.value;\n' +
'    if(!k){$("#khoa-detail").innerHTML="<div class=\\"empty\\">Chưa chọn khoa.</div>";return;}\n' +
'    $("#khoa-detail").innerHTML = "<div class=\\"loading\\">Đang tải dữ liệu khoa "+esc(k)+"…</div>";\n' +
'    google.script.run.withSuccessHandler(renderKhoaDetail).withFailureHandler(showErr).getByKhoa(k);\n' +
'  };\n' +
'}\n' +
'function renderKhoaDetail(d){\n' +
'  var s = d.summary;\n' +
'  var html = "<div class=\\"sh\\">🏥 Khoa: "+esc(d.khoa)+"</div>";\n' +
'  html += "<div class=\\"khoa-summary\\">";\n' +
'  html += "<div class=\\"khoa-card\\"><h4>🔧 Máy hỏng</h4><div class=\\"v\\" style=\\"color:"+(s.totalKT>0?"#EF4444":"#10B981")+"\\">"+s.totalKT+"</div><div style=\\"font-size:11px;color:#9CA3AF\\">Đã xong: "+s.doneKT+"</div></div>";\n' +
'  html += "<div class=\\"khoa-card\\"><h4>📁 Gói thầu / Hồ sơ</h4><div class=\\"v\\" style=\\"color:"+(s.totalHS>0?"#F59E0B":"#10B981")+"\\">"+s.totalHS+"</div><div style=\\"font-size:11px;color:#9CA3AF\\">Đã xong: "+s.doneHS+"</div></div>";\n' +
'  html += "<div class=\\"khoa-card\\"><h4>🧪 Task vật tư</h4><div class=\\"v\\">"+s.totalVT+"</div></div>";\n' +
'  html += "<div class=\\"khoa-card\\"><h4>📦 YC kho</h4><div class=\\"v\\">"+s.totalKho+"</div></div>";\n' +
'  html += "</div>";\n' +
'  // KT\n' +
'  if(d.kt.length){\n' +
'    html += "<div class=\\"sh\\">🔧 Máy của khoa</div>";\n' +
'    html += "<div class=\\"tbl-wrap\\"><table class=\\"tbl\\"><thead><tr><th>Tên máy</th><th>Tình trạng</th><th>Chi tiết</th><th>CB</th><th>Bước</th><th>Deadline</th><th>HT</th></tr></thead><tbody>";\n' +
'    d.kt.forEach(function(r){\n' +
'      var pill = r.tinh.toLowerCase().indexOf("đang sửa")>=0?"yellow":r.tinh.toLowerCase().indexOf("thanh lý")>=0?"gray":"blue";\n' +
'      html += "<tr data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
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
'      html += "<tr data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
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
'      html += "<tr data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
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
'      var pillUT = r.ut.indexOf("CAO")>=0?"red":"gray";\n' +
'      html += "<tr data-gid=\\""+r.gid+"\\" data-row=\\""+r.idx+"\\">";\n' +
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
'  $$("#khoa-detail tbody tr").forEach(function(tr){if(tr.dataset.gid)tr.onclick=function(){openRow(tr.dataset.gid,tr.dataset.row);};});\n' +
'}\n' +
/* Loaders */
'function showErr(err){var s=$("#view-"+STATE.currentView);if(s)s.innerHTML="<div class=\\"error\\">⚠️ Lỗi tải dữ liệu: "+esc(err && err.message || err)+"</div>";}\n' +
'function loadView(v){\n' +
'  if(v==="overview"){google.script.run.withSuccessHandler(renderOverview).withFailureHandler(showErr).getOverview();}\n' +
'  else if(v==="kt"){google.script.run.withSuccessHandler(renderKT).withFailureHandler(showErr).getKyThuat();}\n' +
'  else if(v==="hs"){google.script.run.withSuccessHandler(renderHS).withFailureHandler(showErr).getHoSo();}\n' +
'  else if(v==="vt"){google.script.run.withSuccessHandler(renderVT).withFailureHandler(showErr).getVTTH();}\n' +
'  else if(v==="kho"){google.script.run.withSuccessHandler(renderKho).withFailureHandler(showErr).getKho();}\n' +
'  else if(v==="khoa"){google.script.run.withSuccessHandler(renderKhoaList).withFailureHandler(showErr).getByKhoa("");}\n' +
'}\n' +
/* Initial load */
'loadView("overview");\n' +
/* Auto-refresh current view every 60s */
'setInterval(function(){loadView(STATE.currentView);},60000);\n' +
'})();\n' +
'</script>\n' +
'</body></html>';
