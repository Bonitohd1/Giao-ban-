/**
 * ============================================================================
 *  BỆNH VIỆN K — PHÒNG VT-TBYT
 *  HỆ THỐNG BÁO CÁO GIAO BAN v2 — APPS SCRIPT
 * ----------------------------------------------------------------------------
 *  Tác vụ:
 *    1. setupTriggers()          — Cài 3 trigger (chạy 1 lần lúc setup).
 *    2. onEdit(e)                — Highlight + log realtime khi tổ nhập.
 *    3. runAggregator()          — Tổng hợp số liệu lên Dashboard mỗi 15 phút.
 *    4. sendMorningBrief()       — Gửi email Brief Sáng 7:30.
 *    5. flagHotIssues()          — Quét điểm nóng → email cảnh báo (dedupe 1/ngày).
 *    6. prepareBriefingMode()    — Sinh tóm tắt 4 tổ trước họp với GĐ.
 *    7. menu (onOpen)            — Thêm menu 'Giao ban' trên Sheet.
 * ============================================================================
 */

// ===================== CONFIG (Sếp sửa các hằng số dưới đây) =====================
const SHEET_ID = "18Dvv9lYosbfqIiH4uge4HMpIL-vaPxalQw5BzEfbFQ4";  // ID Google Sheet
const TIMEZONE = "Asia/Ho_Chi_Minh";

// Email — sửa thành email thực tế
const EMAIL_TRUONG_PHONG = "ducphamhn01@gmail.com";
const EMAIL_TO_KY_THUAT = "";   // tổ trưởng kỹ thuật
const EMAIL_TO_HO_SO    = "";   // tổ trưởng hồ sơ
const EMAIL_TO_VT       = "";   // tổ trưởng vật tư
const EMAIL_TO_KHO      = "";   // tổ trưởng kho

// Tên các tab (đúng như đã tạo trong Sheet)
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
  LOG_HOT:     "log_hot_issues"   // tự tạo
};

// ===================== MENU =====================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📊 Giao ban")
    .addItem("🔄 Cập nhật Dashboard ngay", "runAggregator")
    .addItem("📧 Gửi Brief Sáng (test)", "sendMorningBrief")
    .addItem("🔥 Quét điểm nóng (test)", "flagHotIssues")
    .addSeparator()
    .addItem("📋 Briefing mode (trước họp GĐ)", "prepareBriefingMode")
    .addSeparator()
    .addItem("⚙️ Cài đặt Triggers (1 lần)", "setupTriggers")
    .addToUi();
}

// ===================== SETUP TRIGGERS =====================
function setupTriggers() {
  // Xoá trigger cũ
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  const ss = SpreadsheetApp.openById(SHEET_ID);

  // 1. onEdit
  ScriptApp.newTrigger("onEdit").forSpreadsheet(ss).onEdit().create();

  // 2. Aggregator mỗi 15 phút
  ScriptApp.newTrigger("runAggregator").timeBased().everyMinutes(15).create();

  // 3. Brief Sáng 7:30
  ScriptApp.newTrigger("sendMorningBrief").timeBased().atHour(7).nearMinute(30).everyDays(1).create();

  // 4. Quét điểm nóng — 8h, 11h, 14h, 17h
  [8, 11, 14, 17].forEach(h => {
    ScriptApp.newTrigger("flagHotIssues").timeBased().atHour(h).nearMinute(0).everyDays(1).create();
  });

  SpreadsheetApp.getUi().alert("✅ Đã cài đặt xong " + ScriptApp.getProjectTriggers().length + " trigger.");
}

// ===================== ON EDIT =====================
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const row = e.range.getRow();

  if (row < 2) return; // bỏ qua header

  // Highlight ô vừa nhập (vàng nhạt 2 giây) — chỉ debug
  // Thực tế: log thay đổi vào tab log
  try {
    const log = getOrCreateSheet_("_change_log", ["Thời điểm", "Tổ", "Sheet", "Ô", "Giá trị mới", "Người sửa"]);
    log.appendRow([
      new Date(),
      mapSheetToTeam_(sheetName),
      sheetName,
      e.range.getA1Notation(),
      String(e.value || "").substring(0, 200),
      e.user ? e.user.getEmail() : ""
    ]);
  } catch (err) {
    Logger.log("onEdit log error: " + err);
  }

  // Auto-fill STT cho dòng vừa nhập (nếu cột B vừa có giá trị mà cột A trống)
  if ([TAB.KHO_5A, TAB.KHO_5B, TAB.VTTH].indexOf(sheetName) >= 0) {
    const sttCell = sheet.getRange(row, 1);
    if (!sttCell.getValue() && e.range.getColumn() === 2) {
      sttCell.setValue(row - 1);
    }
  }
}

function mapSheetToTeam_(name) {
  if (name.indexOf("kỹ thuật") >= 0) return "Kỹ thuật";
  if (name.indexOf("Hồ sơ") >= 0) return "Hồ sơ";
  if (name.indexOf("vật tư") >= 0 || name.indexOf("VTTH") >= 0) return "Vật tư";
  if (name.indexOf("kho") >= 0 || name.indexOf("Kho") >= 0) return "Kho";
  return "Khác";
}

function getOrCreateSheet_(name, headers) {
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

// ===================== AGGREGATOR =====================
function runAggregator() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const dash = getOrCreateSheet_(TAB.DASHBOARD, []);
  dash.clear();

  // ---- TIÊU ĐỀ ----
  dash.getRange("B2").setValue("DASHBOARD GIAO BAN PHÒNG VT-TBYT")
    .setFontSize(16).setFontWeight("bold").setFontColor("#1F4E78");
  dash.getRange("B3").setValue("Cập nhật: " + Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy HH:mm"))
    .setFontStyle("italic").setFontColor("#595959");

  let row = 5;
  const stats = computeStats_();

  // ---- BLOCK 1: KỸ THUẬT ----
  row = renderBlock_(dash, row, "1. KỸ THUẬT — Thiết bị hỏng / đang sửa", "#1F4E78", [
    ["Tổng đầu việc",                stats.kt.total],
    ["Đã hoàn thành",                stats.kt.done],
    ["Đang xử lý",                   stats.kt.inProgress],
    ["⚠️ Trễ deadline",              stats.kt.overdue,    stats.kt.overdue > 0 ? "#FFC7CE" : null],
    ["🔴 ƯU TIÊN CAO (khoa trọng yếu)", stats.kt.priorityHigh, stats.kt.priorityHigh > 0 ? "#FFC7CE" : null]
  ]);

  // ---- BLOCK 2: HỒ SƠ ----
  row = renderBlock_(dash, row + 1, "2. HỒ SƠ — Gói thầu / quy trình", "#1F4E78", [
    ["Tổng đầu việc",       stats.hs.total],
    ["Đang xử lý",          stats.hs.inProgress],
    ["⚠️ Vướng mắc",        stats.hs.stuck,    stats.hs.stuck > 0 ? "#FFC7CE" : null],
    ["⚠️ Trễ deadline",     stats.hs.overdue,  stats.hs.overdue > 0 ? "#FFC7CE" : null]
  ]);

  // ---- BLOCK 3: VẬT TƯ TIÊU HAO ----
  row = renderBlock_(dash, row + 1, "3. VẬT TƯ TIÊU HAO - HOÁ CHẤT", "#1F4E78", [
    ["Tổng đầu việc",            stats.vt.total],
    ["🔴 Ưu tiên CAO",           stats.vt.priorityHigh, stats.vt.priorityHigh > 0 ? "#FFC7CE" : null],
    ["⚠️ Vướng mắc / chờ duyệt", stats.vt.stuck,    stats.vt.stuck > 0 ? "#FFC7CE" : null]
  ]);

  // ---- BLOCK 4: KHO ----
  row = renderBlock_(dash, row + 1, "4. KHO — Tồn & Đề xuất khoa phòng", "#1F4E78", [
    ["🔴 Mã ĐỎ (hết / cực thấp)",          stats.kho.red,        stats.kho.red > 0 ? "#FFC7CE" : null],
    ["🟡 Mã VÀNG",                          stats.kho.yellow,     stats.kho.yellow > 0 ? "#FFEB9C" : null],
    ["Yêu cầu chờ tiếp nhận",               stats.kho.requestPending],
    ["🔴 Yêu cầu CAO chưa cấp đủ",          stats.kho.requestHigh, stats.kho.requestHigh > 0 ? "#FFC7CE" : null]
  ]);

  // ---- BLOCK 5: TỔNG HỢP HOT ITEMS ----
  row += 1;
  dash.getRange(row, 2).setValue("5. TOP ĐIỂM NÓNG (3 mục cần Sếp lưu ý nhất)")
    .setFontWeight("bold").setBackground("#C00000").setFontColor("#FFFFFF").setFontSize(12);
  dash.getRange(row, 2, 1, 4).merge();
  row++;
  const hot = stats.hot.slice(0, 5);
  if (hot.length === 0) {
    dash.getRange(row, 2).setValue("(Không có điểm nóng — tốt!)")
      .setFontStyle("italic").setFontColor("#107C10");
  } else {
    hot.forEach(h => {
      dash.getRange(row, 2).setValue("• " + h.team + " — " + h.title);
      dash.getRange(row, 2, 1, 4).merge();
      dash.getRange(row, 2).setFontColor("#C00000").setFontWeight("bold");
      row++;
    });
  }

  // Format chung
  dash.setColumnWidth(1, 30);
  dash.setColumnWidth(2, 360);
  dash.setColumnWidth(3, 120);
  dash.setColumnWidth(4, 200);
}

function renderBlock_(sheet, startRow, title, headerBg, items) {
  sheet.getRange(startRow, 2).setValue(title)
    .setFontWeight("bold").setBackground(headerBg).setFontColor("#FFFFFF").setFontSize(12);
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

// ===================== COMPUTE STATS =====================
function computeStats_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const stats = { kt: {}, hs: {}, vt: {}, kho: {}, hot: [] };

  // Kỹ thuật
  stats.kt = analyzeSheet_(ss, TAB.KY_THUAT, {
    statusCol: "Tình trạng",
    doneCol: "Đã Hoàn Thành",
    deadlineCol: "Deadline",
    priorityCol: "Cấp độ ưu tiên"
  });

  // Hồ sơ
  stats.hs = analyzeSheet_(ss, TAB.HO_SO, {
    statusCol: "Tình trạng",
    deadlineCol: "Deadline",
    stuckValue: "Vướng mắc"
  });

  // VTTH
  stats.vt = analyzeSheet_(ss, TAB.VTTH, {
    statusCol: "Trạng thái",
    priorityCol: "Cấp độ ưu tiên",
    stuckValue: "Vướng mắc"
  });

  // Kho
  stats.kho = analyzeKho_(ss);

  // Hot items
  stats.hot = collectHotItems_(ss, stats);
  return stats;
}

function analyzeSheet_(ss, tabName, opts) {
  const out = { total: 0, done: 0, inProgress: 0, overdue: 0, stuck: 0, priorityHigh: 0 };
  const sheet = ss.getSheetByName(tabName);
  if (!sheet) return out;
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return out;
  const headers = data[0];
  const idx = (n) => headers.indexOf(n);

  const iStatus = opts.statusCol ? idx(opts.statusCol) : -1;
  const iDone = opts.doneCol ? idx(opts.doneCol) : -1;
  const iDeadline = opts.deadlineCol ? idx(opts.deadlineCol) : -1;
  const iPriority = opts.priorityCol ? idx(opts.priorityCol) : -1;

  const today = new Date();
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row[1] && !row[2]) continue; // dòng trống
    out.total++;

    if (iDone >= 0 && String(row[iDone]).toUpperCase() === "X") out.done++;
    else out.inProgress++;

    if (iDeadline >= 0 && row[iDeadline] instanceof Date) {
      if (row[iDeadline] < today && (iDone < 0 || String(row[iDone]).toUpperCase() !== "X")) {
        out.overdue++;
      }
    }
    if (iStatus >= 0 && opts.stuckValue && row[iStatus] === opts.stuckValue) out.stuck++;
    if (iPriority >= 0 && String(row[iPriority]).toUpperCase().indexOf("CAO") >= 0) out.priorityHigh++;
  }
  return out;
}

function analyzeKho_(ss) {
  const out = { red: 0, yellow: 0, requestPending: 0, requestHigh: 0 };

  // 5A - tồn
  const s5a = ss.getSheetByName(TAB.KHO_5A);
  if (s5a) {
    const data = s5a.getDataRange().getValues();
    const headers = data[0] || [];
    const iStatus = headers.indexOf("Trạng thái cảnh báo");
    if (iStatus >= 0) {
      for (let r = 1; r < data.length; r++) {
        const v = String(data[r][iStatus] || "");
        if (v.indexOf("ĐỎ") >= 0) out.red++;
        else if (v.indexOf("VÀNG") >= 0) out.yellow++;
      }
    }
  }

  // 5B - đề xuất
  const s5b = ss.getSheetByName(TAB.KHO_5B);
  if (s5b) {
    const data = s5b.getDataRange().getValues();
    const headers = data[0] || [];
    const iStatus = headers.indexOf("Trạng thái xử lý");
    const iPriority = headers.indexOf("Mức ưu tiên");
    if (iStatus >= 0) {
      for (let r = 1; r < data.length; r++) {
        const status = String(data[r][iStatus] || "");
        const priority = iPriority >= 0 ? String(data[r][iPriority] || "") : "";
        if (status === "Chờ tiếp nhận") out.requestPending++;
        if (priority.indexOf("CAO") >= 0 && status !== "Đã cấp đủ") out.requestHigh++;
      }
    }
  }
  return out;
}

function collectHotItems_(ss, stats) {
  const hot = [];

  // Kỹ thuật: TB hỏng tại khoa trọng yếu
  const kt = ss.getSheetByName(TAB.KY_THUAT);
  if (kt) {
    const data = kt.getDataRange().getValues();
    const h = data[0] || [];
    const iTen = h.indexOf("Tên Thiết Bị");
    const iKhoa = h.indexOf("Khoa");
    const iPri = h.indexOf("Cấp độ ưu tiên");
    const iDone = h.indexOf("Đã Hoàn Thành");
    for (let r = 1; r < data.length && hot.length < 10; r++) {
      const pri = iPri >= 0 ? String(data[r][iPri] || "") : "";
      const done = iDone >= 0 ? String(data[r][iDone] || "") : "";
      if (pri.indexOf("CAO") >= 0 && done.toUpperCase() !== "X") {
        hot.push({
          team: "KT",
          title: (data[r][iTen] || "?") + " — " + (data[r][iKhoa] || "?")
        });
      }
    }
  }

  // Kho: mã ĐỎ
  const kho = ss.getSheetByName(TAB.KHO_5A);
  if (kho) {
    const data = kho.getDataRange().getValues();
    const h = data[0] || [];
    const iTen = h.indexOf("Tên VTTH");
    const iStatus = h.indexOf("Trạng thái cảnh báo");
    for (let r = 1; r < data.length && hot.length < 10; r++) {
      const status = iStatus >= 0 ? String(data[r][iStatus] || "") : "";
      if (status.indexOf("ĐỎ") >= 0) {
        hot.push({ team: "KHO", title: (data[r][iTen] || "?") + " — " + status });
      }
    }
  }

  return hot;
}

// ===================== MORNING BRIEF =====================
function sendMorningBrief() {
  runAggregator();  // refresh số liệu trước khi gửi
  const stats = computeStats_();
  const dateStr = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy");
  const sheetUrl = "https://docs.google.com/spreadsheets/d/" + SHEET_ID;

  const subject = "[GIAO BAN] Brief Sáng " + dateStr + " — Phòng VT-TBYT";

  let html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">';
  html += '<h2 style="color:#1F4E78;border-bottom:2px solid #1F4E78;padding-bottom:8px;">📊 Brief Sáng — ' + dateStr + '</h2>';

  html += '<table style="width:100%;border-collapse:collapse;margin:12px 0;">';
  html += '<tr style="background:#1F4E78;color:#fff;"><th style="padding:8px;text-align:left;">Tổ</th><th>Tổng</th><th>Đang xử lý</th><th style="color:#FFD966;">⚠️ Cần lưu ý</th></tr>';

  html += rowBrief_("KỸ THUẬT", stats.kt.total, stats.kt.inProgress,
    [stats.kt.priorityHigh > 0 ? `🔴 ${stats.kt.priorityHigh} TB CAO chưa xong` : null,
     stats.kt.overdue > 0 ? `⚠️ ${stats.kt.overdue} TB trễ deadline` : null]);
  html += rowBrief_("HỒ SƠ", stats.hs.total, stats.hs.inProgress,
    [stats.hs.stuck > 0 ? `🔴 ${stats.hs.stuck} gói vướng` : null,
     stats.hs.overdue > 0 ? `⚠️ ${stats.hs.overdue} trễ` : null]);
  html += rowBrief_("VẬT TƯ", stats.vt.total, stats.vt.inProgress,
    [stats.vt.priorityHigh > 0 ? `🔴 ${stats.vt.priorityHigh} ưu tiên CAO` : null,
     stats.vt.stuck > 0 ? `⚠️ ${stats.vt.stuck} vướng/chờ duyệt` : null]);
  html += rowBrief_("KHO", "—", "—",
    [stats.kho.red > 0 ? `🔴 ${stats.kho.red} mã ĐỎ` : null,
     stats.kho.yellow > 0 ? `🟡 ${stats.kho.yellow} mã VÀNG` : null,
     stats.kho.requestHigh > 0 ? `🔴 ${stats.kho.requestHigh} yêu cầu CAO chưa cấp` : null]);
  html += '</table>';

  // Hot items
  html += '<h3 style="color:#C00000;">🔥 TOP điểm nóng</h3>';
  if (stats.hot.length === 0) {
    html += '<p style="color:#107C10;font-style:italic;">(Không có — chúc Sếp một ngày yên ổn!)</p>';
  } else {
    html += '<ol>';
    stats.hot.slice(0, 5).forEach(h => {
      html += '<li><b>[' + h.team + ']</b> ' + h.title + '</li>';
    });
    html += '</ol>';
  }

  html += '<p style="margin-top:20px;"><a href="' + sheetUrl + '" style="background:#1F4E78;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Mở Sheet đầy đủ →</a></p>';
  html += '<p style="font-size:11px;color:#999;margin-top:24px;">Email tự động — gửi 7:30 mỗi sáng. Cập nhật cuối: ' + Utilities.formatDate(new Date(), TIMEZONE, "HH:mm dd/MM/yyyy") + '</p>';
  html += '</div>';

  const recipients = [EMAIL_TRUONG_PHONG, EMAIL_TO_KY_THUAT, EMAIL_TO_HO_SO, EMAIL_TO_VT, EMAIL_TO_KHO]
    .filter(e => e && e.indexOf("@") > 0).join(",");

  if (!recipients) {
    Logger.log("⚠️ Chưa cấu hình email — không gửi.");
    return;
  }
  MailApp.sendEmail({ to: recipients, subject: subject, htmlBody: html });
  Logger.log("Đã gửi Brief Sáng tới: " + recipients);
}

function rowBrief_(team, total, inProgress, alerts) {
  const alertText = alerts.filter(a => a).join("<br>") || '<span style="color:#107C10;">✓ ổn</span>';
  return '<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">' + team + '</td>' +
    '<td style="text-align:center;border-bottom:1px solid #eee;">' + total + '</td>' +
    '<td style="text-align:center;border-bottom:1px solid #eee;">' + inProgress + '</td>' +
    '<td style="border-bottom:1px solid #eee;">' + alertText + '</td></tr>';
}

// ===================== HOT ISSUES SCAN (dedupe 1/ngày) =====================
function flagHotIssues() {
  const stats = computeStats_();
  const today = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
  const log = getOrCreateSheet_(TAB.LOG_HOT, ["Ngày", "Mã sự kiện", "Mô tả", "Đã gửi"]);
  const data = log.getDataRange().getValues();
  const sentToday = new Set();
  data.forEach(r => { if (r[0] === today) sentToday.add(r[1]); });

  const events = [];
  if (stats.kt.priorityHigh > 0) events.push({ id: "KT_HIGH_" + stats.kt.priorityHigh, msg: "Có " + stats.kt.priorityHigh + " TB ưu tiên CAO chưa hoàn thành." });
  if (stats.kho.red > 0) events.push({ id: "KHO_RED_" + stats.kho.red, msg: "Có " + stats.kho.red + " mã kho ĐỎ (hết/cực thấp)." });
  if (stats.kho.requestHigh > 0) events.push({ id: "KHO_REQ_HIGH_" + stats.kho.requestHigh, msg: "Có " + stats.kho.requestHigh + " yêu cầu CAO của khoa trọng yếu chưa cấp đủ." });
  if (stats.hs.stuck >= 3) events.push({ id: "HS_STUCK_" + stats.hs.stuck, msg: "Có " + stats.hs.stuck + " gói thầu/hồ sơ đang vướng mắc." });

  events.forEach(e => {
    if (sentToday.has(e.id)) return;
    MailApp.sendEmail({
      to: EMAIL_TRUONG_PHONG,
      subject: "[CẢNH BÁO ĐIỂM NÓNG] " + e.msg,
      htmlBody: '<div style="font-family:Arial;color:#333;"><h3 style="color:#C00000;">🔥 Cảnh báo điểm nóng</h3><p>' + e.msg + '</p><p><a href="https://docs.google.com/spreadsheets/d/' + SHEET_ID + '">Mở Sheet để xem chi tiết</a></p></div>'
    });
    log.appendRow([today, e.id, e.msg, "✓"]);
  });
}

// ===================== BRIEFING MODE (trước họp với GĐ) =====================
function prepareBriefingMode() {
  const stats = computeStats_();
  const dateStr = Utilities.formatDate(new Date(), TIMEZONE, "dd/MM/yyyy HH:mm");

  let summary = "📋 BRIEFING ĐỘT XUẤT — " + dateStr + "\n\n";
  summary += "1. KỸ THUẬT — Tổng " + stats.kt.total + " | Hoàn thành " + stats.kt.done +
    " | Đang xử lý " + stats.kt.inProgress + " | 🔴 CAO: " + stats.kt.priorityHigh + " | Trễ: " + stats.kt.overdue + "\n";
  summary += "2. HỒ SƠ — Tổng " + stats.hs.total + " | 🔴 Vướng: " + stats.hs.stuck + " | Trễ: " + stats.hs.overdue + "\n";
  summary += "3. VẬT TƯ — Tổng " + stats.vt.total + " | 🔴 CAO: " + stats.vt.priorityHigh + " | Vướng/chờ: " + stats.vt.stuck + "\n";
  summary += "4. KHO — Mã ĐỎ: " + stats.kho.red + " | Mã VÀNG: " + stats.kho.yellow +
    " | YC chờ: " + stats.kho.requestPending + " | YC CAO chưa cấp: " + stats.kho.requestHigh + "\n\n";

  summary += "🔥 TOP 3 ĐIỂM NÓNG NHẤT:\n";
  if (stats.hot.length === 0) {
    summary += "(Không có — báo cáo Sếp chỉ đạo: tuần lễ ổn định.)\n";
  } else {
    stats.hot.slice(0, 3).forEach((h, i) => {
      summary += (i + 1) + ". [" + h.team + "] " + h.title + "\n";
    });
  }

  // Hiện popup để Sếp copy
  const html = HtmlService.createHtmlOutput(
    '<pre style="font-family:Consolas,monospace;font-size:13px;background:#f5f5f5;padding:12px;border-radius:4px;white-space:pre-wrap;">' +
    summary.replace(/</g, "&lt;") +
    '</pre><p style="text-align:right;"><button onclick="navigator.clipboard.writeText(document.querySelector(\'pre\').innerText);this.innerText=\'✓ Đã copy\'" style="padding:8px 16px;background:#1F4E78;color:#fff;border:none;border-radius:4px;cursor:pointer;">Copy vào clipboard</button></p>'
  ).setWidth(700).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, "📋 Briefing Mode — Tóm tắt cho GĐ");
}
