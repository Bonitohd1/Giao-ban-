const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');
const lines = code.split('\n');

// The problematic area is around line 4147-4148
// Line 4147: '    });\n' +
// Line 4148: '  var totalHot = ...

const missingCode = [
  "    });",
  "  }",
  "  var hotByTeam = {KT:[], HS:[], KHO:[]};",
  "  (d.hot||[]).forEach(function(h){",
  "    var t = h.team || 'KT';",
  "    if(!hotByTeam[t]) hotByTeam[t]=[];",
  "    hotByTeam[t].push(h);",
  "  });"
].map(l => `'${l.replace(/'/g, "\\'")}\\n' +`).join('\n');

const target = `'    });\\n' \\+\\n'  var totalHot = \\(hotByTeam\\.KT\\.length`;
const replacement = missingCode + "\n'  var totalHot = (hotByTeam.KT.length";

const newCode = code.replace(new RegExp(target), replacement);
if (newCode !== code) {
    fs.writeFileSync('AppScript_v2_10.gs', newCode);
    console.log("Successfully fixed renderOverview structure.");
} else {
    console.log("Could not find the target pattern to fix.");
}
