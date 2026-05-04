const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

// 1. Add _collectRoadblocks function
const rbFunc = `/**
 * v2.10: Thu thập toàn bộ vướng mắc chưa hoàn thành để làm báo cáo chi tiết
 */
function _collectRoadblocks(kt, hs, vt) {
  const res = { KT: [], HS: [], VT: [] };
  
  if (kt && !kt.missing) {
    const cTen = _findCol(kt.headers, "Tên Thiết Bị", "Tên TB", "Tên");
    const cKhoa = _findCol(kt.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
    const cVM = _findCol(kt.headers, "Vướng mắc", "Chi tiết tình trạng", "Ghi chú");
    const cHT = _findCol(kt.headers, "Đã Hoàn Thành", "Đã HT");
    kt.rows.forEach(r => {
      if(_isDone(r[cHT])) return;
      const v = (r[cVM]||"").toString().trim();
      if(v && v.toLowerCase() !== "ổn" && v !== "-" && v !== "0" && v.length > 3){
        res.KT.push({ ten: (r[cTen]||"?").toString(), khoa: (r[cKhoa]||"?").toString(), vuong: v });
      }
    });
  }

  if (hs && !hs.missing) {
    const cMa = _findCol(hs.headers, "Mã Hồ sơ", "Mã HS");
    const cND = _findCol(hs.headers, "Nội dung công việc được giao", "Nội dung");
    const cKhoa = _findCol(hs.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
    const cVM = _findCol(hs.headers, "Khó khăn, vướng mắc", "Vướng mắc");
    const cHT = _findCol(hs.headers, "Đã Hoàn Thành", "Đã HT");
    hs.rows.forEach(r => {
      if(_isDone(r[cHT])) return;
      const v = (r[cVM]||"").toString().trim();
      if(v && v.toLowerCase() !== "ổn" && v !== "-" && v !== "0" && v.length > 3){
        res.HS.push({ ten: ((r[cMa]||"") + " - " + (r[cND]||"?")).toString(), khoa: (r[cKhoa]||"?").toString(), vuong: v });
      }
    });
  }

  if (vt && !vt.missing) {
    const cTen = _findCol(vt.headers, "Tên VTTH", "Nội dung", "Tên");
    const cKhoa = _findCol(vt.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
    const cVM = _findCol(vt.headers, "Khó khăn, vướng mắc", "Vướng mắc");
    const cHT = _findCol(vt.headers, "Đã Hoàn Thành", "Đã HT");
    vt.rows.forEach(r => {
      if(_isDone(r[cHT])) return;
      const v = (r[cVM]||"").toString().trim();
      if(v && v.toLowerCase() !== "ổn" && v !== "-" && v !== "0" && v.length > 3){
        res.VT.push({ ten: (r[cTen]||"?").toString(), khoa: (r[cKhoa]||"?").toString(), vuong: v });
      }
    });
  }
  return res;
}
`;

// Find a good place to insert it (after _summaryVT)
code = code.replace("function _summaryVT(t) {", rbFunc + "\nfunction _summaryVT(t) {");

// 2. Update getOverview to include roadblocks
const getOverviewHot = "try { result.hot = _topHot(kt, hs, kho5a, 10); } catch(e) {}";
const getOverviewRB = `  try { result.roadblocks = _collectRoadblocks(kt, hs, vt); } catch(e) {}`;
code = code.replace(getOverviewHot, getOverviewHot + "\n" + getOverviewRB);

// 3. Update _buildBriefHtml to include roadblock section
const section3Title = "III. CHI TIẾT VƯỚNG MẮC THEO NHÓM";
const rbRendering = `
  // Section: Chi tiết vướng mắc theo nhóm (v2.10)
  if(data.roadblocks){
    html += '<tr><td style="padding:14px 20px;">'
         + '<h3 style="margin:20px 0 10px;font-size:14px;color:#1E3A8A;border-bottom:2px solid #1E3A8A;padding-bottom:5px;">🔍 CHI TIẾT VƯỚNG MẮC THEO NHÓM</h3>';
    
    const rb = data.roadblocks;
    ["KT", "HS", "VT"].forEach(key => {
      const team = rb[key];
      if(!team || !team.length) return;
      const label = {KT:"🔧 KỸ THUẬT", HS:"📁 HỒ SƠ", VT:"🧪 VẬT TƯ"}[key];
      html += '<div style="margin-top:15px;"><b style="font-size:12px;color:#4B5563;">' + label + ' (' + team.length + ' mục)</b>'
           + '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:12px;margin-top:5px;border:1px solid #F3F4F6;border-radius:4px;">';
      team.forEach(item => {
        html += '<tr><td style="padding:10px;border-bottom:1px solid #F3F4F6;">'
             + '<div style="font-weight:700;color:#111827;">' + item.ten + ' <small style="font-weight:400;color:#6B7280;">[' + item.khoa + ']</small></div>'
             + '<div style="color:#DC2626;margin-top:4px;">⚠ ' + item.vuong + '</div>'
             + '</td></tr>';
      });
      html += '</table></div>';
    });
    html += '</td></tr>';
  }

  // Section: Dự báo bảo trì (v2.10)
  if(data.maintenance && data.maintenance.top && data.maintenance.top.length > 0){
    html += '<tr><td style="padding:14px 20px;">'
         + '<h3 style="margin:20px 0 10px;font-size:14px;color:#065F46;border-bottom:2px solid #065F46;padding-bottom:5px;">📅 DỰ BÁO BẢO TRÌ & BẢO HÀNH</h3>'
         + '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:12px;">';
    data.maintenance.top.slice(0, 8).forEach(function(m){
      const color = m.level === 2 ? "#DC2626" : "#2563EB";
      html += '<tr><td style="padding:8px 0;border-bottom:1px dashed #D1D5DB;">'
           + '<span style="display:inline-block;background:' + color + ';color:#fff;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:8px;">' + m.label + '</span>'
           + '<b>' + m.ten + '</b> · ' + m.khoa + '<br>'
           + '<span style="color:' + color + ';">' + m.status + '</span> · <small style="color:#6B7280;">Hạn: ' + m.date + ' (' + m.daysLeft + ' ngày)</small>'
           + '</td></tr>';
    });
    html += '</table></td></tr>';
  }
`;

// Insert roadblock rendering before footer (closing table)
const tableEnd = '</table></td></tr>\';\n  }'; // This is tricky. Let's find "Footer" or similar.
const footerStart = "// Footer";
code = code.replace("return html;", rbRendering + "\nreturn html;");

fs.writeFileSync('AppScript_v2_10.gs', code);
console.log("Successfully upgraded reports with grouped roadblocks and maintenance forecast.");
