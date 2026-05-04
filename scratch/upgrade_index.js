const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const oldIndexLoop = `    kt.rows.forEach((r, i) => {
      const ma = (r[cMa] || "").toString().trim();
      const ten = (r[cTen >= 0 ? cTen : 0] || "").toString().trim();
      if (!ten) return;
      const obj = { ma: ma, ten: ten, rowNum: i + 2, type: "KT" };
      if (ma) idx.kt[ma] = obj;
      idx.ktByName[_norm(ten)] = obj;
      if (ma) {
        idx.ktToHs[ma] = _parseLinks(r[cLkHS]).concat(_parseLinks(r[cLkBT]));
      }
    });`;

// Find all necessary columns
const newIndexLoop = `    const cKhoa = _findCol(kt.headers, "Khoa/ Phòng Sử Dụng", "Khoa");
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

if (code.indexOf(oldIndexLoop) !== -1) {
    code = code.replace(oldIndexLoop, newIndexLoop);
    fs.writeFileSync('AppScript_v2_10.gs', code);
    console.log("Upgraded _buildLinkIndexFromData with maintenance fields.");
} else {
    console.log("Could not find oldIndexLoop pattern.");
}
