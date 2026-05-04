const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const target1 = "'    });\\n' +";
const target2 = "'  var totalHot = (hotByTeam.KT.length+hotByTeam.HS.length+hotByTeam.KHO.length);\\n' +";

const idx1 = code.indexOf(target1);
const idx2 = code.indexOf(target2);

if (idx1 !== -1 && idx2 !== -1 && idx1 < idx2) {
    const part1 = code.substring(0, idx1 + target1.length);
    const part2 = code.substring(idx2);
    
    const insertion = [
      "  }",
      "  var hotByTeam = {KT:[], HS:[], KHO:[]};",
      "  (d.hot||[]).forEach(function(h){",
      "    var t = h.team || 'KT';",
      "    if(!hotByTeam[t]) hotByTeam[t]=[];",
      "    hotByTeam[t].push(h);",
      "  });"
    ].map(l => `\\n'${l.replace(/'/g, "\\'")}\\n' +`).join('');

    const newCode = part1 + insertion + "\\n" + part2;
    fs.writeFileSync('AppScript_v2_10.gs', newCode);
    console.log("Successfully fixed renderOverview structure using substring.");
} else {
    console.log("Could not find exact targets:", {idx1, idx2});
}
