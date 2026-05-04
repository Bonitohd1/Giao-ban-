const fs = require('fs');
const path = 'AppScript_v2_10.gs';
let code = fs.readFileSync(path, 'utf8');
const lines = code.split(/\r?\n/);

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("if(ch.v'function showMaintenanceForecast(){")) {
    startIndex = i;
  }
  if (startIndex !== -1 && lines[i].includes('++(Number(doh)<7?"#F87171":"#9CA3AF")+')) {
    endIndex = i;
    break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  const recovery = [
    '    if(ch.vt&&ch.vt.length){',
    '      html+="<div>";ch.vt.forEach(function(v){html+="<div class=\\"chain-node\\" data-type=\\"VT\\" data-id=\\""+esc(v.ma||v.ten)+"\\" style=\\"margin-bottom:4px\\"><div class=\\"nm\\">🧪 "+esc(v.ten)+"</div><div class=\\"sm\\">"+esc(v.tt||"")+"</div>"+khoMini(v.kho)+"</div>";});html+="</div>";',
    '    } else { html+="<div class=\\"chain-node empty\\">không có vật tư link</div>"; }',
    '    html+="<div class=\\"arrow\\">→</div>";',
    '    /* HS node(s) */',
    '    if(ch.hs&&ch.hs.length){',
    '      html+="<div>";ch.hs.forEach(function(h){html+="<div class=\\"chain-node\\" data-type=\\"HS\\" data-id=\\""+esc(h.ma||h.ten)+"\\" style=\\"margin-bottom:4px\\"><div class=\\"nm\\">📁 "+esc(h.ma||h.ten)+"</div><div class=\\"sm\\">"+esc(h.tt||"")+"</div></div>";});html+="</div>";',
    '    } else { html+="<div class=\\"chain-node empty\\">không có gói thầu link</div>"; }',
    '    html+="</div></div>";',
    '  });',
    '  if(hasKho){',
    '    html+="<h2 style=\\"font-size:16px;color:#fff;margin:24px 0 14px\\">📦 Mạch Kho → Vật tư → Mua sắm ("+d.khoChains.length+") — kho cảnh báo cần truy nguồn</h2>";',
    '    d.khoChains.forEach(function(ch){',
    '      var sev=ch.severity>=8?"red":ch.severity>=5?"orange":"yellow";',
    '      var sevLbl=ch.isRed?"ĐỎ":sev==="orange"?"CAO":"VỪA";',
    '      var riskHtml = "";',
    '      if(ch.risk) riskHtml = "<span class=\\"risk-badge "+ch.risk.level+"\\">"+esc(ch.risk.msg)+"</span>";',
    '      var bgCls=sev==="red"?" chain-red":sev==="orange"?" chain-orange":"";',
    '      html+="<div class=\\"chain-row"+bgCls+"\\">";',
    '      html+="<div class=\\"chain-title\\"><span class=\\"severity "+sev+"\\">"+sevLbl+"</span>";',
    '      html+="<div style=\\"color:#fff;font-weight:600\\">📦 "+esc(ch.kho.ten||"?")+(ch.kho.ma?" ("+esc(ch.kho.ma)+")":"")+" "+riskHtml+"</div>";',
    '      var doh=ch.kho.doh;',
    '      if(doh!==""&&doh!==null&&doh!==undefined)html+="<div style=\\"color:"+(Number(doh)<7?"#F87171":"#9CA3AF")+";font-size:11px\\">DOH: "+esc(doh)+" ngày</div>";'
  ];

  lines.splice(startIndex, (endIndex - startIndex + 1), ...recovery);
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Recovery Successful! Replaced ' + (endIndex - startIndex + 1) + ' lines.');
} else {
  console.log('Markers not found. Start: ' + startIndex + ', End: ' + endIndex);
}
