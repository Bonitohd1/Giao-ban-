const fs = require('fs');
const code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const startIdx = code.indexOf("'function renderOverview(d){\\n' +");
const endIdx = code.indexOf("'function renderKT(d){\\n' +");

// Extract only the string literal lines for renderOverview
const lines = code.substring(startIdx, endIdx).split('\n');
let jsCode = '';
lines.forEach(l => {
  l = l.trim();
  if (l.startsWith("'") && l.endsWith(" +")) {
    l = l.slice(1, -3); 
  } else if (l.startsWith("'") && l.endsWith("'")) {
    l = l.slice(1, -1);
  }
  // Now l is the inner content of the string literal
  // It has literal characters `\n` which need to become real newlines
  l = l.replace(/\\n/g, '\n');
  // It has literal `\"` which need to become `"`
  l = l.replace(/\\"/g, '"');
  // It has literal `\\` which need to become `\`
  l = l.replace(/\\\\/g, '\\');
  // It has literal `\'` which need to become `'`
  l = l.replace(/\\'/g, "'");
  
  jsCode += l;
});

fs.writeFileSync('temp_client_code.js', jsCode);

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
  global.document = { querySelector: $ };
  global.window = {};
  
  const fnCode = require('fs').readFileSync('temp_client_code.js', 'utf8') + '; renderOverview(d);';
  const fn = new Function('d', 'STATE', 'esc', '$', '$$', fnCode);
  fn(d, STATE, esc, $, $$);
  console.log("No runtime errors!");
} catch(e) {
  console.log("RUNTIME ERROR:", e.message);
  console.log(e.stack);
}
`;
fs.writeFileSync('temp_test.js', testCode);
