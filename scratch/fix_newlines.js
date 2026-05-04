const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

// The corrupted section looks like this now:
// '    });\n' +\n'  }\n' +\n'  var hotByTeam = ...

const corrupted = `'    });\\n' +\\n'  }\\n' +\\n'  var hotByTeam = {KT:[], HS:[], KHO:[]};\\n' +\\n'  (d.hot||[]).forEach(function(h){\\n' +\\n'    var t = h.team || \\'KT\\';\\n' +\\n'    if(!hotByTeam[t]) hotByTeam[t]=[];\\n' +\\n'    hotByTeam[t].push(h);\\n' +\\n'  });\\n' +\\n`;

const correct = `'    });\\n' +
'  }\\n' +
'  var hotByTeam = {KT:[], HS:[], KHO:[]};\\n' +
'  (d.hot||[]).forEach(function(h){\\n' +
'    var t = h.team || \\'KT\\';\\n' +
'    if(!hotByTeam[t]) hotByTeam[t]=[];\\n' +
'    hotByTeam[t].push(h);\\n' +
'  });\\n' +`;

// Let's do a more robust replace
const targetStart = "'    });\\n' +\\n'  }\\n' +";
const startIdx = code.indexOf(targetStart);
if (startIdx !== -1) {
    // Find the end of the corrupted block (just before totalHot)
    const endTarget = "'  var totalHot =";
    const endIdx = code.indexOf(endTarget, startIdx);
    if (endIdx !== -1) {
        const newCode = code.substring(0, startIdx) + correct + "\n" + code.substring(endIdx);
        fs.writeFileSync('AppScript_v2_10.gs', newCode);
        console.log("Fixed corrupted newlines in renderOverview.");
    }
} else {
    console.log("Could not find corrupted block.");
}
