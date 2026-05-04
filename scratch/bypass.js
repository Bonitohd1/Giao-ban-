const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const target = `const cacheKey = "OVERVIEW_GLOBAL_v2_15_" + SHEET_ID;
  const cached = c.get(cacheKey);
  if (cached) return JSON.parse(cached);`;

const replacement = `const cacheKey = "OVERVIEW_GLOBAL_v2_16_" + SHEET_ID;
  const cached = c.get(cacheKey);
  // if (cached) return JSON.parse(cached); // bypassed`;

code = code.replace(target, replacement);
fs.writeFileSync('AppScript_v2_10.gs', code);
console.log("Done");
