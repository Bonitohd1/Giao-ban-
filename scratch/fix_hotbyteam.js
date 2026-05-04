const fs = require('fs');
let code = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

const replacement = `  }\\n' +
'  // v2.7.2: Hot list — group by team (KT/HS/KHO) thay vi list phang\\n' +
'  var hotByTeam = {KT:[], HS:[], KHO:[]};\\n' +
'  (d.hot||[]).forEach(function(h){\\n' +
'    var t = h.team || "KT";\\n' +
'    if(!hotByTeam[t]) hotByTeam[t]=[];\\n' +
'    hotByTeam[t].push(h);\\n' +
'  });\\n' +
'  var totalHot = (hotByTeam.KT.length+hotByTeam.HS.length+hotByTeam.KHO.length);\\n' +`;

code = code.replace(/  \}\\n' \+\\n'  var totalHot = \(hotByTeam\.KT\.length\+hotByTeam\.HS\.length\+hotByTeam\.KHO\.length\);\\n' \+/, replacement);
fs.writeFileSync('AppScript_v2_10.gs', code);
console.log('Fixed hotByTeam loop.');
