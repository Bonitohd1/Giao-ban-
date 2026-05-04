const fs = require('fs');

let content = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const DASHBOARD_HTML_CLEAN = `
const DASHBOARD_HTML = 
'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">' +
'<title>Giao ban VT-TBYT</title>' +
'<style>' +
'  :root{--bg:#0f172a;--card:#1e293b;--text:#f8fafc;--primary:#3b82f6;--accent:#10b981;--warn:#f59e0b;--danger:#ef4444}' +
'  *{box-sizing:border-box;margin:0;padding:0;font-family:\\'Inter\\',sans-serif}' +
'  body{background:var(--bg);color:var(--text);font-size:14px;overflow-x:hidden}' +
'  #app-header{background:var(--card);padding:12px 16px;border-bottom:1px solid #334155;position:sticky;top:0;z-index:100;display:flex;flex-direction:column;gap:12px}' +
'  .brand-row{display:flex;align-items:center;justify-content:space-between;gap:16px}' +
'  .brand{font-size:18px;font-weight:700;letter-spacing:-.5px;color:var(--primary)}' +
'  .brand small{display:block;font-size:11px;font-weight:400;color:#94a3b8;margin-top:2px}' +
'  #search{background:#0f172a;border:1px solid #334155;border-radius:8px;padding:8px 12px;color:#fff;width:100%;max-width:400px;font-size:13px}' +
'  #search:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 2px rgba(59,130,246,0.2)}' +
'  #nav{display:flex;gap:4px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}' +
'  #nav::-webkit-scrollbar{display:none}' +
'  .nav-item{padding:8px 16px;border-radius:6px;white-space:nowrap;cursor:pointer;color:#94a3b8;font-weight:500;transition:all .2s}' +
'  .nav-item.active{background:var(--primary);color:#fff}' +
'  #app-content{padding:16px;max-width:1200px;margin:0 auto;min-height:calc(100vh - 120px)}' +
'  .sh{font-size:13px;font-weight:600;text-transform:uppercase;color:#94a3b8;margin:24px 0 12px;letter-spacing:1px;display:flex;align-items:center;gap:8px}' +
'  .sh::after{content:\\'\\';flex:1;height:1px;background:#334155}' +
'  .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}' +
'  .kpi{background:var(--card);padding:16px;border-radius:12px;border:1px solid #334155;display:flex;flex-direction:column;gap:4px;transition:transform .2s}' +
'  .kpi:active{transform:scale(0.98)}' +
'  .kpi-h{font-size:12px;color:#94a3b8;font-weight:500}' +
'  .kpi-v{font-size:24px;font-weight:700;display:flex;align-items:baseline;gap:4px}' +
'  .kpi-v small{font-size:13px;font-weight:400;color:#64748b}' +
'  .kpi-foot{font-size:11px;margin-top:8px;color:#64748b;display:flex;flex-wrap:wrap;gap:4px}' +
'  .kpi-foot b{color:#cbd5e1}' +
'  .kpi.red .kpi-v{color:var(--danger)}' +
'  .kpi.yellow .kpi-v{color:var(--warn)}' +
'  .kpi.blue .kpi-v{color:var(--primary)}' +
'  .kpi.green .kpi-v{color:var(--accent)}' +
'  .bars{display:flex;flex-direction:column;gap:8px}' +
'  .bar{background:var(--card);padding:12px;border-radius:10px;border:1px solid #334155;display:flex;align-items:center;gap:12px}' +
'  .bar-name{flex:1;font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'  .bar-track{flex:2;height:6px;background:#0f172a;border-radius:3px;overflow:hidden}' +
'  .bar-fill{height:100%;background:var(--primary);border-radius:3px}' +
'  .bar-val{width:24px;text-align:right;font-weight:600;font-size:13px;color:var(--primary)}' +
'  .hot-by-team{display:flex;flex-direction:column;gap:12px}' +
'  .hot-team-col{display:flex;flex-direction:column;gap:8px}' +
'  .hot-team-h{font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:4px;display:flex;justify-content:space-between}' +
'  .hot-item{background:var(--card);padding:12px;border-radius:10px;border:1px solid #334155;border-left:4px solid var(--primary);cursor:pointer;position:relative}' +
'  .hot-item-head{display:flex;align-items:center;gap:8px;margin-bottom:4px}' +
'  .hot-item-num{width:18px;height:18px;background:#334155;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#94a3b8}' +
'  .hot-item-title{flex:1;font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'  .hot-item-badge{font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700;text-transform:uppercase}' +
'  .hot-item-badge.red{background:rgba(239,68,68,0.1);color:var(--danger)}' +
'  .hot-item-badge.yellow{background:rgba(245,158,11,0.1);color:var(--warn)}' +
'  .hot-item-sub{font-size:11px;color:#94a3b8;margin-bottom:4px}' +
'  .hot-item-detail{font-size:11px;color:var(--primary);font-weight:500}' +
'  .hot-team-red .hot-item{border-left-color:var(--danger)}' +
'  .hot-team-yellow .hot-item{border-left-color:var(--warn)}' +
'  .hot-team-blue .hot-item{border-left-color:var(--primary)}' +
'  #modal{position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:1000;display:none;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}' +
'  #modal.show{display:flex}' +
'  #modal-content{background:var(--card);width:100%;max-width:800px;max-height:90vh;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;border:1px solid #334155;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)}' +
'  #modal-header{padding:16px;background:#1e293b;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center}' +
'  #modal-body{padding:20px;overflow-y:auto;flex:1}' +
'  #modal-footer{padding:12px;background:#1e293b;border-top:1px solid #334155;display:flex;justify-content:flex-end;gap:12px}' +
'  .btn{padding:8px 16px;border-radius:8px;font-weight:600;cursor:pointer;border:none;font-size:13px;transition:all .2s}' +
'  .btn-primary{background:var(--primary);color:#fff}' +
'  .btn-close{background:#334155;color:#94a3b8}' +
'  .loading{position:fixed;top:0;left:0;right:0;height:3px;background:var(--primary);z-index:2000;animation:load 2s infinite;display:none}' +
'  @keyframes load{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}' +
'  .empty{padding:40px;text-align:center;color:#64748b;font-size:13px}' +
'  .stock-pill{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;text-transform:uppercase}' +
'  .stock-pill.red{background:rgba(239,68,68,0.1);color:var(--danger)}' +
'  .stock-pill.yellow{background:rgba(245,158,11,0.1);color:var(--warn)}' +
'  .stock-pill.green{background:rgba(16,185,129,0.1);color:var(--accent)}' +
'  .stock-pill.gray{background:rgba(148,163,184,0.1);color:#94a3b8}' +
'  @media (min-width:768px){' +
'    .brand-row{flex-direction:row}' +
'    #nav{gap:8px}' +
'    .hot-by-team{flex-direction:row}' +
'    .kpis{grid-template-columns:repeat(4,1fr)}' +
'  }' +
'</style></head><body>' +
'  <div id="loader" class="loading"></div>';

const DASHBOARD_BODY = 
'<header id="app-header">' +
'  <div class="brand-row">' +
'    <div class="brand">DASHBOARD GIAO BAN — PHÒNG VT-TBYT<small>Bệnh viện K — 4 tổ: Kỹ thuật / Hồ sơ / Vật tư / Kho · v2.10</small></div>' +
'    <input id="search" type="text" placeholder="🔍 Tìm máy / vật tư / hồ sơ…" autocomplete="off">' +
'  </div>' +
'  <div id="nav">' +
'    <div class="nav-item active" data-tab="overview">🏠 Tổng quan</div>' +
'    <div class="nav-item" data-tab="kt">🔧 Kỹ thuật</div>' +
'    <div class="nav-item" data-tab="hs">📁 Hồ sơ</div>' +
'    <div class="nav-item" data-tab="vt">🧪 VTTH</div>' +
'    <div class="nav-item" data-tab="kho">📦 Kho</div>' +
'    <div class="nav-item" data-tab="report">📊 Báo cáo</div>' +
'  </div>' +
'</header>' +
'<main id="app-content"></main>' +
'<div id="modal"><div id="modal-content">' +
'  <div id="modal-header"><h3 id="modal-title">Chi tiết</h3><button class="btn btn-close" onclick="closeModal()">×</button></div>' +
'  <div id="modal-body"></div>' +
'  <div id="modal-footer" id="modal-actions"></div>' +
'</div></div>' +
'<script>' +
'  var CURRENT_TAB = "overview";' +
'  var CACHE = {};' +
'  document.querySelectorAll(".nav-item").forEach(i => i.onclick = () => switchTab(i.dataset.tab));' +
'  function switchTab(t){' +
'    CURRENT_TAB = t;' +
'    document.querySelectorAll(".nav-item").forEach(i => i.classList.toggle("active", i.dataset.tab === t));' +
'    render();' +
'  }' +
'  function showLoader(s){ document.getElementById("loader").style.display = s ? "block" : "none"; }' +
'  function esc(s){ if(!s)return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }' +
'  function render(){' +
'    var main = document.getElementById("app-content");' +
'    main.innerHTML = "<div class=\\"empty\\">Đang tải dữ liệu...</div>";' +
'    showLoader(true);' +
'    google.script.run.withSuccessHandler(d => {' +
'      showLoader(false);' +
'      CACHE = d;' +
'      if(CURRENT_TAB === "overview") renderOverview(d);' +
'      else main.innerHTML = "<div class=\\"empty\\">Giao diện " + CURRENT_TAB + " đang được cập nhật...</div>";' +
'    }).getOverview();' +
'  }' +
'  function renderOverview(d){' +
'    var main = document.getElementById("app-content");' +
'    var h = "";' +
'    // KPI Grid' +
'    h += "<div class=\\\'kpis\\\'>";' +
'    h += renderKPI("Kỹ thuật", d.cards.kt.hong, "máy hỏng", "blue", "⚙️ " + d.cards.kt.dangSua + " đang sửa");' +
'    h += renderKPI("Hồ sơ", d.cards.hs.vuong, "vướng mắc", "red", "📦 " + d.cards.hs.total + " gói thầu");' +
'    h += renderKPI("VTTH", d.cards.vt.treDL, "trễ hạn", "yellow", "🧪 " + d.cards.vt.total + " mặt hàng");' +
'    h += renderKPI("Kho", d.cards.kho.red, "mức đỏ", "red", "📉 " + d.cards.kho.total + " mã tồn");' +
'    h += "</div>";' +
'    main.innerHTML = h;' +
'  }' +
'  function renderKPI(title, val, unit, color, foot){' +
'    return "<div class=\\\'kpi "+color+"\\\'>" + ' +
'      "<div class=\\\'kpi-h\\\'>"+esc(title)+"</div>" + ' +
'      "<div class=\\\'kpi-v\\\'>"+val+" <small>"+esc(unit)+"</small></div>" + ' +
'      "<div class=\\\'kpi-foot\\\'>"+esc(foot)+"</div>" + ' +
'    "</div>";' +
'  }' +
'  function closeModal(){ document.getElementById("modal").classList.remove("show"); }' +
'  render();' +
'</script></body></html>';
`;

// Replace the DASHBOARD_HTML and DASHBOARD_BODY constants
content = content.replace(/const DASHBOARD_HTML[\s\S]+?const DASHBOARD_BODY[\s\S]+?';/g, DASHBOARD_HTML_CLEAN);

fs.writeFileSync('AppScript_v2_10.gs', content, 'utf8');
console.log('Fixed DASHBOARD_HTML and DASHBOARD_BODY constants.');
