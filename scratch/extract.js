const fs = require('fs');
const code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const startStr = 'var DASHBOARD_HTML = ';
const startIdx = code.indexOf(startStr);
// Find the next top level function after DASHBOARD_HTML
const endIdx = code.indexOf('\\nfunction ', startIdx);

if (startIdx < 0 || endIdx < 0) {
  console.log('Could not find bounds: startIdx=', startIdx, 'endIdx=', endIdx);
  process.exit(1);
}

// Extract the expression
// Let's grab until the semicolon before the function
let expr = code.substring(startIdx + startStr.length, endIdx);
expr = expr.trim();
if (expr.endsWith(';')) expr = expr.slice(0, -1);

let finalHtml = '';
try {
  finalHtml = eval(expr);
} catch (e) {
  console.log('Eval error:', e.message);
  process.exit(1);
}

const scriptStart = finalHtml.indexOf('<script>');
const scriptEnd = finalHtml.lastIndexOf('</script>');
const clientJs = finalHtml.substring(scriptStart + 8, scriptEnd);
fs.writeFileSync('temp_client.js', clientJs);
console.log('Success, wrote temp_client.js length=', clientJs.length);
