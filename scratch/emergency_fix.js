const fs = require('fs');
const path = 'AppScript_v2_10.gs';
let code = fs.readFileSync(path, 'utf8');

// Phẫu thuật chính xác các khối bị hỏng
const lines = code.split(/\r?\n/);

let inBrokenBlock1 = false; // Khối Liên kết
let inBrokenBlock2 = false; // Khối showMaintenanceForecast

const fixedLines = lines.map((line, idx) => {
  let trimmed = line.trim();
  let lNum = idx + 1;

  // Khối 1: Tìm vùng từ dòng 4035 đến 4057 (hoặc lân cận)
  if (lNum === 4035) inBrokenBlock1 = true;
  if (inBrokenBlock1 && trimmed.includes('if(ch.queueOpen)html+=')) inBrokenBlock1 = false;

  // Khối 2: Tìm vùng showMaintenanceForecast
  if (trimmed.includes('function showMaintenanceForecast(){')) inBrokenBlock2 = true;
  if (inBrokenBlock2 && trimmed === '}') inBrokenBlock2 = false;

  // Xử lý khối 1: bọc nháy
  if (inBrokenBlock1 && (trimmed.startsWith('if(') || trimmed.startsWith('html+=') || trimmed.startsWith('}'))) {
     if (!line.includes("'") && !line.includes('"')) {
        return "    '" + line.trim() + "\\n' +";
     }
     if (trimmed.startsWith('if(') && !line.includes("'")) {
        return "    '" + line.trim() + "\\n' +";
     }
  }

  // Xử lý lỗi modal cụ thể
  if (trimmed.includes('document.getElementById("modal")')) {
    return line.replace('document.getElementById("modal")', "document.getElementById('modal')");
  }
  
  return line;
});

fs.writeFileSync(path, fixedLines.join('\n'));
console.log('Emergency Fix Completed!');
