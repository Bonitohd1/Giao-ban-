const fs = require('fs');
let content = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const MAINTENANCE_UI_CODE = `
  function renderOverview(d){
    var main = document.getElementById("app-content");
    var h = "";
    
    // KPI Grid
    h += "<div class='kpis'>";
    h += renderKPI("Kỹ thuật", d.cards.kt.hong, "máy hỏng", "blue", "⚙️ " + d.cards.kt.dangSua + " đang sửa");
    h += renderKPI("Hồ sơ", d.cards.hs.vuong, "vướng mắc", "red", "📦 " + d.cards.hs.total + " gói thầu");
    h += renderKPI("VTTH", d.cards.vt.treDL, "trễ hạn", "yellow", "🧪 " + d.cards.vt.total + " mặt hàng");
    h += renderKPI("Kho", d.cards.kho.red, "mức đỏ", "red", "📉 " + d.cards.kho.total + " mã tồn");
    h += "</div>";

    // v2.10: Maintenance Alert Section in Overview
    if(d.maintenance && d.maintenance.top && d.maintenance.top.length){
      h += "<div class='sh'>🔧 DỰ BÁO BẢO TRÌ & BẢO HÀNH (" + (d.maintenance.l1 + d.maintenance.l2) + ")</div>";
      h += "<div class='hot-by-team'>";
      d.maintenance.top.forEach(function(m){
        var cls = m.level === 2 ? "red" : "yellow";
        h += "<div class='hot-item' style='border-left-color: " + (m.level===2?'#ef4444':'#f59e0b') + "' onclick='openDetail(\"KT\", \"" + esc(m.ma||m.ten) + "\")'>";
        h += "<div class='hot-item-head'>";
        h += "<span class='hot-item-title'>" + esc(m.ten) + "</span>";
        h += "<span class='hot-item-badge " + cls + "'>" + esc(m.label) + "</span>";
        h += "</div>";
        h += "<div class='hot-item-sub'>" + esc(m.khoa) + "</div>";
        h += "<div class='hot-item-detail'>" + esc(m.action) + (m.ok ? "" : " <span style='color:#ef4444'>(⚠ Chưa có gói thầu)</span>") + "</div>";
        h += "</div>";
      });
      h += "</div>";
    }

    main.innerHTML = h;
  }

  function renderReport(d){
    var main = document.getElementById("app-content");
    var h = "<div class='sh'>📊 BÁO CÁO CÔNG TÁC TRỌNG TÂM</div>";
    
    if(d.maintenance && d.maintenance.top){
       h += "<div class='kpi blue' style='margin-bottom:20px'><div class='kpi-h'>Tổng thiết bị cần chú ý</div><div class='kpi-v'>" + (d.maintenance.l1 + d.maintenance.l2) + " <small>máy</small></div></div>";
       h += "<table style='width:100%; border-collapse:collapse; background:var(--card); border-radius:12px; overflow:hidden'>";
       h += "<tr style='background:#334155'><th style='padding:12px; text-align:left'>Thiết bị</th><th style='padding:12px; text-align:left'>Trạng thái</th><th style='padding:12px; text-align:left'>Ghi chú</th></tr>";
       d.maintenance.top.forEach(function(m){
         h += "<tr style='border-bottom:1px solid #334155'><td style='padding:12px'>" + esc(m.ten) + "<br><small style='color:#94a3b8'>" + esc(m.khoa) + "</small></td>";
         h += "<td style='padding:12px'><span class='stock-pill " + (m.level===2?'red':'yellow') + "'>" + esc(m.label) + "</span></td>";
         h += "<td style='padding:12px; font-size:12px'>" + esc(m.action) + "</td></tr>";
       });
       h += "</table>";
    }
    
    main.innerHTML = h;
  }
`;

// Inject the new functions into the script part of DASHBOARD_BODY
content = content.replace('if(CURRENT_TAB === "overview") renderOverview(d);', 
`if(CURRENT_TAB === "overview") renderOverview(d);
      else if(CURRENT_TAB === "report") renderReport(d);`);

// Update renderOverview and add renderReport
content = content.replace(/function renderOverview\(d\)\{[\s\S]+?\}\s*function renderKPI/g, MAINTENANCE_UI_CODE + "\n  function renderKPI");

fs.writeFileSync('AppScript_v2_10.gs', content, 'utf8');
console.log('Injected Maintenance UI and Report view into Dashboard.');
