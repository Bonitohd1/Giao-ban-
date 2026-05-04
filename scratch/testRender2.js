const fs = require('fs');
const jsCode = fs.readFileSync('temp_render.js', 'utf8');

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
  const fnCode = ${JSON.stringify(jsCode + '; renderOverview(d);')};
  const fn = new Function('d', 'STATE', 'esc', '$', '$$', fnCode);
  fn(d, STATE, esc, $, $$);
  console.log("No runtime errors!");
} catch(e) {
  console.log("RUNTIME ERROR:", e.message);
  console.log(e.stack);
}
`;
fs.writeFileSync('temp_test.js', testCode);
