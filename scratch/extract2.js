const fs = require('fs');
const code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

// The file has: 'function renderOverview(d){\n' + 
// We want to find the whole JS string that is sent to the client.
// The file is literally a giant string concatenation in a variable called `html` or something.
// Oh wait, in AppScript_v2_10.gs, the HTML is probably in a variable.
// Let's find where the string ends.

const lines = code.split('\n');
let jsStr = '';
let inRenderOverview = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("'function renderOverview(d){\\n' +")) {
    inRenderOverview = true;
  }
  
  if (inRenderOverview) {
    // lines look like: '    html += "</div>";\n' +
    // We want to evaluate this concatenation to see what the browser sees.
    let l = lines[i].trim();
    if (l.endsWith('+')) {
      l = l.slice(0, -1).trim();
    }
    // Now we have something like: '    html += "</div>";\n'
    // Let's use eval to get the actual string
    try {
      if (l) {
        jsStr += eval(l);
      }
    } catch(e) {
      console.log('Eval error on line ' + (i+1) + ': ' + l);
      console.log('Error:', e.message);
      process.exit(1);
    }
    
    if (l === "'}'") {
      // End of function renderOverview
      break;
    }
    // sometimes it's '}\n'
    if (l.includes("'}\\n'")) {
       break;
    }
  }
}

fs.writeFileSync('temp_client.js', jsStr);
console.log('Extracted renderOverview. Lines:', jsStr.split('\n').length);
