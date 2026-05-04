const fs = require('fs');
const content = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

function showHex(str) {
  return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ');
}

console.log('Hex of "đŸ“Š": ' + showHex('đŸ“Š'));

// Find "đŸ“Š" in content and show surrounding hex
const pos = content.indexOf('Khoa × Cơ');
if (pos >= 0) {
  console.log('Found "Khoa × Cơ" at ' + pos);
  console.log('Surrounding hex: ' + showHex(content.substring(pos - 10, pos + 20)));
}
