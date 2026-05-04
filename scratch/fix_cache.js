const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');
const lines = code.split('\n');
lines[665] = '  const cacheKey = "OVERVIEW_GLOBAL_v2_16_" + SHEET_ID;';
lines[667] = '  // if (cached) return JSON.parse(cached);';
fs.writeFileSync('AppScript_v2_10.gs', lines.join('\n'));
console.log('Fixed cache at lines 665 and 667');
