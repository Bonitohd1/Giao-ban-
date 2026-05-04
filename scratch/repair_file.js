const fs = require('fs');
const cur = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

// 1. Fix the corruption at line 4032
const marker1 = cur.indexOf("'    }).'  else{");
const marker2Str = "'  }\\n'tml +=";
const marker2 = cur.indexOf(marker2Str);

const beforePart = cur.slice(0, marker1 + "'    }).".length);
const afterPart = cur.slice(marker2 + marker2Str.length);

const replacement = `sendReportNow(type);\\n' +
'  }\\n' +
'}\\n' +
'function renderOverview(d){\\n' +
'  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\\n' +
'  $("#updated").textContent = "Cập nhật: " + d.updatedAt;\\n' +
'  var c=d.cards;\\n' +
'  // v2.7: Helper render KPI card với X/Y + progress + breakdown chips\\n' +
'  function pctClass(p){return p>=70?"green":p>=30?"yellow":"red";}\\n' +
'  function renderKpiCard(opts){\\n' +
'    var pct = opts.total ? Math.round(opts.done/opts.total*100) : 0;\\n' +
'    var cls = pctClass(pct);\\n' +
'    var sevTop = opts.severity || "gray";\\n' +
'    var html = "<div class=\\\\\\"kpi-card kpi-"+sevTop+"\\\\\\" data-view=\\\\\\""+esc(opts.view||"")+"\\\\\\">";\\n' +
'    html += "<div class=\\\\\\"kpi-head\\\\\\"><span class=\\\\\\"kpi-icon\\\\\\">"+opts.icon+"</span><div class=\\\\\\"kpi-title\\\\\\">"+esc(opts.title)+"<small>"+esc(opts.sub||"")+"</small></div></div>";\\n' +
'    html += "<div class=\\\\\\"kpi-num\\\\\\"><span class=\\\\\\"big\\\\\\">"+opts.done+"</span><span class=\\\\\\"sep\\\\\\"> / </span><span class=\\\\\\"total\\\\\\">"+opts.total+"</span></div>";\\n' +
'    html += "<div class=\\\\\\"kpi-progress\\\\\\"><div class=\\\\\\"kpi-progress-fill "+cls+"\\\\\\" style=\\\\\\"width:"+pct+"%\\\\\\"></div></div>";\\n' +
'    h`;

let newCur = beforePart + replacement + afterPart;

// 2. Fix the original bug: m.top.forEach inside topKhoa else-block
// Find the exact broken block
const brokenTopKhoa = `'  else{\\n' +
'      html += "<thead><tr><th>Thiết bị</th><th>Khoa</th><th>Phân loại</th><th>Ngày dự kiến</th><th>Trạng thái kế hoạch</th><th>Gói thầu</th></tr></thead><tbody>";\\n' +
'    m.top.forEach(function(x){\\n' +
'       var cls = x.level === 2 ? "red" : "yellow";\\n' +
'       html += "<tr onclick=\\\\\\"openDetail('KT', '" + esc(x.ma||x.ten) + "')\\\\\\" style=\\\\\\"cursor:pointer\\\\\\">";\\n' +
'       html += "<td><b>"+esc(x.ten)+"</b><br><small style=\\'color:#9CA3AF\\'>"+esc(x.ma||"")+"</small></td>";\\n' +
'       html += "<td>"+esc(x.khoa)+"</td>";\\n' +
'       html += "<td><span class=\\\\\\"pill "+cls+"\\\\\\">"+esc(x.label)+"</span></td>";\\n' +
'       html += "<td style=\\\\\\"font-weight:700;color:"+(x.level===2?\\'#ef4444\\':\\'#f59e0b\\')+"\\\\\\">"+esc(x.date)+"</td>";\\n' +
'       html += "<td><b style=\\\\\\"color:"+(x.level===2?\\'#fca5a5\\':\\'#fde68a\\')+"\\\\\\">"+esc(x.status)+"</b></td>";\\n' +
'       html += "<td>"+(x.ok?\\'✅ Đã có\\':\\'❌ <span style=\\"color:#ef4444\\">Chưa có</span>\\')+"</td>";\\n' +
'       html += "</tr>";\\n' +
'    });\\n' +
'  }\\n'`;

const correctTopKhoa = `'  else{\\n' +
'    var maxC = Math.max.apply(null, d.topKhoa.map(function(k){return k.count;})) || 1;\\n' +
'    d.topKhoa.slice(0, 10).forEach(function(k){\\n' +
'      var pct = Math.round(k.count / maxC * 100);\\n' +
'      html += "<div class=\\\\\\"bar\\\\\\" data-khoa=\\\\\\""+esc(k.khoa)+"\\\\\\" data-coso=\\\\\\""+esc(k.coso||\\'\\')+"\\\\\\"";\\n' +
'      html += " title=\\\\\\""+esc(k.khoa)+(k.coso ? \\' · \\'+k.coso : \\'\\')+": "+k.count+" vấn đề\\\\\\">";\\n' +
'      html += "<div class=\\\\\\"bar-label\\\\\\">"+esc(k.khoa)+(k.coso?\\" <small style=\\'color:#6B7280\\'>\\"+esc(k.coso)+\\"</small>\\":\\"")+"</div>";\\n' +
'      html += "<div class=\\\\\\"bar-track\\\\\\"><div class=\\\\\\"bar-fill\\\\\\" style=\\\\\\"width:"+pct+"%\\\\\\"></div></div>";\\n' +
'      html += "<div class=\\\\\\"bar-num\\\\\\">"+k.count+"</div></div>";\\n' +
'    });\\n' +
'  }\\n'`;

if (newCur.includes(brokenTopKhoa)) {
  newCur = newCur.replace(brokenTopKhoa, correctTopKhoa);
  console.log("Bug fixed successfully!");
} else {
  console.log("Warning: broken block not found. Checking if it's slightly different...");
  // Try to find the start of the broken block
  const brokenStart = newCur.indexOf('      html += "<thead><tr><th>Thiết bị</th><th>Khoa</th><th>Phân loại</th><th>Ngày dự kiến</th><th>Trạng thái kế hoạch</th><th>Gói thầu</th></tr></thead><tbody>";');
  if (brokenStart > 0) {
      console.log("Found broken start at", brokenStart);
      const brokenEnd = newCur.indexOf("'  }\\n'", brokenStart);
      const realBroken = newCur.substring(brokenStart - 10, brokenEnd + 6);
      newCur = newCur.replace(realBroken, correctTopKhoa);
      console.log("Bug fixed using dynamic boundaries.");
  } else {
      console.log("Broken block not found at all.");
  }
}

fs.writeFileSync('AppScript_v2_10.gs', newCur, 'utf8');
console.log("File saved.");
