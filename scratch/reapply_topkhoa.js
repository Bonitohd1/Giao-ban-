const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const oldTop = `'  html += "<div class=\\"sh\\">📊 Khoa nóng nhất <small style=\\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\\">(click để xem toàn cảnh khoa)</small></div>";\\n' +
'  html += "<div class=\\"bars\\">";\\n' +
'  if(d.topKhoa.length===0)html += "<div class=\\"empty\\" style=\\"background:transparent;border:0;\\">(Không có dữ liệu khoa)</div>";\\n' +
'  else{\\n' +
'    var maxC = Math.max.apply(null, d.topKhoa.map(function(k){return k.count;})) || 1;\\n' +
'    d.topKhoa.slice(0, 10).forEach(function(k){\\n' +
'      var pct = Math.round(k.count / maxC * 100);\\n' +
'      html += "<div class=\\\"bar\\\" data-khoa=\\\""+esc(k.khoa)+"\\\"";\\n' +
'      html += " title=\\\""+esc(k.khoa)+": "+k.count+" vấn đề\\\">";\\n' +
'      html += "<div class=\\\"bar-label\\\">"+esc(k.khoa)+"</div>";\\n' +
'      html += "<div class=\\\"bar-track\\\"><div class=\\\"bar-fill\\\" style=\\\"width:"+pct+"%\\\"></div></div>";\\n' +
'      html += "<div class=\\\"bar-num\\\">"+k.count+"</div></div>";\\n' +
'    });\\n' +
'  }\\n' +`;

const newTop = `'  html += "<div class=\\"sh\\">📊 Khoa × Cơ sở nóng nhất <small style=\\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\\">(click để xem toàn cảnh khoa)</small></div>";\\n' +
'  html += "<div class=\\"bars\\">";\\n' +
'  if(d.topKhoa.length===0)html += "<div class=\\"empty\\" style=\\"background:transparent;border:0;\\">(Không có dữ liệu khoa)</div>";\\n' +
'  else{\\n' +
'    var maxC = Math.max.apply(null, d.topKhoa.map(function(k){return k.count;})) || 1;\\n' +
'    d.topKhoa.slice(0, 10).forEach(function(k){\\n' +
'      var pct = Math.round(k.count / maxC * 100);\\n' +
'      html += "<div class=\\\"bar\\\" data-khoa=\\\""+esc(k.khoa)+"\\\" data-coso=\\\""+esc(k.coso||\\"\\")+"\\\"";\\n' +
'      html += " title=\\\""+esc(k.khoa)+(k.coso ? " · "+k.coso : "")+": "+k.count+" vấn đề\\\">";\\n' +
'      html += "<div class=\\\"bar-label\\\">"+esc(k.khoa)+(k.coso?" <small style=\'color:#6B7280\'>\"+esc(k.coso)+\"</small>":"")+"</div>";\\n' +
'      html += "<div class=\\\"bar-track\\\"><div class=\\\"bar-fill\\\" style=\\\"width:"+pct+"%\\\"></div></div>";\\n' +
'      html += "<div class=\\\"bar-num\\\">"+k.count+"</div></div>";\\n' +
'    });\\n' +
'  }\\n' +`;

if (code.indexOf(oldTop) !== -1) {
    code = code.replace(oldTop, newTop);
    fs.writeFileSync('AppScript_v2_10.gs', code);
    console.log("Successfully reapplied topKhoa fix.");
} else {
    console.log("Could not find oldTop pattern. Maybe it is already fixed or code changed.");
}
