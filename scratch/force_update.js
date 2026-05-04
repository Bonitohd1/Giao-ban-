const fs = require('fs');
const path = 'AppScript_v2_10.gs';
let code = fs.readFileSync(path, 'utf8');

// Định nghĩa lại chính xác các đoạn code Cần khôi phục
const part1_wrong = "    if(ch.vt&&ch.vt.length){\\n" +
"      html+=\\\"<div>\\\";ch.vt.forEach(function(v){html+=\\\"<div class=\\\\\\\"chain-node\\\\\\\" data-type=\\\\\\\"VT\\\\\\\" data-id=\\\\\\\"\\\"+esc(v.ma||v.ten)+\\\\\\\"\\\\\\\" style=\\\\\\\"margin-bottom:4px\\\\\\\"><div class=\\\\\\\"nm\\\\\\\">🧪 \\\"+esc(v.ten)+\\\"</div><div class=\\\\\\\"sm\\\\\\\">\\\"+esc(v.tt||\\\"\\\")+\\\"</div>\\\"+khoMini(v.kho)+\\\"</div>\\\";});html+=\\\"</div>\\\";\\n\" +
\"    } else { html+=\\\"<div class=\\\\\\\"chain-node empty\\\\\\\">không có vật tư link</div>\\\"; }\\n\" +
\"    html+=\\\"<div class=\\\\\\\"arrow\\\\\\\">→</div>\\\";\\n\" +
\"    /* HS node(s) */\\n\" +
\"    if(ch.hs&&ch.hs.length){\\n\" +
\"      html+=\\\"<div>\\\";ch.hs.forEach(function(h){html+=\\\"<div class=\\\\\\\"chain-node\\\\\\\" data-type=\\\\\\\"HS\\\\\\\" data-id=\\\\\\\"\\\"+esc(h.ma||h.ten)+\\\\\\\"\\\\\\\" style=\\\\\\\"margin-bottom:4px\\\\\\\"><div class=\\\\\\\"nm\\\\\\\">📁 \\\"+esc(h.ma||h.ten)+\\\"</div><div class=\\\\\\\"sm\\\\\\\">\\\"+esc(h.tt||\\\"\\\")+\\\"</div></div>\\\";});html+=\\\"</div>\\\";\\n\" +
\"    } else { html+=\\\"<div class=\\\\\\\"chain-node empty\\\\\\\">không có gói thầu link</div>\\\"; }\\n\" +
\"    html+=\\\"</div></div>\\\";\\n\" +
\"  });\\n\" +
\"  if(hasKho){\\n\" +
\"    html+=\\\"<h2 style=\\\\\\\"font-size:16px;color:#fff;margin:24px 0 14px\\\\\\\">📦 Mạch Kho → Vật tư → Mua sắm (\\\"+d.khoChains.length+\\\") — kho cảnh báo cần truy nguồn</h2>\\\";\\n\" +
\"    d.khoChains.forEach(function(ch){\\n\" +
\"      var sev=ch.severity>=8?\\\"red\\\":ch.severity>=5?\\\"orange\\\":\\\"yellow\\\";\\n\" +
\"      var sevLbl=ch.isRed?\\\"ĐỎ\\\":sev===\\\"orange\\\"?\\\"CAO\\\":\\\"VỪA\\\";\\n\" +
\"      var riskHtml = \\\"\\\";\\n\" +
\"      if(ch.risk) riskHtml = \\\"<span class=\\\\\\\"risk-badge \\\"+ch.risk.level+\\\\\\\"\\\\\\\">\\\"+esc(ch.risk.msg)+\\\"</span>\\\";\\n\" +
\"      var bgCls=sev===\\\"red\\\"?\\\" chain-red\\\":sev===\\\"orange\\\"?\\\" chain-orange\\\":\\\"\\\";\\n\" +
\"      html+=\\\"<div class=\\\\\\\"chain-row\\\"+bgCls+\\\"\\\\\\\">\\\";\\n\" +
\"      html+=\\\"<div class=\\\\\\\"chain-title\\\\\\\"><span class=\\\\\\\"severity \\\"+sev+\\\"\\\\\\\">\\\"+sevLbl+\\\"</span>\\\";\\n\" +
\"      html+=\\\"<div style=\\\\\\\"color:#fff;font-weight:600\\\\\\\">📦 \\\"+esc(ch.kho.ten||\\\"?\\\")+(ch.kho.ma?\\\" (\\\"+esc(ch.kho.ma)+\\\")\\\":\\\"\\\")+\\\" \\\"+riskHtml+\\\"</div>\\\";\\n\" +
\"      var doh=ch.kho.doh;\\n\" +
\"      if(doh!==\\\"\\\"&&doh!==null&&doh!==undefined)html+=\\\"<div style=\\\\\\\"color:\\\"+(Number(doh)<7?\\\"#F87171\\\":\\\"#9CA3AF\\\")+\\\";font-size:11px\\\\\\\">DOH: \\\"+esc(doh)+\\\" ngày</div>\\\";\";

// Đoạn code chuẩn có dấu nháy
const part1_right = \"'    if(ch.vt&&ch.vt.length){\\\\n' +\\n\" +
\"'      html+=\\\\\\\"<div>\\\\\\\";ch.vt.forEach(function(v){html+=\\\\\\\"\\\\\\\"<div class=\\\\\\\\\\\\\\\"chain-node\\\\\\\\\\\\\\\" data-type=\\\\\\\\\\\\\\\"VT\\\\\\\\\\\\\\\" data-id=\\\\\\\\\\\\\\\"\\\\\\\"+esc(v.ma||v.ten)+\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\" style=\\\\\\\\\\\\\\\"margin-bottom:4px\\\\\\\\\\\\\\\"><div class=\\\\\\\\\\\\\\\"nm\\\\\\\\\\\\\\\">🧪 \\\\\\\"+esc(v.ten)+\\\\\\\"</div><div class=\\\\\\\\\\\\\\\"sm\\\\\\\\\\\\\\\">\\\\\\\"+esc(v.tt||\\\\\\\"\\\\\\\")+\\\\\\\"</div>\\\\\\\"+khoMini(v.kho)+\\\\\\\"</div>\\\\\\\";});html+=\\\\\\\"\\\\\\\"</div>\\\\\\\";\\\\n' +\\n\" +
\"'    } else { html+=\\\\\\\"<div class=\\\\\\\\\\\\\\\"chain-node empty\\\\\\\\\\\\\\\">không có vật tư link</div>\\\\\\\"; }\\\\n' +\\n\" +
\"'    html+=\\\\\\\"<div class=\\\\\\\\\\\\\\\"arrow\\\\\\\\\\\\\\\">→</div>\\\\\\\";\\\\n' +\\n\" +
\"'    /* HS node(s) */\\\\n' +\\n\" +
\"'    if(ch.hs&&ch.hs.length){\\\\n' +
\"'      html+=\\\\\\\"<div>\\\\\\\";ch.hs.forEach(function(h){html+=\\\\\\\"\\\\\\\"<div class=\\\\\\\\\\\\\\\"chain-node\\\\\\\\\\\\\\\" data-type=\\\\\\\\\\\\\\\"HS\\\\\\\\\\\\\\\" data-id=\\\\\\\\\\\\\\\"\\\\\\\"+esc(h.ma||h.ten)+\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\" style=\\\\\\\\\\\\\\\"margin-bottom:4px\\\\\\\\\\\\\\\"><div class=\\\\\\\\\\\\\\\"nm\\\\\\\\\\\\\\\">📁 \\\\\\\"+esc(h.ma||h.ten)+\\\\\\\"</div><div class=\\\\\\\\\\\\\\\"sm\\\\\\\\\\\\\\\">\\\\\\\"+esc(h.tt||\\\\\\\"\\\\\\\")+\\\\\\\"</div></div>\\\\\\\";});html+=\\\\\\\"\\\\\\\"</div>\\\\\\\";\\\\n' +\\n\" +
\"'    } else { html+=\\\\\\\"<div class=\\\\\\\\\\\\\\\"chain-node empty\\\\\\\\\\\\\\\">không có gói thầu link</div>\\\\\\\"; }\\\\n' +\\n\" +
\"'    html+=\\\\\\\"</div></div>\\\\\\\";\\\\n' +\\n\" +
\"'  });\\\\n' +\\n\" +
\"'  if(hasKho){\\\\n' +
\"'    html+=\\\\\\\"<h2 style=\\\\\\\\\\\\\\\"font-size:16px;color:#fff;margin:24px 0 14px\\\\\\\\\\\\\\\">📦 Mạch Kho → Vật tư → Mua sắm (\\\\\\\"+d.khoChains.length+\\\\\\\") — kho cảnh báo cần truy nguồn</h2>\\\\\\\";\\\\n' +\\n\" +
\"'    d.khoChains.forEach(function(ch){\\\\n' +
\"'      var sev=ch.severity>=8?\\\\\\\"red\\\\\\\":ch.severity>=5?\\\\\\\"orange\\\\\\\":\\\\\\\"yellow\\\\\\\";\\\\n' +
\"'      var sevLbl=ch.isRed?\\\\\\\"ĐỎ\\\\\\\":sev===\\\\\\\"orange\\\\\\\"?\\\\\\\"CAO\\\\\\\":\\\\\\\"VỪA\\\\\\\";\\\\n' +
\"'      var riskHtml = \\\\\\\"\\\\\\\";\\\\n' +
\"'      if(ch.risk) riskHtml = \\\\\\\"<span class=\\\\\\\\\\\\\\\"risk-badge \\\\\\\"+ch.risk.level+\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\">\\\\\\\"+esc(ch.risk.msg)+\\\\\\\"</span>\\\\\\\";\\\\n' +
\"'      var bgCls=sev===\\\\\\\"red\\\\\\\"?\\\\\\\" chain-red\\\\\\\":sev===\\\\\\\"orange\\\\\\\"?\\\\\\\" chain-orange\\\\\\\":\\\\\\\"\\\\\\\";\\\\n' +
\"'      html+=\\\\\\\"<div class=\\\\\\\\\\\\\\\"chain-row\\\\\\\"+bgCls+\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\">\\\\\\\";\\\\n' +
\"'      html+=\\\\\\\\\\\\\\\" <div class=\\\\\\\\\\\\\\\"chain-title\\\\\\\\\\\\\\\"><span class=\\\\\\\\\\\\\\\"severity \\\\\\\"+sev+\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\">\\\\\\\"+sevLbl+\\\\\\\"</span>\\\\\\\";\\\\n' +
\"'      html+=\\\\\\\\\\\\\\\" <div style=\\\\\\\\\\\\\\\"color:#fff;font-weight:600\\\\\\\\\\\\\\\">📦 \\\\\\\"+esc(ch.kho.ten||\\\\\\\"?\\\\\\\")+(ch.kho.ma?\\\\\\\" (\\\\\\\"+esc(ch.kho.ma)+\\\\\\\")\\\\\\\":\\\\\\\"\\\\\\\")+\\\\\\\" \\\\\\\"+riskHtml+\\\\\\\"</div>\\\\\\\";\\\\n' +
\"'      var doh=ch.kho.doh;\\\\n' +
\"'      if(doh!==\\\\\\\"\\\\\\\"&&doh!==null&&doh!==undefined)html+=\\\\\\\" <div style=\\\\\\\\\\\\\\\"color:\\\\\\\"+(Number(doh)<7?\\\\\\\"#F87171\\\\\\\":\\\\\\\"#9CA3AF\\\\\\\")+\\\\\\\";font-size:11px\\\\\\\\\\\\\\\">DOH: \\\\\\\"+esc(doh)+\\\\\\\" ngày</div>\\\\\\\";\\\\n' +\";

if (code.includes(part1_wrong)) {
    code = code.replace(part1_wrong, part1_right);
    fs.writeFileSync(path, code);
    console.log(\"Đã thay đổi sang code chuẩn có dấu nháy.\");
} else {
    console.log(\"Không tìm thấy đoạn code sai tương ứng.\");
}
