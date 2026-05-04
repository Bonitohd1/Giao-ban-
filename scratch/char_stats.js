const fs = require('fs');
const content = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const chars = {};
for (let i = 0; i < content.length; i++) {
  const code = content.charCodeAt(i);
  if (code > 127) {
    const c = content[i];
    chars[c] = (chars[c] || 0) + 1;
  }
}

const sorted = Object.keys(chars).sort((a, b) => b.localeCompare(a));
sorted.forEach(c => {
  console.log(`${c} (\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}): ${chars[c]}`);
});
