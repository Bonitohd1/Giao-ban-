const fs = require('fs');
let content = fs.readFileSync('AppScript_v2_10.gs', 'utf8');

content = content.replace(/'    <div class="brand">DASHBOARD GIAO BAN — PHÒNG VT-TBYT<small>Bệnh viện K — 4 tộ: Kỹ thuật \/ Hồ sơ \/ Vật tư \/ Kho · v2.10 · Maintenance & Integration<\/small><\/div>\\n' \+/, 
                        "'    <div class=\"brand\">DASHBOARD GIAO BAN — PHÒNG VT-TBYT<small>Bệnh viện K — 4 tổ: Kỹ thuật / Hồ sơ / Vật tư / Kho · v2.10 · Maintenance & Integration</small></div>\\n' +");

content = content.replace(/'    <div class="search-wrap"><input id="search" type="text" placeholder="đŸ”  Tìm máy \/ vật tư \/ hồ sơ…" autocomplete="off"><div id="search-results"><\/div><\/div>\\n' \+/,
                        "'    <div class=\"search-wrap\"><input id=\"search\" type=\"text\" placeholder=\"🔍 Tìm máy / vật tư / hồ sơ…\" autocomplete=\"off\"><div id=\"search-results\"></div></div>\\n' +");

fs.writeFileSync('AppScript_v2_10.gs', content, 'utf8');
console.log('Final UI manual fix applied.');
