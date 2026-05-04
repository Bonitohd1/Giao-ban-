\n
(function(){\n
  // v2.8 ARCH FIX: window.name tồn tại qua document.write() của GAS\n
  // GAS dùng document.write() → tạo <html> mới → class bị mất\n
  // window.name KHÔNG bị reset → dùng làm persistent flag\n
  var detected = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)\n
    || (typeof screen !== "undefined" && screen.width <= 768)\n
    || window.innerWidth <= 768;\n
  // Lần đầu: detect và ghi vào window.name\n
  // Lần sau (sau document.write()): đọc lại từ window.name\n
  if(detected) window.name = "gas_mob_v28";\n
  var isMob = detected || window.name === "gas_mob_v28";\n
  function applyMob(){\n
    if(isMob) document.documentElement.classList.add("mob");\n
  }\n
  applyMob();\n
  document.addEventListener("DOMContentLoaded", applyMob);\n
  window.addEventListener("load", applyMob);\n
  // Backup: MutationObserver giữ class nếu có code nào xóa\n
  if(isMob && typeof MutationObserver !== "undefined"){\n
    new MutationObserver(function(){\n
      if(!document.documentElement.classList.contains("mob"))\n
        document.documentElement.classList.add("mob");\n
    }).observe(document.documentElement,{attributes:true,attributeFilter:["class"]});\n
  }\n
})();\n

\n
(function(){\n
var STATE = { sheetUrl: "", currentView: "overview", overview: null, kt: null, hs: null, vt: null, kho: null, khoa: null };\n
var TAB_NAME = { KT:"Nhóm kỹ thuật", VT:"Nhóm vật tư tiêu hao- hóa chất", HS:"Nhóm Hồ sơ", KHO_5A:"5A. Tổ kho - Tồn", KHO_5B:"5B. Tổ kho - Đề xuất" };\n
function $(s,p){return (p||document).querySelector(s);} \n
function $$(s,p){return Array.from((p||document).querySelectorAll(s));}\n
function esc(s){if(s===null||s===undefined)return"";return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});}\n
function fmtVnd(n){if(!n||isNaN(n))return"";if(n>=1e9)return(n/1e9).toFixed(2)+" tỷ";if(n>=1e6)return(n/1e6).toFixed(1)+" tr";return n.toLocaleString("vi-VN");}\n
function deepLink(gid,row){return STATE.sheetUrl + "/edit#gid=" + gid + "&range=A" + row;}\n
function openRow(gid,row){if(gid&&row)window.open(deepLink(gid,row),"_blank");}\n
/* v2.3 — open detail modal */
function openDetail(type,id){\n
  if(\!type||\!id)return;\n
  $("#modal").classList.add("show");\n
  $("#modal-body").innerHTML="<div class=\"loading\" style=\"padding:40px\">Đang tải chi tiết…</div>";\n
  $("#modal-title").innerHTML="<span class=\"badge "+esc(type)+"\">"+esc(type)+"</span><h2>"+esc(id)+"</h2>";\n
  $("#modal-actions").innerHTML="<button class=\"btn btn-close\" onclick=\"document.getElementById('modal').classList.remove('show')\">Đóng (Esc)</button>";\n
  google.script.run.withSuccessHandler(renderDetail).withFailureHandler(showErr).getDetail(type,id);\n
}\n
function renderDetail(d){\n
  if(d.error){$("#modal-body").innerHTML="<div class=\"error\" style=\"margin:20px\">"+esc(d.error)+"</div>";return;}\n
  var me=d.me;\n
  var typeLabel={KT:"Thiết bị",VT:"Vật tư",HS:"Hồ sơ"}[d.type]||d.type;\n
  $("#modal-title").innerHTML="<span class=\"badge "+esc(d.type)+"\">"+esc(typeLabel)+(me.ma?" — "+esc(me.ma):"")+"</span><h2>"+esc(me.ten||me.noiDung||"(không tên)")+"</h2>";\n
  var openLink=d.sheetUrl+"/edit#gid="+(me.gid||"")+"&range=A"+(me.rowNum||"");\n
  $("#modal-actions").innerHTML="<a href=\""+openLink+"\" target=\"_blank\" class=\"btn\">↗ Mở Sheet</a> <button class=\"btn btn-close\" onclick=\"document.getElementById('modal').classList.remove('show')\">Đóng</button>";\n
/* v2.3+ kho renderer */
function khoSeverity(stock){\n
  if(\!stock||\!stock.tt)return"gray";\n
  var t=String(stock.tt);\n
  if(t.indexOf("ĐỎ")>=0)return"red";\n
  if(t.indexOf("VÀNG")>=0)return"yellow";\n
  if(t.indexOf("XANH")>=0)return"green";\n
  return"gray";\n
}\n
function renderKhoCard(kho){\n
  if(\!kho||(\!kho.stock&&(\!kho.queue||\!kho.queue.length)))return"";\n
  var html="<div class=\"kho-card\">";\n
  if(kho.stock){\n
    var sev=khoSeverity(kho.stock);\n
    var ton=kho.stock.ton===""||kho.stock.ton===null?"-":esc(kho.stock.ton);\n
    var doh=kho.stock.doh===""||kho.stock.doh===null?"-":esc(kho.stock.doh);\n
    html+="<div class=\"kho-h\">📦 Kho: <span class=\"stock-pill "+sev+"\">"+esc(kho.stock.tt||"-")+"</span></div>";\n
    html+="<div class=\"kho-stat\">Tồn: <b style=\"color:#fff\">"+ton+"</b> · DOH: <b style=\"color:#fff\">"+doh+"</b> ngày";\n
    if(kho.stock.khoamax)html+=" · Khoa YC nhiều nhất: <b style=\"color:#fff\">"+esc(kho.stock.khoamax)+"</b>";\n
    if(kho.stock.sokhoa)html+=" · "+esc(kho.stock.sokhoa)+" khoa đang chờ";\n
    html+="</div>";\n
    if(kho.stock.dexuat)html+="<div class=\"kho-stat\" style=\"margin-top:4px;color:#FBBF24\">→ "+esc(kho.stock.dexuat)+"</div>";\n
  } else {\n
    html+="<div class=\"kho-h\" style=\"color:#9CA3AF\">📦 Kho: <span class=\"stock-pill gray\">không khớp 5A</span></div>";\n
  }\n
  if(kho.queue&&kho.queue.length){\n
    var open=kho.queue.filter(function(q){return(q.tt||"").indexOf("Đã cấp đủ")<0;}).length;\n
    html+="<div class=\"kho-queue\"><div style=\"color:#9CA3AF;margin-bottom:3px\">Đề xuất 5B ("+open+" chưa xong / "+kho.queue.length+" tổng):</div>";\n
    kho.queue.slice(0,5).forEach(function(q){\n
      var done=(q.tt||"").indexOf("Đã cấp đủ")>=0;\n
      html+="<div class=\"kho-queue-item\"><span class=\"khn\">"+esc(q.khoa||"?")+"</span><span>"+esc(q.sl||"")+" "+esc(q.dv||"")+" · "+esc(q.ngayYC||"-")+" · <span style=\"color:"+(done?"#10B981":"#FBBF24")+"\">"+esc(q.tt||"chưa xử lý")+"</span></span></div>";\n
    });\n
    html+="</div>";\n
  }\n
  html+="</div>";\n
  return html;\n
}\n
function khoMini(kho){\n
  if(\!kho)return"";\n
  var bits=[];\n
  if(kho.stock){var sev=khoSeverity(kho.stock);bits.push("<span class=\"mini-pill stock-pill "+sev+"\">📦 "+esc(kho.stock.tt||"?")+"</span>");}\n
  if(kho.queue&&kho.queue.length){var open=kho.queue.filter(function(q){return(q.tt||"").indexOf("Đã cấp đủ")<0;}).length;if(open)bits.push("<span class=\"mini-pill stock-pill orange\">"+open+" khoa chờ</span>");}\n
  return bits.length?"<div class=\"kho-mini\">"+bits.join("")+"</div>":"";\n
}\n
  function renderEntCard(e,fuzzy){\n
    var o=e.obj?e.obj:e;var f=e.fuzzy\!==undefined?e.fuzzy:fuzzy;\n
    var badge=f?"<span class=\"fuzzy-badge\">🔍 đoán</span>":"<span class=\"manual-badge\">🔗 link</span>";\n
    var html="<div class=\"entity-card\" data-type=\""+esc(o.type)+"\" data-id=\""+esc(o.ma||o.ten)+"\">";\n
    html+="<div class=\"name\">"+esc(o.ten||o.noiDung||"(?)")+badge+"</div>";\n
    html+="<div class=\"meta\">";\n
    if(o.ma)html+="<span class=\"lbl\">Mã:</span> "+esc(o.ma)+" · ";\n
    if(o.khoa)html+="<span class=\"lbl\">Khoa:</span> "+esc(o.khoa)+"<br>";\n
    if(o.tinh)html+="<span class=\"lbl\">Tình trạng:</span> "+esc(o.tinh)+"<br>";\n
    if(o.tt)html+="<span class=\"lbl\">Trạng thái:</span> "+esc(o.tt)+"<br>";\n
    if(o.cb)html+="<span class=\"lbl\">CB:</span> "+esc(o.cb)+"<br>";\n
    if(o.vuong)html+="<span class=\"lbl\" style=\"color:#F87171\">⚠ Vướng:</span> "+esc(String(o.vuong).substring(0,80))+"<br>";\n
    html+="</div></div>";\n
    if(e&&e.kho)html=html.slice(0,-12)+renderKhoCard(e.kho)+"</div></div>";\n
    return html;\n
  }\n
  var html="<div class=\"modal-3col\">";\n
  /* THIS entity card */\n
  html+="<div class=\"modal-col\"><h3>📍 "+esc(typeLabel)+" này</h3>";\n
  html+="<div class=\"entity-card\" style=\"cursor:default;border-color:#3B82F6\">";\n
  html+="<div class=\"name\">"+esc(me.ten||me.noiDung||"(?)")+"</div><div class=\"meta\">";\n
  if(me.ma)html+="<span class=\"lbl\">Mã:</span> "+esc(me.ma)+"<br>";\n
  if(me.khoa)html+="<span class=\"lbl\">Khoa:</span> "+esc(me.khoa)+"<br>";\n
  if(me.tinh)html+="<span class=\"lbl\">Tình trạng:</span> "+esc(me.tinh)+"<br>";\n
  if(me.chiTiet)html+="<span class=\"lbl\">Chi tiết:</span> "+esc(me.chiTiet)+"<br>";\n
  if(me.tt)html+="<span class=\"lbl\">Trạng thái:</span> "+esc(me.tt)+"<br>";\n
  if(me.cb)html+="<span class=\"lbl\">CB phụ trách:</span> "+esc(me.cb)+"<br>";\n
  if(me.vuong)html+="<span class=\"lbl\" style=\"color:#F87171\">⚠ Vướng:</span> "+esc(me.vuong)+"<br>";\n
  if(me.giaTri)html+="<span class=\"lbl\">Giá trị:</span> "+fmtVnd(me.giaTri)+" VND<br>";\n
  html+="</div>";\n
  if(d.type==="VT"){\n
    if(d.kho)html+=renderKhoCard(d.kho);\n
    if(d.relatedKho && d.relatedKho.length){\n
      html+="<div class=\"related-kho-section\"><h4>📦 Kho liên quan (gợi ý match)</h4>";\n
      d.relatedKho.forEach(function(rk){\n
        var sev=khoSeverity(rk);\n
        html+="<div class=\"entity-card\" onclick=\"openGenericRow('5A. Tổ kho - Tồn','"+rk.gid+"','"+rk.rowNum+"','"+esc(rk.ten)+"')\">";\n
        html+="<div class=\"name\">"+esc(rk.ten)+" <span class=\"stock-pill "+sev+"\">"+esc(rk.tt||"?")+"</span></div>";\n
        html+="<div class=\"meta\">Tồn: "+esc(rk.ton||"-")+" · DOH: "+esc(rk.doh||"-")+"</div></div>";\n
      });\n
      html+="</div>";\n
    }\n
  }\n
  html+="</div>";\n
  /* Other 2 cols depending on type */\n
  if(d.type==="KT"){\n
    html+="<div class=\"modal-col\"><h3>🧪 Vật tư liên quan <span class=\"count\">"+(d.vt||[]).length+"</span></h3>";\n
    if(\!(d.vt||[]).length)html+="<div class=\"empty\" style=\"padding:14px\">Không tìm thấy vật tư liên quan</div>";\n
    (d.vt||[]).forEach(function(e){html+=renderEntCard(e);});\n
    html+="</div>";\n
    html+="<div class=\"modal-col\"><h3>📁 Hồ sơ / Gói thầu liên quan <span class=\"count\">"+(d.hs||[]).length+"</span></h3>";\n
    if(\!(d.hs||[]).length)html+="<div class=\"empty\" style=\"padding:14px\">Không tìm thấy hồ sơ liên quan</div>";\n
    (d.hs||[]).forEach(function(e){html+=renderEntCard(e);});\n
    html+="</div>";\n
  } else if(d.type==="VT"){\n
    html+="<div class=\"modal-col\"><h3>🔧 Thiết bị dùng <span class=\"count\">"+(d.kt||[]).length+"</span></h3>";\n
    if(\!(d.kt||[]).length)html+="<div class=\"empty\" style=\"padding:14px\">Không có thiết bị nào liên kết</div>";\n
    (d.kt||[]).forEach(function(e){html+=renderEntCard(e);});\n
    html+="</div>";\n
    html+="<div class=\"modal-col\"><h3>📁 Đang trong gói thầu <span class=\"count\">"+(d.hs||[]).length+"</span></h3>";\n
    if(\!(d.hs||[]).length)html+="<div class=\"empty\" style=\"padding:14px\">Chưa link với gói thầu nào</div>";\n
    (d.hs||[]).forEach(function(e){html+=renderEntCard(e);});\n
    html+="</div>";\n
  } else if(d.type==="HS"){\n
    html+="<div class=\"modal-col\"><h3>🔧 Thiết bị bị ảnh hưởng <span class=\"count\">"+(d.kt||[]).length+"</span></h3>";\n
    if(\!(d.kt||[]).length)html+="<div class=\"empty\" style=\"padding:14px\">Không có thiết bị bị ảnh hưởng</div>";\n
    (d.kt||[]).forEach(function(e){html+=renderEntCard(e);});\n
    html+="</div>";\n
    html+="<div class=\"modal-col\"><h3>🧪 Vật tư trong gói <span class=\"count\">"+(d.vt||[]).length+"</span></h3>";\n
    if(\!(d.vt||[]).length)html+="<div class=\"empty\" style=\"padding:14px\">Chưa link với vật tư cụ thể</div>";\n
    (d.vt||[]).forEach(function(e){html+=renderEntCard(e);});\n
    html+="</div>";\n
  }\n
  html+="</div>";\n
  $("#modal-body").innerHTML=html;\n
  $("#modal-meta").innerHTML="<div class=\"row-info\"><div><strong>Hàng:</strong> "+esc(me.rowNum||"-")+" — Click \"↗ Mở Sheet\" để vào sửa trực tiếp</div><div><strong>Hint:</strong> Click vào ô bên cạnh để khám phá chuỗi liên kết.</div></div>";\n
  $$("#modal-body .entity-card[data-type]").forEach(function(el){el.onclick=function(){openDetail(el.dataset.type,el.dataset.id);};});\n
}\n
/* Close modal on Esc + click backdrop */
document.addEventListener("keydown",function(e){if(e.key==="Escape")$("#modal").classList.remove("show");});\n
$("#modal").onclick=function(e){if(e.target===this)this.classList.remove("show");};\n
/* v2.4 — In-app generic row modal (for Kho 5A/5B & generic fallback) */
function openGenericRow(tab,gid,rowIdx,title){\n
  if(\!tab||\!rowIdx)return;\n
  $("#modal").classList.add("show");\n
  $("#modal-title").innerHTML="<span class=\"badge\" style=\"background:#374151;color:#D1D5DB\">📄 Hàng</span><h2>"+esc(title||tab)+"</h2>";\n
  $("#modal-body").innerHTML="<div class=\"loading\" style=\"padding:40px\">Đang tải hàng…</div>";\n
  $("#modal-actions").innerHTML="<button class=\"btn btn-close\" onclick=\"document.getElementById('modal').classList.remove('show')\">Đóng (Esc)</button>";\n
  $("#modal-meta").innerHTML="";\n
  google.script.run.withSuccessHandler(function(d){\n
    if(d.error){$("#modal-body").innerHTML="<div class=\"error\" style=\"margin:20px\">"+esc(d.error)+"</div>";return;}\n
    var html="<div class=\"kv-list\">";\n
    d.fields.forEach(function(f){\n
      var v=f.val===""?"<span class=\"empty\">(trống)</span>":esc(f.val);\n
      html+="<div class=\"k\">"+esc(f.key)+"</div><div class=\"v\">"+v+"</div>";\n
    });\n
    html+="</div>";\n
    $("#modal-body").innerHTML=html;\n
    var openLink=d.sheetUrl+"/edit#gid="+(d.gid||"")+"&range=A"+(d.rowIdx||"");\n
    $("#modal-actions").innerHTML="<a href=\""+openLink+"\" target=\"_blank\" class=\"btn btn-secondary\" title=\"Mở Sheet để sửa\">↗ Sửa trên Sheet</a> <button class=\"btn btn-close\" onclick=\"document.getElementById('modal').classList.remove('show')\">Đóng</button>";\n
    $("#modal-meta").innerHTML="<div class=\"row-info\"><div><strong>Tab:</strong> "+esc(d.tab)+" · <strong>Hàng:</strong> "+esc(d.rowIdx)+"</div><div><strong>Tip:</strong> Click \"↗ Sửa trên Sheet\" chỉ khi cần sửa nhanh.</div></div>";\n
  }).withFailureHandler(function(err){$("#modal-body").innerHTML="<div class=\"error\" style=\"margin:20px\">⚠ Lỗi tải hàng: "+esc(err && err.message || err)+"</div>";}).getRowDetail(tab,parseInt(rowIdx,10));\n
}\n
/* v2.4 — In-app Khoa Detail modal (lãnh đạo 360° cho 1 khoa) */
function openKhoaModal(khoaName, coso){\n
  if(\!khoaName)return;\n
  $("#modal").classList.add("show");\n
  $("#modal-title").innerHTML="<span class=\"badge\" style=\"background:#0E7490;color:#A5F3FC\">🏥 Khoa</span><h2>"+esc(khoaName)+"</h2>";\n
  $("#modal-body").innerHTML="<div class=\"loading\" style=\"padding:40px\">Đang tải toàn cảnh khoa "+esc(khoaName)+"…</div>";\n
  $("#modal-actions").innerHTML="<button class=\"btn btn-close\" onclick=\"document.getElementById('modal').classList.remove('show')\">Đóng (Esc)</button>";\n
  $("#modal-meta").innerHTML="";\n
  google.script.run.withSuccessHandler(function(d){\n
    if(d.error){$("#modal-body").innerHTML="<div class=\"error\" style=\"margin:20px\">"+esc(d.error)+"</div>";return;}\n
    var s=d.summary||{totalKT:0,totalHS:0,totalVT:0,totalKho:0,doneKT:0,doneHS:0};\n
    var html="<div class=\"khoa-modal-wrap\">";\n
    html+="<div class=\"khoa-modal-summary\">";\n
    html+="<div class=\"khoa-modal-stat\"><div class=\"k\">🔧 Máy hỏng</div><div class=\"v\"><span style=\"color:#10B981\">"+s.doneKT+"</span><span style=\"font-size:18px;color:#6B7280;margin:0 3px;font-weight:400\">/</span><span style=\"color:"+(s.totalKT>0?"#EF4444":"#9CA3AF")+"\">"+s.totalKT+"</span></div><div style=\"font-size:10px;color:#9CA3AF\">đã xong / tổng máy</div></div>";\n
    html+="<div class=\"khoa-modal-stat\"><div class=\"k\">📁 Hồ sơ</div><div class=\"v\"><span style=\"color:#10B981\">"+s.doneHS+"</span><span style=\"font-size:18px;color:#6B7280;margin:0 3px;font-weight:400\">/</span><span style=\"color:"+(s.totalHS>0?"#F59E0B":"#9CA3AF")+"\">"+s.totalHS+"</span></div><div style=\"font-size:10px;color:#9CA3AF\">đã xong / tổng hồ sơ</div></div>";\n
    html+="<div class=\"khoa-modal-stat\"><div class=\"k\">🧪 VT/HC</div><div class=\"v\">"+s.totalVT+"</div></div>";\n
    html+="<div class=\"khoa-modal-stat\"><div class=\"k\">📦 YC kho</div><div class=\"v\">"+s.totalKho+"</div></div>";\n
    html+="</div>";\n
/* KT */
    html+="<div class=\"khoa-modal-section\"><h3>🔧 Thiết bị đang vướng <span class=\"count\">"+(d.kt||[]).length+"</span></h3>";\n
    if(\!(d.kt||[]).length)html+="<div class=\"empty\">Không có thiết bị vướng mắc.</div>";\n
    else{\n
      html+="<div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Tên máy</th><th>Tình trạng</th><th>Chi tiết</th><th>CB</th><th>Deadline</th><th>HT</th></tr></thead><tbody>";\n
      d.kt.forEach(function(r){\n
        var pill=r.tinh && r.tinh.toLowerCase().indexOf("đang sửa")>=0?"yellow":r.tinh && r.tinh.toLowerCase().indexOf("thanh lý")>=0?"gray":"blue";\n
        html+="<tr data-kt-id=\""+esc(r.ten)+"\" style=\"cursor:pointer\">";\n
        html+="<td><b>"+esc(r.ten)+"</b></td>";\n
        html+="<td><span class=\"pill "+pill+"\">"+esc(r.tinh||"-")+"</span></td>";\n
        html+="<td style=\"max-width:280px;font-size:12px\">"+esc(r.ct||"")+"</td>";\n
        html+="<td style=\"font-size:12px\">"+esc(r.cb||"")+"</td>";\n
        html+="<td style=\"font-size:11px\">"+esc(r.dl||"")+"</td>";\n
        html+="<td>"+(r.ht?"✓":"⏳")+"</td></tr>";\n
      });\n
      html+="</tbody></table></div>";\n
    }\n
    html+="</div>";\n
/* HS */
    html+="<div class=\"khoa-modal-section\"><h3>📁 Gói thầu / Hồ sơ <span class=\"count\">"+(d.hs||[]).length+"</span></h3>";\n
    if(\!(d.hs||[]).length)html+="<div class=\"empty\">Không có hồ sơ nào.</div>";\n
    else{\n
      html+="<div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Mã HS</th><th>Nội dung</th><th>Trạng thái</th><th>%</th><th>CB</th><th>Deadline</th><th>HT</th></tr></thead><tbody>";\n
      d.hs.forEach(function(r){\n
        html+="<tr data-hs-id=\""+esc(r.ma||r.nd)+"\" style=\"cursor:pointer\">";\n
        html+="<td><b style=\"color:#60A5FA\">"+esc(r.ma||"")+"</b></td>";\n
        html+="<td style=\"max-width:340px;font-size:12px\">"+esc(r.nd||"")+"</td>";\n
        html+="<td><span class=\"pill blue\">"+esc(r.tt||"-")+"</span></td>";\n
        html+="<td class=\"num\">"+(r.pct\!==null && r.pct\!==undefined?r.pct+"%":"-")+"</td>";\n
        html+="<td style=\"font-size:12px\">"+esc(r.cb||"")+"</td>";\n
        html+="<td style=\"font-size:11px\">"+esc(r.dl||"")+"</td>";\n
        html+="<td>"+(r.ht?"✓":"⏳")+"</td></tr>";\n
      });\n
      html+="</tbody></table></div>";\n
    }\n
    html+="</div>";\n
/* VT */
    html+="<div class=\"khoa-modal-section\"><h3>🧪 Vật tư / Hóa chất <span class=\"count\">"+(d.vt||[]).length+"</span></h3>";\n
    if(\!(d.vt||[]).length)html+="<div class=\"empty\">Không có task vật tư.</div>";\n
    else{\n
      html+="<div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Loại</th><th>Trạng thái</th><th>%</th><th>CB</th><th>Deadline</th></tr></thead><tbody>";\n
      d.vt.forEach(function(r){\n
        html+="<tr data-vt-id=\""+esc(r.loai)+"\" style=\"cursor:pointer\">";\n
        html+="<td><b>"+esc(r.loai||"")+"</b></td>";\n
        html+="<td>"+esc(r.tt||"-")+"</td>";\n
        html+="<td class=\"num\">"+(r.pct\!==null && r.pct\!==undefined?r.pct+"%":"-")+"</td>";\n
        html+="<td style=\"font-size:12px\">"+esc(r.cb||"")+"</td>";\n
        html+="<td style=\"font-size:11px\">"+esc(r.dl||"")+"</td></tr>";\n
      });\n
      html+="</tbody></table></div>";\n
    }\n
    html+="</div>";\n
/* Kho */
    html+="<div class=\"khoa-modal-section\"><h3>📦 Yêu cầu kho <span class=\"count\">"+(d.kho||[]).length+"</span></h3>";\n
    if(\!(d.kho||[]).length)html+="<div class=\"empty\">Không có YC kho.</div>";\n
    else{\n
      html+="<div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Ngày YC</th><th>VTTH</th><th>SL</th><th>Ưu tiên</th><th>Trạng thái</th></tr></thead><tbody>";\n
      d.kho.forEach(function(r){\n
        var pillUT=r.ut && r.ut.indexOf("CAO")>=0?"red":"gray";\n
        html+="<tr><td style=\"font-size:11px\">"+esc(r.ngay||"")+"</td>";\n
        html+="<td><b>"+esc(r.vtth||"")+"</b></td>";\n
        html+="<td class=\"num\">"+esc(r.sl||"")+"</td>";\n
        html+="<td><span class=\"pill "+pillUT+"\">"+esc(r.ut||"-")+"</span></td>";\n
        html+="<td>"+esc(r.tt||"")+"</td></tr>";\n
      });\n
      html+="</tbody></table></div>";\n
    }\n
    html+="</div>";\n
    if(\!(d.kt||[]).length && \!(d.hs||[]).length && \!(d.vt||[]).length && \!(d.kho||[]).length){\n
      html+="<div class=\"empty\" style=\"margin-top:14px\">✓ Khoa "+esc(khoaName)+" hiện không có vấn đề nào — tốt\!</div>";\n
    }\n
    html+="</div>";\n
    $("#modal-body").innerHTML=html;\n
    $("#modal-meta").innerHTML="<div class=\"row-info\"><div><strong>Tip:</strong> Click vào hàng máy/hồ sơ/vật tư để mở chi tiết 360°.</div></div>";\n
    $$("#modal-body tr[data-kt-id]").forEach(function(tr){tr.onclick=function(){openDetail("KT",tr.dataset.ktId);};});\n
    $$("#modal-body tr[data-hs-id]").forEach(function(tr){tr.onclick=function(){openDetail("HS",tr.dataset.hsId);};});\n
    $$("#modal-body tr[data-vt-id]").forEach(function(tr){tr.onclick=function(){openDetail("VT",tr.dataset.vtId);};});\n
  }).withFailureHandler(function(err){$("#modal-body").innerHTML="<div class=\"error\" style=\"margin:20px\">⚠ Lỗi tải khoa: "+esc(err && err.message || err)+"</div>";}).getByKhoa(khoaName, coso||"");\n
}\n
/* v2.4 — Smart in-app row click router */
function openInApp(el){\n
  if(\!el)return;\n
  var d=el.dataset;\n
  if(d.type && d.id){openDetail(d.type,d.id);return;}\n
  if(d.tab && d.row){openGenericRow(d.tab,d.gid,d.row,d.title||d.tab);return;}\n
  if(d.gid && d.row){\n
    /* legacy fallback — use overview tab name as best guess (kho 5A/5B handled elsewhere) */\n
    openGenericRow("",d.gid,d.row,"Hàng");\n
  }\n
}\n
/* v2.3 — Search bar */
(function(){var t,inp=$("#search"),box=$("#search-results");\n
  if(\!inp)return;\n
  inp.oninput=function(){clearTimeout(t);t=setTimeout(function(){\n
    var q=inp.value.trim();if(q.length<2){box.classList.remove("show");return;}\n
    google.script.run.withSuccessHandler(function(d){\n
      if(\!d.results||\!d.results.length){box.innerHTML="<div class=\"search-item\">Không tìm thấy</div>";box.classList.add("show");return;}\n
      var html="";d.results.forEach(function(r){html+="<div class=\"search-item\" data-type=\""+esc(r.type)+"\" data-id=\""+esc(r.id)+"\"><span class=\"type "+esc(r.type)+"\">"+esc(r.type)+"</span><span class=\"label\">"+esc(r.label)+"</span><div class=\"sub\">"+esc(r.sub)+"</div></div>";});\n
      box.innerHTML=html;box.classList.add("show");\n
      $$(".search-item[data-type]",box).forEach(function(el){el.onclick=function(){box.classList.remove("show");inp.value="";openDetail(el.dataset.type,el.dataset.id);};});\n
    }).withFailureHandler(function(){box.classList.remove("show");}).searchAll(q);\n
  },300);};\n
  document.addEventListener("click",function(e){if(\!box.contains(e.target)&&e.target\!==inp)box.classList.remove("show");});\n
})();\n
/* v2.3 — Liên kết view (chuỗi vướng mắc) */
function renderLienket(d){\n
  STATE.sheetUrl=d.sheetUrl||STATE.sheetUrl;\n
  $("#updated").textContent="Cập nhật: "+d.updatedAt;\n
  var hasMain=d.chains&&d.chains.length;\n
  var hasKho=d.khoChains&&d.khoChains.length;\n
  if(\!hasMain&&\!hasKho){$("#view-lienket").innerHTML="<div class=\"empty\">🎉 Không có chuỗi vướng mắc nào nghiêm trọng. Tất cả đang trong tầm kiểm soát.</div>";return;}\n
  var html=hasMain?("<h2 style=\"font-size:16px;color:#fff;margin-bottom:14px\">🔗 Top "+d.chains.length+" chuỗi vướng mắc — sắp xếp theo độ ưu tiên</h2>"):"";\n
  (d.chains||[]).forEach(function(ch){\n
    var sev=ch.severity>=6?"red":ch.severity>=4?"orange":"yellow";\n
    var sevLbl=sev==="red"?"NÓNG":sev==="orange"?"CAO":"VỪA";\n
    html+="<div class=\"chain-row\">";\n
    html+="<div class=\"chain-title\"><span class=\"severity "+sev+"\">"+sevLbl+"</span>";\n
    html+="<div style=\"color:#fff;font-weight:600\">"+esc(ch.kt.ten)+"</div>";\n
    if(ch.daysLate)html+="<div style=\"color:#F87171;font-size:11px\">trễ "+ch.daysLate+" ngày</div>";\n
    html+="</div>";\n
    html+="<div class=\"chain-flow\">";\n
    /* KT node */\n
    html+="<div class=\"chain-node\" data-type=\"KT\" data-id=\""+esc(ch.kt.ma||ch.kt.ten)+"\"><div class=\"nm\">🔧 "+esc(ch.kt.ten)+"</div><div class=\"sm\">"+esc(ch.kt.khoa||"")+" · "+esc(ch.kt.tinh||"")+"</div></div>";\n
    html+="<div class=\"arrow\">→</div>";\n
    /* VT node(s) */\n
    if(ch.vt&&ch.vt.length){\n
      html+="<div>";ch.vt.forEach(function(v){html+="<div class=\"chain-node\" data-type=\"VT\" data-id=\""+esc(v.ma||v.ten)+"\" style=\"margin-bottom:4px\"><div class=\"nm\">🧪 "+esc(v.ten)+"</div><div class=\"sm\">"+esc(v.tt||"")+"</div>"+khoMini(v.kho)+"</div>";});html+="</div>";\n
    } else { html+="<div class=\"chain-node empty\">không có vật tư link</div>"; }\n
    html+="<div class=\"arrow\">→</div>";\n
    /* HS node(s) */\n
    if(ch.hs&&ch.hs.length){\n
      html+="<div>";ch.hs.forEach(function(h){html+="<div class=\"chain-node\" data-type=\"HS\" data-id=\""+esc(h.ma||h.ten)+"\" style=\"margin-bottom:4px\"><div class=\"nm\">📁 "+esc(h.ma||h.ten)+"</div><div class=\"sm\">"+esc(h.tt||"")+"</div></div>";});html+="</div>";\n
    } else { html+="<div class=\"chain-node empty\">không có gói thầu link</div>"; }\n
    html+="</div></div>";\n
  });\n
  if(hasKho){\n
    html+="<h2 style=\"font-size:16px;color:#fff;margin:24px 0 14px\">📦 Mạch Kho → Vật tư → Mua sắm ("+d.khoChains.length+") — kho cảnh báo cần truy nguồn</h2>";\n
    d.khoChains.forEach(function(ch){\n
      var sev=ch.severity>=8?"red":ch.severity>=5?"orange":"yellow";\n
      var sevLbl=ch.isRed?"ĐỎ":sev==="orange"?"CAO":"VỪA";\n
      var riskHtml = "";\n
      if(ch.risk) riskHtml = "<span class=\"risk-badge "+ch.risk.level+"\">"+esc(ch.risk.msg)+"</span>";\n
      html+="<div class=\"chain-row\">";\n
      html+="<div class=\"chain-title\"><span class=\"severity "+sev+"\">"+sevLbl+"</span>";\n
      html+="<div style=\"color:#fff;font-weight:600\">📦 "+esc(ch.kho.ten||"?")+(ch.kho.ma?" ("+esc(ch.kho.ma)+")":"")+" "+riskHtml+"</div>";\n
      var doh=ch.kho.doh;\n
      if(doh\!==""&&doh\!==null&&doh\!==undefined)html+="<div style=\"color:"+(Number(doh)<7?"#F87171":"#9CA3AF")+";font-size:11px\">DOH: "+esc(doh)+" ngày</div>";\n
      if(ch.queueOpen)html+="<div style=\"color:#FBBF24;font-size:11px\">"+ch.queueOpen+" khoa đang chờ</div>";\n
      html+="</div>";\n
      html+="<div class=\"chain-flow\">";\n
      var khoOpenLink=STATE.sheetUrl+"/edit#gid="+(ch.kho.gid||"")+"&range=A"+(ch.kho.rowNum||"");\n
      html+="<div class=\"chain-node\" data-href=\""+khoOpenLink+"\"><div class=\"nm\">📦 "+esc(ch.kho.ten)+"</div><div class=\"sm\">Tồn: "+esc(ch.kho.ton||"-")+" · "+esc(ch.kho.tt||"")+"</div>";\n
      if(ch.kho.dexuat)html+="<div class=\"sm\" style=\"color:#FBBF24\">→ "+esc(String(ch.kho.dexuat).substring(0,60))+"</div>";\n
      html+="</div>";\n
      html+="<div class=\"arrow\">→</div>";\n
      if(ch.vt){\n
        html+="<div class=\"chain-node\" data-type=\"VT\" data-id=\""+esc(ch.vt.ma||ch.vt.ten)+"\"><div class=\"nm\">🧪 "+esc(ch.vt.ten)+"</div><div class=\"sm\">"+esc(ch.vt.khoa||"")+" · "+esc(ch.vt.tt||"")+"</div></div>";\n
      } else { html+="<div class=\"chain-node empty\">chưa có vật tư khớp — kiểm tra Mã VTTH</div>"; }\n
      html+="<div class=\"arrow\">→</div>";\n
      if(ch.hs&&ch.hs.length){\n
        html+="<div>";ch.hs.forEach(function(h){html+="<div class=\"chain-node\" data-type=\"HS\" data-id=\""+esc(h.ma||h.ten)+"\" style=\"margin-bottom:4px\"><div class=\"nm\">📁 "+esc(h.ma||h.ten)+"</div><div class=\"sm\">"+esc(h.tt||"")+"</div></div>";});html+="</div>";\n
      } else { html+="<div class=\"chain-node empty\">chưa có gói thầu mua sắm</div>"; }\n
      html+="</div></div>";\n
    });\n
  }\n
  $("#view-lienket").innerHTML=html;\n
  $$("#view-lienket .chain-node[data-type]").forEach(function(el){el.onclick=function(){openDetail(el.dataset.type,el.dataset.id);};});\n
  $$("#view-lienket .chain-node[data-href]").forEach(function(el){el.onclick=function(){window.open(el.getAttribute("data-href"),"_blank");};});\n
}\n
function clock(){var d=new Date();var p=function(n){return n<10?"0"+n:n};$("#clock").textContent=p(d.getHours())+":"+p(d.getMinutes())+":"+p(d.getSeconds());}\n
setInterval(clock,1000);clock();\n
/* v2.6: Refresh button — invalidate cache + reload current view */
(function(){var btn=document.getElementById("btn-refresh");if(!btn)return;\n
  btn.onclick=function(){\n
    btn.disabled=true;btn.textContent="🔄 Đang làm mới…";\n
    google.script.run.withSuccessHandler(function(){\n
      btn.textContent="✅ Đã refresh";\n
      setTimeout(function(){btn.disabled=false;btn.textContent="🔄 Refresh";},1500);\n
      var cur=STATE.currentView||"overview";loadView(cur);\n
    }).withFailureHandler(function(e){\n
      btn.disabled=false;btn.textContent="⚠ Refresh lỗi";\n
      console.error(e);\n
    }).invalidateLinkIndex();\n
  };\n
})();\n
/* v2.9 — Email button: gửi báo cáo giao ban manual */
(function(){var btn=document.getElementById("btn-email");if(!btn)return;\n
  btn.onclick=function(){\n
    if(!confirm("Gửi email báo cáo giao ban ngay cho danh sách email trong cfg_emails?")) return;\n
    btn.disabled=true;btn.textContent="📧 Đang gửi…";\n
    google.script.run.withSuccessHandler(function(res){\n
      if(res && res.ok){\n
        btn.textContent="✅ Đã gửi (" + res.count + ")";\n
        setTimeout(function(){btn.disabled=false;btn.textContent="📧 Gửi email";}, 30000);\n
      } else {\n
        btn.textContent="⚠ " + (res && res.error ? res.error.substring(0,30) : "Lỗi");\n
        setTimeout(function(){btn.disabled=false;btn.textContent="📧 Gửi email";}, 5000);\n
      }\n
    }).withFailureHandler(function(e){\n
      btn.disabled=false;btn.textContent="⚠ Lỗi gửi";\n
      alert("Lỗi gửi email: " + (e && e.message || e));\n
    }).sendReportNow("morning_brief");\n
  };\n
})();\n
/* Tab switching */
$$("#tabs button").forEach(function(b){b.onclick=function(){\n
  $$("#tabs button").forEach(function(x){x.classList.remove("active")});b.classList.add("active");\n
  $$("section.view").forEach(function(x){x.classList.remove("active")});\n
  var v=b.dataset.view;STATE.currentView=v;\n
  $("#view-"+v).classList.add("active");\n
  loadView(v);\n
};});\n
/* Severity helper */
function severity(card){\n
  if(card.red>0||card.cao>3||card.treDL>2||card.requestHigh>0)return"red";\n
  if(card.yellow>0||card.cao>0||card.treDL>0||card.vuong>0)return"yellow";\n
  return"green";\n
}\n
/* Render Overview */
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
    html += "<div class=\"kpi-progress\"><div class=\"kpi-progress-fill "+cls+"\" style=\"width:"+pct+"%\"></div></div>";\n
    html += "<div class=\"kpi-pct "+cls+"\">"+pct+"% "+esc(opts.pctLabel||"hoàn thành")+"</div>";\n
    if(opts.chips && opts.chips.length){\n
      html += "<div class=\"kpi-chips\">";\n
      opts.chips.forEach(function(ch){\n
        if(ch.value === 0 || ch.value === "0" || ch.value === null || ch.value === undefined) return;\n
        html += "<span class=\"chip chip-"+(ch.cls||"gray")+"\">"+ch.icon+" "+esc(ch.label)+" <b>"+esc(ch.value)+"</b></span>";\n
      });\n
      html += "</div>";\n
    }\n
    if(opts.foot)html += "<div class=\"kpi-foot\">"+opts.foot+"</div>";\n
    html += "<div class=\"kpi-cta\">↗ Xem chi tiết</div>";\n
    html += "</div>";\n
    return html;\n
  }\n
  var html = "<div class=\"kpi-grid\">";\n
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
    foot:"<span class=\"kpi-foot-num\">💰 "+fmtVnd(c.hs.tongGiaTri)+"</span> tổng giá trị"\n
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
  // v2.9 — KHO card redesign: focus dự đoán cung ứng (sếp quan tâm hàng sắp hết, cần gấp, dự trù)\n
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
    foot: (f.top && f.top.length) ? ("<span class=\"kpi-foot-num\" style=\"color:#FBBF24\">" + esc(f.top[0].ten.substring(0, 30)) + (f.top[0].ten.length>30?"…":"") + "</span> · DOH " + f.top[0].doh + "n") : ""\n
  });\n
  html += "</div>";\n
  // Top khoa with composite Khoa·Cơ sở\n
  html += "<div class=\"sh\">📊 Khoa × Cơ sở nóng nhất <small style=\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\">(click để xem toàn cảnh khoa)</small></div>";\n
  html += "<div class=\"bars\">";\n
  if(d.topKhoa.length===0)html += "<div class=\"empty\" style=\"background:transparent;border:0;\">(Không có dữ liệu khoa)</div>";\n
  else{\n
    var maxC = Math.max.apply(null, d.topKhoa.map(function(k){return k.count;}));\n
    d.topKhoa.forEach(function(k){\n
      var pct = (k.count/maxC*100).toFixed(0);\n
      var dispLabel = k.label||k.khoa;\n
      html += "<div class=\"bar\" data-khoa=\""+esc(k.khoa)+"\" data-coso=\""+esc(k.coso||"")+"\" style=\"cursor:pointer\">";\n
      html += "<div class=\"bar-name\" title=\""+esc(dispLabel)+"\">"+esc(dispLabel)+"</div>";\n
      html += "<div class=\"bar-track\"><div class=\"bar-fill\" style=\"width:"+pct+"%\"></div></div>";\n
      html += "<div class=\"bar-val\">"+k.count+"</div></div>";\n
    });\n
  }\n
  html += "</div>";\n
  // v2.7.2: Hot list — group by team (KT/HS/KHO) thay vì list phẳng\n
  var hotByTeam = {KT:[], HS:[], KHO:[]};\n
  (d.hot||[]).forEach(function(h){\n
    var t = h.team || "KT";\n
    if(!hotByTeam[t]) hotByTeam[t]=[];\n
    hotByTeam[t].push(h);\n
  });\n
  var totalHot = (hotByTeam.KT.length+hotByTeam.HS.length+hotByTeam.KHO.length);\n
  html += "<div class=\"sh\">🔥 Điểm nóng theo nhóm <small style=\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\">tổng "+totalHot+" — click để mở chi tiết, có CB phụ trách kèm theo để giao việc</small></div>";\n
  if(totalHot===0)html += "<div class=\"empty\">✓ Không có điểm nóng — chúc Sếp ngày yên ổn!</div>";\n
  else{\n
    html += "<div class=\"hot-by-team\">";\n
    var teamMeta = {\n
      KT: {icon:"🔧", label:"Kỹ thuật", color:"red", limit:5},\n
      HS: {icon:"📁", label:"Hồ sơ", color:"yellow", limit:4},\n
      KHO:{icon:"📦", label:"Kho", color:"orange", limit:4}\n
    };\n
    ["KT","HS","KHO"].forEach(function(team){\n
      var items = hotByTeam[team]||[]; var meta = teamMeta[team];\n
      html += "<div class=\"hot-team-col hot-team-"+meta.color+"\">";\n
      html += "<div class=\"hot-team-h\"><span class=\"hot-team-icon\">"+meta.icon+"</span><div class=\"hot-team-meta\"><div class=\"hot-team-name\">"+esc(meta.label)+"</div><div class=\"hot-team-cnt\">"+items.length+" điểm</div></div></div>";\n
      if(items.length===0){\n
        html += "<div class=\"hot-empty\">✓ Không có vướng mắc</div>";\n
      } else {\n
        items.slice(0, meta.limit).forEach(function(h, i){\n
          var hotAttrs="";\n
          if(h.linkType && h.linkId){hotAttrs=" data-type=\""+esc(h.linkType)+"\" data-id=\""+esc(h.linkId)+"\" data-tab=\""+esc(h.linkTab||"")+"\"";}\n
          else if(h.linkTab){hotAttrs=" data-tab=\""+esc(h.linkTab)+"\" data-title=\""+esc(h.linkTitle||h.title||"Hàng")+"\"";}\n
          html += "<div class=\"hot-item\""+hotAttrs+" data-gid=\""+(h.gid||"")+"\" data-row=\""+(h.sheetRow||"")+"\">";\n
          html += "<div class=\"hot-item-head\">";\n
          html += "<span class=\"hot-item-num\">"+(i+1)+"</span>";\n
          html += "<span class=\"hot-item-title\">"+esc(h.title)+"</span>";\n
          html += "<span class=\"hot-item-badge "+(meta.color)+"\">"+esc(h.badge||"")+"</span>";\n
          html += "</div>";\n
          if(h.subtitle)html += "<div class=\"hot-item-sub\">📍 "+esc(h.subtitle)+"</div>";\n
          if(h.detail)html += "<div class=\"hot-item-detail\">"+esc(h.detail)+"</div>";\n
          if(h.cb)html += "<div class=\"hot-item-cb\">👤 <b>"+esc(h.cb)+"</b></div>";\n
          html += "</div>";\n
        });\n
        if(items.length > meta.limit){\n
          html += "<div class=\"hot-more\" data-team=\""+team+"\">+ "+(items.length-meta.limit)+" điểm nữa — click để xem tab chi tiết</div>";\n
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
      var btn = document.querySelector("#tabs button[data-view=\""+v+"\"]");\n
      if(btn) btn.click();\n
    };\n
  });\n
  $$("#view-overview .hot-item").forEach(function(el){el.onclick=function(){openInApp(el);};});\n
  $$("#view-overview .hot-more[data-team]").forEach(function(el){\n
    el.onclick=function(){\n
      var team = el.getAttribute("data-team");\n
      var view = team==="KT"?"kt":team==="HS"?"hs":team==="KHO"?"kho":null;\n
      if(view){var btn=document.querySelector("#tabs button[data-view=\""+view+"\"]");if(btn)btn.click();}\n
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
/* Render KT — v2.7 redesign: summary strip + CB filter + row coloring */
function renderKT(d){\n
  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n
  if(d.missing){$("#view-kt").innerHTML="<div class=\"error\">Chưa có tab \""+esc("Nhóm kỹ thuật")+"\". Tạo trước hoặc đổi tên cho khớp.</div>";return;}\n
  // Build filter options\n
  var cosos = Array.from(new Set(d.rows.map(function(r){return r.coso;}).filter(Boolean))).sort();\n
  var tinhs = Array.from(new Set(d.rows.map(function(r){return r.tinh;}).filter(Boolean))).sort();\n
  var khoas = Array.from(new Set(d.rows.map(function(r){return r.khoa;}).filter(Boolean))).sort();\n
  var cbs = (d.cbList || Array.from(new Set(d.rows.map(function(r){return r.cb;}).filter(Boolean))).sort());\n
  // Summary stats\n
  var stat = {dangSua:0, treDL:0, cao:0, thanhLy:0, hong:0};\n
  d.rows.forEach(function(r){\n
    var t=(r.tinh||"").toLowerCase();\n
    if(t.indexOf("thanh lý")>=0) stat.thanhLy++;\n
    if(r.ht) return;\n
    if(t.indexOf("đang sửa")>=0) stat.dangSua++;\n
    if(t==="hỏng") stat.hong++;\n
    if(r.tre) stat.treDL++;\n
    if((r.ut||"").toLowerCase().indexOf("cao")>=0) stat.cao++;\n
  });\n
  var html = "";\n
  // Summary chips\n
  html += "<div class=\"kt-summary\">";\n
  html += "<button class=\"kt-chip yellow\" data-chip=\"dangsua\"><span class=\"kt-chip-icon\">🛠</span><div><span class=\"kt-chip-num\">"+stat.dangSua+"</span><span class=\"kt-chip-lbl\">đang sửa</span></div></button>";\n
  html += "<button class=\"kt-chip red\" data-chip=\"tre\"><span class=\"kt-chip-icon\">⏰</span><div><span class=\"kt-chip-num\">"+stat.treDL+"</span><span class=\"kt-chip-lbl\">trễ deadline</span></div></button>";\n
  html += "<button class=\"kt-chip red\" data-chip=\"cao\"><span class=\"kt-chip-icon\">🔴</span><div><span class=\"kt-chip-num\">"+stat.cao+"</span><span class=\"kt-chip-lbl\">ưu tiên CAO</span></div></button>";\n
  html += "<button class=\"kt-chip gray\" data-chip=\"thanhly\"><span class=\"kt-chip-icon\">♻</span><div><span class=\"kt-chip-num\">"+stat.thanhLy+"</span><span class=\"kt-chip-lbl\">đề xuất thanh lý</span></div></button>";\n
  html += "<button class=\"kt-chip\" data-chip=\"reset\" title=\"Reset filter\">↻ Tất cả</button>";\n
  html += "</div>";\n
  // v2.7.7: View toggle + Group-by — đồng bộ với Tab Hồ sơ\n
  html += "<div class=\"hs-toolbar\">";\n
  html += "<div class=\"hs-view-toggle\">";\n
  html += "<button class=\"hs-vbtn active\" data-view=\"table\">📋 Bảng đầy đủ</button>";\n
  html += "<button class=\"hs-vbtn\" data-view=\"kanban\">🗂 Pipeline</button>";\n
  html += "</div>";\n
  html += "<div class=\"hs-groupby\"><label>Group by:</label>";\n
  html += "<select id=\"kt-group\"><option value=\"tinh\">📋 Tình trạng</option><option value=\"ut\">🔴 Cấp độ ưu tiên</option><option value=\"khoa\">🏥 Khoa</option><option value=\"coso\">🏢 Cơ sở</option><option value=\"cb\">👤 CB phụ trách</option></select>";\n
  html += "</div>";\n
  html += "</div>";\n
  // Filter row\n
  html += "<div class=\"kt-filters\">";\n
  html += "<input id=\"f-search\" placeholder=\"🔍 Tìm tên máy / khoa / chi tiết / CB…\">";\n
  html += "<select id=\"f-coso\"><option value=\"\">Tất cả cơ sở</option>"+cosos.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"f-khoa\"><option value=\"\">Tất cả khoa</option>"+khoas.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"f-cb\"><option value=\"\">Tất cả CB</option>"+cbs.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"f-tinh\"><option value=\"\">Tất cả trạng thái</option>"+tinhs.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"f-ut\"><option value=\"\">Mọi cấp độ</option><option>CAO</option><option>Bình thường</option></select>";\n
  html += "<label class=\"toggle\"><input type=\"checkbox\" id=\"f-hide-thanhly\" checked> Ẩn thanh lý</label>";\n
  html += "<label class=\"toggle\"><input type=\"checkbox\" id=\"f-hide-done\"> Ẩn hoàn thành</label>";\n
  html += "<span class=\"badge\" id=\"kt-count\">"+d.rows.length+" máy</span>";\n
  html += "</div>";\n
  html += "<div id=\"kt-content\"></div>";\n
  $("#view-kt").innerHTML = html;\n
  var STATE_KT = {view:"table", groupBy:"tinh"};\n
  function ktHotBadge(r, isCAO){\n
    if(isCAO && r.tre) return "<span class=\"hot-badge hb-critical\" title=\"CAO + trễ\">🔥 HOT</span>";\n
    if(r.tre) return "<span class=\"hot-badge hb-tre\" title=\"Trễ deadline\">⏰</span>";\n
    if(isCAO) return "<span class=\"hot-badge hb-cao\">CAO</span>";\n
    return "";\n
  }\n
  function renderKTCardInner(r){\n
    var isCAO = (r.ut||"").toLowerCase().indexOf("cao")>=0;\n
    var cardCls = "kanban-card";\n
    if(isCAO && r.tre) cardCls += " card-critical";\n
    else if(isCAO) cardCls += " card-cao";\n
    else if(r.tre) cardCls += " card-tre";\n
    if(r.ht) cardCls += " row-done";\n
    var pillT = (r.tinh||"").toLowerCase().indexOf("thanh lý")>=0?"gray":(r.tinh||"").toLowerCase().indexOf("đang sửa")>=0?"yellow":(r.tinh||"").toLowerCase().indexOf("bảo trì")>=0?"blue":(r.tinh||"").toLowerCase()==="hỏng"?"red":"gray";\n
    var hot = ktHotBadge(r, isCAO);\n
    var h = "<div class=\""+cardCls+"\" data-type=\"KT\" data-id=\""+esc(r.ten)+"\" data-tab=\""+esc(TAB_NAME.KT)+"\" data-gid=\""+r.gid+"\" data-row=\""+r.idx+"\">";\n
    h += "<div class=\"ma\">"+hot+esc(r.ten)+(r.ht?" <span class=\"ht-tick\" style=\"font-size:11px\">✓</span>":"")+"</div>";\n
    if(r.info)h += "<div class=\"nd\" style=\"font-size:11px;color:#9CA3AF\">"+esc(r.info)+"</div>";\n
    h += "<div class=\"meta\" style=\"margin-top:6px\">";\n
    h += "<span title=\""+esc(r.khoa+(r.coso?" · "+r.coso:""))+"\">📍 "+esc((r.khoa||"").substring(0,18))+(r.khoa.length>18?"…":"")+"</span>";\n
    h += "<span class=\"pill "+pillT+"\" style=\"font-size:10px;padding:1px 6px\">"+esc(r.tinh||"-")+"</span>";\n
    h += "</div>";\n
    if(r.chitiet)h += "<div class=\"kanban-vuong\" style=\"color:#D1D5DB;font-style:normal\">"+esc(String(r.chitiet).substring(0,90))+(r.chitiet.length>90?"…":"")+"</div>";\n
    if(r.cb)h += "<div class=\"kanban-cb\">👤 "+esc(r.cb)+"</div>";\n
    if(r.dl)h += "<div class=\"meta\" style=\"margin-top:5px;font-size:11px\"><span style=\"color:#9CA3AF\">⏱ "+esc(r.dl)+"</span>"+(r.tre?" <span class=\"tre-badge\">Trễ "+r.tre+"n</span>":"")+"</div>";\n
    if(r.vuong)h += "<div class=\"kanban-vuong\">⚠ "+esc(String(r.vuong).substring(0,80))+(r.vuong.length>80?"…":"")+"</div>";\n
    h += "</div>";\n
    return h;\n
  }\n
  function renderKTKanban(rows){\n
    if(!rows.length) return "<div class=\"empty\">Không có máy nào khớp filter.</div>";\n
    var groupBy = STATE_KT.groupBy || "tinh";\n
    var groupLabel = {tinh:"Tình trạng", ut:"Cấp độ ưu tiên", khoa:"Khoa", coso:"Cơ sở", cb:"CB phụ trách"}[groupBy] || "Tình trạng";\n
    var buckets = {};\n
    rows.forEach(function(r){\n
      var k;\n
      if(groupBy==="ut") k = ((r.ut||"").toLowerCase().indexOf("cao")>=0)?"🔴 Ưu tiên CAO":"Bình thường";\n
      else if(groupBy==="khoa") k = r.khoa || "(Chưa rõ khoa)";\n
      else if(groupBy==="coso") k = r.coso || "(Chưa rõ cơ sở)";\n
      else if(groupBy==="cb") k = r.cb || "(Chưa giao)";\n
      else k = r.tinh || "(Chưa phân loại)";\n
      if(!buckets[k]) buckets[k]=[];\n
      buckets[k].push(r);\n
    });\n
    var pipe = Object.keys(buckets).map(function(k){return {name:k, count:buckets[k].length, items:buckets[k]};}).sort(function(a,b){return b.count-a.count;});\n
    if(!pipe.length) return "<div class=\"empty\">Không có máy nào khớp filter.</div>";\n
    if(pipe.length===1){\n
      var col = pipe[0];\n
      var hg = "<div class=\"hs-grid-banner\">📋 <b>"+esc(col.name)+"</b> <span class=\"hs-grid-cnt\">"+col.count+" máy</span> <span class=\"hs-grid-hint\">— chỉ có 1 "+esc(groupLabel.toLowerCase())+", hiển thị grid để dễ scan. Đổi <b>Group by</b> để thấy cột phân nhóm khác.</span></div>";\n
      hg += "<div class=\"hs-grid\">";\n
      col.items.forEach(function(it){ hg += renderKTCardInner(it); });\n
      hg += "</div>";\n
      return hg;\n
    }\n
    var h = "<div class=\"pipeline\" data-groupby=\""+groupBy+"\">";\n
    pipe.forEach(function(col){\n
      h += "<div class=\"col\"><div class=\"col-head\">"+esc(col.name)+"<span class=\"col-count\">"+col.count+"</span></div><div class=\"col-body\">";\n
      col.items.forEach(function(it){ h += renderKTCardInner(it); });\n
      h += "</div></div>";\n
    });\n
    h += "</div>";\n
    return h;\n
  }\n
  function renderKTTable(rows){\n
    if(!rows.length) return "<div class=\"empty\">Không có máy nào khớp filter.</div>";\n
    var h = "<div class=\"tbl-wrap\"><table class=\"tbl tbl-kt\" id=\"kt-table\">";\n
    h += "<thead><tr><th class=\"col-ten\">Tên máy</th><th class=\"col-cap\">Cấp độ</th><th class=\"col-ht\">HT</th><th>Khoa · Cơ sở</th><th>Tình trạng</th><th>Chi tiết</th><th>CB</th><th>Bước</th><th>Deadline</th><th>Vướng mắc</th></tr></thead><tbody>";\n
    rows.forEach(function(r){\n
      var pillT = r.tinh.toLowerCase().indexOf("thanh lý")>=0?"gray":r.tinh.toLowerCase().indexOf("đang sửa")>=0?"yellow":r.tinh.toLowerCase().indexOf("bảo trì")>=0?"blue":r.tinh.toLowerCase()==="hỏng"?"red":"gray";\n
      var isCAO = r.ut.toLowerCase().indexOf("cao")>=0;\n
      var pillU = isCAO?"red":"gray";\n
      var rowCls = r.ht?"row-done":"";\n
      var dl = r.dl + (r.tre?" <span class=\"tre-badge\">Trễ "+r.tre+"n</span>":"");\n
      var khoaCoso = esc(r.khoa)+(r.coso?"<div style=\"font-size:10px;color:#6B7280;margin-top:2px\">"+esc(r.coso)+"</div>":"");\n
      var hot = ktHotBadge(r, isCAO);\n
      h += "<tr class=\""+rowCls+"\" data-type=\"KT\" data-id=\""+esc(r.ten)+"\" data-tab=\""+esc(TAB_NAME.KT)+"\" data-gid=\""+r.gid+"\" data-row=\""+r.idx+"\">";\n
      h += "<td class=\"col-ten\">"+hot+"<b>"+esc(r.ten)+"</b><div style=\"font-size:11px;color:#6B7280;\">"+esc(r.info)+"</div></td>";\n
      h += "<td class=\"col-cap\"><span class=\"pill "+pillU+"\">"+esc(r.ut||"-")+"</span></td>";\n
      h += "<td class=\"col-ht\">"+(r.ht?"<span class=\"ht-tick\">✓</span>":"<span class=\"ht-pending\">⏳</span>")+"</td>";\n
      h += "<td>"+khoaCoso+"</td>";\n
      h += "<td><span class=\"pill "+pillT+"\">"+esc(r.tinh)+"</span></td>";\n
      h += "<td style=\"max-width:260px;font-size:12px;\">"+esc(r.chitiet)+"</td>";\n
      h += "<td style=\"font-size:12px;\">"+esc(r.cb)+"</td>";\n
      h += "<td style=\"max-width:220px;font-size:11px;color:#9CA3AF;\">"+esc(r.buoc)+"</td>";\n
      h += "<td style=\"font-size:11px;\">"+dl+"</td>";\n
      h += "<td style=\"max-width:200px;font-size:11px;color:#FCA5A5;\">"+esc(r.vuong)+"</td>";\n
      h += "</tr>";\n
    });\n
    h += "</tbody></table></div>";\n
    return h;\n
  }\n
  function applyKT(){\n
    var q=$("#f-search").value.toLowerCase();\n
    var cs=$("#f-coso").value, kh=$("#f-khoa").value, cb=$("#f-cb").value, ti=$("#f-tinh").value, ut=$("#f-ut").value;\n
    var hideTL=$("#f-hide-thanhly").checked, hideDone=$("#f-hide-done").checked;\n
    var rows=d.rows.filter(function(r){\n
      var isTL = r.tinh && r.tinh.toLowerCase().indexOf("thanh lý")>=0;\n
      if(hideTL && isTL) return false;\n
      if(hideDone && r.ht && !isTL) return false;\n
      if(cs && r.coso!==cs) return false;\n
      if(kh && r.khoa!==kh) return false;\n
      if(cb && r.cb!==cb && r.cbhs!==cb) return false;\n
      if(ti && r.tinh!==ti) return false;\n
      if(ut==="CAO" && r.ut.toLowerCase().indexOf("cao")<0) return false;\n
      if(ut==="Bình thường" && r.ut.toLowerCase().indexOf("cao")>=0) return false;\n
      if(q){var hay=(r.ten+" "+r.khoa+" "+r.chitiet+" "+r.cb+" "+r.cbhs+" "+r.tinh+" "+r.buoc+" "+r.vuong).toLowerCase();if(hay.indexOf(q)<0)return false;}\n
      return true;\n
    });\n
    rows.sort(function(a,b){\n
      var aCAO = a.ut.toLowerCase().indexOf("cao")>=0?0:1;\n
      var bCAO = b.ut.toLowerCase().indexOf("cao")>=0?0:1;\n
      if(aCAO !== bCAO) return aCAO - bCAO;\n
      var aTre = a.tre?0:1, bTre = b.tre?0:1;\n
      if(aTre !== bTre) return aTre - bTre;\n
      return (a.ht?1:0)-(b.ht?1:0);\n
    });\n
    if(STATE_KT.view==="kanban") $("#kt-content").innerHTML = renderKTKanban(rows);\n
    else $("#kt-content").innerHTML = renderKTTable(rows);\n
    $("#kt-count").textContent = rows.length+" / "+d.rows.length+" máy";\n
    $$("#kt-content .kanban-card, #kt-content tbody tr").forEach(function(el){el.onclick=function(){openInApp(el);};});\n
  }\n
  // Bind chip clicks\n
  $$("#view-kt .kt-chip[data-chip]").forEach(function(el){\n
    el.onclick=function(){\n
      var chip = el.getAttribute("data-chip");\n
      $$("#view-kt .kt-chip").forEach(function(x){x.classList.remove("active");});\n
      if(chip!=="reset") el.classList.add("active");\n
      $("#f-search").value=""; $("#f-coso").value=""; $("#f-khoa").value=""; $("#f-cb").value=""; $("#f-tinh").value=""; $("#f-ut").value="";\n
      $("#f-hide-thanhly").checked=true; $("#f-hide-done").checked=false;\n
      if(chip==="dangsua"){ var opt=Array.from($("#f-tinh").options).find(function(o){return o.value.toLowerCase().indexOf("đang sửa")>=0;}); if(opt) $("#f-tinh").value=opt.value; }\n
      else if(chip==="cao"){ $("#f-ut").value="CAO"; }\n
      else if(chip==="thanhly"){ $("#f-hide-thanhly").checked=false; var opt2=Array.from($("#f-tinh").options).find(function(o){return o.value.toLowerCase().indexOf("thanh lý")>=0;}); if(opt2) $("#f-tinh").value=opt2.value; }\n
      applyKT();\n
      if(chip==="tre"){\n
        $$("#kt-content .kanban-card, #kt-content tbody tr").forEach(function(el){\n
          var hasHot = el.querySelector(".hot-badge.hb-critical, .hot-badge.hb-tre");\n
          if(!hasHot) el.style.display="none";\n
        });\n
      }\n
    };\n
  });\n
  // Bind view toggle\n
  $$("#view-kt .hs-vbtn").forEach(function(b){\n
    b.onclick=function(){\n
      $$("#view-kt .hs-vbtn").forEach(function(x){x.classList.remove("active");});\n
      b.classList.add("active");\n
      STATE_KT.view = b.getAttribute("data-view");\n
      applyKT();\n
    };\n
  });\n
  // Bind groupBy\n
  var ktSel = $("#kt-group");\n
  if(ktSel) ktSel.onchange = function(){ STATE_KT.groupBy = this.value; applyKT(); };\n
  ["#f-search","#f-coso","#f-khoa","#f-cb","#f-tinh","#f-ut","#f-hide-thanhly","#f-hide-done"].forEach(function(s){var el=$(s);if(el)el.oninput=el.onchange=applyKT;});\n
  applyKT();\n
}\n
/* Render HS Pipeline */
function renderHS(d){\n
  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n
  if(d.missing){$("#view-hs").innerHTML="<div class=\"error\">Chưa có tab \""+esc("Nhóm Hồ sơ")+"\".</div>";return;}\n
  // Build filter options\n
  var cosos = Array.from(new Set(d.rows.map(function(r){return r.coso;}).filter(Boolean))).sort();\n
  var khoas = Array.from(new Set(d.rows.map(function(r){return r.khoa;}).filter(Boolean))).sort();\n
  var hinhs = Array.from(new Set(d.rows.map(function(r){return r.hinh;}).filter(Boolean))).sort();\n
  var tts = Array.from(new Set(d.rows.map(function(r){return r.tt;}).filter(Boolean))).sort();\n
  var cbs = (d.cbList || Array.from(new Set(d.rows.map(function(r){return r.cb;}).filter(Boolean))).sort());\n
  // Summary stats\n
  var stat = {total:d.rows.length, done:0, vuong:0, treDL:0, cao:0, tongGT:0};\n
  d.rows.forEach(function(r){\n
    if(r.ht) stat.done++;\n
    if(r.gt) stat.tongGT += r.gt;\n
    if(r.ht) return;\n
    if(r.vuong) stat.vuong++;\n
    if(r.tre) stat.treDL++;\n
    if((r.ut||"").toLowerCase().indexOf("cao")>=0) stat.cao++;\n
  });\n
  var donePct = stat.total ? Math.round(stat.done/stat.total*100) : 0;\n
  var html = "";\n
  html += "<div class=\"kt-summary\">";\n
  html += "<button class=\"kt-chip green\" data-chip=\"done\" title=\"Tỉ lệ hoàn thành\"><span class=\"kt-chip-icon\">✓</span><div><span class=\"kt-chip-num\">"+stat.done+"<small style=\"color:#9CA3AF;font-weight:400;font-size:14px\"> / "+stat.total+"</small></span><span class=\"kt-chip-lbl\">đã hoàn thành ("+donePct+"%)</span></div></button>";\n
  html += "<button class=\"kt-chip yellow\" data-chip=\"vuong\"><span class=\"kt-chip-icon\">🚧</span><div><span class=\"kt-chip-num\">"+stat.vuong+"</span><span class=\"kt-chip-lbl\">vướng mắc</span></div></button>";\n
  html += "<button class=\"kt-chip red\" data-chip=\"tre\"><span class=\"kt-chip-icon\">⏰</span><div><span class=\"kt-chip-num\">"+stat.treDL+"</span><span class=\"kt-chip-lbl\">trễ deadline</span></div></button>";\n
  html += "<button class=\"kt-chip red\" data-chip=\"cao\"><span class=\"kt-chip-icon\">🔴</span><div><span class=\"kt-chip-num\">"+stat.cao+"</span><span class=\"kt-chip-lbl\">ưu tiên CAO</span></div></button>";\n
  html += "<button class=\"kt-chip\" data-chip=\"reset\" title=\"Reset filter\">↻ Tất cả</button>";\n
  if(stat.tongGT){html += "<div class=\"hs-budget\">💰 Tổng giá trị: <b>"+fmtVnd(stat.tongGT)+"</b></div>";}\n
  html += "</div>";\n
  html += "<div class=\"hs-toolbar\">";\n
  html += "<div class=\"hs-view-toggle\">";\n
  html += "<button class=\"hs-vbtn active\" data-view=\"kanban\">🗂 Pipeline</button>";\n
  html += "<button class=\"hs-vbtn\" data-view=\"table\">📋 Bảng đầy đủ</button>";\n
  html += "</div>";\n
  html += "<div class=\"hs-groupby\"><label>Group by:</label>";\n
  html += "<select id=\"hs-group\"><option value=\"tt\">📋 Trạng thái</option><option value=\"hinh\">📊 Hình thức LCNT</option><option value=\"ut\">🔴 Cấp độ ưu tiên</option><option value=\"cb\">👤 CB phụ trách</option><option value=\"khoa\">🏥 Khoa</option></select>";\n
  html += "</div>";\n
  html += "</div>";\n
  html += "<div class=\"kt-filters\">";\n
  html += "<input id=\"hs-search\" placeholder=\"🔍 Tìm mã / nội dung / khoa / CB / vướng mắc…\">";\n
  html += "<select id=\"hs-coso\"><option value=\"\">Tất cả cơ sở</option>"+cosos.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"hs-khoa\"><option value=\"\">Tất cả khoa</option>"+khoas.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"hs-cb\"><option value=\"\">Tất cả CB</option>"+cbs.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"hs-tt\"><option value=\"\">Tất cả trạng thái</option>"+tts.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"hs-hinh\"><option value=\"\">Mọi hình thức</option>"+hinhs.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"hs-ut\"><option value=\"\">Mọi cấp độ</option><option>CAO</option><option>Bình thường</option></select>";\n
  html += "<label class=\"toggle\"><input type=\"checkbox\" id=\"hs-hide-done\"> Ẩn hoàn thành</label>";\n
  html += "<span class=\"badge\" id=\"hs-count\">"+d.rows.length+" gói</span>";\n
  html += "</div>";\n
  html += "<div id=\"hs-content\"></div>";\n
  $("#view-hs").innerHTML = html;\n
  var STATE_HS = {view: "kanban"};\n
  function hsHotBadge(it, isCAO){\n
    if(isCAO && it.tre) return "<span class=\"hot-badge hb-critical\" title=\"CAO + trễ\">🔥 HOT</span>";\n
    if(it.tre) return "<span class=\"hot-badge hb-tre\" title=\"Trễ deadline\">⏰</span>";\n
    if(isCAO) return "<span class=\"hot-badge hb-cao\">CAO</span>";\n
    return "";\n
  }\n
  function renderHSCardInner(it){\n
    var isCAO = (it.ut||"").toLowerCase().indexOf("cao")>=0;\n
    var cardCls = "kanban-card";\n
    if(isCAO && it.tre) cardCls += " card-critical";\n
    else if(isCAO) cardCls += " card-cao";\n
    else if(it.tre) cardCls += " card-tre";\n
    var h = "<div class=\""+cardCls+"\" data-type=\"HS\" data-id=\""+esc(it.ma||it.nd)+"\" data-tab=\""+esc(TAB_NAME.HS)+"\" data-gid=\""+it.gid+"\" data-row=\""+it.idx+"\">";\n
    var hot = hsHotBadge(it, isCAO);\n
    h += "<div class=\"ma\">"+hot+esc(it.ma||"")+"</div>";\n
    h += "<div class=\"nd\">"+esc(it.nd.length>120?it.nd.substring(0,120)+"…":it.nd)+"</div>";\n
    h += "<div class=\"meta\">";\n
    h += "<span title=\""+esc(it.khoa+(it.coso?" · "+it.coso:""))+"\">📍 "+esc((it.khoa||"").substring(0,18))+(it.khoa.length>18?"…":"")+"</span>";\n
    if(it.gt)h += "<span style=\"color:#60A5FA;font-size:11px\">"+esc(fmtVnd(it.gt))+"</span>";\n
    h += "</div>";\n
    if(it.cb)h += "<div class=\"kanban-cb\">👤 "+esc(it.cb)+"</div>";\n
    if(it.vuong)h += "<div class=\"kanban-vuong\">⚠ "+esc(String(it.vuong).substring(0,80))+(it.vuong.length>80?"…":"")+"</div>";\n
    if(it.pct!==null)h += "<div class=\"progress\"><div class=\"progress-fill\" style=\"width:"+it.pct+"%\"></div></div>";\n
    h += "</div>";\n
    return h;\n
  }\n
  function renderPipeline(rows){\n
    if(!rows.length) return "<div class=\"empty\">Không có gói thầu nào khớp filter.</div>";\n
    var groupBy = STATE_HS.groupBy || "tt";\n
    var groupLabel = {tt:"Trạng thái", hinh:"Hình thức LCNT", ut:"Cấp độ ưu tiên", cb:"CB phụ trách", khoa:"Khoa"}[groupBy] || "Trạng thái";\n
    var buckets = {};\n
    rows.forEach(function(r){\n
      if(r.ht) return;\n
      var k;\n
      if(groupBy==="hinh") k = r.hinh || "(Chưa rõ hình thức)";\n
      else if(groupBy==="ut") k = ((r.ut||"").toLowerCase().indexOf("cao")>=0) ? "🔴 Ưu tiên CAO" : "Bình thường";\n
      else if(groupBy==="cb") k = r.cb || "(Chưa giao)";\n
      else if(groupBy==="khoa") k = r.khoa || "(Chưa rõ khoa)";\n
      else k = r.tt || "(Chưa phân loại)";\n
      if(!buckets[k]) buckets[k]=[];\n
      buckets[k].push(r);\n
    });\n
    var pipe = Object.keys(buckets).map(function(k){return {name:k, count:buckets[k].length, items:buckets[k]};}).sort(function(a,b){return b.count-a.count;});\n
    if(!pipe.length) return "<div class=\"empty\">Tất cả gói thầu trong filter đã hoàn thành ✓</div>";\n
    // v2.7.6: nếu chỉ có 1 nhóm → switch sang grid 3 cột (Kanban 1 cột thì vô nghĩa)\n
    if(pipe.length===1){\n
      var col = pipe[0];\n
      var hg = "<div class=\"hs-grid-banner\">📋 <b>"+esc(col.name)+"</b> <span class=\"hs-grid-cnt\">"+col.count+" gói</span> <span class=\"hs-grid-hint\">— chỉ có 1 "+esc(groupLabel.toLowerCase())+", hiển thị grid để dễ scan. Đổi <b>Group by</b> để thấy cột phân nhóm khác.</span></div>";\n
      hg += "<div class=\"hs-grid\">";\n
      col.items.forEach(function(it){ hg += renderHSCardInner(it); });\n
      hg += "</div>";\n
      return hg;\n
    }\n
    var h = "<div class=\"pipeline\" data-groupby=\""+groupBy+"\">";\n
    pipe.forEach(function(col){\n
      h += "<div class=\"col\"><div class=\"col-head\">"+esc(col.name)+"<span class=\"col-count\">"+col.count+"</span></div><div class=\"col-body\">";\n
      col.items.forEach(function(it){ h += renderHSCardInner(it); });\n
      h += "</div></div>";\n
    });\n
    h += "</div>";\n
    return h;\n
  }\n
  function renderTable(rows){\n
    if(!rows.length) return "<div class=\"empty\">Không có gói thầu nào khớp filter.</div>";\n
    rows = rows.slice().sort(function(a,b){\n
      var aCAO=(a.ut||"").toLowerCase().indexOf("cao")>=0?0:1;\n
      var bCAO=(b.ut||"").toLowerCase().indexOf("cao")>=0?0:1;\n
      if(aCAO!==bCAO) return aCAO-bCAO;\n
      var aTre=a.tre?0:1, bTre=b.tre?0:1;\n
      if(aTre!==bTre) return aTre-bTre;\n
      return (a.ht?1:0)-(b.ht?1:0);\n
    });\n
    var h = "<div class=\"tbl-wrap\"><table class=\"tbl tbl-kt\"><thead><tr><th class=\"col-ten\">Mã HS · Nội dung</th><th class=\"col-cap\">Cấp độ</th><th class=\"col-ht\">HT</th><th>Khoa · Cơ sở</th><th>Trạng thái</th><th>%</th><th>Giá trị</th><th>CB</th><th>Bước</th><th>Deadline</th><th>Vướng mắc</th></tr></thead><tbody>";\n
    rows.forEach(function(r){\n
      var isCAO=(r.ut||"").toLowerCase().indexOf("cao")>=0;\n
      var pillU=isCAO?"red":"gray";\n
      var pillT=(r.tt||"").indexOf("Đã trình")>=0?"green":(r.tt||"").indexOf("thẩm định")>=0?"blue":(r.tt||"").indexOf("chuẩn bị")>=0?"yellow":"gray";\n
      var rowCls=r.ht?"row-done":"";\n
      var dl=(r.dl||"")+(r.tre?" <span class=\"tre-badge\">Trễ "+r.tre+"n</span>":"");\n
      var khoaCoso=esc(r.khoa)+(r.coso?"<div style=\"font-size:10px;color:#6B7280;margin-top:2px\">"+esc(r.coso)+"</div>":"");\n
      var pct=r.pct!==null?(r.pct+"%"):"-";\n
      var gt=r.gt?fmtVnd(r.gt):"-";\n
      var hot=hsHotBadge(r, isCAO);\n
      h += "<tr class=\""+rowCls+"\" data-type=\"HS\" data-id=\""+esc(r.ma||r.nd)+"\" data-tab=\""+esc(TAB_NAME.HS)+"\" data-gid=\""+r.gid+"\" data-row=\""+r.idx+"\">";\n
      h += "<td class=\"col-ten\">"+hot;\n
      if(r.ma)h += "<span style=\"font-size:11px;color:#60A5FA;font-weight:700;margin-right:6px\">"+esc(r.ma)+"</span>";\n
      h += "<div style=\"font-size:12px;line-height:1.4;margin-top:2px\">"+esc(r.nd.length>120?r.nd.substring(0,120)+"…":r.nd)+"</div></td>";\n
      h += "<td class=\"col-cap\"><span class=\"pill "+pillU+"\">"+esc(r.ut||"-")+"</span></td>";\n
      h += "<td class=\"col-ht\">"+(r.ht?"<span class=\"ht-tick\">✓</span>":"<span class=\"ht-pending\">⏳</span>")+"</td>";\n
      h += "<td>"+khoaCoso+"</td>";\n
      h += "<td><span class=\"pill "+pillT+"\">"+esc(r.tt||"-")+"</span></td>";\n
      h += "<td class=\"num\">"+pct+"</td>";\n
      h += "<td style=\"font-size:11px;color:#60A5FA\">"+gt+"</td>";\n
      h += "<td style=\"font-size:12px\">"+esc(r.cb||"-")+"</td>";\n
      h += "<td style=\"max-width:220px;font-size:11px;color:#9CA3AF\">"+esc(r.buoc)+"</td>";\n
      h += "<td style=\"font-size:11px\">"+dl+"</td>";\n
      h += "<td style=\"max-width:200px;font-size:11px;color:#FCA5A5\">"+esc(r.vuong)+"</td></tr>";\n
    });\n
    h += "</tbody></table></div>";\n
    return h;\n
  }\n
  function applyHS(){\n
    var q=$("#hs-search").value.toLowerCase();\n
    var cs=$("#hs-coso").value, kh=$("#hs-khoa").value, cb=$("#hs-cb").value;\n
    var tt=$("#hs-tt").value, hinh=$("#hs-hinh").value, ut=$("#hs-ut").value;\n
    var hideDone=$("#hs-hide-done").checked;\n
    var rows=d.rows.filter(function(r){\n
      if(hideDone && r.ht) return false;\n
      if(cs && r.coso!==cs) return false;\n
      if(kh && r.khoa!==kh) return false;\n
      if(cb && r.cb!==cb && r.cbph!==cb) return false;\n
      if(tt && r.tt!==tt) return false;\n
      if(hinh && r.hinh!==hinh) return false;\n
      if(ut==="CAO" && (r.ut||"").toLowerCase().indexOf("cao")<0) return false;\n
      if(ut==="Bình thường" && (r.ut||"").toLowerCase().indexOf("cao")>=0) return false;\n
      if(q){var hay=((r.ma||"")+" "+(r.nd||"")+" "+(r.khoa||"")+" "+(r.cb||"")+" "+(r.vuong||"")+" "+(r.buoc||"")).toLowerCase();if(hay.indexOf(q)<0)return false;}\n
      return true;\n
    });\n
    if(STATE_HS.view==="kanban") $("#hs-content").innerHTML = renderPipeline(rows);\n
    else $("#hs-content").innerHTML = renderTable(rows);\n
    $("#hs-count").textContent = rows.length+" / "+d.rows.length+" gói";\n
    $$("#hs-content .kanban-card, #hs-content tbody tr").forEach(function(el){el.onclick=function(){openInApp(el);};});\n
  }\n
  $$("#view-hs .kt-chip[data-chip]").forEach(function(el){\n
    el.onclick=function(){\n
      var chip = el.getAttribute("data-chip");\n
      $$("#view-hs .kt-chip").forEach(function(x){x.classList.remove("active");});\n
      if(chip!=="reset") el.classList.add("active");\n
      $("#hs-search").value=""; $("#hs-coso").value=""; $("#hs-khoa").value=""; $("#hs-cb").value="";\n
      $("#hs-tt").value=""; $("#hs-hinh").value=""; $("#hs-ut").value="";\n
      $("#hs-hide-done").checked=false;\n
      if(chip==="cao") $("#hs-ut").value="CAO";\n
      else if(chip==="vuong" || chip==="tre") $("#hs-hide-done").checked=true;\n
      applyHS();\n
      if(chip==="vuong"){\n
        $$("#hs-content .kanban-card, #hs-content tbody tr").forEach(function(el){\n
          var hasV = el.querySelector(".kanban-vuong") || (el.tagName==="TR" && el.querySelectorAll("td")[10] && el.querySelectorAll("td")[10].textContent.trim());\n
          if(!hasV) el.style.display="none";\n
        });\n
      } else if(chip==="tre"){\n
        $$("#hs-content .kanban-card, #hs-content tbody tr").forEach(function(el){\n
          var hasHot = el.querySelector(".hot-badge.hb-critical, .hot-badge.hb-tre");\n
          if(!hasHot) el.style.display="none";\n
        });\n
      }\n
    };\n
  });\n
  $$("#view-hs .hs-vbtn").forEach(function(b){\n
    b.onclick=function(){\n
      $$("#view-hs .hs-vbtn").forEach(function(x){x.classList.remove("active");});\n
      b.classList.add("active");\n
      STATE_HS.view = b.getAttribute("data-view");\n
      applyHS();\n
    };\n
  });\n
  // v2.7.6: groupBy selector\n
  var hgSel = $("#hs-group");\n
  if(hgSel) hgSel.onchange = function(){ STATE_HS.groupBy = this.value; applyHS(); };\n
  ["#hs-search","#hs-coso","#hs-khoa","#hs-cb","#hs-tt","#hs-hinh","#hs-ut","#hs-hide-done"].forEach(function(s){var el=$(s);if(el)el.oninput=el.onchange=applyHS;});\n
  applyHS();\n
}\n
/* Render VTTH */
function renderVT(d){\n
  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n
  if(d.missing){$("#view-vt").innerHTML="<div class=\"error\">Chưa có tab \""+esc("Nhóm vật tư tiêu hao- hóa chất")+"\".</div>";return;}\n
  if(d.rows.length===0){$("#view-vt").innerHTML = "<div class=\"empty\">Không có task vật tư / hóa chất nào.</div>";return;}\n
  // Build filter options\n
  var cosos = Array.from(new Set(d.rows.map(function(r){return r.coso;}).filter(Boolean))).sort();\n
  var khoas = Array.from(new Set(d.rows.map(function(r){return r.khoa;}).filter(Boolean))).sort();\n
  var loais = Array.from(new Set(d.rows.map(function(r){return r.loai;}).filter(Boolean))).sort();\n
  var tts = Array.from(new Set(d.rows.map(function(r){return r.tt;}).filter(Boolean))).sort();\n
  var cbs = (d.cbList || Array.from(new Set(d.rows.map(function(r){return r.cb;}).filter(Boolean))).sort());\n
  // Summary stats\n
  var stat = {total:d.rows.length, done:0, vuong:0, treDL:0, cao:0};\n
  d.rows.forEach(function(r){\n
    if(r.ht){ stat.done++; return; }\n
    if(r.vuong) stat.vuong++;\n
    if(r.tre) stat.treDL++;\n
    if((r.ut||"").toLowerCase().indexOf("cao")>=0) stat.cao++;\n
  });\n
  var donePct = stat.total ? Math.round(stat.done/stat.total*100) : 0;\n
  var html = "";\n
  // Summary chips\n
  html += "<div class=\"kt-summary\">";\n
  html += "<button class=\"kt-chip green\" data-chip=\"done\" title=\"Tỉ lệ hoàn thành\"><span class=\"kt-chip-icon\">✓</span><div><span class=\"kt-chip-num\">"+stat.done+"<small style=\"color:#9CA3AF;font-weight:400;font-size:14px\"> / "+stat.total+"</small></span><span class=\"kt-chip-lbl\">đã hoàn thành ("+donePct+"%)</span></div></button>";\n
  html += "<button class=\"kt-chip yellow\" data-chip=\"vuong\"><span class=\"kt-chip-icon\">🚧</span><div><span class=\"kt-chip-num\">"+stat.vuong+"</span><span class=\"kt-chip-lbl\">vướng mắc</span></div></button>";\n
  html += "<button class=\"kt-chip red\" data-chip=\"tre\"><span class=\"kt-chip-icon\">⏰</span><div><span class=\"kt-chip-num\">"+stat.treDL+"</span><span class=\"kt-chip-lbl\">trễ deadline</span></div></button>";\n
  html += "<button class=\"kt-chip red\" data-chip=\"cao\"><span class=\"kt-chip-icon\">🔴</span><div><span class=\"kt-chip-num\">"+stat.cao+"</span><span class=\"kt-chip-lbl\">ưu tiên CAO</span></div></button>";\n
  html += "<button class=\"kt-chip\" data-chip=\"reset\" title=\"Reset filter\">↻ Tất cả</button>";\n
  html += "</div>";\n
  // View toggle + Group-by\n
  html += "<div class=\"hs-toolbar\">";\n
  html += "<div class=\"hs-view-toggle\">";\n
  html += "<button class=\"hs-vbtn active\" data-view=\"table\">📋 Bảng đầy đủ</button>";\n
  html += "<button class=\"hs-vbtn\" data-view=\"kanban\">🗂 Pipeline</button>";\n
  html += "</div>";\n
  html += "<div class=\"hs-groupby\"><label>Group by:</label>";\n
  html += "<select id=\"vt-group\"><option value=\"tt\">📋 Trạng thái</option><option value=\"loai\">🧪 Loại nhóm</option><option value=\"ut\">🔴 Cấp độ ưu tiên</option><option value=\"khoa\">🏥 Khoa</option><option value=\"coso\">🏢 Cơ sở</option><option value=\"cb\">👤 CB phụ trách</option></select>";\n
  html += "</div>";\n
  html += "</div>";\n
  // Filter row\n
  html += "<div class=\"kt-filters\">";\n
  html += "<input id=\"vt-search\" placeholder=\"🔍 Tìm loại / khoa / CB / vướng mắc / bước…\">";\n
  html += "<select id=\"vt-coso\"><option value=\"\">Tất cả cơ sở</option>"+cosos.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"vt-khoa\"><option value=\"\">Tất cả khoa</option>"+khoas.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"vt-cb\"><option value=\"\">Tất cả CB</option>"+cbs.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"vt-tt\"><option value=\"\">Tất cả trạng thái</option>"+tts.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"vt-loai\"><option value=\"\">Mọi loại</option>"+loais.map(function(c){return "<option>"+esc(c)+"</option>";}).join("")+"</select>";\n
  html += "<select id=\"vt-ut\"><option value=\"\">Mọi cấp độ</option><option>CAO</option><option>Bình thường</option></select>";\n
  html += "<label class=\"toggle\"><input type=\"checkbox\" id=\"vt-hide-done\"> Ẩn hoàn thành</label>";\n
  html += "<span class=\"badge\" id=\"vt-count\">"+d.rows.length+" task</span>";\n
  html += "</div>";\n
  html += "<div id=\"vt-content\"></div>";\n
  $("#view-vt").innerHTML = html;\n
  var STATE_VT = {view:"table", groupBy:"tt"};\n
  function vtHotBadge(r, isCAO){\n
    if(isCAO && r.tre) return "<span class=\"hot-badge hb-critical\" title=\"CAO + trễ\">🔥 HOT</span>";\n
    if(r.tre) return "<span class=\"hot-badge hb-tre\" title=\"Trễ deadline\">⏰</span>";\n
    if(isCAO) return "<span class=\"hot-badge hb-cao\">CAO</span>";\n
    return "";\n
  }\n
  function renderVTCardInner(r){\n
    var isCAO = (r.ut||"").toLowerCase().indexOf("cao")>=0;\n
    var cardCls = "kanban-card";\n
    if(isCAO && r.tre) cardCls += " card-critical";\n
    else if(isCAO) cardCls += " card-cao";\n
    else if(r.tre) cardCls += " card-tre";\n
    if(r.ht) cardCls += " row-done";\n
    var hot = vtHotBadge(r, isCAO);\n
    var h = "<div class=\""+cardCls+"\" data-type=\"VT\" data-id=\""+esc(r.ma||r.loai)+"\" data-tab=\""+esc(TAB_NAME.VT)+"\" data-gid=\""+r.gid+"\" data-row=\""+r.idx+"\">";\n
    h += "<div class=\"ma\">"+hot+esc(r.loai||"")+(r.ht?" <span class=\"ht-tick\" style=\"font-size:11px\">✓</span>":"")+"</div>";\n
    h += "<div class=\"meta\" style=\"margin-top:6px\">";\n
    h += "<span title=\""+esc(r.khoa+(r.coso?" · "+r.coso:""))+"\">📍 "+esc((r.khoa||"").substring(0,18))+(r.khoa.length>18?"…":"")+"</span>";\n
    if(r.tt)h += "<span class=\"pill blue\" style=\"font-size:10px;padding:1px 6px\">"+esc(r.tt)+"</span>";\n
    h += "</div>";\n
    if(r.buoc)h += "<div class=\"kanban-vuong\" style=\"color:#D1D5DB;font-style:normal\">"+esc(String(r.buoc).substring(0,90))+(r.buoc.length>90?"…":"")+"</div>";\n
    if(r.cb)h += "<div class=\"kanban-cb\">👤 "+esc(r.cb)+"</div>";\n
    if(r.dl||r.pct!==null){\n
      h += "<div class=\"meta\" style=\"margin-top:5px;font-size:11px\">";\n
      if(r.dl)h += "<span style=\"color:#9CA3AF\">⏱ "+esc(r.dl)+"</span>"+(r.tre?" <span class=\"tre-badge\">Trễ "+r.tre+"n</span>":"");\n
      if(r.pct!==null)h += "<span style=\"color:#60A5FA\">"+r.pct+"%</span>";\n
      h += "</div>";\n
    }\n
    if(r.pct!==null)h += "<div class=\"progress\"><div class=\"progress-fill\" style=\"width:"+r.pct+"%\"></div></div>";\n
    if(r.vuong)h += "<div class=\"kanban-vuong\">⚠ "+esc(String(r.vuong).substring(0,80))+(r.vuong.length>80?"…":"")+"</div>";\n
    h += "</div>";\n
    return h;\n
  }\n
  function renderVTKanban(rows){\n
    if(!rows.length) return "<div class=\"empty\">Không có task nào khớp filter.</div>";\n
    var groupBy = STATE_VT.groupBy || "tt";\n
    var groupLabel = {tt:"Trạng thái", loai:"Loại nhóm", ut:"Cấp độ ưu tiên", khoa:"Khoa", coso:"Cơ sở", cb:"CB phụ trách"}[groupBy] || "Trạng thái";\n
    var buckets = {};\n
    rows.forEach(function(r){\n
      var k;\n
      if(groupBy==="loai") k = r.loai || "(Chưa rõ loại)";\n
      else if(groupBy==="ut") k = ((r.ut||"").toLowerCase().indexOf("cao")>=0)?"🔴 Ưu tiên CAO":"Bình thường";\n
      else if(groupBy==="khoa") k = r.khoa || "(Chưa rõ khoa)";\n
      else if(groupBy==="coso") k = r.coso || "(Chưa rõ cơ sở)";\n
      else if(groupBy==="cb") k = r.cb || "(Chưa giao)";\n
      else k = r.tt || "(Chưa phân loại)";\n
      if(!buckets[k]) buckets[k]=[];\n
      buckets[k].push(r);\n
    });\n
    var pipe = Object.keys(buckets).map(function(k){return {name:k, count:buckets[k].length, items:buckets[k]};}).sort(function(a,b){return b.count-a.count;});\n
    if(!pipe.length) return "<div class=\"empty\">Không có task nào khớp filter.</div>";\n
    if(pipe.length===1){\n
      var col = pipe[0];\n
      var hg = "<div class=\"hs-grid-banner\">📋 <b>"+esc(col.name)+"</b> <span class=\"hs-grid-cnt\">"+col.count+" task</span> <span class=\"hs-grid-hint\">— chỉ có 1 "+esc(groupLabel.toLowerCase())+", hiển thị grid để dễ scan. Đổi <b>Group by</b> để thấy cột phân nhóm khác.</span></div>";\n
      hg += "<div class=\"hs-grid\">";\n
      col.items.forEach(function(it){ hg += renderVTCardInner(it); });\n
      hg += "</div>";\n
      return hg;\n
    }\n
    var h = "<div class=\"pipeline\" data-groupby=\""+groupBy+"\">";\n
    pipe.forEach(function(col){\n
      h += "<div class=\"col\"><div class=\"col-head\">"+esc(col.name)+"<span class=\"col-count\">"+col.count+"</span></div><div class=\"col-body\">";\n
      col.items.forEach(function(it){ h += renderVTCardInner(it); });\n
      h += "</div></div>";\n
    });\n
    h += "</div>";\n
    return h;\n
  }\n
  function renderVTTable(rows){\n
    if(!rows.length) return "<div class=\"empty\">Không có task nào khớp filter.</div>";\n
    var h = "<div class=\"tbl-wrap\"><table class=\"tbl tbl-kt\"><thead><tr><th class=\"col-ten\">Loại nhóm</th><th class=\"col-cap\">Cấp độ</th><th class=\"col-ht\">HT</th><th>Khoa · Cơ sở</th><th>Trạng thái</th><th>%</th><th>CB</th><th>Bước</th><th>Deadline</th><th>Vướng mắc</th></tr></thead><tbody>";\n
    rows.forEach(function(r){\n
      var isCAO = (r.ut||"").toLowerCase().indexOf("cao")>=0;\n
      var pillU = isCAO?"red":"gray";\n
      var rowCls = r.ht?"row-done":"";\n
      var dl = (r.dl||"")+(r.tre?" <span class=\"tre-badge\">Trễ "+r.tre+"n</span>":"");\n
      var khoaCoso = esc(r.khoa)+(r.coso?"<div style=\"font-size:10px;color:#6B7280;margin-top:2px\">"+esc(r.coso)+"</div>":"");\n
      var pct = r.pct!==null?(r.pct+"%"):"-";\n
      var hot = vtHotBadge(r, isCAO);\n
      h += "<tr class=\""+rowCls+"\" data-type=\"VT\" data-id=\""+esc(r.ma||r.loai)+"\" data-tab=\""+esc(TAB_NAME.VT)+"\" data-gid=\""+r.gid+"\" data-row=\""+r.idx+"\">";\n
      h += "<td class=\"col-ten\">"+hot+"<b>"+esc(r.loai||"-")+"</b></td>";\n
      h += "<td class=\"col-cap\"><span class=\"pill "+pillU+"\">"+esc(r.ut||"-")+"</span></td>";\n
      h += "<td class=\"col-ht\">"+(r.ht?"<span class=\"ht-tick\">✓</span>":"<span class=\"ht-pending\">⏳</span>")+"</td>";\n
      h += "<td>"+khoaCoso+"</td>";\n
      h += "<td><span class=\"pill blue\">"+esc(r.tt||"-")+"</span></td>";\n
      h += "<td class=\"num\">"+pct+"</td>";\n
      h += "<td style=\"font-size:12px\">"+esc(r.cb||"-")+"</td>";\n
      h += "<td style=\"max-width:220px;font-size:11px;color:#9CA3AF\">"+esc(r.buoc)+"</td>";\n
      h += "<td style=\"font-size:11px\">"+dl+"</td>";\n
      h += "<td style=\"max-width:200px;font-size:11px;color:#FCA5A5\">"+esc(r.vuong)+"</td>";\n
      h += "</tr>";\n
    });\n
    h += "</tbody></table></div>";\n
    return h;\n
  }\n
  function applyVT(){\n
    var q=$("#vt-search").value.toLowerCase();\n
    var cs=$("#vt-coso").value, kh=$("#vt-khoa").value, cb=$("#vt-cb").value;\n
    var tt=$("#vt-tt").value, loai=$("#vt-loai").value, ut=$("#vt-ut").value;\n
    var hideDone=$("#vt-hide-done").checked;\n
    var rows=d.rows.filter(function(r){\n
      if(hideDone && r.ht) return false;\n
      if(cs && r.coso!==cs) return false;\n
      if(kh && r.khoa!==kh) return false;\n
      if(cb && r.cb!==cb) return false;\n
      if(tt && r.tt!==tt) return false;\n
      if(loai && r.loai!==loai) return false;\n
      if(ut==="CAO" && (r.ut||"").toLowerCase().indexOf("cao")<0) return false;\n
      if(ut==="Bình thường" && (r.ut||"").toLowerCase().indexOf("cao")>=0) return false;\n
      if(q){var hay=((r.loai||"")+" "+(r.khoa||"")+" "+(r.cb||"")+" "+(r.vuong||"")+" "+(r.buoc||"")+" "+(r.tt||"")).toLowerCase();if(hay.indexOf(q)<0)return false;}\n
      return true;\n
    });\n
    rows.sort(function(a,b){\n
      var aCAO=(a.ut||"").toLowerCase().indexOf("cao")>=0?0:1;\n
      var bCAO=(b.ut||"").toLowerCase().indexOf("cao")>=0?0:1;\n
      if(aCAO!==bCAO) return aCAO-bCAO;\n
      var aTre=a.tre?0:1, bTre=b.tre?0:1;\n
      if(aTre!==bTre) return aTre-bTre;\n
      return (a.ht?1:0)-(b.ht?1:0);\n
    });\n
    if(STATE_VT.view==="kanban") $("#vt-content").innerHTML = renderVTKanban(rows);\n
    else $("#vt-content").innerHTML = renderVTTable(rows);\n
    $("#vt-count").textContent = rows.length+" / "+d.rows.length+" task";\n
    $$("#vt-content .kanban-card, #vt-content tbody tr").forEach(function(el){el.onclick=function(){openInApp(el);};});\n
  }\n
  // Bind chip clicks\n
  $$("#view-vt .kt-chip[data-chip]").forEach(function(el){\n
    el.onclick=function(){\n
      var chip = el.getAttribute("data-chip");\n
      $$("#view-vt .kt-chip").forEach(function(x){x.classList.remove("active");});\n
      if(chip!=="reset") el.classList.add("active");\n
      $("#vt-search").value=""; $("#vt-coso").value=""; $("#vt-khoa").value=""; $("#vt-cb").value="";\n
      $("#vt-tt").value=""; $("#vt-loai").value=""; $("#vt-ut").value="";\n
      $("#vt-hide-done").checked=false;\n
      if(chip==="cao") $("#vt-ut").value="CAO";\n
      else if(chip==="vuong" || chip==="tre") $("#vt-hide-done").checked=true;\n
      applyVT();\n
      if(chip==="vuong"){\n
        $$("#vt-content .kanban-card, #vt-content tbody tr").forEach(function(el){\n
          var hasV = el.querySelector(".kanban-vuong:last-child") || (el.tagName==="TR" && el.querySelectorAll("td")[9] && el.querySelectorAll("td")[9].textContent.trim());\n
          if(!hasV) el.style.display="none";\n
        });\n
      } else if(chip==="tre"){\n
        $$("#vt-content .kanban-card, #vt-content tbody tr").forEach(function(el){\n
          var hasHot = el.querySelector(".hot-badge.hb-critical, .hot-badge.hb-tre");\n
          if(!hasHot) el.style.display="none";\n
        });\n
      }\n
    };\n
  });\n
  // Bind view toggle\n
  $$("#view-vt .hs-vbtn").forEach(function(b){\n
    b.onclick=function(){\n
      $$("#view-vt .hs-vbtn").forEach(function(x){x.classList.remove("active");});\n
      b.classList.add("active");\n
      STATE_VT.view = b.getAttribute("data-view");\n
      applyVT();\n
    };\n
  });\n
  // Bind groupBy\n
  var vtSel = $("#vt-group");\n
  if(vtSel) vtSel.onchange = function(){ STATE_VT.groupBy = this.value; applyVT(); };\n
  ["#vt-search","#vt-coso","#vt-khoa","#vt-cb","#vt-tt","#vt-loai","#vt-ut","#vt-hide-done"].forEach(function(s){var el=$(s);if(el)el.oninput=el.onchange=applyVT;});\n
  applyVT();\n
}\n
/* Render Kho */
function renderKho(d){\n
  STATE.sheetUrl = d.sheetUrl || STATE.sheetUrl;\n
  var html = "";\n
  // v2.8: Forecast cung ứng — section trên cùng\n
  if(d.forecast && d.forecast.items.length){\n
    var f = d.forecast; var s = f.stats;\n
    html += "<div class=\"sh\">🔮 Dự đoán cung ứng VTTH / Hóa chất <small style=\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\">map DOH với tiến trình gói thầu — gợi ý hành động khẩn cấp</small></div>";\n
    // Banner cảnh báo nếu có Mức 1/2 chưa có giải pháp\n
    if(s.l1NoSolution>0){\n
      html += "<div class=\"forecast-alert critical\">🚨 <b>"+s.l1NoSolution+" mặt hàng</b> có DOH dưới 30 ngày VÀ <b>chưa có gói thầu / chưa shortcut</b> — phải triển khai chào giá trực tuyến hoặc chỉ định thầu / mua sắm trực tiếp NGAY HÔM NAY.</div>";\n
    }\n
    if(s.l2NoSolution>0){\n
      html += "<div class=\"forecast-alert warn\">⚠ <b>"+s.l2NoSolution+" mặt hàng</b> có DOH 30-60 ngày VÀ chưa đến bước \"Đánh giá HSDT\" — cần đôn đốc tiến độ tuần này.</div>";\n
    }\n
    // v2.8.1: Banner cảnh báo tồn đọng >1 năm\n
    if(s.stagnantLong>0){\n
      html += "<div class=\"forecast-alert stag\">🚨 <b>"+s.stagnantLong+" mặt hàng</b> tồn đọng <b>trên 1 năm</b> — bắt buộc rà soát: điều chuyển khoa khác / chuyển dùng / thanh lý nếu hết hạn.</div>";\n
    } else if(s.stagnantHigh>0){\n
      html += "<div class=\"forecast-alert stag-mid\">⚠ <b>"+s.stagnantHigh+" mặt hàng</b> tồn đọng <b>6 tháng - 1 năm</b> — đề xuất chuyển khoa khác / xử lý theo quy định.</div>";\n
    }\n
    // 5 KPI cards\n
    html += "<div class=\"forecast-stats\">";\n
    html += "<div class=\"fs-card fs-red\"><div class=\"fs-num\">"+s.l1+"</div><div class=\"fs-lbl\">🚨 Mức 1 — KHẨN<br><small>DOH < 30 ngày</small></div></div>";\n
    html += "<div class=\"fs-card fs-orange\"><div class=\"fs-num\">"+s.l2+"</div><div class=\"fs-lbl\">🔴 Mức 2 — CAO<br><small>30-60 ngày</small></div></div>";\n
    html += "<div class=\"fs-card fs-yellow\"><div class=\"fs-num\">"+s.l3+"</div><div class=\"fs-lbl\">🟡 Mức 3 — TRUNG<br><small>60-90 ngày</small></div></div>";\n
    html += "<div class=\"fs-card fs-blue\"><div class=\"fs-num\">"+s.l4+"</div><div class=\"fs-lbl\">🟢 Mức 4 — Trong tầm<br><small>90-180 ngày</small></div></div>";\n
    html += "<div class=\"fs-card fs-gray\"><div class=\"fs-num\">"+(s.stagnant - s.stagnantHigh - s.stagnantLong)+"</div><div class=\"fs-lbl\">📦 Tồn cao<br><small>90-180 ngày</small></div></div>";\n
    html += "<div class=\"fs-card fs-darkgray\"><div class=\"fs-num\">"+s.stagnantHigh+"</div><div class=\"fs-lbl\">⚠ Tồn 6 tháng<br><small>180-365 ngày</small></div></div>";\n
    html += "<div class=\"fs-card fs-darkred\"><div class=\"fs-num\">"+s.stagnantLong+"</div><div class=\"fs-lbl\">🚨 Tồn >1 năm<br><small>≥ 365 ngày</small></div></div>";\n
    html += "</div>";\n
    // Bảng top 10\n
    var top = f.items.filter(function(it){return it.risk.level<=3;}).slice(0,10);\n
    if(\!top.length){ top = f.items.slice(0,10); }\n
    if(top.length){\n
      html += "<div class=\"forecast-table\">";\n
      html += "<div class=\"ft-head\">Top "+top.length+" mặt hàng cần xử lý — sắp xếp theo mức độ khẩn cấp</div>";\n
      top.forEach(function(it){\n
        var r = it.risk;\n
        var okCls = r.ok ? "ft-ok" : "ft-not-ok";\n
        html += "<div class=\"ft-row ft-"+r.color+" "+okCls+"\" data-tab=\""+esc(TAB_NAME.KHO_5A)+"\" data-title=\""+esc(it.ten||"Hàng kho 5A")+"\" data-gid=\""+it.gid+"\" data-row=\""+it.idx+"\">";\n
        html += "<div class=\"ft-lvl\">"+r.label+"</div>";\n
        html += "<div class=\"ft-info\">";\n
        html += "<div class=\"ft-name\">"+esc(it.ten);\n
        if(it.ma) html += " <span class=\"ft-code\">"+esc(it.ma)+"</span>";\n
        if(it.risk.stagnant && r.level <= 3) html += " <span class=\"ft-stag-tag\">📦 dùng ít</span>";\n
        html += "</div>";\n
        html += "<div class=\"ft-meta\">📍 "+esc(it.khoa||"?")+" · 📦 Tồn <b>"+esc(it.ton||"0")+"</b> · ⏱ DOH <b style=\"color:"+(r.color==="red"?"#F87171":r.color==="orange"?"#FB923C":r.color==="yellow"?"#FBBF24":"#60A5FA")+"\">"+r.doh+"n</b></div>";\n
        html += "</div>";\n
        html += "<div class=\"ft-action\">"+esc(r.action)+"</div>";\n
        html += "</div>";\n
      });\n
      html += "</div>";\n
    }\n
    // Bonus: section Tồn đọng riêng nếu có\n
    // v2.8.1: 2 section tồn đọng theo tier — Tồn dài >1 năm trước, sau đó Tồn 6 tháng\n
    var stagnantLong = f.items.filter(function(it){return it.risk.stagnantTier===3;});\n
    var stagnantHigh = f.items.filter(function(it){return it.risk.stagnantTier===2;}).slice(0,8);\n
    var stagnantMid = f.items.filter(function(it){return it.risk.stagnantTier===1 && it.risk.level>=4;}).slice(0,5);\n
    function renderStagSection(title, hint, items, lvlLabel, rowCls){\n
      if(\!items.length) return "";\n
      var hh = "<div class=\"sh\" style=\"margin-top:18px\">"+title+" <small style=\"font-weight:400;color:#9CA3AF;text-transform:none;letter-spacing:.3px;font-size:11px;margin-left:8px\">"+hint+"</small></div>";\n
      hh += "<div class=\"forecast-table\">";\n
      items.forEach(function(it){\n
        var r = it.risk;\n
        hh += "<div class=\"ft-row "+rowCls+"\" data-tab=\""+esc(TAB_NAME.KHO_5A)+"\" data-title=\""+esc(it.ten)+"\" data-gid=\""+it.gid+"\" data-row=\""+it.idx+"\">";\n
        hh += "<div class=\"ft-lvl\">"+lvlLabel+"</div>";\n
        hh += "<div class=\"ft-info\"><div class=\"ft-name\">"+esc(it.ten)+(it.ma?" <span class=\"ft-code\">"+esc(it.ma)+"</span>":"")+"</div>";\n
        hh += "<div class=\"ft-meta\">📍 "+esc(it.khoa||"?")+" · Tồn <b>"+esc(it.ton||"0")+"</b> · DOH <b style=\"color:#FB923C\">"+r.doh+"n</b> ("+Math.round(r.doh/30)+" tháng)</div></div>";\n
        hh += "<div class=\"ft-action\">"+esc(r.action)+"</div></div>";\n
      });\n
      hh += "</div>";\n
      return hh;\n
    }\n
    html += renderStagSection("🚨 Tồn đọng > 1 năm — BẮT BUỘC xử lý", "(DOH ≥ 365 ngày — rà soát điều chuyển / thanh lý nếu hết hạn)", stagnantLong, "🚨 >1 năm", "ft-darkred ft-not-ok");\n
    html += renderStagSection("⚠ Tồn đọng 6 tháng - 1 năm", "(DOH 180-365 ngày — đề xuất chuyển khoa khác / xử lý theo quy định)", stagnantHigh, "⚠ 6 tháng", "ft-orange");\n
    html += renderStagSection("📦 Tồn cao 3-6 tháng", "(DOH 90-180 ngày — kiểm tra nhu cầu sử dụng, có thể chỉ là dùng tự nhiên thấp)", stagnantMid, "📦 3-6 tháng", "ft-gray");\n
  }\n
  // Bảng tồn 5A đầy đủ — giữ nguyên\n
  html += "<div class=\"sh\" style=\"margin-top:22px\">📦 Tồn kho ("+d.ton.length+" mặt hàng) — bảng đầy đủ, click row để xem chuỗi liên kết</div>";\n
  if(d.ton.length===0)html += "<div class=\"empty\">Tab 5A chưa có dữ liệu. Chạy bootstrap() và nhập tồn kho vào.</div>";\n
  else{\n
    html += "<div class=\"tbl-wrap\"><table class=\"tbl tbl-kho-5a\"><thead><tr><th></th><th>Mã</th><th>Tên VTTH</th><th>Loại</th><th class=\"num\">Tồn</th><th class=\"num\">MIN</th><th class=\"num\">DOH</th><th>Cảnh báo</th><th>Khoa nhiều nhất</th><th class=\"num\">Số khoa chờ</th><th>Đề xuất</th></tr></thead><tbody>";\n
    d.ton.forEach(function(r){\n
      var pill = r.tt.indexOf("ĐỎ")>=0?"red":r.tt.indexOf("VÀNG")>=0?"yellow":r.tt.indexOf("XANH")>=0?"green":"gray";\n
      var dohTxt = r.doh!==null && r.doh!==undefined ? r.doh + " ngày" : "-";\n
      var dohClass = r.doh!==null && r.doh<=3 ? "color:#EF4444;font-weight:700" : r.doh!==null && r.doh<=7 ? "color:#F59E0B;font-weight:600" : "";\n
      html += "<tr class=\"kho-5a-row\" data-ma=\""+esc(r.ma||r.ten)+"\" data-tab=\""+esc(TAB_NAME.KHO_5A)+"\" data-gid=\""+r.gid+"\" data-row=\""+r.idx+"\">";\n
      html += "<td class=\"expand-cell\"><span class=\"expand-toggle\">▶</span></td>";\n
      html += "<td style=\"font-size:11px;color:#60A5FA\">"+esc(r.ma)+"</td>";\n
      html += "<td><b>"+esc(r.ten)+"</b></td>";\n
      html += "<td style=\"font-size:11px\">"+esc(r.loai)+"</td>";\n
      html += "<td class=\"num\"><b>"+esc(r.ton)+"</b></td>";\n
      html += "<td class=\"num\" style=\"color:#9CA3AF\">"+esc(r.min)+"</td>";\n
      html += "<td class=\"num\" style=\""+dohClass+"\">"+dohTxt+"</td>";\n
      html += "<td><span class=\"pill "+pill+"\">"+esc(r.tt)+"</span></td>";\n
      html += "<td style=\"font-size:11px\">"+esc(r.khoamax)+"</td>";\n
      html += "<td class=\"num\">"+esc(r.sokhoa)+"</td>";\n
      html += "<td style=\"max-width:240px;font-size:11px\">"+esc(r.dexuat)+"</td></tr>";\n
    });\n
    html += "</tbody></table></div>";\n
  }\n
  // 5B\n
  var pending = d.dexuat.filter(function(r){return r.tt!=="Đã cấp đủ";});\n
  html += "<div class=\"sh\">📋 Đề xuất chờ duyệt ("+pending.length+"/"+d.dexuat.length+")</div>";\n
  if(d.dexuat.length===0)html += "<div class=\"empty\">Tab 5B chưa có dữ liệu.</div>";\n
  else{\n
    html += "<div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Ngày YC</th><th>Khoa</th><th>Người YC</th><th>VTTH</th><th class=\"num\">SL</th><th>Mức ưu tiên</th><th>Trạng thái</th><th>CB Kho</th><th>Ngày DK cấp</th></tr></thead><tbody>";\n
    d.dexuat.forEach(function(r){\n
      var pillUT = r.ut.indexOf("CAO")>=0?"red":"gray";\n
      var pillTT = r.tt==="Đã cấp đủ"?"green":r.tt==="Chờ tiếp nhận"?"yellow":r.tt==="Đang xử lý"?"blue":"gray";\n
      html += "<tr data-tab=\""+esc(TAB_NAME.KHO_5B)+"\" data-title=\""+esc(r.vtth||"Đề xuất 5B")+"\" data-gid=\""+r.gid+"\" data-row=\""+r.idx+"\">";\n
      html += "<td style=\"font-size:11px\">"+esc(r.ngay)+"</td>";\n
      html += "<td>"+esc(r.khoa)+"</td>";\n
      html += "<td style=\"font-size:12px\">"+esc(r.nguoi)+"</td>";\n
      html += "<td><b>"+esc(r.vtth)+"</b></td>";\n
      html += "<td class=\"num\">"+esc(r.sl)+" "+esc(r.dv)+"</td>";\n
      html += "<td><span class=\"pill "+pillUT+"\">"+esc(r.ut||"-")+"</span></td>";\n
      html += "<td><span class=\"pill "+pillTT+"\">"+esc(r.tt||"-")+"</span></td>";\n
      html += "<td style=\"font-size:12px\">"+esc(r.cb)+"</td>";\n
      html += "<td style=\"font-size:11px\">"+esc(r.ndk)+"</td></tr>";\n
    });\n
    html += "</tbody></table></div>";\n
  }\n
  $("#view-kho").innerHTML = html;\n
  $$("#view-kho .ft-row[data-tab]").forEach(function(el){el.onclick=function(){openInApp(el);};});\n
  $$("#view-kho tbody tr.kho-5a-row").forEach(function(tr){\n
    tr.onclick = function(e){\n
      if(e.target.closest(".expand-cell") || e.shiftKey){ toggleKhoExpand(tr); } \n
      else { openInApp(tr); }\n
    };\n
  });\n
  $$("#view-kho tbody tr:not(.kho-5a-row)").forEach(function(tr){tr.onclick=function(){openInApp(tr);};});\n
}\n
function toggleKhoExpand(tr){\n
  if(tr.classList.contains("expanded")){\n
    tr.classList.remove("expanded");\n
    var next = tr.nextElementSibling; if(next && next.classList.contains("kho-expand-row"))next.remove();\n
    return;\n
  }\n
  tr.classList.add("expanded");\n
  var expRow = document.createElement("tr"); expRow.className = "kho-expand-row";\n
  expRow.innerHTML = "<td colspan=\"11\"><div class=\"loading\">Đang tải chi tiết lazy-load…</div></td>";\n
  tr.parentNode.insertBefore(expRow, tr.nextSibling);\n
  google.script.run.withSuccessHandler(function(d){ renderKhoExpand(d, expRow); }).getKhoDetail(tr.dataset.ma);\n
}\n
function renderKhoExpand(d, rowEl){\n
  if(d.error){rowEl.innerHTML = "<td colspan=\"11\"><div class=\"error\">"+esc(d.error)+"</div></td>";return;}\n
  var html = "<td colspan=\"11\"><div class=\"kho-expand-wrap\">";\n
  /* Col 1: VT liên quan */\n
  html += "<div class=\"kho-expand-col\"><h4>🧪 Task VTTH khớp ("+d.vt.length+")</h4>";\n
  if(\!d.vt.length)html += "<div class=\"empty-mini\">Không có task VTTH link với mã này</div>";\n
  else d.vt.forEach(function(v){\n
    html += "<div class=\"kho-link-card\" onclick=\"openDetail('VT','"+esc(v.ma||v.ten)+"')\">";\n
    html += "<div class=\"nm\">"+esc(v.ten)+"</div><div class=\"sm\">"+esc(v.khoa)+" · "+esc(v.tt)+"</div></div>";\n
  });\n
  html += "</div>";\n
  /* Col 2: HS liên quan */\n
  html += "<div class=\"kho-expand-col\"><h4>📁 Gói thầu mua sắm ("+d.hs.length+")</h4>";\n
  if(\!d.hs.length)html += "<div class=\"empty-mini\">Chưa nằm trong gói thầu nào</div>";\n
  else d.hs.forEach(function(h){\n
    html += "<div class=\"kho-link-card\" onclick=\"openDetail('HS','"+esc(h.ma||h.ten)+"')\">";\n
    html += "<div class=\"nm\">"+esc(h.ma||h.ten)+"</div><div class=\"sm\">"+esc(h.tt)+" · "+esc(h.cb)+"</div></div>";\n
  });\n
  html += "</div>";\n
  /* Col 3: Queue 5B */\n
  html += "<div class=\"kho-expand-col\"><h4>📋 Đề xuất 5B đang chờ ("+d.queueOpen+")</h4>";\n
  if(\!d.queue.length)html += "<div class=\"empty-mini\">Không có đề xuất nào</div>";\n
  else d.queue.forEach(function(q){\n
    var done = (q.tt||"").indexOf("Đã cấp đủ")>=0;\n
    html += "<div class=\"kho-queue-line\"><span class=\"kn\">"+esc(q.khoa)+"</span><span class=\"qty\">"+esc(q.sl)+" "+esc(q.dv)+"</span><span class=\"dt\">"+esc(q.ngayYC)+"</span><span class=\"st\" style=\"color:"+(done?"#10B981":"#FBBF24")+"\">"+esc(q.tt)+"</span></div>";\n
  });\n
  html += "</div>";\n
  /* Action */\n
  var openLink = d.sheetUrl + "/edit#gid=" + d.stock.gid + "&range=A" + d.stock.rowNum;\n
  html += "<div class=\"kho-expand-action\">💡 Nhấn <b>Shift + Click</b> vào hàng để mở nhanh Google Sheet tại dòng: <b>"+d.stock.rowNum+"</b> | <a href=\""+openLink+"\" target=\"_blank\" style=\"color:#fff\">Mở link trực tiếp →</a></div>";\n
  html += "</div></td>";\n
  rowEl.innerHTML = html;\n
}\n
/* Render Theo Khoa */
function renderKhoaList(d){\n
  if(d && d.error){$("#view-khoa").innerHTML="<div class=\"error\">⚠ "+esc(d.error)+"</div>";return;}\n
  var list=(d && d.khoaList)||[];\n
  var html = "<div class=\"filters\"><label style=\"color:#9CA3AF\">Chọn khoa:</label>";\n
  html += "<select id=\"khoa-select\" style=\"min-width:340px\"><option value=\"\">— Chọn khoa —</option>";\n
  list.forEach(function(k){html += "<option>"+esc(k)+"</option>";});\n
  html += "</select>";\n
  html += "<span class=\"badge\" style=\"background:#374151;color:#D1D5DB\">"+list.length+" khoa</span>";\n
  html += "</div>";\n
  html += "<div id=\"khoa-detail\"><div class=\"empty\">👆 Chọn khoa ở trên để xem toàn cảnh các vấn đề (kỹ thuật + hồ sơ + vật tư + kho).<br><br>Hoặc về tab <b>Tổng quan</b> → click thẳng vào 1 thanh trong biểu đồ \"Khoa nào đang nhiều vấn đề nhất\" để mở popup khoa 360°.</div></div>";\n
  $("#view-khoa").innerHTML = html;\n
  $("#khoa-select").onchange = function(){\n
    var k = this.value;\n
    if(\!k){$("#khoa-detail").innerHTML="<div class=\"empty\">Chưa chọn khoa.</div>";return;}\n
    $("#khoa-detail").innerHTML = "<div class=\"loading\">Đang tải dữ liệu khoa "+esc(k)+"…</div>";\n
    var done=false;\n
    setTimeout(function(){if(\!done)$("#khoa-detail").innerHTML="<div class=\"error\">⚠ Quá 20s không có phản hồi. Refresh trang (Ctrl+F5) hoặc mở console (F12) xem lỗi.</div>";},20000);\n
    google.script.run.withSuccessHandler(function(d){done=true;renderKhoaDetail(d);}).withFailureHandler(function(e){done=true;$("#khoa-detail").innerHTML="<div class=\"error\">⚠ Lỗi tải khoa: "+esc(e && e.message || e)+"</div>";}).getByKhoa(k);\n
  };\n
}\n
function renderKhoaDetail(d){\n
  if(d && d.error){$("#khoa-detail").innerHTML="<div class=\"error\">⚠ "+esc(d.error)+"</div>";return;}\n
  if(\!d || \!d.summary){$("#khoa-detail").innerHTML="<div class=\"error\">⚠ Server trả dữ liệu rỗng.</div>";return;}\n
  var s = d.summary;\n
  var html = "<div class=\"sh\">🏥 Khoa: "+esc(d.khoa)+"</div>";\n
  html += "<div class=\"khoa-summary\">";\n
  html += "<div class=\"khoa-card\"><h4>🔧 Kỹ thuật</h4><div class=\"v\"><span style=\"color:#10B981\">"+s.doneKT+"</span><span style=\"font-size:20px;color:#6B7280;margin:0 4px;font-weight:400\">/</span><span style=\"color:"+(s.totalKT>0?"#EF4444":"#9CA3AF")+"\">"+s.totalKT+"</span></div><div style=\"font-size:11px;color:#9CA3AF\">đã xong / tổng máy</div></div>";\n
  html += "<div class=\"khoa-card\"><h4>📁 Hồ sơ</h4><div class=\"v\"><span style=\"color:#10B981\">"+s.doneHS+"</span><span style=\"font-size:20px;color:#6B7280;margin:0 4px;font-weight:400\">/</span><span style=\"color:"+(s.totalHS>0?"#F59E0B":"#9CA3AF")+"\">"+s.totalHS+"</span></div><div style=\"font-size:11px;color:#9CA3AF\">đã xong / tổng hồ sơ</div></div>";\n
  html += "<div class=\"khoa-card\"><h4>🧪 Task vật tư</h4><div class=\"v\">"+s.totalVT+"</div><div style=\"font-size:11px;color:#9CA3AF\">tổng task</div></div>";\n
  html += "<div class=\"khoa-card\"><h4>📦 YC kho</h4><div class=\"v\">"+s.totalKho+"</div><div style=\"font-size:11px;color:#9CA3AF\">tổng yêu cầu</div></div>";\n
  html += "</div>";\n
  // KT\n
  if(d.kt.length){\n
    html += "<div class=\"sh\">🔧 Máy của khoa</div>";\n
    html += "<div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Tên máy</th><th>Tình trạng</th><th>Chi tiết</th><th>CB</th><th>Bước</th><th>Deadline</th><th>HT</th></tr></thead><tbody>";\n
    d.kt.forEach(function(r){\n
      var pill = (r.tinh||"").toLowerCase().indexOf("đang sửa")>=0?"yellow":(r.tinh||"").toLowerCase().indexOf("thanh lý")>=0?"gray":"blue";\n
      html += "<tr data-type=\"KT\" data-id=\""+esc(r.ten)+"\" data-tab=\""+esc(TAB_NAME.KT)+"\" data-gid=\""+r.gid+"\" data-row=\""+r.idx+"\">";\n
      html += "<td><b>"+esc(r.ten)+"</b></td>";\n
      html += "<td><span class=\"pill "+pill+"\">"+esc(r.tinh)+"</span></td>";\n
      html += "<td style=\"max-width:300px;font-size:12px\">"+esc(r.ct)+"</td>";\n
      html += "<td style=\"font-size:12px\">"+esc(r.cb)+"</td>";\n
      html += "<td style=\"max-width:240px;font-size:11px;color:#9CA3AF\">"+esc(r.buoc)+"</td>";\n
      html += "<td style=\"font-size:11px\">"+esc(r.dl)+"</td>";\n
      html += "<td>"+(r.ht?"✓":"⏳")+"</td></tr>";\n
    });\n
    html += "</tbody></table></div>";\n
  }\n
  // HS\n
  if(d.hs.length){\n
    html += "<div class=\"sh\">📁 Gói thầu / hồ sơ của khoa</div>";\n
    html += "<div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Mã HS</th><th>Nội dung</th><th>Trạng thái</th><th>%</th><th>CB</th><th>Deadline</th><th>HT</th></tr></thead><tbody>";\n
    d.hs.forEach(function(r){\n
      html += "<tr data-type=\"HS\" data-id=\""+esc(r.ma||r.nd)+"\" data-tab=\""+esc(TAB_NAME.HS)+"\" data-gid=\""+r.gid+"\" data-row=\""+r.idx+"\">";\n
      html += "<td><b style=\"color:#60A5FA\">"+esc(r.ma)+"</b></td>";\n
      html += "<td style=\"max-width:340px;font-size:12px\">"+esc(r.nd)+"</td>";\n
      html += "<td><span class=\"pill blue\">"+esc(r.tt)+"</span></td>";\n
      html += "<td class=\"num\">"+(r.pct!==null?r.pct+"%":"-")+"</td>";\n
      html += "<td style=\"font-size:12px\">"+esc(r.cb)+"</td>";\n
      html += "<td style=\"font-size:11px\">"+esc(r.dl)+"</td>";\n
      html += "<td>"+(r.ht?"✓":"⏳")+"</td></tr>";\n
    });\n
    html += "</tbody></table></div>";\n
  }\n
  // VT\n
  if(d.vt.length){\n
    html += "<div class=\"sh\">🧪 Task VTTH liên quan</div>";\n
    html += "<div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Loại</th><th>Trạng thái</th><th>%</th><th>CB</th><th>Deadline</th></tr></thead><tbody>";\n
    d.vt.forEach(function(r){\n
      html += "<tr data-type=\"VT\" data-id=\""+esc(r.loai)+"\" data-tab=\""+esc(TAB_NAME.VT)+"\" data-gid=\""+r.gid+"\" data-row=\""+r.idx+"\">";\n
      html += "<td><b>"+esc(r.loai)+"</b></td>";\n
      html += "<td>"+esc(r.tt)+"</td>";\n
      html += "<td class=\"num\">"+(r.pct!==null?r.pct+"%":"-")+"</td>";\n
      html += "<td style=\"font-size:12px\">"+esc(r.cb)+"</td>";\n
      html += "<td style=\"font-size:11px\">"+esc(r.dl)+"</td></tr>";\n
    });\n
    html += "</tbody></table></div>";\n
  }\n
  // Kho\n
  if(d.kho.length){\n
    html += "<div class=\"sh\">📦 Yêu cầu kho của khoa</div>";\n
    html += "<div class=\"tbl-wrap\"><table class=\"tbl\"><thead><tr><th>Ngày YC</th><th>VTTH</th><th>SL</th><th>Ưu tiên</th><th>Trạng thái</th></tr></thead><tbody>";\n
    d.kho.forEach(function(r){\n
      var pillUT = (r.ut||"").indexOf("CAO")>=0?"red":"gray";\n
      html += "<tr data-tab=\""+esc(TAB_NAME.KHO_5B)+"\" data-title=\""+esc(r.vtth||"YC kho")+"\" data-gid=\""+r.gid+"\" data-row=\""+r.idx+"\">";\n
      html += "<td style=\"font-size:11px\">"+esc(r.ngay)+"</td>";\n
      html += "<td><b>"+esc(r.vtth)+"</b></td>";\n
      html += "<td class=\"num\">"+esc(r.sl)+"</td>";\n
      html += "<td><span class=\"pill "+pillUT+"\">"+esc(r.ut)+"</span></td>";\n
      html += "<td>"+esc(r.tt)+"</td></tr>";\n
    });\n
    html += "</tbody></table></div>";\n
  }\n
  if(!d.kt.length && !d.hs.length && !d.vt.length && !d.kho.length){\n
    html += "<div class=\"empty\">Khoa này không có vấn đề nào — tốt!</div>";\n
  }\n
  $("#khoa-detail").innerHTML = html;\n
  $$("#khoa-detail tbody tr").forEach(function(tr){if(tr.dataset.gid)tr.onclick=function(){openInApp(tr);};});\n
}\n
/* Loaders */
function showErr(err){var s=$("#view-"+STATE.currentView);if(s)s.innerHTML="<div class=\"error\">⚠️ Lỗi tải dữ liệu: "+esc(err && err.message || err)+"</div>";}\n
function loadView(v){\n
  if(v==="overview"){google.script.run.withSuccessHandler(renderOverview).withFailureHandler(showErr).getOverview();}\n
  else if(v==="kt"){google.script.run.withSuccessHandler(renderKT).withFailureHandler(showErr).getKyThuat();}\n
  else if(v==="hs"){google.script.run.withSuccessHandler(renderHS).withFailureHandler(showErr).getHoSo();}\n
  else if(v==="vt"){google.script.run.withSuccessHandler(renderVT).withFailureHandler(showErr).getVTTH();}\n
  else if(v==="kho"){google.script.run.withSuccessHandler(renderKho).withFailureHandler(showErr).getKho();}\n
  else if(v==="khoa"){google.script.run.withSuccessHandler(renderKhoaList).withFailureHandler(showErr).getByKhoa("");}\n
  else if(v==="lienket"){google.script.run.withSuccessHandler(renderLienket).withFailureHandler(showErr).getLinkedChains();}\n
}\n
loadView("overview");\n
/* v2.8: Bottom nav IIFE */
(function(){\n
  var moreMenu = document.getElementById("mob-more-menu");\n
  // Helper: switch view bằng cách click tab gốc (dùng handler có sẵn)\n
  function mobSwitch(v) {\n
    // Sync mob nav active state\n
    $$("#mob-nav .mnb[data-view]").forEach(function(b){\n
      b.classList.toggle("active", b.dataset.view === v);\n
    });\n
    var inExtra = ["vt","khoa","lienket"].indexOf(v) >= 0;\n
    var mm = document.getElementById("mnb-more");\n
    if(mm) mm.classList.toggle("active", inExtra);\n
    if(moreMenu) moreMenu.classList.remove("open");\n
    // Trigger tab gốc\n
    var tabBtn = document.querySelector("#tabs button[data-view=\"" + v + "\"]");\n
    if(tabBtn) { tabBtn.click(); return; }\n
    // Fallback nếu tab ẩn không click được\n
    $$("section.view").forEach(function(x){x.classList.remove("active");});\n
    var s = document.getElementById("view-" + v);\n
    if(s) s.classList.add("active");\n
    STATE.currentView = v;\n
    loadView(v);\n
  }\n
  // Bottom nav buttons\n
  $$("#mob-nav .mnb[data-view]").forEach(function(btn){\n
    btn.addEventListener("click", function(e){\n
      e.stopPropagation();\n
      mobSwitch(btn.dataset.view);\n
    });\n
  });\n
  // More button toggle\n
  var mnbMore = document.getElementById("mnb-more");\n
  if(mnbMore) mnbMore.addEventListener("click", function(e){\n
    e.stopPropagation();\n
    if(moreMenu) moreMenu.classList.toggle("open");\n
  });\n
  // Extra menu items\n
  $$(".mnb-extra").forEach(function(btn){\n
    btn.addEventListener("click", function(e){\n
      e.stopPropagation();\n
      mobSwitch(btn.dataset.view);\n
    });\n
  });\n
  // Close More menu khi tap outside\n
  document.addEventListener("click", function(){\n
    if(moreMenu) moreMenu.classList.remove("open");\n
  });\n
  // Sync mob nav khi click top tab (desktop/DevTools)\n
  $$("#tabs button").forEach(function(b){\n
    b.addEventListener("click", function(){\n
      var v = b.dataset.view;\n
      $$("#mob-nav .mnb[data-view]").forEach(function(mb){\n
        mb.classList.toggle("active", mb.dataset.view === v);\n
      });\n
      var inExtra2 = ["vt","khoa","lienket"].indexOf(v) >= 0;\n
      var mm2 = document.getElementById("mnb-more");\n
      if(mm2) mm2.classList.toggle("active", inExtra2);\n
    });\n
  });\n
  // Collapsible hot list sections\n
  function initHotCollapsible(){\n
    $$("#view-overview .hot-team-header:not([data-c-init])").forEach(function(hdr){\n
      hdr.setAttribute("data-c-init","1");\n
      hdr.addEventListener("click", function(){\n
        var sec = hdr.closest(".hot-team-section");\n
        if(sec) sec.classList.toggle("collapsed");\n
      });\n
    });\n
  }\n
  var ov = document.getElementById("view-overview");\n
  if(ov){\n
    var mo = new MutationObserver(initHotCollapsible);\n
    mo.observe(ov, {childList:true, subtree:false});\n
  }\n
  initHotCollapsible();\n
  // v2.8: Search toggle on mobile\n
  var btnSrch = document.getElementById("btn-search-mob");\n
  var srchWrap = document.querySelector(".search-wrap");\n
  var srchInput = document.getElementById("search");\n
  if(btnSrch && srchWrap){\n
    btnSrch.addEventListener("click", function(e){\n
      e.stopPropagation();\n
      srchWrap.classList.toggle("mob-open");\n
      if(srchWrap.classList.contains("mob-open") && srchInput) srchInput.focus();\n
    });\n
    document.addEventListener("keydown", function(e){\n
      if(e.key === "Escape") srchWrap.classList.remove("mob-open");\n
    });\n
  }\n
})();\n
/* Auto-refresh overview every 120s */
setInterval(function(){\n
  if(STATE.currentView==="overview"&&!document.querySelector("#modal.show"))loadView("overview");\n
},120000);\n
})();\n

