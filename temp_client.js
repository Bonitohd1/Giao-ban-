function renderOverview(d){
  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;
  $("#updated").textContent = "Cập nhật: " + d.updatedAt;
  var c=d.cards;
  // v2.7: Helper render KPI card với X/Y + progress + breakdown chips
  function pctClass(p){return p>=70?"green":p>=30?"yellow":"red";}
  function renderKpiCard(opts){
    var pct = opts.total ? Math.round(opts.done/opts.total*100) : 0;
    var cls = pctClass(pct);
    var sevTop = opts.severity || "gray";
    var html = "<div class=\"kpi-card kpi-"+sevTop+"\" data-view=\""+esc(opts.view||"")+"\">";
    html += "<div class=\"kpi-head\"><span class=\"kpi-icon\">"+opts.icon+"</span><div class=\"kpi-title\">"+esc(opts.title)+"<small>"+esc(opts.sub||"")+"</small></div></div>";
    html += "<div class=\"kpi-num\"><span class=\"big\">"+opts.done+"</span><span class=\"sep\"> / </span><span class=\"total\">"+opts.total+"</span></div>";
    html += "<div class=\"kpi-progress\"><div class=\"kpi-progress-fill "+cls+"\" style=\"width:"+pct+"%\"></div></div>";
    h "<div class=\"kpi-progress\"><div class=\"kpi-progress-fill "+cls+"\" style=\"width:"+pct+"%\"></div></div>";
    html += "<div class=\"kpi-pct "+cls+"\">"+pct+"% "+esc(opts.pctLabel||"hoàn thành")+"</div>";
    if(opts.chips && opts.chips.length){
      html += "<div class=\"kpi-chips\">";
      opts.chips.forEach(function(ch){
        if(ch.value === 0 || ch.value === "0" || ch.value === null || ch.value === undefined) return;
        html += "<span class=\"chip chip-"+(ch.cls||"gray")+"\">"+ch.icon+" "+esc(ch.label)+" <b>"+esc(ch.value)+"</b></span>";
      });
      html += "</div>";
    }
    if(opts.foot)html += "<div class=\"kpi-foot\">"+opts.foot+"</div>";
    html += "<div class=\"kpi-cta\">↗ Xem chi tiết</div>";
    html += "</div>";
    return html;
  }
  var html = "<div class=\"kpi-grid\">";
  // KT card
  var sevKT = c.kt.cao>0||c.kt.treDL>0?"red":c.kt.dangSua>5?"yellow":"green";
  html += renderKpiCard({
    icon:"🔧", title:"Kỹ thuật", sub:"Máy hỏng / bảo trì", view:"kt", severity:sevKT,
    done:c.kt.done, total:c.kt.total,
    chips:[
      {icon:"🔴", label:"CAO", value:c.kt.cao, cls:"red"},
      {icon:"⏰", label:"trễ", value:c.kt.treDL, cls:"red"},
      {icon:"🛠", label:"đang sửa", value:c.kt.dangSua, cls:"yellow"},
      {icon:"♻", label:"đề xuất TL", value:c.kt.thanhLy, cls:"gray"}
    ]
  });
  // HS card
  var sevHS = c.hs.cao>0||c.hs.treDL>0||c.hs.vuong>0?"red":c.hs.dangXL>0?"yellow":"green";
  html += renderKpiCard({
    icon:"📁", title:"Hồ sơ", sub:"Gói thầu / mua sắm", view:"hs", severity:sevHS,
    done:c.hs.done, total:c.hs.total,
    chips:[
      {icon:"🔴", label:"CAO", value:c.hs.cao, cls:"red"},
      {icon:"⏰", label:"trễ", value:c.hs.treDL, cls:"red"},
      {icon:"🚧", label:"vướng", value:c.hs.vuong, cls:"yellow"}
    ],
    foot:"<span class=\"kpi-foot-num\">💰 "+fmtVnd(c.hs.tongGiaTri)+"</span> tổng giá trị"
  });
  // VT card
  var sevVT = c.vt.cao>0||c.vt.treDL>0||c.vt.vuong>0?"red":c.vt.dangXL>0?"yellow":"green";
  html += renderKpiCard({
    icon:"🧪", title:"Vật tư", sub:"Task hóa chất / VTTH", view:"vt", severity:sevVT,
    done:c.vt.done, total:c.vt.total,
    chips:[
      {icon:"🔴", label:"CAO", value:c.vt.cao, cls:"red"},
      {icon:"⏰", label:"trễ", value:c.vt.treDL, cls:"red"},
      {icon:"🚧", label:"vướng", value:c.vt.vuong, cls:"yellow"}
    ]
  });
  // v2.10 — KHO card redesign: focus dự đoán cung ứng (sếp quan tâm hàng sắp hết, cần gấp, dự trù)
  var f = c.kho.forecast || {l1:0,l2:0,noSolution:0,stagnantLong:0,top:[]};
  var khoActionable = f.l1 + f.l2 + f.stagnantLong;
  var khoSafe = c.kho.total - khoActionable;
  var sevK = (f.noSolution>0 || f.stagnantLong>0) ? "red" : (f.l1>0 || f.l2>0) ? "yellow" : "green";
  html += renderKpiCard({
    icon:"📦", title:"Kho", sub:"Cung ứng & tồn đọng", view:"kho", severity:sevK,
    done:khoSafe, total:c.kho.total,
    pctLabel: khoActionable>0 ? "an toàn (còn " + khoActionable + " cần xử lý)" : "an toàn",
    chips:[
      {icon:"🚨", label:"sắp hết <30n", value:f.l1, cls:"red"},
      {icon:"🔴", label:"cần gấp 30-60n", value:f.l2, cls:"red"},
      {icon:"⚠", label:"chưa có gói thầu", value:f.noSolution, cls:"red"},
      {icon:"📦", label:"tồn >1 năm", value:f.stagnantLong, cls:"gray"}
    ],
    foot: (f.top && f.top.length) ? ("<span class=\"kpi-foot-num\" style=\"color:#FBBF24\">" + esc(f.top[0].ten.substring(0, 30)) + (f.top[0].ten.length>30?"…":"") + "</span> · DOH " + f.top[0].doh + "n") : ""
  });
  html += "</div>";
  // v2.10: Maintenance Alert Section
  if(d.maintenance && d.maintenance.top && d.maintenance.top.length){
    html += "<div class=\"sh\" style=\"display:flex;justify-content:space-between;align-items:center\">🔧 DỰ BÁO BẢO TRÌ & BẢO HÀNH (" + (d.maintenance.l1 + d.maintenance.l2) + ") <button class=\"btn btn-secondary\" style=\"font-size:11px;padding:4px 10px\" onclick=\"renderMaintReport()\">Xem bảng tổng hợp →</button></div>";
    html += "<div class=\"maint-forecast-row\">";
    d.maintenance.top.forEach(function(m){
      var cls = m.level === 2 ? "red" : "yellow";
      html += "<div class=\"maint-card "+cls+"\" onclick=\"openDetail('KT', '" + esc(m.ma||m.ten) + "')\">";
      html += "<h4>"+esc(m.ten)+"</h4>";
      html += "<div class=\"m-sub\">📍 "+esc(m.khoa)+"</div>";
      html += "<div style=\"margin-top:8px;font-size:12px;font-weight:700;color:"+(m.level===2?'#fca5a5':'#fde68a')+"\">"+esc(m.label)+": "+esc(m.date)+"</div>";
      html += "</div>";
    });
    html += "</div>";
  }
  // Top khoa with composite Khoa·Cơ sở
  html += "<div class=\"sh\">📊 Khoa × Cơ sở nóng nhất <small style=\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\">(click để xem toàn cảnh khoa)</small></div>";
  html += "<div class=\"bars\">";
  if(d.topKhoa.length===0)html += "<div class=\"empty\" style=\"background:transparent;border:0;\">(Không có dữ liệu khoa)</div>";
  else{
    var maxC = Math.max.apply(null, d.topKhoa.map(function(k){return k.count;})) || 1;
    d.topKhoa.slice(0, 10).forEach(function(k){
      var pct = Math.round(k.count / maxC * 100);
      html += "<div class=\"bar\" data-khoa=\""+esc(k.khoa)+"\" data-coso=\""+esc(k.coso||'')+"\"";
      html += " title=\""+esc(k.khoa)+(k.coso ? ' · '+k.coso : '')+": "+k.count+" vấn đề\">";
      html += "<div class=\"bar-label\">"+esc(k.khoa)+(k.coso?" <small style='color:#6B7280'>"+esc(k.coso)+"</small>":"")+"</div>";
      html += "<div class=\"bar-track\"><div class=\"bar-fill\" style=\"width:"+pct+"%\"></div></div>";
      html += "<div class=\"bar-num\">"+k.count+"</div></div>";
    });
  }
  (d.hot||[]).forEach(function(h){
    var t = h.team || "KT";
    if(!hotByTeam[t]) hotByTeam[t]=[];
    hotByTeam[t].push(h);
  });
  var totalHot = (hotByTeam.KT.length+hotByTeam.HS.length+hotByTeam.KHO.length);
  html += "<div class=\"sh\">🔥 Điểm nóng theo nhóm <small style=\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\">tổng "+totalHot+" — click để mở chi tiết, có CB phụ trách kèm theo để giao việc</small></div>";
  if(totalHot===0)html += "<div class=\"empty\">✓ Không có điểm nóng — chúc Sếp ngày yên ổn!</div>";
  else{
    html += "<div class=\"hot-by-team\">";
    var teamMeta = {
      KT: {icon:"🔧", label:"Kỹ thuật", color:"red", limit:5},
      HS: {icon:"📁", label:"Hồ sơ", color:"yellow", limit:4},
      KHO:{icon:"📦", label:"Kho", color:"orange", limit:4}
    };
    ["KT","HS","KHO"].forEach(function(team){
      var items = hotByTeam[team]||[]; var meta = teamMeta[team];
      html += "<div class=\"hot-team-col hot-team-"+meta.color+"\">";
      html += "<div class=\"hot-team-h\"><span class=\"hot-team-icon\">"+meta.icon+"</span><div class=\"hot-team-meta\"><div class=\"hot-team-name\">"+esc(meta.label)+"</div><div class=\"hot-team-cnt\">"+items.length+" điểm</div></div></div>";
      if(items.length===0){
        html += "<div class=\"hot-empty\">✓ Không có vướng mắc</div>";
      } else {
        items.slice(0, meta.limit).forEach(function(h, i){
          var hotAttrs="";
          if(h.linkType && h.linkId){hotAttrs=" data-type=\""+esc(h.linkType)+"\" data-id=\""+esc(h.linkId)+"\" data-tab=\""+esc(h.linkTab||"")+"\"";}
          else if(h.linkTab){hotAttrs=" data-tab=\""+esc(h.linkTab)+"\" data-title=\""+esc(h.linkTitle||h.title||"Hàng")+"\"";}
          html += "<div class=\"hot-item\""+hotAttrs+" data-gid=\""+(h.gid||"")+"\" data-row=\""+(h.sheetRow||"")+"\">";
          html += "<div class=\"hot-item-head\">";
          html += "<span class=\"hot-item-num\">"+(i+1)+"</span>";
          html += "<span class=\"hot-item-title\">"+esc(h.title)+"</span>";
          html += "<span class=\"hot-item-badge "+(meta.color)+"\">"+esc(h.badge||"")+"</span>";
          html += "</div>";
          if(h.subtitle)html += "<div class=\"hot-item-sub\">📍 "+esc(h.subtitle)+"</div>";
          if(h.detail)html += "<div class=\"hot-item-detail\">"+esc(h.detail)+"</div>";
          if(h.cb)html += "<div class=\"hot-item-cb\">👤 <b>"+esc(h.cb)+"</b></div>";
          html += "</div>";
        });
        if(items.length > meta.limit){
          html += "<div class=\"hot-more\" data-team=\""+team+"\">+ "+(items.length-meta.limit)+" điểm nữa — click để xem tab chi tiết</div>";
        }
      }
      html += "</div>";
    });
    html += "</div>";
  }
  $("#view-overview").innerHTML = html;
  // KPI card click → switch tab
  $$("#view-overview .kpi-card[data-view]").forEach(function(el){
    el.onclick=function(){
      var v = el.getAttribute("data-view");
      var btn = document.querySelector("#tabs button[data-view=\""+v+"\"]");
      if(btn) btn.click();
    };
  });
  $$("#view-overview .hot-item").forEach(function(el){el.onclick=function(){openInApp(el);};});
  $$("#view-overview .hot-more[data-team]").forEach(function(el){
    el.onclick=function(){
      var team = el.getAttribute("data-team");
      var view = team==="KT"?"kt":team==="HS"?"hs":team==="KHO"?"kho":null;
      if(view){var btn=document.querySelector("#tabs button[data-view=\""+view+"\"]");if(btn)btn.click();}
    };
  });
  $$("#view-overview .bar[data-khoa]").forEach(function(el){
    el.onclick=function(){
      var khoa = el.getAttribute("data-khoa");
      var coso = el.getAttribute("data-coso");
      // v2.7: pass cơ sở để khoa modal hiện đúng dữ liệu của khoa·cơ sở đó
      openKhoaModal(khoa, coso);
    };
  });
}
