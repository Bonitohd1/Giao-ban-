const fs = require('fs');
const code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const startIdx = code.indexOf("'function renderOverview(d){\\n' +");
const endIdx = code.indexOf("'function renderKT(d){\\n' +");

if (startIdx < 0 || endIdx < 0) {
  console.log('Not found');
  process.exit();
}

// Extract only the string literal lines for renderOverview
const lines = code.substring(startIdx, endIdx).split('\n');
let jsCode = '';
lines.forEach(l => {
  l = l.trim();
  if (l.startsWith("'") && l.endsWith(" +")) {
    l = l.slice(1, -3); // remove ' at start and ' + at end
    jsCode += l + '\n';
  } else if (l.startsWith("'") && l.endsWith("'")) {
    l = l.slice(1, -1);
    jsCode += l + '\n';
  }
});

// Unescape
jsCode = jsCode.replace(/\\\\/g, '\\').replace(/\\"/g, '"');

fs.writeFileSync('temp_render.js', jsCode);
console.log('Extracted to temp_render.js');

const testCode = `
const esc = (s) => s || "";
const STATE = {sheetUrl: ''};
const $ = () => ({textContent: '', innerHTML: ''});
const $$ = () => [];
const d = {
  sheetUrl: 'x', updatedAt: 'x', 
  cards: { kt:{}, hoSo:{}, vt:{}, kho:{} },
  topKhoa: [],
  hot: [],
  forecast: { top: [], critical: 0, warning: 0 },
  maintenance: { top: [], overdue: 0, warning: 0 }
};

let html = "";
try {
  // Mock document and window and other things
  global.document = { querySelector: $ };
  global.window = {};
  
  // Create an IIFE to run it safely
  const fn = new Function('d', 'STATE', 'esc', '$', '$$', \`\${jsCode}; renderOverview(d);\`);
  fn(d, STATE, esc, $, $$);
  console.log("No runtime errors!");
} catch(e) {
  console.log("RUNTIME ERROR:", e.message);
  console.log(e.stack);
}
`;
fs.writeFileSync('temp_test.js', testCode);
