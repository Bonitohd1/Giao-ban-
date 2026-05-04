const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const target = "kt.rows.forEach((r, i) => {";
const idx = code.indexOf(target);

if (idx !== -1) {
    // Find the end of this loop (approximately line 750)
    const endIdx = code.indexOf("});", idx);
    if (endIdx !== -1) {
        const replacement = `    const cKhoa = _findCol(kt.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
    const cTinh = _findCol(kt.headers, "Tình Trạng Thiết Bị", "Tình trạng");
    const cCB = _findCol(kt.headers, "CB phụ trách", "CB");
    const cVuong = _findCol(kt.headers, "Vướng mắc", "Ghi chú");
    const cBH = _findCol(kt.headers, LINK_COL.KT_BH_DATE);
    const cBTNext = _findCol(kt.headers, LINK_COL.KT_BT_NEXT);

    kt.rows.forEach((r, i) => {
      const ma = (r[cMa] || "").toString().trim();
      const ten = (r[cTen >= 0 ? cTen : 0] || "").toString().trim();
      if (!ten) return;
      const obj = { 
        ma: ma, ten: ten, rowNum: i + 2, type: "KT",
        khoa: cKhoa >= 0 ? (r[cKhoa]||"").toString().trim() : "",
        tinh: cTinh >= 0 ? (r[cTinh]||"").toString().trim() : "",
        cb: cCB >= 0 ? (r[cCB]||"").toString().trim() : "",
        vuong: cVuong >= 0 ? (r[cVuong]||"").toString().trim() : "",
        bhh: cBH >= 0 ? r[cBH] : null,
        btt: cBTNext >= 0 ? r[cBTNext] : null
      };
      if (ma) idx.kt[ma] = obj;
      idx.ktByName[_norm(ten)] = obj;
      if (ma) {
        idx.ktToHs[ma] = _parseLinks(r[cLkHS]).concat(_parseLinks(r[cLkBT]));
      }
    });`;
        
        // We need to replace from line 740 to 750.
        // Let's find the start of line 740.
        const startOfLineIdx = code.lastIndexOf("\n", idx) + 1;
        
        const newCode = code.substring(0, startOfLineIdx) + replacement + code.substring(endIdx + 3);
        fs.writeFileSync('AppScript_v2_10.gs', newCode);
        console.log("Upgraded _buildLinkIndexFromData with maintenance fields (substring method).");
    }
} else {
    console.log("Could not find target.");
}
