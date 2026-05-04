function renderOverview(d){\n
  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n
  $("#updated").textContent = "Cập nhật: " + d.updatedAt;\n
  var c=d.cards;\n
  // v2.7: Helper render KPI card với X/Y + progress + breakdown chips\n
  function pctClass(p){return p>=70?"green":p>=30?"yellow":"red";}\n
  function renderKpiCard(opts){\n
    var pct = opts.total ? Math.round(opts.done/opts.total*100) : 0;\n
    var cls = pctClass(pct);\n
    var sevTop = opts.severity || "gray";\n
    var html = "<div class=\"kpi-card kpi-"+sevTop+"\" data-view=\""+esc(opts.view||"")+"\">";\n
    html += "<div class=\"kpi-head\"><span class=\"kpi-icon\">"+opts.icon+"</span><div class=\"kpi-title\">"+esc(opts.title)+"<small>"+esc(opts.sub||"")+"</small></div></div>";\n
    html += "<div class=\"kpi-num\"><span class=\"big\">"+opts.done+"</span><span class=\"sep\"> / </span><span class=\"total\">"+opts.total+"</span></div>";\n
    html += "<div class="kpi-progress"><div class="kpi-progress-fill "+cls+"" style="width:"+pct+"%"></div></div>";\n
    html += "<div class="kpi-pct "+cls+"">"+pct+"% "+esc(opts.pctLabel||"hoàn thành")+"</div>";\n
    if(opts.chips && opts.chips.length){\n
      html += "<div class="kpi-chips">";\n
      opts.chips.forEach(function(ch){\n
        if(ch.value === 0 || ch.value === "0" || ch.value === null || ch.value === undefined) return;\n
        html += "<span class="chip chip-"+(ch.cls||"gray")+"">"+ch.icon+" "+esc(ch.label)+" <b>"+esc(ch.value)+"</b></span>";\n
      });\n
      html += "</div>";\n
    }\n
    if(opts.foot)html += "<div class="kpi-foot">"+opts.foot+"</div>";\n
    html += "<div class="kpi-cta">↗ Xem chi tiết</div>";\n
    html += "</div>";\n
    return html;\n
  }\n
  var html = "<div class="kpi-grid">";\n
  // KT card\n
  var sevKT = c.kt.cao>0||c.kt.treDL>0?"red":c.kt.dangSua>5?"yellow":"green";\n
  html += renderKpiCard({\n
    icon:"🔧", title:"Kỹ thuật", sub:"Máy hỏng / bảo trì", view:"kt", severity:sevKT,\n
    done:c.kt.done, total:c.kt.total,\n
    chips:[\n
      {icon:"🔴", label:"CAO", value:c.kt.cao, cls:"red"},\n
      {icon:"⏰", label:"trễ", value:c.kt.treDL, cls:"red"},\n
      {icon:"🛠", label:"đang sửa", value:c.kt.dangSua, cls:"yellow"},\n
      {icon:"♻", label:"đề xuất TL", value:c.kt.thanhLy, cls:"gray"}\n
    ]\n
  });\n
  // HS card\n
  var sevHS = c.hs.cao>0||c.hs.treDL>0||c.hs.vuong>0?"red":c.hs.dangXL>0?"yellow":"green";\n
  html += renderKpiCard({\n
    icon:"📁", title:"Hồ sơ", sub:"Gói thầu / mua sắm", view:"hs", severity:sevHS,\n
    done:c.hs.done, total:c.hs.total,\n
    chips:[\n
      {icon:"🔴", label:"CAO", value:c.hs.cao, cls:"red"},\n
      {icon:"⏰", label:"trễ", value:c.hs.treDL, cls:"red"},\n
      {icon:"🚧", label:"vướng", value:c.hs.vuong, cls:"yellow"}\n
    ],\n
    foot:"<span class="kpi-foot-num">💰 "+fmtVnd(c.hs.tongGiaTri)+"</span> tổng giá trị"\n
  });\n
  // VT card\n
  var sevVT = c.vt.cao>0||c.vt.treDL>0||c.vt.vuong>0?"red":c.vt.dangXL>0?"yellow":"green";\n
  html += renderKpiCard({\n
    icon:"🧪", title:"Vật tư", sub:"Task hóa chất / VTTH", view:"vt", severity:sevVT,\n
    done:c.vt.done, total:c.vt.total,\n
    chips:[\n
      {icon:"🔴", label:"CAO", value:c.vt.cao, cls:"red"},\n
      {icon:"⏰", label:"trễ", value:c.vt.treDL, cls:"red"},\n
      {icon:"🚧", label:"vướng", value:c.vt.vuong, cls:"yellow"}\n
    ]\n
  });\n
  // v2.10 — KHO card redesign: focus dự đoán cung ứng (sếp quan tâm hàng sắp hết, cần gấp, dự trù)\n
  var f = c.kho.forecast || {l1:0,l2:0,noSolution:0,stagnantLong:0,top:[]};\n
  var khoActionable = f.l1 + f.l2 + f.stagnantLong;\n
  var khoSafe = c.kho.total - khoActionable;\n
  var sevK = (f.noSolution>0 || f.stagnantLong>0) ? "red" : (f.l1>0 || f.l2>0) ? "yellow" : "green";\n
  html += renderKpiCard({\n
    icon:"📦", title:"Kho", sub:"Cung ứng & tồn đọng", view:"kho", severity:sevK,\n
    done:khoSafe, total:c.kho.total,\n
    pctLabel: khoActionable>0 ? "an toàn (còn " + khoActionable + " cần xử lý)" : "an toàn",\n
    chips:[\n
      {icon:"🚨", label:"sắp hết <30n", value:f.l1, cls:"red"},\n
      {icon:"🔴", label:"cần gấp 30-60n", value:f.l2, cls:"red"},\n
      {icon:"⚠", label:"chưa có gói thầu", value:f.noSolution, cls:"red"},\n
      {icon:"📦", label:"tồn >1 năm", value:f.stagnantLong, cls:"gray"}\n
    ],\n
    foot: (f.top && f.top.length) ? ("<span class="kpi-foot-num" style="color:#FBBF24">" + esc(f.top[0].ten.substring(0, 30)) + (f.top[0].ten.length>30?"…":"") + "</span> · DOH " + f.top[0].doh + "n") : ""\n
  });\n
  html += "</div>";\n
  // v2.10: Maintenance Alert Section\n
  if(d.maintenance && d.maintenance.top && d.maintenance.top.length){\n
    html += "<div class="sh" style="display:flex;justify-content:space-between;align-items:center">🔧 DỰ BÁO BẢO TRÌ & BẢO HÀNH (" + (d.maintenance.l1 + d.maintenance.l2) + ") <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px" onclick="renderMaintReport()">Xem bảng tổng hợp →</button></div>";\n
    html += "<div class="maint-forecast-row">";\n
    d.maintenance.top.forEach(function(m){\n
      var cls = m.level === 2 ? "red" : "yellow";\n
      html += "<div class="maint-card "+cls+"" onclick="openDetail(\'KT\', \'" + esc(m.ma||m.ten) + "\')">";\n
      html += "<h4>"+esc(m.ten)+"</h4>";\n
      html += "<div class="m-sub">📍 "+esc(m.khoa)+"</div>";\n
      html += "<div style="margin-top:8px;font-size:12px;font-weight:700;color:"+(m.level===2?\'#fca5a5\':\'#fde68a\')+"">"+esc(m.label)+": "+esc(m.date)+"</div>";\n
      html += "</div>";\n
    });\n
    html += "</div>";\n
  }\n
  // Top khoa with composite Khoa·Cơ sở\n
  html += "<div class="sh">📊 Khoa × Cơ sở nóng nhất <small style="font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px">(click để xem toàn cảnh khoa)</small></div>";\n
  html += "<div class="bars">";\n
  if(d.topKhoa.length===0)html += "<div class="empty" style="background:transparent;border:0;">(Không có dữ liệu khoa)</div>";\n
  else{\n
    var maxC = Math.max.apply(null, d.topKhoa.map(function(k){return k.count;})) || 1;\n
    d.topKhoa.slice(0, 10).forEach(function(k){\n
      var pct = Math.round(k.count / maxC * 100);\n
      html += "<div class=\"bar\" data-khoa=\""+esc(k.khoa)+"\" data-coso=\""+esc(k.coso||\'\')+"\"";\n
      html += " title=\""+esc(k.khoa)+(k.coso ? \' · \'+k.coso : \'\')+": "+k.count+" vấn đề\">";\n
      html += "<div class=\"bar-label\">"+esc(k.khoa)+(k.coso?" <small style=\'color:#6B7280\'>"+esc(k.coso)+"</small>":"")+"</div>";\n
      html += "<div class=\"bar-track\"><div class=\"bar-fill\" style=\"width:"+pct+"%\"></div></div>";\n
      html += "<div class=\"bar-num\">"+k.count+"</div></div>";\n
    });\n
  }\n
  (d.hot||[]).forEach(function(h){\n
    var t = h.team || "KT";\n
    if(!hotByTeam[t]) hotByTeam[t]=[];\n
    hotByTeam[t].push(h);\n
  });\n
  var totalHot = (hotByTeam.KT.length+hotByTeam.HS.length+hotByTeam.KHO.length);\n
  html += "<div class="sh">🔥 Điểm nóng theo nhóm <small style="font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px">tổng "+totalHot+" — click để mở chi tiết, có CB phụ trách kèm theo để giao việc</small></div>";\n
  if(totalHot===0)html += "<div class="empty">✓ Không có điểm nóng — chúc Sếp ngày yên ổn!</div>";\n
  else{\n
    html += "<div class="hot-by-team">";\n
    var teamMeta = {\n
      KT: {icon:"🔧", label:"Kỹ thuật", color:"red", limit:5},\n
      HS: {icon:"📁", label:"Hồ sơ", color:"yellow", limit:4},\n
      KHO:{icon:"📦", label:"Kho", color:"orange", limit:4}\n
    };\n
    ["KT","HS","KHO"].forEach(function(team){\n
      var items = hotByTeam[team]||[]; var meta = teamMeta[team];\n
      html += "<div class="hot-team-col hot-team-"+meta.color+"">";\n
      html += "<div class="hot-team-h"><span class="hot-team-icon">"+meta.icon+"</span><div class="hot-team-meta"><div class="hot-team-name">"+esc(meta.label)+"</div><div class="hot-team-cnt">"+items.length+" điểm</div></div></div>";\n
      if(items.length===0){\n
        html += "<div class="hot-empty">✓ Không có vướng mắc</div>";\n
      } else {\n
        items.slice(0, meta.limit).forEach(function(h, i){\n
          var hotAttrs="";\n
          if(h.linkType && h.linkId){hotAttrs=" data-type=""+esc(h.linkType)+"" data-id=""+esc(h.linkId)+"" data-tab=""+esc(h.linkTab||"")+""";}\n
          else if(h.linkTab){hotAttrs=" data-tab=""+esc(h.linkTab)+"" data-title=""+esc(h.linkTitle||h.title||"Hàng")+""";}\n
          html += "<div class="hot-item""+hotAttrs+" data-gid=""+(h.gid||"")+"" data-row=""+(h.sheetRow||"")+"">";\n
          html += "<div class="hot-item-head">";\n
          html += "<span class="hot-item-num">"+(i+1)+"</span>";\n
          html += "<span class="hot-item-title">"+esc(h.title)+"</span>";\n
          html += "<span class="hot-item-badge "+(meta.color)+"">"+esc(h.badge||"")+"</span>";\n
          html += "</div>";\n
          if(h.subtitle)html += "<div class="hot-item-sub">📍 "+esc(h.subtitle)+"</div>";\n
          if(h.detail)html += "<div class="hot-item-detail">"+esc(h.detail)+"</div>";\n
          if(h.cb)html += "<div class="hot-item-cb">👤 <b>"+esc(h.cb)+"</b></div>";\n
          html += "</div>";\n
        });\n
        if(items.length > meta.limit){\n
          html += "<div class="hot-more" data-team=""+team+"">+ "+(items.length-meta.limit)+" điểm nữa — click để xem tab chi tiết</div>";\n
        }\n
      }\n
      html += "</div>";\n
    });\n
    html += "</div>";\n
  }\n
  $("#view-overview").innerHTML = html;\n
  // KPI card click → switch tab\n
  $$("#view-overview .kpi-card[data-view]").forEach(function(el){\n
    el.onclick=function(){\n
      var v = el.getAttribute("data-view");\n
      var btn = document.querySelector("#tabs button[data-view=""+v+""]");\n
      if(btn) btn.click();\n
    };\n
  });\n
  $$("#view-overview .hot-item").forEach(function(el){el.onclick=function(){openInApp(el);};});\n
  $$("#view-overview .hot-more[data-team]").forEach(function(el){\n
    el.onclick=function(){\n
      var team = el.getAttribute("data-team");\n
      var view = team==="KT"?"kt":team==="HS"?"hs":team==="KHO"?"kho":null;\n
      if(view){var btn=document.querySelector("#tabs button[data-view=""+view+""]");if(btn)btn.click();}\n
    };\n
  });\n
  $$("#view-overview .bar[data-khoa]").forEach(function(el){\n
    el.onclick=function(){\n
      var khoa = el.getAttribute("data-khoa");\n
      var coso = el.getAttribute("data-coso");\n
      // v2.7: pass cơ sở để khoa modal hiện đúng dữ liệu của khoa·cơ sở đó\n
      openKhoaModal(khoa, coso);\n
    };\n
  });\n
}\n
