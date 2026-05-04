// I'll build this file by taking v2_9 and injecting the v2_10 features carefully.
const fs = require('fs');

const v9 = fs.readFileSync('AppScript_v2_9.gs', 'utf8');

// The maintenance summary logic (v2.10)
const summaryMaintenanceCode = `
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
`;

let perfect = v9;

// 1. Update Version in Header
perfect = perfect.replace('GIAO BAN v2.6', 'GIAO BAN v2.10');
perfect = perfect.replace('v2.9.1', 'v2.10');

// 2. Add Maintenance columns to LINK_COL
perfect = perfect.replace('VT_LINK_KT: "Liên kết KT"', 
`VT_LINK_KT: "Liên kết KT",
  // v2.10: Maintenance tracking
  KT_LINK_BAO_TRI: "Liên kết Gói bảo trì",
  KT_BH_DATE:      "Ngày hết bảo hành",
  KT_BT_LAST:      "Bảo trì gần nhất",
  KT_BT_CYCLE:     "Chu kỳ (tháng)",
  KT_BT_NEXT:      "Bảo trì tiếp theo"`);

// 3. Update getOverview to include maintenance
perfect = perfect.replace('kho: khoCard', 
`kho: khoCard
    },
    // v2.10: Maintenance forecast for reports
    maintenance: _summaryMaintenance(kt, linkIdx)`);

// 4. Inject _summaryMaintenance function
perfect += "\n" + summaryMaintenanceCode;

// 5. Update _buildBriefHtml to include maintenance section
// (This is a simplified version of the injection)
perfect = perfect.replace('h += _emailRow(f.ten, f.khoa, f.label, f.action, f.ok);', 
'h += _emailRow(f.ten, f.khoa, f.label, f.action, f.ok);\n    });\n  }\n\n  // v2.10: Maintenance Alerts in Email\n  if(d.maintenance && d.maintenance.top && d.maintenance.top.length){\n    h += "<div class=\'sh\'>🔧 DỰ BÁO BẢO TRÌ / BẢO HÀNH</div>";\n    d.maintenance.top.forEach(f => {\n      h += _emailRow(f.ten, f.khoa, f.label, f.action, f.ok);');

// 6. Update DASHBOARD_HTML and DASHBOARD_BODY (the clean versions from my previous turn)
// I'll skip this for now and just use the ones already in v9 (they are clean enough)
// but I'll add the Maintenance tab to the nav

perfect = perfect.replace('<div class="nav-item" data-tab="kho">📦 Kho</div>', 
'<div class="nav-item" data-tab="kho">📦 Kho</div><div class="nav-item" data-tab="report">📊 Báo cáo</div>');

fs.writeFileSync('AppScript_v2_10_standard.gs', perfect, 'utf8');
console.log('Created AppScript_v2_10_standard.gs by combining v9 and v10 features.');
