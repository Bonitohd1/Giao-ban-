const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

// 1. Add CSS
const cssToAppend = `/* v2.10: Maintenance Forecast styles */
.forecast-banner {
  background: linear-gradient(135deg, #1E3A8A, #3B82F6);
  border-radius: 12px;
  margin: 16px 0;
  padding: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(59,130,246,0.2);
}
.forecast-banner:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(59,130,246,0.3); }
.fb-icon { font-size: 24px; margin-right: 16px; background: rgba(255,255,255,0.1); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 10px; }
.fb-content { flex: 1; }
.fb-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 2px; }
.fb-sub { font-size: 13px; color: #DBEAFE; }
.fb-cta { font-size: 12px; color: #fff; background: rgba(0,0,0,0.2); padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }

.forecast-table-wrapper { overflow-x: auto; margin-top: 15px; background: rgba(255,255,255,0.03); border-radius: 8px; }
.forecast-table { width: 100%; border-collapse: collapse; font-size: 13px; color: #E5E7EB; }
.forecast-table th { text-align: left; padding: 12px; background: rgba(255,255,255,0.05); color: #9CA3AF; font-weight: 600; text-transform: uppercase; font-size: 11px; }
.forecast-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.forecast-table tr:hover { background: rgba(59,130,246,0.05); }
.badge.blue { background: #3B82F6; color: #fff; }
`;

// Inject CSS before </style>
const styleTag = "'</style></head><body>\\n' +";
const cssQuoted = cssToAppend.split('\n').map(line => "'" + line.replace(/'/g, "\\'") + "\\n' +").join('\n');
code = code.replace(styleTag, cssQuoted + "\n" + styleTag);

// 2. Add showMaintenanceForecast function
const jsToAppend = `function showMaintenanceForecast(){
  var m = STATE.lastData.maintenance;
  if(!m || !m.top.length){ alert("Không có thiết bị nào sắp đến hạn bảo trì/bảo hành trong 6 tháng tới."); return; }
  var html = "<div class='forecast-modal'>";
  html += "<div class='forecast-header' style='margin-bottom:20px;background:rgba(59,130,246,0.1);padding:15px;border-radius:8px;border-left:4px solid #3B82F6;'><h3>📅 Danh sách dự báo Bảo hành & Bảo trì</h3><p style='color:#9CA3AF;font-size:13px;margin:5px 0 0'>Các thiết bị có hạn trong 180 ngày tới. Ưu tiên xử lý mục <span style='color:#EF4444;font-weight:bold'>khẩn cấp</span> (90 ngày).</p></div>";
  html += "<div class='forecast-table-wrapper'><table class='forecast-table'>";
  html += "<thead><tr><th>Thiết bị / Mã</th><th>Khoa sử dụng</th><th>Hạn cuối</th><th>Tình trạng dự báo</th><th>Hồ sơ liên quan</th></tr></thead><tbody>";
  m.top.forEach(function(t){
    var cls = t.level === 2 ? "red" : "blue";
    html += "<tr>";
    html += "<td><b style='color:#fff'>"+esc(t.ten)+"</b><br><small style='color:#9CA3AF'>"+esc(t.ma)+"</small></td>";
    html += "<td>"+esc(t.khoa)+"</td>";
    html += "<td><span class='badge "+cls+"'>"+esc(t.date)+"</span><br><small style='color:#9CA3AF'>Còn "+t.daysLeft+" ngày</small></td>";
    html += "<td style='font-size:12px;line-height:1.4'>"+esc(t.status)+"</td>";
    html += "<td>"+(t.ok ? "✅ <span style='color:#10B981'>Đã link HS</span>" : "❌ <span style='color:#EF4444'>Chưa có HS</span>")+"</td>";
    html += "</tr>";
  });
  html += "</tbody></table></div></div>";
  $("#modal-title").innerHTML = "🔍 Dự báo bảo trì & bảo hành";
  $("#modal-body").innerHTML = html;
  $("#modal-actions").innerHTML = "<button class='btn btn-close' onclick='document.getElementById(\\"modal\\").classList.remove(\\"show\\")'>Đóng</button>";
  $("#modal").classList.add("show");
}
`;

// Inject JS before end of script block
const jsQuoted = jsToAppend.split('\n').map(line => "'" + line.replace(/'/g, "\\'") + "\\n' +").join('\n');
const endOfScript = "/* Render Overview */"; // Place it before other renderers
code = code.replace(endOfScript, jsQuoted + "\n" + endOfScript);

// 3. Update renderOverview to include the banner
const kpiGridEnd = "'  html += \"</div>\";\\n' +";
const bannerHtml = `'  if(d.maintenance && d.maintenance.top && d.maintenance.top.length > 0){\\n' +
'    var m = d.maintenance;\\n' +
'    html += "<div class=\\"forecast-banner\\" onclick=\\"showMaintenanceForecast()\\">";\\n' +
'    html += "<div class=\\"fb-icon\\">📅</div>";\\n' +
'    html += "<div class=\\"fb-content\\">";\\n' +
'    html += "<div class=\\"fb-title\\">Dự báo Bảo trì & Bảo hành</div>";\\n' +
'    html += "<div class=\\"fb-sub\\">Có <b>"+(m.l1+m.l2)+"</b> thiết bị sắp đến hạn (6 tháng tới). Trong đó <b>"+m.l2+"</b> mục khẩn cấp (3 tháng).</div>";\\n' +
'    html += "</div><div class=\\"fb-cta\\">Xem danh sách ↗</div></div>";\\n' +
'  }\\n' +`;

code = code.replace(kpiGridEnd, kpiGridEnd + "\n" + bannerHtml);

// 4. Update renderDetail to include maintenance info
const detailVuong = "'    if(o.vuong)html+=\"<div class=\\\\\"alert-box red\\\\\" style=\\\\\"padding:8px;font-size:11px;margin-top:8px\\\\\">⚠ <b>Vướng:</b> \"+esc(String(o.vuong).substring(0,80))+\"</div>\";\\n' +";
const detailMaint = `'    if(d.maint && o.type===\\"KT\\"){\\n' +
'       var mt = d.maint;\\n' +
'       var mcls = mt.level===2 ? \\"red\\" : \\"blue\\";\\n' +
'       html += "<div class=\\\\"alert-box "+mcls+"\\\\" style=\\\\"margin-top:12px;padding:10px;font-size:12px\\\\">";\\n' +
'       html += "<b>📅 Dự báo "+esc(mt.label)+":</b><br>";\\n' +
'       html += "<span>"+esc(mt.status)+"</span><br>";\\n' +
'       html += "<small>Hạn: "+esc(mt.date)+" (còn "+mt.daysLeft+" ngày)</small>";\\n' +
'       html += "</div>";\\n' +
'    }\\n' +`;

code = code.replace(detailVuong, detailVuong + "\n" + detailMaint);

fs.writeFileSync('AppScript_v2_10.gs', code);
console.log("Successfully upgraded AppScript_v2_10.gs with Maintenance Forecast features.");
