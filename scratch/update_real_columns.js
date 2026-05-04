const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

// 1. Cập nhật _buildLinkIndexFromData để lấy thêm cột Giải pháp và Kế hoạch
const oldIndexSearch = 'const cVuong = _findCol(kt.headers, "Vướng mắc", "Ghi chú");';
const newIndexSearch = 'const cVuong = _findCol(kt.headers, "Vướng mắc", "Ghi chú");\n' +
'    const cGiaiPhap = _findCol(kt.headers, "Đề xuất, giải pháp", "Giải pháp");\n' +
'    const cKeHoach = _findCol(kt.headers, "Kế hoạch & Công việc dự kiến tiếp theo", "Kế hoạch");';

code = code.replace(oldIndexSearch, newIndexSearch);

const oldObj = 'vuong: cVuong >= 0 ? (r[cVuong]||"").toString().trim() : "",';
const newObj = 'vuong: cVuong >= 0 ? (r[cVuong]||"").toString().trim() : "",\n' +
'        giaiPhap: cGiaiPhap >= 0 ? (r[cGiaiPhap]||"").toString().trim() : "",\n' +
'        keHoach: cKeHoach >= 0 ? (r[cKeHoach]||"").toString().trim() : "",';

code = code.replace(oldObj, newObj);

// 2. Cập nhật renderDetail để hiển thị thêm 2 mục này
const oldDetailMaint = '       html += "<small>Hạn: "+esc(mt.date)+" (còn "+mt.daysLeft+" ngày)</small>";\\n\' +';
const newDetailExtra = '       html += "<small>Hạn: "+esc(mt.date)+" (còn "+mt.daysLeft+" ngày)</small>";\\n\' +\n' +
'    }\\n\' +\n' +
'    if(o.giaiPhap)html+="<div class=\\\\"alert-box green\\\\\" style=\\\\"margin-top:8px;padding:10px;font-size:12px\\\\\">💡 <b>Giải pháp:</b> "+esc(o.giaiPhap)+"</div>";\\n\' +\n' +
'    if(o.keHoach)html+="<div class=\\\\"alert-box blue\\\\\" style=\\\\"margin-top:8px;padding:10px;font-size:12px\\\\\">📅 <b>Kế hoạch:</b> "+esc(o.keHoach)+"</div>";\\n\' +';

// Cần cẩn thận với việc thay thế trong chuỗi string lồng nhau
code = code.replace('    }\\n\' +', newDetailExtra);

fs.writeFileSync('AppScript_v2_10.gs', code);
console.log("Đã cập nhật Mapping cột Giải pháp & Kế hoạch vào Modal chi tiết.");
