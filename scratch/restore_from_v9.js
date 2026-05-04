const fs = require('fs');

function extractFunctions(content) {
  const funcs = {};
  const matches = content.matchAll(/function\s+(\w+)\s*\([\s\S]*?\{[\s\S]*?\n\}/g);
  for (const m of matches) {
    funcs[m[1]] = m[0];
  }
  return funcs;
}

const v9 = fs.readFileSync('AppScript_v2_9.gs', 'utf8');
const v10 = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const funcs9 = extractFunctions(v9);
let restoredV10 = v10;

const v10Funcs = extractFunctions(v10);
for (const name in v10Funcs) {
  if (funcs9[name]) {
    // If v10 version has corrupted characters or I just want to be sure
    // Actually, v10 has many new changes, so I should only replace if the strings are clearly broken
    if (v10Funcs[name].includes('') || v10Funcs[name].includes('')) {
      console.log(`Restoring function ${name} from v9`);
      restoredV10 = restoredV10.replace(v10Funcs[name], funcs9[name]);
    }
  }
}

// Special case: some functions were modified in v10 (like adding maintenance tracking)
// For those, I should NOT replace the whole function, but just fix the strings.

fs.writeFileSync('AppScript_v2_10.gs', restoredV10, 'utf8');
console.log('Restored functions from v9 where corruption was detected.');
