const fs = require('fs');
const content = fs.readFileSync('AppScript_v2_8.gs', 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let extracted = '';
while ((match = scriptRegex.exec(content)) !== null) {
  // Replace string concatenation artifacts like ' +\n'
  let cleanScript = match[1].replace(/' \+\n/g, '\n').replace(/^'/gm, '').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  extracted += cleanScript + '\n';
}
fs.writeFileSync('extracted_ui.js', extracted);
