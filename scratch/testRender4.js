const fs = require('fs');

const testCode = `
const esc = (s) => String(s || "");
const STATE = {sheetUrl: ''};
const $ = () => ({textContent: '', innerHTML: ''});
const $$ = () => [];

// EXACT MOCK from getOverview initial state
const d = {
  cards: {
    kt: { total:0, done:0, dangSua:0, baoTri:0, thanhLy:0, hong:0, cao:0, treDL:0 },
    hs: { total:0, done:0, dangXL:0, vuong:0, treDL:0, cao:0, tongGiaTri:0 },
    vt: { total:0, done:0, cao:0, treDL:0, vuong:0, dangXL:0 },
    kho: { total:0, red:0, yellow:0, green:0, requestPending:0, requestHigh:0, forecast: {l1:0,l2:0,noSolution:0,stagnantLong:0,top:[]} }
  },
  maintenance: { l1:0, l2:0, noSolution:0, top:[] },
  topKhoa: [],
  hot: [],
  updatedAt: "12:00:00",
  sheetUrl: "url",
  webAppUrl: "url"
};

try {
  global.document = { querySelector: $ };
  global.window = {};
  
  const fnCode = require('fs').readFileSync('temp_client_code.js', 'utf8') + '; renderOverview(d);';
  const fn = new Function('d', 'STATE', 'esc', '$', '$$', fnCode);
  fn(d, STATE, esc, $, $$);
  console.log("No runtime errors in renderOverview with standard 'd' object!");
} catch(e) {
  console.log("RUNTIME ERROR:", e.message);
  console.log(e.stack);
}
`;
fs.writeFileSync('temp_test.js', testCode);
